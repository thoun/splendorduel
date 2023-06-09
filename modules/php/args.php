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
        $mustRefill = $this->mustRefill($playerId);

        return [
            'number' => $privileges, // for title
            'privileges' => $privileges,
            'canSkipBoth' => !$mustRefill,
        ];
    }
   
    function argRefillBoard() {
        $playerId = intval($this->getActivePlayerId());
        
        $bagEmpty = intval($this->tokens->countCardInLocation('bag')) == 0;
        $boardFull = count($this->getBoard()) == 25;
        $canRefill = !$bagEmpty && !$boardFull;
        $mustRefill = $canRefill && $this->mustRefill($playerId);

        return [        
            'canRefill' => $canRefill,
            'mustRefill' => $mustRefill,
        ];
    }

    function argPlayAction() {
        $playerId = intval($this->getActivePlayerId());

        $board = $this->getBoard();
        $canTakeTokens = count($board) > 0;
        $buyableCardsAndCosts = $this->getBuyableCardsAndCosts($playerId);
        $canReserve = intval($this->cards->countCardInLocation('reserved', $playerId)) < 3;
        if (!$canReserve && $this->array_every($board, fn($token) => $token->type == 1)) {
            $canTakeTokens = false;
        }
        $canBuyCard = count($buyableCardsAndCosts['buyableCards']) > 0;

        return [
            'canTakeTokens' => $canTakeTokens,
            'canReserve' => $canReserve,
            'canBuyCard' => $canBuyCard,
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
            'color_name' => $this->getColor($card->color), // for title
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
