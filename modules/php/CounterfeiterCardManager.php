<?php
declare(strict_types=1);

namespace Bga\Games\SplendorDuel;

use Bga\GameFramework\Components\ItemManager\ItemLocation;
use Bga\GameFramework\Components\ItemManager\ItemManager;
use Bga\GameFramework\Helpers\Collection;
use Bga\Games\SplendorDuel\Object\CounterfeiterCard;

class CounterfeiterCardManager {
    /** @var ItemManager<CounterfeiterCard> */
    public ItemManager $items;

    function __construct(
        protected Game $game,
    ) {
        $this->items = $game->bga->itemManagerFactory->createItemManager(
            CounterfeiterCard::class,
            locations: [
                new ItemLocation('deck'),
                new ItemLocation('table'),
                new ItemLocation('player'),
            ],
        );
    }

    public function initDb(): void {
        $this->items->initDb();
    }

    /** @return Collection<CounterfeiterCard> */
    public function getTable(): Collection {
        return $this->items->getItemsInLocation('table');
    }

    /** @return Collection<CounterfeiterCard> */
    public function getPlayer(int $playerId): Collection {
        return $this->items->getItemsInLocation(['player', $playerId]);
    }

    public function setup(): void {
        $counterfeiterCards = [];
        for ($i = 1; $i <= 17; $i++) {
            $counterfeiterCards[] = ['location' => 'deck', 'type' => $i ];
        }

        $this->items->createItems($counterfeiterCards);
        $this->items->shuffle('deck');

        $this->items->pickItems(3, 'deck', ['table', 0]);
    }

    public function refill(): void {
        $count = $this->items->countItemsInLocation('table');
        if ($count < 3) {
            $cards = $this->items->pickItems(3 - $count, 'deck', ['table', 0]);
            $this->game->notify->all('refillCounterfeiterCards', '', [
                'cards' => $cards->values(),
                'counterfeiterDeckCount' => $this->items->countItemsInLocation('deck'),
                'counterfeiterDeckTop' => CounterfeiterCard::onlyId($this->items->getItemOnTop('deck')),
            ]);
        }
    }

    public function fillResult(array &$result): void {
        $result['counterfeiterCards'] = $this->getTable()->values();
        $result['counterfeiterDeckCount'] = $this->items->countItemsInLocation('deck');
        $result['counterfeiterDeckTop'] = CounterfeiterCard::onlyId($this->items->getItemOnTop('deck'));

        foreach ($result["players"] as $playerId => &$player) {
            $player['counterfeiterCards'] = $this->getPlayer((int)$playerId)->values();
        }
    }

    public function playerHasCounterfeiterCard(int $playerId, int $type): bool {
        if (!$this->game->isCounterfeiterExpansion()) {
            return false;
        }
        
        return $this->getPlayer($playerId)->some(
            fn(CounterfeiterCard $card) => $card->type === $type
        );
    }

    public function getConversions(int $playerId): array {
        if (!$this->game->isCounterfeiterExpansion()) {
            return [];
        }
        
        return $this->getPlayer($playerId)
            ->whereNot('conversion', null)
            ->pluck('conversion')
            ->values();
    }
}
