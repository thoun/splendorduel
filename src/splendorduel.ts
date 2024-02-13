declare const define;
declare const ebg;
declare const $;
declare const dojo: Dojo;
declare const _;
declare const g_gamethemeurl;
declare const bgaConfig;

const ANIMATION_MS = 500;
const ACTION_TIMER_DURATION = 5;

const LOCAL_STORAGE_ZOOM_KEY = 'SplendorDuel-zoom';
const LOCAL_STORAGE_JUMP_TO_FOLDED_KEY = 'SplendorDuel-jump-to-folded';

class SplendorDuel implements SplendorDuelGame {
    public animationManager: AnimationManager;
    public cardsManager: CardsManager;
    public royalCardsManager: RoyalCardsManager;
    public tokensManager: TokensManager;

    private zoomManager: ZoomManager;
    private gamedatas: SplendorDuelGamedatas;
    private tableCenter: TableCenter;
    private playersTables: PlayerTable[] = [];
    private privilegeCounters: Counter[] = [];
    private reservedCounters: Counter[] = [];
    private pointsCounters: Counter[] = [];
    private crownCounters: Counter[] = [];
    private strongestColumnCounters: Counter[] = [];
    private tokenCounters: Counter[] = [];

    private tokensSelection: Token[];
    private selectedCard: Card;
    private selectedCardReducedCost: { [color: number]: number };
    private originalTextChooseAction: string;
    
    private TOOLTIP_DELAY = document.body.classList.contains('touch-device') ? 1500 : undefined;

    constructor() {
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

    public setup(gamedatas: SplendorDuelGamedatas) {
        log( "Starting game setup" );
        
        this.gamedatas = gamedatas;

        log('gamedatas', gamedatas);

        this.animationManager = new AnimationManager(this);
        this.cardsManager = new CardsManager(this);
        this.royalCardsManager = new RoyalCardsManager(this);
        this.tokensManager = new TokensManager(this);        
        new JumpToManager(this, {
            localStorageFoldedKey: LOCAL_STORAGE_JUMP_TO_FOLDED_KEY,
            topEntries: [
                new JumpToEntry(_('Main board'), 'board', { 'color': '#83594f' }),
                new JumpToEntry(_('Cards pyramid'), 'table-cards', { 'color': '#678e67' }),
            ],
            entryClasses: 'round-point',
            defaultFolded: true,
        });

        this.tableCenter = new TableCenter(this, gamedatas);
        this.createPlayerPanels(gamedatas);
        this.createPlayerTables(gamedatas);
        
        this.zoomManager = new ZoomManager({
            element: document.getElementById('table'),
            smooth: false,
            zoomControls: {
                color: 'white',
            },
            localStorageZoomKey: LOCAL_STORAGE_ZOOM_KEY,
        });

        new HelpManager(this, { 
            buttons: [
                new BgaHelpPopinButton({
                    title: _("Card abilities").toUpperCase(),
                    html: this.getHelpHtml(),
                    buttonBackground: '#692c91', // ability color
                }),
            ]
        });
        this.setupNotifications();
        this.setupPreferences();

        log( "Ending game setup" );
    }

    ///////////////////////////////////////////////////
    //// Game & client states

    // onEnteringState: this method is called each time we are entering into a new game state.
    //                  You can use this method to perform some user interface changes at this moment.
    //
    public onEnteringState(stateName: string, args: any) {
        log('Entering state: ' + stateName, args.args);

        switch (stateName) {
            case 'usePrivilege':
                this.onEnteringUsePrivilege(args.args);
                break;
            case 'playAction':
                this.onEnteringPlayAction(args.args);
                break;
            case 'reserveCard':
                this.onEnteringReserveCard();
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
            case 'takeRoyalCard':
                this.onEnteringTakeRoyalCard();
                break;
            case 'discardTokens':
                this.onEnteringDiscardTokens();
                break;
        }
    }
    
    private setGamestateDescription(property: string = '') {
        const originalState = this.gamedatas.gamestates[this.gamedatas.gamestate.id];
        //this.gamedatas.gamestate.description = `${originalState['description' + property]}`; 
        this.gamedatas.gamestate.descriptionmyturn = `${originalState['descriptionmyturn' + property]}`;
        (this as any).updatePageTitle();
    }

    private onEnteringUsePrivilege(args: EnteringUsePrivilegeArgs) {
        if ((this as any).isCurrentPlayerActive()) {
            this.tableCenter.setBoardSelectable('privileges', false, args.privileges);
        }
    }

    private setNotice(args: EnteringPlayActionArgs) {
        const noticeDiv = document.getElementById('notice');
        const showNotice = args.canRefill || args.privileges > 0;
        if (showNotice) {
            let notice = ``;
            const refillButton = args.canRefill ? `<button type="button" id="replenish_button" class="bgabutton bgabutton_blue">${_("Replenish the board")}</button>` : null;
            const usePrivilegeButton = args.privileges ? `<button type="button" id="usePrivilege_button" class="bgabutton bgabutton_blue">${_("Use up to ${number} privilege(s) to take gem(s)").replace('${number}', args.privileges)}</button>` : null;
            if (args.canRefill) {
                if (args.mustRefill) {
                    notice = _('Before you can take your mandatory action, you <strong>must</strong> ${replenish_button} !').replace('${replenish_button}', refillButton);
                } else {
                    if (args.privileges) {
                        notice = _('<strong>Before</strong> taking your mandatory action, you can ${use_privilege_button} <strong>then</strong> ${replenish_button}').replace('${use_privilege_button}', usePrivilegeButton).replace('${replenish_button}', refillButton);
                    } else {
                        notice = _('<strong>Before</strong> taking your mandatory action, you can ${replenish_button}').replace('${replenish_button}', refillButton);
                    }
                }
            } else if (args.privileges) {
                notice = _('<strong>Before</strong> taking your mandatory action, you can ${use_privilege_button}').replace('${use_privilege_button}', usePrivilegeButton);
            }

            noticeDiv.innerHTML = notice;

            document.getElementById('replenish_button')?.addEventListener('click', () => this.confirmActionGivingPrivilege(() => this.refillBoard()));
            document.getElementById('usePrivilege_button')?.addEventListener('click', () => this.usePrivilege());
        }
        noticeDiv.classList.toggle('visible', showNotice);
    }

    private confirmActionGivingPrivilege(finalAction: Function) {
        if ((this as any).prefs[201].value != 2) {
            const confirmationMessage = `${_("This action will give a privilege to your opponent.")}
            <br><br>
            <i>${_("You can disable this warning in the user preferences (top right menu).")}</i>`;
            (this as any).confirmationDialog(confirmationMessage, finalAction);
        } else {
            finalAction();
        }
    }

    private onEnteringPlayAction(args: EnteringPlayActionArgs) {

        if (!args.canTakeTokens) {
            this.setGamestateDescription('OnlyBuy');
        } else if (!args.canBuyCard) {
            this.setGamestateDescription('OnlyTokens');
        }

        if ((this as any).isCurrentPlayerActive()) {
            this.setNotice(args);

            if (args.canTakeTokens) {
                this.tableCenter.setBoardSelectable('play', args.canReserve, 3);
            }
            this.tableCenter.setCardsSelectable(true, args.canBuyCard ? args.buyableCards : []);
            if (args.canBuyCard) {
                this.getCurrentPlayerTable().setHandSelectable(true, args.buyableCards);
            }
        }
    }

    private onEnteringReserveCard() {
        if ((this as any).isCurrentPlayerActive()) {
            this.tableCenter.setCardsSelectable(true, [], true);
        }
    }

    private onEnteringPlaceJoker(args: EnteringPlaceJokerArgs) {
        if ((this as any).isCurrentPlayerActive()) {
            this.getCurrentPlayerTable().setColumnsSelectable(args.colors);
        }
    }

    private onEnteringTakeBoardToken(args: EnteringTakeBoardTokenArgs) {
        if ((this as any).isCurrentPlayerActive()) {
            this.tableCenter.setBoardSelectable('effect', false, 1, args.color);
        }
    }

    private onEnteringTakeOpponentToken(args: EnteringTakeOpponentTokenArgs) {
        if ((this as any).isCurrentPlayerActive()) {
            this.getPlayerTable(args.opponentId).setTokensSelectable(true, false);
        }
    }

    private onEnteringTakeRoyalCard() {
        if ((this as any).isCurrentPlayerActive()) {
            this.tableCenter.setRoyalCardsSelectable(true);
        }
    }

    private onEnteringDiscardTokens() {
        if ((this as any).isCurrentPlayerActive()) {
            this.getCurrentPlayerTable().setTokensSelectable(true, true);
        }
    }

    public onLeavingState(stateName: string) {
        log( 'Leaving state: '+stateName );

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
            case 'takeRoyalCard':
                this.onLeavingTakeRoyalCard();
                break;
            case 'discardTokens':
                this.onLeavingDiscardTokens();
                break;
        }
    }

    private onLeavingPlayAction() {
        this.tableCenter.setBoardSelectable(null);
        this.tableCenter.setCardsSelectable(false);
        const currentPlayerTable = this.getCurrentPlayerTable();
        if (currentPlayerTable) {
            currentPlayerTable.setHandSelectable(false);
            currentPlayerTable.setTokensSelectableByType([], []);
        }

        const noticeDiv = document.getElementById('notice');
        noticeDiv.innerHTML = ``;
        noticeDiv.classList.remove('visible');
    }

    private onLeavingReserveCard() {
        this.tableCenter.setCardsSelectable(false);
    }

    private onLeavingPlaceJoker() {
        this.getCurrentPlayerTable()?.setColumnsSelectable([]);
    }

    private onLeavingTakeOpponentToken() {
        this.playersTables.forEach(playerTable => playerTable.setTokensSelectable(false, true));
    }

    private onLeavingTakeRoyalCard() {
        this.tableCenter.setRoyalCardsSelectable(false);
        this.getCurrentPlayerTable()?.setHandSelectable(false);
    }

    private onLeavingDiscardTokens() {
        this.getCurrentPlayerTable()?.setTokensSelectable(false, true);
    }

    private takeSelectedTokensWithWarning() {
        const showWarning = this.tokensSelection.filter(token => token.type == 2 && token.color == 0).length >= 2
            || (this.tokensSelection.length == 3 && this.tokensSelection[0].color == this.tokensSelection[1].color && this.tokensSelection[0].color == this.tokensSelection[2].color);
        if (showWarning) {
            this.confirmActionGivingPrivilege(() => this.takeSelectedTokens());
        } else {
            this.takeSelectedTokens();
        }
    }

    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    public onUpdateActionButtons(stateName: string, args: any) {
        
        if ((this as any).isCurrentPlayerActive()) {
            switch (stateName) {
                case 'usePrivilege':
                    (this as any).addActionButton(`takeSelectedTokens_button`, _("Take selected token(s)"), () => this.takeSelectedTokens());
                    document.getElementById(`takeSelectedTokens_button`).classList.add('disabled');
                    (this as any).addActionButton(`cancelUsePrivilege_button`, _("Cancel"), () => this.cancelUsePrivilege(), null, null, 'gray');
                    break;
                case 'playAction':
                    (this as any).addActionButton(`takeSelectedTokens_button`, _("Take selected token(s)"), () => this.takeSelectedTokensWithWarning());
                    document.getElementById(`takeSelectedTokens_button`).classList.add('disabled');
                    break;
                case 'takeBoardToken':
                    (this as any).addActionButton(`takeSelectedTokens_button`, _("Take selected token(s)"), () => this.takeSelectedTokens());
                    document.getElementById(`takeSelectedTokens_button`).classList.add('disabled');
                    break;
                case 'takeOpponentToken':
                    (this as any).addActionButton(`takeSelectedTokens_button`, _("Take selected token"), () => this.takeOpponentToken(this.tokensSelection[0].id));
                    document.getElementById(`takeSelectedTokens_button`).classList.add('disabled');
                    break;
                case 'discardTokens':
                    (this as any).addActionButton(`discardSelectedTokens_button`, _("Discard selected token(s)"), () => this.discardSelectedTokens());
                    document.getElementById(`discardSelectedTokens_button`).classList.add('disabled');
                    break;
                    
            }
        }
    }

    ///////////////////////////////////////////////////
    //// Utility methods


    ///////////////////////////////////////////////////

    public setTooltip(id: string, html: string) {
        (this as any).addTooltipHtml(id, html, this.TOOLTIP_DELAY);
    }
    public setTooltipToClass(className: string, html: string) {
        (this as any).addTooltipHtmlToClass(className, html, this.TOOLTIP_DELAY);
    }

    public getPlayerId(): number {
        return Number((this as any).player_id);
    }

    public getPlayer(playerId: number): SplendorDuelPlayer {
        return Object.values(this.gamedatas.players).find(player => Number(player.id) == playerId);
    }

    private getPlayerTable(playerId: number): PlayerTable {
        return this.playersTables.find(playerTable => playerTable.playerId === playerId);
    }

    public getCurrentPlayerTable(): PlayerTable | null {
        return this.playersTables.find(playerTable => playerTable.playerId === this.getPlayerId());
    }

    public getGameStateName(): string {
        return this.gamedatas.gamestate.name;
    }

    private setupPreferences() {
        // Extract the ID and value from the UI control
        const onchange = (e) => {
          var match = e.target.id.match(/^preference_[cf]ontrol_(\d+)$/);
          if (!match) {
            return;
          }
          var prefId = +match[1];
          var prefValue = +e.target.value;
          (this as any).prefs[prefId].value = prefValue;
        }
        
        // Call onPreferenceChange() when any value changes
        dojo.query(".preference_control").connect("onchange", onchange);
        
        // Call onPreferenceChange() now
        dojo.forEach(
          dojo.query("#ingame_menu_content .preference_control"),
          el => onchange({ target: el })
        );
    }

    private getOrderedPlayers(gamedatas: SplendorDuelGamedatas) {
        const players = Object.values(gamedatas.players).sort((a, b) => a.playerNo - b.playerNo);
        const playerIndex = players.findIndex(player => Number(player.id) === Number((this as any).player_id));
        const orderedPlayers = playerIndex > 0 ? [...players.slice(playerIndex), ...players.slice(0, playerIndex)] : players;
        return orderedPlayers;
    }

    public getPlayersTokens(): Token[] {
        return this.playersTables.map(table => table.getTokens()).flat();
    }

    private createPlayerPanels(gamedatas: SplendorDuelGamedatas) {

        Object.values(gamedatas.players).forEach(player => {
            const playerId = Number(player.id);

            let html = `
            <div class="score-tile-playerboard-wrapper">
                <div class="score-tile-playerboard">
                    <div id="end-reason-1-wrapper-${player.id}" class="points-counter">
                        <div id="points-counter-${player.id}"></div>
                        <div class="goal">/&nbsp;20</div>
                    </div>
    
                    <div id="end-reason-2-wrapper-${player.id}" class="crown-counter">
                        <div id="crown-counter-${player.id}"></div>
                        <div class="goal">/&nbsp;10</div>
                    </div>
    
                    <div id="end-reason-3-wrapper-${player.id}" class="strongest-column-counter">
                        <div id="strongest-column-counter-${player.id}"></div>
                        <div class="goal">/&nbsp;10</div>
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
                    <span id="token-counter-${player.id}"></span><span class="goal">&nbsp;/&nbsp;10</span>
                </div>
            </div>`;

            html += `
            <div class="spl_miniplayerboard">
                <div class="spl_ressources_container">`;

                [1, 2, 3, 4, 5].forEach(color => {
                html += `            
                    <div id="player-${playerId}-counters-card-points-${color}" class="card-points points icon"></div>`;
                });

            html += `<div></div>
            </div>
            <div class="spl_ressources_container">`;

            for (let color = 1; color <= 5; color++) {
            html += `            
                <div class="spl_ressources">
                    <div class="spl_minigem" data-color="${color}"></div>
                    <div id="player-${playerId}-counters-card-${color}" class="spl_cardcount" data-color="${color}">
                    </div>
                    <div id="player-${playerId}-counters-token-${color}" class="spl_coinpile" data-type="2" data-color="${color}">
                    </div>
                </div>`;
            }

            html += `
                    <div class="spl_ressources">
                        <div id="player-${playerId}-counters-token--1" class="spl_coinpile" data-type="1"></div>
                        <div id="player-${playerId}-counters-token-0" class="spl_coinpile" data-type="2" data-color="0"></div>
                    </div>
                </div>
            </div>
            `;

            dojo.place(html, `player_board_${player.id}`);

            const points = [1,2,3,4,5,9].map(color => {
                // we ignore multicolor in gray column as they will move to another column
                return player.cards.filter(card => card.location === `player${playerId}-${color}` && (color !== 9 || !card.power.includes(2))).map(card => card.points).reduce((a, b) => a + b, 0);
            }).reduce((a, b) => a + b, 0) 
                + player.royalCards.map(card => card.points).reduce((a, b) => a + b, 0);
            this.pointsCounters[playerId] = new ebg.counter();
            this.pointsCounters[playerId].create(`points-counter-${playerId}`);
            this.pointsCounters[playerId].setValue(points);

            this.crownCounters[playerId] = new ebg.counter();
            this.crownCounters[playerId].create(`crown-counter-${playerId}`);
            this.crownCounters[playerId].setValue(player.cards.map(card => card.crowns).reduce((a, b) => a + b, 0));

            let strongestColumnValue = 0;
            [1,2,3,4,5].forEach(color => {
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

            this.tokenCounters[playerId] = new ebg.counter();
            this.tokenCounters[playerId].create(`token-counter-${playerId}`);
            this.tokenCounters[playerId].setValue(player.tokens.length);

            [1,2,3,4,5].forEach(color => {
                // we ignore multicolor in gray column as they will move to another column
                const colorPoints = player.cards.filter(card => card.location === `player${playerId}-${color}` && (color !== 9 || !card.power.includes(2))).map(card => card.points).reduce((a, b) => a + b, 0);
                this.setCardPointsCounter(playerId, color, colorPoints);
            });
            
            [1,2,3,4,5].forEach(color => {
                const produce = player.cards.filter(card => card.location === `player${playerId}-${color}`).map(card => Object.values(card.provides).reduce((a, b) => a + b, 0)).reduce((a, b) => a + b, 0);
                this.setCardProduceCounter(playerId, color, produce);
            });
            [-1, 0, 1,2,3,4,5].forEach(color => {
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
    
    private setEndReasons(playerId: number, endReasons: number[]) {
        endReasons.forEach(endReason => document.getElementById(`end-reason-${endReason}-wrapper-${playerId}`).classList.add('end-reason'));
    }
    
    private setCardPointsCounter(playerId: number, color: number, points: number) {
        const counterDiv = document.getElementById(`player-${playerId}-counters-card-points-${color}`);
        counterDiv.innerHTML = `${points}`;
        counterDiv.classList.toggle('hidden', points < 1);
    }
    
    private incCardPointsCounter(playerId: number, color: number, inc: number) {
        const counterDiv = document.getElementById(`player-${playerId}-counters-card-points-${color}`);
        this.setCardPointsCounter(playerId, color, Number(counterDiv.innerHTML) + inc);
    }
    
    private setCardProduceCounter(playerId: number, color: number, produce: number) {
        const counterDiv = document.getElementById(`player-${playerId}-counters-card-${color}`);
        counterDiv.innerHTML = `${produce ? produce : ''}`;
        counterDiv.classList.toggle('empty', !produce);
    }
    
    private incCardProduceCounter(playerId: number, color: number, inc: number) {
        const counterDiv = document.getElementById(`player-${playerId}-counters-card-${color}`);
        this.setCardProduceCounter(playerId, color, Number(counterDiv.innerHTML) + inc);
    }
    
    private setTokenCounter(playerId: number, color: number, count: number) {
        const counterDiv = document.getElementById(`player-${playerId}-counters-token-${color}`);
        counterDiv.innerHTML = `${count}`;
        counterDiv.classList.toggle('empty', !count);
    }
    
    private updateTokenCounters(playerId: number) {
        const playerTokens = this.getPlayerTable(playerId).getTokens();
        [-1, 0, 1,2,3,4,5].forEach(color => {
            const tokens = playerTokens.filter(token => color == -1 ? token.type == 1 : token.type == 2 && token.color == color);
            this.setTokenCounter(playerId, color, tokens.length);
        });
        this.tokenCounters[playerId].toValue(playerTokens.length);
    }

    private createPlayerTables(gamedatas: SplendorDuelGamedatas) {
        const orderedPlayers = this.getOrderedPlayers(gamedatas);

        orderedPlayers.forEach(player => 
            this.createPlayerTable(gamedatas, Number(player.id))
        );
    }

    private createPlayerTable(gamedatas: SplendorDuelGamedatas, playerId: number) {
        const table = new PlayerTable(this, gamedatas.players[playerId]);
        this.playersTables.push(table);
    }

    private setScore(playerId: number, inc: number) {
        (this as any).scoreCtrl[playerId]?.incValue(inc);
    }

    private incScore(playerId: number, inc: number) {
        this.pointsCounters[playerId].incValue(inc);
    }

    private getHelpHtml() {
        let html = [1, 2, 3, 4, 5].map((power) => `
            <div class="help-section">
                <div class="ability-icon" data-ability="${power}"></div>
                <div class="help-label">${this.getPower(power)}</div>
            </div>`).join('');

        return html;
    }
    
    public onTableTokenSelectionChange(tokens: Token[], valid: boolean): void {
        this.tokensSelection = tokens;

        const button = document.getElementById('takeSelectedTokens_button');
        if (button) {
            button.classList.toggle('disabled', !valid);
            const gold = tokens.length && tokens.every(token => token.type == 1);
            button.innerHTML = gold ? _("Take gold token to reserve a card") : _("Take selected token(s)");
        }
    }

    public onPlayerTokenSelectionChange(tokens: Token[]): void {
        this.tokensSelection = tokens;

        if (this.gamedatas.gamestate.name == 'discardTokens') {
            document.getElementById('discardSelectedTokens_button')?.classList.toggle('disabled', this.tokensSelection.length != this.gamedatas.gamestate.args.number);
        } else if (this.gamedatas.gamestate.name == 'takeOpponentToken') {
            document.getElementById('takeSelectedTokens_button')?.classList.toggle('disabled', this.tokensSelection.length != 1);
        } else if (this.gamedatas.gamestate.name == 'playAction') {
            if (this.selectedCard) {
                this.setChooseTokenCostButtonLabelAndState();
            }
        }
    }

    public onTableCardClick(card: Card): void {
        if (this.gamedatas.gamestate.name == 'reserveCard') {
            this.reserveCard(card.id);
        } else if (this.gamedatas.gamestate.name == 'playAction') {
            if (card == this.selectedCard) {
                this.cancelChooseTokenCost();
            } else {
                if (this.selectedCard) {
                    this.cancelChooseTokenCost();
                }
                this.onBuyCardClick(card);
            }
        }
    }

    public onBuyCardClick(card: Card): void {

        const goldTokens = this.getCurrentPlayerTable().tokens[-1].getCards();
        const reductedCost = structuredClone((this.gamedatas.gamestate.args as EnteringPlayActionArgs).reducedCosts[card.id]);
        if (!reductedCost) {
            return;
        }

        this.selectedCard = card;
        let selectedTokens: Token[] = [];
        let remaining = 0;
        let remainingOfColors = 0;
        Object.entries(reductedCost).forEach(entry => {
            const color = Number(entry[0]);
            const number = entry[1] as number;
            const tokensOfColor = this.getCurrentPlayerTable().tokens[color].getCards();
            selectedTokens.push(...tokensOfColor.slice(0, Math.min(number, tokensOfColor.length)));
            if (number > tokensOfColor.length) {
                remaining += number - tokensOfColor.length;
            } else if (tokensOfColor.length > number) { 
                remainingOfColors += tokensOfColor.length - number;
            }
        });
        if (remaining > 0) {
            selectedTokens.push(...goldTokens.slice(0, remaining));
        }

        // can use more gold to pay
        if (goldTokens.length > remaining) {
            this.tokensSelection = [];
        } else {
            this.tokensSelection = selectedTokens;
        }
        const allowedTypes = Object.keys(reductedCost).map(type => Number(type));
        if (!allowedTypes.includes(-1)) {
            allowedTypes.push(-1);
        }
        this.selectedCardReducedCost = reductedCost;
        this.setActionBarChooseTokenCost();
        this.getCurrentPlayerTable().setTokensSelectableByType(allowedTypes, this.tokensSelection);
    }

    private setChooseTokenCostButtonLabelAndState() {
        const button = document.getElementById(`chooseTokenCost-button`);
        if (button) {
            const selection = this.getCurrentPlayerTable().getSelectedTokens();
            const label = selection.length ? 
                _('Pay ${cost}').replace('${cost}',
                    `<div class="compressed-token-icons">${
                        selection.map(token => `<div class="token-icon" data-type="${token.type == 1 ? -1 : token.color}"></div>`).join('')
                    }</div>`
                ) : 
                _('Take for free');

            button.innerHTML = label;
            let valid = selection.length == Object.values(this.selectedCardReducedCost).reduce((a, b) => a + b, 0); // TODO more controls
            button.classList.toggle('disabled', !valid);
        }
    }

    private setActionBarChooseTokenCost() {
        const question = _("You must select the tokens to pay ${cost}").replace('${cost}', 
            `<div class="compressed-token-icons">${
                Object.entries(this.selectedCardReducedCost).map(([color, number]) => new Array(number).fill(0).map(() => `<div class="token-icon" data-type="${color}"></div>`).join('')).join('')
            }</div>`
        );
        this.setChooseActionGamestateDescription(question);

        document.getElementById(`generalactions`).innerHTML = '';
        (this as any).addActionButton(`chooseTokenCost-button`, ``, () => this.buyCard());
        this.setChooseTokenCostButtonLabelAndState();
        (this as any).addActionButton(`cancelChooseTokenCost-button`, _("Cancel"), () => this.cancelChooseTokenCost(), null, null, 'gray');
    }
    
    private setChooseActionGamestateDescription(newText?: string) {
        if (!this.originalTextChooseAction) {
            this.originalTextChooseAction = document.getElementById('pagemaintitletext').innerHTML;
        }

        document.getElementById('pagemaintitletext').innerHTML = newText ?? this.originalTextChooseAction;
    }

    public cancelChooseTokenCost() {
        const table = this.getCurrentPlayerTable();

        if (this.selectedCard) {
            this.tableCenter.unselectTableCard(this.selectedCard);
            table.reserved.unselectCard(this.selectedCard);
        }
        this.setActionBarChooseAction(true);
        this.selectedCard = null;
        this.tokensSelection = null;

        document.getElementById(`chooseTokenCost-button`)?.remove();
        document.getElementById(`cancelChooseTokenCost-button`)?.remove();


        table.setTokensSelectableByType([], []);
    }
    
    private setActionBarChooseAction(fromCancel: boolean) {
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

    public onRoyalCardClick(card: RoyalCard): void {
        this.takeRoyalCard(card.id);
    }

    public onReservedCardClick(card: Card): void {
        this.onTableCardClick(card);
    }

    public onColumnClick(color: number): void {
        if (this.gamedatas.gamestate.name == 'placeJoker') {
            this.placeJoker(color);
        }
    }
  	
    public takeSelectedTokens() {
        if(!(this as any).checkAction('takeTokens')) {
            return;
        }

        const tokensIds = this.tokensSelection.map(token => token.id).sort((a, b) => a - b);

        this.takeAction('takeTokens', {
            ids: tokensIds.join(','), 
        });
    }
  	
    public discardSelectedTokens() {
        if(!(this as any).checkAction('discardTokens')) {
            return;
        }

        const tokensIds = this.tokensSelection.map(token => token.id).sort((a, b) => a - b);

        this.takeAction('discardTokens', {
            ids: tokensIds.join(','), 
        });
    }
  	
    public cancelUsePrivilege() {
        if(!(this as any).checkAction('cancelUsePrivilege')) {
            return;
        }

        this.takeAction('cancelUsePrivilege');
    }

    public refillBoard() {
        if(!(this as any).checkAction('refillBoard')) {
            return;
        }

        this.takeAction('refillBoard');
    }

    public usePrivilege() {
        if(!(this as any).checkAction('usePrivilege')) {
            return;
        }

        this.takeAction('usePrivilege');
    }
  	
    public reserveCard(id: number) {
        if(!(this as any).checkAction('reserveCard')) {
            return;
        }

        this.takeAction('reserveCard', {
            id
        });
    }
  	
    public buyCard() {
        if(!(this as any).checkAction('buyCard')) {
            return;
        }

        const tokensIds = this.tokensSelection.map(token => token.id).sort((a, b) => a - b);

        this.takeAction('buyCard', {
            id: this.selectedCard.id,
            tokensIds: tokensIds.join(','), 
        });
    }
  	
    public takeRoyalCard(id: number) {
        if(!(this as any).checkAction('takeRoyalCard')) {
            return;
        }

        this.takeAction('takeRoyalCard', {
            id
        });
    }
  	
    public takeOpponentToken(id: number) {
        if(!(this as any).checkAction('takeOpponentToken')) {
            return;
        }

        this.takeAction('takeOpponentToken', {
            id
        });
    }
  	
    public placeJoker(color: number) {
        if(!(this as any).checkAction('placeJoker')) {
            return;
        }

        this.takeAction('placeJoker', {
            color
        });
    }

    public takeAction(action: string, data?: any) {
        data = data || {};
        data.lock = true;
        (this as any).ajaxcall(`/splendorduel/splendorduel/${action}.html`, data, this, () => {});
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
            ['takeRoyalCard', undefined],
            ['discardTokens', undefined],
            ['newTableCard', undefined],
            ['win', ANIMATION_MS * 3],
            ['loadBug', 1],
        ];
    
        notifs.forEach((notif) => {
            dojo.subscribe(notif[0], this, (notifDetails: Notif<any>) => {
                log(`notif_${notif[0]}`, notifDetails.args);

                const promise = this[`notif_${notif[0]}`](notifDetails.args);

                // tell the UI notification ends, if the function returned a promise
                promise?.then(() => (this as any).notifqueue.onSynchronousNotificationEnd());
            });
            (this as any).notifqueue.setSynchronous(notif[0], notif[1]);
        });

        if (isDebug) {
            notifs.forEach((notif) => {
                if (!this[`notif_${notif[0]}`]) {
                    console.warn(`notif_${notif[0]} function is not declared, but listed in setupNotifications`);
                }
            });

            Object.getOwnPropertyNames(SplendorDuel.prototype).filter(item => item.startsWith('notif_')).map(item => item.slice(6)).forEach(item => {
                if (!notifs.some(notif => notif[0] == item)) {
                    console.warn(`notif_${item} function is declared, but not listed in setupNotifications`);
                }
            });
        }
    }

    notif_privileges(args: NotifPrivilegesArgs) {
        Object.entries(args.privileges).forEach(entry => this.privilegeCounters[entry[0]].setValue(entry[1]));

        const fromDiv = document.getElementById(args.from ? `player-privileges-${args.from}` : `table-privileges`);
        const toDiv = document.getElementById(args.to ? `player-privileges-${args.to}` : `table-privileges`);
        const divs = Array.from(fromDiv.querySelectorAll('.privilege-token')).slice(0, args.count);
        divs.forEach(div => this.animationManager.attachWithAnimation(new BgaSlideAnimation({ element: div }), toDiv));
    }

    async notif_refill(args: NotifRefillArgs) {
        await this.tableCenter.refillBoard(args.refilledTokens);
    }

    async notif_takeTokens(args: NotifTakeTokensArgs) {
        const { tokens, playerId } = args;

        await this.getPlayerTable(playerId).addTokens(tokens);

        this.updateTokenCounters(playerId);
    }

    notif_reserveCard(args: NotifReserveCardArgs) {
        this.reservedCounters[args.playerId].incValue(1);
        
        const promise = this.getPlayerTable(args.playerId).addReservedCard(args.card);

        if (args.fromDeck) {
            this.tableCenter.cardsDecks[args.level].setCardNumber(args.cardDeckCount, args.cardDeckTop);
        }

        return promise;
    }

    async notif_buyCard(args: NotifBuyCardArgs) {
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

    notif_takeRoyalCard(args: NotifTakeRoyalCardArgs) {
        const { card, playerId } = args;
        this.incScore(playerId, card.points);
        return this.getPlayerTable(args.playerId).addRoyalCard(card);
    }

    async notif_discardTokens(args: NotifDiscardTokensArgs) {
        const { tokens, playerId } = args;
        
        await this.tableCenter.removeTokens(tokens);

        this.updateTokenCounters(playerId);
    }

    notif_newTableCard(args: NotifNewTableCardArgs) {
        return this.tableCenter.replaceCard(args);
    }

    notif_win(args: NotifWinArgs) {
        this.setScore(args.playerId, 1);
        this.setEndReasons(args.playerId, args.endReasons);
    }
    
    /**
    * Load production bug report handler
    */
   notif_loadBug(args) {
     const that: any = this;
     function fetchNextUrl() {
       var url = args.urls.shift();
       console.log('Fetching URL', url, '...');
       // all the calls have to be made with ajaxcall in order to add the csrf token, otherwise you'll get "Invalid session information for this action. Please try reloading the page or logging in again"
       that.ajaxcall(
         url,
         {
           lock: true,
         },
         that,
         function (success) {
           console.log('=> Success ', success);

           if (args.urls.length > 1) {
             fetchNextUrl();
           } else if (args.urls.length > 0) {
             //except the last one, clearing php cache
             url = args.urls.shift();
             (dojo as any).xhrGet({
               url: url,
               headers: {
                 'X-Request-Token': bgaConfig.requestToken,
               },
               load: success => {
                 console.log('Success for URL', url, success);
                 console.log('Done, reloading page');
                 window.location.reload();
               },
               handleAs: 'text',
               error: error => console.log('Error while loading : ', error),
             });
           }
         },
         error => {
           if (error) console.log('=> Error ', error);
         },
       );
     }
     console.log('Notif: load bug', args);
     fetchNextUrl();
   }

    public getColor(color: number): string {
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

    public getPower(power: number): string {
        switch (power) {
            case 1: return _("Take another turn immediately after this one ends.");
            case 2: return _("Place this card so that it overlaps a Jewel card with a bonus (see on the right). Treat this card’s <ICON_MULTI> bonus as though it were the same color of the card it is overlapping.").replace('<ICON_MULTI>', `<div class="token-icon" data-type="9"></div>`) +
                `<br><i>${_("If you do not have a card with a bonus, you cannot purchase this card.")}</i>`;
            case 3: return _("Take 1 token matching the color of this card from the board. If there are no such tokens left, ignore this effect.");
            case 4: return _("Take 1 Privilege. If none are available, take 1 from your opponent.");
            case 5: return _("Take 1 Gem or Pearl token from your opponent. If your opponent has no such tokens, ignore this effect. You cannot take a Gold token from your opponent.");
        }
    }

    private CARD_REGEX = /<card>(.*)<\/card>/;
    private cardLogId = 0;
    /* This enable to inject translatable styled things to logs or action bar */
    /* @Override */
    public format_string_recursive(log: string, args: any) {
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

                    log = log.replace(cardRegex, (_, innerText) => 
                    `<span id="card-log-${cardLogId}" class="card-log-int">${innerText}</span>`
                    );

                    const cardForLog = this.cardsManager.createCardElement({ ...args['card'], id: `card-for-log-${cardLogId}` } );

                    setTimeout(() => (this as any).addTooltipHtml(`card-log-${cardLogId}`, cardForLog.outerHTML, 500));
                }
            }
        } catch (e) {
            console.error(log,args,"Exception thrown", e.stack);
        }
        return (this as any).inherited(arguments);
    }
}