<?php

require_once(__DIR__.'/../constants.inc.php');

class CardType {
    public ?int $color;
    public ?int $points;
    public ?array $cost;
    public ?array $provides;
    public ?int $crowns;
    public array $power;
  
    public function __construct(int $color, array $cost, array $provides = [], int $points = 0, int $crowns = 0, array $power = []) {
        $this->color = $color;
        $this->cost = $cost;
        $this->provides = $provides;
        $this->points = $points;
        $this->crowns = $crowns;
        $this->power = $power;
    } 
}

class Card extends CardType {

    public int $id;
    public string $location;
    public int $locationArg;
    public int $level; // type
    public ?int $index; // typeArg

    public function __construct($dbCard, $CARDS) {
        $this->id = intval($dbCard['card_id'] ?? $dbCard['id']);
        $this->location = $dbCard['card_location'] ?? $dbCard['location'];
        $this->locationArg = intval($dbCard['card_location_arg'] ?? $dbCard['location_arg']);
        $this->level = array_key_exists('card_type', $dbCard) || array_key_exists('type', $dbCard) ? intval($dbCard['card_type'] ?? $dbCard['type']) : null;
        $this->index = array_key_exists('card_type_arg', $dbCard) || array_key_exists('type_arg', $dbCard) ? intval($dbCard['card_type_arg'] ?? $dbCard['type_arg']) : null;        

        if ($this->index !== null) {
            $cardType = $CARDS[$this->level][$this->index];
            $this->color = $cardType->color;
            $this->cost = $cardType->cost;
            $this->provides = $cardType->provides;
            $this->points = $cardType->points;
            $this->crowns = $cardType->crowns;
            $this->power = $cardType->power;
        }
    } 

    public static function onlyId(?Card $card) {
        if ($card == null) {
            return null;
        }
        
        return new Card([
            'card_id' => $card->id,
            'card_location' => $card->location,
            'card_location_arg' => $card->locationArg,
            'card_type' => $card->level,
        ], null);
    }

    public static function onlyIds(array $cards) {
        return array_map(fn($card) => self::onlyId($card), $cards);
    }
}

?>