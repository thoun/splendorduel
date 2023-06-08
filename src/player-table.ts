const isDebug = window.location.host == 'studio.boardgamearena.com' || window.location.hash.indexOf('debug') > -1;;
const log = isDebug ? console.log.bind(window.console) : function () { };

class PlayerTable {
    public playerId: number;
    public voidStock: VoidStock<Card>;
    public hand?: LineStock<Card>;
    public played: LineStock<Card>[] = [];
    public tokens: LineStock<Token>;
    public limitSelection: number | null = null;
    public royalCards: LineStock<RoyalCard>;

    private currentPlayer: boolean;

    constructor(private game: SplendorDuelGame, player: SplendorDuelPlayer) {
        this.playerId = Number(player.id);
        this.currentPlayer = this.playerId == this.game.getPlayerId();

        let html = `
        <div id="player-table-${this.playerId}" class="player-table" style="--player-color: #${player.color};">
            <div id="player-table-${this.playerId}-name" class="name-wrapper">${player.name}</div>
        `;
        if (this.currentPlayer) {
            html += `
            <div class="block-with-text hand-wrapper">
                <div class="block-label">${_('Your hand')}</div>
                <div id="player-table-${this.playerId}-hand" class="hand cards"></div>
            </div>`;
        }
        html += `
            <div id="player-table-${this.playerId}-tokens" class="tokens"></div>
            
            <div class="visible-cards">`;            
            for (let i = 1; i <= 5; i++) {
                html += `
                <div id="player-table-${this.playerId}-played-${i}" class="cards"></div>
                `;
            }
            html += `
            </div>

            <div id="player-table-${this.playerId}-royal-cards"></div>
            
        </div>
        `;

        dojo.place(html, document.getElementById('tables'));

        if (this.currentPlayer) {
            const handDiv = document.getElementById(`player-table-${this.playerId}-hand`);
            this.hand = new LineStock<Card>(this.game.cardsManager, handDiv);
            this.hand.onCardClick = (card: Card) => this.game.onReservedCardClick(card);
            
            this.hand.addCards(player.reserved);

        }
        this.voidStock = new VoidStock<Card>(this.game.cardsManager, document.getElementById(`player-table-${this.playerId}-name`));
               
        for (let i = 1; i <= 5; i++) {
            const playedDiv = document.getElementById(`player-table-${this.playerId}-played-${i}`);
            this.played[i] = new LineStock<Card>(this.game.cardsManager, playedDiv, {
                direction: 'column',
                center: false,
            });
            this.played[i].addCards(player.cards.filter(card => Number(card.location.slice(-1)) == i));
            playedDiv.style.setProperty('--card-overlap', '195px');
        }
        
        this.royalCards = new LineStock<RoyalCard>(this.game.royalCardsManager, document.getElementById(`player-table-${this.playerId}-royal-cards`));
        this.royalCards.addCards(player.royalCards);
        
        this.tokens = new LineStock<Token>(this.game.tokensManager, document.getElementById(`player-table-${this.playerId}-tokens`), {
            center: false,
        });
        
        this.tokens.addCards(player.tokens);
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
        this.hand.setSelectionMode(selectable ? 'single' : 'none');
        if (selectable) {
            this.hand.setSelectableCards(buyableCards);
        }
    }    
    
    public addCard(card: Card): Promise<any> {
        return this.played[Number(card.location.slice(-1))].addCard(card);
    }

    public addRoyalCard(card: RoyalCard): Promise<any> {
        return this.royalCards.addCard(card);
    }
}