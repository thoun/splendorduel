<?php

use Bga\GameFrameworkPrototype\Helpers\Arrays;

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

    function isCounterfeiterExpansion(): bool {
        return $this->tableOptions->get(100) === 1;
    }

    function getPlayersIds() {
        return array_keys($this->loadPlayersBasicInfos());
    }

    function getPlayerPrivileges(int $playerId) {
        return intval($this->getUniqueValueFromDB("SELECT player_privileges FROM player WHERE player_id = $playerId"));
    }
    
    function getOpponentId(int $playerId) {
        return intval($this->getUniqueValueFromDB("SELECT player_id FROM player WHERE player_id <> $playerId"));
    }

    function getPlayerAntiPlayingTurns(int $playerId) {
        return intval($this->getUniqueValueFromDB("SELECT player_anti_playing_turns FROM player WHERE player_id = $playerId"));
    }

    function getPlayer(int $id) {
        $sql = "SELECT * FROM player WHERE player_id = $id";
        $dbResults = $this->getCollectionFromDb($sql);
        return array_map(fn($dbResult) => new SplendorDuelExpansionPlayer($dbResult), array_values($dbResults))[0];
    }

    function incPlayerScore(int $playerId, int $amount, $message = '', $args = []) {
        if ($amount != 0) {
            $this->DbQuery("UPDATE player SET `player_score` = `player_score` + $amount WHERE player_id = $playerId");
        }
            
        $this->notifyAllPlayers('score', $message, [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerNameById($playerId),
            'newScore' => $this->getPlayer($playerId)->score,
            'incScore' => $amount,
        ] + $args);
    }

    function getCardFromDb(/*array|null*/ $dbCard) {
        if ($dbCard == null) {
            return null;
        }
        return new Card($dbCard, $this->CARDS);
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
        $sql = "SELECT * FROM `card` WHERE `card_location` ".( str_contains($location, '%') ? "LIKE" : "=" )." '$location'";
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

            foreach ($this->CARDS[$level] as $index => $cardType) {
                $cards[] = [ 'type' => $level, 'type_arg' => $index, 'nbr' => 1 ];
            }

            $this->cards->createCards($cards, 'deck'.$level);
            $this->cards->shuffle('deck'.$level);

            for ($i = 1; $i <= 6 - $level; $i++) {
                $this->cards->pickCardForLocation('deck'.$level, 'table'.$level, $i);
            }
        }
    }

    function getRoyalCardFromDb(/*array|null*/ $dbCard) {
        if ($dbCard == null) {
            return null;
        }
        return new RoyalCard($dbCard, $this->ROYAL_CARDS + $this->ROYAL_CARDS_EXPANSION);
    }

    function getRoyalCardsFromDb(array $dbCards) {
        return array_map(fn($dbCard) => $this->getRoyalCardFromDb($dbCard), array_values($dbCards));
    }

    function getRoyalCardsByLocation(string $location, /*int|null*/ $location_arg = null) {
        $sql = "SELECT * FROM `royal_card` WHERE `card_location` = '$location'";
        if ($location_arg !== null) {
            $sql .= " AND `card_location_arg` = $location_arg";
        }
        $sql .= " ORDER BY `card_location_arg`";
        $dbResults = $this->getCollectionFromDb($sql);
        return array_map(fn($dbCard) => $this->getRoyalCardFromDb($dbCard), array_values($dbResults));
    }

    function setupRoyalCards(bool $counterfeiterExpansion) {     
        $cards = [];

        foreach ($this->ROYAL_CARDS as $index => $cardType) {
            $cards[] = [ 'type' => $index, 'type_arg' => 0, 'nbr' => 1 ];
        }
        if ($counterfeiterExpansion) {
            foreach ($this->ROYAL_CARDS_EXPANSION as $index => $cardType) {
                $cards[] = [ 'type' => $index, 'type_arg' => 0, 'nbr' => 1 ];
            }
        }

        $this->royalCards->createCards($cards, 'box');
        $this->royalCards->shuffle('box');
        $this->royalCards->pickCardsForLocation(4, 'box', 'deck');
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

    function getPlayerTokens(int $playerId) {
        return $this->getTokensByLocation('player', $playerId);
    }

    // gold is -1, pearl is 0, else color index
    function getPlayerTokensByColor(int $playerId) {
        $tokens = $this->getPlayerTokens($playerId);

        $tokensByColor = [];
        foreach ([-1, 0,1,2,3,4,5,6] as $color) {
            $tokensByColor[$color] = array_values(array_filter($tokens, fn($token) => $token->type == 1 ? $color == -1 : $token->color == $color));
        }
        return $tokensByColor;
    }

    function playerHasAllGoldAndPearls(int $playerId) {
        $tokens = $this->getPlayerTokensByColor($playerId);
        return count($tokens[-1]) >= 3 && count($tokens[0]) >= 2;
    }

    function setupTokens(bool $counterfeiterExpansion) {
        $cards = [
            [ 'type' => 1, 'type_arg' => 0, 'nbr' => 3 ], // gold
            [ 'type' => 2, 'type_arg' => 0, 'nbr' => 2 ], // pearls
        ];
        for ($i = 1; $i <= ($counterfeiterExpansion ? 6 : 5); $i++) {
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

    function getColorName(int $color) {
        switch ($color) {
            case -1: return clienttranslate("Gold");
            case PEARL: return clienttranslate("Pearl");
            case BLUE: return clienttranslate("Blue");
            case WHITE: return clienttranslate("White");
            case GREEN: return clienttranslate("Green");
            case BLACK: return clienttranslate("Black");
            case RED: return clienttranslate("Red");
            case GLASSWARE: return clienttranslate("Glassware");
            case GRAY: return clienttranslate("Gray");
        }
    }

    function getTokensNames(array $tokens) {
        return array_map(fn($token) => $this->getColorName($token->type == 1 ? -1 : $token->color), $tokens);
    }
    
    function checkUsePrivilege(array $tokens, int $number)  {
        if (count($tokens) > $number) {
            throw new BgaUserException("Not enough privileges");
        }

        if ($this->array_some($tokens, fn($token) => $token->type == 1)) {
            throw new BgaUserException("You can't take gold tokens this way");
        }
    }

    function checkPlayTakeGems(int $playerId, array $tokens)  {
        $gold = array_values(array_filter($tokens, fn($token) => $token->type == 1));
        $gems = array_values(array_filter($tokens, fn($token) => $token->type == 2));

        if (count($gold) > 0) {
            $maxReserve = $this->getPlayerMaxReserve($playerId);
            if (count($gold) > 1) {
                throw new BgaUserException("You can only take 1 gold token");
            } else if (count($gems) > 0) {
                throw new BgaUserException("You can't take gold and gems at the same time");
            } else if (intval($this->cards->countCardInLocation('reserved', $playerId)) >= $maxReserve) {
                throw new BgaUserException("You can't reserve more than $maxReserve cards");
            }
        } else {
            if (count($gems) > 3) {
                throw new BgaUserException("You can only take up to 3 tokens");
            }

            usort($gems, fn($a, $b) => $a->row == $b->row ? $a->column - $b->column : $a->row - $b->row);
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
        $this->tokens->moveCards(array_map(fn($token) => $token->id, $tokens), 'player', $playerId);

        self::notifyAllPlayers('takeTokens', clienttranslate('${player_name} takes token(s) ${new_tokens}'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerNameById($playerId),
            'tokens' => $tokens,
            'new_tokens' => $this->getTokensNames($tokens), // for logs
            'preserve' => ['tokens'],
            'i18n' => ['new_tokens'],
        ]);
    }

    function applyPower(int $playerId, int $power, int $cardId = -1): bool /* redirected*/ {
        switch ($power) {
            case POWER_PLAY_AGAIN:
                $this->setGameStateValue(PLAY_AGAIN, 1);
                break;
            case POWER_MULTICOLOR:
                $this->setGameStateValue(PLAYED_CARD, $cardId);
                $this->gamestate->jumpToState(ST_PLAYER_PLACE_JOKER);
                return true;
            case POWER_TAKE_GEM_FROM_TABLE:
                $this->setGameStateValue(PLAYED_CARD, $cardId);
                $this->gamestate->jumpToState(ST_PLAYER_TAKE_BOARD_TOKEN);
                return true;
            case POWER_TAKE_PRIVILEGE:
                $message = $cardId == -1 ?
                    clienttranslate('${player_name} takes a privilege with the Royal card ability') :
                    clienttranslate('${player_name} takes a privilege with the played card ability');
                $this->takePrivilege($playerId, $message);
                
                $this->incStat(1, 'ability4');
                $this->incStat(1, 'ability4', $playerId);
                break;
            case POWER_TAKE_GEM_FROM_OPPONENT:
                $this->setGameStateValue(PLAYED_CARD, $cardId);
                $this->gamestate->jumpToState(ST_PLAYER_TAKE_OPPONENT_TOKEN);
                return true;
            case POWER_RESERVE_CARD:
                $this->gamestate->jumpToState(ST_PLAYER_RESERVE_CARD);
                return true;
            case POWER_TAKE_COUNTERFEITER_CARD:
                $this->gamestate->jumpToState(ST_PLAYER_TAKE_COUNTERFEITER_CARD);
                return true;
            case POWER_TAKE_ALL_GEMS_SAME_COLOR:
            case POWER_TAKE_GOLD_FROM_TABLE:
            case POWER_TAKE_3GEMS_FROM_TABLE:
                $this->setGameStateValue(PLAYED_CARD, -$power);
                $this->gamestate->jumpToState(ST_PLAYER_TAKE_BOARD_TOKEN);
                return true;
            case POWER_TAKE_2GEMS_FROM_BAG:
                $this->tokens->shuffle('bag');
                $bagCount = intval($this->tokens->countCardInLocation('bag'));
                $tokens = [];
                for ($i = 0; $i < min(2, $bagCount); $i++) {
                    $tokens[] = $this->getTokenFromDb($this->tokens->pickCardForLocation('bag', 'player', $playerId));
                }

                if ($tokens === 0) {
                    $this->notify->all('log', clienttranslate("Card ability is skipped, as the bag is empty"));
                } else {
                    $this->notifyAllPlayers('takeTokens', clienttranslate('${player_name} takes token(s) ${new_tokens} from the bag'), [
                        'playerId' => $playerId,
                        'player_name' => $this->getPlayerNameById($playerId),
                        'tokens' => $tokens,
                        'new_tokens' => $this->getTokensNames($tokens), // for logs
                        'preserve' => ['tokens'],
                        'i18n' => ['new_tokens'],
                        'from' => 'bag',
                    ]);
                }
                break;
        }

        return false;
    }

    function applyEndTurn(int $playerId, Card|RoyalCard|CounterfeiterCard|null $card = null, bool $ignorePower = false) {
        $takeRoyalCard = false;

        if ($card != null) {
            if (property_exists($card, 'crowns') && $card->crowns > 0) {
                $cards = $this->getCardsByLocation('player'.$playerId.'-%');
                $counterfeiterCards = $this->isCounterfeiterExpansion() ? $this->counterfeiterCards->getPlayer($playerId) : [];
                $crownsAfter = 0;
                foreach($cards as $iCard) {
                    $crownsAfter += $iCard->crowns;
                }
                foreach($counterfeiterCards as $iCard) {
                    $crownsAfter += $iCard->crowns;
                }
                $crownsBefore = $crownsAfter - $card->crowns;

                if (($crownsAfter >= 3 && $crownsBefore < 3) || ($crownsAfter >= 6 && $crownsBefore < 6)) {
                    $takeRoyalCard = true;
                    $this->setGameStateValue(TAKE_ROYAL_CARD, 1);
                }
            }

            if (!$ignorePower && $card !== null && !$card instanceof CounterfeiterCard) {
                $redirected = false;
                foreach ($card->power as $power) {
                    $powerWithRedirection = $this->applyPower($playerId, $power, ($card instanceof RoyalCard) ? -1 : $card->id);
                    if ($powerWithRedirection) {
                        $redirected = true;
                    }
                }

                if ($redirected) {
                    return;
                }
            }
        }

        if ($takeRoyalCard) { // in case we hadn't been redirected to choose column for joker color
            $this->gamestate->jumpToState(ST_PLAYER_TAKE_ROYAL_CARD);
            return;
        }

        $this->gamestate->jumpToState(ST_PLAYER_BEFORE_END_TURN);
    }

    function getPlayerTokenCountInLimit(int $playerId): int {
        $playerTokens = $this->getTokensByLocation('player', $playerId);
        if ($this->counterfeiterCards->playerHasCounterfeiterCard($playerId, 12)) {
            $playerTokens = Arrays::filter($playerTokens, fn($token) => $token->color !== 6);
        }
        return count($playerTokens);
    }
    
    function spendPrivileges(int $playerId, int $number) {
        $this->DbQuery("UPDATE player SET `player_privileges` = `player_privileges` - $number WHERE player_id = $playerId");

        self::notifyAllPlayers('privileges', clienttranslate('${player_name} uses ${number} privileges to take token(s) from the board'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerNameById($playerId),
            'privileges' => [
                $playerId => $this->getPlayerPrivileges($playerId),
            ],
            'from' => $playerId,
            'to' => 0,
            'count' => $number,
            'number' => $number, // for logs
        ]);
    }

    function takePrivilege(int $playerId, string $message) {
        $playerPrivileges = $this->getPlayerPrivileges($playerId);
        if ($playerPrivileges >= 3) {
            self::notifyAllPlayers('log', clienttranslate('${player_name} cannot take a privilege because he already have all 3 privileges.'), [
                'playerId' => $playerId,
                'player_name' => $this->getPlayerNameById($playerId),
            ]);
            return;
        }

        $opponentId = $this->getOpponentId($playerId);
        $opponentPrivileges = $this->getPlayerPrivileges($opponentId);
        $fromOpponent = ($playerPrivileges + $opponentPrivileges) >= 3;
        if ($fromOpponent) {
            $this->DbQuery("UPDATE player SET `player_privileges` = `player_privileges` - 1 WHERE player_id = $opponentId");
        }

        $this->DbQuery("UPDATE player SET `player_privileges` = `player_privileges` + 1 WHERE player_id = $playerId");

        self::notifyAllPlayers('privileges', $message, [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerNameById($playerId),
            'opponentId' => $opponentId,
            'player_name2' => $this->getPlayerNameById($opponentId),
            'privileges' => [
                $playerId => $this->getPlayerPrivileges($playerId),
                $opponentId => $this->getPlayerPrivileges($opponentId),
            ],
            'from' => $fromOpponent ? $opponentId : 0,
            'to' => $playerId,
            'count' => 1,
        ]);
                
        $this->incStat(1, 'privileges');
        $this->incStat(1, 'privileges', $playerId);
                
        $this->incStat(1, $fromOpponent ? 'privilegesFromOpponent' : 'privilegesFromTable');
        $this->incStat(1, $fromOpponent ? 'privilegesFromOpponent' : 'privilegesFromTable', $playerId);
    }

    function getEndStatus(int $playerId) {
        $cards = $this->getCardsByLocation('player'.$playerId.'-%');
        $totalPoints = 0;
        $pointsByColor = [1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0];
        $crowns = 0;
        
        foreach($cards as $card) {
            $totalPoints += $card->points;
            $crowns += $card->crowns;
            $color = intval(substr($card->location, -1));
            if ($color <= 5) {
                $pointsByColor[$color] += $card->points;
            }
        }
        
        $royalCards = $this->getRoyalCardsByLocation('player', $playerId);
        foreach($royalCards as $royalCard) {
            $totalPoints += $royalCard->points;
        }
        if ($this->isCounterfeiterExpansion()) {
            $counterfeiterCards = $this->counterfeiterCards->getPlayer($playerId);
            foreach($counterfeiterCards as $counterfeiterCard) {
                $totalPoints += $counterfeiterCard->points;
                $crowns += $counterfeiterCard->crowns;
            }
        }

        return [$totalPoints, $crowns, max($pointsByColor)];
    }

    function getPlayerProgress(int $playerId) {
        $status = $this->getEndStatus($playerId);

        $totalPoints = $status[0];
        $crowns = $status[1];
        $colorMaxPoints = $status[2];

        return max($totalPoints * 5, $crowns * 10, $colorMaxPoints * 10);
    }

    function getEndReasons(int $playerId) {
        $reasons = [];
        $status = $this->getEndStatus($playerId);

        $totalPoints = $status[0];
        $crowns = $status[1];
        $colorMaxPoints = $status[2];

        $totalPointsGoal = 20;
        $colorMaxPointsGoal = 10;
        $crownGoal = 10;

        $royalCards = $this->getRoyalCardsByLocation('player', $playerId);
        if (Arrays::some($royalCards, fn($royalCard) => in_array(POWER_WIN_9PTS_SAME_COLOR, $royalCard->power))) {
            $colorMaxPointsGoal = 9;
        }
        if (Arrays::some($royalCards, fn($royalCard) => in_array(POWER_WIN_9CROWNS, $royalCard->power))) {
            $crownGoal = 9;
        }        

        if ($totalPoints >= $totalPointsGoal) {
            $reasons[] = 1;
        }
        if ($crowns >= $crownGoal) {
            $reasons[] = 2;
        }
        if ($colorMaxPoints >= $colorMaxPointsGoal) {
            $reasons[] = 3;
        }

        return $reasons;
    }

    function getCardReducedCost(array &$initialCost, array $playerCards) {
        $cost = $initialCost; // copy
        
        foreach($playerCards as $card) {
            foreach($card->provides as $color => $count) {
                if ($color == MULTICOLOR) {
                    $color = intval(substr($card->location, -1));
                }
                if (array_key_exists($color, $cost)) {
                    if ($cost[$color] > $count) {
                        $cost[$color] -= $count;
                    } else {
                        unset($cost[$color]);
                    }
                } 
            }
        }

        return $cost;
    }

    function canBuyCard(Card|CounterfeiterCard &$card, array $playerTokensByColor, array $playerCards, array $converters): array {
        $cost = $this->getCardReducedCost($card->cost, $playerCards);
        $remainingPlayerTokensByColor = Arrays::map($playerTokensByColor, fn($tokens) => count($tokens));
        $possiblePayments = $this->findPaymentWays($cost, $remainingPlayerTokensByColor, $converters);
        return $possiblePayments;
    }

    function findPaymentWays(array $cost, array $playerTokens, array $converters, array $currentPayment = [], array $allWays = []): array {
        // Base case: If the cost is fully paid, add the current way to the list
        if (array_sum($cost) === 0) {
            $allWays[] = $currentPayment;
            return array_values(array_unique($allWays, SORT_REGULAR));
            //return $allWays;
        }

        // Try to pay with GOLD tokens
        if (isset($playerTokens[GOLD]) && $playerTokens[GOLD] > 0) {
            foreach ($cost as $color => $needed) {
                if ($needed > 0) {
                    $newCost = $cost;
                    $newCost[$color]--;

                    $newTokens = $playerTokens;
                    $newTokens[GOLD]--;

                    $newPayment = $currentPayment;
                    $newPayment[GOLD] = ($newPayment[GOLD] ?? 0) + 1;
                    
                    // Recursive call
                    $allWays = $this->findPaymentWays($newCost, $newTokens, $converters, $newPayment, $allWays);
                }
            }
        }

        // Try to pay with player tokens of matching colors
        foreach ($cost as $color => $needed) {
            if ($needed > 0 && isset($playerTokens[$color]) && $playerTokens[$color] > 0) {
                $newCost = $cost;
                $newCost[$color]--;

                $newTokens = $playerTokens;
                $newTokens[$color]--;

                $newPayment = $currentPayment;
                $newPayment[$color] = ($newPayment[$color] ?? 0) + 1;
                
                // Recursive call
                $allWays = $this->findPaymentWays($newCost, $newTokens, $converters, $newPayment, $allWays);
            }
        }

        // Try to pay using converters
        foreach ($converters as $index => $converter) {
            $toColorMulti = array_keys($converter->to)[0];
            $numberFrom = array_values($converter->from)[0];
            $numberTo = array_values($converter->to)[0];

            $convertFromColors = [GOLD, array_keys($converter->from)[0]];
            $convertToPossibleColors = $toColorMulti === MULTICOLOR ?
                [BLUE, WHITE, GREEN, BLACK, RED] :
                [$toColorMulti];

            foreach ($convertFromColors as $fromColor) {
                foreach ($convertToPossibleColors as $toColor) {
                // Check if we can use this converter with current color
                    if (
                        isset($playerTokens[$fromColor]) && $playerTokens[$fromColor] >= $numberFrom && 
                        $converter->repeat > 0 && 
                        isset($cost[$toColor]) && $cost[$toColor] > 0
                    ) {
                        $newCost = $cost;
                        $newCost[$toColor] -= min($numberTo, $cost[$toColor]);

                        $newTokens = $playerTokens;
                        $newTokens[$fromColor] -= $numberFrom;

                        // A 'conversion' payment step
                        $newPayment = $currentPayment;
                        $newPayment[$fromColor] = ($newPayment[$fromColor] ?? 0) + $numberFrom;
                        
                        // Clone and update converter to track usage
                        $newConverters = $converters;
                        $newConverters[$index] = clone $newConverters[$index];
                        $newConverters[$index]->repeat--;

                        // Recursive call
                        $allWays = $this->findPaymentWays($newCost, $newTokens, $newConverters, $newPayment, $allWays);
                    }
                }
            }
        }

        return $allWays;
    }


    function getBuyableCardsAndCosts(int $playerId) {
        $tokens = $this->getPlayerTokensByColor($playerId);
        $cards = $this->getCardsByLocation('player'.$playerId.'-%');
        $hasColoredCards = $this->array_some($cards, fn($card) => in_array($card->color, [BLUE, WHITE, GREEN, BLACK, RED]));
        $counterfeiterCardConversions = $this->counterfeiterCards->getConversions($playerId);

        $possibleCards = array_merge(
            $this->getCardsByLocation('reserved', $playerId),
            $this->getCardsByLocation('table%'),
        );

        // ignore multi color if we don't have a colored card
        if (!$hasColoredCards) {
            $possibleCards = Arrays::filter($possibleCards, fn($card) => !in_array(POWER_MULTICOLOR, $card->power));
        }

        $buyableCards = [];
        $reducedCosts = [];
        foreach ($possibleCards as $card) {
            $paymentWays = $this->canBuyCard($card, $tokens, $cards, $counterfeiterCardConversions);
            if (count($paymentWays) > 0) {
                $buyableCards[$card->id] = $paymentWays;
                $reducedCosts[$card->id] = $this->getCardReducedCost($card->cost, $cards);
            }
        }

        return [
            'buyableCards' => $buyableCards,
            'reducedCosts' => $reducedCosts,
        ];
    }


    function getBuyableCounterfeiterCardsAndCosts(int $playerId) {
        if (!$this->isCounterfeiterExpansion()) {
            return [
            'buyableCounterfeiterCards' => [],
            'reducedCounterfeiterCosts' => [],
        ];
        }
        $tokens = $this->getPlayerTokensByColor($playerId);
        $cards = $this->getCardsByLocation('player'.$playerId.'-%');
        $counterfeiterCardConversions = $this->counterfeiterCards->getConversions($playerId);

        $possibleCards = $this->counterfeiterCards->getItemsInLocation('table');

        $buyableCards = [];
        $reducedCosts = [];
        foreach ($possibleCards as $card) {
            $paymentWays = $this->canBuyCard($card, $tokens, $cards, $counterfeiterCardConversions);
            if (count($paymentWays) > 0) {
                $buyableCards[$card->id] = $paymentWays;
                $reducedCosts[$card->id] = $this->getCardReducedCost($card->cost, $cards);
            }
        }

        return [
            'buyableCounterfeiterCards' => $buyableCards,
            'reducedCounterfeiterCosts' => $reducedCosts,
        ];
    }

    function refillCards() {
        for ($level = 1; $level <= 3; $level++) {
            for ($i = 1; $i <= 6 - $level; $i++) {
                if (count($this->getCardsByLocation('table'.$level, $i)) == 0 && count($this->getCardsByLocation('deck'.$level)) > 0) {
                    $newCard = $this->getCardFromDb($this->cards->pickCardForLocation('deck'.$level, 'table'.$level, $i));
        
                    self::notifyAllPlayers('newTableCard', '', [
                        'newCard' => $newCard,
                        'cardDeckCount' => intval($this->cards->countCardInLocation('deck'.$level)),
                        'cardDeckTop' => Card::onlyId($this->getCardFromDb($this->cards->getCardOnTop('deck'.$level))),
                        'level' => $level,
                    ]);
                }
            }
        }
    }
}