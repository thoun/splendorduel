<?php
/**
 *------
 * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
 * SplendorDuel implementation : © <Your name here> <Your email address here>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 * 
 * states.inc.php
 *
 * SplendorDuel game states description
 *
 */

/*
   Game state machine is a tool used to facilitate game developpement by doing common stuff that can be set up
   in a very easy way from this configuration file.

   Please check the BGA Studio presentation about game state to understand this, and associated documentation.

   Summary:

   States types:
   _ activeplayer: in this type of state, we expect some action from the active player.
   _ multipleactiveplayer: in this type of state, we expect some action from multiple players (the active players)
   _ game: this is an intermediary state where we don't expect any actions from players. Your game logic must decide what is the next game state.
   _ manager: special type for initial and final state

   Arguments of game states:
   _ name: the name of the GameState, in order you can recognize it on your own code.
   _ description: the description of the current game state is always displayed in the action status bar on
                  the top of the game. Most of the time this is useless for game state with "game" type.
   _ descriptionmyturn: the description of the current game state when it's your turn.
   _ type: defines the type of game states (activeplayer / multipleactiveplayer / game / manager)
   _ action: name of the method to call when this game state become the current game state. Usually, the
             action method is prefixed by "st" (ex: "stMyGameStateName").
   _ possibleactions: array that specify possible player actions on this step. It allows you to use "checkAction"
                      method on both client side (Javacript: this.checkAction) and server side (PHP: self::checkAction).
   _ transitions: the transitions are the possible paths to go from a game state to another. You must name
                  transitions in order to use transition names in "nextState" PHP method, and use IDs to
                  specify the next game state for each transition.
   _ args: name of the method to call to retrieve arguments for this gamestate. Arguments are sent to the
           client side to be used on "onEnteringState" or to set arguments in the gamestate description.
   _ updateGameProgression: when specified, the game progression is updated (=> call to your getGameProgression
                            method).
*/
require_once("modules/php/constants.inc.php");

$basicGameStates = [

    // The initial state. Please do not modify.
    ST_BGA_GAME_SETUP => [
        "name" => "gameSetup",
        "description" => clienttranslate("Game setup"),
        "type" => "manager",
        "action" => "stGameSetup",
        "transitions" => [ "" => ST_PLAYER_USE_PRIVILEGE ]
    ],
   
    // Final state.
    // Please do not modify.
    ST_END_GAME => [
        "name" => "gameEnd",
        "description" => clienttranslate("End of game"),
        "type" => "manager",
        "action" => "stGameEnd",
        "args" => "argGameEnd",
    ],
];

$playedCardTransitions = [
    "discardTokens" => ST_PLAYER_DISCARD_TOKENS,
    "endTurn" => ST_NEXT_PLAYER,
    "placeJoker" => ST_PLAYER_PLACE_JOKER,
    "takeBoardToken" => ST_PLAYER_TAKE_BOARD_TOKEN,
    "takeOpponentToken" => ST_PLAYER_TAKE_OPPONENT_TOKEN,
    "takeRoyalCard" => ST_PLAYER_TAKE_ROYAL_CARD,
];

$playerActionsGameStates = [

    ST_PLAYER_USE_PRIVILEGE => [
        "name" => "usePrivilege",
        "description" => clienttranslate('${actplayer} can use privilege(s) to take Gem or Pearl'),
        "descriptionmyturn" => clienttranslate('${you} can use privilege(s) to take Gem or Pearl'),
        "type" => "activeplayer",
        "args" => "argUsePrivilege",
        "action" => "stUsePrivilege",
        "possibleactions" => [ 
            "chooseNewCard",
            "skip",
        ],
        "transitions" => [
            "next" => ST_PLAYER_REFILL_BOARD,
        ]
    ],

    ST_PLAYER_REFILL_BOARD => [
        "name" => "refillBoard",
        "description" => clienttranslate('${actplayer} can replenish the board'),
        "descriptionmyturn" => clienttranslate('${you} can replenish the board'),
        "type" => "activeplayer",    
        "args" => "argRefillBoard",
        "action" => "stRefillBoard",
        "possibleactions" => [ 
            "refill",
            "skip",
        ],
        "transitions" => [
            "next" => ST_PLAYER_PLAY_ACTION,
        ],
    ],

    ST_PLAYER_PLAY_ACTION => [
        "name" => "playAction",
        "description" => clienttranslate('${actplayer} must take tokens, reserve a card or buy a card'),
        "descriptionmyturn" => clienttranslate('${you} must take tokens, reserve a card or buy a card'),
        "type" => "activeplayer",
        "args" => "argPlayAction",
        "possibleactions" => [ 
            "takeTokens",
            "reserveCard",
            "buyCard",
        ],
        "transitions" => $playedCardTransitions,
    ],

    ST_PLAYER_PLACE_JOKER => [
        "name" => "placeJoker",
        "description" => clienttranslate('${actplayer} must place the joker card on a column'),
        "descriptionmyturn" => clienttranslate('${you} must place the joker card on a column'),
        "type" => "activeplayer",
        "args" => "argPlaceJoker",
        "possibleactions" => [ 
            "placeJoker",
        ],
        "transitions" => $playedCardTransitions,
    ],

    ST_PLAYER_TAKE_ROYAL_CARD => [
        "name" => "takeRoyalCard",
        "description" => clienttranslate('${actplayer} must take a Royal card'),
        "descriptionmyturn" => clienttranslate('${you} must take a Royal card'),
        "type" => "activeplayer",
        "args" => "argTakeRoyalCard",
        "possibleactions" => [ 
            "takeRoyalCard",
        ],
        "transitions" => $playedCardTransitions,
    ],

    ST_PLAYER_TAKE_BOARD_TOKEN => [
        "name" => "takeBoardToken",
        "description" => clienttranslate('${actplayer} must take a ${color} token from the board'),
        "descriptionmyturn" => clienttranslate('${you} must take a ${color} token from the board'),
        "type" => "activeplayer",
        "args" => "argTakeBoardToken",
        "action" => "stTakeBoardToken",
        "possibleactions" => [ 
            "takeBoardToken",
        ],
        "transitions" => $playedCardTransitions,
    ],

    ST_PLAYER_TAKE_OPPONENT_TOKEN => [
        "name" => "takeOpponentToken",
        "description" => clienttranslate('${actplayer} must take a token from opponent'),
        "descriptionmyturn" => clienttranslate('${you} must take a token from opponent'),
        "type" => "activeplayer",
        "args" => "argTakeOpponentToken",
        "action" => "stTakeOpponentToken",
        "possibleactions" => [ 
            "takeOpponentToken",
        ],
        "transitions" => $playedCardTransitions,
    ],

    ST_PLAYER_DISCARD_TOKENS => [
        "name" => "discardTokens",
        "description" => clienttranslate('${actplayer} must discard down to 10 tokens'),
        "descriptionmyturn" => clienttranslate('${you} must discard down to 10 tokens'),
        "type" => "activeplayer",
        "action" => "stDiscardTokens",
        "possibleactions" => [ 
            "discardTokens",
        ],
        "transitions" => [
            "next" => ST_NEXT_PLAYER,
        ]
    ],
];

$gameGameStates = [

    ST_NEXT_PLAYER => [
        "name" => "nextPlayer",
        "description" => "",
        "type" => "game",
        "action" => "stNextPlayer",
        "transitions" => [
            "nextPlayer" => ST_PLAYER_USE_PRIVILEGE,
            "endScore" => ST_END_SCORE,
        ],
    ],

    ST_END_SCORE => [
        "name" => "endScore",
        "description" => "",
        "type" => "game",
        "action" => "stEndScore",
        "transitions" => [
            "endGame" => ST_END_GAME,
        ],
    ],
];
 
$machinestates = $basicGameStates + $playerActionsGameStates + $gameGameStates;



