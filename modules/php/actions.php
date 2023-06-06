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

        preg_match('/\d+/', $card->location, $matches);
        $level = intval($matches[0]);
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
}
