<?php

const BOARD_COORDINATES = [
    1 => [3, 3],
    2 => [2, 3],
    3 => [2, 4],
    4 => [3, 4],
    5 => [4, 4],
    6 => [4, 3],
    7 => [4, 2],
    8 => [3, 2],
    9 => [2, 2],
    10 => [1, 2],
    11 => [1, 3],
    12 => [1, 4],
    13 => [1, 5],
    14 => [2, 5],
    15 => [3, 5],
    16 => [4, 5],
    17 => [5, 5],
    18 => [5, 4],
    19 => [5, 3],
    20 => [5, 2],
    21 => [5, 1],
    22 => [4, 1],
    23 => [3, 1],
    24 => [2, 1],
    25 => [1, 1],
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