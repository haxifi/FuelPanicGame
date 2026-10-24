/**
 * Fuel Panic
 * Main entry point - Phaser 3 game configuration
 */

/** Detect touch device */
const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 600,
    parent: document.body,
    backgroundColor: '#1a1a2e',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        min: {
            width: 480,
            height: 280
        },
        max: {
            width: 1920,
            height: 1080
        }
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

const game = new Phaser.Game(config);
