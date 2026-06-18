/**
 * Your game interfaces
 */

interface SplendorDuelPlayer extends Player {
    playerNo: number;
    tokens: Token[];
    privileges: number;
    cards: Card[];
    reserved?: Card[];
    royalCards: RoyalCard[];
    counterfeiterCards: CounterfeiterCard[];
    endReasons: number[];
}

interface SplendorDuelGamedatas {
    current_player_id: string;
    decision: {decision_type: string};
    game_result_neutralized: string;
    gamestate: Gamestate;
    gamestates: { [gamestateId: number]: Gamestate };
    neutralized_player_id: string;
    notifications: {last_packet_id: string, move_nbr: string}
    playerorder: (string | number)[];
    players: { [playerId: number]: SplendorDuelPlayer };
    tablespeed: string;

    // Add here variables you set up in getAllDatas
    board: Token[];
    cardDeckCount: { [level: number]: number };
    cardDeckTop: { [level: number]: Card };
    tableCards: { [level: number]: Card[] };
    royalCards: RoyalCard[];
    counterfeiterDeckCount: number;
    counterfeiterDeckTop: CounterfeiterCard;
    counterfeiterCards: CounterfeiterCard[];
    expansion: boolean;
}

interface SplendorDuelGame extends Game {
    animationManager: AnimationManager;
    cardsManager: CardsManager;
    royalCardsManager: RoyalCardsManager;
    counterfeiterCardsManager: CounterfeiterCardsManager;
    tokensManager: TokensManager;

    getPlayerId(): number;
    getPlayer(playerId: number): SplendorDuelPlayer;
    getColor(color: number): string;
    getPower(power: number): string;
    getGameStateName(): string;
    getCurrentPlayerTable(): PlayerTable | null;
    getPlayersTokens(): Token[];

    setTooltip(id: string, html: string): void;
    onTableTokenSelectionChange(tokens: Token[], valid: boolean, selectionType?: SelectionType): void;
    onPlayerTokenSelectionChange(tokens: Token[]): void;
    onTableCardClick(card: Card, selected: boolean): void;
    onRoyalCardClick(card: RoyalCard): void;
    onCounterfeiterCardClick(card: CounterfeiterCard): void;
    onReservedCardClick(card: Card): void;
    onColumnClick(color: number): void;
}

interface EnteringUsePrivilegeArgs {
    privileges: number;
}

interface EnteringPlayActionArgs {
    privileges: number;
    canRefill: boolean;
    mustRefill: boolean;
    canTakeTokens: boolean;
    canReserve: boolean;
    canBuyCard: boolean;
    buyableCards: { [card: number]: { [color: number]: number }[] };
    buyableCounterfeiterCards?: { [card: number]: { [color: number]: number }[] };
    reducedCosts: { [card: number]: { [color: number]: number } };
    reducedCounterfeiterCosts: { [card: number]: { [color: number]: number } };
    playerAntiPlaying: boolean;
    opponentAntiPlaying: boolean;
}

interface EnteringReserveCardArgs {
    canReserve: number;
}

interface EnteringPlaceJokerArgs {
    colors: number[];
}

interface EnteringTakeBoardTokenArgs {
    color: number;
    number: number;
    canTakeAnyColorOrTwoOfColor: boolean;
}

interface EnteringTakeOpponentTokenArgs {
    opponentId: number;
}

interface EnteringReserveFromDeckChooseCardArgs {
    level: number;
    _private: {
        cards: Card[];
    };
}

// privileges
interface NotifPrivilegesArgs {
    privileges: { [playerId: number]: number };
    from: number;
    to: number;
    count: number;
}

// refill
interface NotifRefillArgs {
    refilledTokens: Token[];
}

// takeTokens
interface NotifTakeTokensArgs {
    playerId: number;
    tokens: Token[];
    from?: string;
}

interface NotifNewPlayerCardArgs {
    playerId: number;
    card: Card;
}

interface NotifNewPlayerCounterfeiterCardArgs {
    playerId: number;
    card: CounterfeiterCard;
}

// reserveCard
interface NotifReserveCardArgs extends NotifNewPlayerCardArgs {
    fromDeck: boolean;
    level: number;
    cardDeckCount: number;
    cardDeckTop: Card | null;
}

// buyCard
interface NotifBuyCardArgs extends NotifNewPlayerCardArgs {
    fromReserved: boolean;
    tokens: Token[];
}   

// buyCounterfeiterCard
interface NotifBuyCounterfeiterCardArgs extends NotifNewPlayerCounterfeiterCardArgs {
    tokens: Token[];
}

// takeRoyalCard
interface NotifTakeRoyalCardArgs {
    playerId: number;
    card: RoyalCard;
}

// discardTokens
interface NotifDiscardTokensArgs {
    playerId: number;
    tokens: Token[];
}

// newTableCard
interface NotifNewTableCardArgs {
    newCard: Card;
    cardDeckCount: number;
    cardDeckTop: Card | null;
    level: number;
}

// newTableRoyalCard
interface NotifNewTableRoyalCardArgs {
    newCard: RoyalCard;
}

interface NotifNewCounterfeiterCardsArgs {
    cards: CounterfeiterCard[];
    counterfeiterDeckCount: number;
    counterfeiterDeckTop: CounterfeiterCard;
}

// win
interface NotifWinArgs {
    playerId: number;
    endReasons: number[];
}         
