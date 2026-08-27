const BgaZoom = await globalThis.importEsmLib('bga-zoom', '1.x');
const BgaJumpTo = await globalThis.importEsmLib('bga-jump-to', '1.x');
const [BgaHelp, BgaAnimations, BgaCards] = await globalThis.importDojoLibs([
    g_gamethemeurl + 'modules/js/bga-help.js',
    g_gamethemeurl + 'modules/js/bga-animations.js',
    g_gamethemeurl + 'modules/js/bga-cards.js',
]);

class CardsManager extends BgaCards.CardManager {
    constructor(game) {
        super(game, {
            getId: (card) => `card-${card.id}`,
            setupDiv: (card, div) => {
                div.classList.add('splendorduel-card');
                div.dataset.level = '' + card.level;
            },
            setupFrontDiv: (card, div) => {
                div.dataset.index = '' + card.index;
                if (card.index > 0) {
                    game.setTooltip(div.id, this.getTooltip(card));
                }
            },
            isCardVisible: card => Boolean(card.index),
            cardWidth: 120,
            cardHeight: 183,
        });
        this.game = game;
    }
    getTooltip(card) {
        let message = `
        <strong>${_("Level:")}</strong> ${card.level}
        <br>
        <strong>${_("Color:")}</strong> ${this.game.getColor(card.color)}
        <br>
        <strong>${_("Cost:")}</strong> ${Object.entries(card.cost).map(entry => `${entry[1]} <div class="token-icon" data-type="${entry[0]}"></div>`).join(' &nbsp; ')}`;
        if (Object.values(card.provides).length) {
            message += `<br>
            <strong>${_("Provides:")}</strong> ${Object.entries(card.provides).map(entry => `${entry[1]} ${ /*Number(entry[0]) == 9 ? '?' :*/`<div class="token-icon" data-type="${entry[0]}"></div>`}`).join(' &nbsp; ')}`;
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

class CounterfeiterCardsManager extends BgaCards.CardManager {
    constructor(game) {
        super(game, {
            getId: (card) => `counterfeiter-card-${card.id}`,
            setupDiv: (card, div) => {
                div.classList.add('counterfeiter-card');
                div.dataset.index = '' + card.type;
            },
            setupFrontDiv: (card, div) => {
                if (!card.type) {
                    return;
                }
                // Set the sprite position on the face itself.  The card can be
                // created while the river is being animated, before the CSS
                // attribute selector on the parent has been applied/repainted.
                // Without this, every face temporarily uses the sprite's first
                // image and can remain there until a full page repaint.
                const index = card.type - 1;
                div.style.backgroundPosition = `${(index % 2) * 100}% ${Math.floor(index / 2) * 100 / 8}%`;
                game.setTooltip(div.id, this.getTooltip(card));
            },
            isCardVisible: card => Boolean(card.type),
            cardWidth: 183,
            cardHeight: 120,
        });
        this.game = game;
    }
    getTooltip(card) {
        let message = `
        <strong>${_("Cost:")}</strong> ${Object.entries(card.cost).map(entry => `${entry[1]} <div class="token-icon" data-type="${entry[0]}"></div>`).join(' &nbsp; ')}`;
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
    getPower(type) {
        switch (type) {
            case 1:
            case 2:
            case 3:
            case 4:
            case 5: return _("During a Purchase 1 Jewel card or Purchase 1 Counterfeiter card action, you may spend up to 2 Glassware tokens to reduce the cost of the color shown by 2 for each Glassware token spent.");
            case 6: return _("During a Purchase 1 Jewel card or Purchase 1 Counterfeiter card action, you may spend 2 Glassware tokens to reduce the cost of any <strong>single</strong> color by 3.");
            case 7: return _("During a Purchase 1 Jewel card or Purchase 1 Counterfeiter card action, you may spend 1 Glassware token to reduce the Pearl cost by 1.");
            case 8: return _("During a Purchase 1 Jewel card or Purchase 1 Counterfeiter card action, you may spend up to 2 Glassware tokens to reduce the cost of any color by 1 for each Glassware token spent. When spending 2 Glassware tokens, each cost reduction can be for the same color or different colors.");
            case 9: return _("At the end of your turn, before checking the token limit, you may spend Glassware to take 1 of the available Royal cards. The cost to use this ability is 1 Glassware token plus 1 Glassware token for each Royal card you already own. Replace the card with the top card of the Royal card deck.")
                + '<br><i>' + _("Royal cards taken after acquiring enough Crowns are <strong>not</strong> replaced.") + '</i>';
            case 10: return _("At the end of your turn, before checking the token limit, spend a Glassware token and return a Privilege to immediately take another turn.");
            case 11: return _("At the end of your turn, before checking the token limit, spend a Glassware token and return a Privilege to take 1 Gem, Pearl, or Glassware token from your opponent.");
            case 12: return _("When checking the 10-token limit at the end of your turn, ignore your Glassware tokens; they do not count against this limit.");
            case 13: return _("When Using a Privilege, take 2 Gem, Pearl, and/or Glassware tokens of your choice from the board instead of 1.")
                + '<br><i>' + _("Note: Since you may only use this ability once per turn, if you use more than 1 Privilege, only the first one will let you take 2 tokens; any other Privileges will only let you take 1 token as usual.") + '</i>';
            case 14: return _("When you take this card, you immediately acquire 2 Crowns. This might allow you to take 1 Royal card or fulfill a Victory condition.");
            case 15: return _("You can have up to 5 reserved cards instead of 3.")
                + '<br>' + _("Also, when doing the Take 1 Gold token and reserve 1 Jewel card action, you may reserve up to 2 cards instead of 1; each card can be taken from any level or drawn from any of the 3 decks.");
            case 16: return _("After purchasing a Jewel card that has a <ICON_ABILITY> ability, instead of taking 1 token matching the color of that card from the board, you may either:").replace('<ICON_ABILITY>', `<div class="ability-icon" data-ability="3"></div>`)
                + '<ul>'
                + '<li>' + _("Take 2 tokens matching the color of the card from the board.") + '</li>'
                + `<strong>${_('OR')}</strong>`
                + '<li>' + _("Take any 1 Gem, Pearl, or Glassware token  from the board.") + '</li>'
                + '</ul>';
            case 17:
                return _("At the end of your turn, before checking the 10-token limit, you may spend 2 Glassware tokens to select one of the 3 decks (●,●●,●●●). Take the top 3 cards of the selected deck and choose 1 to reserve. Put the 2 cards you didn’t choose at the bottom of the corresponding deck in any order.")
                    + '<br>' + _("As this is not a mandatory action, you can use this ability even when no Gold token is available on the board, and you cannot take a Gold token when using it. You cannot use this ability if you already have the maximum number of reserved cards.");
                ;
        }
    }
}

const isDebug$1 = window.location.host == 'studio.boardgamearena.com' || window.location.hash.indexOf('debug') > -1;
;
const log = isDebug$1 ? console.log.bind(window.console) : function () { };
class PlayerTable {
    constructor(game, player, expansion) {
        this.game = game;
        this.played = [];
        this.tokens = [];
        this.limitSelection = null;
        this.playerId = Number(player.id);
        this.currentPlayer = this.playerId == this.game.getPlayerId();
        let html = `
        <div id="player-table-${this.playerId}" class="player-table" style="--player-color: #${player.color};">
            <div id="player-table-${this.playerId}-name" class="name-wrapper">
                ${player.name}
                <div id="player-privileges-${this.playerId}" class="player-privileges privilege-zone"></div>
            </div>
            <div class="columns">
        `;
        [2, 1, 3, 5, 4, 0, -1].forEach(i => {
            if (i === 0) {
                html += `
                        <div class="double-token-stock">
                            <div id="player-table-${this.playerId}-tokens-0" class="tokens"></div>
                            <div id="player-table-${this.playerId}-tokens-6" class="tokens"></div>
                        </div>
                    `;
            }
            else {
                html += `
                    <div id="player-table-${this.playerId}-tokens-${i}" class="tokens"></div>
                    `;
            }
        });
        [2, 1, 3, 5, 4, 9].forEach(i => {
            html += `
                <div id="player-table-${this.playerId}-played-${i}" class="cards" data-color="${i}"></div>
                `;
        });
        html += `
                <div class="hand-wrapper">
                    <div class="block-label">${_('Reserved cards')}</div>
                    <div id="player-table-${this.playerId}-reserved" class="cards"></div>
                </div>
            </div>`;
        html += `
            <div id="player-table-${this.playerId}-counterfeiter-cards"></div>  
            <div id="player-table-${this.playerId}-royal-cards"></div>          
        </div>
        `;
        document.getElementById('tables').insertAdjacentHTML('beforeend', html);
        const reservedDiv = document.getElementById(`player-table-${this.playerId}-reserved`);
        this.reserved = new BgaCards.LineStock(this.game.cardsManager, reservedDiv);
        this.reserved.onCardClick = (card) => this.game.onReservedCardClick(card);
        this.reserved.addCards(player.reserved);
        this.voidStock = new BgaCards.VoidStock(this.game.cardsManager, document.getElementById(`player-table-${this.playerId}-name`));
        [1, 2, 3, 4, 5, 9].forEach(i => {
            const playedDiv = document.getElementById(`player-table-${this.playerId}-played-${i}`);
            this.played[i] = new BgaCards.LineStock(this.game.cardsManager, playedDiv, {
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
        this.royalCards = new BgaCards.LineStock(this.game.royalCardsManager, document.getElementById(`player-table-${this.playerId}-royal-cards`));
        this.royalCards.addCards(player.royalCards);
        if (expansion) {
            this.counterfeiterCards = new BgaCards.LineStock(this.game.counterfeiterCardsManager, document.getElementById(`player-table-${this.playerId}-counterfeiter-cards`));
            this.counterfeiterCards.addCards(player.counterfeiterCards);
        }
        const tokensStockSettings = {
            direction: 'column',
            center: false,
        };
        const tokenColors = [1, 2, 3, 4, 5, 0, -1];
        if (expansion) {
            tokenColors.push(6);
        }
        tokenColors.forEach(i => {
            const tokenDiv = document.getElementById(`player-table-${this.playerId}-tokens-${i}`);
            this.tokens[i] = new BgaCards.LineStock(this.game.tokensManager, tokenDiv, tokensStockSettings);
            this.tokens[i].onSelectionChange = () => this.game.onPlayerTokenSelectionChange(this.getSelectedTokens());
            tokenDiv.style.setProperty('--card-overlap', '50px');
        });
        this.addTokens(player.tokens);
        for (let i = 0; i < player.privileges; i++) {
            document.getElementById(`player-privileges-${this.playerId}`).insertAdjacentHTML('beforeend', `<div class="privilege-token"></div>`);
        }
    }
    playCard(card, fromElement) {
        return this.played[card.color].addCard(card, {
            fromElement
        });
    }
    setHandSelectable(selectable, buyableCards = null) {
        this.reserved.setSelectionMode(selectable ? 'single' : 'none');
        if (selectable) {
            this.reserved.setSelectableCards(this.reserved.getCards().filter(card => buyableCards.includes(card.id)));
        }
    }
    addCard(card) {
        return this.played[Number(card.location.slice(-1))].addCard(card);
    }
    addRoyalCard(card) {
        return this.royalCards.addCard(card);
    }
    addCounterfeiterCard(card) {
        return this.counterfeiterCards.addCard(card);
    }
    addTokens(tokens, fromStock) {
        return Promise.all([1, 2, 3, 4, 5, 6, 0, -1].map(i => this.tokens[i]?.addCards(tokens.filter(token => token.color == i), { fromStock })));
    }
    addReservedCard(card) {
        return this.reserved.addCard(this.currentPlayer ? card : { ...card, index: undefined });
    }
    setColumnsSelectable(colors) {
        [1, 2, 3, 4, 5].forEach(i => document.getElementById(`player-table-${this.playerId}-played-${i}`).classList.toggle('selectable-for-joker', colors.includes(i)));
    }
    setTokensSelectable(selectable, goldAllowed) {
        (goldAllowed || !selectable ? [1, 2, 3, 4, 5, 6, 0, -1] : [1, 2, 3, 4, 5, 6, 0]).forEach(i => this.tokens[i]?.setSelectionMode(selectable ? 'multiple' : 'none'));
    }
    setTokensSelectableByType(allowedTypes, preselection) {
        [1, 2, 3, 4, 5, 6, 0, -1].forEach(i => {
            this.tokens[i]?.setSelectionMode(allowedTypes.includes(i) ? 'multiple' : 'none');
            this.tokens[i]?.unselectAll();
            this.tokens[i]?.getCards().filter(card => preselection.some(token => token.id == card.id)).forEach(token => this.tokens[i].selectCard(token));
        });
    }
    getTokens() {
        return [1, 2, 3, 4, 5, 6, 0, -1].map(i => this.tokens[i]?.getCards() ?? []).reduce((a, b) => [...a, ...b], []);
    }
    getSelectedTokens() {
        return [1, 2, 3, 4, 5, 6, 0, -1].map(i => this.tokens[i]?.getSelection() ?? []).reduce((a, b) => [...a, ...b], []);
    }
    getCrowns() {
        let crowns = 0;
        [1, 2, 3, 4, 5, 9].forEach(i => this.played[i].getCards().forEach(card => crowns += card.crowns));
        this.counterfeiterCards?.getCards().forEach(card => crowns += card.crowns);
        return crowns;
    }
}

class RoyalCardsManager extends BgaCards.CardManager {
    constructor(game) {
        super(game, {
            getId: (card) => `royal-card-${card.id}`,
            setupDiv: (card, div) => {
                div.classList.add('royal-card');
                div.dataset.index = '' + card.index;
            },
            setupFrontDiv: (card, div) => {
                game.setTooltip(div.id, this.getTooltip(card));
            },
            isCardVisible: () => true,
            cardWidth: 120,
            cardHeight: 183,
        });
        this.game = game;
    }
    getTooltip(card) {
        let message = [];
        if (card.points) {
            message.push(`
            <strong>${_("Points:")}</strong> ${card.points}
            `);
        }
        if (card.power.length) {
            message.push(`
            <strong>${_("Power:")}</strong> ${card.power.map(power => this.game.getPower(power)).join(', ')}
            `);
        }
        return message.join('<br>');
    }
}

class TokenBoard {
    constructor(game, board) {
        this.game = game;
        const slotsIds = [];
        for (let row = 1; row <= 5; row++) {
            for (let column = 1; column <= 5; column++) {
                slotsIds.push(JSON.stringify([row, column]));
            }
        }
        const boardDiv = document.getElementById(`board`);
        this.stock = new BgaCards.SlotStock(game.tokensManager, boardDiv, {
            slotsIds,
            mapCardToSlot: card => JSON.stringify([card.row, card.column]),
            gap: '0',
            selectableCardClass: 'no-visible-selection',
        });
        this.stock.addCards(board);
        this.stock.onSelectionChange = (selection, lastChange) => this.onTokenSelectionChange(selection, lastChange);
        this.mouseSelection = document.getElementById('mouse-selection');
        boardDiv.addEventListener('mousedown', event => this.onMouseDown(event));
        boardDiv.addEventListener('mousemove', event => this.onMouseMove(event));
        boardDiv.addEventListener('mouseup', event => this.onMouseUp(event));
        boardDiv.addEventListener('dragstart', e => { e.stopImmediatePropagation(); e.preventDefault(); });
        document.addEventListener('mouseup', event => this.onMouseUp(null));
        document.addEventListener('keyup', (event) => {
            if (event.key == 'Escape') {
                this.onMouseUp(null);
            }
        });
        [
            _("If you take <strong>2 Pearls</strong> during the Mandatory Action, your opponent takes 1 Privilege."),
            _("If you <strong>replenish the Game Board</strong>, your opponent takes 1 Privilege."),
            _("If you take <strong>3 tokens of the same color</strong> during the Mandatory Action, your opponent takes 1 Privilege."),
        ].forEach((sentence, index) => {
            document.getElementById(`board`).insertAdjacentHTML('beforeend', `<div id="board-tooltip-zone-${index}" class="board-tooltip-zone" data-index="${index}"></div>`);
            this.game.setTooltip(`board-tooltip-zone-${index}`, sentence);
        });
    }
    getDefaultPossibleSelection() {
        let possibleSelection = this.stock.getCards();
        if (!this.canTakeGold) {
            possibleSelection = possibleSelection.filter(card => card.type === 2);
        }
        if (this.selectionColor != null && !this.canTakeAnyColorOrTwoOfColor) {
            possibleSelection = possibleSelection.filter(card => card.color === this.selectionColor);
        }
        return possibleSelection;
    }
    setSelectable(selectionType, canTakeGold, max = 3, color = null, canTakeAnyColorOrTwoOfColor = false) {
        this.stock.setSelectionMode(selectionType ? 'multiple' : 'none');
        this.maxSelectionToken = max;
        this.selectionType = selectionType;
        this.selectionColor = color;
        this.canTakeGold = canTakeGold;
        this.canTakeAnyColorOrTwoOfColor = canTakeAnyColorOrTwoOfColor;
        this.stock.setSelectableCards(this.getDefaultPossibleSelection());
    }
    onTokenSelectionChange(selection, lastChange) {
        let valid = selection.length > 0;
        const tokens = this.stock.getCards();
        selection.sort((a, b) => a.row == b.row ? a.column - b.column : a.row - b.row);
        if (this.maxSelectionToken !== -1 && selection.length > this.maxSelectionToken) {
            valid = false;
        }
        else if (this.selectionType === 'privileges') {
            valid = this.onPrivilegeTokenSelectionChange(selection, tokens, valid);
        }
        else if (this.selectionType === 'effect') {
            valid = this.onEffectTokenSelectionChange(selection, tokens, valid, lastChange);
        }
        else if (this.selectionType === 'play') {
            const { stop, validUpdated } = this.onPlayTokenSelectionChange(selection, tokens, valid, lastChange);
            if (stop) {
                return;
            }
            valid = validUpdated;
        }
        this.game.onTableTokenSelectionChange(/*selection  might be changed by onEffectTokenSelectionChange */ this.stock.getSelection(), valid, this.selectionType);
    }
    onPlayTokenSelectionChange(selection, tokens, valid, lastChange) {
        const goldTokens = selection.filter(card => card.type == 1);
        const gemsTokens = selection.filter(card => card.type == 2);
        const goldSelection = goldTokens.length >= 1;
        const selectionAtMax = goldSelection || gemsTokens.length >= this.maxSelectionToken;
        let remainingSelection = selectionAtMax ? selection : this.getDefaultPossibleSelection();
        if (goldSelection) {
            if (gemsTokens.length) {
                valid = false;
            }
        }
        else {
            // select is sorted by row then column. column order might be desc if row is asc.
            if (gemsTokens.length == 3) {
                valid = this.onPlayTokenSelectionChange3gems(gemsTokens, valid);
            }
            else if (gemsTokens.length == 2) {
                const { stop, validUpdated, remainingSelectionUpdated } = this.onPlayTokenSelectionChange2gems(gemsTokens, tokens, lastChange, valid);
                if (stop) {
                    return { stop: true, validUpdated: true };
                }
                valid = validUpdated;
                remainingSelection = remainingSelectionUpdated;
            }
            else if (gemsTokens.length == 1) {
                const remainingSelectionUpdated = this.onPlayTokenSelectionChange1gem(gemsTokens[0], tokens);
                remainingSelection = remainingSelectionUpdated;
            }
        }
        this.stock.setSelectableCards(selectionAtMax ? selection : remainingSelection);
        return { stop: false, validUpdated: valid };
    }
    onPlayTokenSelectionChange1gem(gemToken, tokens) {
        const remainingSelection = [gemToken];
        [-1, 0, 1].forEach(rowDirection => [-1, 0, 1].filter(colDirection => colDirection != 0 || rowDirection != 0).forEach(colDirection => {
            const nextToken = tokens.find(token => token.row == gemToken.row + rowDirection && token.column == gemToken.column + colDirection);
            if (nextToken?.type == 2) {
                remainingSelection.push(nextToken);
                const nextNextToken = tokens.find(token => token.row == nextToken.row + rowDirection && token.column == nextToken.column + colDirection);
                if (nextNextToken?.type == 2) {
                    remainingSelection.push(nextNextToken);
                }
            }
        }));
        return remainingSelection;
    }
    onPlayTokenSelectionChange2gems(gemsTokens, tokens, lastChange, valid) {
        const remainingSelection = gemsTokens;
        const rowDiff = gemsTokens[0].row - gemsTokens[1].row;
        const colDiff = gemsTokens[0].column - gemsTokens[1].column;
        const absRowDiff = Math.abs(rowDiff);
        const absColDiff = Math.abs(colDiff);
        if ([0, 2].includes(absRowDiff) && [0, 2].includes(absColDiff)) {
            const middleRow = (gemsTokens[0].row + gemsTokens[1].row) / 2;
            const middleCol = (gemsTokens[0].column + gemsTokens[1].column) / 2;
            const middleToken = tokens.find(token => token.row == middleRow && token.column == middleCol);
            // if valid selection of 2 gems separated by one, autoselect the one in-between
            if (middleToken?.type == 2) {
                remainingSelection.push(middleToken);
                if (lastChange.id == middleToken.id) {
                    valid = false;
                }
                else {
                    this.stock.selectCard(middleToken);
                    return { stop: true, validUpdated: true, remainingSelection: remainingSelection };
                }
            }
            else {
                valid = false;
            }
        }
        else if ([0, 1].includes(absRowDiff) && [0, 1].includes(absColDiff)) {
            [-1, 2].forEach(direction => {
                const nextRow = gemsTokens[0].row - direction * rowDiff;
                const nextCol = gemsTokens[0].column - direction * colDiff;
                const nextToken = tokens.find(token => token.row == nextRow && token.column == nextCol);
                if (nextToken?.type == 2) {
                    remainingSelection.push(nextToken);
                }
            });
        }
        else {
            valid = false;
        }
        return { stop: false, validUpdated: valid, remainingSelectionUpdated: remainingSelection };
    }
    onPlayTokenSelectionChange3gems(gemsTokens, valid) {
        const rowDiff = gemsTokens[0].row - gemsTokens[1].row;
        const colDiff = gemsTokens[0].column - gemsTokens[1].column;
        const absRowDiff = Math.abs(rowDiff);
        const absColDiff = Math.abs(colDiff);
        const inSameDirection = [0, 1].includes(absRowDiff) && [0, 1].includes(absColDiff) &&
            (rowDiff == gemsTokens[1].row - gemsTokens[2].row) &&
            (colDiff == gemsTokens[1].column - gemsTokens[2].column);
        if (!inSameDirection) {
            valid = false;
        }
        return valid;
    }
    onEffectTokenSelectionChange(selection, tokens, valid, lastChange) {
        if (this.maxSelectionToken === -1) {
            if (selection.length === 0) {
                this.stock.setSelectableCards(this.getDefaultPossibleSelection());
                return false;
            }
            const color = selection[0].color;
            const tokensOfColor = this.stock.getCards().filter(token => token.color === color);
            const select = this.stock.getSelection().includes(lastChange);
            if (tokensOfColor.length > selection.length) {
                tokensOfColor.forEach(token => {
                    if (select) {
                        if (!selection.includes(token)) {
                            this.stock.selectCard(token, true);
                        }
                    }
                    else {
                        this.stock.unselectCard(token, true);
                    }
                });
            }
            this.stock.setSelectableCards(select ? tokensOfColor : this.getDefaultPossibleSelection());
            return !selection.some(card => card.type != 2);
        }
        if (this.canTakeAnyColorOrTwoOfColor) {
            this.maxSelectionToken = selection.every(card => card.color == this.selectionColor) ? 2 : 1;
        }
        this.stock.setSelectableCards(this.maxSelectionToken !== -1 && selection.length >= this.maxSelectionToken ? selection : this.getDefaultPossibleSelection());
        if (this.selectionColor === -1) {
            if (selection.some(card => card.type != 1)) {
                valid = false;
            }
        }
        else if (this.selectionColor === null) {
            if (selection.some(card => card.type != 2)) {
                valid = false;
            }
        }
        else {
            if (selection.some(card => card.type != 2)) {
                valid = false;
            }
            if (valid && selection.some(card => card.color != this.selectionColor)) {
                valid = selection.length === 1 && this.canTakeAnyColorOrTwoOfColor;
            }
        }
        return valid;
    }
    onPrivilegeTokenSelectionChange(selection, tokens, valid) {
        this.stock.setSelectableCards(selection.length >= this.maxSelectionToken ? selection : this.getDefaultPossibleSelection());
        if (selection.some(card => card.type != 2)) {
            valid = false;
        }
        return valid;
    }
    refill(refilledTokens, fromStock) {
        return this.stock.addCards(refilledTokens, { fromStock }, undefined, 350);
    }
    checkPlayTakeGems(tokens) {
        const gold = tokens.filter(token => token.type == 1);
        let gems = tokens.filter(token => token.type == 2);
        if (gold.length > 0) {
            if (gold.length > 1) {
                return false;
            }
            else if (gems.length > 0) {
                return false;
            }
        }
        else {
            if (gems.length > this.maxSelectionToken) {
                return false;
            }
            gems = gems.sort((a, b) => a.row == b.row ? a.column - b.column : a.row - b.row);
            let rowDiff = null;
            let colDiff = null;
            let invalid = false;
            for (let i = 1; i < gems.length; i++) {
                if (rowDiff === null && colDiff === null) {
                    rowDiff = gems[i].row - gems[i - 1].row;
                    colDiff = gems[i].column - gems[i - 1].column;
                }
                else {
                    if ((gems[i].row - gems[i - 1].row != rowDiff) || (gems[i].column - gems[i - 1].column != colDiff)) {
                        invalid = true;
                    }
                }
                if (rowDiff < -1 || rowDiff > 1 || colDiff < -1 || colDiff > 1) {
                    invalid = true;
                }
            }
            if (invalid) {
                return false;
            }
        }
        return true;
    }
    completeSelection(from, to) {
        const selection = from.id == to.id ? [from] : [from, to];
        if (selection.length > 1 && (Math.abs(selection[0].row - selection[1].row) == 2 || Math.abs(selection[0].column - selection[1].column) == 2)) {
            const middle = this.stock.getCards().find(token => token.row == Math.floor((selection[0].row + selection[1].row) / 2) && token.column == Math.floor((selection[0].column + selection[1].column) / 2));
            if (middle && !selection.some(s => s.id == middle.id)) {
                return [...selection, middle];
            }
        }
        return selection;
    }
    mouseSelectionValid(from, to) {
        const selection = this.completeSelection(from, to);
        return this.checkPlayTakeGems(selection);
    }
    getTokenFromMouseEvent(event) {
        const tokenDiv = event.target?.closest('.token');
        return tokenDiv ? this.stock.getCards().find(card => tokenDiv.id == `token-${card.id}`) : null;
    }
    onMouseDown(event) {
        if (!this.selectionType || this.maxSelectionToken <= 1) {
            return;
        }
        this.mouseSelectionStart = this.getTokenFromMouseEvent(event);
        this.mouseSelectionInitialCoordinates = [event.screenX, event.screenY];
    }
    getTokenCenterCoordinates(token) {
        return [50 + (token.column - 1) * 83.2, 133 + (token.row - 1) * 83.2];
    }
    cleanMouseSelection() {
        this.mouseSelectionStart = null;
        this.mouseSelectionInitialCoordinates = null;
        this.mouseSelection.dataset.valid = '';
    }
    onMouseMove(event) {
        if (event.buttons != 1 && this.mouseSelection.dataset.valid) {
            //setTimeout(() => {
            this.cleanMouseSelection();
            //}, 50);
            return;
        }
        if (!this.mouseSelectionStart || !this.mouseSelectionInitialCoordinates) {
            return;
        }
        const distX = this.mouseSelectionInitialCoordinates[0] - event.screenX;
        const distY = this.mouseSelectionInitialCoordinates[1] - event.screenY;
        const mouseMovementDistance = Math.sqrt(Math.pow(distX, 2) + Math.pow(distY, 2));
        if (mouseMovementDistance < 10) {
            return;
        }
        const mouseSelectionEnd = this.getTokenFromMouseEvent(event);
        if (!mouseSelectionEnd) {
            return;
        }
        this.stock.unselectAll();
        const fromCoordinates = this.getTokenCenterCoordinates(this.mouseSelectionStart);
        this.mouseSelection.style.left = `${fromCoordinates[0] - 40}px`;
        this.mouseSelection.style.top = `${fromCoordinates[1] - 40}px`;
        this.mouseSelection.dataset.valid = this.mouseSelectionValid(this.mouseSelectionStart, mouseSelectionEnd).toString();
        const toCoordinates = this.getTokenCenterCoordinates(mouseSelectionEnd);
        const xDiff = toCoordinates[0] - fromCoordinates[0];
        const yDiff = toCoordinates[1] - fromCoordinates[1];
        const distance = Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2)) + 80;
        const angle = Math.atan(yDiff / xDiff);
        this.mouseSelection.style.width = `${distance}px`;
        this.mouseSelection.style.transform = `rotate(${xDiff < 0 ? Math.PI + angle : angle}rad)`;
    }
    onMouseUp(event) {
        if (event && this.mouseSelectionStart) {
            const distX = this.mouseSelectionInitialCoordinates[0] - event.screenX;
            const distY = this.mouseSelectionInitialCoordinates[1] - event.screenY;
            const mouseMovementDistance = Math.sqrt(Math.pow(distX, 2) + Math.pow(distY, 2));
            if (mouseMovementDistance >= 10) {
                const mouseSelectionEnd = this.getTokenFromMouseEvent(event);
                if (mouseSelectionEnd && this.mouseSelectionValid(this.mouseSelectionStart, mouseSelectionEnd)) {
                    const selection = this.completeSelection(this.mouseSelectionStart, mouseSelectionEnd);
                    this.stock.unselectAll(true);
                    selection.forEach(card => this.stock.selectCard(card, true));
                    this.onTokenSelectionChange(selection, mouseSelectionEnd);
                }
                else {
                    this.cleanMouseSelection();
                }
            }
            event.stopImmediatePropagation();
            event.preventDefault();
        }
        this.cleanMouseSelection();
    }
}

class TableCenter {
    constructor(game, gamedatas) {
        this.game = game;
        this.cardsDecks = [];
        this.cards = [];
        this.bag = new BgaCards.VoidStock(game.tokensManager, document.getElementById('bag'));
        this.bagCounter = new ebg.counter();
        this.bagCounter.create(`bag-counter`);
        const tokenCount = gamedatas.expansion ? 29 : 25;
        this.bagCounter.setValue(tokenCount - (gamedatas.board.length + Object.values(gamedatas.players).map(player => player.tokens.length).reduce((a, b) => a + b, 0)));
        this.board = new TokenBoard(game, gamedatas.board);
        for (let level = 3; level >= 1; level--) {
            document.getElementById('table-cards').insertAdjacentHTML('beforeend', `
                <div id="card-deck-${level}"></div>
                <div id="table-cards-${level}"></div>
            `);
            this.cardsDecks[level] = new BgaCards.Deck(game.cardsManager, document.getElementById(`card-deck-${level}`), {
                cardNumber: gamedatas.cardDeckCount[level],
                topCard: gamedatas.cardDeckTop[level],
                counter: {
                    hideWhenEmpty: true,
                    position: 'center',
                }
            });
            this.cardsDecks[level].onCardClick = card => this.game.onTableCardClick(card, this.cardsDecks[level].getSelection().some(c => c.id == card.id));
            const slotsIds = [];
            for (let i = 1; i <= 6 - level; i++) {
                slotsIds.push(i);
            }
            this.cards[level] = new BgaCards.SlotStock(game.cardsManager, document.getElementById(`table-cards-${level}`), {
                slotsIds,
                mapCardToSlot: card => card.locationArg,
                gap: '12px',
                unselectableCardClass: 'no-disable-class',
            });
            this.cards[level].onCardClick = card => this.game.onTableCardClick(card, this.cardsDecks[level].getSelection().some(c => c.id == card.id));
            this.cards[level].addCards(gamedatas.tableCards[level]);
        }
        this.royalCards = new BgaCards.LineStock(game.royalCardsManager, document.getElementById(`royal-cards`), {
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
        if (gamedatas.expansion) {
            document.getElementById(`cards-wrapper`).insertAdjacentHTML('afterbegin', `
                <div id="counterfeiter-cards-wrapper">
                    <div id="counterfeiter-deck"></div>
                    <div id="counterfeiter-cards"></div>
                </div>
            `);
            this.counterfeiterDeck = new BgaCards.Deck(game.counterfeiterCardsManager, document.getElementById(`counterfeiter-deck`), {
                cardNumber: gamedatas.counterfeiterDeckCount,
                topCard: gamedatas.counterfeiterDeckTop,
                counter: {
                    hideWhenEmpty: true,
                    position: 'center',
                }
            });
            this.counterfeiterDeck.onCardClick = card => this.game.onCounterfeiterCardClick(card);
            this.counterfeiterCards = new BgaCards.LineStock(game.counterfeiterCardsManager, document.getElementById(`counterfeiter-cards`), {
                center: true,
                unselectableCardClass: 'no-disable-class',
            });
            this.counterfeiterCards.onCardClick = card => this.game.onCounterfeiterCardClick(card);
            this.counterfeiterCards.addCards(gamedatas.counterfeiterCards);
        }
    }
    setCardsSelectable(selectable, selectableCards = [], all = false, multiple = false) {
        for (let level = 3; level >= 1; level--) {
            this.cardsDecks[level].setSelectionMode(selectable && all ? (multiple ? 'multiple' : 'single') : 'none');
            this.cards[level].setSelectionMode(selectable ? (multiple ? 'multiple' : 'single') : 'none');
            if (selectable && !all) {
                this.cardsDecks[level].setSelectableCards([]);
                this.cards[level].setSelectableCards(this.cards[level].getCards().filter(card => selectableCards.includes(card.id)));
            }
        }
    }
    setDecksSelectable(selectable) {
        for (let level = 3; level >= 1; level--) {
            this.cardsDecks[level].setSelectionMode(selectable ? 'single' : 'none');
        }
    }
    unselectTableCard(card) {
        for (let level = 3; level >= 1; level--) {
            this.cards[level].unselectCard(card);
        }
    }
    unselectTableCounterfeiterCard(card) {
        if (!this.counterfeiterCards) {
            return;
        }
        this.counterfeiterCards.unselectCard(card);
    }
    setCounterfeiterCardsSelectable(selectable, selectableCards = [], all = false, deckSelectable = false) {
        if (!this.counterfeiterCards) {
            return;
        }
        this.counterfeiterDeck.setSelectionMode(selectable && deckSelectable ? 'single' : 'none');
        this.counterfeiterCards.setSelectionMode(selectable ? 'single' : 'none');
        if (selectable && !all) {
            this.counterfeiterCards.setSelectableCards(this.counterfeiterCards.getCards().filter(card => selectableCards.includes(card.id)));
        }
    }
    async refillBoard(refilledTokens) {
        await this.board.refill(refilledTokens, this.bag);
        this.bagCounter.toValue(0);
    }
    setBoardSelectable(selectionType, canTakeGold = false, max = 3, color = null, canTakeAnyColorOrTwoOfColor = false) {
        //document.getElementById(`board`).classList.toggle('selectable', Boolean(selectionType));
        this.board.setSelectable(selectionType, canTakeGold, max, color, canTakeAnyColorOrTwoOfColor);
    }
    reserveCard(args) {
        this.game.cardsManager.removeCard(args.card);
    }
    replaceCard(args) {
        const promise = this.cards[args.level].addCard(args.newCard);
        this.cardsDecks[args.level].setCardNumber(args.cardDeckCount, args.cardDeckTop);
        return promise;
    }
    async removeTokens(tokens) {
        await this.bag.addCards(tokens);
        this.bagCounter.incValue(tokens.length);
    }
    setRoyalCardsSelectable(selectable) {
        this.royalCards.setSelectionMode(selectable ? 'single' : 'none');
    }
    showTokensInBag() {
        const tokens = [...this.board.stock.getCards(), ...this.game.getPlayersTokens()];
        const tokensInBagCount = [2, 4, 4, 4, 4, 4, this.game.gamedatas.expansion ? 4 : 0];
        tokensInBagCount[-1] = 3;
        tokens.forEach(token => tokensInBagCount[token.type == 1 ? -1 : token.color]--);
        const bagTokens = [];
        for (let color = -1; color <= 6; color++) {
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
        const stock = new BgaCards.LineStock(this.game.tokensManager, document.getElementById('bag-tokens'), {
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
    async refillCounterfeiterCards(cards, counterfeiterDeckCount, counterfeiterDeckTop) {
        const promise = this.counterfeiterCards.addCards(cards);
        this.counterfeiterDeck.setCardNumber(counterfeiterDeckCount, counterfeiterDeckTop);
        await promise;
    }
    async addRoyalCard(card) {
        await this.royalCards.addCard(card);
    }
}

class TokensManager extends BgaCards.CardManager {
    constructor(game) {
        super(game, {
            getId: (card) => `token-${card.id}`,
            setupDiv: (card, div) => {
                div.draggable = false;
                div.classList.add('token');
                div.dataset.type = '' + card.type;
                if (card.type == 2) {
                    div.dataset.color = '' + card.color;
                }
                //game.setTooltip(div.id, this.getTooltip(card));
            },
            setupFrontDiv: (card, div) => {
                //div.id = `${this.getId(card)}-front`;
                div.draggable = false;
            },
        });
        this.game = game;
    }
    getTooltip(token) {
        switch (token.type) {
            case 1: return _("Gold");
            case 2: return this.game.getColor(token.color);
        }
    }
}

/// <reference path="../../bga-framework.d.ts" />
const { AnimationManager, BgaSlideAnimation } = BgaAnimations;
const { LineStock } = BgaCards;
const isDebug = window.location.host == 'studio.boardgamearena.com' || window.location.hash.includes('debug');
const ANIMATION_MS = 500;
const LOCAL_STORAGE_ZOOM_KEY = 'SplendorDuel-zoom';
const LOCAL_STORAGE_JUMP_TO_FOLDED_KEY = 'SplendorDuel-jump-to-folded';
const POWER_RESERVE_CARD = 6;
const POWER_WIN_9PTS_SAME_COLOR = 7;
const POWER_WIN_9CROWNS = 8;
const POWER_TAKE_ALL_GEMS_SAME_COLOR = 9;
const POWER_TAKE_COUNTERFEITER_CARD = 10;
const POWER_TAKE_2GEMS_FROM_BAG = 11;
const POWER_TAKE_GOLD_FROM_TABLE = 12;
const POWER_TAKE_3GEMS_FROM_TABLE = 13;
class Game {
    constructor(bga) {
        this.playersTables = [];
        this.privilegeCounters = [];
        this.reservedCounters = [];
        this.pointsCounters = [];
        this.crownCounters = [];
        this.strongestColumnCounters = [];
        this.tokenCounters = [];
        this.tokenExtraCounters = [];
        this.crownGoalCounters = [];
        this.strongestColumnGoalCounters = [];
        this.pickStock = null;
        this.TOOLTIP_DELAY = document.body.classList.contains('touch-device') ? 1500 : undefined;
        this.CARD_REGEX = /<card>(.*)<\/card>/;
        this.cardLogId = 0;
        this.bga = bga;
    }
    /*
        setup:

        This method must set up the game user interface according to current game situation specified
        in parameters.

        The method is called each time the game interface is displayed to a player, ie:
        _ when the game starts
        _ when a player refreshes the game page (F5)

        "gamedatas" argument contains all datas retrieved by your "getAllDatas" PHP method.
    */
    setup(gamedatas) {
        console.log("Starting game setup");
        this.bga.gameArea.getElement().insertAdjacentHTML('beforeend', `
            <div id="anti-playing-notice"></div>
            <div id="notice"></div>
            <div id="table">
                <div id="board-wrapper">
                    <div id="bag-and-score-tile">
                        <div id="bag">
                            <div id="bag-counter"></div>
                        </div>
                        <div id="score-tile"></div>
                    </div>
                    <div id="board">
                        <div id="mouse-selection"></div>
                    </div>
                    <div id="table-privileges" class="privilege-zone"></div>
                </div>
                <div id="cards-wrapper">
                    <div id="table-cards"></div>
                    <div id="royal-cards"></div>
                </div>
                <div id="tables"></div>
            </div>
        `);
        this.gamedatas = gamedatas;
        console.log('gamedatas', gamedatas);
        this.animationManager = new AnimationManager(this);
        this.cardsManager = new CardsManager(this);
        this.royalCardsManager = new RoyalCardsManager(this);
        this.counterfeiterCardsManager = new CounterfeiterCardsManager(this);
        this.tokensManager = new TokensManager(this);
        new BgaJumpTo.Manager({
            localStorageFoldedKey: LOCAL_STORAGE_JUMP_TO_FOLDED_KEY,
            entries: [
                new BgaJumpTo.Entry(_('Main board'), 'board', { color: '#83594f', backgroundImage: `url('${this.bga.images.getImgUrl('board.jpg')}')` }),
                new BgaJumpTo.Entry(_('Cards pyramid'), 'table-cards', { color: '#678e67', backgroundImage: `url('${this.bga.images.getImgUrl('cards1.jpg')}')`, backgroundSize: 'auto 150%', backgroundPosition: '0% 25%', }),
                ...BgaJumpTo.BgaPlayerEntries(this.bga, {
                    playerOrder: this.getOrderedPlayers(gamedatas).map(player => player.id),
                    entrySettings: (playerId) => ({ id: `bga-jump-to_player-table-${playerId}` }),
                }),
            ],
            defaultFolded: true,
        });
        this.tableCenter = new TableCenter(this, gamedatas);
        this.createPlayerPanels(gamedatas);
        this.createPlayerTables(gamedatas);
        this.zoomManager = new BgaZoom.Manager({
            element: document.getElementById('table'),
            smooth: false,
            zoomControls: {
                color: 'white',
            },
            localStorageZoomKey: LOCAL_STORAGE_ZOOM_KEY,
        });
        new BgaHelp.HelpManager(this, {
            buttons: [
                new BgaHelp.BgaHelpPopinButton({
                    title: _("Card abilities").toUpperCase(),
                    html: this.getHelpHtml(),
                    buttonBackground: '#692c91', // ability color
                }),
            ]
        });
        this.setupNotifications();
        if (this.bga.gameui.bgaInternal.flags['ingame_player_panels']) {
            setTimeout(() => {
                Object.keys(gamedatas.players).forEach(playerId => {
                    const playerPanel = document.getElementById(`overall_player_board_${playerId}`);
                    const playerTable = document.getElementById(`player-table-${playerId}-name`);
                    playerTable.firstChild.remove();
                    playerTable.insertAdjacentElement('afterbegin', playerPanel);
                    playerTable.style.color = 'black';
                    playerTable.style.fontWeight = 'inherit';
                    playerTable.style.fontSize = 'unset';
                    playerTable.firstElementChild.style.minWidth = '300px';
                    playerTable.style.textAlign = 'inherit';
                });
            });
        }
        console.log("Ending game setup");
    }
    ///////////////////////////////////////////////////
    //// Game & client states
    // onEnteringState: this method is called each time we are entering into a new game state.
    //                  You can use this method to perform some user interface changes at this moment.
    //
    onEnteringState(stateName, args) {
        console.log('Entering state: ' + stateName, args.args);
        switch (stateName) {
            case 'usePrivilege':
                this.onEnteringUsePrivilege(args.args);
                break;
            case 'playAction':
                this.onEnteringPlayAction(args.args);
                break;
            case 'reserveCard':
                this.onEnteringReserveCard(args.args);
                break;
            case 'placeJoker':
                this.onEnteringPlaceJoker(args.args);
                break;
            case 'takeBoardToken':
                this.onEnteringTakeBoardToken(args.args);
                break;
            case 'takeOpponentToken':
                this.onEnteringTakeOpponentToken(args.args);
                break;
            case 'takeCounterfeiterCard':
                this.onEnteringTakeCounterfeiterCard();
                break;
            case 'takeRoyalCard':
                this.onEnteringTakeRoyalCard();
                break;
            case 'discardTokens':
                this.onEnteringDiscardTokens();
                break;
            case 'reserveFromDeckChooseDeck':
                this.onEnteringReserveFromDeckChooseDeck();
                break;
            case 'reserveFromDeckChooseCard':
                this.onEnteringReserveFromDeckChooseCard(args.args);
                break;
        }
    }
    setGamestateDescription(property = '') {
        if (this.bga.players.isCurrentPlayerActive()) { // we don't want opponent to see the restriction the current player has
            const originalState = this.gamedatas.gamestates[this.gamedatas.gamestate.id];
            this.bga.statusBar.setTitle(_(originalState['descriptionmyturn' + property]), []);
        }
    }
    onEnteringUsePrivilege(args) {
        if (this.bga.players.isCurrentPlayerActive()) {
            this.tableCenter.setBoardSelectable('privileges', false, args.privileges);
        }
    }
    setAntiPlayingNotice(args) {
        const noticeDiv = document.getElementById('anti-playing-notice');
        const showNotice = args.playerAntiPlaying || args.opponentAntiPlaying;
        if (showNotice) {
            let notice = _("Blocking play by retaining all pearl and gold tokens is an anti-playing practice.") + ' ';
            const refillButton = args.opponentAntiPlaying ? `<button type="button" id="end_the_game_button" class="bgabutton bgabutton_blue">${_("End the game (win immediately)")}</button>` : null;
            if (args.playerAntiPlaying) {
                notice += _('Please buy a card to unblock the situation.');
            }
            else if (args.opponentAntiPlaying) {
                notice += _('You can ${end_the_game_button} and it will be considered as a victory for you.').replace('${end_the_game_button}', refillButton);
            }
            noticeDiv.innerHTML = notice;
            document.getElementById('end_the_game_button')?.addEventListener('click', () => this.bga.actions.performAction('actEndGameAntiPlaying'));
        }
        noticeDiv.classList.toggle('visible', showNotice);
    }
    setNotice(args) {
        const noticeDiv = document.getElementById('notice');
        const showNotice = args.canRefill || args.privileges > 0;
        if (showNotice) {
            let notice = ``;
            const refillButton = args.canRefill ? `<button type="button" id="replenish_button" class="bgabutton bgabutton_blue">${_("Replenish the board")}</button>` : null;
            const usePrivilegeButton = args.privileges ? `<button type="button" id="usePrivilege_button" class="bgabutton bgabutton_blue">${_("Use up to ${number} privilege(s) to take gem(s)").replace('${number}', '' + args.privileges)}</button>` : null;
            if (args.canRefill) {
                if (args.mustRefill) {
                    notice = _('Before you can take your mandatory action, you <strong>must</strong> ${replenish_button} !').replace('${replenish_button}', refillButton);
                }
                else {
                    if (args.privileges) {
                        notice = _('<strong>Before</strong> taking your mandatory action, you can ${use_privilege_button} <strong>then</strong> ${replenish_button}').replace('${use_privilege_button}', usePrivilegeButton).replace('${replenish_button}', refillButton);
                    }
                    else {
                        notice = _('<strong>Before</strong> taking your mandatory action, you can ${replenish_button}').replace('${replenish_button}', refillButton);
                    }
                }
            }
            else if (args.privileges) {
                notice = _('<strong>Before</strong> taking your mandatory action, you can ${use_privilege_button}').replace('${use_privilege_button}', usePrivilegeButton);
            }
            noticeDiv.innerHTML = notice;
            document.getElementById('replenish_button')?.addEventListener('click', () => this.confirmActionTakeTokens(() => this.bga.actions.performAction('actRefillBoard'), true, false));
            document.getElementById('usePrivilege_button')?.addEventListener('click', () => this.bga.actions.performAction('actUsePrivilege'));
        }
        noticeDiv.classList.toggle('visible', showNotice);
    }
    confirmActionTakeTokens(finalAction, showPrivilegeWarning, showLimitWarning) {
        const warnings = [];
        if (showLimitWarning /* && this.gamedatas.gamestate.args.canBuyCard*/) { // you might not be able to buy a card, but you may be able to use privilege or take a gold instead
            warnings.push(_("You will have more than 10 tokens, and you'll need to discard some of them."));
        }
        if (showPrivilegeWarning && this.bga.userPreferences.get(201) != 2) {
            warnings.push(`${_("This action will give a privilege to your opponent.")}
            <br><br>
            <i>${_("You can disable this warning in the user preferences (top right menu).")}</i>`);
        }
        if (warnings.length) {
            this.bga.gameui.confirmationDialog(warnings.join('<br><br>'), finalAction);
        }
        else {
            finalAction();
        }
    }
    onEnteringPlayAction(args) {
        if (!args.canTakeTokens) {
            this.setGamestateDescription('OnlyBuy');
        }
        else if (!args.canBuyCard) {
            this.setGamestateDescription('OnlyTokens');
        }
        if (this.bga.players.isCurrentPlayerActive()) {
            this.setAntiPlayingNotice(args);
            this.setNotice(args);
            if (args.canTakeTokens) {
                this.tableCenter.setBoardSelectable('play', args.canReserve, 3);
            }
            this.tableCenter.setCardsSelectable(true, args.canBuyCard ? Object.keys(args.buyableCards).map(Number) : []);
            this.tableCenter.setCounterfeiterCardsSelectable(true, args.canBuyCard ? Object.keys(args.buyableCounterfeiterCards ?? {}).map(Number) : []);
            if (args.canBuyCard) {
                this.getCurrentPlayerTable().setHandSelectable(true, Object.keys(args.buyableCards).map(Number));
            }
        }
    }
    onEnteringReserveCard(args) {
        this.selectedCards = [];
        if (args.canReserve > 1) {
            this.bga.statusBar.setTitle(this.bga.players.isCurrentPlayerActive() ?
                _('${you} must choose up to 2 cards to reserve') :
                _('${actplayer} must choose up to 2 cards to reserve'));
        }
        if (this.bga.players.isCurrentPlayerActive()) {
            this.tableCenter.setCardsSelectable(true, [], true, args.canReserve > 1);
        }
    }
    onEnteringPlaceJoker(args) {
        if (this.bga.players.isCurrentPlayerActive()) {
            this.getCurrentPlayerTable().setColumnsSelectable(args.colors);
        }
    }
    onEnteringTakeBoardToken(args) {
        if (args.canTakeAnyColorOrTwoOfColor) {
            this.bga.statusBar.setTitle(this.bga.players.isCurrentPlayerActive() ?
                _('${you} must take any token or 2 ${color_name} tokens from the board') :
                _('${actplayer} must take any token or 2 ${color_name} tokens from the board'), args);
        }
        if (args.number === -1) {
            this.bga.statusBar.setTitle(this.bga.players.isCurrentPlayerActive() ? _('${you} must take all tokens of a color from the board') : _('${actplayer} must take a ${color_name} must take all tokens of a color from the board'));
        }
        else if (args.color === 9) {
            this.bga.statusBar.setTitle(this.bga.players.isCurrentPlayerActive() ? _('${you} must take 3 tokens of any color from the board') : _('${actplayer} must take 3 tokens of any color from the board'));
        }
        if (this.bga.players.isCurrentPlayerActive()) {
            this.tableCenter.setBoardSelectable('effect', args.color === -1, args.number, args.color === 9 ? null : args.color, args.canTakeAnyColorOrTwoOfColor);
        }
    }
    onEnteringTakeOpponentToken(args) {
        if (this.bga.players.isCurrentPlayerActive()) {
            this.getPlayerTable(args.opponentId).setTokensSelectable(true, false);
        }
    }
    onEnteringTakeRoyalCard() {
        if (this.bga.players.isCurrentPlayerActive()) {
            this.tableCenter.setRoyalCardsSelectable(true);
        }
    }
    onEnteringTakeCounterfeiterCard() {
        if (this.bga.players.isCurrentPlayerActive()) {
            this.tableCenter.setCounterfeiterCardsSelectable(true, [], true, true);
        }
    }
    onEnteringDiscardTokens() {
        if (this.bga.players.isCurrentPlayerActive()) {
            this.getCurrentPlayerTable().setTokensSelectable(true, true);
        }
    }
    onEnteringReserveFromDeckChooseDeck() {
        if (this.bga.players.isCurrentPlayerActive()) {
            this.tableCenter.setDecksSelectable(true);
        }
    }
    onEnteringReserveFromDeckChooseCard(args) {
        const pickDiv = document.createElement('div');
        pickDiv.id = 'pick-div';
        document.getElementById(`cards-wrapper`).insertAdjacentElement('afterbegin', pickDiv);
        this.pickStock = new LineStock(this.cardsManager, pickDiv);
        this.pickStock.addCards(args._private ? args._private.cards : [1, 2, 3].map(fakeId => ({ id: -fakeId, level: args.level })));
        if (this.bga.players.isCurrentPlayerActive()) {
            this.pickStock.setSelectionMode('single');
            this.pickStock.onCardClick = card => this.bga.actions.performAction('actReserveFromDeckChooseCard', { id: card.id });
        }
    }
    onLeavingState(stateName) {
        console.log('Leaving state: ' + stateName);
        switch (stateName) {
            case 'usePrivilege':
            case 'playAction':
            case 'takeBoardToken':
                this.onLeavingPlayAction();
                break;
            case 'reserveCard':
                this.onLeavingReserveCard();
                break;
            case 'placeJoker':
                this.onLeavingPlaceJoker();
                break;
            case 'takeOpponentToken':
                this.onLeavingTakeOpponentToken();
                break;
            case 'takeCounterfeiterCard':
                this.onLeavingTakeCounterfeiterCard();
                break;
            case 'takeRoyalCard':
                this.onLeavingTakeRoyalCard();
                break;
            case 'discardTokens':
                this.onLeavingDiscardTokens();
                break;
            case 'reserveFromDeckChooseDeck':
                this.onLeavingReserveFromDeckChooseDeck();
                break;
            case 'reserveFromDeckChooseCard':
                this.onLeavingReserveFromDeckChooseCard();
                break;
        }
    }
    onLeavingPlayAction() {
        this.tableCenter.setBoardSelectable(null);
        this.tableCenter.setCardsSelectable(false);
        this.tableCenter.setCounterfeiterCardsSelectable(false);
        const currentPlayerTable = this.getCurrentPlayerTable();
        if (currentPlayerTable) {
            currentPlayerTable.setHandSelectable(false);
            currentPlayerTable.setTokensSelectableByType([], []);
        }
        const antiPlayingNoticeDiv = document.getElementById('anti-playing-notice');
        antiPlayingNoticeDiv.innerHTML = ``;
        antiPlayingNoticeDiv.classList.remove('visible');
        const noticeDiv = document.getElementById('notice');
        noticeDiv.innerHTML = ``;
        noticeDiv.classList.remove('visible');
    }
    onLeavingReserveCard() {
        this.tableCenter.setCardsSelectable(false);
    }
    onLeavingPlaceJoker() {
        this.getCurrentPlayerTable()?.setColumnsSelectable([]);
    }
    onLeavingTakeOpponentToken() {
        this.playersTables.forEach(playerTable => playerTable.setTokensSelectable(false, true));
    }
    onLeavingTakeRoyalCard() {
        this.tableCenter.setRoyalCardsSelectable(false);
        this.getCurrentPlayerTable()?.setHandSelectable(false);
    }
    onLeavingTakeCounterfeiterCard() {
        this.tableCenter.setCounterfeiterCardsSelectable(false);
        this.getCurrentPlayerTable()?.setHandSelectable(false);
    }
    onLeavingDiscardTokens() {
        this.getCurrentPlayerTable()?.setTokensSelectable(false, true);
    }
    onLeavingReserveFromDeckChooseDeck() {
        if (this.bga.players.isCurrentPlayerActive()) {
            this.tableCenter.setDecksSelectable(false);
        }
    }
    onLeavingReserveFromDeckChooseCard() {
        this.pickStock?.removeAll();
        this.pickStock = null;
        document.getElementById('pick-div')?.remove();
    }
    takeSelectedTokensWithWarning() {
        const showPrivilegeWarning = this.tokensSelection.filter(token => token.type == 2 && token.color == 0).length >= 2
            || (this.tokensSelection.length == 3 && this.tokensSelection[0].color == this.tokensSelection[1].color && this.tokensSelection[0].color == this.tokensSelection[2].color);
        let limitTokens = [...this.tokensSelection, ...this.getCurrentPlayerTable().getTokens()];
        const countCounterfeiterTokens = !this.getCurrentPlayerTable().counterfeiterCards?.getCards().some(card => card.type == 12);
        if (!countCounterfeiterTokens) {
            limitTokens = limitTokens.filter(token => token.color != 6);
        }
        const showLimitWarning = limitTokens.length > 10;
        if (showPrivilegeWarning || showLimitWarning) {
            this.confirmActionTakeTokens(() => this.takeSelectedTokens(), showPrivilegeWarning, showLimitWarning);
        }
        else {
            this.takeSelectedTokens();
        }
    }
    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    onUpdateActionButtons(stateName, args) {
        if (this.bga.players.isCurrentPlayerActive()) {
            switch (stateName) {
                case 'usePrivilege':
                    this.bga.statusBar.addActionButton('', () => this.takeSelectedTokens(), { id: `takeSelectedTokens_button` });
                    this.onTableTokenSelectionChange([], false);
                    this.bga.statusBar.addActionButton(_("Cancel"), () => this.bga.actions.performAction('actCancelUsePrivilege'), { color: 'secondary' });
                    break;
                case 'playAction':
                    this.bga.statusBar.addActionButton('', () => this.takeSelectedTokensWithWarning(), { id: `takeSelectedTokens_button` });
                    this.onTableTokenSelectionChange([], false);
                    break;
                case 'reserveCard':
                    if (args.canReserve > 1) {
                        this.bga.statusBar.addActionButton(_("Reserve selected cards"), () => this.bga.actions.performAction('actReserveCards', {
                            ids: this.selectedCards.map(card => card.id).join(',')
                        }), { id: 'reserve-cards-button', disabled: true });
                        this.bga.statusBar.addActionButton(_('Reserve the top 2 cards from the selected deck'), () => this.bga.actions.performAction('actReserveCards', {
                            ids: (args.deckCards?.[this.selectedCards[0].level]).join(',')
                        }), { id: 'reserve-deck-top-two-cards-button', disabled: true, color: 'secondary' });
                    }
                    break;
                case 'takeBoardToken':
                    this.bga.statusBar.addActionButton(_("Take selected token"), () => this.takeSelectedTokens(), { id: `takeSelectedTokens_button`, classes: 'disabled' });
                    break;
                case 'takeOpponentToken':
                    this.bga.statusBar.addActionButton(_("Take selected token"), () => this.takeOpponentToken(this.tokensSelection[0].id), { id: `takeSelectedTokens_button`, classes: 'disabled' });
                    break;
                case 'beforeEndTurn':
                    [
                        [9, _("Spend ${number} Glassware token(s) to take a Royal card").replace('${number}', 1 + args.playerRoyalCardCount)],
                        [10, _("Spend a Glassware token and a Privilege to play a new turn")],
                        [17, _("Spend 2 Glassware tokens to reserve a deck card")],
                    ].forEach(([powerId, buttonLabel]) => {
                        if (args.possiblePowers.includes(powerId)) {
                            this.bga.statusBar.addActionButton(buttonLabel, () => this.bga.actions.performAction('actUseCounterfeiterCardPower', { power: powerId }));
                        }
                    });
                    this.bga.statusBar.addActionButton(_("Pass"), () => this.bga.actions.performAction('actPassCounterfeiterCardPower'));
                    break;
                case 'discardTokens':
                    this.bga.statusBar.addActionButton(_("Discard selected token(s)"), () => this.discardSelectedTokens(), { id: `discardSelectedTokens_button`, classes: 'disabled' });
                    break;
            }
        }
    }
    ///////////////////////////////////////////////////
    //// Utility methods
    ///////////////////////////////////////////////////
    setTooltip(id, html) {
        this.bga.gameui.addTooltipHtml(id, html, this.TOOLTIP_DELAY);
    }
    setTooltipToClass(className, html) {
        this.bga.gameui.addTooltipHtmlToClass(className, html, this.TOOLTIP_DELAY);
    }
    getPlayerId() {
        return this.bga.players.getCurrentPlayerId();
    }
    getPlayer(playerId) {
        return Object.values(this.gamedatas.players).find(player => Number(player.id) == playerId);
    }
    getPlayerTable(playerId) {
        return this.playersTables.find(playerTable => playerTable.playerId === playerId);
    }
    getCurrentPlayerTable() {
        return this.playersTables.find(playerTable => playerTable.playerId === this.getPlayerId());
    }
    getOpponentId(playerId) {
        return Number(Object.values(this.gamedatas.players).find((player) => Number(player.id) != playerId).id);
    }
    getGameStateName() {
        return this.gamedatas.gamestate.name;
    }
    getOrderedPlayers(gamedatas) {
        const players = Object.values(gamedatas.players).sort((a, b) => a.playerNo - b.playerNo);
        const playerIndex = players.findIndex(player => Number(player.id) === this.bga.players.getCurrentPlayerId());
        const orderedPlayers = playerIndex > 0 ? [...players.slice(playerIndex), ...players.slice(0, playerIndex)] : players;
        return orderedPlayers;
    }
    getPlayersTokens() {
        return this.playersTables.map(table => table.getTokens()).flat();
    }
    createPlayerPanels(gamedatas) {
        Object.values(gamedatas.players).forEach(player => {
            const playerId = Number(player.id);
            let limitTokens = player.tokens;
            const countCounterfeiterTokens = !player.counterfeiterCards?.some(card => card.type == 12);
            let html = `
            <div class="score-tile-playerboard-wrapper">
                <div class="score-tile-playerboard">
                    <div id="end-reason-1-wrapper-${player.id}" class="points-counter">
                        <div id="points-counter-${player.id}"></div>
                        <div class="goal">/&nbsp;20</div>
                    </div>
    
                    <div id="end-reason-2-wrapper-${player.id}" class="crown-counter">
                        <div id="crown-counter-${player.id}"></div>
                        <div class="goal">/&nbsp;<span id="crown-goal-counter-${player.id}"></span></div>
                    </div>
    
                    <div id="end-reason-3-wrapper-${player.id}" class="strongest-column-counter">
                        <div id="strongest-column-counter-${player.id}"></div>
                        <div class="goal">/&nbsp;<span id="strongest-column-goal-counter-${player.id}"></span></div>
                    </div>
             </div>
            </div>
            
            <div class="counters">
                <div id="privilege-counter-wrapper-${player.id}" class="privilege-counter">
                    <div class="privilege icon"></div>
                    <span id="privilege-counter-${player.id}"></span><span class="goal">&nbsp;/&nbsp;3</span>
                </div>

                <div id="reserved-counter-wrapper-${player.id}" class="reserved-counter">
                    <div class="player-hand-card"></div> 
                    <span id="reserved-counter-${player.id}"></span><span class="goal">&nbsp;/&nbsp;3</span>
                </div>

                <div id="token-counter-wrapper-${player.id}" class="token-counter">
                    <div class="token icon"></div> 
                    <span id="token-counter-${player.id}"></span>${!countCounterfeiterTokens ? `<span class="smaller">(<span id="token-extra-counter-${player.id}"></span>)</span>` : ''}<span class="goal">&nbsp;/&nbsp;10</span>
                </div>
            </div>`;
            html += `
            <div class="spl_miniplayerboard">
                <div class="spl_ressources_container">`;
            [2, 1, 3, 5, 4].forEach(color => {
                html += `            
                    <div id="player-${playerId}-counters-card-points-${color}" class="card-points points icon"></div>`;
            });
            html += `<div></div>
            </div>
            <div class="spl_ressources_container">`;
            [2, 1, 3, 5, 4].forEach(color => {
                html += `            
                <div class="spl_ressources">
                    <div class="spl_minigem" data-color="${color}"></div>
                    <div id="player-${playerId}-counters-card-${color}" class="spl_cardcount" data-color="${color}">
                    </div>
                    <div id="player-${playerId}-counters-token-${color}" class="spl_coinpile" data-type="2" data-color="${color}">
                    </div>
                </div>`;
            });
            html += `
                    <div class="spl_ressources">
                        <div id="player-${playerId}-counters-token--1" class="spl_coinpile" data-type="1"></div>
                        <div id="player-${playerId}-counters-token-0" class="spl_coinpile" data-type="2" data-color="0"></div>
                        ${gamedatas.expansion ? `<div id="player-${playerId}-counters-token-6" class="spl_coinpile" data-type="2" data-color="6"></div>` : ''}
                    </div>
                </div>
            </div>
            `;
            this.bga.playerPanels.getElement(playerId).insertAdjacentHTML('beforeend', html);
            const points = [1, 2, 3, 4, 5, 9].map(color => {
                // we ignore multicolor in gray column as they will move to another column
                return player.cards.filter(card => card.location === `player${playerId}-${color}` && (color !== 9 || !card.power.includes(2))).map(card => card.points).reduce((a, b) => a + b, 0);
            }).reduce((a, b) => a + b, 0)
                + player.royalCards.map(card => card.points).reduce((a, b) => a + b, 0);
            this.pointsCounters[playerId] = new ebg.counter();
            this.pointsCounters[playerId].create(`points-counter-${playerId}`);
            this.pointsCounters[playerId].setValue(points);
            this.crownCounters[playerId] = new ebg.counter();
            this.crownCounters[playerId].create(`crown-counter-${playerId}`);
            this.crownCounters[playerId].setValue(player.cards.map(card => card.crowns).reduce((a, b) => a + b, 0) + (player.counterfeiterCards?.map(card => card.crowns).reduce((a, b) => a + b, 0) ?? 0));
            let strongestColumnValue = 0;
            [1, 2, 3, 4, 5].forEach(color => {
                // we ignore multicolor in gray column as they will move to another column
                const colorPoints = player.cards.filter(card => card.location === `player${playerId}-${color}`).map(card => card.points).reduce((a, b) => a + b, 0);
                if (colorPoints > strongestColumnValue) {
                    strongestColumnValue = colorPoints;
                }
            });
            this.strongestColumnCounters[playerId] = new ebg.counter();
            this.strongestColumnCounters[playerId].create(`strongest-column-counter-${playerId}`);
            this.strongestColumnCounters[playerId].setValue(strongestColumnValue);
            this.reservedCounters[playerId] = new ebg.counter();
            this.reservedCounters[playerId].create(`reserved-counter-${playerId}`);
            this.reservedCounters[playerId].setValue(player.reserved.length);
            this.privilegeCounters[playerId] = new ebg.counter();
            this.privilegeCounters[playerId].create(`privilege-counter-${playerId}`);
            this.privilegeCounters[playerId].setValue(player.privileges);
            if (!countCounterfeiterTokens) {
                limitTokens = limitTokens.filter(token => token.color != 6);
            }
            this.tokenCounters[playerId] = new ebg.counter();
            this.tokenCounters[playerId].create(`token-counter-${playerId}`);
            this.tokenCounters[playerId].setValue(limitTokens.length);
            if (!countCounterfeiterTokens) {
                this.tokenExtraCounters[playerId] = new ebg.counter();
                this.tokenExtraCounters[playerId].create(`token-extra-counter-${playerId}`);
                this.tokenExtraCounters[playerId].setValue(player.tokens.length - limitTokens.length);
            }
            this.crownGoalCounters[playerId] = new ebg.counter();
            this.crownGoalCounters[playerId].create(`crown-goal-counter-${playerId}`);
            this.crownGoalCounters[playerId].setValue(player.royalCards.some(royalCard => royalCard.power.includes(POWER_WIN_9CROWNS)) ? 9 : 10);
            this.strongestColumnGoalCounters[playerId] = new ebg.counter();
            this.strongestColumnGoalCounters[playerId].create(`strongest-column-goal-counter-${playerId}`);
            this.strongestColumnGoalCounters[playerId].setValue(player.royalCards.some(royalCard => royalCard.power.includes(POWER_WIN_9PTS_SAME_COLOR)) ? 9 : 10);
            [1, 2, 3, 4, 5].forEach(color => {
                // we ignore multicolor in gray column as they will move to another column
                const colorPoints = player.cards.filter(card => card.location === `player${playerId}-${color}` && (color !== 9 || !card.power.includes(2))).map(card => card.points).reduce((a, b) => a + b, 0);
                this.setCardPointsCounter(playerId, color, colorPoints);
            });
            [1, 2, 3, 4, 5].forEach(color => {
                const produce = player.cards.filter(card => card.location === `player${playerId}-${color}`).map(card => Object.values(card.provides).reduce((a, b) => a + b, 0)).reduce((a, b) => a + b, 0);
                this.setCardProduceCounter(playerId, color, produce);
            });
            const tokenColors = [-1, 0, 1, 2, 3, 4, 5];
            if (gamedatas.expansion) {
                tokenColors.push(6);
            }
            tokenColors.forEach(color => {
                const tokens = player.tokens.filter(token => color == -1 ? token.type == 1 : token.type == 2 && token.color == color);
                this.setTokenCounter(playerId, color, tokens.length);
            });
            if (player.endReasons.length) {
                this.setEndReasons(playerId, player.endReasons);
            }
        });
        this.setTooltipToClass('points-counter', _('Points'));
        this.setTooltipToClass('crown-counter', _('Crowns'));
        this.setTooltipToClass('strongest-column-counter', _('Points of the strongest column'));
        this.setTooltipToClass('privilege-counter', _('Privilege scrolls'));
        this.setTooltipToClass('reserved-counter', _('Reserved cards'));
        this.setTooltipToClass('token-counter', _('Number of tokens'));
    }
    setEndReasons(playerId, endReasons) {
        endReasons.forEach(endReason => document.getElementById(`end-reason-${endReason}-wrapper-${playerId}`).classList.add('end-reason'));
    }
    setCardPointsCounter(playerId, color, points) {
        const counterDiv = document.getElementById(`player-${playerId}-counters-card-points-${color}`);
        counterDiv.innerHTML = `${points}`;
        counterDiv.classList.toggle('hidden', points < 1);
    }
    incCardPointsCounter(playerId, color, inc) {
        const counterDiv = document.getElementById(`player-${playerId}-counters-card-points-${color}`);
        this.setCardPointsCounter(playerId, color, Number(counterDiv.innerHTML) + inc);
    }
    setCardProduceCounter(playerId, color, produce) {
        const counterDiv = document.getElementById(`player-${playerId}-counters-card-${color}`);
        counterDiv.innerHTML = `${produce ? produce : ''}`;
        counterDiv.classList.toggle('empty', !produce);
    }
    incCardProduceCounter(playerId, color, inc) {
        const counterDiv = document.getElementById(`player-${playerId}-counters-card-${color}`);
        this.setCardProduceCounter(playerId, color, Number(counterDiv.innerHTML) + inc);
    }
    setTokenCounter(playerId, color, count) {
        const counterDiv = document.getElementById(`player-${playerId}-counters-token-${color}`);
        counterDiv.innerHTML = `${count}`;
        counterDiv.classList.toggle('empty', !count);
    }
    updateTokenCounters(playerId) {
        const playerTokens = this.getPlayerTable(playerId).getTokens();
        const tokenColors = [-1, 0, 1, 2, 3, 4, 5];
        if (this.gamedatas.expansion) {
            tokenColors.push(6);
        }
        tokenColors.forEach(color => {
            const tokens = playerTokens.filter(token => color == -1 ? token.type == 1 : token.type == 2 && token.color == color);
            this.setTokenCounter(playerId, color, tokens.length);
        });
        let limitTokens = playerTokens;
        if (this.tokenExtraCounters[playerId]) {
            limitTokens = limitTokens.filter(token => token.color != 6);
            this.tokenExtraCounters[playerId].toValue(playerTokens.length - limitTokens.length);
        }
        this.tokenCounters[playerId].toValue(limitTokens.length);
    }
    createPlayerTables(gamedatas) {
        const orderedPlayers = this.getOrderedPlayers(gamedatas);
        orderedPlayers.forEach(player => this.createPlayerTable(gamedatas, Number(player.id)));
    }
    createPlayerTable(gamedatas, playerId) {
        const table = new PlayerTable(this, gamedatas.players[playerId], gamedatas.expansion);
        this.playersTables.push(table);
    }
    setScore(playerId, inc) {
        this.bga.playerPanels.getScoreCounter(playerId).incValue(inc);
    }
    incScore(playerId, inc) {
        this.pointsCounters[playerId].incValue(inc);
    }
    getHelpHtml() {
        let html = [1, 2, 3, 4, 5].map((power) => `
            <div class="help-section">
                <div class="ability-icon" data-ability="${power}"></div>
                <div class="help-label">${this.getPower(power)}</div>
            </div>`).join('');
        return html;
    }
    onTableTokenSelectionChange(tokens, valid, selectionType) {
        this.tokensSelection = tokens;
        const button = document.getElementById('takeSelectedTokens_button');
        if (button) {
            button.classList.toggle('disabled', !valid);
            const gold = tokens.length && tokens.every(token => token.type == 1);
            button.innerHTML = selectionType == 'play' && gold ? _("Take gold token to reserve a card") : _("Take ${number} selected token(s)").replace('${number}', '' + tokens.length);
        }
    }
    onPlayerTokenSelectionChange(tokens) {
        this.tokensSelection = tokens;
        if (this.gamedatas.gamestate.name == 'discardTokens') {
            document.getElementById('discardSelectedTokens_button')?.classList.toggle('disabled', this.tokensSelection.length != this.gamedatas.gamestate.args.number);
        }
        else if (this.gamedatas.gamestate.name == 'takeOpponentToken') {
            document.getElementById('takeSelectedTokens_button')?.classList.toggle('disabled', this.tokensSelection.length != 1);
        }
        else if (this.gamedatas.gamestate.name == 'playAction') {
            if (this.selectedCard) {
                this.setChooseTokenCostButtonLabelAndState();
            }
        }
    }
    onTableCardSelectionChange(card, selected) {
        /*if (selected) {
            this.selectedCards.push(card);
        } else {
            this.selectedCards = this.selectedCards.filter(c => c != card);
        }*/
        if (this.selectedCards.some(c => c.id == card.id)) {
            this.selectedCards = this.selectedCards.filter(c => c.id != card.id);
        }
        else {
            this.selectedCards.push(card);
        }
        const button = document.getElementById(`reserve-cards-button`);
        const deckTopTwoButton = document.getElementById('reserve-deck-top-two-cards-button');
        if (button) {
            button.disabled = this.selectedCards.length < 1 || this.selectedCards.length > 2;
        }
        if (deckTopTwoButton) {
            deckTopTwoButton.disabled = this.selectedCards.length !== 1 || this.gamedatas.gamestate.args.deckCards?.[this.selectedCards[0].level].length < 2;
        }
    }
    onTableCardClick(card, selected) {
        if (this.gamedatas.gamestate.name == 'reserveCard') {
            if (this.gamedatas.gamestate.args.canReserve > 1) {
                this.onTableCardSelectionChange(card, selected);
            }
            else {
                this.reserveCard(card.id);
            }
        }
        else if (this.gamedatas.gamestate.name == 'playAction') {
            if (card == this.selectedCard) {
                this.cancelChooseTokenCost();
            }
            else {
                if (this.selectedCard) {
                    this.cancelChooseTokenCost();
                }
                this.onBuyCardClick(card);
            }
        }
        else if (this.gamedatas.gamestate.name == 'reserveFromDeckChooseDeck') {
            this.bga.actions.performAction('actReserveFromDeckChooseDeck', { id: card.id });
        }
    }
    onBuyCardClick(card) {
        const playerId = this.getPlayerId();
        const possiblePayments = structuredClone(this.gamedatas.gamestate.args.buyableCards[card.id]);
        const reductedCost = structuredClone(this.gamedatas.gamestate.args.reducedCosts[card.id]);
        if (!possiblePayments) {
            return;
        }
        this.selectedCard = card;
        this.selectedCardPossiblePayments = possiblePayments;
        this.selectedCardReducedCost = reductedCost;
        this.onAnyTableCardClick(playerId, reductedCost, possiblePayments);
    }
    onBuyCounterfeiterCardClick(card) {
        const playerId = this.getPlayerId();
        const possiblePayments = structuredClone(this.gamedatas.gamestate.args.buyableCounterfeiterCards[card.id]);
        const reductedCost = structuredClone(this.gamedatas.gamestate.args.reducedCounterfeiterCosts[card.id]);
        if (!possiblePayments) {
            return;
        }
        this.selectedCard = card;
        this.selectedCardPossiblePayments = possiblePayments;
        this.selectedCardReducedCost = reductedCost;
        this.onAnyTableCardClick(playerId, reductedCost, possiblePayments);
    }
    onAnyTableCardClick(playerId, reductedCost, possiblePayments) {
        const table = this.getPlayerTable(playerId);
        let selectedTokens = [];
        if (possiblePayments.length > 0) {
            [-1, 0, 1, 2, 3, 4, 5, 6].forEach(color => {
                const minNumber = Math.min(...possiblePayments.map(possiblePayment => possiblePayment[color] ?? 0));
                const tokensOfColor = table.tokens[color]?.getCards() ?? [];
                selectedTokens.push(...tokensOfColor.slice(0, Math.min(minNumber, tokensOfColor.length)));
            });
            this.tokensSelection = selectedTokens;
        }
        const mustSelectTokens = possiblePayments.length === 1;
        this.setActionBarChooseTokenCost(reductedCost);
        const allowedTypes = [];
        possiblePayments.forEach(possiblePayment => Object.keys(possiblePayment).map(Number).forEach(possibleColor => {
            if (!allowedTypes.includes(possibleColor)) {
                allowedTypes.push(possibleColor);
            }
        }));
        this.getCurrentPlayerTable().setTokensSelectableByType(allowedTypes, this.tokensSelection);
        // scroll to tokens, if the play must select them manually
        if (mustSelectTokens) {
            const element = document.getElementById(`player-table-${playerId}-tokens-2`);
            const rect = element.getBoundingClientRect();
            const isVisible = (rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth));
            if (!isVisible) {
                element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'center',
                });
            }
        }
    }
    setChooseTokenCostButtonLabelAndState() {
        const button = document.getElementById(`chooseTokenCost-button`);
        if (button) {
            const selection = this.getCurrentPlayerTable().getSelectedTokens();
            const possiblePayments = this.selectedCardPossiblePayments;
            const expectedTileCounts = possiblePayments.map(possiblePayment => Object.values(possiblePayment).reduce((a, b) => a + b, 0));
            const expectedTileCount = Math.min(...expectedTileCounts);
            const valid = possiblePayments.some(possiblePayment => {
                const selectionPayment = {};
                selection.forEach(token => {
                    const tokenColor = token.type == 1 ? -1 : token.color;
                    if (!selectionPayment[tokenColor]) {
                        selectionPayment[tokenColor] = 0;
                    }
                    selectionPayment[tokenColor]++;
                });
                return Object.keys(possiblePayment).length === Object.keys(selectionPayment).length &&
                    Object.entries(selectionPayment).every(([color, count]) => possiblePayment[Number(color)] === count);
            });
            const label = expectedTileCount > 0 ?
                _('Pay ${cost}').replace('${cost}', `<div class="compressed-token-icons">${selection.map(token => `<div class="token-icon" data-type="${token.type == 1 ? -1 : token.color}"></div>`).join('')}${new Array(Math.max(0, expectedTileCount - selection.length)).fill(0).map(() => `<div class="fake token-icon">?</div>`).join('')}</div>`) :
                _('Take for free');
            button.innerHTML = label;
            button.classList.toggle('disabled', !valid);
        }
    }
    setActionBarChooseTokenCost(reductedCost) {
        const question = _("${you} must select the tokens to pay ${cost}").replace('${cost}', `<div class="compressed-token-icons">${Object.entries(reductedCost).map(([color, number]) => new Array(number).fill(0).map(() => `<div class="token-icon" data-type="${color}"></div>`).join('')).join('')}</div>`);
        this.setChooseActionGamestateDescription(question);
        document.getElementById(`generalactions`).innerHTML = '';
        this.bga.statusBar.addActionButton(``, () => this.buyCard(), { id: `chooseTokenCost-button` });
        this.setChooseTokenCostButtonLabelAndState();
        this.bga.statusBar.addActionButton(_("Cancel"), () => this.cancelChooseTokenCost(), { color: 'secondary', id: `cancelChooseTokenCost-button` });
    }
    setChooseActionGamestateDescription(newText) {
        if (!this.originalTextChooseAction) {
            this.originalTextChooseAction = document.getElementById('pagemaintitletext').innerHTML;
        }
        this.bga.statusBar.setTitle(newText ?? this.originalTextChooseAction);
    }
    cancelChooseTokenCost() {
        const table = this.getCurrentPlayerTable();
        if (this.selectedCard) {
            const isCounterfeiterCard = this.selectedCard.provides === undefined;
            if (isCounterfeiterCard) {
                this.tableCenter.unselectTableCounterfeiterCard(this.selectedCard);
            }
            else {
                this.tableCenter.unselectTableCard(this.selectedCard);
                table.reserved.unselectCard(this.selectedCard);
            }
        }
        this.setActionBarChooseAction(true);
        this.selectedCard = null;
        this.tokensSelection = null;
        document.getElementById(`chooseTokenCost-button`)?.remove();
        document.getElementById(`cancelChooseTokenCost-button`)?.remove();
        table.setTokensSelectableByType([], []);
    }
    setActionBarChooseAction(fromCancel) {
        document.getElementById(`generalactions`).innerHTML = '';
        if (fromCancel) {
            this.setChooseActionGamestateDescription();
        }
        /*if (this.actionTimerId) {
            window.clearInterval(this.actionTimerId);
        }*/
        this.onUpdateActionButtons(this.gamedatas.gamestate.name, this.gamedatas.gamestate.args);
        this.onEnteringState(this.gamedatas.gamestate.name, { args: this.gamedatas.gamestate.args });
    }
    onRoyalCardClick(card) {
        this.takeRoyalCard(card.id);
    }
    onCounterfeiterCardClick(card) {
        if (this.gamedatas.gamestate.name == 'takeCounterfeiterCard') {
            this.bga.actions.performAction('actTakeCounterfeiterCard', { id: card.id });
        }
        else if (this.gamedatas.gamestate.name == 'reserveCard') {
            //this.reserveCard(card.id);
        }
        else if (this.gamedatas.gamestate.name == 'playAction') {
            if (this.selectedCard) {
                this.cancelChooseTokenCost();
            }
            this.onBuyCounterfeiterCardClick(card);
        }
    }
    onReservedCardClick(card) {
        this.onTableCardClick(card, true);
    }
    onColumnClick(color) {
        if (this.gamedatas.gamestate.name == 'placeJoker') {
            this.bga.actions.performAction('actPlaceJoker', {
                color
            });
        }
    }
    takeSelectedTokens() {
        const tokensIds = this.tokensSelection.map(token => token.id).sort((a, b) => a - b);
        this.bga.actions.performAction('actTakeTokens', {
            ids: tokensIds.join(','),
        });
    }
    discardSelectedTokens() {
        const tokensIds = this.tokensSelection.map(token => token.id).sort((a, b) => a - b);
        this.bga.actions.performAction('actDiscardTokens', {
            ids: tokensIds.join(','),
        });
    }
    reserveCard(id) {
        this.bga.actions.performAction('actReserveCard', {
            id
        });
    }
    buyCard() {
        const tokensIds = this.tokensSelection.map(token => token.id).sort((a, b) => a - b);
        const isCounterfeiterCard = this.selectedCard.provides === undefined;
        this.bga.actions.performAction(isCounterfeiterCard ? 'actBuyCounterfeiterCard' : 'actBuyCard', {
            id: this.selectedCard.id,
            tokensIds: tokensIds.join(','),
        });
    }
    takeRoyalCard(id) {
        this.bga.actions.performAction('actTakeRoyalCard', {
            id
        });
    }
    takeOpponentToken(id) {
        this.bga.actions.performAction('actTakeOpponentToken', {
            id
        });
    }
    ///////////////////////////////////////////////////
    //// Reaction to cometD notifications
    /*
        setupNotifications:

        In this method, you associate each of your game notifications with your local method to handle it.

        Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                your pylos.game.php file.

    */
    setupNotifications() {
        //log( 'notifications subscriptions setup' );
        const notifs = [
            ['privileges', ANIMATION_MS],
            ['refill', undefined],
            ['takeTokens', undefined],
            ['reserveCard', undefined],
            ['buyCard', undefined],
            ['buyCounterfeiterCard', undefined],
            ['takeCounterfeiterCard', undefined],
            ['takeRoyalCard', undefined],
            ['discardTokens', undefined],
            ['newTableCard', undefined],
            ['newTableRoyalCard', undefined],
            ['refillCounterfeiterCards', undefined],
            ['win', ANIMATION_MS * 3],
        ];
        notifs.forEach((notif) => {
            dojo.subscribe(notif[0], this, (notifDetails) => {
                console.log(`notif_${notif[0]}`, notifDetails.args);
                const promise = this[`notif_${notif[0]}`](notifDetails.args);
                // tell the UI notification ends, if the function returned a promise
                promise?.then(() => this.bga.gameui.notifqueue.onSynchronousNotificationEnd());
            });
            this.bga.gameui.notifqueue.setSynchronous(notif[0], notif[1]);
        });
        if (isDebug) {
            notifs.forEach((notif) => {
                if (!this[`notif_${notif[0]}`]) {
                    console.warn(`notif_${notif[0]} function is not declared, but listed in setupNotifications`);
                }
            });
            Object.getOwnPropertyNames(Game.prototype).filter(item => item.startsWith('notif_')).map(item => item.slice(6)).forEach(item => {
                if (!notifs.some(notif => notif[0] == item)) {
                    console.warn(`notif_${item} function is declared, but not listed in setupNotifications`);
                }
            });
        }
    }
    notif_privileges(args) {
        Object.entries(args.privileges).forEach(entry => this.privilegeCounters[entry[0]].setValue(entry[1]));
        const fromDiv = document.getElementById(args.from ? `player-privileges-${args.from}` : `table-privileges`);
        const toDiv = document.getElementById(args.to ? `player-privileges-${args.to}` : `table-privileges`);
        const divs = Array.from(fromDiv.querySelectorAll('.privilege-token')).slice(0, args.count);
        divs.forEach(div => this.animationManager.attachWithAnimation(new BgaSlideAnimation({ element: div }), toDiv));
    }
    async notif_refill(args) {
        await this.tableCenter.refillBoard(args.refilledTokens);
    }
    async notif_takeTokens(args) {
        const { tokens, playerId, from } = args;
        const fromStock = from === 'bag' ? this.tableCenter.bag : undefined;
        await this.getPlayerTable(playerId).addTokens(tokens, fromStock);
        this.updateTokenCounters(playerId);
        this.updateTokenCounters(this.getOpponentId(playerId));
    }
    notif_reserveCard(args) {
        this.reservedCounters[args.playerId].incValue(1);
        const promise = this.getPlayerTable(args.playerId).addReservedCard(args.card);
        if (args.fromDeck) {
            this.tableCenter.cardsDecks[args.level].setCardNumber(args.cardDeckCount, args.cardDeckTop);
        }
        return promise;
    }
    async notif_buyCard(args) {
        const { card, playerId, tokens } = args;
        if (args.fromReserved) {
            this.reservedCounters[playerId].incValue(-1);
        }
        await this.getPlayerTable(playerId).addCard(card);
        if (args.tokens?.length) {
            await this.tableCenter.removeTokens(tokens);
            this.updateTokenCounters(playerId);
        }
        const column = Number(card.location.slice(-1));
        if ([1, 2, 3, 4, 5].includes(column) || (column == 9 && !card.power.includes(2))) {
            const playerTable = this.getPlayerTable(playerId);
            this.crownCounters[playerId].toValue(playerTable.getCrowns());
            this.incScore(playerId, card.points);
            if (column <= 5) {
                this.incCardPointsCounter(playerId, column, card.points);
                this.incCardProduceCounter(playerId, column, Object.values(card.provides).reduce((a, b) => a + b, 0));
                this.strongestColumnCounters[playerId].toValue(Math.max(...[1, 2, 3, 4, 5].map(color => Number(document.getElementById(`player-${playerId}-counters-card-points-${color}`).innerHTML))));
            }
        }
        return Promise.resolve(true);
    }
    async notif_buyCounterfeiterCard(args) {
        const { card, playerId, tokens } = args;
        await this.getPlayerTable(playerId).addCounterfeiterCard(card);
        if (card.type === 12) {
            document.getElementById(`token-counter-${playerId}`).insertAdjacentHTML('afterend', `<span class="smaller">(<span id="token-extra-counter-${playerId}"></span>)</span>`);
            this.tokenExtraCounters[playerId] = new ebg.counter();
            this.tokenExtraCounters[playerId].create(`token-extra-counter-${playerId}`);
        }
        if (args.tokens?.length) {
            await this.tableCenter.removeTokens(tokens);
            this.updateTokenCounters(playerId);
        }
        const playerTable = this.getPlayerTable(playerId);
        this.crownCounters[playerId].toValue(playerTable.getCrowns());
        this.incScore(playerId, card.points);
        return Promise.resolve(true);
    }
    async notif_takeCounterfeiterCard(args) {
        const { card, playerId, fromDeck, counterfeiterDeckCount, counterfeiterDeckTop } = args;
        await this.getPlayerTable(playerId).addCounterfeiterCard(card);
        if (fromDeck) {
            this.tableCenter.counterfeiterDeck.setCardNumber(counterfeiterDeckCount, counterfeiterDeckTop);
        }
        const playerTable = this.getPlayerTable(playerId);
        this.crownCounters[playerId].toValue(playerTable.getCrowns());
        this.incScore(playerId, card.points);
        return Promise.resolve(true);
    }
    notif_takeRoyalCard(args) {
        const { card, playerId } = args;
        this.incScore(playerId, card.points);
        if (card.power.includes(POWER_WIN_9CROWNS)) {
            this.crownGoalCounters[playerId].toValue(9);
        }
        if (card.power.includes(POWER_WIN_9PTS_SAME_COLOR)) {
            this.strongestColumnGoalCounters[playerId].toValue(9);
        }
        return this.getPlayerTable(playerId).addRoyalCard(card);
    }
    async notif_discardTokens(args) {
        const { tokens, playerId } = args;
        await this.tableCenter.removeTokens(tokens);
        this.updateTokenCounters(playerId);
    }
    notif_newTableCard(args) {
        return this.tableCenter.replaceCard(args);
    }
    notif_newTableRoyalCard(args) {
        return this.tableCenter.addRoyalCard(args.newCard);
    }
    notif_refillCounterfeiterCards(args) {
        const { cards, counterfeiterDeckCount, counterfeiterDeckTop } = args;
        return this.tableCenter.refillCounterfeiterCards(cards, counterfeiterDeckCount, counterfeiterDeckTop);
    }
    notif_win(args) {
        this.setScore(args.playerId, 1);
        this.setEndReasons(args.playerId, args.endReasons);
    }
    getColor(color) {
        switch (color) {
            case 0: return _("Pearl");
            case 1: return _("Blue");
            case 2: return _("White");
            case 3: return _("Green");
            case 4: return _("Black");
            case 5: return _("Red");
            case 9: return _("Gray");
        }
    }
    getPower(power) {
        switch (power) {
            case 1: return _("Take another turn immediately after this one ends.");
            case 2: return _("Place this card so that it overlaps a Jewel card with a bonus. Treat this card’s <ICON_MULTI> bonus as though it were the same color of the card it is overlapping.").replace('<ICON_MULTI>', `<div class="token-icon" data-type="9"></div>`) +
                `<br><i>${_("If you do not have a card with a bonus, you cannot purchase this card.")}</i>`;
            case 3: return _("Take 1 token matching the color of this card from the board. If there are no such tokens left, ignore this effect.");
            case 4: return _("Take 1 Privilege. If none are available, take 1 from your opponent.");
            case 5: return _("Take 1 Gem or Pearl token from your opponent. If your opponent has no such tokens, ignore this effect. You cannot take a Gold token from your opponent.");
            case 6: return _("Reserve a card from any deck or any level, even if no Gold token is available on the board, replacing it if needed. Do not take a Gold token. If you already have the maximum number of reserved cards, skip this effect.");
            case 7: return _("If you have 9 or more Prestige points on cards of the same bonus color, <strong>you win</strong>.");
            case 8: return _("If you have 9 or more Crowns, <strong>you win</strong>.");
            case 9: return _("Take up to 4 tokens from the board; they must all be of a single color, all Glassware, or all Pearls, but  <strong>not gold </strong>.");
            case 10: return _("Take 1 face-up Counterfeiter card of your choice (at no cost) and replace it; <strong>or</strong> reveal the top card of the Counterfeiter deck and take it (at no cost).");
            case 11: return _("Take up to 2 tokens at random from the bag. The tokens can be of any kind (including gold).");
            case 12: return _("Take a Gold token from the board, if one is available. Do not reserve a card.");
            case 13: return _("Take up to 3 tokens of your choice from the board, except Gold.");
        }
    }
    /* This enable to inject translatable styled things to logs or action bar */
    /* @Override */
    bgaFormatText(log, args) {
        try {
            if (log && args && !args.processed) {
                ['new_tokens', 'spent_tokens', 'discarded_tokens'].forEach(property => {
                    if (args[property] && (typeof args[property] !== 'string' || args[property][0] !== '<')) {
                        args[property] = args.tokens.map(token => `<div class="token-icon" data-type="${token.type == 1 ? -1 : token.color}"></div>`).join(' ');
                    }
                });
                for (const property in args) {
                    if (['card_level', 'color_name'].includes(property) && args[property][0] != '<') {
                        args[property] = `<strong>${_(args[property])}</strong>`;
                    }
                }
                const cardRegex = /<card>(.*)<\/card>/;
                const cardMatch = log.match(this.CARD_REGEX);
                if (cardMatch) {
                    const cardLogId = this.cardLogId++;
                    log = _(log).replace(cardRegex, (_, innerText) => `<span id="card-log-${cardLogId}" class="card-log-int">${innerText}</span>`);
                    const cardForLog = this.cardsManager.createCardElement({ ...args['card'], id: `card-for-log-${cardLogId}` });
                    setTimeout(() => this.bga.gameui.addTooltipHtml(`card-log-${cardLogId}`, cardForLog.outerHTML, 500));
                }
            }
        }
        catch (e) {
            console.error(log, args, "Exception thrown", e.stack);
        }
        return { log, args };
    }
}

export { Game };
