
class TableCenter {
    public bag: VoidStock<Token>;
    private board: TokenBoard;

    public cardsDecks: Deck<Card>[] = [];
    public cards: SlotStock<Card>[] = [];
    public royalCards: LineStock<Card>[];
        
    constructor(private game: SplendorDuelGame, gamedatas: SplendorDuelGamedatas) {
        this.bag = new VoidStock<Token>(game.tokensManager, document.getElementById('bag'));

        this.board = new TokenBoard(game, gamedatas.board);

        for (let level = 3; level >= 1; level--) {
            document.getElementById('table-cards').insertAdjacentHTML('beforeend', `
                <div id="card-deck-${level}"></div>
                <div id="table-cards-${level}"></div>
            `);
            this.cardsDecks[level] = new Deck<Card>(game.cardsManager, document.getElementById(`card-deck-${level}`), {
                cardNumber: gamedatas.cardDeckCount[level],
                topCard: gamedatas.cardDeckTop[level],
            });
            this.cardsDecks[level].onCardClick = card => this.game.onTableCardClick(card);

            const slotsIds = [];
            for (let i = 1; i <= 6 - level; i++) {
                slotsIds.push(i);
            }
            this.cards[level] = new SlotStock<Card>(game.cardsManager, document.getElementById(`table-cards-${level}`), {
                slotsIds,
                mapCardToSlot: card => card.locationArg,
                gap: '12px',
            });
            this.cards[level].onCardClick = card => this.game.onTableCardClick(card);
            this.cards[level].addCards(gamedatas.tableCards[level]);
        }

        /*this.royalCards = new LineStock<Card>(game.cardsManager, document.getElementById(`royal-cards`), {
            center: true,
        });
        this.royalCards.onCardClick = card => this.game.onRoyalCardClick(card);
        this.royalCards.addCards(gamedatas.royalCards);*/
    }
    
    public setCardsSelectable(selectable: boolean, selectableCards: Card[] = [], all: boolean = false) {
        for (let level = 3; level >= 1; level--) {
            this.cardsDecks[level].setSelectionMode(selectable && all ? 'single' : 'none');
            this.cards[level].setSelectionMode(selectable ? 'single' : 'none');

            if (selectable && !all) {
                this.cardsDecks[level].setSelectableCards(selectableCards);
                this.cards[level].setSelectableCards(selectableCards);
            }
        }
    }
    
    public refillBoard(refilledTokens: Token[]): Promise<any> {
        return this.board.refill(refilledTokens);
    }
    
    public setBoardSelectable(selectionType: 'privileges' | 'play' | 'effect' | null, max: number = 3, color: number = null) {
        this.board.setSelectable(selectionType, max, color);
    }
    
    public reserveCard(args: NotifReserveCardArgs) {
        this.game.cardsManager.removeCard(args.card);

        this.replaceCard(args);
    }
    
    public replaceCard(args: NotifNewPlayerCardArgs) {
        if (args.newCard) {
            this.cards[args.level].addCard(args.newCard);
        }

        this.cardsDecks[args.level].setCardNumber(args.cardDeckCount, args.cardDeckTop);
    }
}