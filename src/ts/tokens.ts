import { Game } from './Game';
import { BgaCards } from './libs';

export interface Token {
    id: number;
    location: string;
    locationArg: number;
    type: number;
    color: number;
    row?: number;
    column?: number;
}

export class TokensManager extends BgaCards.CardManager<Token> {
    constructor (public game: Game) {
        super(game, {
            getId: (card) => `token-${card.id}`,
            setupDiv: (card: Token, div: HTMLElement) => {
                div.draggable = false;
                div.classList.add('token');
                div.dataset.type = ''+card.type;
                if (card.type == 2) {
                    div.dataset.color = ''+card.color;
                }
                //game.setTooltip(div.id, this.getTooltip(card));
            },
            setupFrontDiv: (card: Token, div: HTMLElement) => { 
                //div.id = `${this.getId(card)}-front`;
                div.draggable = false;
            },
        });
    }

    public getTooltip(token: Token): string {
        switch (token.type) {
            case 1: return _("Gold");
            case 2: return this.game.getColor(token.color);
        }
    }
}
