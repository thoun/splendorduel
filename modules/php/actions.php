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
        $count = count($ids);

        if ($this->getPlayerPrivileges($playerId) < $count) {
            throw new BgaUserException("Not enough privileges");
        }

        $board = $this->getBoard();
        $tokens = array_values(array_filter($board, fn($token) => in_array($token->id, $ids)));
        if (count($tokens) != $count) {
            throw new BgaUserException("You must take tokens from the board");
        }

        if ($this->array_some($tokens, fn($token) => $token->id == 1)) {
            throw new BgaUserException("You can't take gold tokens this way");
        }

        $this->applyTakeTokens($playerId, $tokens);
        $this->spendPrivileges($playerId, $count);

        $this->gamestate->nextState('next');
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

    public function goTrade() {
        self::checkAction('goTrade');

        $this->gamestate->nextState('trade');
    }

    public function playCard(int $id) {
        self::checkAction('playCard');

        if (boolval($this->getGameStateValue(RECRUIT_DONE))) {
            throw new BgaUserException("Invalid action");
        }

        $playerId = intval($this->getActivePlayerId());
            

        $hand = $this->getCardsByLocation('hand', $playerId);
        $card = $this->array_find($hand, fn($c) => $c->id == $id);

        if ($card == null || $card->location != 'hand' || $card->locationArg != $playerId) {
            throw new BgaUserException("You can't play this card");
        }

        $this->cards->moveCard($card->id, 'played'.$playerId.'-'.$card->color, intval($this->tokens->countCardInLocation('played'.$playerId.'-'.$card->color)));

        $cardsOfColor = $this->getCardsByLocation('played'.$playerId.'-'.$card->color);
        $gains = array_map(fn($card) => $card->gain, $cardsOfColor);
        $groupGains = $this->groupGains($gains);
        $effectiveGains = $this->gainResources($playerId, $groupGains, 'recruit');

        self::notifyAllPlayers('playCard', clienttranslate('${player_name} plays a ${card_color} ${card_type} card from their hand and gains ${gains}'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'card' => $card,
            'effectiveGains' => $effectiveGains,
            'gains' => $effectiveGains, // for logs
            'card_type' => $this->getGainName($card->gain), // for logs
            'card_color' => $this->getColorName($card->color), // for logs
        ]);

        $this->setGameStateValue(PLAYED_CARD_COLOR, $card->color);

        $argChooseNewCard = $this->argChooseNewCard();

        $this->incStat(1, 'playedCards');
        $this->incStat(1, 'playedCards', $playerId);

        $allGains = array_reduce($effectiveGains, fn($a, $b) => $a + $b, 0);
        $this->incStat($allGains, 'assetsCollectedByPlayedCards');
        $this->incStat($allGains, 'assetsCollectedByPlayedCards', $playerId);
        foreach ($effectiveGains as $type => $count) {
            if ($count > 0) {
                $this->incStat($count, 'assetsCollectedByPlayedCards'.$type);
                $this->incStat($count, 'assetsCollectedByPlayedCards'.$type, $playerId);
            }
        }

        $this->gamestate->nextState('chooseNewCard');
    }

    public function chooseNewCard(int $id) {
        self::checkAction('chooseNewCard');

        $playerId = intval($this->getActivePlayerId());

        $args = $this->argChooseNewCard();
        $card = $this->array_find($args['centerCards'], fn($card) => $card->id == $id);

        if ($card == null || $card->location != 'slot') {
            throw new BgaUserException("You can't play this card");
        }
        $slotColor = $card->locationArg;

        if ($slotColor != $args['freeColor'] && !$args['allFree']) {
            if ($args['recruits'] < 1) {
                throw new BgaUserException("Not enough recruits");
            } else {
                $this->incPlayerRecruit($playerId, -1, clienttranslate('${player_name} pays a recruit to choose the new card'), []);
        
                $this->incStat(1, 'recruitsUsedToChooseCard');
                $this->incStat(1, 'recruitsUsedToChooseCard', $playerId);
            }
        }
        
        $this->cards->moveCard($card->id, 'hand', $playerId);

        self::notifyAllPlayers('takeCard', clienttranslate('${player_name} takes the ${card_color} ${card_type} card from the table (${color} column)'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'card' => $card,
            'color' => $this->getColorName($slotColor), // for logs
            'card_type' => $this->getGainName($card->gain), // for logs
            'card_color' => $this->getColorName($card->color), // for logs
        ]);

        if ($this->getAvailableDeckCards() >= 1) {
            $this->endOfRecruit($playerId, $slotColor);
        } else {
            $this->setGlobalVariable(REMAINING_CARDS_TO_TAKE, [
                'playerId' => $playerId,
                'slotColor' => $slotColor,
                'phase' => 'recruit',
                'remaining' => 1,
            ]);
            $this->gamestate->nextState('discardCardsForDeck');
        }
    }

    public function endOfRecruit(int $playerId, int $slotColor) {
        $newTableCard = $this->getCardFromDb($this->cards->pickCardForLocation('deck', 'slot', $slotColor));
        $newTableCard->location = 'slot';
        $newTableCard->locationArg = $slotColor;

        self::notifyAllPlayers('newTableCard', '', [
            'card' => $newTableCard,
            'cardDeckTop' => Card::onlyId($this->getCardFromDb($this->cards->getCardOnTop('deck'))),
            'cardDeckCount' => intval($this->cards->countCardInLocation('deck')) + 1, // to count the new card
        ]);

        $this->setGameStateValue(RECRUIT_DONE, 1);
        $this->setGameStateValue(EXPLORE_DONE, 1);

        $this->redirectAfterAction($playerId, true);
    }

    public function takeDestination(int $id) {
        self::checkAction('takeDestination');

        if (boolval($this->getGameStateValue(EXPLORE_DONE))) {
            throw new BgaUserException("Invalid action");
        }

        $args = $this->argPlayAction();
        $token = $this->array_find($args['possibleDestinations'], fn($c) => $c->id == $id);

        if ($token == null) {
            throw new BgaUserException("You can't take this token");
        }

        $this->setGameStateValue(SELECTED_DESTINATION, $id);

        $this->gamestate->nextState('payDestination');
    }

    public function payDestination(array $ids, int $recruits) {
        self::checkAction('payDestination');

        $playerId = intval($this->getActivePlayerId());
        
        if ($recruits > 0 && $this->getPlayer($playerId)->recruit < $recruits) {
            throw new BgaUserException("Not enough recruits");
        }

        $token = $this->getTokenFromDb($this->tokens->getCard($this->getGameStateValue(SELECTED_DESTINATION)));
        $fromReserve = $token->location == 'reserved';
        
        // will contain only selected cards of player
        $playedCardsByColor = [];
        $selectedPlayedCardsColors = [];
        $cardsToDiscard = [];
        if (count($ids) > 0) {
            $playedCardsByColor = $this->getPlayedCardsByColor($playerId);
            foreach ([1,2,3,4,5] as $color) {
                $playedCardsByColor[$color] = array_values(array_filter($playedCardsByColor[$color], fn($card) => in_array($card->id, $ids)));
                $selectedPlayedCardsColors[$color] = count($playedCardsByColor[$color]);
                $cardsToDiscard = array_merge($cardsToDiscard, $playedCardsByColor[$color]);
            }
        }

        $valid = $this->canTakeDestination($token, $selectedPlayedCardsColors, $recruits, true);
        if (!$valid) {
            throw new BgaUserException("Invalid payment for this token");
        }

        if ($recruits > 0) {
            $this->incPlayerRecruit($playerId, -$recruits, clienttranslate('${player_name} pays ${number} recruit(s) for the selected token'), [
                'number' => $recruits, // for logs
            ]);
            $this->incStat($recruits, 'recruitsUsedToPayDestination');
            $this->incStat($recruits, 'recruitsUsedToPayDestination', $playerId);
        }

        if (count($cardsToDiscard)) {
            $this->cards->moveCards(array_map(fn($card) => $card->id, $cardsToDiscard), 'discard');

            self::notifyAllPlayers('discardCards', clienttranslate('${player_name} discards ${number} cards(s) for the selected token'), [
                'playerId' => $playerId,
                'player_name' => $this->getPlayerName($playerId),
                'cards' => $cardsToDiscard,
                'number' => $recruits, // for logs
                'cardDiscardCount' => intval($this->cards->countCardInLocation('discard')),
            ]);
        }

        $destinationIndex = intval($this->tokens->countCardInLocation('played'.$playerId));
        $this->tokens->moveCard($token->id, 'played'.$playerId, $destinationIndex);

        $effectiveGains = $this->gainResources($playerId, $token->immediateGains, 'explore');
        $type = $token->type == 2 ? 'B' : 'A';

        self::notifyAllPlayers('takeDestination', clienttranslate('${player_name} takes a token from line ${letter} and gains ${gains}'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'token' => $token,
            'effectiveGains' => $effectiveGains,
            'gains' => $effectiveGains, // for logs
            'letter' => $type, // for logs
        ]);
                    
        $this->incStat(1, 'discoveredDestinations');
        $this->incStat(1, 'discoveredDestinations', $playerId);
        $this->incStat(1, 'discoveredDestinations'.$token->type);
        $this->incStat(1, 'discoveredDestinations'.$token->type, $playerId);

        $allGains = array_reduce($effectiveGains, fn($a, $b) => $a + $b, 0);
        $this->incStat($allGains, 'assetsCollectedByDestination');
        $this->incStat($allGains, 'assetsCollectedByDestination', $playerId);
        foreach ($effectiveGains as $type => $count) {
            if ($count > 0) {
                $this->incStat($count, 'assetsCollectedByDestination'.$type);
                $this->incStat($count, 'assetsCollectedByDestination'.$type, $playerId);
            }
        }

        $remainingCardsToTake = $this->getGlobalVariable(REMAINING_CARDS_TO_TAKE);
        if ($remainingCardsToTake != null) {
            $remainingCardsToTake->fromReserve = $fromReserve;
            $remainingCardsToTake->token = $token;
            $remainingCardsToTake->destinationIndex = $destinationIndex;
            $this->setGlobalVariable(REMAINING_CARDS_TO_TAKE, $remainingCardsToTake);

            $this->gamestate->nextState('discardCardsForDeck');
        } else {
            $this->endExplore($playerId, $fromReserve, $token, $destinationIndex);
        }
    }

    public function endExplore(int $playerId, bool $fromReserve, object $token, int $destinationIndex) {
        if (!$fromReserve) {
            $type = $token->type == 2 ? 'B' : 'A';
            $newDestination = $this->getTokenFromDb($this->tokens->pickCardForLocation('deck'.$type, 'slot'.$type, $token->locationArg));
            $newDestination->location = 'slot'.$type;
            $newDestination->locationArg = $token->locationArg;

            self::notifyAllPlayers('newTableDestination', '', [
                'token' => $newDestination,
                'letter' => $type,
                'destinationDeckTop' => Token::onlyId($this->getTokenFromDb($this->tokens->getCardOnTop('deck'.$type))),
                'destinationDeckCount' => intval($this->tokens->countCardInLocation('deck'.$type)),
            ]);
        }

        $this->setGameStateValue(RECRUIT_DONE, 1);
        $this->setGameStateValue(EXPLORE_DONE, 1);

        $this->redirectAfterAction($playerId, true);
    }

    public function reserveDestination(int $id) {
        self::checkAction('reserveDestination');

        $playerId = intval($this->getActivePlayerId());

        $token = $this->getTokenFromDb($this->tokens->getCard($id));

        if ($token == null || !in_array($token->location, ['slotA', 'slotB'])) {
            throw new BgaUserException("You can't reserve this token");
        }

        $this->tokens->moveCard($token->id, 'reserved', $playerId);
        $type = $token->type == 2 ? 'B' : 'A';

        self::notifyAllPlayers('reserveDestination', clienttranslate('${player_name} takes a token from line ${letter}'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'token' => $token,
            'letter' => $type, // for logs
        ]);

        $newDestination = $this->getTokenFromDb($this->tokens->pickCardForLocation('deck'.$type, 'slot'.$type, $token->locationArg));
        $newDestination->location = 'slot'.$type;
        $newDestination->locationArg = $token->locationArg;

        self::notifyAllPlayers('newTableDestination', '', [
            'token' => $newDestination,
            'letter' => $type,
            'destinationDeckTop' => Token::onlyId($this->getTokenFromDb($this->tokens->getCardOnTop('deck'.$type))),
            'destinationDeckCount' => intval($this->tokens->countCardInLocation('deck'.$type)),
        ]);

        $this->gamestate->nextState('next');
    }

    public function discardTableCard(int $id) {
        self::checkAction('discardTableCard');

        $playerId = intval($this->getActivePlayerId());

        $card = $this->getCardFromDb($this->cards->getCard($id));

        if ($card == null || $card->location != 'slot') {
            throw new BgaUserException("You can't discard this card");
        }
        $slotColor = $card->locationArg;
        
        $this->cards->moveCard($card->id, 'discard');

        self::notifyAllPlayers('discardTableCard', clienttranslate('${player_name} discards ${card_color} ${card_type} card from the table (${color} column)'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'card' => $card,
            'color' => $this->getColorName($slotColor), // for logs
            'card_type' => $this->getGainName($card->gain), // for logs
            'card_color' => $this->getColorName($card->color), // for logs
        ]);

        $newTableCard = $this->getCardFromDb($this->cards->pickCardForLocation('deck', 'slot', $slotColor));
        $newTableCard->location = 'slot';
        $newTableCard->locationArg = $slotColor;

        self::notifyAllPlayers('newTableCard', '', [
            'card' => $newTableCard,
            'cardDeckTop' => Card::onlyId($this->getCardFromDb($this->cards->getCardOnTop('deck'))),
            'cardDeckCount' => intval($this->cards->countCardInLocation('deck')) + 1, // to count the new card
        ]);

        $this->redirectAfterAction($playerId, true);
    }

    public function pass() {
        self::checkAction('pass');

        $playerId = intval($this->getActivePlayerId());

        $this->redirectAfterAction($playerId, true);
    }

    public function trade(int $number) {
        self::checkAction('trade');

        $playerId = intval($this->getActivePlayerId());

        if ($this->getPlayer($playerId)->bracelet < $number) {
            throw new BgaUserException("Not enough bracelets");
        }

        $this->incPlayerBracelet($playerId, -$number, clienttranslate('${player_name} chooses to pay ${number} bracelet(s) to trade'), [
            'number' => $number, // for logs
        ]);

        $gains = $this->getTradeGains($playerId, $number);
        $groupGains = $this->groupGains($gains);
        $effectiveGains = $this->gainResources($playerId, $groupGains, 'trade');

        self::notifyAllPlayers('trade', clienttranslate('${player_name} gains ${gains} with traded bracelet(s)'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'effectiveGains' => $effectiveGains,
            'gains' => $effectiveGains, // for logs
        ]);

        $this->incStat(1, 'tradeActions');
        $this->incStat(1, 'tradeActions', $playerId);
        $this->incStat(1, 'tradeActions'.$number);
        $this->incStat(1, 'tradeActions'.$number, $playerId);
        $this->incStat($number, 'braceletsUsed');
        $this->incStat($number, 'braceletsUsed', $playerId);

        $allGains = array_reduce($effectiveGains, fn($a, $b) => $a + $b, 0);
        $this->incStat($allGains, 'assetsCollectedByTrade');
        $this->incStat($allGains, 'assetsCollectedByTrade', $playerId);
        foreach ($effectiveGains as $type => $count) {
            if ($count > 0) {
                $this->incStat($count, 'assetsCollectedByTrade'.$type);
                $this->incStat($count, 'assetsCollectedByTrade'.$type, $playerId);
            }
        }

        if ($this->getGlobalVariable(REMAINING_CARDS_TO_TAKE) != null) {
            $this->gamestate->nextState('discardCardsForDeck');
        } else {
            $this->endTrade($playerId);
        }
    }

    public function endTrade(int $playerId) {
        $this->setGameStateValue(TRADE_DONE, 1);
        $this->redirectAfterAction($playerId, false);
    }

    public function endTurn() {
        self::checkAction('endTurn');

        $playerId = intval($this->getCurrentPlayerId());

        $this->gamestate->nextState('endTurn');
    }

    public function discardCard(int $id) {
        self::checkAction('discardCard');

        $playerId = intval($this->getCurrentPlayerId());

        $card = $this->getCardFromDb($this->cards->getCard($id));

        if ($card == null || !str_starts_with($card->location, "played$playerId")) {
            throw new BgaUserException("You must choose a card in front of you");
        }

        $this->cards->moveCard($card->id, 'discard');

        self::notifyAllPlayers('discardCards', clienttranslate('${player_name} discards a cards to refill the deck'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'cards' => [$card],
            'cardDiscardCount' => intval($this->cards->countCardInLocation('discard')),
        ]);

        $this->incStat(1, 'discardedCards');
        $this->incStat(1, 'discardedCards', $playerId);

        $this->gamestate->setPlayerNonMultiactive($playerId, 'next');
    }
}
