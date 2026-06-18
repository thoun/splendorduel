<?php
declare(strict_types=1);

require_once(__DIR__.'/framework-prototype/item/item-location.php');
require_once(__DIR__.'/framework-prototype/item/item-manager.php');
require_once(__DIR__.'/objects/counterfeiter-card.php');

use Bga\GameFrameworkPrototype\Helpers\Arrays;
use \Bga\GameFrameworkPrototype\Item\ItemManager;
use \Bga\GameFrameworkPrototype\Item\ItemLocation;

class CounterfeiterCardManager extends ItemManager {

    function __construct(
        protected $game,
    ) {
        parent::__construct(
            CounterfeiterCard::class, 
            [
                new ItemLocation('deck', true),
                new ItemLocation('table', true),
                new ItemLocation('player', true),
            ],
        );
    }

    public function getTable(): array {
        return $this->getItemsInLocation('table');
    }

    public function getPlayer(int $playerId): array {
        return $this->getItemsInLocation('player', $playerId);
    }

    public function setup() {
        $counterfeiterCards = [];
        for ($i = 1; $i <= 17; $i++) {
            if ($i == 11) {
                continue;
            }
            $counterfeiterCards[] = ['location' => 'deck', 'type' => $i ];
        }

        $this->createItems($counterfeiterCards);
        $this->shuffle('deck');

        $this->pickItemsForLocation(3, 'deck', null, 'table');
    }

    public function refill() {
        $count = $this->countItemsInLocation('table');
        if ($count < 3) {
            $cards = $this->pickItemsForLocation(3 - $count, 'deck', null, 'table');
            $this->game->notify->all('refillCounterfeiterCards', '', [
                'cards' => $cards,
                'counterfeiterDeckCount' => $this->countItemsInLocation('deck'),
                'counterfeiterDeckTop' => CounterfeiterCard::onlyId($this->getItemOnTop('deck')),
            ]);
        }
    }

    public function fillResult(array &$result) {
        $result['counterfeiterCards'] = $this->getTable();
        $result['counterfeiterDeckCount'] = $this->countItemsInLocation('deck');
        $result['counterfeiterDeckTop'] = CounterfeiterCard::onlyId($this->getItemOnTop('deck'));

        foreach ($result["players"] as $playerId => &$player) {
            $player['counterfeiterCards'] = $this->getPlayer($playerId);
        }
    }

    public function playerHasCounterfeiterCard(int $playerId, int $type): bool {
        if (!$this->game->isCounterfeiterExpansion()) {
            return false;
        }
        
        $counterfeiterCards = $this->getPlayer($playerId);

        return Arrays::some($counterfeiterCards, fn($card) => $card->type === $type);
    }

    public function getConversions(int $playerId): array {
        if (!$this->game->isCounterfeiterExpansion()) {
            return [];
        }
        
        $counterfeiterCards = $this->getPlayer($playerId);
        $counterfeiterCardsWithConversion = Arrays::filter($counterfeiterCards, fn($counterfeiterCard) => $counterfeiterCard->conversion !== null);

        return Arrays::map($counterfeiterCardsWithConversion, fn($counterfeiterCard) => $counterfeiterCard->conversion);
    }
}