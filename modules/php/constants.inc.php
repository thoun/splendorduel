<?php

/*
 * Token types
 */
define('A', 'A');
define('B', 'B');

/*
 * Color
 */
define('EQUAL', -1);
define('DIFFERENT', 0);
define('RED', 1);
define('YELLOW', 2);
define('GREEN', 3);
define('BLUE', 4);
define('PURPLE', 5);

/*
 * Gain
 */
define('VP', 1);
define('BRACELET', 2);
define('RECRUIT', 3);
define('REPUTATION', 4);
define('CARD', 5);

/*
 * State constants
 */
define('ST_BGA_GAME_SETUP', 1);

define('ST_PLAYER_USE_PRIVILEGE', 10);

define('ST_PLAYER_REFILL_BOARD', 20);

define('ST_PLAYER_PLAY_ACTION', 30);

define('ST_PLAYER_RESERVE_CARD', 35);

define('ST_PLAYER_PLACE_JOKER', 40);

define('ST_PLAYER_TAKE_ROYAL_CARD', 50);

define('ST_PLAYER_TAKE_BOARD_TOKEN', 55);

define('ST_PLAYER_TAKE_OPPONENT_TOKEN', 60);

define('ST_PLAYER_DISCARD_TOKENS', 80);

define('ST_NEXT_PLAYER', 85);

define('ST_END_SCORE', 90);

define('ST_END_GAME', 99);
define('END_SCORE', 100);

/*
 * Constants
 */
define('LAST_TURN', 10);
define('RECRUIT_DONE', 11);
define('EXPLORE_DONE', 12);
define('TRADE_DONE', 15);
define('GO_DISCARD_TABLE_CARD', 16);
define('GO_RESERVE', 17);
define('PLAYED_CARD_COLOR', 20);
define('SELECTED_DESTINATION', 21);
define('COMPLETED_LINES', 22);

/*
 * Options
 */

/*
 * Global variables
 */
define('REMAINING_CARDS_TO_TAKE', 'RemainingCardsToTake');
//define('UNDO', 'undo');

?>
