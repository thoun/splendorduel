declare const define;
declare const ebg;
declare const $;
declare const dojo: Dojo;
declare const _;
declare const g_gamethemeurl;

const ANIMATION_MS = 500;
const ACTION_TIMER_DURATION = 5;

const LOCAL_STORAGE_ZOOM_KEY = 'SplendorDuel-zoom';
const LOCAL_STORAGE_JUMP_TO_FOLDED_KEY = 'SplendorDuel-jump-to-folded';

const EQUAL = -1;
const DIFFERENT = 0;

const VP = 1;
const BRACELET = 2;
const RECRUIT = 3;
const REPUTATION = 4;
const CARD = 5;


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

    private tokensSelection: Token[];
    
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
                new JumpToEntry(_('Main board'), 'table-center', { 'color': '#224757' })
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
                color: 'black',
            },
            localStorageZoomKey: LOCAL_STORAGE_ZOOM_KEY,
            onDimensionsChange: () => {
                const tablesAndCenter = document.getElementById('tables-and-center');
                const clientWidth = tablesAndCenter.clientWidth;
                tablesAndCenter.classList.toggle('double-column', clientWidth > 1478); // TODO
            },
        });

        new HelpManager(this, { 
            buttons: [
                new BgaHelpPopinButton({
                    title: _("Card help").toUpperCase(),
                    html: this.getHelpHtml(),
                    onPopinCreated: () => this.populateHelp(),
                    buttonBackground: '#5890a9',
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
        }
    }
    
    private setGamestateDescription(property: string = '') {
        const originalState = this.gamedatas.gamestates[this.gamedatas.gamestate.id];
        this.gamedatas.gamestate.description = `${originalState['description' + property]}`; 
        this.gamedatas.gamestate.descriptionmyturn = `${originalState['descriptionmyturn' + property]}`;
        (this as any).updatePageTitle();
    }

    private onEnteringUsePrivilege(args: EnteringUsePrivilegeArgs) {
        if ((this as any).isCurrentPlayerActive()) {
            this.tableCenter.setBoardSelectable('privileges', false, args.privileges);
        }
    }

    private onEnteringPlayAction(args: EnteringPlayActionArgs) {
        if (!args.canTakeTokens) {
            this.setGamestateDescription('OnlyBuy');
        } else if (!args.canBuyCard) {
            this.setGamestateDescription('OnlyTokens');
        }

        if ((this as any).isCurrentPlayerActive()) {
            if (args.canTakeTokens) {
                this.tableCenter.setBoardSelectable('play', args.canReserve, 3);
            }
            if (args.canBuyCard) {
                this.tableCenter.setCardsSelectable(true, args.buyableCards);
                this.getCurrentPlayerTable().setHandSelectable(true, args.buyableCards);
            }
        }
    }

    private onEnteringReserveCard() {
        this.tableCenter.setCardsSelectable(true, [], true);
    }

    public onLeavingState(stateName: string) {
        log( 'Leaving state: '+stateName );

        switch (stateName) {
            case 'usePrivilege':
            case 'playAction':
                this.onLeavingPlayAction();
                break;
        }
    }

    private onLeavingPlayAction() {
        this.tableCenter.setBoardSelectable(null);
        this.tableCenter.setCardsSelectable(false);
        this.getCurrentPlayerTable()?.setHandSelectable(false);
    }

    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    public onUpdateActionButtons(stateName: string, args: any) {
        
        if ((this as any).isCurrentPlayerActive()) {
            switch (stateName) {
                case 'usePrivilege':
                    const usePrivilegeArgs = args as EnteringUsePrivilegeArgs;
                    (this as any).addActionButton(`takeSelectedTokens_button`, _("Take selected tokens"), () => this.takeSelectedTokens());
                    document.getElementById(`takeSelectedTokens_button`).classList.add('disabled');
                    (this as any).addActionButton(`skip_button`, _("Skip"), () => this.skip());
                    if (usePrivilegeArgs.canSkipBoth) {
                        (this as any).addActionButton(`skipBoth_button`, _("Skip & skip replenish"), () => this.skipBoth());
                    }
                    break;
                case 'refillBoard':
                    const refillBoardArgs = args as EnteringRefillBoardArgs;
                    (this as any).addActionButton(`refillBoard_button`, _("Replenish the board"), () => this.refillBoard());                    
                    (this as any).addActionButton(`skip_button`, _("Skip"), () => this.skip());
                    if (refillBoardArgs.mustRefill) {
                        document.getElementById(`skip_button`).classList.add('disabled');
                    }
                    break;
                case 'playAction':
                    (this as any).addActionButton(`takeSelectedTokens_button`, _("Take selected tokens"), () => this.takeSelectedTokens());
                    document.getElementById(`takeSelectedTokens_button`).classList.add('disabled');
                    break;
                case 'discardTokens':
                    (this as any).addActionButton(`discardSelectedTokens_button`, _("Discard selected tokens"), () => this.discardSelectedTokens());
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

    private createPlayerPanels(gamedatas: SplendorDuelGamedatas) {

        Object.values(gamedatas.players).forEach(player => {
            const playerId = Number(player.id);

            let html = `<div class="counters">            
                <div id="privilege-counter-wrapper-${player.id}" class="privilege-counter">
                    <div class="privilege-icon"></div>
                    <span id="privilege-counter-${player.id}"></span>
                </div>

                <div id="reserved-counter-wrapper-${player.id}" class="reserved-counter">
                    <div class="player-hand-card"></div> 
                    <span id="reserved-counter-${player.id}"></span>
                </div>
            </div>`;

            dojo.place(html, `player_board_${player.id}`);

            const reservedCounter = new ebg.counter();
            reservedCounter.create(`reserved-counter-${playerId}`);
            reservedCounter.setValue(player.reservedCount);
            this.reservedCounters[playerId] = reservedCounter;

            this.privilegeCounters[playerId] = new ebg.counter();
            this.privilegeCounters[playerId].create(`privilege-counter-${playerId}`);
            this.privilegeCounters[playerId].setValue(player.privileges);
        });

        this.setTooltipToClass('privilege-counter', _('Privilege scrolls'));
        this.setTooltipToClass('reserved-counter', _('Reserved cards'));
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

    private setScore(playerId: number, score: number) {
        (this as any).scoreCtrl[playerId]?.toValue(score);
    }

    private getHelpHtml() {
        let html = `
        <div id="help-popin">
            <h1>${_("Assets")}</h2>
            <div class="help-section">
                <div class="icon vp"></div>
                <div class="help-label">${_("Gain 1 <strong>Victory Point</strong>. The player moves their token forward 1 space on the Score Track.")}</div>
            </div>
            <div class="help-section">
                <div class="icon recruit"></div>
                <div class="help-label">${_("Gain 1 <strong>Recruit</strong>: The player adds 1 Recruit token to their ship.")} ${_("It is not possible to have more than 3.")} ${_("A recruit allows a player to draw the Viking card of their choice when Recruiting or replaces a Viking card during Exploration.")}</div>
            </div>
            <div class="help-section">
                <div class="icon bracelet"></div>
                <div class="help-label">${_("Gain 1 <strong>Silver Bracelet</strong>: The player adds 1 Silver Bracelet token to their ship.")} ${_("It is not possible to have more than 3.")} ${_("They are used for Trading.")}</div>
            </div>
            <div class="help-section">
                <div class="icon reputation"></div>
                <div class="help-label">${_("Gain 1 <strong>Reputation Point</strong>: The player moves their token forward 1 space on the Reputation Track.")}</div>
            </div>
            <div class="help-section">
                <div class="icon take-card"></div>
                <div class="help-label">${_("Draw <strong>the first Viking card</strong> from the deck: It is placed in the player’s Crew Zone (without taking any assets).")}</div>
            </div>

            <h1>${_("Powers of the artifacts (variant option)")}</h1>
        `;

        for (let i = 1; i <=7; i++) {
            html += `
            <div class="help-section">
                <div id="help-artifact-${i}"></div>
                <div>${/*this.cardsManager.getTooltip(i)*/''}</div>
            </div> `;
        }
        html += `</div>`;

        return html;
    }

    private populateHelp() {
        for (let i = 1; i <=7; i++) {
            //this.cardsManager.setForHelp(i, `help-artifact-${i}`);
        }
    }
    
    public onTokenSelectionChange(tokens: Token[], valid: boolean): void {
        this.tokensSelection = tokens;

        document.getElementById('takeSelectedTokens_button')?.classList.toggle('disabled', !valid);
    }

    public onTableCardClick(card: Card): void {
        if (this.gamedatas.gamestate.name == 'reserveCard') {
            this.reserveCard(card.id);
        } else {
            this.buyCard(card.id);
        }
    }

    public onRoyalCardClick(card: RoyalCard): void {
        this.takeRoyalCard(card.id);
    }

    public onReservedCardClick(card: Card): void {
        /*if (this.gamedatas.gamestate.name == 'discardCard') {
            this.discardCard(card.id);
        } else {
            this.setPayDestinationLabelAndState();
        }*/
    }
  	
    public takeSelectedTokens() {
        if(!(this as any).checkAction('takeTokens')) {
            return;
        }

        this.takeAction('takeTokens', {
            ids: this.tokensSelection.map(token => token.id).join(','), 
        });
    }
  	
    public skip() {
        if(!(this as any).checkAction('skip')) {
            return;
        }

        this.takeAction('skip');
    }
  	
    public skipBoth() {
        if(!(this as any).checkAction('skipBoth')) {
            return;
        }

        this.takeAction('skipBoth');
    }
  	
    public refillBoard() {
        if(!(this as any).checkAction('refillBoard')) {
            return;
        }

        this.takeAction('refillBoard');
    }
  	
    public reserveCard(id: number) {
        if(!(this as any).checkAction('reserveCard')) {
            return;
        }

        this.takeAction('reserveCard', {
            id
        });
    }
  	
    public buyCard(id: number) {
        if(!(this as any).checkAction('buyCard')) {
            return;
        }

        this.takeAction('buyCard', {
            id
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
  	
    public discardSelectedTokens() {
        if(!(this as any).checkAction('discardTokens')) {
            return;
        }

        this.takeAction('discardTokens'); // TODO
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
            ['takeTokens', ANIMATION_MS],
            ['reserveCard', ANIMATION_MS],
            ['buyCard', undefined],
            ['takeRoyalCard', undefined],
            ['win', 1],
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
    }

    notif_refill(args: NotifRefillArgs) {
        return this.tableCenter.refillBoard(args.refilledTokens);
    }

    notif_takeTokens(args: NotifTakeTokensArgs) {
        // TODO
        this.getPlayerTable(args.playerId).tokens.addCards(args.tokens);
    }

    notif_reserveCard(args: NotifReserveCardArgs) {
        this.reservedCounters[args.playerId].incValue(1);

        this.tableCenter.reserveCard(args);
    }

    notif_buyCard(args: NotifBuyCardArgs) {
        this.reservedCounters[args.playerId].incValue(1);
        const promise = this.getPlayerTable(args.playerId).addCard(args.card);

        if (!args.fromReserved) {
            this.tableCenter.replaceCard(args);
        }

        this.getPlayerTable(args.playerId).removeTokens(args.tokens);

        return promise
    }

    notif_takeRoyalCard(args: NotifTakeRoyalCardArgs) {
        return this.getPlayerTable(args.playerId).addRoyalCard(args.card);
    }

    notif_win(args: NotifWinArgs) {
        this.setScore(args.playerId, 1);
    }

    public getColor(color: number): string {
        switch (color) {
            case 0: return _("Pearl")
            case 1: return _("Blue");
            case 2: return _("White");
            case 3: return _("Green");
            case 4: return _("Black");
            case 5: return _("Red");
        }
    }

    /* This enable to inject translatable styled things to logs or action bar */
    /* @Override */
    public format_string_recursive(log: string, args: any) {
        try {
            if (log && args && !args.processed) {
                
                ['new_tokens', 'spent_tokens'].forEach(property => {                
                    if (args[property] && (typeof args[property] !== 'string' || args[property][0] !== '<')) {
                        args[property] = args[property].map(token => `<div class="token-icon" data-type="${token.type == 1 ? -1 : token.color}"></div>`).join(' ');
                    }
                });

                for (const property in args) {
                    if (['card_level'].includes(property) && args[property][0] != '<') {
                        args[property] = `<strong>${_(args[property])}</strong>`;
                    }
                }
            }
        } catch (e) {
            console.error(log,args,"Exception thrown", e.stack);
        }
        return (this as any).inherited(arguments);
    }
}