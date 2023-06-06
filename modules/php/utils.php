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

        return !$args['canTakeTokens'] && !$args['canBuyCard'];
    }

    function getColorName(int $color) {
        switch ($color) { // TODO
            case BLUE: return clienttranslate("Blue");
            case YELLOW: return clienttranslate("Yellow");
            case GREEN: return clienttranslate("Green");
            case RED: return clienttranslate("Red");
            case PURPLE: return clienttranslate("Purple");
        }
    }
    
    function checkUsePrivilege(int $playerId, array $tokens)  {
        if ($this->getPlayerPrivileges($playerId) < count($tokens)) {
            throw new BgaUserException("Not enough privileges");
        }

        if ($this->array_some($tokens, fn($token) => $token->id == 1)) {
            throw new BgaUserException("You can't take gold tokens this way");
        }
    }

    function checkPlayTakeGems(array $tokens)  {
        $gold = array_values(array_filter($tokens, fn($token) => $token->type == 1));
        $gems = array_values(array_filter($tokens, fn($token) => $token->type == 2));

        if (count($gold) > 0) {
            if (count($gold) > 1) {
                throw new BgaUserException("You can only take 1 gold token");
            } else if (count($gems) > 0) {
                throw new BgaUserException("You can't take gold and gems at the same time");
            }
        } else {
            if (count($gems) > 3) {
                throw new BgaUserException("You can only take up to 3 tokens");
            }

            usort($gems, fn($a, $b) => $b->row == $b->row ? $a->column - $b->column : $a->row - $b->row);
            $rowDiff = null;
            $colDiff = null;
            $invalid = false;

            for ($i = 1; $i < count($gems); $i++) {
                if ($rowDiff === null && $colDiff === null) {
                    $rowDiff = $gems[$i]->row - $gems[$i - 1]->row;
                    $colDiff = $gems[$i]->column - $gems[$i - 1]->column;
                } else {
                    if (($gems[$i]->row - $gems[$i - 1]->row != $rowDiff) || ($gems[$i]->column - $gems[$i - 1]->column != $colDiff)) {
                        $invalid = true;
                    }
                }
                if ($rowDiff < -1 || $rowDiff > 1 || $colDiff < -1 || $colDiff > 1) {
                    $invalid = true;
                }
            }

            if ($invalid) {
                throw new BgaUserException("You can only take tokens in straight line");
            }
        }
    }

    function applyTakeTokens(int $playerId, array $tokens) {
        $this->cards->moveCards(array_map(fn($token) => $token->id, $tokens), 'player', $playerId);

        self::notifyAllPlayers('takeTokens', clienttranslate('${player_name} takes token(s) ${new_tokens}'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'tokens' => $tokens,
            'new_tokens' => $tokens, // for logs
        ]);
    }

    function applyEndTurn(int $playerId) {
        $mustDiscard = count($this->getTokensByLocation('player', $playerId)) > 10;

        $this->gamestate->jumpToState($mustDiscard ? ST_PLAYER_DISCARD_TOKENS : ST_NEXT_PLAYER);
    }
    
    function spendPrivileges(int $playerId, int $number) {
        $this->DbQuery("UPDATE player SET `player_privileges` = `player_privileges` - $number WHERE player_id = $playerId");

        self::notifyAllPlayers('privileges', clienttranslate('${player_name} uses ${number} privileges to take token(s) from the board'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'privileges' => [
                $playerId => $this->getPlayerPrivileges($playerId),
            ],
            'number' => $number, // for logs
        ]);
    }

    function getEndReason(int $playerId) {
        // TODO
        return 0;
    }
}