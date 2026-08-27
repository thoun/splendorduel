<?php
declare(strict_types=1);

namespace Bga\Games\SplendorDuel\States;

use Bga\GameFramework\StateType;
use Bga\Games\SplendorDuel\Game;

class EndScore extends \Bga\GameFramework\States\GameState {
    public function __construct(protected Game $game)
    {
        parent::__construct($game,
            id: \ST_END_SCORE,
            type: StateType::GAME,
        );
    }

    public function onEnteringState(): int {
        return \ST_END_GAME;
    }
}
