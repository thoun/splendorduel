<?php

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

        return [
            'number' => $privileges, // for title
            'privileges' => $privileges,
        ];
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
        $canReserve = intval($this->cards->countCardInLocation('reserved', $playerId)) < 3;
        if (!$canReserve && $this->array_every($board, fn($token) => $token->type == 1)) {
            $canTakeTokens = false;
        }
        $canBuyCard = count($buyableCardsAndCosts['buyableCards']) > 0;

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
        ] + $buyableCardsAndCosts;
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
        $card = $this->getCardFromDb($this->cards->getCard($id));

        return [
            'color' => $card->color,
            'color_name' => $this->getColorName($card->color), // for title
        ];
    }

    function argTakeOpponentToken() {
        $playerId = intval($this->getActivePlayerId());
        $opponentId = $this->getOpponentId($playerId);

        return [
            'opponentId' => $opponentId,
        ];
    }

    function argDiscardTokens() {
        $playerId = intval($this->getActivePlayerId());

        $tokens = $this->getPlayerTokens($playerId);
        $number = count($tokens) - 10;

        return [
            'number' => $number, // for title
        ];
    }
} 
