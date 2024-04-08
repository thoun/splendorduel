<?php

trait StateTrait {

//////////////////////////////////////////////////////////////////////////////
//////////// Game state actions
////////////

    /*
        Here, you can create methods defined as "game state actions" (see "action" property in states.inc.php).
        The action method of state X is called everytime the current game state is set to X.
    */

    function stTakeBoardToken() {
        $color = $this->argTakeBoardToken()['color'];
        $board = $this->getBoard();

        if (!$this->array_some($board, fn($token) => $token->color == $color)) {
            self::notifyAllPlayers('log', clienttranslate('Card ability is skipped, as there is no ${color_name} token on the board'), [
                'color_name' => $this->getColorName($color), // for logs
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
        $this->incStat(1, 'roundNumber');

        $playerId = intval($this->getActivePlayerId());

        $this->refillCards();

        $endReasons = $this->getEndReasons($playerId);

        if (count($endReasons) > 0) {
            $this->DbQuery("UPDATE player SET `player_score` = 1 WHERE player_id = $playerId");

            $message = null;
            switch ($endReasons[0]) {
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
                'endReasons' => $endReasons,
            ]);

            foreach ($endReasons as $endReason) {
                $this->setStat(1, 'endReason'.$endReason);
                $this->setStat(1, 'endReason'.$endReason, $playerId);
            }
        } else if (boolval($this->getGameStateValue(PLAY_AGAIN))) {
            self::notifyAllPlayers('log', clienttranslate('${player_name} takes another turn with played card effect'), [
                'playerId' => $playerId,
                'player_name' => $this->getPlayerName($playerId),
            ]);

            $this->setGameStateValue(PLAY_AGAIN, 0);
            
            $this->incStat(1, 'ability1');
            $this->incStat(1, 'ability1', $playerId);
        } else {
            $playerAntiPlayingTurns = $this->getPlayerAntiPlayingTurns($playerId);
            if ($playerAntiPlayingTurns > 0 && !$this->playerHasAllGoldAndPearls($playerId)) {
                $this->DbQuery("UPDATE player SET player_anti_playing_turns = 0 WHERE player_id = $playerId");
                $playerAntiPlayingTurns = 0;
            }
            if ($playerAntiPlayingTurns >= 3) {
                $this->incStat(1, 'antiPlayingEndRound');
            }

            $this->activeNextPlayer();
            $playerId = $this->getActivePlayerId();

            if ($this->playerHasAllGoldAndPearls($playerId)) {
                // if the player has all 3 golds and 2 pearls at the beginning of his turn
                $this->DbQuery("UPDATE player SET player_anti_playing_turns = player_anti_playing_turns + 1 WHERE player_id = $playerId");

                if ($this->getPlayerAntiPlayingTurns($playerId) >= 3) {
                    $this->incStat(1, 'antiPlayingStartRound');
                }        
            }
        }

        $this->giveExtraTime($playerId);

        $this->setGameStateValue(PLAYER_REFILLED, 0);

        $this->gamestate->nextState(count($endReasons) > 0 ? 'endScore' : 'nextPlayer');
    }

    function stEndScore() {
        $this->gamestate->nextState('endGame');
    }
}
