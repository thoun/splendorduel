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

        $canTakeTokens = count($this->getBoard()) > 0;
        $canReserve = true; // TODO
        $canBuyCard = true; // TODO
        
        // TODO set possibilities

        return [
            'canTakeTokens' => $canTakeTokens,
            'canReserve' => $canReserve,
            'canBuyCard' => $canBuyCard,
        ];
    }

    function argPayDestination() {
        $playerId = intval($this->getActivePlayerId());

        $selectedDestination = $this->getTokenFromDb($this->tokens->getCard(intval($this->getGameStateValue(SELECTED_DESTINATION))));

        return [
            'selectedDestination' => $selectedDestination,
            'recruits' => $this->getPlayer($playerId)->recruit,
        ];
    }

    function argTrade() {
        $playerId = intval($this->getActivePlayerId());

        $bracelets = $this->getPlayer($playerId)->bracelet;
        $gainsByBracelets = [];
        for ($i = 1; $i <= 3; $i++) {
            $gainsByBracelets[$i] = count($this->getTradeGains($playerId, $i));
        }

        return [
            'bracelets' => $bracelets,
            'gainsByBracelets' => $gainsByBracelets,
        ];
    }
} 
