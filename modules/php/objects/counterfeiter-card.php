<?php
declare(strict_types=1);

require_once(__DIR__.'/../framework-prototype/item/item.php');
require_once(__DIR__.'/../framework-prototype/item/item-field.php');

use \Bga\GameFrameworkPrototype\Item\Item;
use \Bga\GameFrameworkPrototype\Item\ItemField;

const COUNTERFEITER_CARD_COST = [
    1 => [GLASSWARE => 1, GREEN => 2],
    2 => [GLASSWARE => 1, RED => 2],
    3 => [GLASSWARE => 1, BLUE => 2],
    4 => [GLASSWARE => 1, WHITE => 2],
    5 => [GLASSWARE => 1, BLACK => 2],
    6 => [GLASSWARE => 2, PEARL => 1],
    7 => [GLASSWARE => 1, PEARL => 1],
    8 => [GLASSWARE => 1, BLUE => 1, BLACK => 1],
    9 => [GLASSWARE => 3, GOLD => 1],
    10 => [GLASSWARE => 2, BLACK => 1, RED => 1],
    //11 => [GLASSWARE => 2, PEARL => 1],
    12 => [GLASSWARE => 2, WHITE => 1, PEARL => 1],
    13 => [GLASSWARE => 2, GREEN => 1, BLUE => 1],
    14 => [GLASSWARE => 2, GOLD => 1],
    15 => [GLASSWARE => 1, GREEN => 1, PEARL => 1],
    16 => [GLASSWARE => 1, RED => 1, WHITE => 1],
    17 => [GLASSWARE => 2,],
];

const COUNTERFEITER_CARD_POINTS = [
];

const COUNTERFEITER_CARD_CROWNS = [
    14 => 2,
];

class CounterfeiterCardConversion {
    public function __construct(
        public array $from,
        public array $to,
        public int $repeat,
    ) {}
}

#[Item('counterfeiter_card')]
class CounterfeiterCard {
    // required fields
    #[ItemField(kind: 'id')]
    public int $id;

    #[ItemField(kind: 'location')]
    public string $location;

    #[ItemField(dbField: 'location_arg', kind: 'location_arg')]
    public ?int $locationArg;

    #[ItemField(kind: 'order')]
    public int $order;

    // custom fields
    #[ItemField]
    public int $type;

    public array $cost;
    public int $points;
    public int $crowns;
    public array $powers = [];
    public ?CounterfeiterCardConversion $conversion = null;

    public function setup(array $dbItem): void {
        $this->cost = COUNTERFEITER_CARD_COST[$this->type];
        $this->points = COUNTERFEITER_CARD_POINTS[$this->type] ?? 0;
        $this->crowns = COUNTERFEITER_CARD_CROWNS[$this->type] ?? 0;

        $this->conversion = match($this->type) {
            1 => new CounterfeiterCardConversion([GLASSWARE => 1], [GREEN => 2], 2),
            2 => new CounterfeiterCardConversion([GLASSWARE => 1], [RED => 2], 2),
            3 => new CounterfeiterCardConversion([GLASSWARE => 1], [BLUE => 2], 2),
            4 => new CounterfeiterCardConversion([GLASSWARE => 1], [WHITE => 2], 2),
            5 => new CounterfeiterCardConversion([GLASSWARE => 1], [BLACK => 2], 2),
            6 => new CounterfeiterCardConversion([GLASSWARE => 2], [MULTICOLOR => 3], 1),
            7 => new CounterfeiterCardConversion([GLASSWARE => 1], [PEARL => 1], 1),
            8 => new CounterfeiterCardConversion([GLASSWARE => 1], [MULTICOLOR => 1], 2),
            default => null,
        };
    }

    public static function onlyId(?CounterfeiterCard $card) {
        if ($card == null) {
            return null;
        }

        $cc = new CounterfeiterCard();
        $cc->id = $card->id;
        $cc->location = $card->location;
        $cc->locationArg = $card->locationArg;
        $cc->cost = [];
        $cc->points = 0;
        $cc->crowns = 0;
        
        return $cc;
    }
}

?>