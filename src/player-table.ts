const isDebug = window.location.host == 'studio.boardgamearena.com' || window.location.hash.indexOf('debug') > -1;;
const log = isDebug ? console.log.bind(window.console) : function () { };

class PlayerTable {
    public playerId: number;
    public voidStock: VoidStock<Card>;
    public reserved: LineStock<Card>;
    public played: LineStock<Card>[] = [];
    public tokens: LineStock<Token>[] = [];
    public limitSelection: number | null = null;
    public royalCards: LineStock<RoyalCard>;

    private currentPlayer: boolean;

    constructor(private game: SplendorDuelGame, player: SplendorDuelPlayer) {
        this.playerId = Number(player.id);
        this.currentPlayer = this.playerId == this.game.getPlayerId();

        let html = `
        <div id="player-table-${this.playerId}" class="player-table" style="--player-color: #${player.color};">
            <div id="player-table-${this.playerId}-name" class="name-wrapper">${player.name}</div>
            <div class="columns">
        `;
            [1,2,3,4,5,0,-1].forEach(i => {
                html += `
                <div id="player-table-${this.playerId}-tokens-${i}" class="tokens"></div>
                `;
            });         
            [1,2,3,4,5,9].forEach(i => {
                html += `
                <div id="player-table-${this.playerId}-played-${i}" class="cards"></div>
                `;
            });
            html += `
                <div class="hand-wrapper">
                    <div class="block-label">${_('Reserved cards')}</div>
                    <div id="player-table-${this.playerId}-reserved" class="cards"></div>
                </div>
            </div>

            <div id="player-table-${this.playerId}-royal-cards"></div>
            
        </div>
        `;

        dojo.place(html, document.getElementById('tables'));

        const reservedDiv = document.getElementById(`player-table-${this.playerId}-reserved`);
        this.reserved = new LineStock<Card>(this.game.cardsManager, reservedDiv);
        this.reserved.onCardClick = (card: Card) => this.game.onReservedCardClick(card);
        
        this.reserved.addCards(player.reserved);

        this.voidStock = new VoidStock<Card>(this.game.cardsManager, document.getElementById(`player-table-${this.playerId}-name`));

        [1,2,3,4,5,9].forEach(i => {
            const playedDiv = document.getElementById(`player-table-${this.playerId}-played-${i}`);
            this.played[i] = new LineStock<Card>(this.game.cardsManager, playedDiv, {
                direction: 'column',
                center: false,
            });
            this.played[i].addCards(player.cards.filter(card => Number(card.location.slice(-1)) == i));
            playedDiv.addEventListener('click', () => {
                if (playedDiv.classList.contains('selectable-for-joker')) {
                    this.game.onColumnClick(i);
                }
            });
            playedDiv.style.setProperty('--card-overlap', '135px');
        });
        
        this.royalCards = new LineStock<RoyalCard>(this.game.royalCardsManager, document.getElementById(`player-table-${this.playerId}-royal-cards`));
        this.royalCards.addCards(player.royalCards);
        
        const tokensStockSettings: LineStockSettings = {
            direction: 'column',
            center: false,
        };
        [1,2,3,4,5,0, -1].forEach(i => {
            const tokenDiv = document.getElementById(`player-table-${this.playerId}-tokens-${i}`);
            this.tokens[i] = new LineStock<Token>(this.game.tokensManager, tokenDiv, tokensStockSettings);
            this.tokens[i].onSelectionChange = () => this.game.onPlayerTokenSelectionChange(this.getSelectedTokens());
            tokenDiv.style.setProperty('--card-overlap', '50px');
        });
        
        this.addTokens(player.tokens);
    }

    public updateCounter(type: 'recruits' | 'bracelets', count: number) {
        document.getElementById(`player-table-${this.playerId}-boat`).dataset[type] = ''+count;
    }

    public playCard(card: Card, fromElement?: HTMLElement): Promise<boolean> {
        return this.played[card.color].addCard(card, {
            fromElement
        });
    }

    public setHandSelectable(selectable: boolean, buyableCards: Card[] | null = null) {
        this.reserved.setSelectionMode(selectable ? 'single' : 'none');
        if (selectable) {
            this.reserved.setSelectableCards(buyableCards);
        }
    }    
    
    public addCard(card: Card): Promise<any> {
        return this.played[Number(card.location.slice(-1))].addCard(card);
    }

    public addRoyalCard(card: RoyalCard): Promise<any> {
        return this.royalCards.addCard(card);
    }

    public addTokens(tokens: Token[]): Promise<any> {
        return Promise.all([1,2,3,4,5,0,-1].map(i => this.tokens[i].addCards(tokens.filter(token => token.color == i))));
    }
    
    public addReservedCard(card: Card): Promise<any> {
        return this.reserved.addCard(this.currentPlayer ? card : { ...card, index: undefined });
    }

    public setColumnsSelectable(colors: number[]) {
        [1,2,3,4,5].forEach(i => 
            document.getElementById(`player-table-${this.playerId}-played-${i}`).classList.toggle('selectable-for-joker', colors.includes(i))
        );         
    }
    
    public setTokensSelectable(selectable: boolean, goldAllowed: boolean) {
        (goldAllowed || !selectable ? [1,2,3,4,5,0,-1] : [1,2,3,4,5,0]).forEach(i => this.tokens[i].setSelectionMode(selectable ? 'multiple' : 'none'));
    }

    public getSelectedTokens(): Token[] {
        return [1,2,3,4,5,0,-1].map(i => this.tokens[i].getSelection()).reduce((a, b) => [...a, ...b], []);
    }
    
    public getCrowns(): number {
        let crowns = 0;
        [1,2,3,4,5,9].forEach(i => this.played[i].getCards().forEach(card => crowns += card.crowns));
        return crowns;
    }
    
    public getStrongestColumn(): number {
        let strongestColumnValue = 0;
        [1,2,3,4,5,9].forEach(color => {
            // we ignore multicolor in gray column as they will move to another column
            const colorPoints = this.played[color].getCards().filter(card => color !== 9 || !card.power.includes(2)).map(card => card.points).reduce((a, b) => a + b, 0);
            if (colorPoints > strongestColumnValue) {
                strongestColumnValue = colorPoints;
            }
        });
        
        return strongestColumnValue;
    }
}