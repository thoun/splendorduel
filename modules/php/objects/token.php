<?php

const BOARD_COORDINATES = [
    1 => [3, 3],
    2 => [4, 3],
    3 => [4, 2],
    4 => [3, 2],
    5 => [2, 2],
    6 => [2, 3],
    7 => [2, 4],
    8 => [3, 4],
    9 => [4, 4],
    10 => [5, 4],
    11 => [5, 3],
    12 => [5, 2],
    13 => [5, 1],
    14 => [4, 1],
    15 => [3, 1],
    16 => [2, 1],
    17 => [1, 1],
    18 => [1, 2],
    19 => [1, 3],
    20 => [1, 4],
    21 => [1, 5],
    22 => [2, 5],
    23 => [3, 5],
    24 => [4, 5],
    25 => [5, 5],
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