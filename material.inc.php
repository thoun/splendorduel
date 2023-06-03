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
require_once(__DIR__.'/modules/php/objects/token.php');
require_once(__DIR__.'/modules/php/objects/card.php');

$this->CARDS = [    
    new CardType(BLUE, VP, [2 => 2, 3 => 3, 4 => 4]),
    new CardType(BLUE, BRACELET, [2 => 1, 3 => 2, 4 => 2]),
    new CardType(BLUE, RECRUIT, [2 => 1, 3 => 1, 4 => 1]),
    new CardType(BLUE, REPUTATION, [2 => 2, 3 => 2, 4 => 3]),

    new CardType(YELLOW, VP, [2 => 3, 3 => 4, 4 => 5]),
    new CardType(YELLOW, BRACELET, [2 => 1, 3 => 1, 4 => 2]),
    new CardType(YELLOW, RECRUIT, [2 => 0, 3 => 1, 4 => 1]),
    new CardType(YELLOW, REPUTATION, [2 => 2, 3 => 2, 4 => 2]),

    new CardType(PURPLE, VP, [2 => 1, 3 => 2, 4 => 4]),
    new CardType(PURPLE, BRACELET, [2 => 2, 3 => 2, 4 => 2]),
    new CardType(PURPLE, RECRUIT, [2 => 2, 3 => 2, 4 => 2]),
    new CardType(PURPLE, REPUTATION, [2 => 1, 3 => 2, 4 => 2]),

    new CardType(GREEN, VP, [2 => 2, 3 => 3, 4 => 4]),
    new CardType(GREEN, BRACELET, [2 => 1, 3 => 1, 4 => 2]),
    new CardType(GREEN, RECRUIT, [2 => 2, 3 => 3, 4 => 3]),
    new CardType(GREEN, REPUTATION, [2 => 1, 3 => 1, 4 => 1]),

    new CardType(RED, VP, [2 => 3, 3 => 3, 4 => 4]),
    new CardType(RED, BRACELET, [2 => 2, 3 => 3, 4 => 3]),
    new CardType(RED, RECRUIT, [2 => 1, 3 => 1, 4 => 2]),
    new CardType(RED, REPUTATION, [2 => 0, 3 => 1, 4 => 1]),
];