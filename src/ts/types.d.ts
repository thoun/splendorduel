/**
 * Your game interfaces
 */

import type { Card } from './cards';
import type { CounterfeiterCard } from './counterfeiter-cards';
import type { RoyalCard } from './royal-cards';
import type { Token } from './tokens';

export interface SplendorDuelPlayer extends Player {
    playerNo: number;
    tokens: Token[];
    privileges: number;
    cards: Card[];
    reserved?: Card[];
    royalCards: RoyalCard[];
    counterfeiterCards: CounterfeiterCard[];
    endReasons: number[];
}

export interface SplendorDuelGamedatas extends Gamedatas<SplendorDuelPlayer> {
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

export interface EnteringUsePrivilegeArgs {
    privileges: number;
}

export interface EnteringPlayActionArgs {
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

export interface EnteringReserveCardArgs {
    canReserve: number;
}

export interface EnteringPlaceJokerArgs {
    colors: number[];
}

export interface EnteringTakeBoardTokenArgs {
    color: number;
    number: number;
    canTakeAnyColorOrTwoOfColor: boolean;
}

export interface EnteringTakeOpponentTokenArgs {
    opponentId: number;
}

export interface EnteringReserveFromDeckChooseCardArgs {
    level: number;
    _private: {
        cards: Card[];
    };
}

// privileges
export interface NotifPrivilegesArgs {
    privileges: { [playerId: number]: number };
    from: number;
    to: number;
    count: number;
}

// refill
export interface NotifRefillArgs {
    refilledTokens: Token[];
}

// takeTokens
export interface NotifTakeTokensArgs {
    playerId: number;
    tokens: Token[];
    from?: string;
}

export interface NotifNewPlayerCardArgs {
    playerId: number;
    card: Card;
}

export interface NotifNewPlayerCounterfeiterCardArgs {
    playerId: number;
    card: CounterfeiterCard;
}

// reserveCard
export interface NotifReserveCardArgs extends NotifNewPlayerCardArgs {
    fromDeck: boolean;
    level: number;
    cardDeckCount: number;
    cardDeckTop: Card | null;
}

// buyCard
export interface NotifBuyCardArgs extends NotifNewPlayerCardArgs {
    fromReserved: boolean;
    tokens: Token[];
}   

// buyCounterfeiterCard
export interface NotifBuyCounterfeiterCardArgs extends NotifNewPlayerCounterfeiterCardArgs {
    tokens: Token[];
}

// takeCounterfeiterCard
export interface NotifTakeCounterfeiterCardArgs extends NotifNewPlayerCounterfeiterCardArgs {
    fromDeck: boolean;
    counterfeiterDeckCount: number;
    counterfeiterDeckTop: CounterfeiterCard | null;
}

// takeRoyalCard
export interface NotifTakeRoyalCardArgs {
    playerId: number;
    card: RoyalCard;
}

// discardTokens
export interface NotifDiscardTokensArgs {
    playerId: number;
    tokens: Token[];
}

// newTableCard
export interface NotifNewTableCardArgs {
    newCard: Card;
    cardDeckCount: number;
    cardDeckTop: Card | null;
    level: number;
}

// newTableRoyalCard
export interface NotifNewTableRoyalCardArgs {
    newCard: RoyalCard;
}

export interface NotifNewCounterfeiterCardsArgs {
    cards: CounterfeiterCard[];
    counterfeiterDeckCount: number;
    counterfeiterDeckTop: CounterfeiterCard;
}

// win
export interface NotifWinArgs {
    playerId: number;
    endReasons: number[];
}         
