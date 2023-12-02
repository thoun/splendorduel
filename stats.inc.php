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
 * stats.inc.php
 *
 * SplendorDuel game statistics description
 *
 */

/*
    In this file, you are describing game statistics, that will be displayed at the end of the
    game.
    
    !! After modifying this file, you must use "Reload  statistics configuration" in BGA Studio backoffice
    ("Control Panel" / "Manage Game" / "Your Game")
    
    There are 2 types of statistics:
    _ table statistics, that are not associated to a specific player (ie: 1 value for each game).
    _ player statistics, that are associated to each players (ie: 1 value for each player in the game).

    Statistics types can be "int" for integer, "float" for floating point values, and "bool" for boolean
    
    Once you defined your statistics there, you can start using "initStat", "setStat" and "incStat" method
    in your game logic, using statistics names defined below.
    
    !! It is not a good idea to modify this file when a game is running !!

    If your game is already public on BGA, please read the following before any change:
    http://en.doc.boardgamearena.com/Post-release_phase#Changes_that_breaks_the_games_in_progress
    
    Notes:
    * Statistic index is the reference used in setStat/incStat/initStat PHP method
    * Statistic index must contains alphanumerical characters and no space. Example: 'turn_played'
    * Statistics IDs must be >=10
    * Two table statistics can't share the same ID, two player statistics can't share the same ID
    * A table statistic can have the same ID than a player statistics
    * Statistics ID is the reference used by BGA website. If you change the ID, you lost all historical statistic data. Do NOT re-use an ID of a deleted statistic
    * Statistic name is the English description of the statistic as shown to players
    
*/

$commonStats = [
    // win
    "endReason1" => [
        "id" => 11,
        "name" => totranslate("Win with 20 points"),
        "type" => "bool"
    ],
    "endReason2" => [
        "id" => 12,
        "name" => totranslate("Win with 10 crowns"),
        "type" => "bool"
    ],
    "endReason3" => [
        "id" => 13,
        "name" => totranslate("Win with 10 points in a single column"),
        "type" => "bool"
    ],

    // optional actions
    "tokensWithPrivileges" => [
        "id" => 20,
        "name" => totranslate("Gem or Pearl tokens gained using privileges"),
        "type" => "int"
    ],
    "replenish" => [
        "id" => 21,
        "name" => totranslate("Given privileges (replenish the Board)"),
        "type" => "int"
    ],
    "givenPrivileges3equal" => [
        "id" => 22,
        "name" => totranslate("Given privileges (3 equal gems)"),
        "type" => "int"
    ],
    "givenPrivileges2pearls" => [
        "id" => 23,
        "name" => totranslate("Given privileges (2 pearls)"),
        "type" => "int"
    ],

    "privileges" => [
        "id" => 25,
        "name" => totranslate("Privileges gained"),
        "type" => "int"
    ],
    "privilegesFromTable" => [
        "id" => 26,
        "name" => totranslate("Privileges gained from table"),
        "type" => "int"
    ],
    "privilegesFromOpponent" => [
        "id" => 27,
        "name" => totranslate("Privileges gained from oponent"),
        "type" => "int"
    ],

    // tokens actions
    "takeTokens1" => [
        "id" => 31,
        "name" => totranslate("Take 1 token action"),
        "type" => "int"
    ],
    "takeTokens2" => [
        "id" => 32,
        "name" => totranslate("Take 2 tokens action"),
        "type" => "int"
    ],
    "takeTokens3" => [
        "id" => 33,
        "name" => totranslate("Take 3 tokens action"),
        "type" => "int"
    ],

    "reserveCard1" => [
        "id" => 36,
        "name" => totranslate("Reserved level 1 card"),
        "type" => "int"
    ],
    "reserveCard2" => [
        "id" => 37,
        "name" => totranslate("Reserved level 2 card"),
        "type" => "int"
    ],
    "reserveCard3" => [
        "id" => 38,
        "name" => totranslate("Reserved level 3 card"),
        "type" => "int"
    ],
    
    // cards
    "purchaseCard1" => [
        "id" => 41,
        "name" => totranslate("Purchased level 1 card"),
        "type" => "int"
    ],    
    "purchaseCard2" => [
        "id" => 42,
        "name" => totranslate("Purchased level 2 card"),
        "type" => "int"
    ],
    "purchaseCard3" => [
        "id" => 43,
        "name" => totranslate("Purchased level 3 card"),
        "type" => "int"
    ],

    // abilities
    "ability1" => [
        "id" => 51,
        "name" => totranslate("Ability used : Bonus turn"),
        "type" => "int"
    ],
    "ability2" => [
        "id" => 52,
        "name" => totranslate("Ability used : Joker color"),
        "type" => "int"
    ],
    "ability3" => [
        "id" => 53,
        "name" => totranslate("Ability used : Take 1 color token from board"),
        "type" => "int"
    ],
    "ability4" => [
        "id" => 54,
        "name" => totranslate("Ability used : Take 1 Privilege"),
        "type" => "int"
    ],
    "ability5" => [
        "id" => 55,
        "name" => totranslate("Ability used : Take 1 Gem or Pearl token from opponent"),
        "type" => "int"
    ],

    // other
    "discardedTokens" => [
        "id" => 60,
        "name" => totranslate("Discarded tokens (more than 10 tokens)"),
        "type" => "int"
    ],
];

$stats_type = [
    // Statistics global to table
    "table" => $commonStats + [
        "roundNumber" => [
            "id" => 10,
            "name" => totranslate("Number of rounds"),
            "type" => "int"
        ],
    ],
    
    // Statistics existing for each player
    "player" => $commonStats + [
        // cards
        "crowns" => [
            "id" => 44,
            "name" => totranslate("Crowns"),
            "type" => "int"
        ],
        "royalCards" => [
            "id" => 45,
            "name" => totranslate("Royal cards"),
            "type" => "int"
        ],
    ],
];
