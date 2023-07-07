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
    power: number | number[] | null;
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

    public getPower(power: number): string {
        switch (power) {
            case 1: return _("Take another turn immediately after this one ends.");
            case 2: return _("Place this card so that it overlaps a Jewel card with a bonus (see on the right). Treat this card’s <ICON> bonus as though it were the same color of the card it is overlapping.").replace('<ICON>', `<div class="token-icon" data-type="9"></div>`) +
                `<br><i>${_("If you do not have a card with a bonus, you cannot purchase this card.")}</i>`;
            case 3: return _("Take 1 token matching the color of this card from the board. If there are no such tokens left, ignore this effect.");
            case 4: return _("Take 1 Privilege. If none are available, take 1 from your opponent.");
            case 5: return _("Take 1 Gem or Pearl token from your opponent. If your opponent has no such tokens, ignore this effect. You cannot take a Gold token from your opponent.");
        }
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
        if (card.power) {
            message += `
            <br>
            <strong>${_("Power:")}</strong> ${Array.isArray(card.power) ? card.power.map(power => this.getPower(power)).join(', ') : this.getPower(card.power)}
            `;
        }
 
        return message;
    }
}