<?php
declare(strict_types=1);

// Run with: php tests/payment-ways.php
// The payment search needs no framework services or database connection.
namespace Bga\GameFramework {
    class Table {}
}

namespace {
    use Bga\Games\SplendorDuel\Game;
    use Bga\Games\SplendorDuel\Object\CounterfeiterCard;

    foreach (['ActionTrait', 'StateTrait', 'ArgsTrait', 'DebugUtilTrait', 'Game'] as $name) {
        require_once __DIR__."/../modules/php/$name.php";
    }
    require_once __DIR__.'/../modules/php/Object/CounterfeiterCard.php';

    $game = (new ReflectionClass(Game::class))->newInstanceWithoutConstructor();
    $converters = [];
    for ($type = 1; $type <= 8; $type++) {
        $card = new CounterfeiterCard();
        $card->type = $type;
        $card->setup([]);
        $converters[$type] = $card->conversion;
    }

    function normalizePayments(array $payments): array {
        $unique = [];
        foreach ($payments as $payment) {
            ksort($payment);
            $unique[json_encode($payment)] = true;
        }
        $result = array_keys($unique);
        sort($result);
        return $result;
    }

    function checkPayments(string $name, array $expected, array $actual): void {
        if (normalizePayments($expected) !== normalizePayments($actual)) {
            throw new RuntimeException($name.': '.json_encode(compact('expected', 'actual')));
        }
        if (count($actual) !== count(normalizePayments($actual))) {
            throw new RuntimeException($name.': duplicate payments');
        }
    }

    checkPayments('Free card', [[]], $game->findPaymentWays([], [], []));
    checkPayments('Zero reduced cost', [[]], $game->findPaymentWays([BLUE => 0], [], []));
    checkPayments('Gold substitution', [[GOLD => 1], [BLUE => 1]],
        $game->findPaymentWays([BLUE => 1], [GOLD => 1, BLUE => 1], []));
    checkPayments('Gold cost requires gold', [],
        $game->findPaymentWays([GOLD => 1], [GLASSWARE => 2], [$converters[6], $converters[8]]));
    checkPayments('Conversion can pay part of its output', [[GOLD => 1], [GLASSWARE => 2], [GOLD => 2], [GOLD => 1, GLASSWARE => 1]],
        $game->findPaymentWays([BLUE => 1], [GOLD => 2, GLASSWARE => 2], [$converters[6]]));
    checkPayments('Conversion inputs can mix gold and glassware', [[GOLD => 1, GLASSWARE => 1]],
        $game->findPaymentWays([BLUE => 3], [GOLD => 1, GLASSWARE => 1], [$converters[6]]));
    checkPayments('Every converter input combination is offered', [
        [GLASSWARE => 2], [GOLD => 1, GLASSWARE => 1], [GOLD => 2],
        [GOLD => 1, GLASSWARE => 2], [GOLD => 2, GLASSWARE => 1], [GOLD => 2, GLASSWARE => 2],
    ], $game->findPaymentWays([BLACK => 3], [GOLD => 2, GLASSWARE => 2], [$converters[6]]));
    checkPayments('Mixed conversion preserves gold for an explicit gold cost', [[GOLD => 2, GLASSWARE => 1]],
        $game->findPaymentWays([BLACK => 3, GOLD => 1], [GOLD => 2, GLASSWARE => 1], [$converters[6]]));
    checkPayments('Mixed conversion still requires two inputs', [],
        $game->findPaymentWays([BLACK => 3], [GOLD => 1], [$converters[6]]));
    checkPayments('Mixed conversion still respects its usage limit', [],
        $game->findPaymentWays([BLACK => 3, BLUE => 3], [GOLD => 2, GLASSWARE => 2], [$converters[6]]));
    checkPayments('Multicolor conversion excludes pearls', [],
        $game->findPaymentWays([PEARL => 1], [GLASSWARE => 2], [$converters[6], $converters[8]]));
    checkPayments('Pearl conversion', [[GLASSWARE => 1]],
        $game->findPaymentWays([PEARL => 1], [GLASSWARE => 1], [$converters[7]]));
    checkPayments('Converter usage is shared across colors', [],
        $game->findPaymentWays([BLUE => 2, RED => 2], [GLASSWARE => 4], [$converters[6]]));
    checkPayments('Repeated multicolor conversion', [[GLASSWARE => 2]],
        $game->findPaymentWays([BLUE => 1, RED => 1], [GLASSWARE => 2], [$converters[8]]));
    checkPayments('Both direct tokens and converters remain optional', [
        [GOLD => 1], [GLASSWARE => 1], [GOLD => 1, BLUE => 1],
        [GLASSWARE => 1, BLUE => 1], [GOLD => 1, GLASSWARE => 1],
    ], $game->findPaymentWays([BLUE => 2], [BLUE => 1, GOLD => 1, GLASSWARE => 1], [$converters[3]]));

    // Deliberately exhaustive reference: explore every payment order without
    // caching, including interleaving payments for different cost colors.
    function exhaustivePayments(array $cost, array $tokens, array $converters, array $payment = []): array {
        if (array_sum($cost) === 0) {
            return [$payment];
        }

        $payments = [];
        foreach ($cost as $color => $needed) {
            if ($needed <= 0) {
                continue;
            }

            $steps = [];
            foreach (array_unique([GOLD, $color]) as $from) {
                if (($tokens[$from] ?? 0) > 0) {
                    $steps[] = [[$from => 1], 1, null];
                }
            }
            foreach ($converters as $index => $converter) {
                $target = array_key_first($converter->to);
                $colors = $target === MULTICOLOR ? [BLUE, WHITE, GREEN, BLACK, RED] : [$target];
                if ($converter->repeat <= 0 || !in_array($color, $colors)) {
                    continue;
                }
                $input = array_values($converter->from)[0];
                $from = array_key_first($converter->from);
                for ($matching = 0; $matching <= $input; $matching++) {
                    $gold = $input - $matching;
                    if (($tokens[$from] ?? 0) >= $matching && ($tokens[GOLD] ?? 0) >= $gold) {
                        $spent = array_filter([$from => $matching, GOLD => $gold]);
                        $steps[] = [$spent, array_values($converter->to)[0], $index];
                    }
                }
            }

            foreach ($steps as [$spent, $output, $index]) {
                $remainingCost = $cost;
                $remainingCost[$color] = max(0, $needed - $output);
                $remainingTokens = $tokens;
                $remainingConverters = $converters;
                if ($index !== null) {
                    $remainingConverters[$index] = clone $remainingConverters[$index];
                    $remainingConverters[$index]->repeat--;
                }
                $nextPayment = $payment;
                foreach ($spent as $from => $input) {
                    $remainingTokens[$from] -= $input;
                    $nextPayment[$from] = ($nextPayment[$from] ?? 0) + $input;
                }
                array_push($payments, ...exhaustivePayments($remainingCost, $remainingTokens, $remainingConverters, $nextPayment));
            }
        }
        return $payments;
    }

    mt_srand(252420);
    $convertersBefore = serialize($converters);
    for ($case = 0; $case < 1000; $case++) {
        $cost = [];
        $tokens = array_fill_keys([GOLD, PEARL, BLUE, WHITE, GREEN, BLACK, RED, GLASSWARE], 0);
        $costSize = mt_rand(0, 7);
        for ($i = 0; $i < $costSize; $i++) {
            $color = mt_rand(GOLD, GLASSWARE);
            $cost[$color] = ($cost[$color] ?? 0) + 1;
        }
        for ($i = 0; $i < 6; $i++) {
            $tokens[mt_rand(GOLD, GLASSWARE)]++;
        }
        $selected = array_filter($converters, fn() => mt_rand(0, 3) === 0);
        checkPayments('Random case '.$case,
            exhaustivePayments($cost, $tokens, $selected),
            $game->findPaymentWays($cost, $tokens, $selected));
    }
    if (serialize($converters) !== $convertersBefore) {
        throw new RuntimeException('The search changed the original converters');
    }

    // This took over 43 seconds in the original search. Ten tokens plus the
    // extra value from converter 6 cannot cover a total cost of twelve.
    $start = microtime(true);
    checkPayments('Expensive impossible card', [], $game->findPaymentWays(
        [BLUE => 3, RED => 5, BLACK => 3, PEARL => 1],
        [GOLD => 3, GLASSWARE => 4, BLUE => 1, RED => 1, BLACK => 1],
        [$converters[6], $converters[8]],
    ));
    printf("All payment checks passed, including 1000 exhaustive comparisons. Slow-case benchmark: %.4fs\n", microtime(true) - $start);
}
