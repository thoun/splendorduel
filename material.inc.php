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
 * material.inc.php
 *
 * SplendorDuel game material description
 *
 * Here, you can describe the material of your game with PHP variables.
 *   
 * This file is loaded in your game logic class constructor, ie these variables
 * are available everywhere in your game logic code.
 *
 */

require_once(__DIR__.'/modules/php/constants.inc.php');
require_once(__DIR__.'/modules/php/objects/card.php');
require_once(__DIR__.'/modules/php/objects/royal-card.php');

$this->CARDS = [    // TODO    
    1 => [ // level 1 cards
        1 => new CardType(BLUE, [BLUE => 2, RED => 1]),
        2 => new CardType(BLUE, [BLUE => 2, RED => 1]),
        new CardType(BLUE, [BLUE => 2, RED => 1]),
        new CardType(BLUE, [BLUE => 2, RED => 1]),

        new CardType(WHITE, [BLUE => 2, RED => 1]),
        new CardType(WHITE, [BLUE => 2, RED => 1]),
        new CardType(WHITE, [BLUE => 2, RED => 1]),
        new CardType(WHITE, [BLUE => 2, RED => 1]),

        new CardType(BLACK, [BLUE => 2, RED => 1]),
        new CardType(BLACK, [BLUE => 2, RED => 1]),
        new CardType(BLACK, [BLUE => 2, RED => 1]),
        new CardType(BLACK, [BLUE => 2, RED => 1]),

        new CardType(GREEN, [BLUE => 2, RED => 1]),
        new CardType(GREEN, [BLUE => 2, RED => 1]),
        new CardType(GREEN, [BLUE => 2, RED => 1]),
        new CardType(GREEN, [BLUE => 2, RED => 1]),

        new CardType(RED, [BLUE => 2, RED => 1]),
        new CardType(RED, [BLUE => 2, RED => 1]),
        new CardType(RED, [BLUE => 2, RED => 1]),
        new CardType(RED, [BLUE => 2, RED => 1]),
    ],    
    2 => [ // level 2 cards
        1 => new CardType(BLUE, [BLUE => 2, RED => 1]),
        new CardType(BLUE, [BLUE => 2, RED => 1]),
        new CardType(BLUE, [BLUE => 2, RED => 1]),
        new CardType(BLUE, [BLUE => 2, RED => 1]),

        new CardType(WHITE, [BLUE => 2, RED => 1]),
        new CardType(WHITE, [BLUE => 2, RED => 1]),
        new CardType(WHITE, [BLUE => 2, RED => 1]),
        new CardType(WHITE, [BLUE => 2, RED => 1]),

        new CardType(BLACK, [BLUE => 2, RED => 1]),
        new CardType(BLACK, [BLUE => 2, RED => 1]),
        new CardType(BLACK, [BLUE => 2, RED => 1]),
        new CardType(BLACK, [BLUE => 2, RED => 1]),

        new CardType(GREEN, [BLUE => 2, RED => 1]),
        new CardType(GREEN, [BLUE => 2, RED => 1]),
        new CardType(GREEN, [BLUE => 2, RED => 1]),
        new CardType(GREEN, [BLUE => 2, RED => 1]),

        new CardType(RED, [BLUE => 2, RED => 1]),
        new CardType(RED, [BLUE => 2, RED => 1]),
        new CardType(RED, [BLUE => 2, RED => 1]),
        new CardType(RED, [BLUE => 2, RED => 1]),
    ],    
    3 => [ // level 3 cards
        1 => new CardType(BLUE, [BLUE => 2, RED => 1]),
        new CardType(BLUE, [BLUE => 2, RED => 1]),
        new CardType(BLUE, [BLUE => 2, RED => 1]),
        new CardType(BLUE, [BLUE => 2, RED => 1]),

        new CardType(WHITE, [BLUE => 2, RED => 1]),
        new CardType(WHITE, [BLUE => 2, RED => 1]),
        new CardType(WHITE, [BLUE => 2, RED => 1]),
        new CardType(WHITE, [BLUE => 2, RED => 1]),

        new CardType(BLACK, [BLUE => 2, RED => 1]),
        new CardType(BLACK, [BLUE => 2, RED => 1]),
        new CardType(BLACK, [BLUE => 2, RED => 1]),
        new CardType(BLACK, [BLUE => 2, RED => 1]),

        new CardType(GREEN, [BLUE => 2, RED => 1]),
        new CardType(GREEN, [BLUE => 2, RED => 1]),
        new CardType(GREEN, [BLUE => 2, RED => 1]),
        new CardType(GREEN, [BLUE => 2, RED => 1]),

        new CardType(RED, [BLUE => 2, RED => 1]),
        new CardType(RED, [BLUE => 2, RED => 1]),
        new CardType(RED, [BLUE => 2, RED => 1]),
        new CardType(RED, [BLUE => 2, RED => 1]),
    ],
];

$this->ROYAL_CARDS = [
    1 => new RoyalCardType(2, POWER_PLAY_AGAIN),
    2 => new RoyalCardType(2, POWER_TAKE_PRIVILEGE),
    3 => new RoyalCardType(3),
    4 => new RoyalCardType(2, POWER_TAKE_GEM_FROM_OPPONENT),
];