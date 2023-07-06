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

$this->CARDS = [
    1 => [ // level 1 cards
        1 => new CardType(WHITE, [BLUE => 1, GREEN => 1, RED => 1, BLACK => 1], [WHITE => 1]),
        2 => new CardType(WHITE, [BLUE => 3], [WHITE => 1], 0, 1),
        3 => new CardType(WHITE, [BLUE => 2, GREEN => 2, PEARL => 1], [WHITE => 1], 0, 0, POWER_PLAY_AGAIN),
        4 => new CardType(WHITE, [RED => 2, BLACK => 2], [WHITE => 1], 0, 0, POWER_TAKE_GEM_FROM_TABLE),
        5 => new CardType(WHITE, [GREEN => 2, RED => 3], [WHITE => 1], 1),

        6 => new CardType(BLUE, [WHITE => 1, GREEN => 1, RED => 1, BLACK => 1], [BLUE => 1]),
        7 => new CardType(BLUE, [GREEN => 3], [BLUE => 1], 0, 1),
        8 => new CardType(BLUE, [GREEN => 2, RED => 2, PEARL => 1], [BLUE => 1], 0, 0, POWER_PLAY_AGAIN),
        9 => new CardType(BLUE, [WHITE => 2, BLACK => 2], [BLUE => 1], 0, 0, POWER_TAKE_GEM_FROM_TABLE),
        10 => new CardType(BLUE, [RED => 2, BLACK => 3], [BLUE => 1], 1),

        11 => new CardType(GREEN, [WHITE => 1, BLUE => 1, RED => 1, BLACK => 1], [GREEN => 1]),
        12 => new CardType(GREEN, [RED => 3], [GREEN => 1], 0, 1),
        13 => new CardType(GREEN, [RED => 2, BLACK => 2, PEARL => 1], [GREEN => 1], 0, 0, POWER_PLAY_AGAIN),
        14 => new CardType(GREEN, [WHITE => 2, BLUE => 2], [GREEN => 1], 0, 0, POWER_TAKE_GEM_FROM_TABLE),
        15 => new CardType(GREEN, [WHITE => 3, BLACK => 2], [GREEN => 1], 1),

        16 => new CardType(BLACK, [WHITE => 1, BLUE => 1, GREEN => 1, RED => 1], [BLACK => 1]),
        17 => new CardType(BLACK, [WHITE => 3], [BLACK => 1], 0, 1),
        18 => new CardType(BLACK, [WHITE => 2, BLUE => 2, PEARL => 1], [BLACK => 1], 0, 0, POWER_PLAY_AGAIN),
        19 => new CardType(BLACK, [GREEN => 2, RED => 2], [BLACK => 1], 0, 0, POWER_TAKE_GEM_FROM_TABLE),
        20 => new CardType(BLACK, [BLUE => 2, GREEN => 3], [BLACK => 1], 1),

        21 => new CardType(RED, [WHITE => 1, BLUE => 1, GREEN => 1, BLACK => 1], [RED => 1]),
        22 => new CardType(RED, [BLACK => 3], [RED => 1], 0, 1),
        23 => new CardType(RED, [WHITE => 2, BLACK => 2, PEARL => 1], [RED => 1], 0, 0, POWER_PLAY_AGAIN),
        24 => new CardType(RED, [BLUE => 2, GREEN => 2], [RED => 1], 0, 0, POWER_TAKE_GEM_FROM_TABLE),
        25 => new CardType(RED, [WHITE => 2, BLUE => 3], [RED => 1], 1),

        26 => new CardType(GRAY, [BLACK => 4, PEARL => 1], [MULTICOLOR => 1], 1, 0, POWER_MULTICOLOR),
        27 => new CardType(GRAY, [WHITE => 4, PEARL => 1], [MULTICOLOR => 1], 0, 1, POWER_MULTICOLOR),
        28 => new CardType(GRAY, [RED => 4, PEARL => 1], [], 3),
        29 => new CardType(GRAY, [BLUE => 2, RED => 2, BLACK => 1, PEARL => 1], [MULTICOLOR => 1], 1, 0, POWER_MULTICOLOR),
        30 => new CardType(GRAY, [WHITE => 2, GREEN => 2, BLACK => 1, PEARL => 1], [MULTICOLOR => 1], 1, 0, POWER_MULTICOLOR),
    ],    
    2 => [ // level 2 cards
        1 => new CardType(WHITE, [GREEN => 2, RED => 2, BLACK => 2, PEARL => 1], [WHITE => 1], 2, 1),
        2 => new CardType(WHITE, [BLUE => 4, RED => 3], [WHITE => 1], 1, 0, POWER_TAKE_GEM_FROM_OPPONENT),
        3 => new CardType(WHITE, [WHITE => 4, BLACK => 2, PEARL => 1], [WHITE => 1], 2, 0, POWER_TAKE_PRIVILEGE),
        4 => new CardType(WHITE, [BLUE => 5, GREEN => 2], [WHITE => 2], 1),

        5 => new CardType(BLUE, [WHITE => 2, RED => 2, BLACK => 2, PEARL => 1], [BLUE => 1], 2, 1),
        6 => new CardType(BLUE, [GREEN => 4, BLACK => 3], [BLUE => 1], 1, 0, POWER_TAKE_GEM_FROM_OPPONENT),
        7 => new CardType(BLUE, [WHITE => 2, BLUE => 4, PEARL => 1], [BLUE => 1], 2, 0, POWER_TAKE_PRIVILEGE),
        8 => new CardType(BLUE, [GREEN => 5, RED => 2], [BLUE => 2], 1),

        9 => new CardType(GREEN, [WHITE => 2, BLUE => 2, BLACK => 2, PEARL => 1], [GREEN => 1], 2, 1),
        10 => new CardType(GREEN, [WHITE => 3, RED => 4], [GREEN => 1], 1, 0, POWER_TAKE_GEM_FROM_OPPONENT),
        11 => new CardType(GREEN, [BLUE => 2, GREEN => 4, PEARL => 1], [GREEN => 1], 2, 0, POWER_TAKE_PRIVILEGE),
        12 => new CardType(GREEN, [RED => 5, BLACK => 2], [GREEN => 2], 1),

        13 => new CardType(BLACK, [BLUE => 2, GREEN => 2, RED => 2, PEARL => 1], [BLACK => 1], 2, 1),
        14 => new CardType(BLACK, [WHITE => 4, GREEN => 3], [BLACK => 1], 1, 0, POWER_TAKE_GEM_FROM_OPPONENT),
        15 => new CardType(BLACK, [RED => 2, BLACK => 4, PEARL => 1], [BLACK => 1], 2, 0, POWER_TAKE_PRIVILEGE),
        16 => new CardType(BLACK, [WHITE => 5, BLUE => 2], [BLACK => 2], 1),

        13 => new CardType(RED, [WHITE => 2, BLUE => 2, GREEN => 2, PEARL => 1], [RED => 1], 2, 1),
        14 => new CardType(RED, [BLUE => 3, BLACK => 4], [RED => 1], 1, 0, POWER_TAKE_GEM_FROM_OPPONENT),
        15 => new CardType(RED, [GREEN => 2, RED => 4, PEARL => 1], [RED => 1], 2, 0, POWER_TAKE_PRIVILEGE),
        16 => new CardType(RED, [WHITE => 2, BLACK => 5], [RED => 2], 1),

        17 => new CardType(GRAY, [GREEN => 6, PEARL => 1], [MULTICOLOR => 1], 2, 0, POWER_MULTICOLOR),
        18 => new CardType(GRAY, [GREEN => 6, PEARL => 1], [MULTICOLOR => 1], 0, 2, POWER_MULTICOLOR),
        19 => new CardType(GRAY, [BLUE => 6, PEARL => 1], [MULTICOLOR => 1], 0, 2, POWER_MULTICOLOR),
        20 => new CardType(GRAY, [BLUE => 6, PEARL => 1], [], 5),
    ],    
    3 => [ // level 3 cards
        1 => new CardType(WHITE, [BLUE => 3, RED => 5, BLACK => 3, PEARL => 1], [WHITE => 1], 3, 2),
        2 => new CardType(WHITE, [WHITE => 6, BLUE => 2, BLACK => 2], [WHITE => 1], 4),

        3 => new CardType(BLUE, [WHITE => 3, GREEN => 3, BLACK => 5, PEARL => 1], [BLUE => 1], 3, 2),
        4 => new CardType(BLUE, [WHITE => 2, BLUE => 6, GREEN => 2], [BLUE => 1], 4),

        5 => new CardType(GREEN, [WHITE => 5, BLUE => 3, RED => 3, PEARL => 1], [GREEN => 1], 3, 2),
        6 => new CardType(GREEN, [BLUE => 2, GREEN => 6, RED => 2], [GREEN => 1], 4),

        7 => new CardType(BLACK, [WHITE => 3, GREEN => 5, RED => 3, PEARL => 1], [BLACK => 1], 3, 2),
        8 => new CardType(BLACK, [WHITE => 2, RED => 2, BLACK => 6], [BLACK => 1], 4),

        9 => new CardType(RED, [BLUE => 5, GREEN => 3, BLACK => 3, PEARL => 1], [RED => 1], 3, 2),
        10 => new CardType(RED, [GREEN => 2, RED => 6, BLACK => 2], [RED => 1], 4),

        11 => new CardType(GRAY, [RED => 8], [MULTICOLOR => 1], 3, 0, POWER_MULTICOLOR + POWER_PLAY_AGAIN /* TODO*/),
        12 => new CardType(GRAY, [BLACK => 8], [MULTICOLOR => 1], 0, 3, POWER_MULTICOLOR),
        13 => new CardType(GRAY, [WHITE => 8], [MULTICOLOR => 1], 6),
    ],
];

$this->ROYAL_CARDS = [
    1 => new RoyalCardType(2, POWER_TAKE_GEM_FROM_OPPONENT),
    2 => new RoyalCardType(2, POWER_PLAY_AGAIN),
    3 => new RoyalCardType(2, POWER_TAKE_PRIVILEGE),
    4 => new RoyalCardType(3),
];