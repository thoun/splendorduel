var DEFAULT_ZOOM_LEVELS = [0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];
var ZoomManager = /** @class */ (function () {
    /**
     * Place the settings.element in a zoom wrapper and init zoomControls.
     *
     * @param settings: a `ZoomManagerSettings` object
     */
    function ZoomManager(settings) {
        var _this = this;
        var _a, _b, _c, _d, _e;
        this.settings = settings;
        if (!settings.element) {
            throw new DOMException('You need to set the element to wrap in the zoom element');
        }
        this._zoomLevels = (_a = settings.zoomLevels) !== null && _a !== void 0 ? _a : DEFAULT_ZOOM_LEVELS;
        this._zoom = this.settings.defaultZoom || 1;
        if (this.settings.localStorageZoomKey) {
            var zoomStr = localStorage.getItem(this.settings.localStorageZoomKey);
            if (zoomStr) {
                this._zoom = Number(zoomStr);
            }
        }
        this.wrapper = document.createElement('div');
        this.wrapper.id = 'bga-zoom-wrapper';
        this.wrapElement(this.wrapper, settings.element);
        this.wrapper.appendChild(settings.element);
        settings.element.classList.add('bga-zoom-inner');
        if ((_b = settings.smooth) !== null && _b !== void 0 ? _b : true) {
            settings.element.dataset.smooth = 'true';
            settings.element.addEventListener('transitionend', function () { return _this.zoomOrDimensionChanged(); });
        }
        if ((_d = (_c = settings.zoomControls) === null || _c === void 0 ? void 0 : _c.visible) !== null && _d !== void 0 ? _d : true) {
            this.initZoomControls(settings);
        }
        if (this._zoom !== 1) {
            this.setZoom(this._zoom);
        }
        window.addEventListener('resize', function () {
            var _a;
            _this.zoomOrDimensionChanged();
            if ((_a = _this.settings.autoZoom) === null || _a === void 0 ? void 0 : _a.expectedWidth) {
                _this.setAutoZoom();
            }
        });
        if (window.ResizeObserver) {
            new ResizeObserver(function () { return _this.zoomOrDimensionChanged(); }).observe(settings.element);
        }
        if ((_e = this.settings.autoZoom) === null || _e === void 0 ? void 0 : _e.expectedWidth) {
            this.setAutoZoom();
        }
    }
    Object.defineProperty(ZoomManager.prototype, "zoom", {
        /**
         * Returns the zoom level
         */
        get: function () {
            return this._zoom;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ZoomManager.prototype, "zoomLevels", {
        /**
         * Returns the zoom levels
         */
        get: function () {
            return this._zoomLevels;
        },
        enumerable: false,
        configurable: true
    });
    ZoomManager.prototype.setAutoZoom = function () {
        var _this = this;
        var _a, _b, _c;
        var zoomWrapperWidth = document.getElementById('bga-zoom-wrapper').clientWidth;
        if (!zoomWrapperWidth) {
            setTimeout(function () { return _this.setAutoZoom(); }, 200);
            return;
        }
        var expectedWidth = (_a = this.settings.autoZoom) === null || _a === void 0 ? void 0 : _a.expectedWidth;
        var newZoom = this.zoom;
        while (newZoom > this._zoomLevels[0] && newZoom > ((_c = (_b = this.settings.autoZoom) === null || _b === void 0 ? void 0 : _b.minZoomLevel) !== null && _c !== void 0 ? _c : 0) && zoomWrapperWidth / newZoom < expectedWidth) {
            newZoom = this._zoomLevels[this._zoomLevels.indexOf(newZoom) - 1];
        }
        if (this._zoom == newZoom) {
            if (this.settings.localStorageZoomKey) {
                localStorage.setItem(this.settings.localStorageZoomKey, '' + this._zoom);
            }
        }
        else {
            this.setZoom(newZoom);
        }
    };
    /**
     * Sets the available zoomLevels and new zoom to the provided values.
     * @param zoomLevels the new array of zoomLevels that can be used.
     * @param newZoom if provided the zoom will be set to this value, if not the last element of the zoomLevels array will be set as the new zoom
     */
    ZoomManager.prototype.setZoomLevels = function (zoomLevels, newZoom) {
        if (!zoomLevels || zoomLevels.length <= 0) {
            return;
        }
        this._zoomLevels = zoomLevels;
        var zoomIndex = newZoom && zoomLevels.includes(newZoom) ? this._zoomLevels.indexOf(newZoom) : this._zoomLevels.length - 1;
        this.setZoom(this._zoomLevels[zoomIndex]);
    };
    /**
     * Set the zoom level. Ideally, use a zoom level in the zoomLevels range.
     * @param zoom zool level
     */
    ZoomManager.prototype.setZoom = function (zoom) {
        var _a, _b, _c, _d;
        if (zoom === void 0) { zoom = 1; }
        this._zoom = zoom;
        if (this.settings.localStorageZoomKey) {
            localStorage.setItem(this.settings.localStorageZoomKey, '' + this._zoom);
        }
        var newIndex = this._zoomLevels.indexOf(this._zoom);
        (_a = this.zoomInButton) === null || _a === void 0 ? void 0 : _a.classList.toggle('disabled', newIndex === this._zoomLevels.length - 1);
        (_b = this.zoomOutButton) === null || _b === void 0 ? void 0 : _b.classList.toggle('disabled', newIndex === 0);
        this.settings.element.style.transform = zoom === 1 ? '' : "scale(".concat(zoom, ")");
        (_d = (_c = this.settings).onZoomChange) === null || _d === void 0 ? void 0 : _d.call(_c, this._zoom);
        this.zoomOrDimensionChanged();
    };
    /**
     * Call this method for the browsers not supporting ResizeObserver, everytime the table height changes, if you know it.
     * If the browsert is recent enough (>= Safari 13.1) it will just be ignored.
     */
    ZoomManager.prototype.manualHeightUpdate = function () {
        if (!window.ResizeObserver) {
            this.zoomOrDimensionChanged();
        }
    };
    /**
     * Everytime the element dimensions changes, we update the style. And call the optional callback.
     */
    ZoomManager.prototype.zoomOrDimensionChanged = function () {
        var _a, _b;
        this.settings.element.style.width = "".concat(this.wrapper.getBoundingClientRect().width / this._zoom, "px");
        this.wrapper.style.height = "".concat(this.settings.element.getBoundingClientRect().height, "px");
        (_b = (_a = this.settings).onDimensionsChange) === null || _b === void 0 ? void 0 : _b.call(_a, this._zoom);
    };
    /**
     * Simulates a click on the Zoom-in button.
     */
    ZoomManager.prototype.zoomIn = function () {
        if (this._zoom === this._zoomLevels[this._zoomLevels.length - 1]) {
            return;
        }
        var newIndex = this._zoomLevels.indexOf(this._zoom) + 1;
        this.setZoom(newIndex === -1 ? 1 : this._zoomLevels[newIndex]);
    };
    /**
     * Simulates a click on the Zoom-out button.
     */
    ZoomManager.prototype.zoomOut = function () {
        if (this._zoom === this._zoomLevels[0]) {
            return;
        }
        var newIndex = this._zoomLevels.indexOf(this._zoom) - 1;
        this.setZoom(newIndex === -1 ? 1 : this._zoomLevels[newIndex]);
    };
    /**
     * Changes the color of the zoom controls.
     */
    ZoomManager.prototype.setZoomControlsColor = function (color) {
        if (this.zoomControls) {
            this.zoomControls.dataset.color = color;
        }
    };
    /**
     * Set-up the zoom controls
     * @param settings a `ZoomManagerSettings` object.
     */
    ZoomManager.prototype.initZoomControls = function (settings) {
        var _this = this;
        var _a, _b, _c, _d, _e, _f;
        this.zoomControls = document.createElement('div');
        this.zoomControls.id = 'bga-zoom-controls';
        this.zoomControls.dataset.position = (_b = (_a = settings.zoomControls) === null || _a === void 0 ? void 0 : _a.position) !== null && _b !== void 0 ? _b : 'top-right';
        this.zoomOutButton = document.createElement('button');
        this.zoomOutButton.type = 'button';
        this.zoomOutButton.addEventListener('click', function () { return _this.zoomOut(); });
        if ((_c = settings.zoomControls) === null || _c === void 0 ? void 0 : _c.customZoomOutElement) {
            settings.zoomControls.customZoomOutElement(this.zoomOutButton);
        }
        else {
            this.zoomOutButton.classList.add("bga-zoom-out-icon");
        }
        this.zoomInButton = document.createElement('button');
        this.zoomInButton.type = 'button';
        this.zoomInButton.addEventListener('click', function () { return _this.zoomIn(); });
        if ((_d = settings.zoomControls) === null || _d === void 0 ? void 0 : _d.customZoomInElement) {
            settings.zoomControls.customZoomInElement(this.zoomInButton);
        }
        else {
            this.zoomInButton.classList.add("bga-zoom-in-icon");
        }
        this.zoomControls.appendChild(this.zoomOutButton);
        this.zoomControls.appendChild(this.zoomInButton);
        this.wrapper.appendChild(this.zoomControls);
        this.setZoomControlsColor((_f = (_e = settings.zoomControls) === null || _e === void 0 ? void 0 : _e.color) !== null && _f !== void 0 ? _f : 'black');
    };
    /**
     * Wraps an element around an existing DOM element
     * @param wrapper the wrapper element
     * @param element the existing element
     */
    ZoomManager.prototype.wrapElement = function (wrapper, element) {
        element.parentNode.insertBefore(wrapper, element);
        wrapper.appendChild(element);
    };
    return ZoomManager;
}());
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var BgaHelpButton = /** @class */ (function () {
    function BgaHelpButton() {
    }
    return BgaHelpButton;
}());
var BgaHelpPopinButton = /** @class */ (function (_super) {
    __extends(BgaHelpPopinButton, _super);
    function BgaHelpPopinButton(settings) {
        var _this = _super.call(this) || this;
        _this.settings = settings;
        return _this;
    }
    BgaHelpPopinButton.prototype.add = function (toElement) {
        var _a;
        var _this = this;
        var button = document.createElement('button');
        (_a = button.classList).add.apply(_a, __spreadArray(['bga-help_button', 'bga-help_popin-button'], (this.settings.buttonExtraClasses ? this.settings.buttonExtraClasses.split(/\s+/g) : []), false));
        button.innerHTML = "?";
        if (this.settings.buttonBackground) {
            button.style.setProperty('--background', this.settings.buttonBackground);
        }
        if (this.settings.buttonColor) {
            button.style.setProperty('--color', this.settings.buttonColor);
        }
        toElement.appendChild(button);
        button.addEventListener('click', function () { return _this.showHelp(); });
    };
    BgaHelpPopinButton.prototype.showHelp = function () {
        var _a, _b, _c;
        var popinDialog = new window.ebg.popindialog();
        popinDialog.create('bgaHelpDialog');
        popinDialog.setTitle(this.settings.title);
        popinDialog.setContent("<div id=\"help-dialog-content\">".concat((_a = this.settings.html) !== null && _a !== void 0 ? _a : '', "</div>"));
        (_c = (_b = this.settings).onPopinCreated) === null || _c === void 0 ? void 0 : _c.call(_b, document.getElementById('help-dialog-content'));
        popinDialog.show();
    };
    return BgaHelpPopinButton;
}(BgaHelpButton));
var BgaHelpExpandableButton = /** @class */ (function (_super) {
    __extends(BgaHelpExpandableButton, _super);
    function BgaHelpExpandableButton(settings) {
        var _this = _super.call(this) || this;
        _this.settings = settings;
        return _this;
    }
    BgaHelpExpandableButton.prototype.add = function (toElement) {
        var _a;
        var _this = this;
        var _b, _c, _d, _e, _f, _g, _h, _j;
        var folded = (_b = this.settings.defaultFolded) !== null && _b !== void 0 ? _b : true;
        if (this.settings.localStorageFoldedKey) {
            var localStorageValue = localStorage.getItem(this.settings.localStorageFoldedKey);
            if (localStorageValue) {
                folded = localStorageValue == 'true';
            }
        }
        var button = document.createElement('button');
        button.dataset.folded = folded.toString();
        (_a = button.classList).add.apply(_a, __spreadArray(['bga-help_button', 'bga-help_expandable-button'], (this.settings.buttonExtraClasses ? this.settings.buttonExtraClasses.split(/\s+/g) : []), false));
        button.innerHTML = "\n            <div class=\"bga-help_folded-content ".concat(((_c = this.settings.foldedContentExtraClasses) !== null && _c !== void 0 ? _c : '').split(/\s+/g), "\">").concat((_d = this.settings.foldedHtml) !== null && _d !== void 0 ? _d : '', "</div>\n            <div class=\"bga-help_unfolded-content  ").concat(((_e = this.settings.unfoldedContentExtraClasses) !== null && _e !== void 0 ? _e : '').split(/\s+/g), "\">").concat((_f = this.settings.unfoldedHtml) !== null && _f !== void 0 ? _f : '', "</div>\n        ");
        button.style.setProperty('--expanded-width', (_g = this.settings.expandedWidth) !== null && _g !== void 0 ? _g : 'auto');
        button.style.setProperty('--expanded-height', (_h = this.settings.expandedHeight) !== null && _h !== void 0 ? _h : 'auto');
        button.style.setProperty('--expanded-radius', (_j = this.settings.expandedRadius) !== null && _j !== void 0 ? _j : '10px');
        toElement.appendChild(button);
        button.addEventListener('click', function () {
            button.dataset.folded = button.dataset.folded == 'true' ? 'false' : 'true';
            if (_this.settings.localStorageFoldedKey) {
                localStorage.setItem(_this.settings.localStorageFoldedKey, button.dataset.folded);
            }
        });
    };
    return BgaHelpExpandableButton;
}(BgaHelpButton));
var HelpManager = /** @class */ (function () {
    function HelpManager(game, settings) {
        this.game = game;
        if (!(settings === null || settings === void 0 ? void 0 : settings.buttons)) {
            throw new Error('HelpManager need a `buttons` list in the settings.');
        }
        var leftSide = document.getElementById('left-side');
        var buttons = document.createElement('div');
        buttons.id = "bga-help_buttons";
        leftSide.appendChild(buttons);
        settings.buttons.forEach(function (button) { return button.add(buttons); });
    }
    return HelpManager;
}());
/**
 * Jump to entry.
 */
var JumpToEntry = /** @class */ (function () {
    function JumpToEntry(
    /**
     * Label shown on the entry. For players, it's player name.
     */
    label, 
    /**
     * HTML Element id, to scroll into view when clicked.
     */
    targetId, 
    /**
     * Any element that is useful to customize the link.
     * Basic ones are 'color' and 'colorback'.
     */
    data) {
        if (data === void 0) { data = {}; }
        this.label = label;
        this.targetId = targetId;
        this.data = data;
    }
    return JumpToEntry;
}());
var JumpToManager = /** @class */ (function () {
    function JumpToManager(game, settings) {
        var _a, _b, _c;
        this.game = game;
        this.settings = settings;
        var entries = __spreadArray(__spreadArray([], ((_a = settings === null || settings === void 0 ? void 0 : settings.topEntries) !== null && _a !== void 0 ? _a : []), true), ((_b = settings === null || settings === void 0 ? void 0 : settings.playersEntries) !== null && _b !== void 0 ? _b : this.createEntries(Object.values(game.gamedatas.players))), true);
        this.createPlayerJumps(entries);
        var folded = (_c = settings === null || settings === void 0 ? void 0 : settings.defaultFolded) !== null && _c !== void 0 ? _c : false;
        if (settings === null || settings === void 0 ? void 0 : settings.localStorageFoldedKey) {
            var localStorageValue = localStorage.getItem(settings.localStorageFoldedKey);
            if (localStorageValue) {
                folded = localStorageValue == 'true';
            }
        }
        document.getElementById('bga-jump-to_controls').classList.toggle('folded', folded);
    }
    JumpToManager.prototype.createPlayerJumps = function (entries) {
        var _this = this;
        var _a, _b, _c, _d;
        document.getElementById("game_play_area_wrap").insertAdjacentHTML('afterend', "\n        <div id=\"bga-jump-to_controls\">        \n            <div id=\"bga-jump-to_toggle\" class=\"bga-jump-to_link ".concat((_b = (_a = this.settings) === null || _a === void 0 ? void 0 : _a.entryClasses) !== null && _b !== void 0 ? _b : '', " toggle\" style=\"--color: ").concat((_d = (_c = this.settings) === null || _c === void 0 ? void 0 : _c.toggleColor) !== null && _d !== void 0 ? _d : 'black', "\">\n                \u21D4\n            </div>\n        </div>"));
        document.getElementById("bga-jump-to_toggle").addEventListener('click', function () { return _this.jumpToggle(); });
        entries.forEach(function (entry) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            var html = "<div id=\"bga-jump-to_".concat(entry.targetId, "\" class=\"bga-jump-to_link ").concat((_b = (_a = _this.settings) === null || _a === void 0 ? void 0 : _a.entryClasses) !== null && _b !== void 0 ? _b : '', "\">");
            if ((_d = (_c = _this.settings) === null || _c === void 0 ? void 0 : _c.showEye) !== null && _d !== void 0 ? _d : true) {
                html += "<div class=\"eye\"></div>";
            }
            if (((_f = (_e = _this.settings) === null || _e === void 0 ? void 0 : _e.showAvatar) !== null && _f !== void 0 ? _f : true) && ((_g = entry.data) === null || _g === void 0 ? void 0 : _g.id)) {
                var cssUrl = (_h = entry.data) === null || _h === void 0 ? void 0 : _h.avatarUrl;
                if (!cssUrl) {
                    var img = document.getElementById("avatar_".concat(entry.data.id));
                    var url = img === null || img === void 0 ? void 0 : img.src;
                    // ? Custom image : Bga Image
                    //url = url.replace('_32', url.indexOf('data/avatar/defaults') > 0 ? '' : '_184');
                    if (url) {
                        cssUrl = "url('".concat(url, "')");
                    }
                }
                if (cssUrl) {
                    html += "<div class=\"bga-jump-to_avatar\" style=\"--avatar-url: ".concat(cssUrl, ";\"></div>");
                }
            }
            html += "\n                <span class=\"bga-jump-to_label\">".concat(entry.label, "</span>\n            </div>");
            //
            document.getElementById("bga-jump-to_controls").insertAdjacentHTML('beforeend', html);
            var entryDiv = document.getElementById("bga-jump-to_".concat(entry.targetId));
            Object.getOwnPropertyNames((_j = entry.data) !== null && _j !== void 0 ? _j : []).forEach(function (key) {
                entryDiv.dataset[key] = entry.data[key];
                entryDiv.style.setProperty("--".concat(key), entry.data[key]);
            });
            entryDiv.addEventListener('click', function () { return _this.jumpTo(entry.targetId); });
        });
        var jumpDiv = document.getElementById("bga-jump-to_controls");
        jumpDiv.style.marginTop = "-".concat(Math.round(jumpDiv.getBoundingClientRect().height / 2), "px");
    };
    JumpToManager.prototype.jumpToggle = function () {
        var _a;
        var jumpControls = document.getElementById('bga-jump-to_controls');
        jumpControls.classList.toggle('folded');
        if ((_a = this.settings) === null || _a === void 0 ? void 0 : _a.localStorageFoldedKey) {
            localStorage.setItem(this.settings.localStorageFoldedKey, jumpControls.classList.contains('folded').toString());
        }
    };
    JumpToManager.prototype.jumpTo = function (targetId) {
        document.getElementById(targetId).scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    };
    JumpToManager.prototype.getOrderedPlayers = function (unorderedPlayers) {
        var _this = this;
        var players = unorderedPlayers.sort(function (a, b) { return Number(a.playerNo) - Number(b.playerNo); });
        var playerIndex = players.findIndex(function (player) { return Number(player.id) === Number(_this.game.player_id); });
        var orderedPlayers = playerIndex > 0 ? __spreadArray(__spreadArray([], players.slice(playerIndex), true), players.slice(0, playerIndex), true) : players;
        return orderedPlayers;
    };
    JumpToManager.prototype.createEntries = function (players) {
        var orderedPlayers = this.getOrderedPlayers(players);
        return orderedPlayers.map(function (player) { return new JumpToEntry(player.name, "player-table-".concat(player.id), {
            'color': '#' + player.color,
            'colorback': player.color_back ? '#' + player.color_back : null,
            'id': player.id,
        }); });
    };
    return JumpToManager;
}());
var BgaAnimation = /** @class */ (function () {
    function BgaAnimation(animationFunction, settings) {
        this.animationFunction = animationFunction;
        this.settings = settings;
        this.played = null;
        this.result = null;
        this.playWhenNoAnimation = false;
    }
    return BgaAnimation;
}());
/**
 * Just use playSequence from animationManager
 *
 * @param animationManager the animation manager
 * @param animation a `BgaAnimation` object
 * @returns a promise when animation ends
 */
function attachWithAnimation(animationManager, animation) {
    var _a;
    var settings = animation.settings;
    var element = settings.animation.settings.element;
    var fromRect = element.getBoundingClientRect();
    settings.animation.settings.fromRect = fromRect;
    settings.attachElement.appendChild(element);
    (_a = settings.afterAttach) === null || _a === void 0 ? void 0 : _a.call(settings, element, settings.attachElement);
    return animationManager.play(settings.animation);
}
var BgaAttachWithAnimation = /** @class */ (function (_super) {
    __extends(BgaAttachWithAnimation, _super);
    function BgaAttachWithAnimation(settings) {
        var _this = _super.call(this, attachWithAnimation, settings) || this;
        _this.playWhenNoAnimation = true;
        return _this;
    }
    return BgaAttachWithAnimation;
}(BgaAnimation));
/**
 * Just use playSequence from animationManager
 *
 * @param animationManager the animation manager
 * @param animation a `BgaAnimation` object
 * @returns a promise when animation ends
 */
function cumulatedAnimations(animationManager, animation) {
    return animationManager.playSequence(animation.settings.animations);
}
var BgaCumulatedAnimation = /** @class */ (function (_super) {
    __extends(BgaCumulatedAnimation, _super);
    function BgaCumulatedAnimation(settings) {
        var _this = _super.call(this, cumulatedAnimations, settings) || this;
        _this.playWhenNoAnimation = true;
        return _this;
    }
    return BgaCumulatedAnimation;
}(BgaAnimation));
/**
 * Linear slide of the element from origin to destination.
 *
 * @param animationManager the animation manager
 * @param animation a `BgaAnimation` object
 * @returns a promise when animation ends
 */
function slideToAnimation(animationManager, animation) {
    var promise = new Promise(function (success) {
        var _a, _b, _c, _d;
        var settings = animation.settings;
        var element = settings.element;
        var _e = getDeltaCoordinates(element, settings), x = _e.x, y = _e.y;
        var duration = (_a = settings === null || settings === void 0 ? void 0 : settings.duration) !== null && _a !== void 0 ? _a : 500;
        var originalZIndex = element.style.zIndex;
        var originalTransition = element.style.transition;
        element.style.zIndex = "".concat((_b = settings === null || settings === void 0 ? void 0 : settings.zIndex) !== null && _b !== void 0 ? _b : 10);
        var timeoutId = null;
        var cleanOnTransitionEnd = function () {
            element.style.zIndex = originalZIndex;
            element.style.transition = originalTransition;
            success();
            element.removeEventListener('transitioncancel', cleanOnTransitionEnd);
            element.removeEventListener('transitionend', cleanOnTransitionEnd);
            document.removeEventListener('visibilitychange', cleanOnTransitionEnd);
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
        var cleanOnTransitionCancel = function () {
            var _a;
            element.style.transition = "";
            element.offsetHeight;
            element.style.transform = (_a = settings === null || settings === void 0 ? void 0 : settings.finalTransform) !== null && _a !== void 0 ? _a : null;
            element.offsetHeight;
            cleanOnTransitionEnd();
        };
        element.addEventListener('transitioncancel', cleanOnTransitionEnd);
        element.addEventListener('transitionend', cleanOnTransitionEnd);
        document.addEventListener('visibilitychange', cleanOnTransitionCancel);
        element.offsetHeight;
        element.style.transition = "transform ".concat(duration, "ms linear");
        element.offsetHeight;
        element.style.transform = "translate(".concat(-x, "px, ").concat(-y, "px) rotate(").concat((_c = settings === null || settings === void 0 ? void 0 : settings.rotationDelta) !== null && _c !== void 0 ? _c : 0, "deg) scale(").concat((_d = settings.scale) !== null && _d !== void 0 ? _d : 1, ")");
        // safety in case transitionend and transitioncancel are not called
        timeoutId = setTimeout(cleanOnTransitionEnd, duration + 100);
    });
    return promise;
}
var BgaSlideToAnimation = /** @class */ (function (_super) {
    __extends(BgaSlideToAnimation, _super);
    function BgaSlideToAnimation(settings) {
        return _super.call(this, slideToAnimation, settings) || this;
    }
    return BgaSlideToAnimation;
}(BgaAnimation));
/**
 * Linear slide of the element from origin to destination.
 *
 * @param animationManager the animation manager
 * @param animation a `BgaAnimation` object
 * @returns a promise when animation ends
 */
function slideAnimation(animationManager, animation) {
    var promise = new Promise(function (success) {
        var _a, _b, _c, _d;
        var settings = animation.settings;
        var element = settings.element;
        var _e = getDeltaCoordinates(element, settings), x = _e.x, y = _e.y;
        var duration = (_a = settings === null || settings === void 0 ? void 0 : settings.duration) !== null && _a !== void 0 ? _a : 500;
        var originalZIndex = element.style.zIndex;
        var originalTransition = element.style.transition;
        element.style.zIndex = "".concat((_b = settings === null || settings === void 0 ? void 0 : settings.zIndex) !== null && _b !== void 0 ? _b : 10);
        element.style.transition = null;
        element.offsetHeight;
        element.style.transform = "translate(".concat(-x, "px, ").concat(-y, "px) rotate(").concat((_c = settings === null || settings === void 0 ? void 0 : settings.rotationDelta) !== null && _c !== void 0 ? _c : 0, "deg)");
        var timeoutId = null;
        var cleanOnTransitionEnd = function () {
            element.style.zIndex = originalZIndex;
            element.style.transition = originalTransition;
            success();
            element.removeEventListener('transitioncancel', cleanOnTransitionEnd);
            element.removeEventListener('transitionend', cleanOnTransitionEnd);
            document.removeEventListener('visibilitychange', cleanOnTransitionEnd);
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
        var cleanOnTransitionCancel = function () {
            var _a;
            element.style.transition = "";
            element.offsetHeight;
            element.style.transform = (_a = settings === null || settings === void 0 ? void 0 : settings.finalTransform) !== null && _a !== void 0 ? _a : null;
            element.offsetHeight;
            cleanOnTransitionEnd();
        };
        element.addEventListener('transitioncancel', cleanOnTransitionCancel);
        element.addEventListener('transitionend', cleanOnTransitionEnd);
        document.addEventListener('visibilitychange', cleanOnTransitionCancel);
        element.offsetHeight;
        element.style.transition = "transform ".concat(duration, "ms linear");
        element.offsetHeight;
        element.style.transform = (_d = settings === null || settings === void 0 ? void 0 : settings.finalTransform) !== null && _d !== void 0 ? _d : null;
        // safety in case transitionend and transitioncancel are not called
        timeoutId = setTimeout(cleanOnTransitionEnd, duration + 100);
    });
    return promise;
}
var BgaSlideAnimation = /** @class */ (function (_super) {
    __extends(BgaSlideAnimation, _super);
    function BgaSlideAnimation(settings) {
        return _super.call(this, slideAnimation, settings) || this;
    }
    return BgaSlideAnimation;
}(BgaAnimation));
function shouldAnimate(settings) {
    var _a;
    return document.visibilityState !== 'hidden' && !((_a = settings === null || settings === void 0 ? void 0 : settings.game) === null || _a === void 0 ? void 0 : _a.instantaneousMode);
}
/**
 * Return the x and y delta, based on the animation settings;
 *
 * @param settings an `AnimationSettings` object
 * @returns a promise when animation ends
 */
function getDeltaCoordinates(element, settings) {
    var _a;
    if (!settings.fromDelta && !settings.fromRect && !settings.fromElement) {
        throw new Error("[bga-animation] fromDelta, fromRect or fromElement need to be set");
    }
    var x = 0;
    var y = 0;
    if (settings.fromDelta) {
        x = settings.fromDelta.x;
        y = settings.fromDelta.y;
    }
    else {
        var originBR = (_a = settings.fromRect) !== null && _a !== void 0 ? _a : settings.fromElement.getBoundingClientRect();
        // TODO make it an option ?
        var originalTransform = element.style.transform;
        element.style.transform = '';
        var destinationBR = element.getBoundingClientRect();
        element.style.transform = originalTransform;
        x = (destinationBR.left + destinationBR.right) / 2 - (originBR.left + originBR.right) / 2;
        y = (destinationBR.top + destinationBR.bottom) / 2 - (originBR.top + originBR.bottom) / 2;
    }
    if (settings.scale) {
        x /= settings.scale;
        y /= settings.scale;
    }
    return { x: x, y: y };
}
function logAnimation(animationManager, animation) {
    var settings = animation.settings;
    var element = settings.element;
    if (element) {
        console.log(animation, settings, element, element.getBoundingClientRect(), element.style.transform);
    }
    else {
        console.log(animation, settings);
    }
    return Promise.resolve(false);
}
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var AnimationManager = /** @class */ (function () {
    /**
     * @param game the BGA game class, usually it will be `this`
     * @param settings: a `AnimationManagerSettings` object
     */
    function AnimationManager(game, settings) {
        this.game = game;
        this.settings = settings;
        this.zoomManager = settings === null || settings === void 0 ? void 0 : settings.zoomManager;
        if (!game) {
            throw new Error('You must set your game as the first parameter of AnimationManager');
        }
    }
    AnimationManager.prototype.getZoomManager = function () {
        return this.zoomManager;
    };
    /**
     * Set the zoom manager, to get the scale of the current game.
     *
     * @param zoomManager the zoom manager
     */
    AnimationManager.prototype.setZoomManager = function (zoomManager) {
        this.zoomManager = zoomManager;
    };
    AnimationManager.prototype.getSettings = function () {
        return this.settings;
    };
    /**
     * Returns if the animations are active. Animation aren't active when the window is not visible (`document.visibilityState === 'hidden'`), or `game.instantaneousMode` is true.
     *
     * @returns if the animations are active.
     */
    AnimationManager.prototype.animationsActive = function () {
        return document.visibilityState !== 'hidden' && !this.game.instantaneousMode;
    };
    /**
     * Plays an animation if the animations are active. Animation aren't active when the window is not visible (`document.visibilityState === 'hidden'`), or `game.instantaneousMode` is true.
     *
     * @param animation the animation to play
     * @returns the animation promise.
     */
    AnimationManager.prototype.play = function (animation) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        return __awaiter(this, void 0, void 0, function () {
            var settings, _m;
            return __generator(this, function (_o) {
                switch (_o.label) {
                    case 0:
                        animation.played = animation.playWhenNoAnimation || this.animationsActive();
                        if (!animation.played) return [3 /*break*/, 2];
                        settings = animation.settings;
                        (_a = settings.animationStart) === null || _a === void 0 ? void 0 : _a.call(settings, animation);
                        (_b = settings.element) === null || _b === void 0 ? void 0 : _b.classList.add((_c = settings.animationClass) !== null && _c !== void 0 ? _c : 'bga-animations_animated');
                        animation.settings = __assign(__assign({}, animation.settings), { duration: (_e = (_d = this.settings) === null || _d === void 0 ? void 0 : _d.duration) !== null && _e !== void 0 ? _e : 500, scale: (_g = (_f = this.zoomManager) === null || _f === void 0 ? void 0 : _f.zoom) !== null && _g !== void 0 ? _g : undefined });
                        _m = animation;
                        return [4 /*yield*/, animation.animationFunction(this, animation)];
                    case 1:
                        _m.result = _o.sent();
                        (_j = (_h = animation.settings).animationEnd) === null || _j === void 0 ? void 0 : _j.call(_h, animation);
                        (_k = settings.element) === null || _k === void 0 ? void 0 : _k.classList.remove((_l = settings.animationClass) !== null && _l !== void 0 ? _l : 'bga-animations_animated');
                        return [3 /*break*/, 3];
                    case 2: return [2 /*return*/, Promise.resolve(animation)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Plays multiple animations in parallel.
     *
     * @param animations the animations to play
     * @returns a promise for all animations.
     */
    AnimationManager.prototype.playParallel = function (animations) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, Promise.all(animations.map(function (animation) { return _this.play(animation); }))];
            });
        });
    };
    /**
     * Plays multiple animations in sequence (the second when the first ends, ...).
     *
     * @param animations the animations to play
     * @returns a promise for all animations.
     */
    AnimationManager.prototype.playSequence = function (animations) {
        return __awaiter(this, void 0, void 0, function () {
            var result, others;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!animations.length) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.play(animations[0])];
                    case 1:
                        result = _a.sent();
                        return [4 /*yield*/, this.playSequence(animations.slice(1))];
                    case 2:
                        others = _a.sent();
                        return [2 /*return*/, __spreadArray([result], others, true)];
                    case 3: return [2 /*return*/, Promise.resolve([])];
                }
            });
        });
    };
    /**
     * Plays multiple animations with a delay between each animation start.
     *
     * @param animations the animations to play
     * @param delay the delay (in ms)
     * @returns a promise for all animations.
     */
    AnimationManager.prototype.playWithDelay = function (animations, delay) {
        return __awaiter(this, void 0, void 0, function () {
            var promise;
            var _this = this;
            return __generator(this, function (_a) {
                promise = new Promise(function (success) {
                    var promises = [];
                    var _loop_1 = function (i) {
                        setTimeout(function () {
                            promises.push(_this.play(animations[i]));
                            if (i == animations.length - 1) {
                                Promise.all(promises).then(function (result) {
                                    success(result);
                                });
                            }
                        }, i * delay);
                    };
                    for (var i = 0; i < animations.length; i++) {
                        _loop_1(i);
                    }
                });
                return [2 /*return*/, promise];
            });
        });
    };
    /**
     * Attach an element to a parent, then play animation from element's origin to its new position.
     *
     * @param animation the animation function
     * @param attachElement the destination parent
     * @returns a promise when animation ends
     */
    AnimationManager.prototype.attachWithAnimation = function (animation, attachElement) {
        var attachWithAnimation = new BgaAttachWithAnimation({
            animation: animation,
            attachElement: attachElement
        });
        return this.play(attachWithAnimation);
    };
    return AnimationManager;
}());
/**
 * The abstract stock. It shouldn't be used directly, use stocks that extends it.
 */
var CardStock = /** @class */ (function () {
    /**
     * @param manager the card manager
     * @param element the stock element (should be an empty HTML Element)
     */
    function CardStock(manager, element, settings) {
        this.manager = manager;
        this.element = element;
        this.settings = settings;
        this.cards = [];
        this.selectedCards = [];
        this.selectionMode = 'none';
        manager.addStock(this);
        element === null || element === void 0 ? void 0 : element.classList.add('card-stock' /*, this.constructor.name.split(/(?=[A-Z])/).join('-').toLowerCase()* doesn't work in production because of minification */);
        this.bindClick();
        this.sort = settings === null || settings === void 0 ? void 0 : settings.sort;
    }
    /**
     * @returns the cards on the stock
     */
    CardStock.prototype.getCards = function () {
        return this.cards.slice();
    };
    /**
     * @returns if the stock is empty
     */
    CardStock.prototype.isEmpty = function () {
        return !this.cards.length;
    };
    /**
     * @returns the selected cards
     */
    CardStock.prototype.getSelection = function () {
        return this.selectedCards.slice();
    };
    /**
     * @returns the selected cards
     */
    CardStock.prototype.isSelected = function (card) {
        var _this = this;
        return this.selectedCards.some(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); });
    };
    /**
     * @param card a card
     * @returns if the card is present in the stock
     */
    CardStock.prototype.contains = function (card) {
        var _this = this;
        return this.cards.some(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); });
    };
    /**
     * @param card a card in the stock
     * @returns the HTML element generated for the card
     */
    CardStock.prototype.getCardElement = function (card) {
        return this.manager.getCardElement(card);
    };
    /**
     * Checks if the card can be added. By default, only if it isn't already present in the stock.
     *
     * @param card the card to add
     * @param settings the addCard settings
     * @returns if the card can be added
     */
    CardStock.prototype.canAddCard = function (card, settings) {
        return !this.contains(card);
    };
    /**
     * Add a card to the stock.
     *
     * @param card the card to add
     * @param animation a `CardAnimation` object
     * @param settings a `AddCardSettings` object
     * @returns the promise when the animation is done (true if it was animated, false if it wasn't)
     */
    CardStock.prototype.addCard = function (card, animation, settings) {
        var _this = this;
        var _a, _b, _c;
        if (!this.canAddCard(card, settings)) {
            return Promise.resolve(false);
        }
        var promise;
        // we check if card is in a stock
        var originStock = this.manager.getCardStock(card);
        var index = this.getNewCardIndex(card);
        var settingsWithIndex = __assign({ index: index }, (settings !== null && settings !== void 0 ? settings : {}));
        var updateInformations = (_a = settingsWithIndex.updateInformations) !== null && _a !== void 0 ? _a : true;
        if (originStock === null || originStock === void 0 ? void 0 : originStock.contains(card)) {
            var element = this.getCardElement(card);
            promise = this.moveFromOtherStock(card, element, __assign(__assign({}, animation), { fromStock: originStock }), settingsWithIndex);
            if (!updateInformations) {
                element.dataset.side = ((_b = settingsWithIndex === null || settingsWithIndex === void 0 ? void 0 : settingsWithIndex.visible) !== null && _b !== void 0 ? _b : this.manager.isCardVisible(card)) ? 'front' : 'back';
            }
        }
        else if ((animation === null || animation === void 0 ? void 0 : animation.fromStock) && animation.fromStock.contains(card)) {
            var element = this.getCardElement(card);
            promise = this.moveFromOtherStock(card, element, animation, settingsWithIndex);
        }
        else {
            var element = this.manager.createCardElement(card, ((_c = settingsWithIndex === null || settingsWithIndex === void 0 ? void 0 : settingsWithIndex.visible) !== null && _c !== void 0 ? _c : this.manager.isCardVisible(card)));
            promise = this.moveFromElement(card, element, animation, settingsWithIndex);
        }
        if (settingsWithIndex.index !== null && settingsWithIndex.index !== undefined) {
            this.cards.splice(index, 0, card);
        }
        else {
            this.cards.push(card);
        }
        if (updateInformations) { // after splice/push
            this.manager.updateCardInformations(card);
        }
        if (!promise) {
            console.warn("CardStock.addCard didn't return a Promise");
            promise = Promise.resolve(false);
        }
        if (this.selectionMode !== 'none') {
            // make selectable only at the end of the animation
            promise.then(function () { var _a; return _this.setSelectableCard(card, (_a = settingsWithIndex.selectable) !== null && _a !== void 0 ? _a : true); });
        }
        return promise;
    };
    CardStock.prototype.getNewCardIndex = function (card) {
        if (this.sort) {
            var otherCards = this.getCards();
            for (var i = 0; i < otherCards.length; i++) {
                var otherCard = otherCards[i];
                if (this.sort(card, otherCard) < 0) {
                    return i;
                }
            }
            return otherCards.length;
        }
        else {
            return undefined;
        }
    };
    CardStock.prototype.addCardElementToParent = function (cardElement, settings) {
        var _a;
        var parent = (_a = settings === null || settings === void 0 ? void 0 : settings.forceToElement) !== null && _a !== void 0 ? _a : this.element;
        if ((settings === null || settings === void 0 ? void 0 : settings.index) === null || (settings === null || settings === void 0 ? void 0 : settings.index) === undefined || !parent.children.length || (settings === null || settings === void 0 ? void 0 : settings.index) >= parent.children.length) {
            parent.appendChild(cardElement);
        }
        else {
            parent.insertBefore(cardElement, parent.children[settings.index]);
        }
    };
    CardStock.prototype.moveFromOtherStock = function (card, cardElement, animation, settings) {
        var promise;
        var element = animation.fromStock.contains(card) ? this.manager.getCardElement(card) : animation.fromStock.element;
        var fromRect = element.getBoundingClientRect();
        this.addCardElementToParent(cardElement, settings);
        this.removeSelectionClassesFromElement(cardElement);
        promise = this.animationFromElement(cardElement, fromRect, {
            originalSide: animation.originalSide,
            rotationDelta: animation.rotationDelta,
            animation: animation.animation,
        });
        // in the case the card was move inside the same stock we don't remove it
        if (animation.fromStock && animation.fromStock != this) {
            animation.fromStock.removeCard(card);
        }
        if (!promise) {
            console.warn("CardStock.moveFromOtherStock didn't return a Promise");
            promise = Promise.resolve(false);
        }
        return promise;
    };
    CardStock.prototype.moveFromElement = function (card, cardElement, animation, settings) {
        var promise;
        this.addCardElementToParent(cardElement, settings);
        if (animation) {
            if (animation.fromStock) {
                promise = this.animationFromElement(cardElement, animation.fromStock.element.getBoundingClientRect(), {
                    originalSide: animation.originalSide,
                    rotationDelta: animation.rotationDelta,
                    animation: animation.animation,
                });
                animation.fromStock.removeCard(card);
            }
            else if (animation.fromElement) {
                promise = this.animationFromElement(cardElement, animation.fromElement.getBoundingClientRect(), {
                    originalSide: animation.originalSide,
                    rotationDelta: animation.rotationDelta,
                    animation: animation.animation,
                });
            }
        }
        else {
            promise = Promise.resolve(false);
        }
        if (!promise) {
            console.warn("CardStock.moveFromElement didn't return a Promise");
            promise = Promise.resolve(false);
        }
        return promise;
    };
    /**
     * Add an array of cards to the stock.
     *
     * @param cards the cards to add
     * @param animation a `CardAnimation` object
     * @param settings a `AddCardSettings` object
     * @param shift if number, the number of milliseconds between each card. if true, chain animations
     */
    CardStock.prototype.addCards = function (cards, animation, settings, shift) {
        if (shift === void 0) { shift = false; }
        return __awaiter(this, void 0, void 0, function () {
            var promises, result, others, _loop_2, i, results;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.manager.animationsActive()) {
                            shift = false;
                        }
                        promises = [];
                        if (!(shift === true)) return [3 /*break*/, 4];
                        if (!cards.length) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.addCard(cards[0], animation, settings)];
                    case 1:
                        result = _a.sent();
                        return [4 /*yield*/, this.addCards(cards.slice(1), animation, settings, shift)];
                    case 2:
                        others = _a.sent();
                        return [2 /*return*/, result || others];
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        if (typeof shift === 'number') {
                            _loop_2 = function (i) {
                                setTimeout(function () { return promises.push(_this.addCard(cards[i], animation, settings)); }, i * shift);
                            };
                            for (i = 0; i < cards.length; i++) {
                                _loop_2(i);
                            }
                        }
                        else {
                            promises = cards.map(function (card) { return _this.addCard(card, animation, settings); });
                        }
                        _a.label = 5;
                    case 5: return [4 /*yield*/, Promise.all(promises)];
                    case 6:
                        results = _a.sent();
                        return [2 /*return*/, results.some(function (result) { return result; })];
                }
            });
        });
    };
    /**
     * Remove a card from the stock.
     *
     * @param card the card to remove
     * @param settings a `RemoveCardSettings` object
     */
    CardStock.prototype.removeCard = function (card, settings) {
        if (this.contains(card) && this.element.contains(this.getCardElement(card))) {
            this.manager.removeCard(card, settings);
        }
        this.cardRemoved(card, settings);
    };
    /**
     * Notify the stock that a card is removed.
     *
     * @param card the card to remove
     * @param settings a `RemoveCardSettings` object
     */
    CardStock.prototype.cardRemoved = function (card, settings) {
        var _this = this;
        var index = this.cards.findIndex(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); });
        if (index !== -1) {
            this.cards.splice(index, 1);
        }
        if (this.selectedCards.find(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); })) {
            this.unselectCard(card);
        }
    };
    /**
     * Remove a set of card from the stock.
     *
     * @param cards the cards to remove
     * @param settings a `RemoveCardSettings` object
     */
    CardStock.prototype.removeCards = function (cards, settings) {
        var _this = this;
        cards.forEach(function (card) { return _this.removeCard(card, settings); });
    };
    /**
     * Remove all cards from the stock.
     * @param settings a `RemoveCardSettings` object
     */
    CardStock.prototype.removeAll = function (settings) {
        var _this = this;
        var cards = this.getCards(); // use a copy of the array as we iterate and modify it at the same time
        cards.forEach(function (card) { return _this.removeCard(card, settings); });
    };
    /**
     * Set if the stock is selectable, and if yes if it can be multiple.
     * If set to 'none', it will unselect all selected cards.
     *
     * @param selectionMode the selection mode
     * @param selectableCards the selectable cards (all if unset). Calls `setSelectableCards` method
     */
    CardStock.prototype.setSelectionMode = function (selectionMode, selectableCards) {
        var _this = this;
        if (selectionMode !== this.selectionMode) {
            this.unselectAll(true);
        }
        this.cards.forEach(function (card) { return _this.setSelectableCard(card, selectionMode != 'none'); });
        this.element.classList.toggle('bga-cards_selectable-stock', selectionMode != 'none');
        this.selectionMode = selectionMode;
        if (selectionMode === 'none') {
            this.getCards().forEach(function (card) { return _this.removeSelectionClasses(card); });
        }
        else {
            this.setSelectableCards(selectableCards !== null && selectableCards !== void 0 ? selectableCards : this.getCards());
        }
    };
    CardStock.prototype.setSelectableCard = function (card, selectable) {
        if (this.selectionMode === 'none') {
            return;
        }
        var element = this.getCardElement(card);
        var selectableCardsClass = this.getSelectableCardClass();
        var unselectableCardsClass = this.getUnselectableCardClass();
        if (selectableCardsClass) {
            element === null || element === void 0 ? void 0 : element.classList.toggle(selectableCardsClass, selectable);
        }
        if (unselectableCardsClass) {
            element === null || element === void 0 ? void 0 : element.classList.toggle(unselectableCardsClass, !selectable);
        }
        if (!selectable && this.isSelected(card)) {
            this.unselectCard(card, true);
        }
    };
    /**
     * Set the selectable class for each card.
     *
     * @param selectableCards the selectable cards. If unset, all cards are marked selectable. Default unset.
     */
    CardStock.prototype.setSelectableCards = function (selectableCards) {
        var _this = this;
        if (this.selectionMode === 'none') {
            return;
        }
        var selectableCardsIds = (selectableCards !== null && selectableCards !== void 0 ? selectableCards : this.getCards()).map(function (card) { return _this.manager.getId(card); });
        this.cards.forEach(function (card) {
            return _this.setSelectableCard(card, selectableCardsIds.includes(_this.manager.getId(card)));
        });
    };
    /**
     * Set selected state to a card.
     *
     * @param card the card to select
     */
    CardStock.prototype.selectCard = function (card, silent) {
        var _this = this;
        var _a;
        if (silent === void 0) { silent = false; }
        if (this.selectionMode == 'none') {
            return;
        }
        var element = this.getCardElement(card);
        var selectableCardsClass = this.getSelectableCardClass();
        if (!element || !element.classList.contains(selectableCardsClass)) {
            return;
        }
        if (this.selectionMode === 'single') {
            this.cards.filter(function (c) { return _this.manager.getId(c) != _this.manager.getId(card); }).forEach(function (c) { return _this.unselectCard(c, true); });
        }
        var selectedCardsClass = this.getSelectedCardClass();
        element.classList.add(selectedCardsClass);
        this.selectedCards.push(card);
        if (!silent) {
            (_a = this.onSelectionChange) === null || _a === void 0 ? void 0 : _a.call(this, this.selectedCards.slice(), card);
        }
    };
    /**
     * Set unselected state to a card.
     *
     * @param card the card to unselect
     */
    CardStock.prototype.unselectCard = function (card, silent) {
        var _this = this;
        var _a;
        if (silent === void 0) { silent = false; }
        var element = this.getCardElement(card);
        var selectedCardsClass = this.getSelectedCardClass();
        element === null || element === void 0 ? void 0 : element.classList.remove(selectedCardsClass);
        var index = this.selectedCards.findIndex(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); });
        if (index !== -1) {
            this.selectedCards.splice(index, 1);
        }
        if (!silent) {
            (_a = this.onSelectionChange) === null || _a === void 0 ? void 0 : _a.call(this, this.selectedCards.slice(), card);
        }
    };
    /**
     * Select all cards
     */
    CardStock.prototype.selectAll = function (silent) {
        var _this = this;
        var _a;
        if (silent === void 0) { silent = false; }
        if (this.selectionMode == 'none') {
            return;
        }
        this.cards.forEach(function (c) { return _this.selectCard(c, true); });
        if (!silent) {
            (_a = this.onSelectionChange) === null || _a === void 0 ? void 0 : _a.call(this, this.selectedCards.slice(), null);
        }
    };
    /**
     * Unelect all cards
     */
    CardStock.prototype.unselectAll = function (silent) {
        var _this = this;
        var _a;
        if (silent === void 0) { silent = false; }
        var cards = this.getCards(); // use a copy of the array as we iterate and modify it at the same time
        cards.forEach(function (c) { return _this.unselectCard(c, true); });
        if (!silent) {
            (_a = this.onSelectionChange) === null || _a === void 0 ? void 0 : _a.call(this, this.selectedCards.slice(), null);
        }
    };
    CardStock.prototype.bindClick = function () {
        var _this = this;
        var _a;
        (_a = this.element) === null || _a === void 0 ? void 0 : _a.addEventListener('click', function (event) {
            var cardDiv = event.target.closest('.card');
            if (!cardDiv) {
                return;
            }
            var card = _this.cards.find(function (c) { return _this.manager.getId(c) == cardDiv.id; });
            if (!card) {
                return;
            }
            _this.cardClick(card);
        });
    };
    CardStock.prototype.cardClick = function (card) {
        var _this = this;
        var _a;
        if (this.selectionMode != 'none') {
            var alreadySelected = this.selectedCards.some(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); });
            if (alreadySelected) {
                this.unselectCard(card);
            }
            else {
                this.selectCard(card);
            }
        }
        (_a = this.onCardClick) === null || _a === void 0 ? void 0 : _a.call(this, card);
    };
    /**
     * @param element The element to animate. The element is added to the destination stock before the animation starts.
     * @param fromElement The HTMLElement to animate from.
     */
    CardStock.prototype.animationFromElement = function (element, fromRect, settings) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var side, cardSides_1, animation, result;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        side = element.dataset.side;
                        if (settings.originalSide && settings.originalSide != side) {
                            cardSides_1 = element.getElementsByClassName('card-sides')[0];
                            cardSides_1.style.transition = 'none';
                            element.dataset.side = settings.originalSide;
                            setTimeout(function () {
                                cardSides_1.style.transition = null;
                                element.dataset.side = side;
                            });
                        }
                        animation = settings.animation;
                        if (animation) {
                            animation.settings.element = element;
                            animation.settings.fromRect = fromRect;
                        }
                        else {
                            animation = new BgaSlideAnimation({ element: element, fromRect: fromRect });
                        }
                        return [4 /*yield*/, this.manager.animationManager.play(animation)];
                    case 1:
                        result = _b.sent();
                        return [2 /*return*/, (_a = result === null || result === void 0 ? void 0 : result.played) !== null && _a !== void 0 ? _a : false];
                }
            });
        });
    };
    /**
     * Set the card to its front (visible) or back (not visible) side.
     *
     * @param card the card informations
     */
    CardStock.prototype.setCardVisible = function (card, visible, settings) {
        this.manager.setCardVisible(card, visible, settings);
    };
    /**
     * Flips the card.
     *
     * @param card the card informations
     */
    CardStock.prototype.flipCard = function (card, settings) {
        this.manager.flipCard(card, settings);
    };
    /**
     * @returns the class to apply to selectable cards. Use class from manager is unset.
     */
    CardStock.prototype.getSelectableCardClass = function () {
        var _a, _b;
        return ((_a = this.settings) === null || _a === void 0 ? void 0 : _a.selectableCardClass) === undefined ? this.manager.getSelectableCardClass() : (_b = this.settings) === null || _b === void 0 ? void 0 : _b.selectableCardClass;
    };
    /**
     * @returns the class to apply to selectable cards. Use class from manager is unset.
     */
    CardStock.prototype.getUnselectableCardClass = function () {
        var _a, _b;
        return ((_a = this.settings) === null || _a === void 0 ? void 0 : _a.unselectableCardClass) === undefined ? this.manager.getUnselectableCardClass() : (_b = this.settings) === null || _b === void 0 ? void 0 : _b.unselectableCardClass;
    };
    /**
     * @returns the class to apply to selected cards. Use class from manager is unset.
     */
    CardStock.prototype.getSelectedCardClass = function () {
        var _a, _b;
        return ((_a = this.settings) === null || _a === void 0 ? void 0 : _a.selectedCardClass) === undefined ? this.manager.getSelectedCardClass() : (_b = this.settings) === null || _b === void 0 ? void 0 : _b.selectedCardClass;
    };
    CardStock.prototype.removeSelectionClasses = function (card) {
        this.removeSelectionClassesFromElement(this.getCardElement(card));
    };
    CardStock.prototype.removeSelectionClassesFromElement = function (cardElement) {
        var selectableCardsClass = this.getSelectableCardClass();
        var unselectableCardsClass = this.getUnselectableCardClass();
        var selectedCardsClass = this.getSelectedCardClass();
        cardElement === null || cardElement === void 0 ? void 0 : cardElement.classList.remove(selectableCardsClass, unselectableCardsClass, selectedCardsClass);
    };
    return CardStock;
}());
var SlideAndBackAnimation = /** @class */ (function (_super) {
    __extends(SlideAndBackAnimation, _super);
    function SlideAndBackAnimation(manager, element, tempElement) {
        var distance = (manager.getCardWidth() + manager.getCardHeight()) / 2;
        var angle = Math.random() * Math.PI * 2;
        var fromDelta = {
            x: distance * Math.cos(angle),
            y: distance * Math.sin(angle),
        };
        return _super.call(this, {
            animations: [
                new BgaSlideToAnimation({ element: element, fromDelta: fromDelta, duration: 250 }),
                new BgaSlideAnimation({ element: element, fromDelta: fromDelta, duration: 250, animationEnd: tempElement ? (function () { return element.remove(); }) : undefined }),
            ]
        }) || this;
    }
    return SlideAndBackAnimation;
}(BgaCumulatedAnimation));
/**
 * Abstract stock to represent a deck. (pile of cards, with a fake 3d effect of thickness). *
 * Needs cardWidth and cardHeight to be set in the card manager.
 */
var Deck = /** @class */ (function (_super) {
    __extends(Deck, _super);
    function Deck(manager, element, settings) {
        var _this = this;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        _this = _super.call(this, manager, element) || this;
        _this.manager = manager;
        _this.element = element;
        element.classList.add('deck');
        var cardWidth = _this.manager.getCardWidth();
        var cardHeight = _this.manager.getCardHeight();
        if (cardWidth && cardHeight) {
            _this.element.style.setProperty('--width', "".concat(cardWidth, "px"));
            _this.element.style.setProperty('--height', "".concat(cardHeight, "px"));
        }
        else {
            throw new Error("You need to set cardWidth and cardHeight in the card manager to use Deck.");
        }
        _this.thicknesses = (_a = settings.thicknesses) !== null && _a !== void 0 ? _a : [0, 2, 5, 10, 20, 30];
        _this.setCardNumber((_b = settings.cardNumber) !== null && _b !== void 0 ? _b : 52);
        _this.autoUpdateCardNumber = (_c = settings.autoUpdateCardNumber) !== null && _c !== void 0 ? _c : true;
        _this.autoRemovePreviousCards = (_d = settings.autoRemovePreviousCards) !== null && _d !== void 0 ? _d : true;
        var shadowDirection = (_e = settings.shadowDirection) !== null && _e !== void 0 ? _e : 'bottom-right';
        var shadowDirectionSplit = shadowDirection.split('-');
        var xShadowShift = shadowDirectionSplit.includes('right') ? 1 : (shadowDirectionSplit.includes('left') ? -1 : 0);
        var yShadowShift = shadowDirectionSplit.includes('bottom') ? 1 : (shadowDirectionSplit.includes('top') ? -1 : 0);
        _this.element.style.setProperty('--xShadowShift', '' + xShadowShift);
        _this.element.style.setProperty('--yShadowShift', '' + yShadowShift);
        if (settings.topCard) {
            _this.addCard(settings.topCard, undefined);
        }
        else if (settings.cardNumber > 0) {
            console.warn("Deck is defined with ".concat(settings.cardNumber, " cards but no top card !"));
        }
        if (settings.counter && ((_f = settings.counter.show) !== null && _f !== void 0 ? _f : true)) {
            if (settings.cardNumber === null || settings.cardNumber === undefined) {
                throw new Error("You need to set cardNumber if you want to show the counter");
            }
            else {
                _this.createCounter((_g = settings.counter.position) !== null && _g !== void 0 ? _g : 'bottom', (_h = settings.counter.extraClasses) !== null && _h !== void 0 ? _h : 'round', settings.counter.counterId);
                if ((_j = settings.counter) === null || _j === void 0 ? void 0 : _j.hideWhenEmpty) {
                    _this.element.querySelector('.bga-cards_deck-counter').classList.add('hide-when-empty');
                }
            }
        }
        _this.setCardNumber((_k = settings.cardNumber) !== null && _k !== void 0 ? _k : 52);
        return _this;
    }
    Deck.prototype.createCounter = function (counterPosition, extraClasses, counterId) {
        var left = counterPosition.includes('right') ? 100 : (counterPosition.includes('left') ? 0 : 50);
        var top = counterPosition.includes('bottom') ? 100 : (counterPosition.includes('top') ? 0 : 50);
        this.element.style.setProperty('--bga-cards-deck-left', "".concat(left, "%"));
        this.element.style.setProperty('--bga-cards-deck-top', "".concat(top, "%"));
        this.element.insertAdjacentHTML('beforeend', "\n            <div ".concat(counterId ? "id=\"".concat(counterId, "\"") : '', " class=\"bga-cards_deck-counter ").concat(extraClasses, "\"></div>\n        "));
    };
    /**
     * Get the the cards number.
     *
     * @returns the cards number
     */
    Deck.prototype.getCardNumber = function () {
        return this.cardNumber;
    };
    /**
     * Set the the cards number.
     *
     * @param cardNumber the cards number
     */
    Deck.prototype.setCardNumber = function (cardNumber, topCard) {
        var _this = this;
        if (topCard === void 0) { topCard = null; }
        if (topCard) {
            this.addCard(topCard);
        }
        this.cardNumber = cardNumber;
        this.element.dataset.empty = (this.cardNumber == 0).toString();
        var thickness = 0;
        this.thicknesses.forEach(function (threshold, index) {
            if (_this.cardNumber >= threshold) {
                thickness = index;
            }
        });
        this.element.style.setProperty('--thickness', "".concat(thickness, "px"));
        var counterDiv = this.element.querySelector('.bga-cards_deck-counter');
        if (counterDiv) {
            counterDiv.innerHTML = "".concat(cardNumber);
        }
    };
    Deck.prototype.addCard = function (card, animation, settings) {
        var _this = this;
        var _a, _b;
        if ((_a = settings === null || settings === void 0 ? void 0 : settings.autoUpdateCardNumber) !== null && _a !== void 0 ? _a : this.autoUpdateCardNumber) {
            this.setCardNumber(this.cardNumber + 1);
        }
        var promise = _super.prototype.addCard.call(this, card, animation, settings);
        if ((_b = settings === null || settings === void 0 ? void 0 : settings.autoRemovePreviousCards) !== null && _b !== void 0 ? _b : this.autoRemovePreviousCards) {
            promise.then(function () {
                var previousCards = _this.getCards().slice(0, -1); // remove last cards
                _this.removeCards(previousCards, { autoUpdateCardNumber: false });
            });
        }
        return promise;
    };
    Deck.prototype.cardRemoved = function (card, settings) {
        var _a;
        if ((_a = settings === null || settings === void 0 ? void 0 : settings.autoUpdateCardNumber) !== null && _a !== void 0 ? _a : this.autoUpdateCardNumber) {
            this.setCardNumber(this.cardNumber - 1);
        }
        _super.prototype.cardRemoved.call(this, card, settings);
    };
    Deck.prototype.getTopCard = function () {
        var cards = this.getCards();
        return cards.length ? cards[cards.length - 1] : null;
    };
    /**
     * Shows a shuffle animation on the deck
     *
     * @param animatedCardsMax number of animated cards for shuffle animation.
     * @param fakeCardSetter a function to generate a fake card for animation. Required if the card id is not based on a numerci `id` field, or if you want to set custom card back
     * @returns promise when animation ends
     */
    Deck.prototype.shuffle = function (animatedCardsMax, fakeCardSetter) {
        if (animatedCardsMax === void 0) { animatedCardsMax = 10; }
        return __awaiter(this, void 0, void 0, function () {
            var animatedCards, elements, i, newCard, newElement;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.manager.animationsActive()) {
                            return [2 /*return*/, Promise.resolve(false)]; // we don't execute as it's just visual temporary stuff
                        }
                        animatedCards = Math.min(10, animatedCardsMax, this.getCardNumber());
                        if (!(animatedCards > 1)) return [3 /*break*/, 2];
                        elements = [this.getCardElement(this.getTopCard())];
                        for (i = elements.length; i <= animatedCards; i++) {
                            newCard = {};
                            if (fakeCardSetter) {
                                fakeCardSetter(newCard, i);
                            }
                            else {
                                newCard.id = -100000 + i;
                            }
                            newElement = this.manager.createCardElement(newCard, false);
                            newElement.dataset.tempCardForShuffleAnimation = 'true';
                            this.element.prepend(newElement);
                            elements.push(newElement);
                        }
                        return [4 /*yield*/, this.manager.animationManager.playWithDelay(elements.map(function (element) { return new SlideAndBackAnimation(_this.manager, element, element.dataset.tempCardForShuffleAnimation == 'true'); }), 50)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 2: return [2 /*return*/, Promise.resolve(false)];
                }
            });
        });
    };
    return Deck;
}(CardStock));
/**
 * A basic stock for a list of cards, based on flex.
 */
var LineStock = /** @class */ (function (_super) {
    __extends(LineStock, _super);
    /**
     * @param manager the card manager
     * @param element the stock element (should be an empty HTML Element)
     * @param settings a `LineStockSettings` object
     */
    function LineStock(manager, element, settings) {
        var _this = this;
        var _a, _b, _c, _d;
        _this = _super.call(this, manager, element, settings) || this;
        _this.manager = manager;
        _this.element = element;
        element.classList.add('line-stock');
        element.dataset.center = ((_a = settings === null || settings === void 0 ? void 0 : settings.center) !== null && _a !== void 0 ? _a : true).toString();
        element.style.setProperty('--wrap', (_b = settings === null || settings === void 0 ? void 0 : settings.wrap) !== null && _b !== void 0 ? _b : 'wrap');
        element.style.setProperty('--direction', (_c = settings === null || settings === void 0 ? void 0 : settings.direction) !== null && _c !== void 0 ? _c : 'row');
        element.style.setProperty('--gap', (_d = settings === null || settings === void 0 ? void 0 : settings.gap) !== null && _d !== void 0 ? _d : '8px');
        return _this;
    }
    return LineStock;
}(CardStock));
/**
 * A stock with fixed slots (some can be empty)
 */
var SlotStock = /** @class */ (function (_super) {
    __extends(SlotStock, _super);
    /**
     * @param manager the card manager
     * @param element the stock element (should be an empty HTML Element)
     * @param settings a `SlotStockSettings` object
     */
    function SlotStock(manager, element, settings) {
        var _this = this;
        var _a, _b;
        _this = _super.call(this, manager, element, settings) || this;
        _this.manager = manager;
        _this.element = element;
        _this.slotsIds = [];
        _this.slots = [];
        element.classList.add('slot-stock');
        _this.mapCardToSlot = settings.mapCardToSlot;
        _this.slotsIds = (_a = settings.slotsIds) !== null && _a !== void 0 ? _a : [];
        _this.slotClasses = (_b = settings.slotClasses) !== null && _b !== void 0 ? _b : [];
        _this.slotsIds.forEach(function (slotId) {
            _this.createSlot(slotId);
        });
        return _this;
    }
    SlotStock.prototype.createSlot = function (slotId) {
        var _a;
        this.slots[slotId] = document.createElement("div");
        this.slots[slotId].dataset.slotId = slotId;
        this.element.appendChild(this.slots[slotId]);
        (_a = this.slots[slotId].classList).add.apply(_a, __spreadArray(['slot'], this.slotClasses, true));
    };
    /**
     * Add a card to the stock.
     *
     * @param card the card to add
     * @param animation a `CardAnimation` object
     * @param settings a `AddCardToSlotSettings` object
     * @returns the promise when the animation is done (true if it was animated, false if it wasn't)
     */
    SlotStock.prototype.addCard = function (card, animation, settings) {
        var _a, _b;
        var slotId = (_a = settings === null || settings === void 0 ? void 0 : settings.slot) !== null && _a !== void 0 ? _a : (_b = this.mapCardToSlot) === null || _b === void 0 ? void 0 : _b.call(this, card);
        if (slotId === undefined) {
            throw new Error("Impossible to add card to slot : no SlotId. Add slotId to settings or set mapCardToSlot to SlotCard constructor.");
        }
        if (!this.slots[slotId]) {
            throw new Error("Impossible to add card to slot \"".concat(slotId, "\" : slot \"").concat(slotId, "\" doesn't exists."));
        }
        var newSettings = __assign(__assign({}, settings), { forceToElement: this.slots[slotId] });
        return _super.prototype.addCard.call(this, card, animation, newSettings);
    };
    /**
     * Change the slots ids. Will empty the stock before re-creating the slots.
     *
     * @param slotsIds the new slotsIds. Will replace the old ones.
     */
    SlotStock.prototype.setSlotsIds = function (slotsIds) {
        var _this = this;
        if (slotsIds.length == this.slotsIds.length && slotsIds.every(function (slotId, index) { return _this.slotsIds[index] === slotId; })) {
            // no change
            return;
        }
        this.removeAll();
        this.element.innerHTML = '';
        this.slotsIds = slotsIds !== null && slotsIds !== void 0 ? slotsIds : [];
        this.slotsIds.forEach(function (slotId) {
            _this.createSlot(slotId);
        });
    };
    SlotStock.prototype.canAddCard = function (card, settings) {
        var _a, _b;
        if (!this.contains(card)) {
            return true;
        }
        else {
            var currentCardSlot = this.getCardElement(card).closest('.slot').dataset.slotId;
            var slotId = (_a = settings === null || settings === void 0 ? void 0 : settings.slot) !== null && _a !== void 0 ? _a : (_b = this.mapCardToSlot) === null || _b === void 0 ? void 0 : _b.call(this, card);
            return currentCardSlot != slotId;
        }
    };
    /**
     * Swap cards inside the slot stock.
     *
     * @param cards the cards to swap
     * @param settings for `updateInformations` and `selectable`
     */
    SlotStock.prototype.swapCards = function (cards, settings) {
        var _this = this;
        if (!this.mapCardToSlot) {
            throw new Error('You need to define SlotStock.mapCardToSlot to use SlotStock.swapCards');
        }
        var promises = [];
        var elements = cards.map(function (card) { return _this.manager.getCardElement(card); });
        var elementsRects = elements.map(function (element) { return element.getBoundingClientRect(); });
        var cssPositions = elements.map(function (element) { return element.style.position; });
        // we set to absolute so it doesn't mess with slide coordinates when 2 div are at the same place
        elements.forEach(function (element) { return element.style.position = 'absolute'; });
        cards.forEach(function (card, index) {
            var _a, _b;
            var cardElement = elements[index];
            var promise;
            var slotId = (_a = _this.mapCardToSlot) === null || _a === void 0 ? void 0 : _a.call(_this, card);
            _this.slots[slotId].appendChild(cardElement);
            cardElement.style.position = cssPositions[index];
            var cardIndex = _this.cards.findIndex(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); });
            if (cardIndex !== -1) {
                _this.cards.splice(cardIndex, 1, card);
            }
            if ((_b = settings === null || settings === void 0 ? void 0 : settings.updateInformations) !== null && _b !== void 0 ? _b : true) { // after splice/push
                _this.manager.updateCardInformations(card);
            }
            _this.removeSelectionClassesFromElement(cardElement);
            promise = _this.animationFromElement(cardElement, elementsRects[index], {});
            if (!promise) {
                console.warn("CardStock.animationFromElement didn't return a Promise");
                promise = Promise.resolve(false);
            }
            promise.then(function () { var _a; return _this.setSelectableCard(card, (_a = settings === null || settings === void 0 ? void 0 : settings.selectable) !== null && _a !== void 0 ? _a : true); });
            promises.push(promise);
        });
        return Promise.all(promises);
    };
    return SlotStock;
}(LineStock));
/**
 * A stock to make cards disappear (to automatically remove discarded cards, or to represent a bag)
 */
var VoidStock = /** @class */ (function (_super) {
    __extends(VoidStock, _super);
    /**
     * @param manager the card manager
     * @param element the stock element (should be an empty HTML Element)
     */
    function VoidStock(manager, element) {
        var _this = _super.call(this, manager, element) || this;
        _this.manager = manager;
        _this.element = element;
        element.classList.add('void-stock');
        return _this;
    }
    /**
     * Add a card to the stock.
     *
     * @param card the card to add
     * @param animation a `CardAnimation` object
     * @param settings a `AddCardToVoidStockSettings` object
     * @returns the promise when the animation is done (true if it was animated, false if it wasn't)
     */
    VoidStock.prototype.addCard = function (card, animation, settings) {
        var _this = this;
        var _a;
        var promise = _super.prototype.addCard.call(this, card, animation, settings);
        // center the element
        var cardElement = this.getCardElement(card);
        var originalLeft = cardElement.style.left;
        var originalTop = cardElement.style.top;
        cardElement.style.left = "".concat((this.element.clientWidth - cardElement.clientWidth) / 2, "px");
        cardElement.style.top = "".concat((this.element.clientHeight - cardElement.clientHeight) / 2, "px");
        if (!promise) {
            console.warn("VoidStock.addCard didn't return a Promise");
            promise = Promise.resolve(false);
        }
        if ((_a = settings === null || settings === void 0 ? void 0 : settings.remove) !== null && _a !== void 0 ? _a : true) {
            return promise.then(function (result) {
                _this.removeCard(card);
                return result;
            });
        }
        else {
            cardElement.style.left = originalLeft;
            cardElement.style.top = originalTop;
            return promise;
        }
    };
    return VoidStock;
}(CardStock));
function sortFunction() {
    var sortedFields = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        sortedFields[_i] = arguments[_i];
    }
    return function (a, b) {
        for (var i = 0; i < sortedFields.length; i++) {
            var direction = 1;
            var field = sortedFields[i];
            if (field[0] == '-') {
                direction = -1;
                field = field.substring(1);
            }
            else if (field[0] == '+') {
                field = field.substring(1);
            }
            var type = typeof a[field];
            if (type === 'string') {
                var compare = a[field].localeCompare(b[field]);
                if (compare !== 0) {
                    return compare;
                }
            }
            else if (type === 'number') {
                var compare = (a[field] - b[field]) * direction;
                if (compare !== 0) {
                    return compare * direction;
                }
            }
        }
        return 0;
    };
}
var CardManager = /** @class */ (function () {
    /**
     * @param game the BGA game class, usually it will be `this`
     * @param settings: a `CardManagerSettings` object
     */
    function CardManager(game, settings) {
        var _a;
        this.game = game;
        this.settings = settings;
        this.stocks = [];
        this.updateFrontTimeoutId = [];
        this.updateBackTimeoutId = [];
        this.animationManager = (_a = settings.animationManager) !== null && _a !== void 0 ? _a : new AnimationManager(game);
    }
    /**
     * Returns if the animations are active. Animation aren't active when the window is not visible (`document.visibilityState === 'hidden'`), or `game.instantaneousMode` is true.
     *
     * @returns if the animations are active.
     */
    CardManager.prototype.animationsActive = function () {
        return this.animationManager.animationsActive();
    };
    CardManager.prototype.addStock = function (stock) {
        this.stocks.push(stock);
    };
    /**
     * @param card the card informations
     * @return the id for a card
     */
    CardManager.prototype.getId = function (card) {
        var _a, _b, _c;
        return (_c = (_b = (_a = this.settings).getId) === null || _b === void 0 ? void 0 : _b.call(_a, card)) !== null && _c !== void 0 ? _c : "card-".concat(card.id);
    };
    CardManager.prototype.createCardElement = function (card, visible) {
        var _a, _b, _c, _d, _e, _f;
        if (visible === void 0) { visible = true; }
        var id = this.getId(card);
        var side = visible ? 'front' : 'back';
        if (this.getCardElement(card)) {
            throw new Error('This card already exists ' + JSON.stringify(card));
        }
        var element = document.createElement("div");
        element.id = id;
        element.dataset.side = '' + side;
        element.innerHTML = "\n            <div class=\"card-sides\">\n                <div id=\"".concat(id, "-front\" class=\"card-side front\">\n                </div>\n                <div id=\"").concat(id, "-back\" class=\"card-side back\">\n                </div>\n            </div>\n        ");
        element.classList.add('card');
        document.body.appendChild(element);
        (_b = (_a = this.settings).setupDiv) === null || _b === void 0 ? void 0 : _b.call(_a, card, element);
        (_d = (_c = this.settings).setupFrontDiv) === null || _d === void 0 ? void 0 : _d.call(_c, card, element.getElementsByClassName('front')[0]);
        (_f = (_e = this.settings).setupBackDiv) === null || _f === void 0 ? void 0 : _f.call(_e, card, element.getElementsByClassName('back')[0]);
        document.body.removeChild(element);
        return element;
    };
    /**
     * @param card the card informations
     * @return the HTML element of an existing card
     */
    CardManager.prototype.getCardElement = function (card) {
        return document.getElementById(this.getId(card));
    };
    /**
     * Remove a card.
     *
     * @param card the card to remove
     * @param settings a `RemoveCardSettings` object
     */
    CardManager.prototype.removeCard = function (card, settings) {
        var _a;
        var id = this.getId(card);
        var div = document.getElementById(id);
        if (!div) {
            return false;
        }
        div.id = "deleted".concat(id);
        div.remove();
        // if the card is in a stock, notify the stock about removal
        (_a = this.getCardStock(card)) === null || _a === void 0 ? void 0 : _a.cardRemoved(card, settings);
        return true;
    };
    /**
     * Returns the stock containing the card.
     *
     * @param card the card informations
     * @return the stock containing the card
     */
    CardManager.prototype.getCardStock = function (card) {
        return this.stocks.find(function (stock) { return stock.contains(card); });
    };
    /**
     * Return if the card passed as parameter is suppose to be visible or not.
     * Use `isCardVisible` from settings if set, else will check if `card.type` is defined
     *
     * @param card the card informations
     * @return the visiblility of the card (true means front side should be displayed)
     */
    CardManager.prototype.isCardVisible = function (card) {
        var _a, _b, _c, _d;
        return (_c = (_b = (_a = this.settings).isCardVisible) === null || _b === void 0 ? void 0 : _b.call(_a, card)) !== null && _c !== void 0 ? _c : ((_d = card.type) !== null && _d !== void 0 ? _d : false);
    };
    /**
     * Set the card to its front (visible) or back (not visible) side.
     *
     * @param card the card informations
     * @param visible if the card is set to visible face. If unset, will use isCardVisible(card)
     * @param settings the flip params (to update the card in current stock)
     */
    CardManager.prototype.setCardVisible = function (card, visible, settings) {
        var _this = this;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        var element = this.getCardElement(card);
        if (!element) {
            return;
        }
        var isVisible = visible !== null && visible !== void 0 ? visible : this.isCardVisible(card);
        element.dataset.side = isVisible ? 'front' : 'back';
        var stringId = JSON.stringify(this.getId(card));
        if ((_a = settings === null || settings === void 0 ? void 0 : settings.updateFront) !== null && _a !== void 0 ? _a : true) {
            if (this.updateFrontTimeoutId[stringId]) { // make sure there is not a delayed animation that will overwrite the last flip request
                clearTimeout(this.updateFrontTimeoutId[stringId]);
                delete this.updateFrontTimeoutId[stringId];
            }
            var updateFrontDelay = (_b = settings === null || settings === void 0 ? void 0 : settings.updateFrontDelay) !== null && _b !== void 0 ? _b : 500;
            if (!isVisible && updateFrontDelay > 0 && this.animationsActive()) {
                this.updateFrontTimeoutId[stringId] = setTimeout(function () { var _a, _b; return (_b = (_a = _this.settings).setupFrontDiv) === null || _b === void 0 ? void 0 : _b.call(_a, card, element.getElementsByClassName('front')[0]); }, updateFrontDelay);
            }
            else {
                (_d = (_c = this.settings).setupFrontDiv) === null || _d === void 0 ? void 0 : _d.call(_c, card, element.getElementsByClassName('front')[0]);
            }
        }
        if ((_e = settings === null || settings === void 0 ? void 0 : settings.updateBack) !== null && _e !== void 0 ? _e : false) {
            if (this.updateBackTimeoutId[stringId]) { // make sure there is not a delayed animation that will overwrite the last flip request
                clearTimeout(this.updateBackTimeoutId[stringId]);
                delete this.updateBackTimeoutId[stringId];
            }
            var updateBackDelay = (_f = settings === null || settings === void 0 ? void 0 : settings.updateBackDelay) !== null && _f !== void 0 ? _f : 0;
            if (isVisible && updateBackDelay > 0 && this.animationsActive()) {
                this.updateBackTimeoutId[stringId] = setTimeout(function () { var _a, _b; return (_b = (_a = _this.settings).setupBackDiv) === null || _b === void 0 ? void 0 : _b.call(_a, card, element.getElementsByClassName('back')[0]); }, updateBackDelay);
            }
            else {
                (_h = (_g = this.settings).setupBackDiv) === null || _h === void 0 ? void 0 : _h.call(_g, card, element.getElementsByClassName('back')[0]);
            }
        }
        if ((_j = settings === null || settings === void 0 ? void 0 : settings.updateData) !== null && _j !== void 0 ? _j : true) {
            // card data has changed
            var stock = this.getCardStock(card);
            var cards = stock.getCards();
            var cardIndex = cards.findIndex(function (c) { return _this.getId(c) === _this.getId(card); });
            if (cardIndex !== -1) {
                stock.cards.splice(cardIndex, 1, card);
            }
        }
    };
    /**
     * Flips the card.
     *
     * @param card the card informations
     * @param settings the flip params (to update the card in current stock)
     */
    CardManager.prototype.flipCard = function (card, settings) {
        var element = this.getCardElement(card);
        var currentlyVisible = element.dataset.side === 'front';
        this.setCardVisible(card, !currentlyVisible, settings);
    };
    /**
     * Update the card informations. Used when a card with just an id (back shown) should be revealed, with all data needed to populate the front.
     *
     * @param card the card informations
     */
    CardManager.prototype.updateCardInformations = function (card, settings) {
        var newSettings = __assign(__assign({}, (settings !== null && settings !== void 0 ? settings : {})), { updateData: true });
        this.setCardVisible(card, undefined, newSettings);
    };
    /**
     * @returns the card with set in the settings (undefined if unset)
     */
    CardManager.prototype.getCardWidth = function () {
        var _a;
        return (_a = this.settings) === null || _a === void 0 ? void 0 : _a.cardWidth;
    };
    /**
     * @returns the card height set in the settings (undefined if unset)
     */
    CardManager.prototype.getCardHeight = function () {
        var _a;
        return (_a = this.settings) === null || _a === void 0 ? void 0 : _a.cardHeight;
    };
    /**
     * @returns the class to apply to selectable cards. Default 'bga-cards_selectable-card'.
     */
    CardManager.prototype.getSelectableCardClass = function () {
        var _a, _b;
        return ((_a = this.settings) === null || _a === void 0 ? void 0 : _a.selectableCardClass) === undefined ? 'bga-cards_selectable-card' : (_b = this.settings) === null || _b === void 0 ? void 0 : _b.selectableCardClass;
    };
    /**
     * @returns the class to apply to selectable cards. Default 'bga-cards_disabled-card'.
     */
    CardManager.prototype.getUnselectableCardClass = function () {
        var _a, _b;
        return ((_a = this.settings) === null || _a === void 0 ? void 0 : _a.unselectableCardClass) === undefined ? 'bga-cards_disabled-card' : (_b = this.settings) === null || _b === void 0 ? void 0 : _b.unselectableCardClass;
    };
    /**
     * @returns the class to apply to selected cards. Default 'bga-cards_selected-card'.
     */
    CardManager.prototype.getSelectedCardClass = function () {
        var _a, _b;
        return ((_a = this.settings) === null || _a === void 0 ? void 0 : _a.selectedCardClass) === undefined ? 'bga-cards_selected-card' : (_b = this.settings) === null || _b === void 0 ? void 0 : _b.selectedCardClass;
    };
    return CardManager;
}());
var CardsManager = /** @class */ (function (_super) {
    __extends(CardsManager, _super);
    function CardsManager(game) {
        var _this = _super.call(this, game, {
            getId: function (card) { return "card-".concat(card.id); },
            setupDiv: function (card, div) {
                div.classList.add('splendorduel-card');
                div.dataset.level = '' + card.level;
            },
            setupFrontDiv: function (card, div) {
                div.dataset.index = '' + card.index;
                if (card.index > 0) {
                    game.setTooltip(div.id, _this.getTooltip(card));
                }
            },
            isCardVisible: function (card) { return Boolean(card.index); },
            cardWidth: 120,
            cardHeight: 183,
        }) || this;
        _this.game = game;
        return _this;
    }
    CardsManager.prototype.getTooltip = function (card) {
        var _this = this;
        var message = "\n        <strong>".concat(_("Level:"), "</strong> ").concat(card.level, "\n        <br>\n        <strong>").concat(_("Color:"), "</strong> ").concat(this.game.getColor(card.color), "\n        <br>\n        <strong>").concat(_("Cost:"), "</strong> ").concat(Object.entries(card.cost).map(function (entry) {
            return "".concat(entry[1], " <div class=\"token-icon\" data-type=\"").concat(entry[0], "\"></div>");
        }).join(' &nbsp; '));
        if (Object.values(card.provides).length) {
            message += "<br>\n            <strong>".concat(_("Provides:"), "</strong> ").concat(Object.entries(card.provides).map(function (entry) {
                return "".concat(entry[1], " ").concat(/*Number(entry[0]) == 9 ? '?' :*/ "<div class=\"token-icon\" data-type=\"".concat(entry[0], "\"></div>"));
            }).join(' &nbsp; '));
        }
        if (card.points) {
            message += "\n            <br>\n            <strong>".concat(_("Points:"), "</strong> ").concat(card.points, "\n            ");
        }
        if (card.crowns) {
            message += "\n            <br>\n            <strong>".concat(_("Crowns:"), "</strong> ").concat(card.crowns);
        }
        if (card.power.length) {
            message += "\n            <br>\n            <strong>".concat(_("Power:"), "</strong> ").concat(card.power.map(function (power) { return _this.game.getPower(power); }).join(', '), "\n            ");
        }
        return message;
    };
    return CardsManager;
}(CardManager));
var RoyalCardsManager = /** @class */ (function (_super) {
    __extends(RoyalCardsManager, _super);
    function RoyalCardsManager(game) {
        var _this = _super.call(this, game, {
            getId: function (card) { return "royal-card-".concat(card.id); },
            setupDiv: function (card, div) {
                div.classList.add('royal-card');
                div.dataset.index = '' + card.index;
            },
            setupFrontDiv: function (card, div) {
                game.setTooltip(div.id, _this.getTooltip(card));
            },
            isCardVisible: function () { return true; },
            cardWidth: 120,
            cardHeight: 183,
        }) || this;
        _this.game = game;
        return _this;
    }
    RoyalCardsManager.prototype.getTooltip = function (card) {
        var _this = this;
        var message = "\n        <strong>".concat(_("Points:"), "</strong> ").concat(card.points, "\n        ");
        if (card.power.length) {
            message += "\n            <br>\n            <strong>".concat(_("Power:"), "</strong> ").concat(card.power.map(function (power) { return _this.game.getPower(power); }).join(', '), "\n            ");
        }
        return message;
    };
    return RoyalCardsManager;
}(CardManager));
var TokensManager = /** @class */ (function (_super) {
    __extends(TokensManager, _super);
    function TokensManager(game) {
        var _this = _super.call(this, game, {
            getId: function (card) { return "token-".concat(card.id); },
            setupDiv: function (card, div) {
                div.draggable = false;
                div.classList.add('token');
                div.dataset.type = '' + card.type;
                if (card.type == 2) {
                    div.dataset.color = '' + card.color;
                }
                //game.setTooltip(div.id, this.getTooltip(card));
            },
            setupFrontDiv: function (card, div) {
                //div.id = `${this.getId(card)}-front`;
                div.draggable = false;
            },
        }) || this;
        _this.game = game;
        return _this;
    }
    TokensManager.prototype.getTooltip = function (token) {
        switch (token.type) {
            case 1: return _("Gold");
            case 2: return this.game.getColor(token.color);
        }
    };
    return TokensManager;
}(CardManager));
var TokenBoard = /** @class */ (function () {
    function TokenBoard(game, board) {
        var _this = this;
        this.game = game;
        var slotsIds = [];
        for (var row = 1; row <= 5; row++) {
            for (var column = 1; column <= 5; column++) {
                slotsIds.push(JSON.stringify([row, column]));
            }
        }
        var boardDiv = document.getElementById("board");
        this.stock = new SlotStock(game.tokensManager, boardDiv, {
            slotsIds: slotsIds,
            mapCardToSlot: function (card) { return JSON.stringify([card.row, card.column]); },
            gap: '0',
            selectableCardClass: 'no-visible-selection',
        });
        this.stock.addCards(board);
        this.stock.onSelectionChange = function (selection, lastChange) { return _this.onTokenSelectionChange(selection, lastChange); };
        this.mouseSelection = document.getElementById('mouse-selection');
        boardDiv.addEventListener('mousedown', function (event) { return _this.onMouseDown(event); });
        boardDiv.addEventListener('mousemove', function (event) { return _this.onMouseMove(event); });
        boardDiv.addEventListener('mouseup', function (event) { return _this.onMouseUp(event); });
        boardDiv.addEventListener('dragstart', function (e) { e.stopImmediatePropagation(); e.preventDefault(); });
        document.addEventListener('mouseup', function (event) { return _this.onMouseUp(null); });
        document.addEventListener('keyup', function (event) {
            if (event.key == 'Escape') {
                _this.onMouseUp(null);
            }
        });
        [
            _("If you take <strong>2 Pearls</strong> during the Mandatory Action, your opponent takes 1 Privilege."),
            _("If you <strong>replenish the Game Board</strong>, your opponent takes 1 Privilege."),
            _("If you take <strong>3 tokens of the same color</strong> during the Mandatory Action, your opponent takes 1 Privilege."),
        ].forEach(function (sentence, index) {
            document.getElementById("board").insertAdjacentHTML('beforeend', "<div id=\"board-tooltip-zone-".concat(index, "\" class=\"board-tooltip-zone\" data-index=\"").concat(index, "\"></div>"));
            _this.game.setTooltip("board-tooltip-zone-".concat(index), sentence);
        });
    }
    TokenBoard.prototype.getDefaultPossibleSelection = function () {
        var _this = this;
        var possibleSelection = this.stock.getCards();
        if (!this.canTakeGold) {
            possibleSelection = possibleSelection.filter(function (card) { return card.type === 2; });
        }
        if (this.selectionColor != null) {
            possibleSelection = possibleSelection.filter(function (card) { return card.color === _this.selectionColor; });
        }
        return possibleSelection;
    };
    TokenBoard.prototype.setSelectable = function (selectionType, canTakeGold, max, color) {
        if (max === void 0) { max = 3; }
        if (color === void 0) { color = null; }
        this.stock.setSelectionMode(selectionType ? 'multiple' : 'none');
        this.maxSelectionToken = max;
        this.selectionType = selectionType;
        this.selectionColor = color;
        this.canTakeGold = canTakeGold;
        this.stock.setSelectableCards(this.getDefaultPossibleSelection());
    };
    TokenBoard.prototype.onTokenSelectionChange = function (selection, lastChange) {
        var valid = selection.length > 0;
        var tokens = this.stock.getCards();
        selection.sort(function (a, b) { return a.row == b.row ? a.column - b.column : a.row - b.row; });
        if (selection.length > this.maxSelectionToken) {
            valid = false;
        }
        else if (this.selectionType === 'privileges') {
            valid = this.onPrivilegeTokenSelectionChange(selection, tokens, valid);
        }
        else if (this.selectionType === 'effect') {
            valid = this.onEffectTokenSelectionChange(selection, tokens, valid);
        }
        else if (this.selectionType === 'play') {
            var _a = this.onPlayTokenSelectionChange(selection, tokens, valid, lastChange), stop_1 = _a.stop, validUpdated = _a.validUpdated;
            if (stop_1) {
                return;
            }
            valid = validUpdated;
        }
        this.game.onTableTokenSelectionChange(selection, valid);
    };
    TokenBoard.prototype.onPlayTokenSelectionChange = function (selection, tokens, valid, lastChange) {
        var goldTokens = selection.filter(function (card) { return card.type == 1; });
        var gemsTokens = selection.filter(function (card) { return card.type == 2; });
        var goldSelection = goldTokens.length >= 1;
        var selectionAtMax = goldSelection || gemsTokens.length >= this.maxSelectionToken;
        var remainingSelection = selectionAtMax ? selection : this.getDefaultPossibleSelection();
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
                var _a = this.onPlayTokenSelectionChange2gems(gemsTokens, tokens, lastChange, valid), stop_2 = _a.stop, validUpdated = _a.validUpdated, remainingSelectionUpdated = _a.remainingSelectionUpdated;
                if (stop_2) {
                    return { stop: true, validUpdated: true };
                }
                valid = validUpdated;
                remainingSelection = remainingSelectionUpdated;
            }
            else if (gemsTokens.length == 1) {
                var remainingSelectionUpdated = this.onPlayTokenSelectionChange1gem(gemsTokens[0], tokens);
                remainingSelection = remainingSelectionUpdated;
            }
        }
        this.stock.setSelectableCards(selectionAtMax ? selection : remainingSelection);
        return { stop: false, validUpdated: valid };
    };
    TokenBoard.prototype.onPlayTokenSelectionChange1gem = function (gemToken, tokens) {
        var remainingSelection = [gemToken];
        [-1, 0, 1].forEach(function (rowDirection) { return [-1, 0, 1].filter(function (colDirection) { return colDirection != 0 || rowDirection != 0; }).forEach(function (colDirection) {
            var nextToken = tokens.find(function (token) { return token.row == gemToken.row + rowDirection && token.column == gemToken.column + colDirection; });
            if ((nextToken === null || nextToken === void 0 ? void 0 : nextToken.type) == 2) {
                remainingSelection.push(nextToken);
                var nextNextToken = tokens.find(function (token) { return token.row == nextToken.row + rowDirection && token.column == nextToken.column + colDirection; });
                if ((nextNextToken === null || nextNextToken === void 0 ? void 0 : nextNextToken.type) == 2) {
                    remainingSelection.push(nextNextToken);
                }
            }
        }); });
        return remainingSelection;
    };
    TokenBoard.prototype.onPlayTokenSelectionChange2gems = function (gemsTokens, tokens, lastChange, valid) {
        var remainingSelection = gemsTokens;
        var rowDiff = gemsTokens[0].row - gemsTokens[1].row;
        var colDiff = gemsTokens[0].column - gemsTokens[1].column;
        var absRowDiff = Math.abs(rowDiff);
        var absColDiff = Math.abs(colDiff);
        if ([0, 2].includes(absRowDiff) && [0, 2].includes(absColDiff)) {
            var middleRow_1 = (gemsTokens[0].row + gemsTokens[1].row) / 2;
            var middleCol_1 = (gemsTokens[0].column + gemsTokens[1].column) / 2;
            var middleToken = tokens.find(function (token) { return token.row == middleRow_1 && token.column == middleCol_1; });
            // if valid selection of 2 gems separated by one, autoselect the one in-between
            if ((middleToken === null || middleToken === void 0 ? void 0 : middleToken.type) == 2) {
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
            [-1, 2].forEach(function (direction) {
                var nextRow = gemsTokens[0].row - direction * rowDiff;
                var nextCol = gemsTokens[0].column - direction * colDiff;
                var nextToken = tokens.find(function (token) { return token.row == nextRow && token.column == nextCol; });
                if ((nextToken === null || nextToken === void 0 ? void 0 : nextToken.type) == 2) {
                    remainingSelection.push(nextToken);
                }
            });
        }
        else {
            valid = false;
        }
        return { stop: false, validUpdated: valid, remainingSelectionUpdated: remainingSelection };
    };
    TokenBoard.prototype.onPlayTokenSelectionChange3gems = function (gemsTokens, valid) {
        var rowDiff = gemsTokens[0].row - gemsTokens[1].row;
        var colDiff = gemsTokens[0].column - gemsTokens[1].column;
        var absRowDiff = Math.abs(rowDiff);
        var absColDiff = Math.abs(colDiff);
        var inSameDirection = [0, 1].includes(absRowDiff) && [0, 1].includes(absColDiff) &&
            (rowDiff == gemsTokens[1].row - gemsTokens[2].row) &&
            (colDiff == gemsTokens[1].column - gemsTokens[2].column);
        if (!inSameDirection) {
            valid = false;
        }
        return valid;
    };
    TokenBoard.prototype.onEffectTokenSelectionChange = function (selection, tokens, valid) {
        var _this = this;
        this.stock.setSelectableCards(selection.length >= this.maxSelectionToken ? selection : this.getDefaultPossibleSelection());
        if (selection.some(function (card) { return card.type != 2 || card.color != _this.selectionColor; })) {
            valid = false;
        }
        return valid;
    };
    TokenBoard.prototype.onPrivilegeTokenSelectionChange = function (selection, tokens, valid) {
        this.stock.setSelectableCards(selection.length >= this.maxSelectionToken ? selection : this.getDefaultPossibleSelection());
        if (selection.some(function (card) { return card.type != 2; })) {
            valid = false;
        }
        return valid;
    };
    TokenBoard.prototype.refill = function (refilledTokens, fromStock) {
        return this.stock.addCards(refilledTokens, { fromStock: fromStock }, undefined, 350);
    };
    TokenBoard.prototype.checkPlayTakeGems = function (tokens) {
        var gold = tokens.filter(function (token) { return token.type == 1; });
        var gems = tokens.filter(function (token) { return token.type == 2; });
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
            gems = gems.sort(function (a, b) { return a.row == b.row ? a.column - b.column : a.row - b.row; });
            var rowDiff = null;
            var colDiff = null;
            var invalid = false;
            for (var i = 1; i < gems.length; i++) {
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
    };
    TokenBoard.prototype.completeSelection = function (from, to) {
        var selection = from.id == to.id ? [from] : [from, to];
        if (selection.length > 1 && (Math.abs(selection[0].row - selection[1].row) == 2 || Math.abs(selection[0].column - selection[1].column) == 2)) {
            var middle_1 = this.stock.getCards().find(function (token) { return token.row == Math.floor((selection[0].row + selection[1].row) / 2) && token.column == Math.floor((selection[0].column + selection[1].column) / 2); });
            if (middle_1 && !selection.some(function (s) { return s.id == middle_1.id; })) {
                return __spreadArray(__spreadArray([], selection, true), [middle_1], false);
            }
        }
        return selection;
    };
    TokenBoard.prototype.mouseSelectionValid = function (from, to) {
        var selection = this.completeSelection(from, to);
        return this.checkPlayTakeGems(selection);
    };
    TokenBoard.prototype.getTokenFromMouseEvent = function (event) {
        var _a;
        var tokenDiv = (_a = event.target) === null || _a === void 0 ? void 0 : _a.closest('.token');
        return tokenDiv ? this.stock.getCards().find(function (card) { return tokenDiv.id == "token-".concat(card.id); }) : null;
    };
    TokenBoard.prototype.onMouseDown = function (event) {
        if (!this.selectionType || this.maxSelectionToken <= 1) {
            return;
        }
        this.mouseSelectionStart = this.getTokenFromMouseEvent(event);
        this.mouseSelectionInitialCoordinates = [event.screenX, event.screenY];
    };
    TokenBoard.prototype.getTokenCenterCoordinates = function (token) {
        return [50 + (token.column - 1) * 83.2, 133 + (token.row - 1) * 83.2];
    };
    TokenBoard.prototype.cleanMouseSelection = function () {
        this.mouseSelectionStart = null;
        this.mouseSelectionInitialCoordinates = null;
        this.mouseSelection.dataset.valid = '';
    };
    TokenBoard.prototype.onMouseMove = function (event) {
        if (event.buttons != 1 && this.mouseSelection.dataset.valid) {
            //setTimeout(() => {
            this.cleanMouseSelection();
            //}, 50);
            return;
        }
        if (!this.mouseSelectionStart || !this.mouseSelectionInitialCoordinates) {
            return;
        }
        var distX = this.mouseSelectionInitialCoordinates[0] - event.screenX;
        var distY = this.mouseSelectionInitialCoordinates[1] - event.screenY;
        var mouseMovementDistance = Math.sqrt(Math.pow(distX, 2) + Math.pow(distY, 2));
        if (mouseMovementDistance < 10) {
            return;
        }
        var mouseSelectionEnd = this.getTokenFromMouseEvent(event);
        if (!mouseSelectionEnd) {
            return;
        }
        this.stock.unselectAll();
        var fromCoordinates = this.getTokenCenterCoordinates(this.mouseSelectionStart);
        this.mouseSelection.style.left = "".concat(fromCoordinates[0] - 40, "px");
        this.mouseSelection.style.top = "".concat(fromCoordinates[1] - 40, "px");
        this.mouseSelection.dataset.valid = this.mouseSelectionValid(this.mouseSelectionStart, mouseSelectionEnd).toString();
        var toCoordinates = this.getTokenCenterCoordinates(mouseSelectionEnd);
        var xDiff = toCoordinates[0] - fromCoordinates[0];
        var yDiff = toCoordinates[1] - fromCoordinates[1];
        var distance = Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2)) + 80;
        var angle = Math.atan(yDiff / xDiff);
        this.mouseSelection.style.width = "".concat(distance, "px");
        this.mouseSelection.style.transform = "rotate(".concat(xDiff < 0 ? Math.PI + angle : angle, "rad)");
    };
    TokenBoard.prototype.onMouseUp = function (event) {
        var _this = this;
        if (event && this.mouseSelectionStart) {
            var distX = this.mouseSelectionInitialCoordinates[0] - event.screenX;
            var distY = this.mouseSelectionInitialCoordinates[1] - event.screenY;
            var mouseMovementDistance = Math.sqrt(Math.pow(distX, 2) + Math.pow(distY, 2));
            if (mouseMovementDistance >= 10) {
                var mouseSelectionEnd = this.getTokenFromMouseEvent(event);
                if (mouseSelectionEnd && this.mouseSelectionValid(this.mouseSelectionStart, mouseSelectionEnd)) {
                    var selection = this.completeSelection(this.mouseSelectionStart, mouseSelectionEnd);
                    this.stock.unselectAll(true);
                    selection.forEach(function (card) { return _this.stock.selectCard(card, true); });
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
    };
    return TokenBoard;
}());
var TableCenter = /** @class */ (function () {
    function TableCenter(game, gamedatas) {
        var _this = this;
        this.game = game;
        this.cardsDecks = [];
        this.cards = [];
        this.bag = new VoidStock(game.tokensManager, document.getElementById('bag'));
        this.bagCounter = new ebg.counter();
        this.bagCounter.create("bag-counter");
        this.bagCounter.setValue(25 - (gamedatas.board.length + Object.values(gamedatas.players).map(function (player) { return player.tokens.length; }).reduce(function (a, b) { return a + b; }, 0)));
        this.board = new TokenBoard(game, gamedatas.board);
        for (var level = 3; level >= 1; level--) {
            document.getElementById('table-cards').insertAdjacentHTML('beforeend', "\n                <div id=\"card-deck-".concat(level, "\"></div>\n                <div id=\"table-cards-").concat(level, "\"></div>\n            "));
            this.cardsDecks[level] = new Deck(game.cardsManager, document.getElementById("card-deck-".concat(level)), {
                cardNumber: gamedatas.cardDeckCount[level],
                topCard: gamedatas.cardDeckTop[level],
                counter: {
                    hideWhenEmpty: true,
                    position: 'center',
                }
            });
            this.cardsDecks[level].onCardClick = function (card) { return _this.game.onTableCardClick(card); };
            var slotsIds = [];
            for (var i = 1; i <= 6 - level; i++) {
                slotsIds.push(i);
            }
            this.cards[level] = new SlotStock(game.cardsManager, document.getElementById("table-cards-".concat(level)), {
                slotsIds: slotsIds,
                mapCardToSlot: function (card) { return card.locationArg; },
                gap: '12px',
                unselectableCardClass: 'no-disable-class',
            });
            this.cards[level].onCardClick = function (card) { return _this.game.onTableCardClick(card); };
            this.cards[level].addCards(gamedatas.tableCards[level]);
        }
        this.royalCards = new LineStock(game.royalCardsManager, document.getElementById("royal-cards"), {
            center: true,
        });
        this.royalCards.onCardClick = function (card) { return _this.game.onRoyalCardClick(card); };
        this.royalCards.addCards(gamedatas.royalCards);
        this.game.setTooltip('score-tile', "\n            ".concat(_("If you have 20 or more Prestige points, you win!"), "\n            <br><br>\n            ").concat(_("If you have 10 or more Crowns, you win!"), "\n            <br><br>\n            ").concat(_("If you have 10 or more Prestige points on cards of the same color, you win! A <ICON_MULTI> card is considered to be of the same color as the cards it is grouped with").replace('<ICON_MULTI>', "<div class=\"token-icon\" data-type=\"9\"></div>"), "\n        "));
        var tablePrivileges = 3 - Object.values(gamedatas.players).map(function (player) { return player.privileges; }).reduce(function (a, b) { return a + b; }, 0);
        for (var i = 0; i < tablePrivileges; i++) {
            document.getElementById('table-privileges').insertAdjacentHTML('beforeend', "<div class=\"privilege-token\"></div>");
        }
        this.game.setTooltip('bag', _("Click to see the tokens in the bag"));
        document.getElementById('bag').addEventListener('click', function () { return _this.showTokensInBag(); });
    }
    TableCenter.prototype.setCardsSelectable = function (selectable, selectableCards, all) {
        if (selectableCards === void 0) { selectableCards = []; }
        if (all === void 0) { all = false; }
        for (var level = 3; level >= 1; level--) {
            this.cardsDecks[level].setSelectionMode(selectable && all ? 'single' : 'none');
            this.cards[level].setSelectionMode(selectable ? 'single' : 'none');
            if (selectable && !all) {
                this.cardsDecks[level].setSelectableCards(selectableCards);
                this.cards[level].setSelectableCards(selectableCards);
            }
        }
    };
    TableCenter.prototype.unselectTableCard = function (card) {
        for (var level = 3; level >= 1; level--) {
            this.cards[level].unselectCard(card);
        }
    };
    TableCenter.prototype.refillBoard = function (refilledTokens) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.board.refill(refilledTokens, this.bag)];
                    case 1:
                        _a.sent();
                        this.bagCounter.toValue(0);
                        return [2 /*return*/];
                }
            });
        });
    };
    TableCenter.prototype.setBoardSelectable = function (selectionType, canTakeGold, max, color) {
        if (canTakeGold === void 0) { canTakeGold = false; }
        if (max === void 0) { max = 3; }
        if (color === void 0) { color = null; }
        //document.getElementById(`board`).classList.toggle('selectable', Boolean(selectionType));
        this.board.setSelectable(selectionType, canTakeGold, max, color);
    };
    TableCenter.prototype.reserveCard = function (args) {
        this.game.cardsManager.removeCard(args.card);
    };
    TableCenter.prototype.replaceCard = function (args) {
        var promise = this.cards[args.level].addCard(args.newCard);
        this.cardsDecks[args.level].setCardNumber(args.cardDeckCount, args.cardDeckTop);
        return promise;
    };
    TableCenter.prototype.removeTokens = function (tokens) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.bag.addCards(tokens)];
                    case 1:
                        _a.sent();
                        this.bagCounter.incValue(tokens.length);
                        return [2 /*return*/];
                }
            });
        });
    };
    TableCenter.prototype.setRoyalCardsSelectable = function (selectable) {
        this.royalCards.setSelectionMode(selectable ? 'single' : 'none');
    };
    TableCenter.prototype.showTokensInBag = function () {
        var tokens = __spreadArray(__spreadArray([], this.board.stock.getCards(), true), this.game.getPlayersTokens(), true);
        var tokensInBagCount = [2, 4, 4, 4, 4, 4];
        tokensInBagCount[-1] = 3;
        tokens.forEach(function (token) { return tokensInBagCount[token.type == 1 ? -1 : token.color]--; });
        var bagTokens = [];
        for (var color = -1; color <= 5; color++) {
            for (var i = 0; i < tokensInBagCount[color]; i++) {
                bagTokens.push({
                    id: 1000 + 100 * color + i,
                    location: 'bag',
                    locationArg: 0,
                    type: color == -1 ? 1 : 2,
                    color: color,
                });
            }
        }
        var tokensInBagDialog = new ebg.popindialog();
        tokensInBagDialog.create('showTokensInBagDialog');
        tokensInBagDialog.setTitle(_("Tokens in the bag"));
        var html = "<div id=\"bag-tokens\"></div>";
        // Show the dialog
        tokensInBagDialog.setContent(html);
        tokensInBagDialog.show();
        var stock = new LineStock(this.game.tokensManager, document.getElementById('bag-tokens'), {
            wrap: 'wrap'
        });
        stock.addCards(bagTokens);
        tokensInBagDialog.show();
        // Replace the function call when it's clicked
        tokensInBagDialog.replaceCloseCallback(function () {
            stock.removeAll();
            tokensInBagDialog.destroy();
        });
    };
    return TableCenter;
}());
var isDebug = window.location.host == 'studio.boardgamearena.com' || window.location.hash.indexOf('debug') > -1;
;
var log = isDebug ? console.log.bind(window.console) : function () { };
var PlayerTable = /** @class */ (function () {
    function PlayerTable(game, player) {
        var _this = this;
        this.game = game;
        this.played = [];
        this.tokens = [];
        this.limitSelection = null;
        this.playerId = Number(player.id);
        this.currentPlayer = this.playerId == this.game.getPlayerId();
        var html = "\n        <div id=\"player-table-".concat(this.playerId, "\" class=\"player-table\" style=\"--player-color: #").concat(player.color, ";\">\n            <div id=\"player-table-").concat(this.playerId, "-name\" class=\"name-wrapper\">\n                ").concat(player.name, "\n                <div id=\"player-privileges-").concat(this.playerId, "\" class=\"player-privileges privilege-zone\"></div>\n            </div>\n            <div class=\"columns\">\n        ");
        [1, 2, 3, 4, 5, 0, -1].forEach(function (i) {
            html += "\n                <div id=\"player-table-".concat(_this.playerId, "-tokens-").concat(i, "\" class=\"tokens\"></div>\n                ");
        });
        [1, 2, 3, 4, 5, 9].forEach(function (i) {
            html += "\n                <div id=\"player-table-".concat(_this.playerId, "-played-").concat(i, "\" class=\"cards\" data-color=\"").concat(i, "\"></div>\n                ");
        });
        html += "\n                <div class=\"hand-wrapper\">\n                    <div class=\"block-label\">".concat(_('Reserved cards'), "</div>\n                    <div id=\"player-table-").concat(this.playerId, "-reserved\" class=\"cards\"></div>\n                </div>\n            </div>\n\n            <div id=\"player-table-").concat(this.playerId, "-royal-cards\"></div>\n            \n        </div>\n        ");
        document.getElementById('tables').insertAdjacentHTML('beforeend', html);
        var reservedDiv = document.getElementById("player-table-".concat(this.playerId, "-reserved"));
        this.reserved = new LineStock(this.game.cardsManager, reservedDiv);
        this.reserved.onCardClick = function (card) { return _this.game.onReservedCardClick(card); };
        this.reserved.addCards(player.reserved);
        this.voidStock = new VoidStock(this.game.cardsManager, document.getElementById("player-table-".concat(this.playerId, "-name")));
        [1, 2, 3, 4, 5, 9].forEach(function (i) {
            var playedDiv = document.getElementById("player-table-".concat(_this.playerId, "-played-").concat(i));
            _this.played[i] = new LineStock(_this.game.cardsManager, playedDiv, {
                direction: 'column',
                center: false,
            });
            _this.played[i].addCards(player.cards.filter(function (card) { return Number(card.location.slice(-1)) == i; }));
            playedDiv.addEventListener('click', function () {
                if (playedDiv.classList.contains('selectable-for-joker')) {
                    _this.game.onColumnClick(i);
                }
            });
            playedDiv.style.setProperty('--card-overlap', '135px');
        });
        this.royalCards = new LineStock(this.game.royalCardsManager, document.getElementById("player-table-".concat(this.playerId, "-royal-cards")));
        this.royalCards.addCards(player.royalCards);
        var tokensStockSettings = {
            direction: 'column',
            center: false,
        };
        [1, 2, 3, 4, 5, 0, -1].forEach(function (i) {
            var tokenDiv = document.getElementById("player-table-".concat(_this.playerId, "-tokens-").concat(i));
            _this.tokens[i] = new LineStock(_this.game.tokensManager, tokenDiv, tokensStockSettings);
            _this.tokens[i].onSelectionChange = function () { return _this.game.onPlayerTokenSelectionChange(_this.getSelectedTokens()); };
            tokenDiv.style.setProperty('--card-overlap', '50px');
        });
        this.addTokens(player.tokens);
        for (var i = 0; i < player.privileges; i++) {
            document.getElementById("player-privileges-".concat(this.playerId)).insertAdjacentHTML('beforeend', "<div class=\"privilege-token\"></div>");
        }
    }
    PlayerTable.prototype.playCard = function (card, fromElement) {
        return this.played[card.color].addCard(card, {
            fromElement: fromElement
        });
    };
    PlayerTable.prototype.setHandSelectable = function (selectable, buyableCards) {
        if (buyableCards === void 0) { buyableCards = null; }
        this.reserved.setSelectionMode(selectable ? 'single' : 'none');
        if (selectable) {
            this.reserved.setSelectableCards(buyableCards);
        }
    };
    PlayerTable.prototype.addCard = function (card) {
        return this.played[Number(card.location.slice(-1))].addCard(card);
    };
    PlayerTable.prototype.addRoyalCard = function (card) {
        return this.royalCards.addCard(card);
    };
    PlayerTable.prototype.addTokens = function (tokens) {
        var _this = this;
        return Promise.all([1, 2, 3, 4, 5, 0, -1].map(function (i) { return _this.tokens[i].addCards(tokens.filter(function (token) { return token.color == i; })); }));
    };
    PlayerTable.prototype.addReservedCard = function (card) {
        return this.reserved.addCard(this.currentPlayer ? card : __assign(__assign({}, card), { index: undefined }));
    };
    PlayerTable.prototype.setColumnsSelectable = function (colors) {
        var _this = this;
        [1, 2, 3, 4, 5].forEach(function (i) {
            return document.getElementById("player-table-".concat(_this.playerId, "-played-").concat(i)).classList.toggle('selectable-for-joker', colors.includes(i));
        });
    };
    PlayerTable.prototype.setTokensSelectable = function (selectable, goldAllowed) {
        var _this = this;
        (goldAllowed || !selectable ? [1, 2, 3, 4, 5, 0, -1] : [1, 2, 3, 4, 5, 0]).forEach(function (i) { return _this.tokens[i].setSelectionMode(selectable ? 'multiple' : 'none'); });
    };
    PlayerTable.prototype.setTokensSelectableByType = function (allowedTypes, preselection) {
        var _this = this;
        [1, 2, 3, 4, 5, 0, -1].forEach(function (i) {
            _this.tokens[i].setSelectionMode(allowedTypes.includes(i) ? 'multiple' : 'none');
            _this.tokens[i].unselectAll();
            _this.tokens[i].getCards().filter(function (card) { return preselection.some(function (token) { return token.id == card.id; }); }).forEach(function (token) { return _this.tokens[i].selectCard(token); });
        });
    };
    PlayerTable.prototype.getTokens = function () {
        var _this = this;
        return [1, 2, 3, 4, 5, 0, -1].map(function (i) { return _this.tokens[i].getCards(); }).reduce(function (a, b) { return __spreadArray(__spreadArray([], a, true), b, true); }, []);
    };
    PlayerTable.prototype.getSelectedTokens = function () {
        var _this = this;
        return [1, 2, 3, 4, 5, 0, -1].map(function (i) { return _this.tokens[i].getSelection(); }).reduce(function (a, b) { return __spreadArray(__spreadArray([], a, true), b, true); }, []);
    };
    PlayerTable.prototype.getCrowns = function () {
        var _this = this;
        var crowns = 0;
        [1, 2, 3, 4, 5, 9].forEach(function (i) { return _this.played[i].getCards().forEach(function (card) { return crowns += card.crowns; }); });
        return crowns;
    };
    return PlayerTable;
}());
var ANIMATION_MS = 500;
var ACTION_TIMER_DURATION = 5;
var LOCAL_STORAGE_ZOOM_KEY = 'SplendorDuel-zoom';
var LOCAL_STORAGE_JUMP_TO_FOLDED_KEY = 'SplendorDuel-jump-to-folded';
var SplendorDuel = /** @class */ (function () {
    function SplendorDuel() {
        this.playersTables = [];
        this.privilegeCounters = [];
        this.reservedCounters = [];
        this.pointsCounters = [];
        this.crownCounters = [];
        this.strongestColumnCounters = [];
        this.tokenCounters = [];
        this.TOOLTIP_DELAY = document.body.classList.contains('touch-device') ? 1500 : undefined;
        this.CARD_REGEX = /<card>(.*)<\/card>/;
        this.cardLogId = 0;
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
    SplendorDuel.prototype.setup = function (gamedatas) {
        log("Starting game setup");
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
        log("Ending game setup");
    };
    ///////////////////////////////////////////////////
    //// Game & client states
    // onEnteringState: this method is called each time we are entering into a new game state.
    //                  You can use this method to perform some user interface changes at this moment.
    //
    SplendorDuel.prototype.onEnteringState = function (stateName, args) {
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
    };
    SplendorDuel.prototype.setGamestateDescription = function (property) {
        if (property === void 0) { property = ''; }
        var originalState = this.gamedatas.gamestates[this.gamedatas.gamestate.id];
        //this.gamedatas.gamestate.description = `${originalState['description' + property]}`; 
        this.gamedatas.gamestate.descriptionmyturn = "".concat(originalState['descriptionmyturn' + property]);
        this.updatePageTitle();
    };
    SplendorDuel.prototype.onEnteringUsePrivilege = function (args) {
        if (this.isCurrentPlayerActive()) {
            this.tableCenter.setBoardSelectable('privileges', false, args.privileges);
        }
    };
    SplendorDuel.prototype.setNotice = function (args) {
        var _this = this;
        var _a, _b;
        var noticeDiv = document.getElementById('notice');
        var showNotice = args.canRefill || args.privileges > 0;
        if (showNotice) {
            var notice = "";
            var refillButton = args.canRefill ? "<button type=\"button\" id=\"replenish_button\" class=\"bgabutton bgabutton_blue\">".concat(_("Replenish the board"), "</button>") : null;
            var usePrivilegeButton = args.privileges ? "<button type=\"button\" id=\"usePrivilege_button\" class=\"bgabutton bgabutton_blue\">".concat(_("Use up to ${number} privilege(s) to take gem(s)").replace('${number}', args.privileges), "</button>") : null;
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
            (_a = document.getElementById('replenish_button')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', function () { return _this.confirmActionGivingPrivilege(function () { return _this.refillBoard(); }); });
            (_b = document.getElementById('usePrivilege_button')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', function () { return _this.usePrivilege(); });
        }
        noticeDiv.classList.toggle('visible', showNotice);
    };
    SplendorDuel.prototype.confirmActionGivingPrivilege = function (finalAction) {
        if (this.prefs[201].value != 2) {
            var confirmationMessage = "".concat(_("This action will give a privilege to your opponent."), "\n            <br><br>\n            <i>").concat(_("You can disable this warning in the user preferences (top right menu)."), "</i>");
            this.confirmationDialog(confirmationMessage, finalAction);
        }
        else {
            finalAction();
        }
    };
    SplendorDuel.prototype.onEnteringPlayAction = function (args) {
        if (!args.canTakeTokens) {
            this.setGamestateDescription('OnlyBuy');
        }
        else if (!args.canBuyCard) {
            this.setGamestateDescription('OnlyTokens');
        }
        if (this.isCurrentPlayerActive()) {
            this.setNotice(args);
            if (args.canTakeTokens) {
                this.tableCenter.setBoardSelectable('play', args.canReserve, 3);
            }
            this.tableCenter.setCardsSelectable(true, args.canBuyCard ? args.buyableCards : []);
            if (args.canBuyCard) {
                this.getCurrentPlayerTable().setHandSelectable(true, args.buyableCards);
            }
        }
    };
    SplendorDuel.prototype.onEnteringReserveCard = function () {
        if (this.isCurrentPlayerActive()) {
            this.tableCenter.setCardsSelectable(true, [], true);
        }
    };
    SplendorDuel.prototype.onEnteringPlaceJoker = function (args) {
        if (this.isCurrentPlayerActive()) {
            this.getCurrentPlayerTable().setColumnsSelectable(args.colors);
        }
    };
    SplendorDuel.prototype.onEnteringTakeBoardToken = function (args) {
        if (this.isCurrentPlayerActive()) {
            this.tableCenter.setBoardSelectable('effect', false, 1, args.color);
        }
    };
    SplendorDuel.prototype.onEnteringTakeOpponentToken = function (args) {
        if (this.isCurrentPlayerActive()) {
            this.getPlayerTable(args.opponentId).setTokensSelectable(true, false);
        }
    };
    SplendorDuel.prototype.onEnteringTakeRoyalCard = function () {
        if (this.isCurrentPlayerActive()) {
            this.tableCenter.setRoyalCardsSelectable(true);
        }
    };
    SplendorDuel.prototype.onEnteringDiscardTokens = function () {
        if (this.isCurrentPlayerActive()) {
            this.getCurrentPlayerTable().setTokensSelectable(true, true);
        }
    };
    SplendorDuel.prototype.onLeavingState = function (stateName) {
        log('Leaving state: ' + stateName);
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
    };
    SplendorDuel.prototype.onLeavingPlayAction = function () {
        this.tableCenter.setBoardSelectable(null);
        this.tableCenter.setCardsSelectable(false);
        var currentPlayerTable = this.getCurrentPlayerTable();
        if (currentPlayerTable) {
            currentPlayerTable.setHandSelectable(false);
            currentPlayerTable.setTokensSelectableByType([], []);
        }
        var noticeDiv = document.getElementById('notice');
        noticeDiv.innerHTML = "";
        noticeDiv.classList.remove('visible');
    };
    SplendorDuel.prototype.onLeavingReserveCard = function () {
        this.tableCenter.setCardsSelectable(false);
    };
    SplendorDuel.prototype.onLeavingPlaceJoker = function () {
        var _a;
        (_a = this.getCurrentPlayerTable()) === null || _a === void 0 ? void 0 : _a.setColumnsSelectable([]);
    };
    SplendorDuel.prototype.onLeavingTakeOpponentToken = function () {
        this.playersTables.forEach(function (playerTable) { return playerTable.setTokensSelectable(false, true); });
    };
    SplendorDuel.prototype.onLeavingTakeRoyalCard = function () {
        var _a;
        this.tableCenter.setRoyalCardsSelectable(false);
        (_a = this.getCurrentPlayerTable()) === null || _a === void 0 ? void 0 : _a.setHandSelectable(false);
    };
    SplendorDuel.prototype.onLeavingDiscardTokens = function () {
        var _a;
        (_a = this.getCurrentPlayerTable()) === null || _a === void 0 ? void 0 : _a.setTokensSelectable(false, true);
    };
    SplendorDuel.prototype.takeSelectedTokensWithWarning = function () {
        var _this = this;
        var showWarning = this.tokensSelection.filter(function (token) { return token.type == 2 && token.color == 0; }).length >= 2
            || (this.tokensSelection.length == 3 && this.tokensSelection[0].color == this.tokensSelection[1].color && this.tokensSelection[0].color == this.tokensSelection[2].color);
        if (showWarning) {
            this.confirmActionGivingPrivilege(function () { return _this.takeSelectedTokens(); });
        }
        else {
            this.takeSelectedTokens();
        }
    };
    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    SplendorDuel.prototype.onUpdateActionButtons = function (stateName, args) {
        var _this = this;
        if (this.isCurrentPlayerActive()) {
            switch (stateName) {
                case 'usePrivilege':
                    this.addActionButton("takeSelectedTokens_button", _("Take selected token(s)"), function () { return _this.takeSelectedTokens(); });
                    document.getElementById("takeSelectedTokens_button").classList.add('disabled');
                    this.addActionButton("cancelUsePrivilege_button", _("Cancel"), function () { return _this.cancelUsePrivilege(); }, null, null, 'gray');
                    break;
                case 'playAction':
                    this.addActionButton("takeSelectedTokens_button", _("Take selected token(s)"), function () { return _this.takeSelectedTokensWithWarning(); });
                    document.getElementById("takeSelectedTokens_button").classList.add('disabled');
                    break;
                case 'takeBoardToken':
                    this.addActionButton("takeSelectedTokens_button", _("Take selected token(s)"), function () { return _this.takeSelectedTokens(); });
                    document.getElementById("takeSelectedTokens_button").classList.add('disabled');
                    break;
                case 'takeOpponentToken':
                    this.addActionButton("takeSelectedTokens_button", _("Take selected token"), function () { return _this.takeOpponentToken(_this.tokensSelection[0].id); });
                    document.getElementById("takeSelectedTokens_button").classList.add('disabled');
                    break;
                case 'discardTokens':
                    this.addActionButton("discardSelectedTokens_button", _("Discard selected token(s)"), function () { return _this.discardSelectedTokens(); });
                    document.getElementById("discardSelectedTokens_button").classList.add('disabled');
                    break;
            }
        }
    };
    ///////////////////////////////////////////////////
    //// Utility methods
    ///////////////////////////////////////////////////
    SplendorDuel.prototype.setTooltip = function (id, html) {
        this.addTooltipHtml(id, html, this.TOOLTIP_DELAY);
    };
    SplendorDuel.prototype.setTooltipToClass = function (className, html) {
        this.addTooltipHtmlToClass(className, html, this.TOOLTIP_DELAY);
    };
    SplendorDuel.prototype.getPlayerId = function () {
        return Number(this.player_id);
    };
    SplendorDuel.prototype.getPlayer = function (playerId) {
        return Object.values(this.gamedatas.players).find(function (player) { return Number(player.id) == playerId; });
    };
    SplendorDuel.prototype.getPlayerTable = function (playerId) {
        return this.playersTables.find(function (playerTable) { return playerTable.playerId === playerId; });
    };
    SplendorDuel.prototype.getCurrentPlayerTable = function () {
        var _this = this;
        return this.playersTables.find(function (playerTable) { return playerTable.playerId === _this.getPlayerId(); });
    };
    SplendorDuel.prototype.getOpponentId = function (playerId) {
        return Number(Object.values(this.gamedatas.players).find(function (player) { return Number(player.id) != playerId; }).id);
    };
    SplendorDuel.prototype.getGameStateName = function () {
        return this.gamedatas.gamestate.name;
    };
    SplendorDuel.prototype.setupPreferences = function () {
        var _this = this;
        // Extract the ID and value from the UI control
        var onchange = function (e) {
            var match = e.target.id.match(/^preference_[cf]ontrol_(\d+)$/);
            if (!match) {
                return;
            }
            var prefId = +match[1];
            var prefValue = +e.target.value;
            _this.prefs[prefId].value = prefValue;
        };
        // Call onPreferenceChange() when any value changes
        dojo.query(".preference_control").connect("onchange", onchange);
        // Call onPreferenceChange() now
        dojo.forEach(dojo.query("#ingame_menu_content .preference_control"), function (el) { return onchange({ target: el }); });
    };
    SplendorDuel.prototype.getOrderedPlayers = function (gamedatas) {
        var _this = this;
        var players = Object.values(gamedatas.players).sort(function (a, b) { return a.playerNo - b.playerNo; });
        var playerIndex = players.findIndex(function (player) { return Number(player.id) === Number(_this.player_id); });
        var orderedPlayers = playerIndex > 0 ? __spreadArray(__spreadArray([], players.slice(playerIndex), true), players.slice(0, playerIndex), true) : players;
        return orderedPlayers;
    };
    SplendorDuel.prototype.getPlayersTokens = function () {
        return this.playersTables.map(function (table) { return table.getTokens(); }).flat();
    };
    SplendorDuel.prototype.createPlayerPanels = function (gamedatas) {
        var _this = this;
        Object.values(gamedatas.players).forEach(function (player) {
            var playerId = Number(player.id);
            var html = "\n            <div class=\"score-tile-playerboard-wrapper\">\n                <div class=\"score-tile-playerboard\">\n                    <div id=\"end-reason-1-wrapper-".concat(player.id, "\" class=\"points-counter\">\n                        <div id=\"points-counter-").concat(player.id, "\"></div>\n                        <div class=\"goal\">/&nbsp;20</div>\n                    </div>\n    \n                    <div id=\"end-reason-2-wrapper-").concat(player.id, "\" class=\"crown-counter\">\n                        <div id=\"crown-counter-").concat(player.id, "\"></div>\n                        <div class=\"goal\">/&nbsp;10</div>\n                    </div>\n    \n                    <div id=\"end-reason-3-wrapper-").concat(player.id, "\" class=\"strongest-column-counter\">\n                        <div id=\"strongest-column-counter-").concat(player.id, "\"></div>\n                        <div class=\"goal\">/&nbsp;10</div>\n                    </div>\n             </div>\n            </div>\n            \n            <div class=\"counters\">\n                <div id=\"privilege-counter-wrapper-").concat(player.id, "\" class=\"privilege-counter\">\n                    <div class=\"privilege icon\"></div>\n                    <span id=\"privilege-counter-").concat(player.id, "\"></span><span class=\"goal\">&nbsp;/&nbsp;3</span>\n                </div>\n\n                <div id=\"reserved-counter-wrapper-").concat(player.id, "\" class=\"reserved-counter\">\n                    <div class=\"player-hand-card\"></div> \n                    <span id=\"reserved-counter-").concat(player.id, "\"></span><span class=\"goal\">&nbsp;/&nbsp;3</span>\n                </div>\n\n                <div id=\"token-counter-wrapper-").concat(player.id, "\" class=\"token-counter\">\n                    <div class=\"token icon\"></div> \n                    <span id=\"token-counter-").concat(player.id, "\"></span><span class=\"goal\">&nbsp;/&nbsp;10</span>\n                </div>\n            </div>");
            html += "\n            <div class=\"spl_miniplayerboard\">\n                <div class=\"spl_ressources_container\">";
            [1, 2, 3, 4, 5].forEach(function (color) {
                html += "            \n                    <div id=\"player-".concat(playerId, "-counters-card-points-").concat(color, "\" class=\"card-points points icon\"></div>");
            });
            html += "<div></div>\n            </div>\n            <div class=\"spl_ressources_container\">";
            for (var color = 1; color <= 5; color++) {
                html += "            \n                <div class=\"spl_ressources\">\n                    <div class=\"spl_minigem\" data-color=\"".concat(color, "\"></div>\n                    <div id=\"player-").concat(playerId, "-counters-card-").concat(color, "\" class=\"spl_cardcount\" data-color=\"").concat(color, "\">\n                    </div>\n                    <div id=\"player-").concat(playerId, "-counters-token-").concat(color, "\" class=\"spl_coinpile\" data-type=\"2\" data-color=\"").concat(color, "\">\n                    </div>\n                </div>");
            }
            html += "\n                    <div class=\"spl_ressources\">\n                        <div id=\"player-".concat(playerId, "-counters-token--1\" class=\"spl_coinpile\" data-type=\"1\"></div>\n                        <div id=\"player-").concat(playerId, "-counters-token-0\" class=\"spl_coinpile\" data-type=\"2\" data-color=\"0\"></div>\n                    </div>\n                </div>\n            </div>\n            ");
            dojo.place(html, "player_board_".concat(player.id));
            var points = [1, 2, 3, 4, 5, 9].map(function (color) {
                // we ignore multicolor in gray column as they will move to another column
                return player.cards.filter(function (card) { return card.location === "player".concat(playerId, "-").concat(color) && (color !== 9 || !card.power.includes(2)); }).map(function (card) { return card.points; }).reduce(function (a, b) { return a + b; }, 0);
            }).reduce(function (a, b) { return a + b; }, 0)
                + player.royalCards.map(function (card) { return card.points; }).reduce(function (a, b) { return a + b; }, 0);
            _this.pointsCounters[playerId] = new ebg.counter();
            _this.pointsCounters[playerId].create("points-counter-".concat(playerId));
            _this.pointsCounters[playerId].setValue(points);
            _this.crownCounters[playerId] = new ebg.counter();
            _this.crownCounters[playerId].create("crown-counter-".concat(playerId));
            _this.crownCounters[playerId].setValue(player.cards.map(function (card) { return card.crowns; }).reduce(function (a, b) { return a + b; }, 0));
            var strongestColumnValue = 0;
            [1, 2, 3, 4, 5].forEach(function (color) {
                // we ignore multicolor in gray column as they will move to another column
                var colorPoints = player.cards.filter(function (card) { return card.location === "player".concat(playerId, "-").concat(color); }).map(function (card) { return card.points; }).reduce(function (a, b) { return a + b; }, 0);
                if (colorPoints > strongestColumnValue) {
                    strongestColumnValue = colorPoints;
                }
            });
            _this.strongestColumnCounters[playerId] = new ebg.counter();
            _this.strongestColumnCounters[playerId].create("strongest-column-counter-".concat(playerId));
            _this.strongestColumnCounters[playerId].setValue(strongestColumnValue);
            _this.reservedCounters[playerId] = new ebg.counter();
            _this.reservedCounters[playerId].create("reserved-counter-".concat(playerId));
            _this.reservedCounters[playerId].setValue(player.reserved.length);
            _this.privilegeCounters[playerId] = new ebg.counter();
            _this.privilegeCounters[playerId].create("privilege-counter-".concat(playerId));
            _this.privilegeCounters[playerId].setValue(player.privileges);
            _this.tokenCounters[playerId] = new ebg.counter();
            _this.tokenCounters[playerId].create("token-counter-".concat(playerId));
            _this.tokenCounters[playerId].setValue(player.tokens.length);
            [1, 2, 3, 4, 5].forEach(function (color) {
                // we ignore multicolor in gray column as they will move to another column
                var colorPoints = player.cards.filter(function (card) { return card.location === "player".concat(playerId, "-").concat(color) && (color !== 9 || !card.power.includes(2)); }).map(function (card) { return card.points; }).reduce(function (a, b) { return a + b; }, 0);
                _this.setCardPointsCounter(playerId, color, colorPoints);
            });
            [1, 2, 3, 4, 5].forEach(function (color) {
                var produce = player.cards.filter(function (card) { return card.location === "player".concat(playerId, "-").concat(color); }).map(function (card) { return Object.values(card.provides).reduce(function (a, b) { return a + b; }, 0); }).reduce(function (a, b) { return a + b; }, 0);
                _this.setCardProduceCounter(playerId, color, produce);
            });
            [-1, 0, 1, 2, 3, 4, 5].forEach(function (color) {
                var tokens = player.tokens.filter(function (token) { return color == -1 ? token.type == 1 : token.type == 2 && token.color == color; });
                _this.setTokenCounter(playerId, color, tokens.length);
            });
            if (player.endReasons.length) {
                _this.setEndReasons(playerId, player.endReasons);
            }
        });
        this.setTooltipToClass('points-counter', _('Points'));
        this.setTooltipToClass('crown-counter', _('Crowns'));
        this.setTooltipToClass('strongest-column-counter', _('Points of the strongest column'));
        this.setTooltipToClass('privilege-counter', _('Privilege scrolls'));
        this.setTooltipToClass('reserved-counter', _('Reserved cards'));
        this.setTooltipToClass('token-counter', _('Number of tokens'));
    };
    SplendorDuel.prototype.setEndReasons = function (playerId, endReasons) {
        endReasons.forEach(function (endReason) { return document.getElementById("end-reason-".concat(endReason, "-wrapper-").concat(playerId)).classList.add('end-reason'); });
    };
    SplendorDuel.prototype.setCardPointsCounter = function (playerId, color, points) {
        var counterDiv = document.getElementById("player-".concat(playerId, "-counters-card-points-").concat(color));
        counterDiv.innerHTML = "".concat(points);
        counterDiv.classList.toggle('hidden', points < 1);
    };
    SplendorDuel.prototype.incCardPointsCounter = function (playerId, color, inc) {
        var counterDiv = document.getElementById("player-".concat(playerId, "-counters-card-points-").concat(color));
        this.setCardPointsCounter(playerId, color, Number(counterDiv.innerHTML) + inc);
    };
    SplendorDuel.prototype.setCardProduceCounter = function (playerId, color, produce) {
        var counterDiv = document.getElementById("player-".concat(playerId, "-counters-card-").concat(color));
        counterDiv.innerHTML = "".concat(produce ? produce : '');
        counterDiv.classList.toggle('empty', !produce);
    };
    SplendorDuel.prototype.incCardProduceCounter = function (playerId, color, inc) {
        var counterDiv = document.getElementById("player-".concat(playerId, "-counters-card-").concat(color));
        this.setCardProduceCounter(playerId, color, Number(counterDiv.innerHTML) + inc);
    };
    SplendorDuel.prototype.setTokenCounter = function (playerId, color, count) {
        var counterDiv = document.getElementById("player-".concat(playerId, "-counters-token-").concat(color));
        counterDiv.innerHTML = "".concat(count);
        counterDiv.classList.toggle('empty', !count);
    };
    SplendorDuel.prototype.updateTokenCounters = function (playerId) {
        var _this = this;
        var playerTokens = this.getPlayerTable(playerId).getTokens();
        [-1, 0, 1, 2, 3, 4, 5].forEach(function (color) {
            var tokens = playerTokens.filter(function (token) { return color == -1 ? token.type == 1 : token.type == 2 && token.color == color; });
            _this.setTokenCounter(playerId, color, tokens.length);
        });
        this.tokenCounters[playerId].toValue(playerTokens.length);
    };
    SplendorDuel.prototype.createPlayerTables = function (gamedatas) {
        var _this = this;
        var orderedPlayers = this.getOrderedPlayers(gamedatas);
        orderedPlayers.forEach(function (player) {
            return _this.createPlayerTable(gamedatas, Number(player.id));
        });
    };
    SplendorDuel.prototype.createPlayerTable = function (gamedatas, playerId) {
        var table = new PlayerTable(this, gamedatas.players[playerId]);
        this.playersTables.push(table);
    };
    SplendorDuel.prototype.setScore = function (playerId, inc) {
        var _a;
        (_a = this.scoreCtrl[playerId]) === null || _a === void 0 ? void 0 : _a.incValue(inc);
    };
    SplendorDuel.prototype.incScore = function (playerId, inc) {
        this.pointsCounters[playerId].incValue(inc);
    };
    SplendorDuel.prototype.getHelpHtml = function () {
        var _this = this;
        var html = [1, 2, 3, 4, 5].map(function (power) { return "\n            <div class=\"help-section\">\n                <div class=\"ability-icon\" data-ability=\"".concat(power, "\"></div>\n                <div class=\"help-label\">").concat(_this.getPower(power), "</div>\n            </div>"); }).join('');
        return html;
    };
    SplendorDuel.prototype.onTableTokenSelectionChange = function (tokens, valid) {
        this.tokensSelection = tokens;
        var button = document.getElementById('takeSelectedTokens_button');
        if (button) {
            button.classList.toggle('disabled', !valid);
            var gold = tokens.length && tokens.every(function (token) { return token.type == 1; });
            button.innerHTML = gold ? _("Take gold token to reserve a card") : _("Take selected token(s)");
        }
    };
    SplendorDuel.prototype.onPlayerTokenSelectionChange = function (tokens) {
        var _a, _b;
        this.tokensSelection = tokens;
        if (this.gamedatas.gamestate.name == 'discardTokens') {
            (_a = document.getElementById('discardSelectedTokens_button')) === null || _a === void 0 ? void 0 : _a.classList.toggle('disabled', this.tokensSelection.length != this.gamedatas.gamestate.args.number);
        }
        else if (this.gamedatas.gamestate.name == 'takeOpponentToken') {
            (_b = document.getElementById('takeSelectedTokens_button')) === null || _b === void 0 ? void 0 : _b.classList.toggle('disabled', this.tokensSelection.length != 1);
        }
        else if (this.gamedatas.gamestate.name == 'playAction') {
            if (this.selectedCard) {
                this.setChooseTokenCostButtonLabelAndState();
            }
        }
    };
    SplendorDuel.prototype.onTableCardClick = function (card) {
        if (this.gamedatas.gamestate.name == 'reserveCard') {
            this.reserveCard(card.id);
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
    };
    SplendorDuel.prototype.onBuyCardClick = function (card) {
        var _this = this;
        var goldTokens = this.getCurrentPlayerTable().tokens[-1].getCards();
        var reductedCost = structuredClone(this.gamedatas.gamestate.args.reducedCosts[card.id]);
        if (!reductedCost) {
            return;
        }
        this.selectedCard = card;
        var selectedTokens = [];
        var remaining = 0;
        var remainingOfColors = 0;
        Object.entries(reductedCost).forEach(function (entry) {
            var color = Number(entry[0]);
            var number = entry[1];
            var tokensOfColor = _this.getCurrentPlayerTable().tokens[color].getCards();
            selectedTokens.push.apply(selectedTokens, tokensOfColor.slice(0, Math.min(number, tokensOfColor.length)));
            if (number > tokensOfColor.length) {
                remaining += number - tokensOfColor.length;
            }
            else if (tokensOfColor.length > number) {
                remainingOfColors += tokensOfColor.length - number;
            }
        });
        if (remaining > 0) {
            selectedTokens.push.apply(selectedTokens, goldTokens.slice(0, remaining));
        }
        // can use more gold to pay
        if (goldTokens.length > remaining) {
            this.tokensSelection = [];
        }
        else {
            this.tokensSelection = selectedTokens;
        }
        var allowedTypes = Object.keys(reductedCost).map(function (type) { return Number(type); });
        if (!allowedTypes.includes(-1)) {
            allowedTypes.push(-1);
        }
        this.selectedCardReducedCost = reductedCost;
        this.setActionBarChooseTokenCost();
        this.getCurrentPlayerTable().setTokensSelectableByType(allowedTypes, this.tokensSelection);
    };
    SplendorDuel.prototype.setChooseTokenCostButtonLabelAndState = function () {
        var button = document.getElementById("chooseTokenCost-button");
        if (button) {
            var selection = this.getCurrentPlayerTable().getSelectedTokens();
            var label = selection.length ?
                _('Pay ${cost}').replace('${cost}', "<div class=\"compressed-token-icons\">".concat(selection.map(function (token) { return "<div class=\"token-icon\" data-type=\"".concat(token.type == 1 ? -1 : token.color, "\"></div>"); }).join(''), "</div>")) :
                _('Take for free');
            button.innerHTML = label;
            var valid = selection.length == Object.values(this.selectedCardReducedCost).reduce(function (a, b) { return a + b; }, 0); // TODO more controls
            button.classList.toggle('disabled', !valid);
        }
    };
    SplendorDuel.prototype.setActionBarChooseTokenCost = function () {
        var _this = this;
        var question = _("You must select the tokens to pay ${cost}").replace('${cost}', "<div class=\"compressed-token-icons\">".concat(Object.entries(this.selectedCardReducedCost).map(function (_a) {
            var color = _a[0], number = _a[1];
            return new Array(number).fill(0).map(function () { return "<div class=\"token-icon\" data-type=\"".concat(color, "\"></div>"); }).join('');
        }).join(''), "</div>"));
        this.setChooseActionGamestateDescription(question);
        document.getElementById("generalactions").innerHTML = '';
        this.addActionButton("chooseTokenCost-button", "", function () { return _this.buyCard(); });
        this.setChooseTokenCostButtonLabelAndState();
        this.addActionButton("cancelChooseTokenCost-button", _("Cancel"), function () { return _this.cancelChooseTokenCost(); }, null, null, 'gray');
    };
    SplendorDuel.prototype.setChooseActionGamestateDescription = function (newText) {
        if (!this.originalTextChooseAction) {
            this.originalTextChooseAction = document.getElementById('pagemaintitletext').innerHTML;
        }
        document.getElementById('pagemaintitletext').innerHTML = newText !== null && newText !== void 0 ? newText : this.originalTextChooseAction;
    };
    SplendorDuel.prototype.cancelChooseTokenCost = function () {
        var _a, _b;
        var table = this.getCurrentPlayerTable();
        if (this.selectedCard) {
            this.tableCenter.unselectTableCard(this.selectedCard);
            table.reserved.unselectCard(this.selectedCard);
        }
        this.setActionBarChooseAction(true);
        this.selectedCard = null;
        this.tokensSelection = null;
        (_a = document.getElementById("chooseTokenCost-button")) === null || _a === void 0 ? void 0 : _a.remove();
        (_b = document.getElementById("cancelChooseTokenCost-button")) === null || _b === void 0 ? void 0 : _b.remove();
        table.setTokensSelectableByType([], []);
    };
    SplendorDuel.prototype.setActionBarChooseAction = function (fromCancel) {
        document.getElementById("generalactions").innerHTML = '';
        if (fromCancel) {
            this.setChooseActionGamestateDescription();
        }
        /*if (this.actionTimerId) {
            window.clearInterval(this.actionTimerId);
        }*/
        this.onUpdateActionButtons(this.gamedatas.gamestate.name, this.gamedatas.gamestate.args);
        this.onEnteringState(this.gamedatas.gamestate.name, { args: this.gamedatas.gamestate.args });
    };
    SplendorDuel.prototype.onRoyalCardClick = function (card) {
        this.takeRoyalCard(card.id);
    };
    SplendorDuel.prototype.onReservedCardClick = function (card) {
        this.onTableCardClick(card);
    };
    SplendorDuel.prototype.onColumnClick = function (color) {
        if (this.gamedatas.gamestate.name == 'placeJoker') {
            this.placeJoker(color);
        }
    };
    SplendorDuel.prototype.takeSelectedTokens = function () {
        if (!this.checkAction('takeTokens')) {
            return;
        }
        var tokensIds = this.tokensSelection.map(function (token) { return token.id; }).sort(function (a, b) { return a - b; });
        this.takeAction('takeTokens', {
            ids: tokensIds.join(','),
        });
    };
    SplendorDuel.prototype.discardSelectedTokens = function () {
        if (!this.checkAction('discardTokens')) {
            return;
        }
        var tokensIds = this.tokensSelection.map(function (token) { return token.id; }).sort(function (a, b) { return a - b; });
        this.takeAction('discardTokens', {
            ids: tokensIds.join(','),
        });
    };
    SplendorDuel.prototype.cancelUsePrivilege = function () {
        if (!this.checkAction('cancelUsePrivilege')) {
            return;
        }
        this.takeAction('cancelUsePrivilege');
    };
    SplendorDuel.prototype.refillBoard = function () {
        if (!this.checkAction('refillBoard')) {
            return;
        }
        this.takeAction('refillBoard');
    };
    SplendorDuel.prototype.usePrivilege = function () {
        if (!this.checkAction('usePrivilege')) {
            return;
        }
        this.takeAction('usePrivilege');
    };
    SplendorDuel.prototype.reserveCard = function (id) {
        if (!this.checkAction('reserveCard')) {
            return;
        }
        this.takeAction('reserveCard', {
            id: id
        });
    };
    SplendorDuel.prototype.buyCard = function () {
        if (!this.checkAction('buyCard')) {
            return;
        }
        var tokensIds = this.tokensSelection.map(function (token) { return token.id; }).sort(function (a, b) { return a - b; });
        this.takeAction('buyCard', {
            id: this.selectedCard.id,
            tokensIds: tokensIds.join(','),
        });
    };
    SplendorDuel.prototype.takeRoyalCard = function (id) {
        if (!this.checkAction('takeRoyalCard')) {
            return;
        }
        this.takeAction('takeRoyalCard', {
            id: id
        });
    };
    SplendorDuel.prototype.takeOpponentToken = function (id) {
        if (!this.checkAction('takeOpponentToken')) {
            return;
        }
        this.takeAction('takeOpponentToken', {
            id: id
        });
    };
    SplendorDuel.prototype.placeJoker = function (color) {
        if (!this.checkAction('placeJoker')) {
            return;
        }
        this.takeAction('placeJoker', {
            color: color
        });
    };
    SplendorDuel.prototype.takeAction = function (action, data) {
        data = data || {};
        data.lock = true;
        this.ajaxcall("/splendorduel/splendorduel/".concat(action, ".html"), data, this, function () { });
    };
    ///////////////////////////////////////////////////
    //// Reaction to cometD notifications
    /*
        setupNotifications:

        In this method, you associate each of your game notifications with your local method to handle it.

        Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                your pylos.game.php file.

    */
    SplendorDuel.prototype.setupNotifications = function () {
        //log( 'notifications subscriptions setup' );
        var _this = this;
        var notifs = [
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
        notifs.forEach(function (notif) {
            dojo.subscribe(notif[0], _this, function (notifDetails) {
                log("notif_".concat(notif[0]), notifDetails.args);
                var promise = _this["notif_".concat(notif[0])](notifDetails.args);
                // tell the UI notification ends, if the function returned a promise
                promise === null || promise === void 0 ? void 0 : promise.then(function () { return _this.notifqueue.onSynchronousNotificationEnd(); });
            });
            _this.notifqueue.setSynchronous(notif[0], notif[1]);
        });
        if (isDebug) {
            notifs.forEach(function (notif) {
                if (!_this["notif_".concat(notif[0])]) {
                    console.warn("notif_".concat(notif[0], " function is not declared, but listed in setupNotifications"));
                }
            });
            Object.getOwnPropertyNames(SplendorDuel.prototype).filter(function (item) { return item.startsWith('notif_'); }).map(function (item) { return item.slice(6); }).forEach(function (item) {
                if (!notifs.some(function (notif) { return notif[0] == item; })) {
                    console.warn("notif_".concat(item, " function is declared, but not listed in setupNotifications"));
                }
            });
        }
    };
    SplendorDuel.prototype.notif_privileges = function (args) {
        var _this = this;
        Object.entries(args.privileges).forEach(function (entry) { return _this.privilegeCounters[entry[0]].setValue(entry[1]); });
        var fromDiv = document.getElementById(args.from ? "player-privileges-".concat(args.from) : "table-privileges");
        var toDiv = document.getElementById(args.to ? "player-privileges-".concat(args.to) : "table-privileges");
        var divs = Array.from(fromDiv.querySelectorAll('.privilege-token')).slice(0, args.count);
        divs.forEach(function (div) { return _this.animationManager.attachWithAnimation(new BgaSlideAnimation({ element: div }), toDiv); });
    };
    SplendorDuel.prototype.notif_refill = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.tableCenter.refillBoard(args.refilledTokens)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    SplendorDuel.prototype.notif_takeTokens = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var tokens, playerId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tokens = args.tokens, playerId = args.playerId;
                        return [4 /*yield*/, this.getPlayerTable(playerId).addTokens(tokens)];
                    case 1:
                        _a.sent();
                        this.updateTokenCounters(playerId);
                        this.updateTokenCounters(this.getOpponentId(playerId));
                        return [2 /*return*/];
                }
            });
        });
    };
    SplendorDuel.prototype.notif_reserveCard = function (args) {
        this.reservedCounters[args.playerId].incValue(1);
        var promise = this.getPlayerTable(args.playerId).addReservedCard(args.card);
        if (args.fromDeck) {
            this.tableCenter.cardsDecks[args.level].setCardNumber(args.cardDeckCount, args.cardDeckTop);
        }
        return promise;
    };
    SplendorDuel.prototype.notif_buyCard = function (args) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var card, playerId, tokens, column, playerTable;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        card = args.card, playerId = args.playerId, tokens = args.tokens;
                        if (args.fromReserved) {
                            this.reservedCounters[playerId].incValue(-1);
                        }
                        return [4 /*yield*/, this.getPlayerTable(playerId).addCard(card)];
                    case 1:
                        _b.sent();
                        if (!((_a = args.tokens) === null || _a === void 0 ? void 0 : _a.length)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.tableCenter.removeTokens(tokens)];
                    case 2:
                        _b.sent();
                        this.updateTokenCounters(playerId);
                        _b.label = 3;
                    case 3:
                        column = Number(card.location.slice(-1));
                        if ([1, 2, 3, 4, 5].includes(column) || (column == 9 && !card.power.includes(2))) {
                            playerTable = this.getPlayerTable(playerId);
                            this.crownCounters[playerId].toValue(playerTable.getCrowns());
                            this.incScore(playerId, card.points);
                            if (column <= 5) {
                                this.incCardPointsCounter(playerId, column, card.points);
                                this.incCardProduceCounter(playerId, column, Object.values(card.provides).reduce(function (a, b) { return a + b; }, 0));
                                this.strongestColumnCounters[playerId].toValue(Math.max.apply(Math, [1, 2, 3, 4, 5].map(function (color) { return Number(document.getElementById("player-".concat(playerId, "-counters-card-points-").concat(color)).innerHTML); })));
                            }
                        }
                        return [2 /*return*/, Promise.resolve(true)];
                }
            });
        });
    };
    SplendorDuel.prototype.notif_takeRoyalCard = function (args) {
        var card = args.card, playerId = args.playerId;
        this.incScore(playerId, card.points);
        return this.getPlayerTable(args.playerId).addRoyalCard(card);
    };
    SplendorDuel.prototype.notif_discardTokens = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var tokens, playerId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tokens = args.tokens, playerId = args.playerId;
                        return [4 /*yield*/, this.tableCenter.removeTokens(tokens)];
                    case 1:
                        _a.sent();
                        this.updateTokenCounters(playerId);
                        return [2 /*return*/];
                }
            });
        });
    };
    SplendorDuel.prototype.notif_newTableCard = function (args) {
        return this.tableCenter.replaceCard(args);
    };
    SplendorDuel.prototype.notif_win = function (args) {
        this.setScore(args.playerId, 1);
        this.setEndReasons(args.playerId, args.endReasons);
    };
    /**
    * Load production bug report handler
    */
    SplendorDuel.prototype.notif_loadBug = function (args) {
        var that = this;
        function fetchNextUrl() {
            var url = args.urls.shift();
            console.log('Fetching URL', url, '...');
            // all the calls have to be made with ajaxcall in order to add the csrf token, otherwise you'll get "Invalid session information for this action. Please try reloading the page or logging in again"
            that.ajaxcall(url, {
                lock: true,
            }, that, function (success) {
                console.log('=> Success ', success);
                if (args.urls.length > 1) {
                    fetchNextUrl();
                }
                else if (args.urls.length > 0) {
                    //except the last one, clearing php cache
                    url = args.urls.shift();
                    dojo.xhrGet({
                        url: url,
                        headers: {
                            'X-Request-Token': bgaConfig.requestToken,
                        },
                        load: function (success) {
                            console.log('Success for URL', url, success);
                            console.log('Done, reloading page');
                            window.location.reload();
                        },
                        handleAs: 'text',
                        error: function (error) { return console.log('Error while loading : ', error); },
                    });
                }
            }, function (error) {
                if (error)
                    console.log('=> Error ', error);
            });
        }
        console.log('Notif: load bug', args);
        fetchNextUrl();
    };
    SplendorDuel.prototype.getColor = function (color) {
        switch (color) {
            case 0: return _("Pearl");
            case 1: return _("Blue");
            case 2: return _("White");
            case 3: return _("Green");
            case 4: return _("Black");
            case 5: return _("Red");
            case 9: return _("Gray");
        }
    };
    SplendorDuel.prototype.getPower = function (power) {
        switch (power) {
            case 1: return _("Take another turn immediately after this one ends.");
            case 2: return _("Place this card so that it overlaps a Jewel card with a bonus (see on the right). Treat this card’s <ICON_MULTI> bonus as though it were the same color of the card it is overlapping.").replace('<ICON_MULTI>', "<div class=\"token-icon\" data-type=\"9\"></div>") +
                "<br><i>".concat(_("If you do not have a card with a bonus, you cannot purchase this card."), "</i>");
            case 3: return _("Take 1 token matching the color of this card from the board. If there are no such tokens left, ignore this effect.");
            case 4: return _("Take 1 Privilege. If none are available, take 1 from your opponent.");
            case 5: return _("Take 1 Gem or Pearl token from your opponent. If your opponent has no such tokens, ignore this effect. You cannot take a Gold token from your opponent.");
        }
    };
    /* This enable to inject translatable styled things to logs or action bar */
    /* @Override */
    SplendorDuel.prototype.format_string_recursive = function (log, args) {
        var _this = this;
        try {
            if (log && args && !args.processed) {
                ['new_tokens', 'spent_tokens', 'discarded_tokens'].forEach(function (property) {
                    if (args[property] && (typeof args[property] !== 'string' || args[property][0] !== '<')) {
                        args[property] = args.tokens.map(function (token) { return "<div class=\"token-icon\" data-type=\"".concat(token.type == 1 ? -1 : token.color, "\"></div>"); }).join(' ');
                    }
                });
                for (var property in args) {
                    if (['card_level', 'color_name'].includes(property) && args[property][0] != '<') {
                        args[property] = "<strong>".concat(_(args[property]), "</strong>");
                    }
                }
                var cardRegex = /<card>(.*)<\/card>/;
                var cardMatch = log.match(this.CARD_REGEX);
                if (cardMatch) {
                    var cardLogId_1 = this.cardLogId++;
                    log = _(log).replace(cardRegex, function (_, innerText) {
                        return "<span id=\"card-log-".concat(cardLogId_1, "\" class=\"card-log-int\">").concat(innerText, "</span>");
                    });
                    var cardForLog_1 = this.cardsManager.createCardElement(__assign(__assign({}, args['card']), { id: "card-for-log-".concat(cardLogId_1) }));
                    setTimeout(function () { return _this.addTooltipHtml("card-log-".concat(cardLogId_1), cardForLog_1.outerHTML, 500); });
                }
            }
        }
        catch (e) {
            console.error(log, args, "Exception thrown", e.stack);
        }
        return this.inherited(arguments);
    };
    return SplendorDuel;
}());
define([
    "dojo", "dojo/_base/declare",
    "ebg/core/gamegui",
    "ebg/counter",
    "ebg/stock"
], function (dojo, declare) {
    return declare("bgagame.splendorduel", ebg.core.gamegui, new SplendorDuel());
});
