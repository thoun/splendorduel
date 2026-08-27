<?php
declare(strict_types=1);

namespace Bga\Games\SplendorDuel\Object;

class Undo {
    public array $cardsIds;
    public array $tokensIds;
    public ?array $payOneLess;

    public function __construct(array $cardsIds, array $tokensIds, ?array $payOneLess) {
        $this->cardsIds = $cardsIds;
        $this->tokensIds = $tokensIds;
        $this->payOneLess = $payOneLess;
    }

}
?>
