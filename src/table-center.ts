class TableCenter {
    public bag: VoidStock<Token>;
    private bagCounter: Counter;
    private board: TokenBoard;

    public cardsDecks: Deck<Card>[] = [];
    public cards: SlotStock<Card>[] = [];
    public royalCards: LineStock<RoyalCard>;    
        
    constructor(private game: SplendorDuelGame, gamedatas: SplendorDuelGamedatas) {
        this.bag = new VoidStock<Token>(game.tokensManager, document.getElementById('bag'));

        this.bagCounter = new ebg.counter();
        this.bagCounter.create(`bag-counter`);
        this.bagCounter.setValue(25 - (gamedatas.board.length + Object.values(gamedatas.players).map(player => player.tokens.length).reduce((a, b) => a + b, 0)));

        this.board = new TokenBoard(game, gamedatas.board);

        for (let level = 3; level >= 1; level--) {
            document.getElementById('table-cards').insertAdjacentHTML('beforeend', `
                <div id="card-deck-${level}"></div>
                <div id="table-cards-${level}"></div>
            `);
            this.cardsDecks[level] = new Deck<Card>(game.cardsManager, document.getElementById(`card-deck-${level}`), {
                cardNumber: gamedatas.cardDeckCount[level],
                topCard: gamedatas.cardDeckTop[level],
                counter: {
                    hideWhenEmpty: true,
                    position: 'center',
                }
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
                unselectableCardClass: 'no-disable-class',
            });
            this.cards[level].onCardClick = card => this.game.onTableCardClick(card);
            this.cards[level].addCards(gamedatas.tableCards[level]);
        }

        this.royalCards = new LineStock<RoyalCard>(game.royalCardsManager, document.getElementById(`royal-cards`), {
            center: true,
        });
        this.royalCards.onCardClick = card => this.game.onRoyalCardClick(card);
        this.royalCards.addCards(gamedatas.royalCards);

        this.game.setTooltip('score-tile', `
            ${_("If you have 20 or more Prestige points, you win!")}
            <br><br>
            ${_("If you have 10 or more Crowns, you win!")}
            <br><br>
            ${_("If you have 10 or more Prestige points on cards of the same color, you win! A <ICON_MULTI> card is considered to be of the same color as the cards it is grouped with").replace('<ICON_MULTI>', `<div class="token-icon" data-type="9"></div>`)}
        `);

        const tablePrivileges = 3 - Object.values(gamedatas.players).map(player => player.privileges).reduce((a, b) => a + b, 0);
        for (let i = 0; i < tablePrivileges; i++) {
            document.getElementById('table-privileges').insertAdjacentHTML('beforeend', `<div class="privilege-token"></div>`);
        }

        this.game.setTooltip('bag', _("Click to see the tokens in the bag"));
        document.getElementById('bag').addEventListener('click', () => this.showTokensInBag());
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
    
    public unselectTableCard(card: Card) {
        for (let level = 3; level >= 1; level--) {
            this.cards[level].unselectCard(card);
        }
    }
    
    public async refillBoard(refilledTokens: Token[]): Promise<any> {
        await this.board.refill(refilledTokens, this.bag);        
        this.bagCounter.toValue(0);
    }
    
    public setBoardSelectable(selectionType: 'privileges' | 'play' | 'effect' | null, canTakeGold: boolean = false, max: number = 3, color: number = null) {
        //document.getElementById(`board`).classList.toggle('selectable', Boolean(selectionType));
        this.board.setSelectable(selectionType, canTakeGold, max, color);
    }
    
    public reserveCard(args: NotifReserveCardArgs) {
        this.game.cardsManager.removeCard(args.card);
    }
    
    public replaceCard(args: NotifNewTableCardArgs): Promise<any> {
        const promise = this.cards[args.level].addCard(args.newCard);
        this.cardsDecks[args.level].setCardNumber(args.cardDeckCount, args.cardDeckTop);

        return promise;
    }
    
    public async removeTokens(tokens: Token[]): Promise<any> {
        await this.bag.addCards(tokens);        
        this.bagCounter.incValue(tokens.length);
    }
    
    public setRoyalCardsSelectable(selectable: boolean) {
        this.royalCards.setSelectionMode(selectable ? 'single' : 'none');
    }

    private showTokensInBag() {
        const tokens = [...this.board.stock.getCards(), ...this.game.getPlayersTokens()];

        const tokensInBagCount = [2, 4, 4, 4, 4, 4];
        tokensInBagCount[-1] = 3;

        tokens.forEach(token => tokensInBagCount[token.type == 1 ? -1 : token.color]--);

        const bagTokens = [];
        for (let color = -1; color <= 5; color++) {
            for (let i = 0; i < tokensInBagCount[color]; i++) {
                bagTokens.push({
                    id: 1000 + 100 * color + i,
                    location: 'bag',
                    locationArg: 0,
                    type: color == -1 ? 1 : 2,
                    color: color,
                });
            }
        }

        const tokensInBagDialog = new ebg.popindialog();
        tokensInBagDialog.create('showTokensInBagDialog');
        tokensInBagDialog.setTitle(_("Tokens in the bag"));
        
        let html = `<div id="bag-tokens"></div>`;
        
        // Show the dialog
        tokensInBagDialog.setContent(html);
        tokensInBagDialog.show();

        const stock = new LineStock<Token>(this.game.tokensManager, document.getElementById('bag-tokens'), {
            wrap: 'wrap'
        });
        stock.addCards(bagTokens);
        
        tokensInBagDialog.show();

        // Replace the function call when it's clicked
        tokensInBagDialog.replaceCloseCallback(() => {  
            stock.removeAll();          
            tokensInBagDialog.destroy();
        });
    }
}