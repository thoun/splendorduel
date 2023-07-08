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
    points: number;
    power: number[];
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
            cardHeight: 183,
        });
    }

    private getTooltip(card: Card): string {
        let message = `
        <strong>${_("Level:")}</strong> ${card.level}
        <br>
        <strong>${_("Color:")}</strong> ${this.game.getColor(card.color)}
        <br>
        <strong>${_("Cost:")}</strong> ${Object.entries(card.cost).map(entry => 
            `${entry[1]} <div class="token-icon" data-type="${entry[0]}"></div>`
        ).join(' &nbsp; ')}`;
        if (Object.values(card.provides).length) {
            message += `<br>
            <strong>${_("Provides:")}</strong> ${Object.entries(card.provides).map(entry => 
                `${entry[1]} ${/*Number(entry[0]) == 9 ? '?' :*/ `<div class="token-icon" data-type="${entry[0]}"></div>`}`
            ).join(' &nbsp; ')}`;
        }
        if (card.points) {
            message += `
            <br>
            <strong>${_("Points:")}</strong> ${card.points}
            `;
        }
        if (card.crowns) {
            message += `
            <br>
            <strong>${_("Crowns:")}</strong> ${card.crowns}`;
        }
        if (card.power.length) {
            message += `
            <br>
            <strong>${_("Power:")}</strong> ${card.power.map(power => this.game.getPower(power)).join(', ')}
            `;
        }
 
        return message;
    }
}