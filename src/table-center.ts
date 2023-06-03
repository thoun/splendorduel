const POINT_CASE_SIZE_LEFT = 38.8;
const POINT_CASE_SIZE_TOP = 37.6;

class TableCenter {
    public destinationsDecks: Deck<Token>[] = [];
    public cardDeck: Deck<Card>;
    public cardDiscard: VoidStock<Card>;
    public destinations: SlotStock<Token>[] = [];
    public cards: SlotStock<Card>;
        
    constructor(private game: SplendorDuelGame, gamedatas: SplendorDuelGamedatas) {
        /*['A', 'B'].forEach(letter => {
            this.destinationsDecks[letter] = new Deck<Token>(game.tokensManager, document.getElementById(`table-destinations-${letter}-deck`), {
                cardNumber: gamedatas.centerDestinationsDeckCount[letter],
                topCard: gamedatas.centerDestinationsDeckTop[letter],
                counter: {
                    position: 'right',
                },
            });

            this.destinations[letter] = new SlotStock<Token>(game.tokensManager, document.getElementById(`table-destinations-${letter}`), {
                slotsIds: [1, 2, 3],
                mapCardToSlot: card => card.locationArg,
            });
            this.destinations[letter].addCards(gamedatas.centerDestinations[letter]);
            this.destinations[letter].onCardClick = (card: Token) => this.game.onTableDestinationClick(card);
        })

        const cardDeckDiv = document.getElementById(`card-deck`);
        this.cardDeck = new Deck<Card>(game.cardsManager, cardDeckDiv, {
            cardNumber: gamedatas.cardDeckCount,
            topCard: gamedatas.cardDeckTop,
            counter: {
                counterId: 'deck-counter',
            },
        });
        cardDeckDiv.insertAdjacentHTML('beforeend', `
            <div id="discard-counter" class="bga-cards_deck-counter round">${gamedatas.cardDiscardCount}</div>
        `);
        const deckCounterDiv = document.getElementById('deck-counter');
        const discardCounterDiv = document.getElementById('discard-counter');
        this.game.setTooltip(deckCounterDiv.id, _('Deck size'));
        this.game.setTooltip(discardCounterDiv.id, _('Discard size'));
        this.cardDiscard = new VoidStock<Card>(game.cardsManager, discardCounterDiv);

        this.cards = new SlotStock<Card>(game.cardsManager, document.getElementById(`table-cards`), {
            slotsIds: [1, 2, 3, 4, 5],
            mapCardToSlot: card => card.locationArg,
            gap: '12px',
        });
        this.cards.onCardClick = card => this.game.onTableCardClick(card);
        this.cards.addCards(gamedatas.centerCards);

        const players = Object.values(gamedatas.players);
        let html = '';
        // points
        players.forEach(player =>
            html += `
            <div id="player-${player.id}-vp-marker" class="marker" data-player-id="${player.id}" data-player-no="${player.playerNo}" data-color="${player.color}"><div class="inner vp"></div></div>
            <div id="player-${player.id}-reputation-marker" class="marker" data-player-id="${player.id}" data-player-no="${player.playerNo}" data-color="${player.color}"><div class="inner reputation"></div></div>
            `
        );
        dojo.place(html, 'board');
        players.forEach(player => {
            this.vp.set(Number(player.id), Number(player.score));
            this.reputation.set(Number(player.id), Math.min(14, Number(player.reputation)));
        });
        this.moveVP();
        this.moveReputation();*/
    }
    
    public newTableCard(card: Card): Promise<boolean> {
        return this.cards.addCard(card);
    }
    
    public newTableDestination(token: Token, letter: string, destinationDeckCount: number, destinationDeckTop?: Token): Promise<boolean> {
        const promise = this.destinations[letter].addCard(token);
        this.destinationsDecks[letter].setCardNumber(destinationDeckCount, destinationDeckTop);
        return promise;
    } 
    
    public setDestinationsSelectable(selectable: boolean, selectableCards: Token[] | null = null) {
        ['A', 'B'].forEach(letter => {
            this.destinations[letter].setSelectionMode(selectable ? 'single' : 'none');
            this.destinations[letter].setSelectableCards(selectableCards);
        });
    }

    public setCardsSelectable(selectable: boolean, freeColor: number | null = null, recruits: number | null = null) {
        this.cards.setSelectionMode(selectable ? 'single' : 'none');
        if (selectable) {
            const selectableCards = this.cards.getCards().filter(card => freeColor === null || card.locationArg == freeColor || recruits >= 1);
            this.cards.setSelectableCards(selectableCards);
        }
    }
    
    public getVisibleDestinations(): Token[] {
        return [
            ...this.destinations['A'].getCards(),
            ...this.destinations['B'].getCards(),
        ];
    }

    public highlightPlayerTokens(playerId: number | null) {
        document.querySelectorAll('#board .marker').forEach((elem: HTMLElement) => elem.classList.toggle('highlight', Number(elem.dataset.playerId) === playerId));
    }
    
    public setDiscardCount(cardDiscardCount: number) {
        const discardCounterDiv = document.getElementById('discard-counter');
        discardCounterDiv.innerHTML = ''+cardDiscardCount;
    }
}