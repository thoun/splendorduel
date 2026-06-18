<?php

use Bga\GameFramework\Actions\Types\IntArrayParam;
use Bga\GameFramework\UserException;
use Bga\GameFrameworkPrototype\Helpers\Arrays;

trait ActionTrait {

    //////////////////////////////////////////////////////////////////////////////
    //////////// Player actions
    //////////// 
    
    /*
        Each time a player is doing some game action, one of the methods below is called.
        (note: each method below must match an input method in nicodemus.action.php)
    */

    public function actTakeTokens(#[IntArrayParam] array $ids) {
        $playerId = intval($this->getActivePlayerId());

        $board = $this->getBoard();
        $tokens = array_values(array_filter($board, fn($token) => in_array($token->id, $ids)));
        if (count($tokens) != count($ids)) {
            throw new UserException("You must take tokens from the board");
        }

        $statedId = $this->gamestate->getCurrentMainStateId();

        if ($statedId == ST_PLAYER_USE_PRIVILEGE) {
            $canTakeExtra = $this->counterfeiterCards->playerHasCounterfeiterCard($playerId, 13) && !$this->globals->get(COUNTERFEITER13_USED, false);
            $privileges = $this->getPlayerPrivileges($playerId);
            $useExtra = $canTakeExtra && count($tokens) >= 2;

            $this->checkUsePrivilege($tokens, $privileges + ($canTakeExtra ? 1 : 0));
            if ($useExtra) {
                $this->globals->set(COUNTERFEITER13_USED, true);
                $this->spendPrivileges($playerId, count($tokens) - 1);
            } else {
                $this->spendPrivileges($playerId, count($tokens));
            }

            $this->incStat(count($tokens), 'tokensWithPrivileges');
            $this->incStat(count($tokens), 'tokensWithPrivileges', $playerId);
        } else if ($statedId == ST_PLAYER_PLAY_ACTION) {
            $this->checkPlayTakeGems($playerId, $tokens);
        }

        $this->applyTakeTokens($playerId, $tokens);

        if ($statedId == ST_PLAYER_USE_PRIVILEGE) {
            $this->gamestate->nextState('next');
        } else if ($statedId == ST_PLAYER_PLAY_ACTION) {
            $tokensByColor = [];
            foreach ([PEARL,1,2,3,4,5,6] as $color) {
                $tokensByColor[$color] = array_values(array_filter($tokens, fn($token) => $token->type == 1 ? $color == -1 : $token->color == $color));
            }

            if (count($tokensByColor[PEARL]) >= 2) {
                $message = clienttranslate('${player_name2} took 2 Pearls and allow ${player_name} to get a privilege.');
                $this->takePrivilege($this->getOpponentId($playerId), $message);
                
                $this->incStat(1, 'givenPrivileges2pearls');
                $this->incStat(1, 'givenPrivileges2pearls', $playerId);
            } else if ($this->array_some($tokensByColor, fn($colorTokens) => count($colorTokens) >= 3)) {
                $message = clienttranslate('${player_name2} took 3 gems of the same color and allow ${player_name} to get a privilege.');
                $this->takePrivilege($this->getOpponentId($playerId), $message);
                
                $this->incStat(1, 'givenPrivileges3equal');
                $this->incStat(1, 'givenPrivileges3equal', $playerId);
            }

            if (count($tokens) == 1 && $tokens[0]->type == 1) {
                $this->gamestate->nextState('reserveCard');
            } else {
                $this->incStat(1, 'takeTokens'.count($tokens));
                $this->incStat(1, 'takeTokens'.count($tokens), $playerId);

                $this->applyEndTurn($playerId);
            }
        } else if ($statedId == ST_PLAYER_TAKE_BOARD_TOKEN) {
            $id = intval($this->getGameStateValue(PLAYED_CARD));
            $card = $id > 0 ? $this->getCardFromDb($this->cards->getCard($id)) : null;
            
            $this->incStat(1, 'ability3');
            $this->incStat(1, 'ability3', $playerId);

            $this->applyEndTurn($playerId, $card, true);
        }
    }
    
    public function actEndGameAntiPlaying() {
        $playerId = intval($this->getActivePlayerId());

        if ($this->getPlayerAntiPlayingTurns($this->getOpponentId($playerId)) < 3) {
            throw new UserException("Your opponent isn't in the anti-playing situation.");
        }

        $this->DbQuery("UPDATE player SET `player_score` = 1 WHERE player_id = $playerId");
        
        self::notifyAllPlayers('log', clienttranslate('${player_name} wins by ending the game immediatly due to opponent anti-playing'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerNameById($playerId),
        ]);

        $this->incStat(1, 'antiPlayingEndGame');

        $this->gamestate->nextState('endGameAntiPlaying');
    }
    
    public function actCancelUsePrivilege() {
        $this->gamestate->nextState('next');
    }

    public function actUsePrivilege() {
        $this->gamestate->nextState('usePrivilege');
    } 

    public function actRefillBoard() {
        $playerId = intval($this->getActivePlayerId());

        if (intval($this->tokens->countCardInLocation('bag')) == 0) {
            throw new UserException("Bag is empty");
        }

        $message = clienttranslate('${player_name2} chooses to replenish the board and allow ${player_name} to get a privilege.');
        $this->takePrivilege($this->getOpponentId($playerId), $message);
        $this->refillBag();
        $this->setGameStateValue(PLAYER_REFILLED, 1);

        $this->incStat(1, 'replenish');
        $this->incStat(1, 'replenish', $playerId);

        $this->gamestate->nextState('stay');
    } 

    public function actReserveCard(int $id) {
        $playerId = intval($this->getActivePlayerId());

        $card = $this->getCardFromDb($this->cards->getCard($id));
        $this->applyReserveCard($playerId, $card);

        $this->applyEndTurn($playerId);
    }

    public function actReserveCards(#[IntArrayParam(min: 1, max: 2)] array $ids) {
        $playerId = intval($this->getActivePlayerId());

        foreach ($ids as $id) {
            $card = $this->getCardFromDb($this->cards->getCard($id));
            $this->applyReserveCard($playerId, $card);
        }

        $this->applyEndTurn($playerId);
    }

    public function applyReserveCard(int $playerId, $card) {
        if (!str_starts_with($card->location, 'deck') && !str_starts_with($card->location, 'table')) {
            throw new UserException("You must reserve a card from the table or from the decks");
        }

        $level = $card->level;
        $fromDeck = str_starts_with($card->location, 'deck');

        $message = $fromDeck ?
            clienttranslate('${player_name} reserves a level ${card_level} card from the deck') :
            clienttranslate('${player_name} reserves <card>a visible level ${card_level} card</card>');

        $this->cards->moveCard($card->id, 'reserved', $playerId);
        
        self::notifyAllPlayers('reserveCard', $message, [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerNameById($playerId),
            'card' => $card,
            'fromDeck' => $fromDeck,
            'level' => $level,
            'cardDeckCount' => intval($this->cards->countCardInLocation('deck'.$level)),
            'cardDeckTop' => Card::onlyId($this->getCardFromDb($this->cards->getCardOnTop('deck'.$level))),
            'card_level' => $level, // for logs
            'preserve' => ['card'],
        ]);

        $this->incStat(1, 'reserveCard'.$level);
        $this->incStat(1, 'reserveCard'.$level, $playerId);
    }

    public function actBuyCard(int $id, #[IntArrayParam] array $tokensIds) {
        $playerId = intval($this->getActivePlayerId());

        $card = $this->getCardFromDb($this->cards->getCard($id));
        $fromReserved = str_starts_with($card->location, 'reserved');
        if ((!$fromReserved && !str_starts_with($card->location, 'table')) || ($fromReserved && $card->locationArg != $playerId)) {
            throw new UserException("You must purchase a card from the table or from your reserve");
        }

        $tokens = $this->getTokensFromDb($this->tokens->getCards($tokensIds));
        if ($this->array_some($tokens, fn($token) => $token->location != 'player' && $token->locationArg != $playerId)) {
            throw new UserException("You must use your own tokens to purchase the card");
        }

        $playerCards = $this->getCardsByLocation('player'.$playerId.'-%');
        $counterfeiterCardConversions = $this->counterfeiterCards->getConversions($playerId);
        $tokensByColor = [];
        foreach ([-1, 0,1,2,3,4,5,6] as $color) {
            $tokensByColor[$color] = array_values(array_filter($tokens, fn($token) => $token->type == 1 ? $color == -1 : $token->color == $color));
        }
        if (count($this->canBuyCard($card, $tokensByColor, $playerCards, $counterfeiterCardConversions)) === 0) {
            throw new UserException("You can't purchase this card with the selected tokens");
        }

        $level = $card->level;        

        $message = null;
        
        if ($fromReserved) {
            $message = count($tokens) > 0 ? 
                clienttranslate('${player_name} purchases a level ${card_level} card from the reserved cards with ${spent_tokens}') :
                clienttranslate('${player_name} purchases a level ${card_level} card from the reserved cards for free');
        } else {
            $message = count($tokens) > 0 ? 
                clienttranslate('${player_name} purchases a visible level ${card_level} card with ${spent_tokens}') :
                clienttranslate('${player_name} purchases a visible level ${card_level} card for free');
        }

        $location = 'player'.$playerId.'-'.$card->color;
        $locationArg = intval($this->cards->countCardInLocation($location));
        $this->cards->moveCard($card->id, $location, $locationArg);
        $card->location = $location;
        $card->locationArg = $locationArg;

        $this->tokens->moveCards($tokensIds, 'bag');

        $this->DbQuery("UPDATE player SET player_anti_playing_turns = 0 WHERE player_id = $playerId");
        
        self::notifyAllPlayers('buyCard', $message, [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerNameById($playerId),
            'card' => $card,
            'fromReserved' => $fromReserved,
            'tokens' => $tokens,
            'card_level' => $level, // for logs
            'spent_tokens' => $this->getTokensNames($tokens), // for logs
            'preserve' => ['tokens'],
            'i18n' => ['spent_tokens'],
        ]);

        $this->incStat(1, 'purchaseCard'.$level);
        $this->incStat(1, 'purchaseCard'.$level, $playerId);

        if ($card->crowns > 0) {
            $this->incStat($card->crowns, 'crowns', $playerId);
        }

        $this->applyEndTurn($playerId, $card);
    }

    public function actBuyCounterfeiterCard(int $id, #[IntArrayParam] array $tokensIds) {
        $playerId = intval($this->getActivePlayerId());

        $card = $this->counterfeiterCards->getItemById($id);
        if ($card->location !== 'table') {
            throw new UserException("You must purchase a Counterfeiter card from the table ");
        }

        $tokens = $this->getTokensFromDb($this->tokens->getCards($tokensIds));
        if ($this->array_some($tokens, fn($token) => $token->location != 'player' && $token->locationArg != $playerId)) {
            throw new UserException("You must use your own tokens to purchase the card");
        }

        $playerCards = $this->getCardsByLocation('player'.$playerId.'-%');
        $counterfeiterCardConversions = $this->counterfeiterCards->getConversions($playerId);
        $tokensByColor = [];
        foreach ([-1, 0,1,2,3,4,5,6] as $color) {
            $tokensByColor[$color] = array_values(array_filter($tokens, fn($token) => $token->type == 1 ? $color == -1 : $token->color == $color));
        }
        if (count($this->canBuyCard($card, $tokensByColor, $playerCards, $counterfeiterCardConversions)) === 0) {
            throw new UserException("You can't purchase this card with the selected tokens");
        }      

        $message = count($tokens) > 0 ? 
                clienttranslate('${player_name} purchases a Counterfeiter card with ${spent_tokens}') :
                clienttranslate('${player_name} purchases a Counterfeiter card for free');

        $location = 'player';
        $locationArg = $playerId;
        $card->location = $location;
        $card->locationArg = $locationArg;
        $this->counterfeiterCards->moveItem($card, $location, $locationArg);

        $this->tokens->moveCards($tokensIds, 'bag');

        $this->DbQuery("UPDATE player SET player_anti_playing_turns = 0 WHERE player_id = $playerId");
        
        self::notifyAllPlayers('buyCounterfeiterCard', $message, [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerNameById($playerId),
            'card' => $card,
            'tokens' => $tokens,
            'spent_tokens' => $this->getTokensNames($tokens), // for logs
            'preserve' => ['tokens'],
            'i18n' => ['spent_tokens'],
        ]);

        // TODO $this->incStat(1, 'purchaseCounterfeiterCard');
        // TODO $this->incStat(1, 'purchaseCounterfeiterCard', $playerId);

        if ($card->crowns > 0) {
            $this->incStat($card->crowns, 'crowns', $playerId);
        }

        $this->applyEndTurn($playerId, $card, true);
    }

    public function actTakeCounterfeiterCard(int $id) {
        $playerId = intval($this->getActivePlayerId());

        $card = $this->counterfeiterCards->getItemById($id);
        if ($card->location != 'table') {
            throw new UserException("You must take a royal card from the table");
        }

        $location = 'player';
        $locationArg = $playerId;
        $card->location = $location;
        $card->locationArg = $locationArg;
        $this->counterfeiterCards->moveItem($card, $location, $locationArg);
        
        self::notifyAllPlayers('takeCounterfeiterCard', clienttranslate('${player_name} takes a Counterfeiter card'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerNameById($playerId),
            'card' => $card,
        ]);

        if ($card->crowns > 0) {
            $this->incStat($card->crowns, 'crowns', $playerId);
        }

        $this->applyEndTurn($playerId, $card);
    }


    public function actTakeRoyalCard(int $id) {
        $playerId = intval($this->getActivePlayerId());

        $card = $this->getRoyalCardFromDb($this->royalCards->getCard($id));
        if ($card->location != 'deck') {
            throw new UserException("You must take a royal card from the table");
        }

        $this->royalCards->moveCard($card->id, 'player', $playerId);

        $fromCounterfeiterPower = $this->globals->get(ROYAL_CARDS_WITH_COUNTERFEITER_POWER, 0) > 0;
        
        self::notifyAllPlayers('takeRoyalCard', clienttranslate('${player_name} takes a royal card'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerNameById($playerId),
            'card' => $card,
        ]);

        $this->incStat(1, 'royalCards', $playerId);

        if ($fromCounterfeiterPower) {
            $newCard = $this->getRoyalCardFromDb($this->royalCards->pickCardForLocation('box', 'deck'));
        
            self::notifyAllPlayers('newTableRoyalCard', '', [
                'newCard' => $newCard,
            ]);
        }

        $this->applyEndTurn($playerId, $card, false);
    }

    public function actPlaceJoker(int $color) {
        $playerId = intval($this->getActivePlayerId());

        $args = $this->argPlaceJoker();
        if (!in_array($color, $args['colors'])) {
            throw new UserException("Invalid column");
        }
        
        $id = intval($this->getGameStateValue(PLAYED_CARD));
        $card = $this->getCardFromDb($this->cards->getCard($id));

        $location = 'player'.$playerId.'-'.$color;
        $locationArg = intval($this->cards->countCardInLocation($location));
        $this->cards->moveCard($card->id, $location, $locationArg);
        $card->location = $location;
        $card->locationArg = $locationArg;
        
        self::notifyAllPlayers('buyCard', clienttranslate('${player_name} places the <ICON_MULTI> card on ${color_name} column'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerNameById($playerId),
            'card' => $card,
            'fromReserved' => false,
            'color_name' => $this->getColorName($color), // for logs
        ]);
            
        $this->incStat(1, 'ability2');
        $this->incStat(1, 'ability2', $playerId);

        $this->applyEndTurn($playerId, $card, true);
    }

    public function actUseCounterfeiterCardPower(int $power) {
        $playerId = intval($this->getActivePlayerId());
        $playerTokens = $this->getPlayerTokensByColor($playerId);
        $glasswareTokens = array_merge($playerTokens[GLASSWARE], $playerTokens[GOLD]); // first take glassware tokens, then pay with gold if needed

        switch ($power) {
            case 9:
                $playerRoyalCardCount = count($this->getRoyalCardsByLocation('player', $playerId));
                $tokenCost = 1 + $playerRoyalCardCount;

                $tokens = array_slice($glasswareTokens, 0, $tokenCost);
                $this->tokens->moveCards(Arrays::map($tokens, fn($token) => $token->id), 'bag');
                self::notifyAllPlayers('discardTokens', clienttranslate('${player_name} spends ${spent_tokens} to take a Royal card'), [
                    'playerId' => $playerId,
                    'player_name' => $this->getPlayerNameById($playerId),
                    'number' => $tokenCost,
                    'tokens' => $tokens,
                    'spent_tokens' => $this->getTokensNames($tokens), // for logs
                    'preserve' => ['tokens'],
                    'i18n' => ['spent_tokens'],
                ]);
                $this->globals->set(ROYAL_CARDS_WITH_COUNTERFEITER_POWER, 1);
                $this->gamestate->jumpToState(ST_PLAYER_TAKE_ROYAL_CARD);
                return;
            case 10:
                $this->spendPrivileges($playerId, 1);
                $tokens = array_slice($glasswareTokens, 0, 1);
                $this->tokens->moveCards(Arrays::map($tokens, fn($token) => $token->id), 'bag');
                self::notifyAllPlayers('discardTokens', clienttranslate('${player_name} spends ${spent_tokens} and a Privilege to play a new turn'), [
                    'playerId' => $playerId,
                    'player_name' => $this->getPlayerNameById($playerId),
                    'tokens' => $tokens,
                    'spent_tokens' => $this->getTokensNames($tokens), // for logs
                    'preserve' => ['tokens'],
                    'i18n' => ['spent_tokens'],
                ]);
                $this->setGameStateValue(PLAY_AGAIN, 1);
                break;
            case 17:
                $tokens = array_slice($glasswareTokens, 0, 2);
                $this->tokens->moveCards(Arrays::map($tokens, fn($token) => $token->id), 'bag');
                self::notifyAllPlayers('discardTokens', clienttranslate('${player_name} spends ${spent_tokens} to reserve a card from the deck'), [
                    'playerId' => $playerId,
                    'player_name' => $this->getPlayerNameById($playerId),
                    'tokens' => $tokens,
                    'spent_tokens' => $this->getTokensNames($tokens), // for logs
                    'preserve' => ['tokens'],
                    'i18n' => ['spent_tokens'],
                ]);
                $this->gamestate->jumpToState(ST_PLAYER_RESERVE_FROM_DECK_CHOOSE_DECK);
                return;
            default:
                throw new UserException("Unknown Counterfeiter card power");
        }
        $this->gamestate->nextState('next');
    }

    public function actPassCounterfeiterCardPower() {
        $this->gamestate->nextState('next');
    }

    public function actDiscardTokens(#[IntArrayParam] array $ids) {
        $playerId = intval($this->getActivePlayerId());

        $playerTokens = $this->getPlayerTokens($playerId);
        $tokens = array_values(array_filter($playerTokens, fn($token) => in_array($token->id, $ids)));
        if (count($tokens) != count($ids)) {
            throw new UserException("You must discard your own tokens");
        }

        $number = $this->getPlayerTokenCountInLimit($playerId) - 10;
        if (count($tokens) != $number) {
            throw new UserException("You must discard $number tokens");
        }

        $this->tokens->moveCards($ids, 'bag');
        
        self::notifyAllPlayers('discardTokens', clienttranslate('${player_name} discards ${discarded_tokens} (10 tokens limit)'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerNameById($playerId),
            'tokens' => $tokens,
            'discarded_tokens' => $this->getTokensNames($tokens), // for logs
            'preserve' => ['tokens'],
            'i18n' => ['discarded_tokens'],
        ]);
            
        $this->incStat(count($tokens), 'discardedTokens');
        $this->incStat(count($tokens), 'discardedTokens', $playerId);

        $this->gamestate->nextState('next');
    }

    public function actTakeOpponentToken(int $id) {
        $playerId = intval($this->getActivePlayerId());
        $opponentId = $this->getOpponentId($playerId);

        $playerTokens = $this->getPlayerTokens($opponentId);
        $token = $this->array_find($playerTokens, fn($token) => $token->id == $id);
        if ($token == null) {
            throw new UserException("You must take a token from your opponent");
        }

        $this->applyTakeTokens($playerId, [$token]);

        $this->incStat(1, 'ability5');
        $this->incStat(1, 'ability5', $playerId);

        $id = intval($this->getGameStateValue(PLAYED_CARD));
        $card = $id > 0 ? $this->getCardFromDb($this->cards->getCard($id)) : null;
        $this->applyEndTurn($playerId, $card, true);
    }

    public function actReserveFromDeckChooseDeck(int $id) {
        $card = $this->getCardFromDb($this->cards->getCard($id));

        $this->globals->set(RESERVE_FROM_DECK, $card->level);

        $this->gamestate->nextState('next');
    }

    public function actReserveFromDeckChooseCard(int $id) {
        $playerId = intval($this->getActivePlayerId());
        $card = $this->getCardFromDb($this->cards->getCard($id));
        $level = $this->globals->get(RESERVE_FROM_DECK);

        $this->applyReserveCard($playerId, $card);

        $remainingCards = $this->getCardsFromDb($this->cards->getCardsOnTop(2, 'deck'.$level));

        $this->DbQuery("UPDATE `card` set `card_location_arg` = `card_location_arg` + 2 WHERE `card_location` = 'deck$level'");
        foreach ($remainingCards as $index => $remainingCard) {
            $this->DbQuery("UPDATE `card` set `card_location_arg` = $index WHERE `card_id` = ".$remainingCard->id);
        }

        $this->gamestate->nextState('next');
    }
}
