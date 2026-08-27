import { Game } from './Game';
import { BgaCards } from './libs';

export interface RoyalCard {
    id: number;
    location: string;
    locationArg: number;
    index: number;
    points: number;
    power: number[];
}

export class RoyalCardsManager extends BgaCards.CardManager<RoyalCard> {
    constructor (public game: Game) {
        super(game, {
            getId: (card) => `royal-card-${card.id}`,
            setupDiv: (card: RoyalCard, div: HTMLElement) => {
                div.classList.add('royal-card');
                div.dataset.index = ''+card.index;
            },
            setupFrontDiv: (card: RoyalCard, div: HTMLElement) => { 
                game.setTooltip(div.id, this.getTooltip(card));
            },
            isCardVisible: () => true,
            cardWidth: 120,
            cardHeight: 183,
        });
    }

    private getTooltip(card: RoyalCard): string {
        let message = [];
        if (card.points) {
            message.push(`
            <strong>${_("Points:")}</strong> ${card.points}
            `);
        }
        if (card.power.length) {
            message.push(`
            <strong>${_("Power:")}</strong> ${card.power.map(power => this.game.getPower(power)).join(', ')}
            `);
        }
 
        return message.join('<br>');
    }
}
