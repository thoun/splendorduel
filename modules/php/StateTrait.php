<?php
declare(strict_types=1);

namespace Bga\Games\SplendorDuel;

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

        $canTakeColors = $color === MULTICOLOR || ($args['canTakeAnyColorOrTwoOfColor'] ?? false) ? [0, 1, 2 ,3 ,4 ,5 ,6] : [$color];

        if (!array_any($board, fn($token) => in_array($token->color, $canTakeColors))) {
            $this->bga->notify->all('log', clienttranslate('Card ability is skipped, as there is no ${color_name} token on the board'), [
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

        if (!array_any($tokens, fn($token) => $token->type == 2)) {
            $this->bga->notify->all('log', clienttranslate("Card ability is skipped, as your opponent doesn't have any Gem or Pearl"), [
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

}
