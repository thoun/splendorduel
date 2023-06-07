<?php

if (!function_exists('str_starts_with')) {
    function str_starts_with($haystack, $needle) {
        return (string)$needle !== '' && strncmp($haystack, $needle, strlen($needle)) === 0;
    }
}

trait ActionTrait {

    //////////////////////////////////////////////////////////////////////////////
    //////////// Player actions
    //////////// 
    
    /*
        Each time a player is doing some game action, one of the methods below is called.
        (note: each method below must match an input method in nicodemus.action.php)
    */

    public function takeTokens(array $ids) {
        self::checkAction('takeTokens');

        $playerId = intval($this->getActivePlayerId());

        $board = $this->getBoard();
        $tokens = array_values(array_filter($board, fn($token) => in_array($token->id, $ids)));
        if (count($tokens) != count($ids)) {
            throw new BgaUserException("You must take tokens from the board");
        }

        $statedId = intval($this->gamestate->state_id());

        if ($statedId == ST_PLAYER_USE_PRIVILEGE) {
            $this->checkUsePrivilege($playerId, $tokens);
            $this->spendPrivileges($playerId, count($tokens));
        } else if ($statedId == ST_PLAYER_PLAY_ACTION) {
            $this->checkPlayTakeGems($tokens);
        }

        $this->applyTakeTokens($playerId, $tokens);

        if ($statedId == ST_PLAYER_USE_PRIVILEGE) {
            $this->gamestate->nextState('next');
        } else if ($statedId == ST_PLAYER_PLAY_ACTION) {
            $tokensByColor = [];
            foreach ([PEARL,1,2,3,4,5] as $color) {
                $tokensByColor[$color] = array_values(array_filter($tokens, fn($token) => $token->type == 1 ? $color == -1 : $token->color == $color));
            }

            if (count($tokensByColor[PEARL]) >= 2) {
                $message = clienttranslate('${player_name} took 2 Pearl gems and allow ${player_name2} to get a privilege.');
                $this->givePrivilegeToOpponent($playerId, $message);
            } else if ($this->array_some($tokensByColor, fn($colorTokens) => count($colorTokens) >= 3)) {
                $message = clienttranslate('${player_name} took 3 gems of the same color and allow ${player_name2} to get a privilege.');
                $this->givePrivilegeToOpponent($playerId, $message);
            }

            if (count($tokens) == 1 && $tokens[0]->type == 1) {
                $this->gamestate->nextState('reserveCard');
            } else {
                $this->applyEndTurn($playerId);
            }
        }
    }
    
    public function skip() {
        self::checkAction('skip');

        $this->gamestate->nextState('next');
    }

    public function skipBoth() {
        self::checkAction('skipBoth');

        $this->gamestate->nextState('skipBoth');
    }

    public function refillBoard() {
        self::checkAction('skipBoth');

        $playerId = intval($this->getActivePlayerId());

        $message = clienttranslate('${player_name} chooses to replenish the board and allow ${player_name2} to get a privilege.');
        $this->givePrivilegeToOpponent($playerId, $message);
        $this->game->refillBoard();

        $this->gamestate->nextState('next');
    } 

    public function reserveCard(int $id) {
        self::checkAction('reserveCard');

        $playerId = intval($this->getActivePlayerId());

        $card = $this->getCardFromDb($this->cards->getCard($id));
        if (!str_starts_with($card->location, 'deck') && !str_starts_with($card->location, 'table')) {
            throw new BgaUserException("You must reserve a card from the table or from the decks");
        }

        $level = $card->level;
        $fromDeck = str_starts_with($card->location, 'deck');

        $message = $fromDeck ?
            clienttranslate('${player_name} reserves a level ${card_level} card from the deck') :
            clienttranslate('${player_name} reserves a visible level ${card_level} card');

        $newCard = $fromDeck ? null : $this->getCardFromDb($this->cards->pickCardForLocation('deck'.$level, 'table'.$level, $card->locationArg));

        $this->cards->moveCard($id, 'reserved', $playerId);
        
        self::notifyAllPlayers('reserveCard', $message, [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'card' => $card,
            'fromDeck' => $fromDeck,
            'newCard' => $newCard,
            'cardDeckCount' => intval($this->cards->countCardInLocation('deck'.$level)),
            'cardDeckTop' => Card::onlyId($this->getCardFromDb($this->cards->getCardOnTop('deck'.$level))),
            'level' => $level,
            'card_level' => $level, // for logs
        ]);

        $this->applyEndTurn($playerId);
    }

    public function buyCard(int $id) {
        self::checkAction('buyCard');

        $playerId = intval($this->getActivePlayerId());

        $card = $this->getCardFromDb($this->cards->getCard($id));
        $fromReserved = str_starts_with($card->location, 'reserved');
        if ((!$fromReserved && !str_starts_with($card->location, 'table')) || ($fromReserved && $card->locationArg != $playerId)) {
            throw new BgaUserException("You must buy a card from the table or from your reserve");
        }

        $level = $card->level;

        $message = $fromReserved ?
            clienttranslate('${player_name} buys a level ${card_level} card from the reserved cards') :
            clienttranslate('${player_name} buys a visible level ${card_level} card');

        $newCard = $fromReserved ? null : $this->getCardFromDb($this->cards->pickCardForLocation('deck'.$level, 'table'.$level, $card->locationArg));

        $location = 'player'.$playerId.'-'.$card->color;
        $locationArg = intval($this->cards->countCardInLocation($location));
        $this->cards->moveCard($card->id, $location, $locationArg);
        $card->location = $location;
        $card->locationArg = $locationArg;
        
        self::notifyAllPlayers('buyCard', $message, [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'card' => $card,
            'fromReserved' => $fromReserved,
            'newCard' => $newCard,
            'cardDeckCount' => intval($this->cards->countCardInLocation('deck'.$level)),
            'cardDeckTop' => Card::onlyId($this->getCardFromDb($this->cards->getCardOnTop('deck'.$level))),
            'level' => $level,
            'card_level' => $level, // for logs
        ]);

        // TODO redirect to crown or power. Can it be both ?
        $this->applyEndTurn($playerId);
    }
}
