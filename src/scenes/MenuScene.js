/**
 * MenuScene - Title screen with start button
 * Layout uses proportional positions so everything fits on any aspect ratio or orientation.
 */
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        // Background
        this.cameras.main.setBackgroundColor('#1a1a2e');

        // Decorative fuel pump (centred, subtle)
        this.pumpSprite = this.add.sprite(0, 0, 'fuelPump').setScale(2).setAlpha(0.15);

        // ---- Title block ----
        this.titleText = this.add.text(0, 0, t('menu.title'), {
            fontFamily: 'Arial Black',
            color: '#ff6600',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.authorText = this.add.text(0, 0, t('menu.author'), {
            fontFamily: 'Arial Black',
            color: '#ffcc00',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5);

        this.taglineText = this.add.text(0, 0, t('menu.tagline'), {
            fontFamily: 'Arial',
            color: '#aaaaaa',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        // ---- Instructions (middle section) ----
        const rawInstructions = isTouchDevice
            ? t('menu.instructions_touch')
            : t('menu.instructions_desktop');
        const instructions = Array.isArray(rawInstructions) ? rawInstructions : [];

        this.instructionTexts = instructions.map(line => {
            return this.add.text(0, 0, line, {
                fontFamily: 'Arial',
                color: '#cccccc'
            }).setOrigin(0.5);
        });

        // ---- Start button ----
        this.btnBg = this.add.graphics();
        this.btnText = this.add.text(0, 0, t('menu.play_button'), {
            fontFamily: 'Arial Black',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.btnZone = this.add.zone(0, 0, 200, 50).setInteractive({ useHandCursor: true });
        this.btnZone.on('pointerover', () => this.drawBtn(0xff8833));
        this.btnZone.on('pointerout', () => this.drawBtn(0xff6600));
        this.btnZone.on('pointerdown', () => this.scene.start('GameScene'));

        // Blinking prompt
        const promptText = isTouchDevice
            ? t('menu.prompt_touch')
            : t('menu.prompt_desktop');

        this.prompt = this.add.text(0, 0, promptText, {
            fontFamily: 'Arial',
            color: '#666666'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: this.prompt,
            alpha: 0.3,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // Keyboard start (desktop)
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });

        // Apply initial layout
        this.layoutUI(this.cameras.main.width, this.cameras.main.height);

        // Listen for dynamic resize
        this.scale.on('resize', this.handleResize, this);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.scale.off('resize', this.handleResize, this);
        });
    }

    drawBtn(color) {
        if (!this.btnBg) return;
        this.btnBg.clear();
        this.btnBg.fillStyle(color, 1);
        this.btnBg.fillRoundedRect(
            this.btnCenterX - this.btnW / 2,
            this.btnCenterY - this.btnH / 2,
            this.btnW,
            this.btnH,
            10
        );
    }

    handleResize(gameSize) {
        this.layoutUI(gameSize.width, gameSize.height);
    }

    layoutUI(W, H) {
        this.cameras.main.setSize(W, H);
        const cx = W / 2;

        if (this.pumpSprite) {
            this.pumpSprite.setPosition(cx, H * 0.55);
        }

        if (this.titleText) {
            this.titleText
                .setPosition(cx, H * 0.1)
                .setFontSize(`${Math.max(18, Math.round(H * 0.075))}px`);
        }

        if (this.authorText) {
            this.authorText
                .setPosition(cx, H * 0.19)
                .setFontSize(`${Math.max(10, Math.round(H * 0.032))}px`);
        }

        if (this.taglineText) {
            this.taglineText
                .setPosition(cx, H * 0.27)
                .setFontSize(`${Math.max(9, Math.round(H * 0.026))}px`);
        }

        const instrFontSize = Math.max(10, Math.round(H * 0.023));
        const instrLineH = Math.max(16, H * 0.048);
        const instrStartY = H * 0.35;

        if (this.instructionTexts) {
            this.instructionTexts.forEach((lineText, i) => {
                lineText
                    .setPosition(cx, instrStartY + i * instrLineH)
                    .setFontSize(`${instrFontSize}px`);
            });
        }

        this.btnW = Math.min(220, W * 0.38);
        this.btnH = Math.min(52, H * 0.12);
        this.btnCenterX = cx;
        this.btnCenterY = H * 0.78;

        this.drawBtn(0xff6600);

        if (this.btnText) {
            this.btnText
                .setPosition(cx, this.btnCenterY)
                .setFontSize(`${Math.max(14, Math.round(H * 0.04))}px`);
        }

        if (this.btnZone) {
            this.btnZone
                .setPosition(cx, this.btnCenterY)
                .setSize(this.btnW, this.btnH);
        }

        if (this.prompt) {
            this.prompt
                .setPosition(cx, H * 0.9)
                .setFontSize(`${Math.max(10, Math.round(H * 0.022))}px`);
        }
    }
}
