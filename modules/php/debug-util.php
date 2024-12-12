<?php

trait DebugUtilTrait {

//////////////////////////////////////////////////////////////////////////////
//////////// Utility functions
////////////

    function debugSetup() {
        if ($this->getBgaEnvironment() != 'studio') { 
            return;
        } 

        //$this->debugSetPlayerScore(2343492, 10);
        //$this->debugSetScore(39);
        //$this->debugSetReputation(8);

        //$this->debugAddDestinations(2343492, 'A', 15);
        //$this->debugAddDestinations(2343492, 'B', 10);

        //$this->cards->pickCardsForLocation(13, 'deck', 'void');
        
        //$this->debugLastTurn();
    }

    function debug_Tokens() {
        $playerId = intval($this->getActivePlayerId());
        $this->tokens->moveAllCardsInLocation('board', 'player', null, $playerId);
    }

    function debug_d() {
        $this->cards->moveCard(60, 'reserved', 2343492);
        $this->royalCards->moveCard(4, 'deck');
        $this->gamestate->jumpToState(ST_PLAYER_PLAY_ACTION);
    }

    function debug($debugData) {
        if ($this->getBgaEnvironment() != 'studio') { 
            return;
        }die('debug data : '.json_encode($debugData));
    }
}
