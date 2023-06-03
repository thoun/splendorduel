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
        
        // TODO

        return [        
            // TODO
        ];
    }

    function argChooseNewCard() {
        $playerId = intval($this->getActivePlayerId());
        $player = $this->getPlayer($playerId);

        $freeColor = intval($this->getGameStateValue(PLAYED_CARD_COLOR));
        $centerCards = $this->getCardsByLocation('slot');

        $allFree = false;

        return [
            'centerCards' => $centerCards,
            'freeColor' => $freeColor,
            'recruits' => $player->recruit,
            'allFree' => $allFree,
        ];
    }

    function argPayDestination() {
        $playerId = intval($this->getActivePlayerId());

        $selectedDestination = $this->getDestinationFromDb($this->tokens->getCard(intval($this->getGameStateValue(SELECTED_DESTINATION))));

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
