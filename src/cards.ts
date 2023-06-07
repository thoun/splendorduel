interface Card {
    id: number;
    location: string;
    locationArg: number;
    level: number;
    index: number;
    color: number;
    cost: number[];
    provides: number[];
    crowns: number;
    power: number | null;
}

class CardsManager extends CardManager<Card> {
    constructor (public game: SplendorDuelGame) {
        super(game, {
            getId: (card) => `card-${card.id}`,
            setupDiv: (card: Card, div: HTMLElement) => {
                div.classList.add('splendorduel-card');
                div.dataset.level = ''+card.level;
            },
            setupFrontDiv: (card: Card, div: HTMLElement) => { 
                div.dataset.index = ''+card.index;
                if (card.index > 0) {
                    game.setTooltip(div.id, this.getTooltip(card));
                }
            },
            isCardVisible: card => Boolean(card.index),
            cardWidth: 120,
            cardHeight: 221,
        });
    }

    private getTooltip(card: Card): string {
        let message = `
        <strong>${_("Level:")}</strong> ${card.level}

        <strong>${_("Color:")}</strong> ${this.game.getColor(card.color)}
        <br>
        <strong>${_("Cost:")}</strong> ${JSON.stringify(card.cost)}
        <br>
        <strong>${_("Provides:")}</strong> ${JSON.stringify(card.provides)}
        <br>
        <strong>${_("Crowns:")}</strong> ${card.crowns}
        <br>
        <strong>${_("Power:")}</strong> ${card.power}
        `;
 
        return message;
    }
}