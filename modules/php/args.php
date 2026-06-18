<?php

use Bga\GameFrameworkPrototype\Helpers\Arrays;

trait ArgsTrait {
    
//////////////////////////////////////////////////////////////////////////////
//////////// Game state arguments
////////////

    /*
        Here, you can create methods defined as "game state arguments" (see "args" property in states.inc.php).
        These methods function is to return some additional information that is specific to the current
        game state.
    */
   
    function argUsePrivilege() {
        $playerId = intval($this->getActivePlayerId());

        $privileges = $this->getPlayerPrivileges($playerId);

        $number = $privileges;
        if ($this->counterfeiterCards->playerHasCounterfeiterCard($playerId, 13) && !$this->globals->get(COUNTERFEITER13_USED, false)) {
            $number++;
        }

        return [
            'number' => $number, // for title
            'privileges' => $number,
        ];
    }

    function getPlayerMaxReserve(int $playerId): int {
        return $this->counterfeiterCards->playerHasCounterfeiterCard($playerId, 15) ? 5 : 3;
    }

    function argPlayAction() {
        $playerId = intval($this->getActivePlayerId());
        $board = $this->getBoard();
        $playerRefilled = boolval($this->getGameStateValue(PLAYER_REFILLED));
        $privileges = $playerRefilled ? 0 : $this->getPlayerPrivileges($playerId);
        if ($privileges > 0 && count($board) == 0) {
            $privileges = 0;
        }
        $bagEmpty = intval($this->tokens->countCardInLocation('bag')) == 0;
        $boardFull = count($board) == 25;
        $canRefill = !$bagEmpty && !$boardFull && !$playerRefilled;

        $canTakeTokens = count($board) > 0;
        $buyableCardsAndCosts = $this->getBuyableCardsAndCosts($playerId);
        $buyableCounterfeiterCardsAndCosts = $this->getBuyableCounterfeiterCardsAndCosts($playerId);
        $maxReserve = $this->getPlayerMaxReserve($playerId);
        $canReserve = intval($this->cards->countCardInLocation('reserved', $playerId)) < $maxReserve;
        if (!$canReserve && $this->array_every($board, fn($token) => $token->type == 1)) {
            $canTakeTokens = false;
        }
        $canBuyCard = count($buyableCardsAndCosts['buyableCards']) > 0 || count($buyableCounterfeiterCardsAndCosts['buyableCounterfeiterCards']) > 0;

        $mustRefill = $canRefill && !$canTakeTokens && !$canBuyCard;

        $playerAntiPlaying = $this->getPlayerAntiPlayingTurns($playerId) >= 3;
        $opponentAntiPlaying = $this->getPlayerAntiPlayingTurns($this->getOpponentId($playerId)) >= 3;

        return [
            'privileges' => $privileges,
            'canRefill' => $canRefill,
            'mustRefill' => $mustRefill,
            'canTakeTokens' => $canTakeTokens,
            'canReserve' => $canReserve,
            'canBuyCard' => $canBuyCard,
            'playerAntiPlaying' => $playerAntiPlaying,
            'opponentAntiPlaying' => $opponentAntiPlaying,            
        ] + $buyableCardsAndCosts + $buyableCounterfeiterCardsAndCosts;
    }

    function argReserveCard() {
        $playerId = intval($this->getActivePlayerId());

        $canReserve = 1;
        if (
            $this->counterfeiterCards->playerHasCounterfeiterCard($playerId, 15) && // reserve 2 cards
            intval($this->cards->countCardInLocation('reserved', $playerId)) < ($this->getPlayerMaxReserve($playerId) - 1)
        ) {
            $canReserve = 2;
        }

        return [
            'canReserve' => $canReserve,
        ];
    }

    function argPlaceJoker() {
        $playerId = intval($this->getActivePlayerId());

        $cards = $this->getCardsByLocation('player'.$playerId.'-%');

        $colors = array_values(array_filter([1,2,3,4,5], fn($color) => $this->array_some($cards, fn($card) => $card->color == $color)));

        return [
            'colors' => $colors,
        ];
    }

    function argTakeBoardToken() {
        $id = intval($this->getGameStateValue(PLAYED_CARD));
        if ($id > 0) {
            $playerId = intval($this->getActivePlayerId());
            $card = $this->getCardFromDb($this->cards->getCard($id));

            return [
                'number' => 1,
                'color' => $card->color,
                'canTakeAnyColorOrTwoOfColor' => $this->counterfeiterCards->playerHasCounterfeiterCard($playerId, 16),
                'color_name' => $this->getColorName($card->color), // for title
            ];
        } else {
            $power = -$id;

            if ($power === POWER_TAKE_GOLD_FROM_TABLE) {
                return [
                    'number' => 1,
                    'color' => -1,
                    'color_name' => $this->getColorName(-1), // for title
                ];
            } else if ($power === POWER_TAKE_ALL_GEMS_SAME_COLOR) {
                return [
                    'number' => -1,
                    'color' => MULTICOLOR,
                    'color_name' => $this->getColorName(MULTICOLOR), // for title
                ];
            } else if ($power === POWER_TAKE_3GEMS_FROM_TABLE) {
                return [
                    'number' => 3,
                    'color' => MULTICOLOR,
                    'color_name' => $this->getColorName(MULTICOLOR), // for title
                ];
            }
        }
    }

    function argTakeOpponentToken() {
        $playerId = intval($this->getActivePlayerId());
        $opponentId = $this->getOpponentId($playerId);

        return [
            'opponentId' => $opponentId,
        ];
    }

    function argBeforeEndTurn() {
        $possiblePowers = [];
        $playerRoyalCardCount = 0;
        
        if ($this->isCounterfeiterExpansion()) {
            $playerId = intval($this->getActivePlayerId());
            $playerTokens = $this->getPlayerTokensByColor($playerId);
            $glasswareTokens = array_merge($playerTokens[GLASSWARE], $playerTokens[GOLD]);

            $playerRoyalCardCount = count($this->getRoyalCardsByLocation('player', $playerId));

            if (
                $this->counterfeiterCards->playerHasCounterfeiterCard($playerId, 9) && // pay 1+$playerRoyalCardCount glassware tokens to take a royal card
                count($glasswareTokens) >= (1 + $playerRoyalCardCount) &&
                $this->globals->get(ROYAL_CARDS_WITH_COUNTERFEITER_POWER, 0) == 0 && // check it wasn't already used during this turn
                count($this->getRoyalCardsByLocation('deck')) > 0 // check if there are remaining royal cards
            ) {
                $possiblePowers[] = 9;
            }
            
            if (
                $this->counterfeiterCards->playerHasCounterfeiterCard($playerId, 10) && // pay scroll + glassware token to play again
                $this->getPlayerPrivileges($playerId) >= 1 && 
                count($glasswareTokens) >= 1 &&
                !boolval($this->getGameStateValue(PLAY_AGAIN)) // ignore if there's already a new turn incoming
            ) {
                $possiblePowers[] = 10;
            }
            
            if (
                $this->counterfeiterCards->playerHasCounterfeiterCard($playerId, 17) && // pay 2 glassware tokens to reserve from discard
                count($glasswareTokens) >= 2 &&
                count($this->getCardsByLocation('reserved', $playerId)) < $this->getPlayerMaxReserve($playerId) && // player can reserve
                $this->globals->get(RESERVE_FROM_DECK, 0) == 0 // check it wasn't already used during this turn
            ) {
                $possiblePowers[] = 17;
            }
        }

        return [
            'possiblePowers' => $possiblePowers,
            'playerRoyalCardCount' => $playerRoyalCardCount,
            '_no_notify' => count($possiblePowers) === 0,
        ];
    }

    function argDiscardTokens() {
        $playerId = intval($this->getActivePlayerId());

        $number = max(0, $this->getPlayerTokenCountInLimit($playerId) - 10);

        return [
            'number' => $number, // for title
            '_no_notify' => $number <= 0,
        ];
    }

    function argReserveFromDeckChooseCard() {
        $playerId = intval($this->getActivePlayerId());

        $level = $this->globals->get(RESERVE_FROM_DECK);
        $cards = $this->getCardsFromDb($this->cards->getCardsOnTop(3, 'deck'.$level));

        return [
            'level' => $level,
            '_private' => [
                $playerId => [
                    'cards' => $cards,
                ]
            ]
        ];
    }
} 
