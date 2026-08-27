const BgaZoom: any = await globalThis.importEsmLib('bga-zoom', '1.x');
const BgaJumpTo: any = await globalThis.importEsmLib('bga-jump-to', '1.x');
const [BgaHelp, BgaAnimations, BgaCards] = await globalThis.importDojoLibs([
    g_gamethemeurl + 'modules/js/bga-help.js',
    g_gamethemeurl + 'modules/js/bga-animations.js',
    g_gamethemeurl + 'modules/js/bga-cards.js',
]);

export { BgaAnimations, BgaCards, BgaHelp, BgaJumpTo, BgaZoom };
