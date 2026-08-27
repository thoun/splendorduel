<?php
declare(strict_types=1);

namespace Bga\Games\SplendorDuel\Object;

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

?>
