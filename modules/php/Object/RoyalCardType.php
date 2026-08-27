<?php
declare(strict_types=1);

namespace Bga\Games\SplendorDuel\Object;

require_once(__DIR__.'/../constants.inc.php');

class RoyalCardType {
    public ?int $points;
    public array $power;
  
    public function __construct(int $points = 0, array $power = []) {
        $this->points = $points;
        $this->power = $power;
    } 
}

?>
