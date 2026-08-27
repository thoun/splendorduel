<?php
declare(strict_types=1);

namespace Bga\Games\SplendorDuel\States;

use Bga\GameFramework\StateType;
use Bga\GameFrameworkPrototype\Helpers\Arrays;
use Bga\Games\SplendorDuel\Game;

class NextPlayer extends \Bga\GameFramework\States\GameState {
    public function __construct(protected Game $game)
    {
        parent::__construct($game,
            id: \ST_NEXT_PLAYER,
            type: StateType::GAME,
            updateGameProgression: true,
        );
    }

    public function onEnteringState(int $activePlayerId): int|string {
        $this->bga->tableStats->inc('roundNumber', 1);
        $this->game->globals->delete(\ROYAL_CARDS_WITH_COUNTERFEITER_POWER, \RESERVE_FROM_DECK, \COUNTERFEITER13_USED);

        $playerId = $activePlayerId;

        $this->game->refillCards();
        if ($this->game->isCounterfeiterExpansion()) {
            $this->game->counterfeiterCards->refill();
        }

        $endReasons = $this->game->getEndReasons($playerId);

        if (count($endReasons) > 0) {
            $this->game->DbQuery("UPDATE player SET `player_score` = 1 WHERE player_id = $playerId");

            $royalCards = $this->game->getRoyalCardsByLocation('player', $playerId);
            
            $goal = null;
            $message = null;
            switch ($endReasons[0]) {
                case 1:
                    $goal = 20;
                    $message = clienttranslate('${player_name} reached ${goal} points and wins the game!');
                    break;
                case 2:
                    $goal = 10;
                    if (Arrays::some($royalCards, fn($royalCard) => in_array(\POWER_WIN_9CROWNS, $royalCard->power))) {
                        $goal = 9;
                    }
                    $message = clienttranslate('${player_name} reached ${goal} crowns and wins the game!');
                    break;
                case 3:
                    $goal = 10;
                    if (Arrays::some($royalCards, fn($royalCard) => in_array(\POWER_WIN_9PTS_SAME_COLOR, $royalCard->power))) {
                        $goal = 9;
                    }
                    $message = clienttranslate('${player_name} reached ${goal} points in a single column and wins the game!');
                    break;
            }
                
            $this->bga->notify->all('win', $message, [
                'playerId' => $playerId,
                'player_name' => $this->game->getPlayerNameById($playerId),
                'endReasons' => $endReasons,
                'goal' => $goal, // for logs
            ]);

            foreach ($endReasons as $endReason) {
                $this->bga->tableStats->set('endReason'.$endReason, 1);
                $this->bga->playerStats->set('endReason'.$endReason, 1, $playerId);
            }
        } else if (boolval($this->game->getGameStateValue((string)\PLAY_AGAIN))) {
            $this->bga->notify->all('log', clienttranslate('${player_name} takes another turn with played card effect'), [
                'playerId' => $playerId,
                'player_name' => $this->game->getPlayerNameById($playerId),
            ]);

            $this->game->setGameStateValue((string)\PLAY_AGAIN, 0);
            
            $this->bga->tableStats->inc('ability1', 1);
            $this->bga->playerStats->inc('ability1', 1, $playerId);
        } else {
            $playerAntiPlayingTurns = $this->game->getPlayerAntiPlayingTurns($playerId);
            if ($playerAntiPlayingTurns > 0 && !$this->game->playerHasAllGoldAndPearls($playerId)) {
                $this->game->DbQuery("UPDATE player SET player_anti_playing_turns = 0 WHERE player_id = $playerId");
                $playerAntiPlayingTurns = 0;
            }
            if ($playerAntiPlayingTurns >= 3) {
                $this->bga->tableStats->inc('antiPlayingEndRound', 1);
            }

            $this->game->activeNextPlayer();
            $playerId = (int)$this->game->getActivePlayerId();

            if ($this->game->playerHasAllGoldAndPearls($playerId)) {
                // if the player has all 3 golds and 2 pearls at the beginning of his turn
                $this->game->DbQuery("UPDATE player SET player_anti_playing_turns = player_anti_playing_turns + 1 WHERE player_id = $playerId");

                if ($this->game->getPlayerAntiPlayingTurns($playerId) >= 3) {
                    $this->bga->tableStats->inc('antiPlayingEndRound', 1);
                }
            }
        }

        $this->game->giveExtraTime($playerId);

        $this->game->setGameStateValue((string)\PLAYER_REFILLED, 0);

        return count($endReasons) > 0 ? EndScore::class : \ST_PLAYER_PLAY_ACTION;
    }
}
