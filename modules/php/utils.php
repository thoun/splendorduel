<?php

trait UtilTrait {

    //////////////////////////////////////////////////////////////////////////////
    //////////// Utility functions
    ////////////

    function array_find(array $array, callable $fn) {
        foreach ($array as $value) {
            if($fn($value)) {
                return $value;
            }
        }
        return null;
    }

    function array_findIndex(array $array, callable $fn) {
        $index = 0;
        foreach ($array as $value) {
            if($fn($value)) {
                return $index;
            }
            $index++;
        }
        return null;
    }

    function array_find_key(array $array, callable $fn) {
        foreach ($array as $key => $value) {
            if($fn($value)) {
                return $key;
            }
        }
        return null;
    }

    function array_some(array $array, callable $fn) {
        foreach ($array as $value) {
            if($fn($value)) {
                return true;
            }
        }
        return false;
    }
    
    function array_every(array $array, callable $fn) {
        foreach ($array as $value) {
            if(!$fn($value)) {
                return false;
            }
        }
        return true;
    }

    function setGlobalVariable(string $name, /*object|array*/ $obj) {
        /*if ($obj == null) {
            throw new \Error('Global Variable null');
        }*/
        $jsonObj = json_encode($obj);
        $this->DbQuery("INSERT INTO `global_variables`(`name`, `value`)  VALUES ('$name', '$jsonObj') ON DUPLICATE KEY UPDATE `value` = '$jsonObj'");
    }

    function getGlobalVariable(string $name, $asArray = null) {
        $json_obj = $this->getUniqueValueFromDB("SELECT `value` FROM `global_variables` where `name` = '$name'");
        if ($json_obj) {
            $object = json_decode($json_obj, $asArray);
            return $object;
        } else {
            return null;
        }
    }

    function deleteGlobalVariable(string $name) {
        $this->DbQuery("DELETE FROM `global_variables` where `name` = '$name'");
    }

    function deleteGlobalVariables(array $names) {
        $this->DbQuery("DELETE FROM `global_variables` where `name` in (".implode(',', array_map(fn($name) => "'$name'", $names)).")");
    }

    function getPlayersIds() {
        return array_keys($this->loadPlayersBasicInfos());
    }

    function getPlayerName(int $playerId) {
        return self::getUniqueValueFromDB("SELECT player_name FROM player WHERE player_id = $playerId");
    }

    function getPlayerPrivileges(int $playerId) {
        return intval(self::getUniqueValueFromDB("SELECT player_privileges FROM player WHERE player_id = $playerId"));
    }

    function getPlayer(int $id) {
        $sql = "SELECT * FROM player WHERE player_id = $id";
        $dbResults = $this->getCollectionFromDb($sql);
        return array_map(fn($dbResult) => new SplendorDuelPlayer($dbResult), array_values($dbResults))[0];
    }

    function incPlayerScore(int $playerId, int $amount, $message = '', $args = []) {
        if ($amount != 0) {
            $this->DbQuery("UPDATE player SET `player_score` = `player_score` + $amount WHERE player_id = $playerId");
        }
            
        $this->notifyAllPlayers('score', $message, [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'newScore' => $this->getPlayer($playerId)->score,
            'incScore' => $amount,
        ] + $args);
    }

    function incPlayerRecruit(int $playerId, int $amount, $message = '', $args = []) {
        if ($amount != 0) {
            $this->DbQuery("UPDATE player SET `player_recruit` = `player_recruit` + $amount WHERE player_id = $playerId");
        }

        $this->notifyAllPlayers('recruit', $message, [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'newScore' => $this->getPlayer($playerId)->recruit,
            'incScore' => $amount,
        ] + $args);
    }

    function incPlayerBracelet(int $playerId, int $amount, $message = '', $args = []) {
        if ($amount != 0) {
            $this->DbQuery("UPDATE player SET `player_bracelet` = `player_bracelet` + $amount WHERE player_id = $playerId");
        }

        $this->notifyAllPlayers('bracelet', $message, [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'newScore' => $this->getPlayer($playerId)->bracelet,
            'incScore' => $amount,
        ] + $args);
    }

    function getCardFromDb(/*array|null*/ $dbCard) {
        if ($dbCard == null) {
            return null;
        }
        return new Card($dbCard);
    }

    function getCardsFromDb(array $dbCards) {
        return array_map(fn($dbCard) => $this->getCardFromDb($dbCard), array_values($dbCards));
    }

    function getCardById(int $id) {
        $sql = "SELECT * FROM `card` WHERE `card_id` = $id";
        $dbResults = $this->getCollectionFromDb($sql);
        $cards = array_map(fn($dbCard) => $this->getCardFromDb($dbCard), array_values($dbResults));
        return count($cards) > 0 ? $cards[0] : null;
    }

    function getCardsByLocation(string $location, /*int|null*/ $location_arg = null, /*int|null*/ $type = null, /*int|null*/ $number = null) {
        $sql = "SELECT * FROM `card` WHERE `card_location` = '$location'";
        if ($location_arg !== null) {
            $sql .= " AND `card_location_arg` = $location_arg";
        }
        if ($type !== null) {
            $sql .= " AND `card_type` = $type";
        }
        if ($number !== null) {
            $sql .= " AND `card_type_arg` = $number";
        }
        $sql .= " ORDER BY `card_location_arg`";
        $dbResults = $this->getCollectionFromDb($sql);
        return array_map(fn($dbCard) => $this->getCardFromDb($dbCard), array_values($dbResults));
    }

    function setupCards() {     
        for ($level = 1; $level <= 3; $level++) {
            $cards = [];

            foreach ($this->CARDS as $cardType) {// TODO    
                $cards[] = [ 'type' => $cardType->color, 'type_arg' => $cardType->gain, 'nbr' => 2 ];
            }

            $this->cards->createCards($cards, 'deck'.$level);
            $this->cards->shuffle('deck'.$level);

            for ($i = 1; $i <= 6 - $level; $i++) {
                $this->cards->pickCardForLocation('deck'.$level, 'table'.$level, $i);
            }
        }
    }

    function getTokenFromDb(/*array|null*/ $dbCard) {
        if ($dbCard == null) {
            return null;
        }
        return new Token($dbCard);
    }

    function getTokensFromDb(array $dbCards) {
        return array_map(fn($dbCard) => $this->getTokenFromDb($dbCard), array_values($dbCards));
    }

    function getTokensByLocation(string $location, /*int|null*/ $location_arg = null, /*int|null*/ $type = null, /*int|null*/ $number = null) {
        $sql = "SELECT * FROM `token` WHERE `card_location` = '$location'";
        if ($location_arg !== null) {
            $sql .= " AND `card_location_arg` = $location_arg";
        }
        if ($type !== null) {
            $sql .= " AND `card_type` = $type";
        }
        if ($number !== null) {
            $sql .= " AND `card_type_arg` = $number";
        }
        $sql .= " ORDER BY `card_location_arg`";
        $dbResults = $this->getCollectionFromDb($sql);
        return array_map(fn($dbCard) => $this->getTokenFromDb($dbCard), array_values($dbResults));
    }

    function getBoard() {
        return $this->getTokensByLocation('board');
    }

    function setupTokens() {
        $cards = [
            [ 'type' => 1, 'type_arg' => 0, 'nbr' => 3 ], // gold
            [ 'type' => 2, 'type_arg' => 0, 'nbr' => 2 ], // pearls
        ];
        for ($i = 1; $i <= 5; $i++) {
            $cards[] = [ 'type' => 2, 'type_arg' => $i, 'nbr' => 4 ];
        }

        $this->tokens->createCards($cards, 'bag');

        $this->refillBag();
    }

    function refillBag() {
        $this->tokens->shuffle('bag');
        $bagCount = intval($this->tokens->countCardInLocation('bag'));

        $board = $this->getBoard();

        $refilledTokens = [];

        for ($i = 1; $i <= 25; $i++) {
            if ($bagCount > 0 && !$this->array_some($board, fn($token) => $token->locationArg == $i)) {
                $refilledTokens[] = $this->getTokenFromDb($this->tokens->pickCardForLocation('bag', 'board', $i));
                // TODO notif

                $bagCount--;
                if ($bagCount == 0) {
                    break;
                }
            }
        }

        self::notifyAllPlayers('refill', '', [
            'refilledTokens' => $refilledTokens,
        ]);
    }

    function mustRefill(int $playerId) {
        $args = $this->argPlayAction();

        return !$args['canTakeTokens'] && !$args['canReserve'] && !$args['canBuyCard'];
    }
    
    function redirectAfterAction(int $playerId) {
        if (boolval($this->getGameStateValue(GO_RESERVE))) {
            $this->incGameStateValue(GO_RESERVE, -1);
            $reserved = $this->getTokensByLocation('reserved', $playerId);
            if (count($reserved) >= 2) {
                self::notifyAllPlayers('log', clienttranslate('${player_name} cannot reserve a token because he already has 2'), [
                    'playerId' => $playerId,
                    'player_name' => $this->getPlayerName($playerId),
                ]);
            } else {
                $this->gamestate->nextState('reserve');
                return;
            }
        }
        if (boolval($this->getGameStateValue(GO_DISCARD_TABLE_CARD))) {
            $this->incGameStateValue(GO_DISCARD_TABLE_CARD, -1);
            $this->gamestate->nextState('discardTableCard');
            return;
        }

        $args = $this->argPlayAction();

        $canPlay = $args['canRecruit'] || $args['canExplore'] || $args['canTrade'];

        if ($canPlay) {
            $this->gamestate->nextState('next');
        } else {
            $this->gamestate->nextState('endTurn');
        }
    }
    
    function groupGains(array $gains) {
        $groupGains = [];

        foreach ($gains as $gain) {
            if (array_key_exists($gain, $groupGains)) {
                $groupGains[$gain] += 1;
            } else {
                $groupGains[$gain] = 1;
            }
        }

        return $groupGains;
    }
    
    function gainResources(int $playerId, array $groupGains, string $phase) {
        $player = $this->getPlayer($playerId);

        $effectiveGains = [];

        foreach ($groupGains as $type => $amount) {
            switch ($type) {
                case VP: 
                    $effectiveGains[VP] = $amount;
                    $this->DbQuery("UPDATE player SET `player_score` = `player_score` + ".$effectiveGains[VP]." WHERE player_id = $playerId");
                    break;
                case BRACELET: 
                    $effectiveGains[BRACELET] = min($amount, 3 - $player->bracelet);
                    $this->DbQuery("UPDATE player SET `player_bracelet` = `player_bracelet` + ".$effectiveGains[BRACELET]." WHERE player_id = $playerId");

                    if ($effectiveGains[BRACELET] < $amount) {
                        $this->incStat($amount - $effectiveGains[BRACELET], 'braceletsMissed');
                        $this->incStat($amount - $effectiveGains[BRACELET], 'braceletsMissed', $playerId);
                    }
                    break;
                case RECRUIT:
                    $effectiveGains[RECRUIT] = min($amount, 3 - $player->recruit);
                    $this->DbQuery("UPDATE player SET `player_recruit` = `player_recruit` + ".$effectiveGains[RECRUIT]." WHERE player_id = $playerId");

                    if ($effectiveGains[RECRUIT] < $amount) {
                        $this->incStat($amount - $effectiveGains[RECRUIT], 'recruitsMissed');
                        $this->incStat($amount - $effectiveGains[RECRUIT], 'recruitsMissed', $playerId);
                    }
                    break;
                case REPUTATION:
                    $effectiveGains[REPUTATION] = min($amount, 14 - $player->reputation);
                    $this->DbQuery("UPDATE player SET `player_reputation` = `player_reputation` + ".$effectiveGains[REPUTATION]." WHERE player_id = $playerId");
                    break;
                case CARD: 
                    $available = $this->getAvailableDeckCards();
                    $effectiveGains[CARD] = min($amount, $available);
                    for ($i = 0; $i < $effectiveGains[CARD]; $i++) {
                        $this->powerTakeCard($playerId);
                    }
                    if ($effectiveGains[CARD] < $amount) {
                        $this->setGlobalVariable(REMAINING_CARDS_TO_TAKE, [
                            'playerId' => $playerId,
                            'phase' => $phase,
                            'remaining' => $amount - $effectiveGains[CARD],
                        ]);
                    }
                    break;
            }
        }

        return $effectiveGains;
    }

    function canTakeDestination(Token $token, array $playedCardsColors, int $recruits, bool $strict) {
        $missingCards = 0;

        foreach ($token->cost as $color => $required) {
            $available = 0;
            if ($color == EQUAL) {
                $available = max($playedCardsColors);
            } else if ($color == DIFFERENT) {
                $available = count(array_filter($playedCardsColors, fn($count) => $count > 0));
            } else {
                $available = $playedCardsColors[$color]; 
            }

            if ($available < $required) {
                $missingCards += ($required - $available);
            }
        }

        return $strict ? $recruits == $missingCards : $recruits >= $missingCards;
    }

    function getGainName(int $gain) {
        switch ($gain) {
            case VP: return clienttranslate("Victory Point");
            case BRACELET: return clienttranslate("Bracelet");
            case RECRUIT: return clienttranslate("Recruit");
            case REPUTATION: return clienttranslate("Reputation");
            case CARD: return clienttranslate("Card");
        }
    }

    function getColorName(int $color) {
        switch ($color) {
            case BLUE: return clienttranslate("Blue");
            case YELLOW: return clienttranslate("Yellow");
            case GREEN: return clienttranslate("Green");
            case RED: return clienttranslate("Red");
            case PURPLE: return clienttranslate("Purple");
        }
    }

    function powerTakeCard(int $playerId) {
        $card = $this->getCardFromDb($this->cards->pickCardForLocation('deck', 'played'));
        $this->cards->moveCard($card->id, 'played'.$playerId.'-'.$card->color, intval($this->cards->countCardInLocation('played'.$playerId.'-'.$card->color)));

        self::notifyAllPlayers('takeDeckCard', clienttranslate('${player_name} takes a ${card_color} ${card_type} card from the deck'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'card' => $card,
            'cardDeckTop' => Card::onlyId($this->getCardFromDb($this->cards->getCardOnTop('deck'))),
            'cardDeckCount' => intval($this->cards->countCardInLocation('deck')),
            'card_type' => $this->getGainName($card->gain), // for logs
            'card_color' => $this->getColorName($card->color), // for logs
        ]);

    }

    function getPlayedCardsByColor(int $playerId) {
        $playedCardsByColor = [];
        foreach ([1,2,3,4,5] as $color) {
            $playedCardsByColor[$color] = $this->getCardsByLocation('played'.$playerId.'-'.$color);
        }
        return $playedCardsByColor;
    }

    function getPlayedCardsColor(int $playerId, /*array | null*/ $playedCardsByColor = null) {
        if ($playedCardsByColor === null) {
            $playedCardsByColor = $this->getPlayedCardsByColor($playerId);
        }
        foreach ([1,2,3,4,5] as $color) {
            $playedCardsByColor[$color] = $this->getCardsByLocation('played'.$playerId.'-'.$color);
        }
        return array_map(fn($cards) => count($cards), $playedCardsByColor);
    }

    function getCompletedLines(int $playerId) {
        $playedCardsColors = $this->getPlayedCardsColor($playerId);
        return min($playedCardsColors);
    }

    function completedAPlayedLine(int $playerId) {
        $completedLines = intval($this->getGameStateValue(COMPLETED_LINES));
        return $this->getCompletedLines($playerId) > $completedLines; // completed a line during the turn
    }


    function getAvailableDeckCards() {
        return intval($this->cards->countCardInLocation('deck')) + intval($this->cards->countCardInLocation('discard'));
    }

    function getTradeGains(int $playerId, int $bracelets) {
        $destinations = $this->getTokensByLocation('played'.$playerId);

        $gains = [];

        $rows = array_merge(
            [$this->getBoatGain()],
            array_map(fn($token) => $token->gains, $destinations),
        );
        foreach ($rows as $row) {
            for ($i = 0; $i < $bracelets; $i++) {
                if ($row[$i] !== null) {
                    $gains[] = $row[$i];
                }
            }
        }

        return $gains;
    }

    public function cardDeckAutoReshuffle() {
        $this->notifyAllPlayers('cardDeckReset', clienttranslate('The card deck has been reshuffled'), [            
            'cardDeckTop' => Card::onlyId($this->getCardFromDb($this->cards->getCardOnTop('deck'))),
            'cardDeckCount' => intval($this->cards->countCardInLocation('deck')),
            'cardDiscardCount' => intval($this->cards->countCardInLocation('discard')),
        ]);
    }
}
