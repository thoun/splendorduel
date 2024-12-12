<?php

require_once(__DIR__.'/../constants.inc.php');

class RoyalCardType {
    public ?int $points;
    public array $power;
  
    public function __construct(int $points = 0, array $power = []) {
        $this->points = $points;
        $this->power = $power;
    } 
}

class RoyalCard extends RoyalCardType {

    public int $id;
    public string $location;
    public int $locationArg;
    public ?int $index; // type

    public function __construct($dbCard, $ROYAL_CARDS) {
        $this->id = intval($dbCard['card_id'] ?? $dbCard['id']);
        $this->location = $dbCard['card_location'] ?? $dbCard['location'];
        $this->locationArg = intval($dbCard['card_location_arg'] ?? $dbCard['location_arg']);
        $this->index = array_key_exists('card_type', $dbCard) || array_key_exists('type', $dbCard) ? intval($dbCard['card_type'] ?? $dbCard['type']) : null;

        if ($this->index !== null) {
            $cardType = $ROYAL_CARDS[$this->index];
            $this->points = $cardType->points;
            $this->power = $cardType->power;
        }
    }
}

?>