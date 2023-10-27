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
}

interface SplendorDuelGame extends Game {
    animationManager: AnimationManager;
    cardsManager: CardsManager;
    royalCardsManager: RoyalCardsManager;
    tokensManager: TokensManager;

    getPlayerId(): number;
    getPlayer(playerId: number): SplendorDuelPlayer;
    getColor(color: number): string;
    getPower(power: number): string;
    getGameStateName(): string;
    getCurrentPlayerTable(): PlayerTable | null;

    setTooltip(id: string, html: string): void;
    onTableTokenSelectionChange(tokens: Token[], valid: boolean): void;
    onPlayerTokenSelectionChange(tokens: Token[]): void;
    onTableCardClick(card: Card): void;
    onRoyalCardClick(card: RoyalCard): void;
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
    buyableCards: Card[];
    reducedCosts: { [card: number]: { [color: number]: number } };
}

interface EnteringPlaceJokerArgs {
    colors: number[];
}

interface EnteringTakeBoardTokenArgs {
    color: number;
}

interface EnteringTakeOpponentTokenArgs {
    opponentId: number;
}

// privileges
interface NotifPrivilegesArgs {
    privileges: { [playerId: number]: number };
}

// refill
interface NotifRefillArgs {
    refilledTokens: Token[];
}

// takeTokens
interface NotifTakeTokensArgs {
    playerId: number;
    tokens: Token[];
}

interface NotifNewPlayerCardArgs {
    playerId: number;
    card: Card;
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

// win
interface NotifWinArgs {
    playerId: number;
}         
