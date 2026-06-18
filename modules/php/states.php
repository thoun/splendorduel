<?php

use Bga\GameFrameworkPrototype\Helpers\Arrays;

trait StateTrait {

//////////////////////////////////////////////////////////////////////////////
//////////// Game state actions
////////////

    /*
        Here, you can create methods defined as "game state actions" (see "action" property in states.inc.php).
        The action method of state X is called everytime the current game state is set to X.
    */

    function stTakeBoardToken() {
        $args = $this->argTakeBoardToken();
        $color = $args['color'];
        $board = $this->getBoard();

        $canTakeColors = $color === MULTICOLOR || $args['canTakeAnyColorOrTwoOfColor'] ? [0, 1, 2 ,3 ,4 ,5 ,6] : [$color];

        if (!$this->array_some($board, fn($token) => in_array($token->color, $canTakeColors))) {
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

    function stTakeRoyalCard() {
        if (count($this->getRoyalCardsByLocation('deck')) == 0) {
            $this->gamestate->jumpToState(ST_PLAYER_BEFORE_END_TURN);
        }
    }

    function stBeforeEndTurn() {
        $args = $this->argBeforeEndTurn();
        if ($args['_no_notify']) {
            $this->gamestate->nextState('next');
        }
    }

    function stDiscardTokens() {
        $args = $this->argDiscardTokens();
        if ($args['_no_notify']) {
            $this->gamestate->nextState('next');
        }
    }

    function stNextPlayer() {    
        $this->incStat(1, 'roundNumber');
        $this->globals->delete(ROYAL_CARDS_WITH_COUNTERFEITER_POWER, RESERVE_FROM_DECK, COUNTERFEITER13_USED);

        $playerId = intval($this->getActivePlayerId());

        $this->refillCards();
        if ($this->isCounterfeiterExpansion()) {
            $this->counterfeiterCards->refill();
        }

        $endReasons = $this->getEndReasons($playerId);

        if (count($endReasons) > 0) {
            $this->DbQuery("UPDATE player SET `player_score` = 1 WHERE player_id = $playerId");

            $royalCards = $this->getRoyalCardsByLocation('player', $playerId);
            
            $goal = null;
            $message = null;
            switch ($endReasons[0]) {
                case 1:
                    $goal = 20;
                    $message = clienttranslate('${player_name} reached ${goal} points and wins the game!');
                    break;
                case 2:
                    $goal = 10;
                    if (Arrays::some($royalCards, fn($royalCard) => in_array(POWER_WIN_9CROWNS, $royalCard->power))) {
                        $goal = 9;
                    } 
                    $message = clienttranslate('${player_name} reached ${goal} crowns and wins the game!');
                    break;
                case 3:
                    $goal = 10;
                    if (Arrays::some($royalCards, fn($royalCard) => in_array(POWER_WIN_9PTS_SAME_COLOR, $royalCard->power))) {
                        $goal = 9;
                    }
                    $message = clienttranslate('${player_name} reached ${goal} points in a single column and wins the game!');
                    break;
            }
                
            self::notifyAllPlayers('win', $message, [
                'playerId' => $playerId,
                'player_name' => $this->getPlayerNameById($playerId),
                'endReasons' => $endReasons,
                'goal' => $goal, // for logs
            ]);

            foreach ($endReasons as $endReason) {
                $this->setStat(1, 'endReason'.$endReason);
                $this->setStat(1, 'endReason'.$endReason, $playerId);
            }
        } else if (boolval($this->getGameStateValue(PLAY_AGAIN))) {
            self::notifyAllPlayers('log', clienttranslate('${player_name} takes another turn with played card effect'), [
                'playerId' => $playerId,
                'player_name' => $this->getPlayerNameById($playerId),
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
