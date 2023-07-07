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

    function stTakeBoardToken() {
        $color = $this->argTakeBoardToken()['color'];
        $board = $this->getBoard();

        if (!$this->array_some($board, fn($token) => $token->color == $color)) {
            self::notifyAllPlayers('log', clienttranslate('Card ability is skipped, as there is no ${color_name} token on the board'), [
                'color_name' => $this->getColor($color), // for logs
            ]);

            $playerId = intval($this->getActivePlayerId());
            $id = intval($this->getGameStateValue(PLAYED_CARD));
            $card = $this->getCardFromDb($this->cards->getCard($id));
            $this->applyEndTurn($playerId, $card, true);
        }
    }

    function stTakeOpponentToken() {
        $opponentId = $this->argTakeOpponentToken()['opponentId'];
        $tokens = $this->getPlayerTokens($opponentId);

        if (!$this->array_some($tokens, fn($token) => $token->type == 2)) {
            self::notifyAllPlayers('log', clienttranslate("Card ability is skipped, as your opponent doesn't have any Gem or Pearl"), [
            ]);

            $playerId = intval($this->getActivePlayerId());
            $id = intval($this->getGameStateValue(PLAYED_CARD));
            $card = $this->getCardFromDb($this->cards->getCard($id));
            $this->applyEndTurn($playerId, $card, true);
        }
    }

    function stNextPlayer() {
        $playerId = intval($this->getActivePlayerId());

        $this->refillCards();

        $endReason = $this->getEndReason($playerId);

        if ($endReason > 0) {
            $this->DbQuery("UPDATE player SET `player_score` = 1 WHERE player_id = $playerId");

            $message = null;
            switch ($endReason) {
                case 1:
                    $message = clienttranslate('${player_name} reached 20 points and wins the game!');
                    break;
                case 2:
                    $message = clienttranslate('${player_name} reached 10 crowns and wins the game!');
                    break;
                case 3:
                    $message = clienttranslate('${player_name} reached 10 points in a single column and wins the game!');
                    break;
            }
                
            self::notifyAllPlayers('win', $message, [
                'playerId' => $playerId,
                'player_name' => $this->getPlayerName($playerId),
            ]);
        }

        if (boolval($this->getGameStateValue(PLAY_AGAIN))) {
            self::notifyAllPlayers('log', clienttranslate('${player_name} takes another turn with played card effect'), [
                'playerId' => $playerId,
                'player_name' => $this->getPlayerName($playerId),
            ]);

            $this->setGameStateValue(PLAY_AGAIN, 0);
        } else {
            $this->activeNextPlayer();
            $playerId = $this->getActivePlayerId();
        }

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
