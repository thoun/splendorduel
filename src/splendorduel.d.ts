/**
 * Your game interfaces
 */

interface SplendorDuelPlayer extends Player {
    playerNo: number;
    tokens: Token[];
    privileges: number;
    reservedCount: number;
    reserved?: Card[];
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
    onTableDestinationClick(token: Token): void;
    onHandCardClick(card: Card): void;
    onTableCardClick(card: Card): void;
    onPlayedCardClick(card: Card): void;
}

interface EnteringUsePrivilegeArgs {
    privileges: number;
    canSkipBoth: boolean;
}

interface EnteringRefillBoardArgs {
    mustRefill: boolean;
}

interface EnteringPlayActionArgs {
    canTakeTokens: boolean;
    canReserve: boolean;
    canBuyCard: boolean;
}

// refill
interface NotifRefillArgs {
    refilledTokens: Token[];
}
