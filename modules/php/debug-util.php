<?php

use Bga\GameFramework\Components\Deck;

function debug(...$debugData) {
    if (\Bga\GameFramework\Table::getBgaEnvironment() != 'studio') { 
        return;
    }die('debug data : <pre>'.substr(json_encode($debugData, JSON_PRETTY_PRINT), 1, -1).'</pre>');
}

trait DebugUtilTrait {

    public Deck $cards;
    public Deck $royalCards;
    public Deck $tokens;
    public CounterfeiterCardManager $counterfeiterCards;

//////////////////////////////////////////////////////////////////////////////
//////////// Utility functions
////////////

    function debugSetup() {
        if ($this->getBgaEnvironment() != 'studio') { 
            return;
        } 

        //$this->debugSetPlayerScore(2343492, 10);
        //$this->debugSetScore(39);
        //$this->debugSetReputation(8);

        //$this->debugAddDestinations(2343492, 'A', 15);
        //$this->debugAddDestinations(2343492, 'B', 10);

        //$this->cards->pickCardsForLocation(13, 'deck', 'void');
        
        //$this->debugLastTurn();
    }

    function debug_Tokens() {
        $playerId = intval($this->getActivePlayerId());
        $this->tokens->moveAllCardsInLocation('board', 'player', null, $playerId);
    }

    function debug_setRoyalCard(int $type) {
        $royalCard = $this->getRoyalCardsByLocation('deck')[0];

        $this->DbQuery("UPDATE royal_card SET card_type = $type WHERE card_id = ".$royalCard->id);
    }

    function debug_takeCard(int $playerId, int $id) {
        $card = $this->getCardById($id);
        $color = $card->color;

        $this->DbQuery("UPDATE `card` SET card_location = 'player$playerId-$color' WHERE card_id = ".$card->id);
    }

    function debug_takeCounterfeiterCard(int $playerId, int $type) {
        $card = $this->counterfeiterCards->getItemsByFieldName('type', [$type], 1)[0];
        return $this->counterfeiterCards->moveItem($card, 'player', $playerId);
    }

    public function debug_goToState(int $state = ST_NEXT_PLAYER) {
      $this->gamestate->jumpToState($state);
    }
}
