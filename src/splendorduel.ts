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
                tablesAndCenter.classList.toggle('double-column', clientWidth > 1730);
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
        const showNotice = args.canRefill;
        if (showNotice) {
            let refillButton = null;
            let notice = ``;
            if (args.canRefill) {
                refillButton = `<button type="button" id="replenish_button" class="bgabutton bgabutton_blue">${_("Replenish the board")}</button>`;
                if (args.mustRefill) {
                    notice = _('Before you can take your mandatory action, you <strong>must</strong> ${replenish_button} !').replace('${replenish_button}', refillButton);
                } else {
                    notice = _('<strong>Before</strong> taking your mandatory action, you can ${replenish_button}').replace('${replenish_button}', refillButton);
                }
            }

            noticeDiv.innerHTML = notice;

            if (refillButton) {
                document.getElementById('replenish_button').addEventListener('click', () => this.refillBoard());
            }
        }
        noticeDiv.classList.toggle('visible', showNotice);
    }

    private onEnteringPlayAction(args: EnteringPlayActionArgs) {
        this.setNotice(args);

        if (!args.canTakeTokens) {
            this.setGamestateDescription('OnlyBuy');
        } else if (!args.canBuyCard) {
            this.setGamestateDescription('OnlyTokens');
        }

        if ((this as any).isCurrentPlayerActive()) {
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
        this.tableCenter.setCardsSelectable(true, [], true);
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
        this.tableCenter.setRoyalCardsSelectable(true);
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
        this.getCurrentPlayerTable()?.setHandSelectable(false);

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

    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    public onUpdateActionButtons(stateName: string, args: any) {
        
        if ((this as any).isCurrentPlayerActive()) {
            switch (stateName) {
                case 'usePrivilege':
                    const usePrivilegeArgs = args as EnteringUsePrivilegeArgs;
                    (this as any).addActionButton(`takeSelectedTokens_button`, _("Take selected token(s)"), () => this.takeSelectedTokens());
                    document.getElementById(`takeSelectedTokens_button`).classList.add('disabled');
                    (this as any).addActionButton(`skip_button`, _("Skip"), () => this.skip());
                    break;
                case 'playAction':
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

    private createPlayerPanels(gamedatas: SplendorDuelGamedatas) {

        Object.values(gamedatas.players).forEach(player => {
            const playerId = Number(player.id);

            let html = `<div class="counters">
                <div id="privilege-counter-wrapper-${player.id}" class="privilege-counter">
                    <div class="privilege icon"></div>
                    <span id="privilege-counter-${player.id}"></span>
                </div>

                <div id="crown-counter-wrapper-${player.id}" class="crown-counter">
                    <div class="crown icon"></div>
                    <span id="crown-counter-${player.id}"></span>
                </div>

                <div id="strongest-column-counter-wrapper-${player.id}" class="strongest-column-counter">
                    <div class="card-column icon"></div> 
                    <span id="strongest-column-counter-${player.id}"></span>
                </div>

                <div id="reserved-counter-wrapper-${player.id}" class="reserved-counter">
                    <div class="player-hand-card"></div> 
                    <span id="reserved-counter-${player.id}"></span>
                </div>
            </div>`;

            html += `
            <div class="spl_miniplayerboard">
                <div class="spl_ressources_container">`;

            for (let color = 1; color <= 5; color++) {
            html += `            
                <div class="spl_ressources">
                    <div class="spl_minigem" data-color="${color}"></div>
                    <div id="player-${playerId}-counters-card-${color}" class="spl_cardcount spl_coloreditem spl_depleted" data-color="${color}">
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
            

            html += `
            <div id="token-counter-wrapper-${player.id}" class="token-counter">
                (${_('Tokens:')} <span id="token-counter-${player.id}"></span> / 10)
            </div>`;

            dojo.place(html, `player_board_${player.id}`);

            this.crownCounters[playerId] = new ebg.counter();
            this.crownCounters[playerId].create(`crown-counter-${playerId}`);
            this.crownCounters[playerId].setValue(player.cards.map(card => card.crowns).reduce((a, b) => a + b, 0));

            let strongestColumnValue = 0;
            [1,2,3,4,5,9].forEach(color => {
                // we ignore multicolor in gray column as they will move to another column
                const colorPoints = player.cards.filter(card => card.location === `player${playerId}-${color}` && (color !== 9 || !card.power.includes(2))).map(card => card.points).reduce((a, b) => a + b, 0);
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
                const produce = player.cards.filter(card => card.location === `player${playerId}-${color}`).map(card => Object.values(card.provides).reduce((a, b) => a + b, 0)).reduce((a, b) => a + b, 0);
                this.setCardProduceCounter(playerId, color, produce);
            });
            [-1, 0, 1,2,3,4,5].forEach(color => {
                const tokens = player.tokens.filter(token => color == -1 ? token.type == 1 : token.type == 2 && token.color == color);
                this.setTokenCounter(playerId, color, tokens.length);
            });
        });

        this.setTooltipToClass('crown-counter', _('Crowns'));
        this.setTooltipToClass('strongest-column-counter', _('Points of the strongest column'));
        this.setTooltipToClass('privilege-counter', _('Privilege scrolls'));
        this.setTooltipToClass('reserved-counter', _('Reserved cards'));
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

    private incScore(playerId: number, inc: number) {
        (this as any).scoreCtrl[playerId]?.incValue(inc);
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
    
    public onTableTokenSelectionChange(tokens: Token[], valid: boolean): void {
        this.tokensSelection = tokens;

        document.getElementById('takeSelectedTokens_button')?.classList.toggle('disabled', !valid);
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
            if (card != this.selectedCard) {
                if (this.selectedCard) {
                    this.cancelChooseTokenCost();
                }
                this.onBuyCardClick(card);
            }
        }
    }

    public onBuyCardClick(card: Card): void {
        this.selectedCard = card;

        const goldTokens = this.getCurrentPlayerTable().tokens[-1].getCards();
        const reductedCost = structuredClone((this.gamedatas.gamestate.args as EnteringPlayActionArgs).reducedCosts[card.id]);
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
        const selection = this.getCurrentPlayerTable().getSelectedTokens();
        const label = selection.length ? 
            _('Pay ${cost}').replace('${cost}',
                `<div class="compressed-token-icons">${
                    selection.map(token => `<div class="token-icon" data-type="${token.type == 1 ? -1 : token.color}"></div>`).join('')
                 }</div>`
            ) : 
            _('Take for free');

        document.getElementById(`chooseTokenCost-button`).innerHTML = label;
        let valid = selection.length == Object.values(this.selectedCardReducedCost).reduce((a, b) => a + b, 0); // TODO more controls
        document.getElementById(`chooseTokenCost-button`).classList.toggle('disabled', !valid);
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
        this.setActionBarChooseAction(true);
        this.selectedCard = null;
        this.tokensSelection = null;

        document.getElementById(`chooseTokenCost-button`)?.remove();
        document.getElementById(`cancelChooseTokenCost-button`)?.remove();
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
        this.onBuyCardClick(card);
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
  	
    public skip() {
        if(!(this as any).checkAction('skip')) {
            return;
        }

        this.takeAction('skip');
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

        if (column !== 9 || !card.power.includes(2)) {
            const playerTable = this.getPlayerTable(playerId);
            this.crownCounters[playerId].toValue(playerTable.getCrowns());
            this.strongestColumnCounters[playerId].toValue(playerTable.getStrongestColumn());
            this.incScore(playerId, card.points);

            if ([1, 2, 3, 4, 5].includes(column)) {
                this.incCardProduceCounter(playerId, column, Object.values(card.provides).reduce((a, b) => a + b, 0));
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
        //this.setScore(args.playerId, 1);
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

    /* This enable to inject translatable styled things to logs or action bar */
    /* @Override */
    public format_string_recursive(log: string, args: any) {
        try {
            if (log && args && !args.processed) {
                
                ['new_tokens', 'spent_tokens', 'discarded_tokens'].forEach(property => {                
                    if (args[property] && (typeof args[property] !== 'string' || args[property][0] !== '<')) {
                        args[property] = args[property].map(token => `<div class="token-icon" data-type="${token.type == 1 ? -1 : token.color}"></div>`).join(' ');
                    }
                });

                for (const property in args) {
                    if (['card_level', 'color_name'].includes(property) && args[property][0] != '<') {
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