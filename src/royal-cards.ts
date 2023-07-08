interface RoyalCard {
    id: number;
    location: string;
    locationArg: number;
    index: number;
    points: number;
    power: number[];
}

class RoyalCardsManager extends CardManager<RoyalCard> {
    constructor (public game: SplendorDuelGame) {
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
        let message = `
        <strong>${_("Points:")}</strong> ${card.points}
        `;
        if (card.power.length) {
            message += `
            <br>
            <strong>${_("Power:")}</strong> ${card.power.map(power => this.game.getPower(power)).join(', ')}
            `;
        }
 
        return message;
    }
}