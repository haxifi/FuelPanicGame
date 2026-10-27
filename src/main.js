/**
 * Fuel Panic
 * Main entry point - Phaser 3 game configuration
 */

/** Detect touch device */
const isTouchDevice = ('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0) ||
    (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

/** Design dimensions (reference for proportional positioning) */
const DESIGN_WIDTH = 1024;
const DESIGN_HEIGHT = 600;

const config = {
    type: Phaser.AUTO,
    parent: document.body,
    backgroundColor: '#1a1a2e',
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: '100%',
        height: '100%'
    },
    input: {
        activePointers: 2,
        touch: {
            capture: true
        }
    },
    scene: [BootScene, MenuScene, GameScene, GameOverScene],
    audio: {
        disableWebAudio: false
    },
    banner: false
};

// Initialize i18n, then start the game
I18n.init().then(() => {
    I18n.updateHTMLTexts();
    window.game = new Phaser.Game(config);
});
