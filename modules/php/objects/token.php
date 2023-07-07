<?php

const BOARD_COORDINATES = [
    1 => [3, 3],
    2 => [3, 2],
    3 => [2, 2],
    4 => [2, 3],
    5 => [2, 4],
    6 => [3, 4],
    7 => [4, 4],
    8 => [4, 3],
    9 => [4, 2],
    10 => [4, 1],
    11 => [3, 1],
    12 => [2, 1],
    13 => [1, 1],
    14 => [1, 2],
    15 => [1, 3],
    16 => [1, 4],
    17 => [1, 5],
    18 => [2, 5],
    19 => [3, 5],
    20 => [4, 5],
    21 => [5, 5],
    22 => [5, 4],
    23 => [5, 3],
    24 => [5, 2],
    25 => [5, 1],
];

class Token {

    public int $id;
    public string $location;
    public int $locationArg;
    public int $type; // 1 = gold, 2 = colored
    public int $color; // 0 = pearl, 1 blue, 2 white, 3 green, 4 black, 5 red
    public ?int $row;
    public ?int $column;

    public function __construct($dbCard) {
        $this->id = intval($dbCard['card_id'] ?? $dbCard['id']);
        $this->location = $dbCard['card_location'] ?? $dbCard['location'];
        $this->locationArg = intval($dbCard['card_location_arg'] ?? $dbCard['location_arg']);
        $this->type = array_key_exists('card_type', $dbCard) || array_key_exists('type', $dbCard) ? intval($dbCard['card_type'] ?? $dbCard['type']) : null;
        $this->color = $this->type == 1 ? -1 : (array_key_exists('card_type_arg', $dbCard) || array_key_exists('type_arg', $dbCard) ? intval($dbCard['card_type_arg'] ?? $dbCard['type_arg']) : null);

        if ($this->location == 'board') {
            $coordinates = BOARD_COORDINATES[$this->locationArg];
            $this->row = $coordinates[0];
            $this->column = $coordinates[1];
        }
    }
}

?>