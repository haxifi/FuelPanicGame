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
        this.loadingText = this.add.text(W / 2, H / 2, t('boot.loading'), {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.handleResize = (gameSize) => {
            this.cameras.main.setSize(gameSize.width, gameSize.height);
            if (this.loadingText) {
                this.loadingText.setPosition(gameSize.width / 2, gameSize.height / 2);
            }
        };

        this.scale.on('resize', this.handleResize, this);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.scale.off('resize', this.handleResize, this);
        });

        // Generate all assets
        GraphicsGenerator.generate(this);
        SoundGenerator.generate(this);

        // Move to menu after a brief delay
        this.time.delayedCall(300, () => {
            this.scene.start('MenuScene');
        });
    }
}
