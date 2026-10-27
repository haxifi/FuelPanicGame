/**
 * GameOverScene - Shows final score and stats
 * Uses proportional positions so everything fits on any aspect ratio or orientation.
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
        this.cameras.main.setBackgroundColor('#1a0a0a');

        // Title
        this.titleText = this.add.text(0, 0, t('gameover.title'), {
            fontFamily: 'Arial Black',
            color: '#ff3300',
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5);

        // Reason
        const reasonText = this.reason === 'TIME_UP'
            ? t('gameover.reason_time_up')
            : t('gameover.reason_fuel_out');

        this.reasonText = this.add.text(0, 0, reasonText, {
            fontFamily: 'Arial',
            color: '#ff9966',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        // Score label
        this.scoreLabel = this.add.text(0, 0, t('gameover.final_score_label'), {
            fontFamily: 'Arial',
            color: '#aaaaaa'
        }).setOrigin(0.5);

        // Score number
        this.scoreDisplay = this.add.text(0, 0, '0', {
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
                if (this.scoreDisplay) {
                    this.scoreDisplay.setText(Math.floor(tween.getValue()).toString());
                }
            }
        });

        // Rating
        let rating, ratingColor;
        if (this.finalScore >= 1500) { rating = t('gameover.rating_hero'); ratingColor = '#ffcc00'; }
        else if (this.finalScore >= 800) { rating = t('gameover.rating_great'); ratingColor = '#66ff66'; }
        else if (this.finalScore >= 400) { rating = t('gameover.rating_ok'); ratingColor = '#66aaff'; }
        else { rating = t('gameover.rating_bad'); ratingColor = '#ff6666'; }

        this.ratingDisplay = this.add.text(0, 0, rating, {
            fontFamily: 'Arial Black',
            color: ratingColor,
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Stats
        const stats = [
            { icon: '🎯', label: t('gameover.stat_hoarders_caught'), value: this.hoardersCaught, color: '#66ff66' },
            { icon: '💨', label: t('gameover.stat_hoarders_escaped'), value: this.hoardersEscaped, color: '#ff6666' },
            { icon: '😱', label: t('gameover.stat_innocents_hit'), value: this.normalHit, color: '#ff4444' },
            { icon: '📈', label: t('gameover.stat_level_reached'), value: this.finalDifficulty, color: '#aaaaff' }
        ];

        this.statsElements = stats.map(stat => {
            const labelObj = this.add.text(0, 0, `${stat.icon} ${stat.label}:`, {
                fontFamily: 'Arial',
                color: '#cccccc'
            }).setOrigin(0, 0.5);

            const valObj = this.add.text(0, 0, stat.value.toString(), {
                fontFamily: 'Arial Black',
                color: stat.color
            }).setOrigin(1, 0.5);

            return { label: labelObj, value: valObj };
        });

        // Fun comment
        let comment = '';
        if (this.normalHit > 3) comment = t('gameover.comment_tribunal');
        else if (this.hoardersCaught > 10) comment = t('gameover.comment_terror');
        else if (this.hoardersEscaped > 3) comment = t('gameover.comment_fuel_gone');
        else comment = t('gameover.comment_default');

        this.commentText = this.add.text(0, 0, comment, {
            fontFamily: 'Arial',
            color: '#888888',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        // ---- Restart button ----
        this.btnBg = this.add.graphics();
        this.btnText = this.add.text(0, 0, t('gameover.restart_button'), {
            fontFamily: 'Arial Black',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.btnZone = this.add.zone(0, 0, 220, 46).setInteractive({ useHandCursor: true });
        this.btnZone.on('pointerover', () => this.drawBtn(0xff8833));
        this.btnZone.on('pointerout', () => this.drawBtn(0xff6600));
        this.btnZone.on('pointerdown', () => this.scene.start('GameScene'));

        // Menu link
        this.menuLink = this.add.text(0, 0, t('gameover.main_menu'), {
            fontFamily: 'Arial',
            color: '#aaaaaa'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })
            .on('pointerover', function () { this.setColor('#ffffff'); })
            .on('pointerout', function () { this.setColor('#aaaaaa'); })
            .on('pointerdown', () => this.scene.start('MenuScene'));

        // Keyboard restart (desktop)
        this.input.keyboard.once('keydown-SPACE', () => this.scene.start('GameScene'));
        this.input.keyboard.once('keydown-ESC', () => this.scene.start('MenuScene'));

        // Initial layout
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

        if (this.titleText) {
            this.titleText
                .setPosition(cx, H * 0.08)
                .setFontSize(`${Math.max(18, Math.round(H * 0.065))}px`);
        }

        if (this.reasonText) {
            this.reasonText
                .setPosition(cx, H * 0.17)
                .setFontSize(`${Math.max(11, Math.round(H * 0.03))}px`);
        }

        if (this.scoreLabel) {
            this.scoreLabel
                .setPosition(cx, H * 0.26)
                .setFontSize(`${Math.max(10, Math.round(H * 0.025))}px`);
        }

        if (this.scoreDisplay) {
            this.scoreDisplay
                .setPosition(cx, H * 0.34)
                .setFontSize(`${Math.max(20, Math.round(H * 0.08))}px`);
        }

        if (this.ratingDisplay) {
            this.ratingDisplay
                .setPosition(cx, H * 0.43)
                .setFontSize(`${Math.max(12, Math.round(H * 0.032))}px`);
        }

        const statsFontSize = Math.max(10, Math.round(H * 0.024));
        const statsValueFontSize = Math.max(11, Math.round(H * 0.028));
        const statsStartY = H * 0.51;
        const statsLineH = Math.max(16, H * 0.055);
        const statsHalfW = Math.min(180, W * 0.22);

        if (this.statsElements) {
            this.statsElements.forEach((pair, i) => {
                const y = statsStartY + i * statsLineH;
                pair.label
                    .setPosition(cx - statsHalfW, y)
                    .setFontSize(`${statsFontSize}px`);
                pair.value
                    .setPosition(cx + statsHalfW, y)
                    .setFontSize(`${statsValueFontSize}px`);
            });
        }

        if (this.commentText) {
            this.commentText
                .setPosition(cx, H * 0.77)
                .setFontSize(`${Math.max(9, Math.round(H * 0.021))}px`);
        }

        this.btnW = Math.min(240, W * 0.38);
        this.btnH = Math.min(50, H * 0.11);
        this.btnCenterX = cx;
        this.btnCenterY = H * 0.86;

        this.drawBtn(0xff6600);

        if (this.btnText) {
            this.btnText
                .setPosition(cx, this.btnCenterY)
                .setFontSize(`${Math.max(13, Math.round(H * 0.036))}px`);
        }

        if (this.btnZone) {
            this.btnZone
                .setPosition(cx, this.btnCenterY)
                .setSize(this.btnW, this.btnH);
        }

        if (this.menuLink) {
            this.menuLink
                .setPosition(cx, H * 0.94)
                .setFontSize(`${Math.max(10, Math.round(H * 0.023))}px`);
        }
    }
}
