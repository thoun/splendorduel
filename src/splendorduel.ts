const ANIMATION_MS = 500;
const ACTION_TIMER_DURATION = 5;

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

// @ts-ignore
GameGui = (function () { // this hack required so we fake extend GameGui
  function GameGui() {}
  return GameGui;
})();

class SplendorDuel extends GameGui<SplendorDuelPlayer, SplendorDuelGamedatas> implements SplendorDuelGame {
    public animationManager: AnimationManager;
    public cardsManager: CardsManager;
    public royalCardsManager: RoyalCardsManager;
    public counterfeiterCardsManager: CounterfeiterCardsManager;
    public tokensManager: TokensManager;

    private zoomManager: ZoomManager;
    public gamedatas: SplendorDuelGamedatas;
    private tableCenter: TableCenter;
    private playersTables: PlayerTable[] = [];
    private privilegeCounters: Counter[] = [];
    private reservedCounters: Counter[] = [];
    private pointsCounters: Counter[] = [];
    private crownCounters: Counter[] = [];
    private strongestColumnCounters: Counter[] = [];
    private tokenCounters: Counter[] = [];
    private tokenExtraCounters: Counter[] = [];
    private crownGoalCounters: Counter[] = [];
    private strongestColumnGoalCounters: Counter[] = [];

    private tokensSelection: Token[];
    private selectedCard: Card | CounterfeiterCard;
    private selectedCardReducedCost: { [color: number]: number };
    private selectedCardPossiblePayments: { [color: number]: number }[];
    private originalTextChooseAction: string;
    private selectedCards: Card[];
    private pickStock: LineStock<Card> | null = null;
    
    private TOOLTIP_DELAY = document.body.classList.contains('touch-device') ? 1500 : undefined;

    constructor() {
        super();
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

        log('gamedatas', gamedatas);

        this.animationManager = new AnimationManager(this);
        this.cardsManager = new CardsManager(this);
        this.royalCardsManager = new RoyalCardsManager(this);
        this.counterfeiterCardsManager = new CounterfeiterCardsManager(this);
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

        if ((this as any).bgaInternal.flags['ingame_player_panels']) {
            setTimeout(() => {
                Object.keys(gamedatas.players).forEach(playerId => {
                    const playerPanel = document.getElementById(`overall_player_board_${playerId}`)
                    const playerTable = document.getElementById(`player-table-${playerId}-name`) as HTMLDivElement;
                    playerTable.firstChild.remove();
                    playerTable.insertAdjacentElement('afterbegin', playerPanel);
                    playerTable.style.color = 'black';
                    playerTable.style.fontWeight = 'inherit';
                    playerTable.style.fontSize = 'unset';
                    (playerTable.firstElementChild as HTMLDivElement).style.minWidth = '300px';
                    playerTable.style.textAlign = 'inherit';
                });
            });
        }

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
    
    private setGamestateDescription(property: string = '') {
        if (this.isCurrentPlayerActive()) { // we don't want opponent to see the restriction the current player has
            const originalState = this.gamedatas.gamestates[this.gamedatas.gamestate.id];
            this.statusBar.setTitle(_(originalState['descriptionmyturn'  + property]), []);
        }
    }

    private onEnteringUsePrivilege(args: EnteringUsePrivilegeArgs) {
        if (this.isCurrentPlayerActive()) {
            this.tableCenter.setBoardSelectable('privileges', false, args.privileges);
        }
    }
    
    private setAntiPlayingNotice(args: EnteringPlayActionArgs) {
        const noticeDiv = document.getElementById('anti-playing-notice');
        const showNotice = args.playerAntiPlaying || args.opponentAntiPlaying;
        if (showNotice) {
            let notice = _("Blocking play by retaining all pearl and gold tokens is an anti-playing practice.") + ' ';

            const refillButton = args.opponentAntiPlaying ? `<button type="button" id="end_the_game_button" class="bgabutton bgabutton_blue">${_("End the game (win immediately)")}</button>` : null;
            if (args.playerAntiPlaying) {
                notice += _('Please buy a card to unblock the situation.');
            } else if (args.opponentAntiPlaying) {
                notice += _('You can ${end_the_game_button} and it will be considered as a victory for you.').replace('${end_the_game_button}', refillButton);
            }

            noticeDiv.innerHTML = notice;

            document.getElementById('end_the_game_button')?.addEventListener('click', () => this.bgaPerformAction('actEndGameAntiPlaying'));
        }
        noticeDiv.classList.toggle('visible', showNotice);
    }

    private setNotice(args: EnteringPlayActionArgs) {
        const noticeDiv = document.getElementById('notice');
        const showNotice = args.canRefill || args.privileges > 0;
        if (showNotice) {
            let notice = ``;
            const refillButton = args.canRefill ? `<button type="button" id="replenish_button" class="bgabutton bgabutton_blue">${_("Replenish the board")}</button>` : null;
            const usePrivilegeButton = args.privileges ? `<button type="button" id="usePrivilege_button" class="bgabutton bgabutton_blue">${_("Use up to ${number} privilege(s) to take gem(s)").replace('${number}', ''+args.privileges)}</button>` : null;
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

            document.getElementById('replenish_button')?.addEventListener('click', () => this.confirmActionTakeTokens(() => this.bgaPerformAction('actRefillBoard'), true, false));
            document.getElementById('usePrivilege_button')?.addEventListener('click', () => this.bgaPerformAction('actUsePrivilege'));
        }
        noticeDiv.classList.toggle('visible', showNotice);
    }

    private confirmActionTakeTokens(finalAction: Function, showPrivilegeWarning: boolean, showLimitWarning: boolean) {
        const warnings = [];

        if (showLimitWarning/* && this.gamedatas.gamestate.args.canBuyCard*/) { // you might not be able to buy a card, but you may be able to use privilege or take a gold instead
            warnings.push(_("You will have more than 10 tokens, and you'll need to discard some of them."));
        }

        if (showPrivilegeWarning && this.getGameUserPreference(201) != 2) {
            warnings.push(`${_("This action will give a privilege to your opponent.")}
            <br><br>
            <i>${_("You can disable this warning in the user preferences (top right menu).")}</i>`)
        }

        if (warnings.length) {
            this.confirmationDialog(warnings.join('<br><br>'), finalAction);
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

        if (this.isCurrentPlayerActive()) {
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

    private onEnteringReserveCard(args: EnteringReserveCardArgs) {
        this.selectedCards = [];

        if (args.canReserve > 1) {
            this.statusBar.setTitle(this.isCurrentPlayerActive() ?
                _('${you} must choose up to 2 cards to reserve') :
                _('${actplayer} must choose up to 2 cards to reserve')
            );
        }
        
        if (this.isCurrentPlayerActive()) {
            this.tableCenter.setCardsSelectable(true, [], true, args.canReserve > 1);
        }
    }

    private onEnteringPlaceJoker(args: EnteringPlaceJokerArgs) {
        if (this.isCurrentPlayerActive()) {
            this.getCurrentPlayerTable().setColumnsSelectable(args.colors);
        }
    }

    private onEnteringTakeBoardToken(args: EnteringTakeBoardTokenArgs) {
        if (args.canTakeAnyColorOrTwoOfColor) {
            this.statusBar.setTitle(
                this.isCurrentPlayerActive() ? 
                    _('${you} must take any token or 2 ${color_name} tokens from the board') : 
                    _('${actplayer} must take any token or 2 ${color_name} tokens from the board'),
                args
            );
        }
        
        if (args.number === -1) {
            this.statusBar.setTitle(this.isCurrentPlayerActive() ? _('${you} must take all tokens of a color from the board') : _('${actplayer} must take a ${color_name} must take all tokens of a color from the board'));
        } else if (args.color === 9) {
            this.statusBar.setTitle(this.isCurrentPlayerActive() ? _('${you} must take 3 tokens of any color from the board') : _('${actplayer} must take 3 tokens of any color from the board'));
        }

        if (this.isCurrentPlayerActive()) {
            this.tableCenter.setBoardSelectable('effect', args.color === -1, args.number, args.color === 9 ? null : args.color, args.canTakeAnyColorOrTwoOfColor);
        }
    }

    private onEnteringTakeOpponentToken(args: EnteringTakeOpponentTokenArgs) {
        if (this.isCurrentPlayerActive()) {
            this.getPlayerTable(args.opponentId).setTokensSelectable(true, false);
        }
    }

    private onEnteringTakeRoyalCard() {
        if (this.isCurrentPlayerActive()) {
            this.tableCenter.setRoyalCardsSelectable(true);
        }
    }

    private onEnteringTakeCounterfeiterCard() {
        if (this.isCurrentPlayerActive()) {
            this.tableCenter.setCounterfeiterCardsSelectable(true, [], true);
        }
    }

    private onEnteringDiscardTokens() {
        if (this.isCurrentPlayerActive()) {
            this.getCurrentPlayerTable().setTokensSelectable(true, true);
        }
    }

    private onEnteringReserveFromDeckChooseDeck() {
        if (this.isCurrentPlayerActive()) {
            this.tableCenter.setDecksSelectable(true);
        }
    }

    private onEnteringReserveFromDeckChooseCard(args: EnteringReserveFromDeckChooseCardArgs) {
        const pickDiv = document.createElement('div');
        pickDiv.id = 'pick-div';
        document.getElementById(`cards-wrapper`).insertAdjacentElement('afterbegin', pickDiv);

        this.pickStock = new LineStock<Card>(this.cardsManager, pickDiv);
        this.pickStock.addCards(args._private ? args._private.cards : [1, 2, 3].map(fakeId => ({ id: -fakeId, level: args.level} as Card)));

        if (this.isCurrentPlayerActive()) {
            this.pickStock.setSelectionMode('single');
            this.pickStock.onCardClick = card => this.bgaPerformAction('actReserveFromDeckChooseCard', { id: card.id });
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

    private onLeavingPlayAction() {
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

    private onLeavingTakeCounterfeiterCard() {
        this.tableCenter.setCounterfeiterCardsSelectable(false);
        this.getCurrentPlayerTable()?.setHandSelectable(false);
    }

    private onLeavingDiscardTokens() {
        this.getCurrentPlayerTable()?.setTokensSelectable(false, true);
    }

    private onLeavingReserveFromDeckChooseDeck() {
        if (this.isCurrentPlayerActive()) {
            this.tableCenter.setDecksSelectable(false);
        }
    }

    private onLeavingReserveFromDeckChooseCard() {
        this.pickStock?.removeAll();
        this.pickStock = null;
        document.getElementById('pick-div')?.remove();
    }

    private takeSelectedTokensWithWarning() {
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
        } else {
            this.takeSelectedTokens();
        }
    }

    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    public onUpdateActionButtons(stateName: string, args: any) {
        
        if (this.isCurrentPlayerActive()) {
            switch (stateName) {
                case 'usePrivilege':
                    this.statusBar.addActionButton(
                        '', 
                        () => this.takeSelectedTokens(), 
                        { id: `takeSelectedTokens_button` }
                    );
                    this.onTableTokenSelectionChange([], false);
                    this.statusBar.addActionButton(
                        _("Cancel"), 
                        () => this.bgaPerformAction('actCancelUsePrivilege'), 
                        { color: 'secondary' }
                    );
                    break;
                case 'playAction':
                    this.statusBar.addActionButton(
                        '', 
                        () => this.takeSelectedTokensWithWarning(),
                        { id: `takeSelectedTokens_button` }
                    );
                    this.onTableTokenSelectionChange([], false);
                    break;
                case 'reserveCard':
                    if (args.canReserve > 1) {
                        this.statusBar.addActionButton(
                            _("Reserve selected cards"), 
                            () => this.bgaPerformAction('actReserveCards', {
                                ids: this.selectedCards.map(card => card.id).join(',')
                            }), 
                            { id: 'reserve-cards-button', disabled: true }
                        );
                    }
                    break;
                case 'takeBoardToken':
                    this.statusBar.addActionButton(
                        _("Take selected token"), 
                        () => this.takeSelectedTokens(),
                        { id: `takeSelectedTokens_button`, classes: 'disabled' }
                    );
                    break;
                case 'takeOpponentToken':
                    this.statusBar.addActionButton(
                        _("Take selected token"), 
                        () => this.takeOpponentToken(this.tokensSelection[0].id),                    
                        { id: `takeSelectedTokens_button`, classes: 'disabled' }
                    );
                    break;
                case 'beforeEndTurn':
                    [
                        [9, _("Spend ${number} Glassware token(s) to take a Royal card").replace('${number}', 1 + args.playerRoyalCardCount) ], 
                        [10, _("Spend a Glassware token and a Privilege to play a new turn")],
                        [17, _("Spend 2 Glassware tokens to reserve a deck card")],
                    ].forEach(([powerId, buttonLabel]) => {
                        if (args.possiblePowers.includes(powerId)) {
                            this.statusBar.addActionButton(
                                buttonLabel as string, 
                                () => this.bgaPerformAction('actUseCounterfeiterCardPower', { power: powerId })
                            );
                        }
                    });
                    this.statusBar.addActionButton(
                        _("Pass"), 
                        () => this.bgaPerformAction('actPassCounterfeiterCardPower')
                    );
                    break;
                case 'discardTokens':
                    this.statusBar.addActionButton(
                        _("Discard selected token(s)"), 
                        () => this.discardSelectedTokens(),                  
                        { id: `discardSelectedTokens_button`, classes: 'disabled' });
                    break;
                    
            }
        }
    }

    ///////////////////////////////////////////////////
    //// Utility methods


    ///////////////////////////////////////////////////

    public setTooltip(id: string, html: string) {
        this.addTooltipHtml(id, html, this.TOOLTIP_DELAY);
    }
    public setTooltipToClass(className: string, html: string) {
        this.addTooltipHtmlToClass(className, html, this.TOOLTIP_DELAY);
    }

    public getPlayerId(): number {
        return Number(this.player_id);
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

    public getOpponentId(playerId: number): number {
      return Number(Object.values(this.gamedatas.players).find((player) => Number(player.id) != playerId).id);
    }

    public getGameStateName(): string {
        return this.gamedatas.gamestate.name;
    }

    private getOrderedPlayers(gamedatas: SplendorDuelGamedatas) {
        const players = Object.values(gamedatas.players).sort((a, b) => a.playerNo - b.playerNo);
        const playerIndex = players.findIndex(player => Number(player.id) === Number(this.player_id));
        const orderedPlayers = playerIndex > 0 ? [...players.slice(playerIndex), ...players.slice(0, playerIndex)] : players;
        return orderedPlayers;
    }

    public getPlayersTokens(): Token[] {
        return this.playersTables.map(table => table.getTokens()).flat();
    }

    private createPlayerPanels(gamedatas: SplendorDuelGamedatas) {

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

                [2,1,3,5,4].forEach(color => {
                html += `            
                    <div id="player-${playerId}-counters-card-points-${color}" class="card-points points icon"></div>`;
                });

            html += `<div></div>
            </div>
            <div class="spl_ressources_container">`;
            [2,1,3,5,4].forEach(color => {
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
            this.crownCounters[playerId].setValue(player.cards.map(card => card.crowns).reduce((a, b) => a + b, 0) + (player.counterfeiterCards?.map(card => card.crowns).reduce((a, b) => a + b, 0) ?? 0));

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

            [1,2,3,4,5].forEach(color => {
                // we ignore multicolor in gray column as they will move to another column
                const colorPoints = player.cards.filter(card => card.location === `player${playerId}-${color}` && (color !== 9 || !card.power.includes(2))).map(card => card.points).reduce((a, b) => a + b, 0);
                this.setCardPointsCounter(playerId, color, colorPoints);
            });
            
            [1,2,3,4,5].forEach(color => {
                const produce = player.cards.filter(card => card.location === `player${playerId}-${color}`).map(card => Object.values(card.provides).reduce((a, b) => a + b, 0)).reduce((a, b) => a + b, 0);
                this.setCardProduceCounter(playerId, color, produce);
            });
            const tokenColors = [-1, 0, 1,2,3,4,5];
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
        const tokenColors = [-1, 0, 1,2,3,4,5];
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

    private createPlayerTables(gamedatas: SplendorDuelGamedatas) {
        const orderedPlayers = this.getOrderedPlayers(gamedatas);

        orderedPlayers.forEach(player => 
            this.createPlayerTable(gamedatas, Number(player.id))
        );
    }

    private createPlayerTable(gamedatas: SplendorDuelGamedatas, playerId: number) {
        const table = new PlayerTable(this, gamedatas.players[playerId], gamedatas.expansion);
        this.playersTables.push(table);
    }

    private setScore(playerId: number, inc: number) {
        this.bga.playerPanels.getScoreCounter(playerId).incValue(inc);
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
    
    public onTableTokenSelectionChange(tokens: Token[], valid: boolean, selectionType?: SelectionType): void {
        this.tokensSelection = tokens;

        const button = document.getElementById('takeSelectedTokens_button');
        if (button) {
            button.classList.toggle('disabled', !valid);
            const gold = tokens.length && tokens.every(token => token.type == 1);
            button.innerHTML = selectionType == 'play' && gold ? _("Take gold token to reserve a card") : _("Take ${number} selected token(s)").replace('${number}', ''+tokens.length);
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

    public onTableCardSelectionChange(card: Card, selected: boolean): void {
        /*if (selected) {
            this.selectedCards.push(card);
        } else {
            this.selectedCards = this.selectedCards.filter(c => c != card);
        }*/
        if (this.selectedCards.some(c => c.id == card.id)) {
            this.selectedCards = this.selectedCards.filter(c => c.id != card.id);
        } else {
            this.selectedCards.push(card);
        }

        const button = document.getElementById(`reserve-cards-button`) as HTMLButtonElement;
        if (button) {
            button.disabled = this.selectedCards.length < 1 || this.selectedCards.length > 2;
        }
    }

    public onTableCardClick(card: Card, selected: boolean): void {
        if (this.gamedatas.gamestate.name == 'reserveCard') {
            if (this.gamedatas.gamestate.args.canReserve > 1) {
                this.onTableCardSelectionChange(card, selected);
            } else {
                this.reserveCard(card.id);
            }
        } else if (this.gamedatas.gamestate.name == 'playAction') {
            if (card == this.selectedCard) {
                this.cancelChooseTokenCost();
            } else {
                if (this.selectedCard) {
                    this.cancelChooseTokenCost();
                }
                this.onBuyCardClick(card);
            }
        } else if (this.gamedatas.gamestate.name == 'reserveFromDeckChooseDeck') {
            this.bgaPerformAction('actReserveFromDeckChooseDeck', { id: card.id });
        }
    }

    public onBuyCardClick(card: Card): void {
        const playerId = this.getPlayerId();
        const possiblePayments = structuredClone((this.gamedatas.gamestate.args as EnteringPlayActionArgs).buyableCards[card.id]);
        const reductedCost = structuredClone((this.gamedatas.gamestate.args as EnteringPlayActionArgs).reducedCosts[card.id]);
        if (!possiblePayments) {
            return;
        }

        this.selectedCard = card;
        this.selectedCardPossiblePayments = possiblePayments;
        this.selectedCardReducedCost = reductedCost;

        this.onAnyTableCardClick(playerId, reductedCost, possiblePayments);
    }

    public onBuyCounterfeiterCardClick(card: CounterfeiterCard): void {
        const playerId = this.getPlayerId();
        const possiblePayments = structuredClone((this.gamedatas.gamestate.args as EnteringPlayActionArgs).buyableCounterfeiterCards[card.id]);
        const reductedCost = structuredClone((this.gamedatas.gamestate.args as EnteringPlayActionArgs).reducedCounterfeiterCosts[card.id]);
        if (!possiblePayments) {
            return;
        }

        this.selectedCard = card;
        this.selectedCardPossiblePayments = possiblePayments;
        this.selectedCardReducedCost = reductedCost;

        this.onAnyTableCardClick(playerId, reductedCost, possiblePayments);
    }

    private onAnyTableCardClick(playerId: number, reductedCost: { [color: number]: number; }, possiblePayments: { [color: number]: number; }[]) {
        const table = this.getPlayerTable(playerId);

        let selectedTokens: Token[] = [];
        if (possiblePayments.length > 0) {
            [-1,0,1,2,3,4,5,6].forEach(color => {
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
            const isVisible = (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );

            if (!isVisible) {
                element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'center',
                });
            }
        }
    }

    private setChooseTokenCostButtonLabelAndState() {
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
                _('Pay ${cost}').replace('${cost}',
                    `<div class="compressed-token-icons">${
                        selection.map(token => `<div class="token-icon" data-type="${token.type == 1 ? -1 : token.color}"></div>`).join('')
                    }${new Array(Math.max(0, expectedTileCount - selection.length)).fill(0).map(() => `<div class="fake token-icon">?</div>`).join('')}</div>`
                ) : 
                _('Take for free');

            button.innerHTML = label;
            button.classList.toggle('disabled', !valid);
        }
    }

    private setActionBarChooseTokenCost(reductedCost: { [color: number]: number; }) {
        const question = _("${you} must select the tokens to pay ${cost}").replace('${cost}', 
            `<div class="compressed-token-icons">${
                Object.entries(reductedCost).map(([color, number]) => new Array(number).fill(0).map(() => `<div class="token-icon" data-type="${color}"></div>`).join('')).join('')
            }</div>`
        );
        this.setChooseActionGamestateDescription(question);

        document.getElementById(`generalactions`).innerHTML = '';
        this.statusBar.addActionButton(
            ``, 
            () => this.buyCard(), 
            { id: `chooseTokenCost-button` }
        );
        this.setChooseTokenCostButtonLabelAndState();
        this.statusBar.addActionButton(
            _("Cancel"), 
            () => this.cancelChooseTokenCost(), 
            { color: 'secondary', id: `cancelChooseTokenCost-button` }
        );
    }
    
    private setChooseActionGamestateDescription(newText?: string) {
        if (!this.originalTextChooseAction) {
            this.originalTextChooseAction = document.getElementById('pagemaintitletext').innerHTML;
        }

        this.statusBar.setTitle(newText ?? this.originalTextChooseAction);
    }

    public cancelChooseTokenCost() {
        const table = this.getCurrentPlayerTable();

        if (this.selectedCard) {
            const isCounterfeiterCard = (this.selectedCard as Card).provides === undefined;
            if (isCounterfeiterCard) {
                this.tableCenter.unselectTableCounterfeiterCard(this.selectedCard as CounterfeiterCard);
            } else {
                this.tableCenter.unselectTableCard(this.selectedCard as Card);
                table.reserved.unselectCard(this.selectedCard as Card);
            }
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

    public onCounterfeiterCardClick(card: CounterfeiterCard): void {
        if (this.gamedatas.gamestate.name == 'takeCounterfeiterCard') {
            this.bgaPerformAction('actTakeCounterfeiterCard', { id: card.id });
        } else 
        if (this.gamedatas.gamestate.name == 'reserveCard') {
            //this.reserveCard(card.id);
        } else if (this.gamedatas.gamestate.name == 'playAction') {
            if (this.selectedCard) {
                this.cancelChooseTokenCost();
            }
            this.onBuyCounterfeiterCardClick(card);
        }
    }

    public onReservedCardClick(card: Card): void {
        this.onTableCardClick(card, true);
    }

    public onColumnClick(color: number): void {
        if (this.gamedatas.gamestate.name == 'placeJoker') {
            this.bgaPerformAction('actPlaceJoker', {
                color
            });
        }
    }
  	
    public takeSelectedTokens() {
        const tokensIds = this.tokensSelection.map(token => token.id).sort((a, b) => a - b);

        this.bgaPerformAction('actTakeTokens', {
            ids: tokensIds.join(','), 
        });
    }
  	
    public discardSelectedTokens() {
        const tokensIds = this.tokensSelection.map(token => token.id).sort((a, b) => a - b);

        this.bgaPerformAction('actDiscardTokens', {
            ids: tokensIds.join(','), 
        });
    }
  	
    public reserveCard(id: number) {
        this.bgaPerformAction('actReserveCard', {
            id
        });
    }
  	
    public buyCard() {
        const tokensIds = this.tokensSelection.map(token => token.id).sort((a, b) => a - b);

        const isCounterfeiterCard = (this.selectedCard as Card).provides === undefined;
        this.bgaPerformAction(isCounterfeiterCard ? 'actBuyCounterfeiterCard' : 'actBuyCard', {
            id: this.selectedCard.id,
            tokensIds: tokensIds.join(','), 
        });
    }
  	
    public takeRoyalCard(id: number) {
        this.bgaPerformAction('actTakeRoyalCard', {
            id
        });
    }
  	
    public takeOpponentToken(id: number) {
        this.bgaPerformAction('actTakeOpponentToken', {
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
        const { tokens, playerId, from } = args;

        const fromStock = from === 'bag' ? this.tableCenter.bag : undefined;

        await this.getPlayerTable(playerId).addTokens(tokens, fromStock);

        this.updateTokenCounters(playerId);
        this.updateTokenCounters(this.getOpponentId(playerId));
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

    async notif_buyCounterfeiterCard(args: NotifBuyCounterfeiterCardArgs) {
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

    async notif_takeCounterfeiterCard(args: NotifBuyCounterfeiterCardArgs) {
        const { card, playerId } = args;
        await this.getPlayerTable(playerId).addCounterfeiterCard(card);

        const playerTable = this.getPlayerTable(playerId);
        this.crownCounters[playerId].toValue(playerTable.getCrowns());
        this.incScore(playerId, card.points);

        return Promise.resolve(true);
    }

    notif_takeRoyalCard(args: NotifTakeRoyalCardArgs) {
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

    async notif_discardTokens(args: NotifDiscardTokensArgs) {
        const { tokens, playerId } = args;
        
        await this.tableCenter.removeTokens(tokens);

        this.updateTokenCounters(playerId);
    }

    notif_newTableCard(args: NotifNewTableCardArgs) {
        return this.tableCenter.replaceCard(args);
    }

    notif_newTableRoyalCard(args: NotifNewTableRoyalCardArgs) {
        return this.tableCenter.addRoyalCard(args.newCard);
    }

    notif_refillCounterfeiterCards(args: NotifNewCounterfeiterCardsArgs) {
        const { cards, counterfeiterDeckCount, counterfeiterDeckTop } = args;
        return this.tableCenter.refillCounterfeiterCards(cards, counterfeiterDeckCount, counterfeiterDeckTop);
    }

    notif_win(args: NotifWinArgs) {
        this.setScore(args.playerId, 1);
        this.setEndReasons(args.playerId, args.endReasons);
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

                    log = _(log).replace(cardRegex, (_, innerText) => 
                    `<span id="card-log-${cardLogId}" class="card-log-int">${innerText}</span>`
                    );

                    const cardForLog = this.cardsManager.createCardElement({ ...args['card'], id: `card-for-log-${cardLogId}` } );

                    setTimeout(() => this.addTooltipHtml(`card-log-${cardLogId}`, cardForLog.outerHTML, 500));
                }
            }
        } catch (e) {
            console.error(log,args,"Exception thrown", e.stack);
        }
        return (this as any).inherited(arguments);
    }
}