/**
 * GameOverScene - Shows final score and stats
 * Uses proportional Y positions so everything fits on mobile viewports.
 */
class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.finalScore = data.score || 0;
        this.hoardersCaught = data.hoardersCaught || 0;
        this.hoardersEscaped = data.hoardersEscaped || 0;
        this.normalHit = data.normalHit || 0;
        this.finalDifficulty = data.difficulty || 1;
        this.reason = data.reason || 'TIME_UP';
    }

    create() {
        const W = this.cameras.main.width;
        const H = this.cameras.main.height;
        const cx = W / 2;

        this.cameras.main.setBackgroundColor('#1a0a0a');

        // Title
        this.add.text(cx, H * 0.08, '💥 GAME OVER 💥', {
            fontSize: `${Math.round(H * 0.065)}px`,
            fontFamily: 'Arial Black',
            color: '#ff3300',
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5);

        // Reason
        const reasonText = this.reason === 'TIME_UP'
            ? '⏱️ Il tempo è scaduto!'
            : '⛽ Troppo carburante rubato!';
        this.add.text(cx, H * 0.17, reasonText, {
            fontSize: `${Math.round(H * 0.03)}px`,
            fontFamily: 'Arial',
            color: '#ff9966',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        // Score label
        this.add.text(cx, H * 0.26, 'PUNTEGGIO FINALE', {
            fontSize: `${Math.round(H * 0.025)}px`,
            fontFamily: 'Arial',
            color: '#aaaaaa'
        }).setOrigin(0.5);

        // Score number
        const scoreDisplay = this.add.text(cx, H * 0.34, '0', {
            fontSize: `${Math.round(H * 0.08)}px`,
            fontFamily: 'Arial Black',
            color: '#ffcc00',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.tweens.addCounter({
            from: 0,
            to: this.finalScore,
            duration: 1500,
            ease: 'Quad.easeOut',
            onUpdate: (tween) => {
                scoreDisplay.setText(Math.floor(tween.getValue()).toString());
            }
        });

        // Rating
        let rating, ratingColor;
        if (this.finalScore >= 1500) { rating = '🏆 EROE DEL DISTRIBUTORE!'; ratingColor = '#ffcc00'; }
        else if (this.finalScore >= 800) { rating = '⭐ OTTIMO LAVORO!'; ratingColor = '#66ff66'; }
        else if (this.finalScore >= 400) { rating = '👍 NON MALE...'; ratingColor = '#66aaff'; }
        else { rating = '😅 PUOI FARE DI MEGLIO!'; ratingColor = '#ff6666'; }

        this.add.text(cx, H * 0.43, rating, {
            fontSize: `${Math.round(H * 0.032)}px`,
            fontFamily: 'Arial Black',
            color: ratingColor,
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Stats
        const stats = [
            { icon: '🎯', label: 'Accaparratori beccati', value: this.hoardersCaught, color: '#66ff66' },
            { icon: '💨', label: 'Accaparratori scappati', value: this.hoardersEscaped, color: '#ff6666' },
            { icon: '😱', label: 'Innocenti colpiti', value: this.normalHit, color: '#ff4444' },
            { icon: '📈', label: 'Livello raggiunto', value: this.finalDifficulty, color: '#aaaaff' }
        ];

        const statsFontSize = Math.round(H * 0.024);
        const statsValueFontSize = Math.round(H * 0.028);
        const statsStartY = H * 0.51;
        const statsLineH = H * 0.055;
        const statsHalfW = Math.min(150, W * 0.18);

        stats.forEach((stat, i) => {
            const y = statsStartY + i * statsLineH;
            this.add.text(cx - statsHalfW, y, `${stat.icon} ${stat.label}:`, {
                fontSize: `${statsFontSize}px`, fontFamily: 'Arial', color: '#cccccc'
            }).setOrigin(0, 0.5);

            this.add.text(cx + statsHalfW, y, stat.value.toString(), {
                fontSize: `${statsValueFontSize}px`, fontFamily: 'Arial Black', color: stat.color
            }).setOrigin(1, 0.5);
        });

        // Fun comment
        let comment = '';
        if (this.normalHit > 3) comment = '"Il tribunale dei consumatori ti cerca..."';
        else if (this.hoardersCaught > 10) comment = '"Sei il terrore degli accaparratori!"';
        else if (this.hoardersEscaped > 3) comment = '"La benzina è finita per colpa tua!"';
        else comment = '"Non male per un tiratore dal balcone!"';

        this.add.text(cx, H * 0.77, comment, {
            fontSize: `${Math.round(H * 0.021)}px`, fontFamily: 'Arial', color: '#888888', fontStyle: 'italic'
        }).setOrigin(0.5);

        // ---- Restart button ----
        const btnW = 220, btnH2 = 46;
        const btnY = H * 0.86;

        const btnBg = this.add.graphics();
        const drawBtn = (color) => {
            btnBg.clear();
            btnBg.fillStyle(color, 1);
            btnBg.fillRoundedRect(cx - btnW / 2, btnY - btnH2 / 2, btnW, btnH2, 10);
        };
        drawBtn(0xff6600);

        this.add.text(cx, btnY, '🔄 RIGIOCA!', {
            fontSize: `${Math.round(H * 0.036)}px`, fontFamily: 'Arial Black', color: '#ffffff'
        }).setOrigin(0.5);

        const btnZone = this.add.zone(cx, btnY, btnW, btnH2).setInteractive({ useHandCursor: true });
        btnZone.on('pointerover', () => drawBtn(0xff8833));
        btnZone.on('pointerout', () => drawBtn(0xff6600));
        btnZone.on('pointerdown', () => this.scene.start('GameScene'));

        // Menu link
        this.add.text(cx, H * 0.94, '🏠 Menu Principale', {
            fontSize: `${Math.round(H * 0.023)}px`, fontFamily: 'Arial', color: '#aaaaaa'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })
            .on('pointerover', function () { this.setColor('#ffffff'); })
            .on('pointerout', function () { this.setColor('#aaaaaa'); })
            .on('pointerdown', () => this.scene.start('MenuScene'));

        // Keyboard restart (desktop)
        this.input.keyboard.once('keydown-SPACE', () => this.scene.start('GameScene'));
        this.input.keyboard.once('keydown-ESC', () => this.scene.start('MenuScene'));
    }
}
