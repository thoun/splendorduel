<?php

trait StateTrait {

//////////////////////////////////////////////////////////////////////////////
//////////// Game state actions
////////////

    /*
        Here, you can create methods defined as "game state actions" (see "action" property in states.inc.php).
        The action method of state X is called everytime the current game state is set to X.
    */

    function stUsePrivilege() {
        $playerId = intval($this->getActivePlayerId());

        $canUsePrivilege = $this->getPlayerPrivileges($playerId) > 0;

        if ($canUsePrivilege && count($this->getBoard()) == 0) {
            $canUsePrivilege = false;
        }
        
        if (!$canUsePrivilege) {
            $this->gamestate->nextState('next');
        }
    }

    function stRefillBoard() {
        $args = $this->argRefillBoard();
        
        if (!$args['canRefill']) {
            $this->gamestate->nextState('next');
        }
    }

    function stNextPlayer() {
        $playerId = intval($this->getActivePlayerId());

        $endReason = $this->getEndReason($playerId);

        $this->activeNextPlayer();
        $playerId = $this->getActivePlayerId();

        $this->giveExtraTime($playerId);

        $this->gamestate->nextState($endReason > 0 ? 'endScore' : 'nextPlayer');
    }

    function stEndScore() {
        /*$playersIds = $this->getPlayersIds();

        foreach($playersIds as $playerId) {
            $player = $this->getPlayer($playerId);
            //$scoreAux = $player->recruit + $player->bracelet;
            //$this->DbQuery("UPDATE player SET player_score_aux = player_recruit + player_bracelet WHERE player_id = $playerId");
        }
        $this->DbQuery("UPDATE player SET player_score_aux = player_recruit + player_bracelet");*/

        $this->gamestate->nextState('endGame');
    }
}
