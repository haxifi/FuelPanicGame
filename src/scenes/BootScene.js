/**
 * BootScene - Generates all textures and sounds, then moves to Menu
 */
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        const W = this.cameras.main.width;
        const H = this.cameras.main.height;

        // Show loading text
        this.add.text(W / 2, H / 2, 'Caricamento...', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Generate all assets
        GraphicsGenerator.generate(this);
        SoundGenerator.generate(this);

        // Move to menu after a brief delay
        this.time.delayedCall(300, () => {
            this.scene.start('MenuScene');
        });
    }
}
