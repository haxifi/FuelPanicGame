/**
 * MenuScene - Title screen with start button
 * Layout uses proportional Y positions so everything fits on any aspect ratio.
 */
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const W = this.cameras.main.width;   // 1024
        const H = this.cameras.main.height;  // 600
        const cx = W / 2;

        // Background
        this.cameras.main.setBackgroundColor('#1a1a2e');

        // Decorative fuel pump (centred, subtle)
        this.add.sprite(cx, H * 0.55, 'fuelPump').setScale(2).setAlpha(0.15);

        // ---- Title block (top 30%) ----
        this.add.text(cx, H * 0.1, '⛽ FUEL PANIC ⛽', {
            fontSize: `${Math.round(H * 0.075)}px`,
            fontFamily: 'Arial Black',
            color: '#ff6600',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(cx, H * 0.19, 'CONCEPT BY SALVATORE TURBOLI', {
            fontSize: `${Math.round(H * 0.032)}px`,
            fontFamily: 'Arial Black',
            color: '#ffcc00',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(cx, H * 0.27, '"Ferma gli accaparratori di benzina!"', {
            fontSize: `${Math.round(H * 0.026)}px`,
            fontFamily: 'Arial',
            color: '#aaaaaa',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        // ---- Instructions (middle section) ----
        const instructions = isTouchDevice
            ? [
                '👆 Tocca per sparare',
                '🎯 Colpisci solo gli ACCAPARRATORI (rossi)',
                '⚠️ NON colpire i clienti normali (verdi)',
                '🔄 Tocca il pulsante R per ricaricare',
                '⏱️ Sopravvivi il più a lungo possibile!'
            ]
            : [
                '🖱️ Mira con il mouse, clicca per sparare',
                '🎯 Colpisci solo gli ACCAPARRATORI (rossi)',
                '⚠️ NON colpire i clienti normali (verdi)',
                '🔄 Premi R per ricaricare',
                '⏱️ Sopravvivi il più a lungo possibile!'
            ];

        const instrFontSize = Math.round(H * 0.023);
        const instrLineH = H * 0.048;
        const instrStartY = H * 0.35;

        instructions.forEach((line, i) => {
            this.add.text(cx, instrStartY + i * instrLineH, line, {
                fontSize: `${instrFontSize}px`,
                fontFamily: 'Arial',
                color: '#cccccc'
            }).setOrigin(0.5);
        });

        // ---- Start button (lower section) ----
        const btnW = 200;
        const btnH2 = 50;
        const btnY = H * 0.78;

        const btnBg = this.add.graphics();
        const drawBtn = (color) => {
            btnBg.clear();
            btnBg.fillStyle(color, 1);
            btnBg.fillRoundedRect(cx - btnW / 2, btnY - btnH2 / 2, btnW, btnH2, 10);
        };
        drawBtn(0xff6600);

        this.add.text(cx, btnY, '▶ GIOCA!', {
            fontSize: `${Math.round(H * 0.04)}px`,
            fontFamily: 'Arial Black',
            color: '#ffffff'
        }).setOrigin(0.5);

        const btnZone = this.add.zone(cx, btnY, btnW, btnH2).setInteractive({ useHandCursor: true });
        btnZone.on('pointerover', () => drawBtn(0xff8833));
        btnZone.on('pointerout', () => drawBtn(0xff6600));
        btnZone.on('pointerdown', () => this.scene.start('GameScene'));

        // Blinking prompt
        const promptText = isTouchDevice
            ? 'Tocca GIOCA per iniziare'
            : 'Clicca GIOCA o premi SPAZIO per iniziare';

        const prompt = this.add.text(cx, H * 0.9, promptText, {
            fontSize: `${Math.round(H * 0.022)}px`,
            fontFamily: 'Arial',
            color: '#666666'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: prompt,
            alpha: 0.3,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // Keyboard start (desktop)
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });
    }
}
