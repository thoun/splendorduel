/**
 * Your game interfaces
 */

interface SplendorDuelPlayer extends Player {
    playerNo: number;
    privileges: number;
    recruit: number;
    bracelet: number;
    //handCount: number;
    hand?: Card[];
    playedCards: { [color: number]: Card[] };
    destinations: Token[];
    reservedDestinations?: Token[];
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
    cardDeckTop?: Card;
    cardDeckCount: number;
    cardDiscardCount: number;
    centerCards: Card[];
    centerDestinationsDeckTop: { [letter: string]: Token };
    centerDestinationsDeckCount: { [letter: string]: number };
    centerDestinations: { [letter: string]: Token[] };
    firstPlayerId: number;
    lastTurn: boolean;
    reservePossible: boolean;
}

interface SplendorDuelGame extends Game {
    animationManager: AnimationManager;
    cardsManager: CardsManager;
    tokensManager: TokensManager;

    getPlayerId(): number;
    getPlayer(playerId: number): SplendorDuelPlayer;
    //getGain(type: number): string;
    //getColor(color: number): string;
    getTooltipGain(type: number): string;
    getTooltipColor(color: number): string;
    getGameStateName(): string;
    getCurrentPlayerTable(): PlayerTable | null;

    setTooltip(id: string, html: string): void;
    highlightPlayerTokens(playerId: number | null): void;
    onTableDestinationClick(token: Token): void;
    onHandCardClick(card: Card): void;
    onTableCardClick(card: Card): void;
    onPlayedCardClick(card: Card): void;
}

interface EnteringPlayActionArgs {
    canRecruit: boolean;
    canExplore: boolean;
    canTrade: boolean;
    possibleDestinations: Token[];
}

interface EnteringChooseNewCardArgs {
    centerCards: Card[];
    freeColor: number;
    recruits: number;
    allFree: boolean;
}

interface EnteringPayDestinationArgs {
    selectedDestination: Token;
    recruits: number;
}

interface EnteringTradeArgs {
    bracelets: number;
    gainsByBracelets: { [bracelets: number]: number };
}

// playCard
interface NotifPlayCardArgs {
    playerId: number;
    card: Card;
    newHandCard: Card;
    effectiveGains: { [type: number]: number };
}

// card
interface NotifNewCardArgs {
    playerId: number;
    card: Card;
    cardDeckTop?: Card;
    cardDeckCount: number;
}

// takeDestination
interface NotifTakeDestinationArgs {
    playerId: number;
    token: Token;
    effectiveGains: { [type: number]: number };
}

// newTableDestination
interface NotifNewTableDestinationArgs {
    token: Token;
    letter: string;    
    destinationDeckTop?: Token;
    destinationDeckCount: number;
}

// trade
interface NotifTradeArgs {
    playerId: number;
    effectiveGains: { [type: number]: number };
}

// discardCards
interface NotifDiscardCardsArgs {
    playerId: number;
    cards: Card[];
    cardDiscardCount: number;
}

// discardTableCard
interface NotifDiscardTableCardArgs {
    card: Card;
}

// reserveDestination
interface NotifReserveDestinationArgs {
    playerId: number;
    token: Token;
}

// score
interface NotifScoreArgs {
    playerId: number;
    newScore: number;
    incScore: number;
}

// cardDeckReset
interface NotifCardDeckResetArgs {  
    cardDeckTop?: Card;
    cardDeckCount: number;
    cardDiscardCount: number;
}
