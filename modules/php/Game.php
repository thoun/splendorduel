<?php
declare(strict_types=1);

namespace Bga\Games\SplendorDuel;
 /**
  *------
  * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
  * SplendorDuel implementation : © <Your name here> <Your email address here>
  * 
  * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
  * See http://en.boardgamearena.com/#!doc/Studio for more information.
  * -----
  * 
  * Game.php
  *
  * This is the main file for your game logic.
  *
  * In this PHP file, you are going to defines the rules of the game.
  *
  */

use Bga\GameFramework\Components\Deck;
use Bga\GameFramework\UserException;
use Bga\GameFramework\VisibleSystemException;
use Bga\GameFrameworkPrototype\Helpers\Arrays;
use Bga\Games\SplendorDuel\Object\Card;
use Bga\Games\SplendorDuel\Object\CardType;
use Bga\Games\SplendorDuel\Object\CounterfeiterCard;
use Bga\Games\SplendorDuel\Object\RoyalCard;
use Bga\Games\SplendorDuel\Object\RoyalCardType;
use Bga\Games\SplendorDuel\Object\SplendorDuelExpansionPlayer;
use Bga\Games\SplendorDuel\Object\Token;

require_once(__DIR__.'/framework-prototype/Helpers/Arrays.php');
require_once(__DIR__.'/constants.inc.php');

class Game extends \Bga\GameFramework\Table {
    use ActionTrait;
    use StateTrait;
    use ArgsTrait;
    use DebugUtilTrait;

    public Deck $cards;
    public Deck $royalCards;
    public Deck $tokens;
    public CounterfeiterCardManager $counterfeiterCards;

    public array $CARDS;
    public array $ROYAL_CARDS;
    public array $ROYAL_CARDS_EXPANSION;

	function __construct() {
        // Your global variables labels:
        //  Here, you can assign labels to global variables you are using for this game.
        //  You can use any number of global variables with IDs between 10 and 99.
        //  If your game has options (variants), you also have to associate here a label to
        //  the corresponding ID in gameoptions.inc.php.
        // Note: afterwards, you can get/set the global variables with getGameStateValue/setGameStateInitialValue/setGameStateValue
        parent::__construct();
        
        $this->initGameStateLabels([
            PLAY_AGAIN => PLAY_AGAIN,
            PLAYED_CARD => PLAYED_CARD,
            TAKE_ROYAL_CARD => TAKE_ROYAL_CARD,
            PLAYER_REFILLED => PLAYER_REFILLED,
        ]);   
		
        $this->cards = $this->bga->deckFactory->createDeck("card");		
        $this->royalCards = $this->bga->deckFactory->createDeck("royal_card");		
        $this->tokens = $this->bga->deckFactory->createDeck("token");

        $this->counterfeiterCards = new CounterfeiterCardManager($this);

        $this->CARDS = [
            1 => [ // level 1 cards
                1 => new CardType(WHITE, [BLUE => 1, GREEN => 1, RED => 1, BLACK => 1], [WHITE => 1]),
                2 => new CardType(WHITE, [BLUE => 3], [WHITE => 1], 0, 1),
                3 => new CardType(WHITE, [BLUE => 2, GREEN => 2, PEARL => 1], [WHITE => 1], 0, 0, [POWER_PLAY_AGAIN]),
                4 => new CardType(WHITE, [RED => 2, BLACK => 2], [WHITE => 1], 0, 0, [POWER_TAKE_GEM_FROM_TABLE]),
                5 => new CardType(WHITE, [GREEN => 2, RED => 3], [WHITE => 1], 1),

                6 => new CardType(BLUE, [WHITE => 1, GREEN => 1, RED => 1, BLACK => 1], [BLUE => 1]),
                7 => new CardType(BLUE, [GREEN => 3], [BLUE => 1], 0, 1),
                8 => new CardType(BLUE, [GREEN => 2, RED => 2, PEARL => 1], [BLUE => 1], 0, 0, [POWER_PLAY_AGAIN]),
                9 => new CardType(BLUE, [WHITE => 2, BLACK => 2], [BLUE => 1], 0, 0, [POWER_TAKE_GEM_FROM_TABLE]),
                10 => new CardType(BLUE, [RED => 2, BLACK => 3], [BLUE => 1], 1),

                11 => new CardType(GREEN, [WHITE => 1, BLUE => 1, RED => 1, BLACK => 1], [GREEN => 1]),
                12 => new CardType(GREEN, [RED => 3], [GREEN => 1], 0, 1),
                13 => new CardType(GREEN, [RED => 2, BLACK => 2, PEARL => 1], [GREEN => 1], 0, 0, [POWER_PLAY_AGAIN]),
                14 => new CardType(GREEN, [WHITE => 2, BLUE => 2], [GREEN => 1], 0, 0, [POWER_TAKE_GEM_FROM_TABLE]),
                15 => new CardType(GREEN, [WHITE => 3, BLACK => 2], [GREEN => 1], 1),

                16 => new CardType(BLACK, [WHITE => 1, BLUE => 1, GREEN => 1, RED => 1], [BLACK => 1]),
                17 => new CardType(BLACK, [WHITE => 3], [BLACK => 1], 0, 1),
                18 => new CardType(BLACK, [WHITE => 2, BLUE => 2, PEARL => 1], [BLACK => 1], 0, 0, [POWER_PLAY_AGAIN]),
                19 => new CardType(BLACK, [GREEN => 2, RED => 2], [BLACK => 1], 0, 0, [POWER_TAKE_GEM_FROM_TABLE]),
                20 => new CardType(BLACK, [BLUE => 2, GREEN => 3], [BLACK => 1], 1),

                21 => new CardType(RED, [WHITE => 1, BLUE => 1, GREEN => 1, BLACK => 1], [RED => 1]),
                22 => new CardType(RED, [BLACK => 3], [RED => 1], 0, 1),
                23 => new CardType(RED, [WHITE => 2, BLACK => 2, PEARL => 1], [RED => 1], 0, 0, [POWER_PLAY_AGAIN]),
                24 => new CardType(RED, [BLUE => 2, GREEN => 2], [RED => 1], 0, 0, [POWER_TAKE_GEM_FROM_TABLE]),
                25 => new CardType(RED, [WHITE => 2, BLUE => 3], [RED => 1], 1),

                26 => new CardType(GRAY, [BLACK => 4, PEARL => 1], [MULTICOLOR => 1], 1, 0, [POWER_MULTICOLOR]),
                27 => new CardType(GRAY, [WHITE => 4, PEARL => 1], [MULTICOLOR => 1], 0, 1, [POWER_MULTICOLOR]),
                28 => new CardType(GRAY, [RED => 4, PEARL => 1], [], 3),
                29 => new CardType(GRAY, [BLUE => 2, RED => 2, BLACK => 1, PEARL => 1], [MULTICOLOR => 1], 1, 0, [POWER_MULTICOLOR]),
                30 => new CardType(GRAY, [WHITE => 2, GREEN => 2, BLACK => 1, PEARL => 1], [MULTICOLOR => 1], 1, 0, [POWER_MULTICOLOR]),
            ],    
            2 => [ // level 2 cards
                1 => new CardType(WHITE, [GREEN => 2, RED => 2, BLACK => 2, PEARL => 1], [WHITE => 1], 2, 1),
                2 => new CardType(WHITE, [BLUE => 4, RED => 3], [WHITE => 1], 1, 0, [POWER_TAKE_GEM_FROM_OPPONENT]),
                3 => new CardType(WHITE, [WHITE => 4, BLACK => 2, PEARL => 1], [WHITE => 1], 2, 0, [POWER_TAKE_PRIVILEGE]),
                4 => new CardType(WHITE, [BLUE => 5, GREEN => 2], [WHITE => 2], 1),

                5 => new CardType(BLUE, [WHITE => 2, RED => 2, BLACK => 2, PEARL => 1], [BLUE => 1], 2, 1),
                6 => new CardType(BLUE, [GREEN => 4, BLACK => 3], [BLUE => 1], 1, 0, [POWER_TAKE_GEM_FROM_OPPONENT]),
                7 => new CardType(BLUE, [WHITE => 2, BLUE => 4, PEARL => 1], [BLUE => 1], 2, 0, [POWER_TAKE_PRIVILEGE]),
                8 => new CardType(BLUE, [GREEN => 5, RED => 2], [BLUE => 2], 1),

                9 => new CardType(GREEN, [WHITE => 2, BLUE => 2, BLACK => 2, PEARL => 1], [GREEN => 1], 2, 1),
                10 => new CardType(GREEN, [WHITE => 3, RED => 4], [GREEN => 1], 1, 0, [POWER_TAKE_GEM_FROM_OPPONENT]),
                11 => new CardType(GREEN, [BLUE => 2, GREEN => 4, PEARL => 1], [GREEN => 1], 2, 0, [POWER_TAKE_PRIVILEGE]),
                12 => new CardType(GREEN, [RED => 5, BLACK => 2], [GREEN => 2], 1),

                13 => new CardType(BLACK, [BLUE => 2, GREEN => 2, RED => 2, PEARL => 1], [BLACK => 1], 2, 1),
                14 => new CardType(BLACK, [WHITE => 4, GREEN => 3], [BLACK => 1], 1, 0, [POWER_TAKE_GEM_FROM_OPPONENT]),
                15 => new CardType(BLACK, [RED => 2, BLACK => 4, PEARL => 1], [BLACK => 1], 2, 0, [POWER_TAKE_PRIVILEGE]),
                16 => new CardType(BLACK, [WHITE => 5, BLUE => 2], [BLACK => 2], 1),

                17 => new CardType(RED, [WHITE => 2, BLUE => 2, GREEN => 2, PEARL => 1], [RED => 1], 2, 1),
                18 => new CardType(RED, [BLUE => 3, BLACK => 4], [RED => 1], 1, 0, [POWER_TAKE_GEM_FROM_OPPONENT]),
                19 => new CardType(RED, [GREEN => 2, RED => 4, PEARL => 1], [RED => 1], 2, 0, [POWER_TAKE_PRIVILEGE]),
                20 => new CardType(RED, [WHITE => 2, BLACK => 5], [RED => 2], 1),

                21 => new CardType(GRAY, [GREEN => 6, PEARL => 1], [MULTICOLOR => 1], 2, 0, [POWER_MULTICOLOR]),
                22 => new CardType(GRAY, [GREEN => 6, PEARL => 1], [MULTICOLOR => 1], 0, 2, [POWER_MULTICOLOR]),
                23 => new CardType(GRAY, [BLUE => 6, PEARL => 1], [MULTICOLOR => 1], 0, 2, [POWER_MULTICOLOR]),
                24 => new CardType(GRAY, [BLUE => 6, PEARL => 1], [], 5),
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

                11 => new CardType(GRAY, [RED => 8], [MULTICOLOR => 1], 3, 0, [POWER_MULTICOLOR, POWER_PLAY_AGAIN]),
                12 => new CardType(GRAY, [BLACK => 8], [MULTICOLOR => 1], 0, 3, [POWER_MULTICOLOR]),
                13 => new CardType(GRAY, [WHITE => 8], [], 6),
            ],
        ];

        $this->ROYAL_CARDS = [
            1 => new RoyalCardType(2, [POWER_TAKE_GEM_FROM_OPPONENT]),
            2 => new RoyalCardType(2, [POWER_PLAY_AGAIN]),
            3 => new RoyalCardType(2, [POWER_TAKE_PRIVILEGE]),
            4 => new RoyalCardType(3),
        ];

        $this->ROYAL_CARDS_EXPANSION = [ 
            5 => new RoyalCardType(2, [POWER_RESERVE_CARD]),
            6 => new RoyalCardType(1, [POWER_WIN_9PTS_SAME_COLOR]),
            7 => new RoyalCardType(1, [POWER_WIN_9CROWNS]),
            8 => new RoyalCardType(1, [POWER_TAKE_ALL_GEMS_SAME_COLOR]),
            9 => new RoyalCardType(1, [POWER_TAKE_COUNTERFEITER_CARD]),
            10 => new RoyalCardType(1, [POWER_TAKE_2GEMS_FROM_BAG]),
            11 => new RoyalCardType(1, [POWER_TAKE_GOLD_FROM_TABLE]),
            12 => new RoyalCardType(0, [POWER_TAKE_3GEMS_FROM_TABLE]),
        ];
	}

    /*
        setupNewGame:
        
        This method is called only once, when a new game is launched.
        In this method, you must setup the game according to the game rules, so that
        the game is ready to be played.
    */
    protected function setupNewGame( $players, $options = []) {
        $counterfeiterExpansion = $this->isCounterfeiterExpansion();
        if ($counterfeiterExpansion) {
            $this->counterfeiterCards->initDb();
        }

        // Set the colors of the players with HTML color code
        // The default below is red/green/blue/orange/brown
        // The number of colors defined here must correspond to the maximum number of players allowed for the gams
        $gameinfos = $this->getGameinfos();
        $default_colors = $gameinfos['player_colors'];
 
        // Create players
        // Note: if you added some extra field on "player" table in the database (dbmodel.sql), you can initialize it there.
        $sql = "INSERT INTO player (player_id, player_color, player_canal, player_name, player_avatar, player_privileges) VALUES ";
        $values = [];

        $firstPlayer = true;
        foreach( $players as $player_id => $player ) {
            $color = array_shift( $default_colors );

            $privileges = $firstPlayer ? 0 : 1;

            $values[] = "('".$player_id."','$color','".$player['player_canal']."','".addslashes( $player['player_name'] )."','".addslashes( $player['player_avatar'] )."', $privileges)";

            if ($firstPlayer) {
                $firstPlayer = false;
            }
        }
        $sql .= implode(',', $values);
        $this->DbQuery( $sql );
        $this->reattributeColorsBasedOnPreferences( $players, $gameinfos['player_colors'] );
        $this->reloadPlayersBasicInfos();
        
        /************ Start the game initialization *****/

        // Init global values with their initial values
        $this->setGameStateInitialValue((string)PLAY_AGAIN, 0);
        $this->setGameStateInitialValue((string)PLAYED_CARD, 0);
        $this->setGameStateInitialValue((string)TAKE_ROYAL_CARD, 0);
        $this->setGameStateInitialValue((string)PLAYER_REFILLED, 0);

        // Init game statistics
        // (note: statistics used in this file must be defined in your stats.inc.php file)
        $this->initStat('table', 'roundNumber', 0);
        // cards
        $this->initStat('player', 'crowns', 0);
        $this->initStat('player', 'royalCards', 0);
        foreach(['table', 'player'] as $type) {
            foreach([
                // win
                "endReason1", "endReason2", "endReason3", 
                // optional actions
                "tokensWithPrivileges", "replenish", "givenPrivileges3equal", "givenPrivileges2pearls", 
                "privileges", "privilegesFromTable", "privilegesFromOpponent", 
                // tokens actions
                "takeTokens1", "takeTokens2", "takeTokens3",
                "reserveCard1", "reserveCard2", "reserveCard3",
                // cards
                "purchaseCard1", "purchaseCard2", "purchaseCard3",
                //	abilities
                "ability1", "ability2", "ability3", "ability4", "ability5",
                // other 
                "discardedTokens"
            ] as $name) {
                $this->initStat($type, $name, 0);
            }
        }

        // setup the initial game situation here
        $this->setupCards();
        $this->setupRoyalCards($counterfeiterExpansion);
        $this->setupTokens($counterfeiterExpansion);
        if ($counterfeiterExpansion) {
            $this->counterfeiterCards->setup();
        }

        // Activate first player (which is in general a good idea :) )
        $this->activeNextPlayer();

        /************ End of the game initialization *****/
        return \ST_PLAYER_PLAY_ACTION;
    }

    /*
        getAllDatas: 
        
        Gather all informations about current game situation (visible by the current player).
        
        The method is called each time the game interface is displayed to a player, ie:
        _ when the game starts
        _ when a player refreshes the game page (F5)
    */
    protected function getAllDatas(?int $currentPlayerId): array {
        $result = [];
    
        // Get information about players
        // Note: you can retrieve some extra field you added for "player" table in "dbmodel.sql" if you need it.
        $sql = "SELECT player_id id, player_score score, player_no playerNo, player_privileges privileges FROM player ";
        $result['players'] = $this->getCollectionFromDb( $sql );
  
        // Gather all information about current game situation (visible by player $current_player_id).
        
        foreach($result['players'] as $playerId => &$player) {
            $player['score'] = intval($player['score']);
            $player['playerNo'] = intval($player['playerNo']);
            $player['tokens'] = $this->getPlayerTokens($playerId);
            $player['privileges'] = intval($player['privileges']);

            $reserved = $this->getCardsByLocation('reserved', $playerId);
            $player['reserved'] = $currentPlayerId == $playerId ? $reserved : Card::onlyIds($reserved);

            $player['cards'] = $this->getCardsByLocation('player'.$playerId.'-%');
            $player['royalCards'] = $this->getRoyalCardsByLocation('player', $playerId);

            $player['endReasons'] = $this->getEndReasons($playerId);
        }

        $result['board'] = $this->getBoard();

        $result['royalCards'] = $this->getRoyalCardsByLocation('deck');
        $result['cardDeckCount'] = [];
        $result['cardDeckTop'] = [];
        $result['tableCards'] = [];

        foreach ([1,2,3] as $level) {
            $result['cardDeckCount'][$level] = intval($this->cards->countCardInLocation('deck'.$level));
            $result['cardDeckTop'][$level] = Card::onlyId($this->getCardFromDb($this->cards->getCardOnTop('deck'.$level)));
            $result['tableCards'][$level] = $this->getCardsByLocation('table'.$level);
        }

        $counterfeiterExpansion = $this->isCounterfeiterExpansion();
        $result['expansion'] = $counterfeiterExpansion;
        if ($counterfeiterExpansion) {
            $this->counterfeiterCards->fillResult($result);
        }
  
        return $result;
    }

    /*
        getGameProgression:
        
        Compute and return the current game progression.
        The number returned must be an integer beween 0 (=the game just started) and
        100 (= the game is finished or almost finished).
    
        This method is called each time we are in a game state with the "updateGameProgression" property set to true 
        (see states.inc.php)
    */
    function getGameProgression() {
        $playersIds = $this->getPlayersIds();

        return max(array_map(fn($playerId) => $this->getPlayerProgress($playerId), $playersIds));
    }

    //////////////////////////////////////////////////////////////////////////////
    //////////// Utility functions
    ////////////

    function setGlobalVariable(string $name, /*object|array*/ $obj) {
        /*if ($obj == null) {
            throw new \Error('Global Variable null');
        }*/
        $jsonObj = json_encode($obj);
        $this->DbQuery("INSERT INTO `global_variables`(`name`, `value`)  VALUES ('$name', '$jsonObj') ON DUPLICATE KEY UPDATE `value` = '$jsonObj'");
    }

    function getGlobalVariable(string $name, $asArray = null) {
        $json_obj = $this->getUniqueValueFromDB("SELECT `value` FROM `global_variables` where `name` = '$name'");
        if ($json_obj) {
            $object = json_decode($json_obj, $asArray);
            return $object;
        } else {
            return null;
        }
    }

    function deleteGlobalVariable(string $name) {
        $this->DbQuery("DELETE FROM `global_variables` where `name` = '$name'");
    }

    function deleteGlobalVariables(array $names) {
        $this->DbQuery("DELETE FROM `global_variables` where `name` in (".implode(',', array_map(fn($name) => "'$name'", $names)).")");
    }

    function isCounterfeiterExpansion(): bool {
        return $this->tableOptions->get(100) === 1;
    }

    function getPlayersIds() {
        return array_keys($this->loadPlayersBasicInfos());
    }

    function getPlayerPrivileges(int $playerId) {
        return intval($this->getUniqueValueFromDB("SELECT player_privileges FROM player WHERE player_id = $playerId"));
    }
    
    function getOpponentId(int $playerId) {
        return intval($this->getUniqueValueFromDB("SELECT player_id FROM player WHERE player_id <> $playerId"));
    }

    function getPlayerAntiPlayingTurns(int $playerId) {
        return intval($this->getUniqueValueFromDB("SELECT player_anti_playing_turns FROM player WHERE player_id = $playerId"));
    }

    function getPlayer(int $id) {
        $sql = "SELECT * FROM player WHERE player_id = $id";
        $dbResults = $this->getCollectionFromDb($sql);
        return array_map(fn($dbResult) => new SplendorDuelExpansionPlayer($dbResult), array_values($dbResults))[0];
    }

    function incPlayerScore(int $playerId, int $amount, $message = '', $args = []) {
        if ($amount != 0) {
            $this->DbQuery("UPDATE player SET `player_score` = `player_score` + $amount WHERE player_id = $playerId");
        }
            
        $this->notifyAllPlayers('score', $message, [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerNameById($playerId),
            'newScore' => $this->getPlayer($playerId)->score,
            'incScore' => $amount,
        ] + $args);
    }

    function getCardFromDb(/*array|null*/ $dbCard) {
        if ($dbCard == null) {
            return null;
        }
        return new Card($dbCard, $this->CARDS);
    }

    function getCardsFromDb(array $dbCards) {
        return array_map(fn($dbCard) => $this->getCardFromDb($dbCard), array_values($dbCards));
    }

    function getCardById(int $id) {
        $sql = "SELECT * FROM `card` WHERE `card_id` = $id";
        $dbResults = $this->getCollectionFromDb($sql);
        $cards = array_map(fn($dbCard) => $this->getCardFromDb($dbCard), array_values($dbResults));
        return count($cards) > 0 ? $cards[0] : null;
    }

    function getCardsByLocation(string $location, /*int|null*/ $location_arg = null, /*int|null*/ $type = null, /*int|null*/ $number = null) {
        $sql = "SELECT * FROM `card` WHERE `card_location` ".( str_contains($location, '%') ? "LIKE" : "=" )." '$location'";
        if ($location_arg !== null) {
            $sql .= " AND `card_location_arg` = $location_arg";
        }
        if ($type !== null) {
            $sql .= " AND `card_type` = $type";
        }
        if ($number !== null) {
            $sql .= " AND `card_type_arg` = $number";
        }
        $sql .= " ORDER BY `card_location_arg`";
        $dbResults = $this->getCollectionFromDb($sql);
        return array_map(fn($dbCard) => $this->getCardFromDb($dbCard), array_values($dbResults));
    }

    function setupCards() {     
        for ($level = 1; $level <= 3; $level++) {
            $cards = [];

            foreach ($this->CARDS[$level] as $index => $cardType) {
                $cards[] = [ 'type' => $level, 'type_arg' => $index, 'nbr' => 1 ];
            }

            $this->cards->createCards($cards, 'deck'.$level);
            $this->cards->shuffle('deck'.$level);

            for ($i = 1; $i <= 6 - $level; $i++) {
                $this->cards->pickCardForLocation('deck'.$level, 'table'.$level, $i);
            }
        }
    }

    function getRoyalCardFromDb(/*array|null*/ $dbCard) {
        if ($dbCard == null) {
            return null;
        }
        return new RoyalCard($dbCard, $this->ROYAL_CARDS + $this->ROYAL_CARDS_EXPANSION);
    }

    function getRoyalCardsFromDb(array $dbCards) {
        return array_map(fn($dbCard) => $this->getRoyalCardFromDb($dbCard), array_values($dbCards));
    }

    function getRoyalCardsByLocation(string $location, /*int|null*/ $location_arg = null) {
        $sql = "SELECT * FROM `royal_card` WHERE `card_location` = '$location'";
        if ($location_arg !== null) {
            $sql .= " AND `card_location_arg` = $location_arg";
        }
        $sql .= " ORDER BY `card_location_arg`";
        $dbResults = $this->getCollectionFromDb($sql);
        return array_map(fn($dbCard) => $this->getRoyalCardFromDb($dbCard), array_values($dbResults));
    }

    function setupRoyalCards(bool $counterfeiterExpansion) {     
        $cards = [];

        foreach ($this->ROYAL_CARDS as $index => $cardType) {
            $cards[] = [ 'type' => $index, 'type_arg' => 0, 'nbr' => 1 ];
        }
        if ($counterfeiterExpansion) {
            foreach ($this->ROYAL_CARDS_EXPANSION as $index => $cardType) {
                $cards[] = [ 'type' => $index, 'type_arg' => 0, 'nbr' => 1 ];
            }
        }

        $this->royalCards->createCards($cards, 'box');
        $this->royalCards->shuffle('box');
        $this->royalCards->pickCardsForLocation(4, 'box', 'deck');
    }

    function getTokenFromDb(/*array|null*/ $dbCard) {
        if ($dbCard == null) {
            return null;
        }
        return new Token($dbCard);
    }

    function getTokensFromDb(array $dbCards) {
        return array_map(fn($dbCard) => $this->getTokenFromDb($dbCard), array_values($dbCards));
    }

    function getTokensByLocation(string $location, /*int|null*/ $location_arg = null, /*int|null*/ $type = null, /*int|null*/ $number = null) {
        $sql = "SELECT * FROM `token` WHERE `card_location` = '$location'";
        if ($location_arg !== null) {
            $sql .= " AND `card_location_arg` = $location_arg";
        }
        if ($type !== null) {
            $sql .= " AND `card_type` = $type";
        }
        if ($number !== null) {
            $sql .= " AND `card_type_arg` = $number";
        }
        $sql .= " ORDER BY `card_location_arg`";
        $dbResults = $this->getCollectionFromDb($sql);
        return array_map(fn($dbCard) => $this->getTokenFromDb($dbCard), array_values($dbResults));
    }

    function getBoard() {
        return $this->getTokensByLocation('board');
    }

    function getPlayerTokens(int $playerId) {
        return $this->getTokensByLocation('player', $playerId);
    }

    // gold is -1, pearl is 0, else color index
    function getPlayerTokensByColor(int $playerId) {
        $tokens = $this->getPlayerTokens($playerId);

        $tokensByColor = [];
        foreach ([-1, 0,1,2,3,4,5,6] as $color) {
            $tokensByColor[$color] = array_values(array_filter($tokens, fn($token) => $token->type == 1 ? $color == -1 : $token->color == $color));
        }
        return $tokensByColor;
    }

    function playerHasAllGoldAndPearls(int $playerId) {
        $tokens = $this->getPlayerTokensByColor($playerId);
        return count($tokens[-1]) >= 3 && count($tokens[0]) >= 2;
    }

    function setupTokens(bool $counterfeiterExpansion) {
        $cards = [
            [ 'type' => 1, 'type_arg' => 0, 'nbr' => 3 ], // gold
            [ 'type' => 2, 'type_arg' => 0, 'nbr' => 2 ], // pearls
        ];
        for ($i = 1; $i <= ($counterfeiterExpansion ? 6 : 5); $i++) {
            $cards[] = [ 'type' => 2, 'type_arg' => $i, 'nbr' => 4 ];
        }

        $this->tokens->createCards($cards, 'bag');

        $this->refillBag();
    }

    function refillBag() {
        $this->tokens->shuffle('bag');
        $bagCount = intval($this->tokens->countCardInLocation('bag'));

        $board = $this->getBoard();

        $refilledTokens = [];

        for ($i = 1; $i <= 25; $i++) {
            if ($bagCount > 0 && !array_any($board, fn($token) => $token->locationArg == $i)) {
                $refilledTokens[] = $this->getTokenFromDb($this->tokens->pickCardForLocation('bag', 'board', $i));

                $bagCount--;
                if ($bagCount == 0) {
                    break;
                }
            }
        }

        $this->bga->notify->all('refill', '', [
            'refilledTokens' => $refilledTokens,
        ]);
    }

    function getColorName(int $color) {
        switch ($color) {
            case -1: return clienttranslate("Gold");
            case PEARL: return clienttranslate("Pearl");
            case BLUE: return clienttranslate("Blue");
            case WHITE: return clienttranslate("White");
            case GREEN: return clienttranslate("Green");
            case BLACK: return clienttranslate("Black");
            case RED: return clienttranslate("Red");
            case GLASSWARE: return clienttranslate("Glassware");
            case GRAY: return clienttranslate("Gray");
        }
    }

    function getTokensNames(array $tokens) {
        return array_map(fn($token) => $this->getColorName($token->type == 1 ? -1 : $token->color), $tokens);
    }
    
    function checkUsePrivilege(array $tokens, int $number)  {
        if (count($tokens) > $number) {
            throw new UserException("Not enough privileges");
        }

        if (array_any($tokens, fn($token) => $token->type == 1)) {
            throw new UserException("You can't take gold tokens this way");
        }
    }

    function checkPlayTakeGems(int $playerId, array $tokens)  {
        $gold = array_values(array_filter($tokens, fn($token) => $token->type == 1));
        $gems = array_values(array_filter($tokens, fn($token) => $token->type == 2));

        if (count($gold) > 0) {
            $maxReserve = $this->getPlayerMaxReserve($playerId);
            if (count($gold) > 1) {
                throw new UserException("You can only take 1 gold token");
            } else if (count($gems) > 0) {
                throw new UserException("You can't take gold and gems at the same time");
            } else if (intval($this->cards->countCardInLocation('reserved', $playerId)) >= $maxReserve) {
                throw new UserException("You can't reserve more than $maxReserve cards");
            }
        } else {
            if (count($gems) > 3) {
                throw new UserException("You can only take up to 3 tokens");
            }

            usort($gems, fn($a, $b) => $a->row == $b->row ? $a->column - $b->column : $a->row - $b->row);
            $rowDiff = null;
            $colDiff = null;
            $invalid = false;

            for ($i = 1; $i < count($gems); $i++) {
                if ($rowDiff === null && $colDiff === null) {
                    $rowDiff = $gems[$i]->row - $gems[$i - 1]->row;
                    $colDiff = $gems[$i]->column - $gems[$i - 1]->column;
                } else {
                    if (($gems[$i]->row - $gems[$i - 1]->row != $rowDiff) || ($gems[$i]->column - $gems[$i - 1]->column != $colDiff)) {
                        $invalid = true;
                    }
                }
                if ($rowDiff < -1 || $rowDiff > 1 || $colDiff < -1 || $colDiff > 1) {
                    $invalid = true;
                }
            }

            if ($invalid) {
                throw new UserException("You can only take tokens in straight line");
            }
        }
    }

    function applyTakeTokens(int $playerId, array $tokens) {
        $this->tokens->moveCards(array_map(fn($token) => $token->id, $tokens), 'player', $playerId);

        $this->bga->notify->all('takeTokens', clienttranslate('${player_name} takes token(s) ${new_tokens}'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerNameById($playerId),
            'tokens' => $tokens,
            'new_tokens' => $this->getTokensNames($tokens), // for logs
            'preserve' => ['tokens'],
            'i18n' => ['new_tokens'],
        ]);
    }

    function applyPower(int $playerId, int $power, int $cardId = -1): bool /* redirected*/ {
        switch ($power) {
            case POWER_PLAY_AGAIN:
                $this->setGameStateValue((string)PLAY_AGAIN, 1);
                break;
            case POWER_MULTICOLOR:
                $this->setGameStateValue((string)PLAYED_CARD, $cardId);
                $this->gamestate->jumpToState(ST_PLAYER_PLACE_JOKER);
                return true;
            case POWER_TAKE_GEM_FROM_TABLE:
                $this->setGameStateValue((string)PLAYED_CARD, $cardId);
                $this->gamestate->jumpToState(ST_PLAYER_TAKE_BOARD_TOKEN);
                return true;
            case POWER_TAKE_PRIVILEGE:
                $message = $cardId == -1 ?
                    clienttranslate('${player_name} takes a privilege with the Royal card ability') :
                    clienttranslate('${player_name} takes a privilege with the played card ability');
                $this->takePrivilege($playerId, $message);
                
                $this->incStat(1, 'ability4');
                $this->incStat(1, 'ability4', $playerId);
                break;
            case POWER_TAKE_GEM_FROM_OPPONENT:
                $this->setGameStateValue((string)PLAYED_CARD, $cardId);
                $this->gamestate->jumpToState(ST_PLAYER_TAKE_OPPONENT_TOKEN);
                return true;
            case POWER_RESERVE_CARD:
                $this->gamestate->jumpToState(ST_PLAYER_RESERVE_CARD);
                return true;
            case POWER_TAKE_COUNTERFEITER_CARD:
                $this->gamestate->jumpToState(ST_PLAYER_TAKE_COUNTERFEITER_CARD);
                return true;
            case POWER_TAKE_ALL_GEMS_SAME_COLOR:
            case POWER_TAKE_GOLD_FROM_TABLE:
            case POWER_TAKE_3GEMS_FROM_TABLE:
                $this->setGameStateValue((string)PLAYED_CARD, -$power);
                $this->gamestate->jumpToState(ST_PLAYER_TAKE_BOARD_TOKEN);
                return true;
            case POWER_TAKE_2GEMS_FROM_BAG:
                $this->tokens->shuffle('bag');
                $bagCount = intval($this->tokens->countCardInLocation('bag'));
                $tokens = [];
                for ($i = 0; $i < min(2, $bagCount); $i++) {
                    $tokens[] = $this->getTokenFromDb($this->tokens->pickCardForLocation('bag', 'player', $playerId));
                }

                if ($tokens === 0) {
                    $this->notify->all('log', clienttranslate("Card ability is skipped, as the bag is empty"));
                } else {
                    $this->notifyAllPlayers('takeTokens', clienttranslate('${player_name} takes token(s) ${new_tokens} from the bag'), [
                        'playerId' => $playerId,
                        'player_name' => $this->getPlayerNameById($playerId),
                        'tokens' => $tokens,
                        'new_tokens' => $this->getTokensNames($tokens), // for logs
                        'preserve' => ['tokens'],
                        'i18n' => ['new_tokens'],
                        'from' => 'bag',
                    ]);
                }
                break;
        }

        return false;
    }

    function applyEndTurn(int $playerId, Card|RoyalCard|CounterfeiterCard|null $card = null, bool $ignorePower = false) {
        $takeRoyalCard = false;

        if ($card != null) {
            if (property_exists($card, 'crowns') && $card->crowns > 0) {
                $cards = $this->getCardsByLocation('player'.$playerId.'-%');
                $counterfeiterCards = $this->isCounterfeiterExpansion() ? $this->counterfeiterCards->getPlayer($playerId) : [];
                $crownsAfter = 0;
                foreach($cards as $iCard) {
                    $crownsAfter += $iCard->crowns;
                }
                foreach($counterfeiterCards as $iCard) {
                    $crownsAfter += $iCard->crowns;
                }
                $crownsBefore = $crownsAfter - $card->crowns;

                if (($crownsAfter >= 3 && $crownsBefore < 3) || ($crownsAfter >= 6 && $crownsBefore < 6)) {
                    $takeRoyalCard = true;
                    $this->setGameStateValue((string)TAKE_ROYAL_CARD, 1);
                }
            }

            if (!$ignorePower && $card !== null && !$card instanceof CounterfeiterCard) {
                $redirected = false;
                foreach ($card->power as $power) {
                    $powerWithRedirection = $this->applyPower($playerId, $power, ($card instanceof RoyalCard) ? -1 : $card->id);
                    if ($powerWithRedirection) {
                        $redirected = true;
                    }
                }

                if ($redirected) {
                    return;
                }
            }
        }

        if ($takeRoyalCard) { // in case we hadn't been redirected to choose column for joker color
            $this->gamestate->jumpToState(ST_PLAYER_TAKE_ROYAL_CARD);
            return;
        }

        $this->gamestate->jumpToState(ST_PLAYER_BEFORE_END_TURN);
    }

    function getPlayerTokenCountInLimit(int $playerId): int {
        $playerTokens = $this->getTokensByLocation('player', $playerId);
        if ($this->counterfeiterCards->playerHasCounterfeiterCard($playerId, 12)) {
            $playerTokens = Arrays::filter($playerTokens, fn($token) => $token->color !== 6);
        }
        return count($playerTokens);
    }
    
    function spendPrivileges(int $playerId, int $number) {
        $this->DbQuery("UPDATE player SET `player_privileges` = `player_privileges` - $number WHERE player_id = $playerId");

        $this->bga->notify->all('privileges', clienttranslate('${player_name} uses ${number} privileges to take token(s) from the board'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerNameById($playerId),
            'privileges' => [
                $playerId => $this->getPlayerPrivileges($playerId),
            ],
            'from' => $playerId,
            'to' => 0,
            'count' => $number,
            'number' => $number, // for logs
        ]);
    }

    function takePrivilege(int $playerId, string $message) {
        $playerPrivileges = $this->getPlayerPrivileges($playerId);
        if ($playerPrivileges >= 3) {
            $this->bga->notify->all('log', clienttranslate('${player_name} cannot take a privilege because he already have all 3 privileges.'), [
                'playerId' => $playerId,
                'player_name' => $this->getPlayerNameById($playerId),
            ]);
            return;
        }

        $opponentId = $this->getOpponentId($playerId);
        $opponentPrivileges = $this->getPlayerPrivileges($opponentId);
        $fromOpponent = ($playerPrivileges + $opponentPrivileges) >= 3;
        if ($fromOpponent) {
            $this->DbQuery("UPDATE player SET `player_privileges` = `player_privileges` - 1 WHERE player_id = $opponentId");
        }

        $this->DbQuery("UPDATE player SET `player_privileges` = `player_privileges` + 1 WHERE player_id = $playerId");

        $this->bga->notify->all('privileges', $message, [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerNameById($playerId),
            'opponentId' => $opponentId,
            'player_name2' => $this->getPlayerNameById($opponentId),
            'privileges' => [
                $playerId => $this->getPlayerPrivileges($playerId),
                $opponentId => $this->getPlayerPrivileges($opponentId),
            ],
            'from' => $fromOpponent ? $opponentId : 0,
            'to' => $playerId,
            'count' => 1,
        ]);
                
        $this->incStat(1, 'privileges');
        $this->incStat(1, 'privileges', $playerId);
                
        $this->incStat(1, $fromOpponent ? 'privilegesFromOpponent' : 'privilegesFromTable');
        $this->incStat(1, $fromOpponent ? 'privilegesFromOpponent' : 'privilegesFromTable', $playerId);
    }

    function getEndStatus(int $playerId) {
        $cards = $this->getCardsByLocation('player'.$playerId.'-%');
        $totalPoints = 0;
        $pointsByColor = [1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0];
        $crowns = 0;
        
        foreach($cards as $card) {
            $totalPoints += $card->points;
            $crowns += $card->crowns;
            $color = intval(substr($card->location, -1));
            if ($color <= 5) {
                $pointsByColor[$color] += $card->points;
            }
        }
        
        $royalCards = $this->getRoyalCardsByLocation('player', $playerId);
        foreach($royalCards as $royalCard) {
            $totalPoints += $royalCard->points;
        }
        if ($this->isCounterfeiterExpansion()) {
            $counterfeiterCards = $this->counterfeiterCards->getPlayer($playerId);
            foreach($counterfeiterCards as $counterfeiterCard) {
                $totalPoints += $counterfeiterCard->points;
                $crowns += $counterfeiterCard->crowns;
            }
        }

        return [$totalPoints, $crowns, max($pointsByColor)];
    }

    function getPlayerProgress(int $playerId) {
        $status = $this->getEndStatus($playerId);

        $totalPoints = $status[0];
        $crowns = $status[1];
        $colorMaxPoints = $status[2];

        return max($totalPoints * 5, $crowns * 10, $colorMaxPoints * 10);
    }

    function getEndReasons(int $playerId) {
        $reasons = [];
        $status = $this->getEndStatus($playerId);

        $totalPoints = $status[0];
        $crowns = $status[1];
        $colorMaxPoints = $status[2];

        $totalPointsGoal = 20;
        $colorMaxPointsGoal = 10;
        $crownGoal = 10;

        $royalCards = $this->getRoyalCardsByLocation('player', $playerId);
        if (Arrays::some($royalCards, fn($royalCard) => in_array(POWER_WIN_9PTS_SAME_COLOR, $royalCard->power))) {
            $colorMaxPointsGoal = 9;
        }
        if (Arrays::some($royalCards, fn($royalCard) => in_array(POWER_WIN_9CROWNS, $royalCard->power))) {
            $crownGoal = 9;
        }        

        if ($totalPoints >= $totalPointsGoal) {
            $reasons[] = 1;
        }
        if ($crowns >= $crownGoal) {
            $reasons[] = 2;
        }
        if ($colorMaxPoints >= $colorMaxPointsGoal) {
            $reasons[] = 3;
        }

        return $reasons;
    }

    function getCardReducedCost(array &$initialCost, array $playerCards) {
        $cost = $initialCost; // copy
        
        foreach($playerCards as $card) {
            foreach($card->provides as $color => $count) {
                if ($color == MULTICOLOR) {
                    $color = intval(substr($card->location, -1));
                }
                if (array_key_exists($color, $cost)) {
                    if ($cost[$color] > $count) {
                        $cost[$color] -= $count;
                    } else {
                        unset($cost[$color]);
                    }
                } 
            }
        }

        return $cost;
    }

    function canBuyCard(Card|CounterfeiterCard &$card, array $playerTokensByColor, array $playerCards, array $converters): array {
        $cost = $this->getCardReducedCost($card->cost, $playerCards);
        $remainingPlayerTokensByColor = Arrays::map($playerTokensByColor, fn($tokens) => count($tokens));
        $possiblePayments = $this->findPaymentWays($cost, $remainingPlayerTokensByColor, $converters);
        return $possiblePayments;
    }

    function findPaymentWays(array $cost, array $playerTokens, array $converters, array $currentPayment = [], array $allWays = []): array {
        // Base case: If the cost is fully paid, add the current way to the list
        if (array_sum($cost) === 0) {
            $allWays[] = $currentPayment;
            return array_values(array_unique($allWays, SORT_REGULAR));
            //return $allWays;
        }

        // Try to pay with GOLD tokens
        if (isset($playerTokens[GOLD]) && $playerTokens[GOLD] > 0) {
            foreach ($cost as $color => $needed) {
                if ($needed > 0) {
                    $newCost = $cost;
                    $newCost[$color]--;

                    $newTokens = $playerTokens;
                    $newTokens[GOLD]--;

                    $newPayment = $currentPayment;
                    $newPayment[GOLD] = ($newPayment[GOLD] ?? 0) + 1;
                    
                    // Recursive call
                    $allWays = $this->findPaymentWays($newCost, $newTokens, $converters, $newPayment, $allWays);
                }
            }
        }

        // Try to pay with player tokens of matching colors
        foreach ($cost as $color => $needed) {
            if ($needed > 0 && isset($playerTokens[$color]) && $playerTokens[$color] > 0) {
                $newCost = $cost;
                $newCost[$color]--;

                $newTokens = $playerTokens;
                $newTokens[$color]--;

                $newPayment = $currentPayment;
                $newPayment[$color] = ($newPayment[$color] ?? 0) + 1;
                
                // Recursive call
                $allWays = $this->findPaymentWays($newCost, $newTokens, $converters, $newPayment, $allWays);
            }
        }

        // Try to pay using converters
        foreach ($converters as $index => $converter) {
            $toColorMulti = array_keys($converter->to)[0];
            $numberFrom = array_values($converter->from)[0];
            $numberTo = array_values($converter->to)[0];

            $convertFromColors = [GOLD, array_keys($converter->from)[0]];
            $convertToPossibleColors = $toColorMulti === MULTICOLOR ?
                [BLUE, WHITE, GREEN, BLACK, RED] :
                [$toColorMulti];

            foreach ($convertFromColors as $fromColor) {
                foreach ($convertToPossibleColors as $toColor) {
                // Check if we can use this converter with current color
                    if (
                        isset($playerTokens[$fromColor]) && $playerTokens[$fromColor] >= $numberFrom && 
                        $converter->repeat > 0 && 
                        isset($cost[$toColor]) && $cost[$toColor] > 0
                    ) {
                        $newCost = $cost;
                        $newCost[$toColor] -= min($numberTo, $cost[$toColor]);

                        $newTokens = $playerTokens;
                        $newTokens[$fromColor] -= $numberFrom;

                        // A 'conversion' payment step
                        $newPayment = $currentPayment;
                        $newPayment[$fromColor] = ($newPayment[$fromColor] ?? 0) + $numberFrom;
                        
                        // Clone and update converter to track usage
                        $newConverters = $converters;
                        $newConverters[$index] = clone $newConverters[$index];
                        $newConverters[$index]->repeat--;

                        // Recursive call
                        $allWays = $this->findPaymentWays($newCost, $newTokens, $newConverters, $newPayment, $allWays);
                    }
                }
            }
        }

        return $allWays;
    }


    function getBuyableCardsAndCosts(int $playerId) {
        $tokens = $this->getPlayerTokensByColor($playerId);
        $cards = $this->getCardsByLocation('player'.$playerId.'-%');
        $hasColoredCards = array_any($cards, fn($card) => in_array($card->color, [BLUE, WHITE, GREEN, BLACK, RED]));
        $counterfeiterCardConversions = $this->counterfeiterCards->getConversions($playerId);

        $possibleCards = array_merge(
            $this->getCardsByLocation('reserved', $playerId),
            $this->getCardsByLocation('table%'),
        );

        // ignore multi color if we don't have a colored card
        if (!$hasColoredCards) {
            $possibleCards = Arrays::filter($possibleCards, fn($card) => !in_array(POWER_MULTICOLOR, $card->power));
        }

        $buyableCards = [];
        $reducedCosts = [];
        foreach ($possibleCards as $card) {
            $paymentWays = $this->canBuyCard($card, $tokens, $cards, $counterfeiterCardConversions);
            if (count($paymentWays) > 0) {
                $buyableCards[$card->id] = $paymentWays;
                $reducedCosts[$card->id] = $this->getCardReducedCost($card->cost, $cards);
            }
        }

        return [
            'buyableCards' => $buyableCards,
            'reducedCosts' => $reducedCosts,
        ];
    }


    function getBuyableCounterfeiterCardsAndCosts(int $playerId) {
        if (!$this->isCounterfeiterExpansion()) {
            return [
            'buyableCounterfeiterCards' => [],
            'reducedCounterfeiterCosts' => [],
        ];
        }
        $tokens = $this->getPlayerTokensByColor($playerId);
        $cards = $this->getCardsByLocation('player'.$playerId.'-%');
        $counterfeiterCardConversions = $this->counterfeiterCards->getConversions($playerId);

        $possibleCards = $this->counterfeiterCards->getTable();

        $buyableCards = [];
        $reducedCosts = [];
        foreach ($possibleCards as $card) {
            $paymentWays = $this->canBuyCard($card, $tokens, $cards, $counterfeiterCardConversions);
            if (count($paymentWays) > 0) {
                $buyableCards[$card->id] = $paymentWays;
                $reducedCosts[$card->id] = $this->getCardReducedCost($card->cost, $cards);
            }
        }

        return [
            'buyableCounterfeiterCards' => $buyableCards,
            'reducedCounterfeiterCosts' => $reducedCosts,
        ];
    }

    function refillCards() {
        for ($level = 1; $level <= 3; $level++) {
            for ($i = 1; $i <= 6 - $level; $i++) {
                if (count($this->getCardsByLocation('table'.$level, $i)) == 0 && count($this->getCardsByLocation('deck'.$level)) > 0) {
                    $newCard = $this->getCardFromDb($this->cards->pickCardForLocation('deck'.$level, 'table'.$level, $i));
        
                    $this->bga->notify->all('newTableCard', '', [
                        'newCard' => $newCard,
                        'cardDeckCount' => intval($this->cards->countCardInLocation('deck'.$level)),
                        'cardDeckTop' => Card::onlyId($this->getCardFromDb($this->cards->getCardOnTop('deck'.$level))),
                        'level' => $level,
                    ]);
                }
            }
        }
    }

//////////////////////////////////////////////////////////////////////////////
//////////// Zombie
////////////

    /*
        zombieTurn:
        
        This method is called each time it is the turn of a player who has quit the game (= "zombie" player).
        You can do whatever you want in order to make sure the turn of this player ends appropriately
        (ex: pass).
        
        Important: your zombie code will be called when the player leaves the game. This action is triggered
        from the main site and propagated to the gameserver from a server, not from a browser.
        As a consequence, there is no current player associated to this action. In your zombieTurn function,
        you must _never_ use getCurrentPlayerId() or getCurrentPlayerName(), otherwise it will fail with a "Not logged" error message. 
    */

    function zombieTurn(array $state, mixed $active_player ): void
    {
    	$statename = $state['name'];
    	
        if ($state['type'] === "activeplayer") {
            switch ($statename) {
                default:
                    $this->gamestate->jumpToState(ST_NEXT_PLAYER);
                    break;
            }

            return;
        }

        if ($state['type'] === "multipleactiveplayer") {
            // Make sure player is in a non blocking status for role turn
            $this->gamestate->setPlayerNonMultiactive( $active_player, 'next');
            
            return;
        }

        throw new VisibleSystemException( "Zombie mode not supported at this game state: ".$statename );
    }
    
///////////////////////////////////////////////////////////////////////////////////:
////////// DB upgrade
//////////

    /*
        upgradeTableDb:
        
        You don't have to care about this until your game has been published on BGA.
        Once your game is on BGA, this method is called everytime the system detects a game running with your old
        Database scheme.
        In this case, if you change your Database scheme, you just have to apply the needed changes in order to
        update the game database and allow the game to continue to run with your new version.
    
    */
    
    function upgradeTableDb($from_version) {
        // $from_version is the current version of this game database, in numerical form.
        // For example, if the game was running with a release of your game named "140430-1345",
        // $from_version is equal to 1404301345

        if ($from_version <= 2403081617) {
            // ! important ! Use DBPREFIX_<table_name> for all tables
            $sql = "ALTER TABLE `DBPREFIX_player` ADD `player_anti_playing_turns` tinyint UNSIGNED NOT NULL DEFAULT 0";
            $this->applyDbUpgradeToAllDB($sql);            
        }

        if ($from_version <= 2404061313) {
            $result = $this->getUniqueValueFromDB("SHOW COLUMNS FROM `player` LIKE 'player_anti_playing_turns'");
            if (is_null($result)) {
                $sql = "ALTER TABLE `DBPREFIX_player` ADD `player_anti_playing_turns` tinyint unsigned NOT NULL DEFAULT 0";
                $this->applyDbUpgradeToAllDB($sql);
            }            
        }
        if ($from_version <= 2512101438) {
            // ! important ! Use DBPREFIX_<table_name> for all tables
            $this->applyDbUpgradeToAllDB("ALTER TABLE `DBPREFIX_forger_card` RENAME `DBPREFIX_counterfeiter_card`;");            
        }
    }    
}
