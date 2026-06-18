interface CounterfeiterCard {
    id: number;
    location: string;
    locationArg: number;
    type: number;
    cost: number[];
    crowns: number;
    points: number;
    powers: number[];
}

class CounterfeiterCardsManager extends CardManager<CounterfeiterCard> {
    constructor (public game: SplendorDuelGame) {
        super(game, {
            getId: (card) => `counterfeiter-card-${card.id}`,
            setupDiv: (card: CounterfeiterCard, div: HTMLElement) => {
                div.classList.add('counterfeiter-card');
                div.dataset.index = ''+card.type;
            },
            setupFrontDiv: (card: CounterfeiterCard, div: HTMLElement) => { 
                game.setTooltip(div.id, this.getTooltip(card));
            },
            isCardVisible: card => Boolean(card.type),
            cardWidth: 183,
            cardHeight: 120,
        });
    }

    private getTooltip(card: CounterfeiterCard): string {
        let message = `
        <strong>${_("Cost:")}</strong> ${Object.entries(card.cost).map(entry => 
            `${entry[1]} <div class="token-icon" data-type="${entry[0]}"></div>`
        ).join(' &nbsp; ')}`;
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
        message += `
        <br>
        <strong>${_("Power:")}</strong> ${this.getPower(card.type)}
        `;
 
        return message;
    }

    private getPower(type: number): string {
        switch (type) {
            case 1: case 2: case 3: case 4: case 5: return _("During a Purchase 1 Jewel card or Purchase 1 Counterfeiter card action, you may spend up to 2 Glassware tokens to reduce the cost of the color shown by 2 for each Glassware token spent.");
            case 6: return _("During a Purchase 1 Jewel card or Purchase 1 Counterfeiter card action, you may spend 2 Glassware tokens to reduce the cost of any <strong>single</strong> color by 3.");
            case 7: return _("During a Purchase 1 Jewel card or Purchase 1 Counterfeiter card action, you may spend 1 Glassware token to reduce the Pearl cost by 1.");
            case 8: return _("During a Purchase 1 Jewel card or Purchase 1 Counterfeiter card action, you may spend up to 2 Glassware tokens to reduce the cost of any color by 1 for each Glassware token spent. When spending 2 Glassware tokens, each cost reduction can be for the same color or different colors.");
            case 9: return _("At the end of your turn, before checking the token limit, you may spend Glassware to take 1 of the available Royal cards. The cost to use this ability is 1 Glassware token plus 1 Glassware token for each Royal card you already own. Replace the card with the top card of the Royal card deck.")
                +'<br><i>'+_("Royal cards taken after acquiring enough Crowns are <strong>not</strong> replaced.")+'</i>';
            case 10: return _("At the end of your turn, before checking the token limit, spend a Glassware token and return a Privilege to immediately take another turn.");
            case 11: return _("At the end of your turn, before checking the token limit, spend a Glassware token and return a Privilege to take 1 Gem, Pearl, or Glassware token from your opponent.");
            case 12: return _("When checking the 10-token limit at the end of your turn, ignore your Glassware tokens; they do not count against this limit.");
            case 13: return _("When Using a Privilege, take 2 Gem, Pearl, and/or Glassware tokens of your choice from the board instead of 1.")
                +'<br><i>'+_("Note: Since you may only use this ability once per turn, if you use more than 1 Privilege, only the first one will let you take 2 tokens; any other Privileges will only let you take 1 token as usual.")+'</i>';
            case 14: return _("When you take this card, you immediately acquire 2 Crowns. This might allow you to take 1 Royal card or fulfill a Victory condition.");
            case 15: return _("You can have up to 5 reserved cards instead of 3.")
                +'<br>'+_("Also, when doing the Take 1 Gold token and reserve 1 Jewel card action, you may reserve up to 2 cards instead of 1; each card can be taken from any level or drawn from any of the 3 decks.");
            case 16: return _("After purchasing a Jewel card that has a <ICON_ABILITY> ability, instead of taking 1 token matching the color of that card from the board, you may either:").replace('<ICON_ABILITY>', `<div class="ability-icon" data-ability="3"></div>`)
                +'<ul>'
                    +'<li>'+_("Take 2 tokens matching the color of the card from the board.") + '</li>'
                    + `<strong>${_('OR')}</strong>`
                    +'<li>'+_("Take any 1 Gem, Pearl, or Glassware token  from the board.") + '</li>'
                +'</ul>';
            case 17: return _("At the end of your turn, before checking the 10-token limit, you may spend 2 Glassware tokens to select one of the 3 decks (●,●●,●●●). Take the top 3 cards of the selected deck and choose 1 to reserve. Put the 2 cards you didn’t choose at the bottom of the corresponding deck in any order.")
                +'<br>'+_("As this is not a mandatory action, you can use this ability even when no Gold token is available on the board, and you cannot take a Gold token when using it. You cannot use this ability if you already have the maximum number of reserved cards.");
            ;
        }
    }
}
