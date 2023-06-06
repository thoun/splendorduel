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
} 
