interface Token {
    id: number;
    location: string;
    locationArg: number;
    type: number;
    color: number;
    row?: number;
    column?: number;
}

class TokensManager extends CardManager<Token> {
    constructor (public game: SplendorDuelGame) {
        super(game, {
            getId: (card) => `token-${card.id}`,
            setupDiv: (card: Token, div: HTMLElement) => {
                div.classList.add('token');
                div.dataset.type = ''+card.type;
                if (card.type == 2) {
                    div.dataset.color = ''+card.color;
                }
            },
            setupFrontDiv: (card: Token, div: HTMLElement) => { 
                div.id = `${this.getId(card)}-front`;
                game.setTooltip(div.id, this.getType(card.type));
            },
        });
    }

    public getType(type: number): string {
        let message = '';
        switch (type) {
            case 1: message = _("Berry"); break;
            case 2: message = _("Meat"); break;
            case 3: message = _("Flint"); break;
            case 4: message = _("Skin"); break;
            case 5: message = _("Bone"); break;
        }

        return message;
    }
}