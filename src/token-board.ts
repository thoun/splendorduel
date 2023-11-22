type SelectionType = 'privileges' | 'play' | 'effect' | null;

class TokenBoard {
    public stock: SlotStock<Token>;

    private maxSelectionToken: number;
    private selectionType: SelectionType;
    private selectionColor: number;
    private canTakeGold: boolean;

    private mouseSelectionInitialCoordinates: number[];
    private mouseSelectionStart: Token | null;
    private mouseSelection: HTMLDivElement;
        
    constructor(private game: SplendorDuelGame, board: Token[]) {
        const slotsIds = [];
        for (let row = 1; row <= 5; row++) {
            for (let column = 1; column <= 5; column++) {
                slotsIds.push(JSON.stringify([row, column]));
            }
        }
        const boardDiv = document.getElementById(`board`);
        this.stock = new SlotStock<Token>(game.tokensManager, boardDiv, {
            slotsIds,
            mapCardToSlot: card => JSON.stringify([card.row, card.column]),
            gap: '0',
            selectableCardClass: 'no-visible-selection',
        });
        this.stock.addCards(board);
        this.stock.onSelectionChange = (selection: Token[], lastChange: Token) => this.onTokenSelectionChange(selection, lastChange);
        boardDiv.addEventListener('mousedown', event => this.onMouseDown(event));
        boardDiv.addEventListener('mousemove', event => this.onMouseMove(event));
        boardDiv.addEventListener('mouseup', event => this.onMouseUp(event));
        document.addEventListener('mouseup', event => this.onMouseUp(null));
        document.addEventListener('keyup', (event: KeyboardEvent) => {
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

    private getDefaultPossibleSelection(): Token[] {
        let possibleSelection = this.stock.getCards();
        if (!this.canTakeGold) {
            possibleSelection = possibleSelection.filter(card => card.type === 2);
        }
        if (this.selectionColor != null) {
            possibleSelection = possibleSelection.filter(card => card.color === this.selectionColor);
        }
        return possibleSelection;
    }
    
    public setSelectable(selectionType: 'privileges' | 'play' | 'effect' | null, canTakeGold: boolean, max: number = 3, color: number = null) {
        this.stock.setSelectionMode(selectionType ? 'multiple' : 'none');
        this.maxSelectionToken = max;
        this.selectionType = selectionType;
        this.selectionColor = color;
        this.canTakeGold = canTakeGold;

        this.stock.setSelectableCards(this.getDefaultPossibleSelection());
    }

    private onTokenSelectionChange(selection: Token[], lastChange: Token) {
        let valid = selection.length > 0;

        const tokens = this.stock.getCards();
        selection.sort((a, b) => a.row == b.row ? a.column - b.column : a.row - b.row);

        if (selection.length > this.maxSelectionToken) {
            valid = false;
        } else if (this.selectionType === 'privileges') {
            valid = this.onPrivilegeTokenSelectionChange(selection, tokens, valid);
        } else if (this.selectionType === 'effect') {
            valid = this.onEffectTokenSelectionChange(selection, tokens, valid);
        } else if (this.selectionType === 'play') {
            const { stop, validUpdated } = this.onPlayTokenSelectionChange(selection, tokens, valid, lastChange);
            if (stop) {
                return;
            }
            valid = validUpdated;
        }

        this.game.onTableTokenSelectionChange(selection, valid);
    }

    private onPlayTokenSelectionChange(selection: Token[], tokens: Token[], valid: boolean, lastChange: Token) {
        const goldTokens = selection.filter(card => card.type == 1);
        const gemsTokens = selection.filter(card => card.type == 2);

        const goldSelection = goldTokens.length >= 1;

        const selectionAtMax = goldSelection || gemsTokens.length >= this.maxSelectionToken;

        let remainingSelection = selectionAtMax ? selection : this.getDefaultPossibleSelection();

        if (goldSelection) {
            if (gemsTokens.length) {
                valid = false;
            }
        } else {
            // select is sorted by row then column. column order might be desc if row is asc.
            if (gemsTokens.length == 3) {
                valid = this.onPlayTokenSelectionChange3gems(gemsTokens, valid);
            } else if (gemsTokens.length == 2) {
                const { stop, validUpdated, remainingSelectionUpdated } = this.onPlayTokenSelectionChange2gems(gemsTokens, tokens, lastChange, valid);
                if (stop) {
                    return { stop: true, validUpdated: true };
                }
                valid = validUpdated;
                remainingSelection = remainingSelectionUpdated;
            } else if (gemsTokens.length == 1) {
                const remainingSelectionUpdated = this.onPlayTokenSelectionChange1gem(gemsTokens[0], tokens);
                remainingSelection = remainingSelectionUpdated;
            }
        }

        this.stock.setSelectableCards(selectionAtMax ? selection : remainingSelection);
        return { stop: false, validUpdated: valid };
    }
    
    private onPlayTokenSelectionChange1gem(gemToken: Token, tokens: Token[]) {
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

    private onPlayTokenSelectionChange2gems(gemsTokens: Token[], tokens: Token[], lastChange: Token, valid: boolean) {
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
                } else {
                    this.stock.selectCard(middleToken);
                    return { stop: true, validUpdated: true, remainingSelection: remainingSelection };
                }
            } else {
                valid = false;
            }
        } else if ([0, 1].includes(absRowDiff) && [0, 1].includes(absColDiff)) {
            [-1, 2].forEach(direction => {
                const nextRow = gemsTokens[0].row - direction*rowDiff;
                const nextCol = gemsTokens[0].column - direction*colDiff;
                const nextToken = tokens.find(token => token.row == nextRow && token.column == nextCol);
                if (nextToken?.type == 2) {
                    remainingSelection.push(nextToken);
                }
            });
        } else {
            valid = false;
        }
        return { stop: false, validUpdated: valid, remainingSelectionUpdated: remainingSelection };
    }

    private onPlayTokenSelectionChange3gems(gemsTokens: Token[], valid: boolean) {
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

    private onEffectTokenSelectionChange(selection: Token[], tokens: Token[], valid: boolean) {
        this.stock.setSelectableCards(selection.length >= this.maxSelectionToken ? selection : this.getDefaultPossibleSelection());

        if (selection.some(card => card.type != 2 || card.color != this.selectionColor)) {
            valid = false;
        }
        return valid;
    }

    private onPrivilegeTokenSelectionChange(selection: Token[], tokens: Token[], valid: boolean) {
        this.stock.setSelectableCards(selection.length >= this.maxSelectionToken ? selection : this.getDefaultPossibleSelection());

        if (selection.some(card => card.type != 2)) {
            valid = false;
        }
        return valid;
    }
    
    public refill(refilledTokens: Token[], fromStock: CardStock<Token>): Promise<any> {
        return this.stock.addCards(refilledTokens, { fromStock }, undefined, 350);
    }

    

    private checkPlayTakeGems(tokens: Token[])  {
        const gold = tokens.filter(token => token.type == 1);
        let gems = tokens.filter(token => token.type == 2);

        if (gold.length > 0) {
            if (gold.length > 1) {
                return false;
            } else if (gems.length > 0) {
                return false;
            }
        } else {
            if (gems.length > 3) {
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
                } else {
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

    private completeSelection(from: Token, to: Token): Token[] {
        const selection = from.id == to.id ? [from] : [from, to];
        if (selection.length > 1 && (Math.abs(selection[0].row - selection[1].row) == 2 || Math.abs(selection[0].column - selection[1].column) == 2)) {
            const middle = this.stock.getCards().find(token => token.row == Math.floor((selection[0].row + selection[1].row) / 2) && token.column == Math.floor((selection[0].column + selection[1].column) / 2));
            if (middle && !selection.some(s => s.id == middle.id)) {
                return [...selection, middle];
            }
        }
        return selection;
    }

    private mouseSelectionValid(from: Token, to: Token): boolean {
        const selection = this.completeSelection(from, to);
        return this.checkPlayTakeGems(selection);
    }

    private getTokenFromMouseEvent(event: MouseEvent): Token | null {
        const tokenDiv = (event.target as HTMLElement)?.closest('.token');
        return tokenDiv ? this.stock.getCards().find(card => tokenDiv.id == `token-${card.id}`) : null;
    }
    
    private onMouseDown(event: MouseEvent) {
        this.mouseSelectionStart = this.getTokenFromMouseEvent(event);
        this.mouseSelectionInitialCoordinates = [event.screenX, event.screenY];
    }

    private getTokenCenterCoordinates(token: Token): number[] {
        return [50 + (token.column - 1) * 83.2, 133 + (token.row - 1) * 83.2];
    }
    
    private onMouseMove(event: MouseEvent) {
        if (!this.mouseSelectionStart || !this.mouseSelectionInitialCoordinates) {
            return;
        }
        const mouseMovementDistance = Math.sqrt(Math.pow(this.mouseSelectionInitialCoordinates[0] - event.screenX, 2) + Math.pow(this.mouseSelectionInitialCoordinates[1] - event.screenY, 2));
        if (mouseMovementDistance < 10) {
            return;
        }
        const mouseSelectionEnd = this.getTokenFromMouseEvent(event);
        if (!mouseSelectionEnd) {
            return;
        }

        this.stock.unselectAll();

        const fromCoordinates = this.getTokenCenterCoordinates(this.mouseSelectionStart);
        if (!this.mouseSelection) {
            this.mouseSelection = document.createElement('div');
            this.mouseSelection.id = 'mouse-selection';
            this.mouseSelection.style.left = `${fromCoordinates[0] - 40}px`;
            this.mouseSelection.style.top = `${fromCoordinates[1] - 40}px`;
            document.getElementById(`board`).appendChild(this.mouseSelection);
        }        
        this.mouseSelection.dataset.valid = this.mouseSelectionValid(this.mouseSelectionStart, mouseSelectionEnd).toString();
        const toCoordinates = this.getTokenCenterCoordinates(mouseSelectionEnd);
        const xDiff = toCoordinates[0] - fromCoordinates[0];
        const yDiff = toCoordinates[1] - fromCoordinates[1];
        const distance = Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2)) + 80;
        const angle = Math.atan(yDiff / xDiff);
        this.mouseSelection.style.width = `${distance}px`;
        this.mouseSelection.style.transform = `rotate(${xDiff < 0 ? Math.PI + angle : angle}rad)`;
    }

    public onMouseUp(event: MouseEvent | null) {
        if (event && this.mouseSelectionStart) {
            const mouseMovementDistance = Math.sqrt(Math.pow(this.mouseSelectionInitialCoordinates[0] - event.screenX, 2) + Math.pow(this.mouseSelectionInitialCoordinates[1] - event.screenY, 2));
            if (mouseMovementDistance >= 10) {
                const mouseSelectionEnd = this.getTokenFromMouseEvent(event);
                if (mouseSelectionEnd && this.mouseSelectionValid(this.mouseSelectionStart, mouseSelectionEnd)) {
                    const selection = this.completeSelection(this.mouseSelectionStart, mouseSelectionEnd);

                    this.stock.unselectAll();
                    selection.forEach(card => this.stock.selectCard(card));
                    this.onTokenSelectionChange(selection, mouseSelectionEnd);
                }
            }

            event.stopImmediatePropagation();
        }

        this.mouseSelectionStart = null;
        this.mouseSelectionInitialCoordinates = null;
        this.mouseSelection?.remove();
        this.mouseSelection = null;
    }
}