/**
 * GameScene - Main gameplay scene
 * Supports both desktop (mouse + keyboard) and mobile (touch) input.
 */
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // ---- Game state ----
        this.score = 0;
        this.ammo = 6;
        this.maxAmmo = 6;
        this.isReloading = false;
        this.reloadTime = 1500; // ms
        this.gameTime = 90; // seconds
        this.timeLeft = this.gameTime;
        this.difficulty = 1;
        this.fuelStolen = 0;
        this.maxFuelStolen = 5; // lose if this many hoarders escape
        this.hoardersEscaped = 0;
        this.normalHit = 0;
        this.hoardersCaught = 0;
        this.customers = [];
        this.gameOver = false;
        this.combo = 0;
        this.comboTimer = 0;

        // ---- Background ----
        this.add.image(512, 300, 'background').setDepth(0);

        // ---- Station sign text ----
        this.add.text(500, 162, 'TurbOil Service & Fuel 😎', {
            fontSize: '14px',
            fontFamily: 'Arial Black',
            color: '#cc0000'
        }).setOrigin(0.5).setDepth(1);

        // ---- Fuel pumps ----
        this.pumps = [];
        const pumpXPositions = [200, 380, 560, 740];
        pumpXPositions.forEach((px, i) => {
            const pump = new FuelPump(this, px, 400, i);
            this.pumps.push(pump);
        });

        // ---- Balcony railing (foreground) ----
        this.add.image(512, 580, 'balconyRailing').setDepth(10);

        // ---- HUD ----
        this.createHUD();

        // ---- Crosshair (desktop only) ----
        this.crosshair = this.add.sprite(512, 300, 'crosshair').setDepth(100);
        if (isTouchDevice) {
            this.crosshair.setVisible(false);
        }

        // ---- Input ----
        this.input.on('pointermove', (pointer) => {
            this.crosshair.x = pointer.x;
            this.crosshair.y = pointer.y;
        });

        this.input.on('pointerdown', (pointer) => {
            // On touch devices any tap fires; on desktop only left button
            if (isTouchDevice) {
                // Ignore taps on the reload button area (handled separately)
                if (this.reloadBtn && this.reloadBtn.getBounds().contains(pointer.x, pointer.y)) {
                    return;
                }
                this.shoot(pointer.x, pointer.y);
            } else if (pointer.leftButtonDown()) {
                this.shoot(pointer.x, pointer.y);
            }
        });

        this.input.keyboard.on('keydown-R', () => {
            this.reload();
        });

        // ---- Timers ----
        this.spawnTimer = this.time.addEvent({
            delay: 2500,
            callback: this.spawnCustomer,
            callbackScope: this,
            loop: true
        });

        this.difficultyTimer = this.time.addEvent({
            delay: 10000,
            callback: this.increaseDifficulty,
            callbackScope: this,
            loop: true
        });

        // Game clock
        this.clockEvent = this.time.addEvent({
            delay: 1000,
            callback: this.tickClock,
            callbackScope: this,
            loop: true
        });

        // Spawn initial customers
        this.time.delayedCall(500, () => this.spawnCustomer());
        this.time.delayedCall(1200, () => this.spawnCustomer());

        // ---- Italian flavor messages ----
        this.flavorMessages = [
            '"Ma che fai?! Riempi solo il serbatoio!"',
            '"Mamma mia, un\'altra tanica!"',
            '"Qui non si fa scorta!"',
            '"Il benzinaio piange!"',
            '"Prezzi alle stelle, pazzi in fila!"',
            '"Hanno portato pure la vasca da bagno!"',
            '"Emergenza carburante!"'
        ];
        this.showRandomMessage();
    }

    createHUD() {
        const hudY = 20;

        // Score
        this.add.text(20, hudY, '🎯 PUNTI:', {
            fontSize: '16px', fontFamily: 'Arial', color: '#ffffff'
        }).setDepth(50).setScrollFactor(0);

        this.scoreText = this.add.text(120, hudY, '0', {
            fontSize: '20px', fontFamily: 'Arial Black', color: '#ffcc00'
        }).setDepth(50).setScrollFactor(0);

        // Ammo
        this.ammoContainer = this.add.container(20, hudY + 35).setDepth(50);
        this.ammoText = this.add.text(0, 0, '🔫', {
            fontSize: '16px', fontFamily: 'Arial', color: '#ffffff'
        });
        this.ammoContainer.add(this.ammoText);
        this.ammoBullets = [];
        this.updateAmmoDisplay();

        // Reload indicator
        this.reloadText = this.add.text(150, hudY + 35, '', {
            fontSize: '14px', fontFamily: 'Arial Black', color: '#ffaa00'
        }).setDepth(50).setScrollFactor(0).setAlpha(0);

        // ---- On-screen reload button (touch devices) ----
        if (isTouchDevice) {
            // Background circle
            const rBtnG = this.add.graphics().setDepth(55).setScrollFactor(0);
            rBtnG.fillStyle(0x444444, 0.7);
            rBtnG.fillCircle(60, 540, 28);
            rBtnG.lineStyle(2, 0xffaa00, 0.9);
            rBtnG.strokeCircle(60, 540, 28);

            this.reloadBtn = this.add.text(60, 540, '🔄 R', {
                fontSize: '16px', fontFamily: 'Arial Black', color: '#ffcc00'
            }).setOrigin(0.5).setDepth(56).setScrollFactor(0)
              .setInteractive({ useHandCursor: true });

            this.reloadBtn.on('pointerdown', () => {
                this.reload();
            });
        }

        // Timer
        this.add.text(890, hudY, '⏱️', {
            fontSize: '16px', fontFamily: 'Arial', color: '#ffffff'
        }).setDepth(50).setScrollFactor(0);

        this.timerText = this.add.text(920, hudY, this.formatTime(this.timeLeft), {
            fontSize: '20px', fontFamily: 'Arial Black', color: '#ffffff'
        }).setDepth(50).setScrollFactor(0);

        // Fuel stolen meter
        this.add.text(800, hudY + 35, 'Carburante rubato:', {
            fontSize: '12px', fontFamily: 'Arial', color: '#ff6666'
        }).setDepth(50).setScrollFactor(0);

        this.fuelStolenBar = this.add.graphics().setDepth(50).setScrollFactor(0);
        this.updateFuelStolenBar();

        // Combo text
        this.comboText = this.add.text(512, 100, '', {
            fontSize: '24px', fontFamily: 'Arial Black', color: '#ff6600',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(50).setAlpha(0);

        // Difficulty indicator
        this.diffText = this.add.text(450, hudY, 'Livello: 1', {
            fontSize: '14px', fontFamily: 'Arial', color: '#aaaaaa'
        }).setDepth(50).setScrollFactor(0);

        // Message area
        this.messageText = this.add.text(512, 560, '', {
            fontSize: '13px', fontFamily: 'Arial', color: '#ffcc00',
            fontStyle: 'italic', stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(11);
    }

    updateAmmoDisplay() {
        // Clear old bullets
        this.ammoBullets.forEach(b => b.destroy());
        this.ammoBullets = [];

        for (let i = 0; i < this.maxAmmo; i++) {
            const bullet = this.add.text(30 + i * 18, 55, '|', {
                fontSize: '20px',
                fontFamily: 'Courier',
                fontStyle: 'bold',
                color: i < this.ammo ? '#ffcc00' : '#444444'
            }).setDepth(50);
            this.ammoBullets.push(bullet);
        }
    }

    updateFuelStolenBar() {
        this.fuelStolenBar.clear();

        const barX = 800, barY = 70, barW = 180, barH = 12;

        // Background
        this.fuelStolenBar.fillStyle(0x333333, 0.8);
        this.fuelStolenBar.fillRoundedRect(barX, barY, barW, barH, 3);

        // Fill
        const pct = this.hoardersEscaped / this.maxFuelStolen;
        const fillColor = pct < 0.5 ? 0xffcc00 : pct < 0.8 ? 0xff6600 : 0xff0000;
        this.fuelStolenBar.fillStyle(fillColor, 1);
        this.fuelStolenBar.fillRoundedRect(barX, barY, barW * pct, barH, 3);

        // Border
        this.fuelStolenBar.lineStyle(1, 0xffffff, 0.5);
        this.fuelStolenBar.strokeRoundedRect(barX, barY, barW, barH, 3);
    }

    shoot(x, y) {
        if (this.gameOver) return;
        if (this.isReloading) {
            this.playSound('sfx_empty');
            return;
        }
        if (this.ammo <= 0) {
            this.playSound('sfx_empty');
            // Auto-reload when empty
            this.reload();
            return;
        }

        this.ammo--;
        this.updateAmmoDisplay();
        this.playSound('sfx_shoot');

        // Muzzle flash effect
        const flash = this.add.sprite(x, y, 'muzzleFlash').setDepth(15).setScale(0.5);
        this.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 1,
            duration: 150,
            onComplete: () => flash.destroy()
        });

        // Screen shake
        this.cameras.main.shake(50, 0.003);

        // Check hits on customers.
        // An ApeCar requires two hits: its first hit is valid, but does not
        // capture it and must not trigger the penalty for hitting a normal customer.
        let hitSomething = false;

        for (let i = this.customers.length - 1; i >= 0; i--) {
            const cust = this.customers[i];

            if (
                cust.state === Customer.STATES.GONE ||
                cust.state === Customer.STATES.HIT
            ) {
                continue;
            }

            if (!cust.checkHit(x, y)) {
                continue;
            }

            const isApeCar = cust.isApeCar === true;
            const wasHoarder = cust.hit();
            hitSomething = true;

            // Customer.hit() returns false when the ApeCar takes its first hit.
            // It remains active instead of entering HIT/GONE, so do not penalize it.
            const apeCarSurvivedHit =
                isApeCar &&
                !wasHoarder &&
                cust.state !== Customer.STATES.HIT &&
                cust.state !== Customer.STATES.GONE;

            if (apeCarSurvivedHit) {
                this.playSound('sfx_hit');
                this.showPoints(x, y - 30, 'COLPITO!', '#ffaa00');
                this.createHitParticles(x, y);
            } else if (wasHoarder) {
                // Hoarder captured: award points and increase the combo.
                this.hoardersCaught++;
                this.combo++;
                this.comboTimer = 3000;

                const comboBonus = this.combo > 1 ? this.combo : 0;
                const points = 100 + comboBonus * 50;
                this.score += points;

                this.playSound('sfx_hit');
                this.showPoints(x, y - 30, `+${points}`, '#00ff00');

                if (this.combo > 1) {
                    this.comboText.setText(`COMBO x${this.combo}!`);
                    this.comboText.setAlpha(1);

                    this.tweens.add({
                        targets: this.comboText,
                        alpha: 0,
                        y: 80,
                        duration: 1500,
                        onComplete: () => {
                            this.comboText.y = 100;
                        }
                    });
                }

                this.createHitParticles(x, y);
            } else {
                // Normal customer hit: apply the existing penalty.
                this.normalHit++;
                this.score = Math.max(0, this.score - 150);
                this.combo = 0;

                this.playSound('sfx_miss');
                this.showPoints(x, y - 30, '-150', '#ff0000');

                this.cameras.main.flash(200, 255, 0, 0, false, null, this);

                // Penalty: stolen fuel increases.
                this.hoardersEscaped += 0.5;
                this.updateFuelStolenBar();
            }

            break; // Only one customer can be hit by each shot.
        }

        if (!hitSomething) {
            // Bullet hole on background.
            new Bullet(this, x, y);
            this.playSound('sfx_miss');
        }

        // Auto-reload if empty
        if (this.ammo <= 0) {
            this.time.delayedCall(300, () => this.reload());
        }
    }

    reload() {
        if (this.isReloading || this.ammo === this.maxAmmo || this.gameOver) return;

        this.isReloading = true;
        this.playSound('sfx_reload');

        this.reloadText.setText('RICARICA...');
        this.reloadText.setAlpha(1);

        // Reload animation
        this.tweens.add({
            targets: this.reloadText,
            alpha: { from: 1, to: 0.3 },
            duration: 200,
            yoyo: true,
            repeat: 3,
            onComplete: () => {
                this.ammo = this.maxAmmo;
                this.isReloading = false;
                this.reloadText.setAlpha(0);
                this.updateAmmoDisplay();
            }
        });
    }

    spawnCustomer() {
        if (this.gameOver) return;

        // Find free pump
        const freePumps = this.pumps.filter(p => !p.occupied);
        if (freePumps.length === 0) return;

        const pump = Phaser.Utils.Array.GetRandom(freePumps);

        // Hoarder probability increases with difficulty
        const hoarderChance = 0.25 + this.difficulty * 0.06;
        const isHoarder = Math.random() < hoarderChance;

        const customer = new Customer(this, pump, isHoarder, this.difficulty);
        customer.y = pump.y + 30;
        pump.occupy(customer);

        this.customers.push(customer);
    }

    increaseDifficulty() {
        if (this.gameOver) return;

        this.difficulty += 0.5;
        this.diffText.setText(`Livello: ${Math.floor(this.difficulty)}`);

        // Speed up spawning
        const newDelay = Math.max(800, 2500 - this.difficulty * 200);
        this.spawnTimer.remove();
        this.spawnTimer = this.time.addEvent({
            delay: newDelay,
            callback: this.spawnCustomer,
            callbackScope: this,
            loop: true
        });

        // Flash difficulty change
        const flash = this.add.text(512, 150, `⬆️ DIFFICOLTÀ AUMENTATA!`, {
            fontSize: '18px', fontFamily: 'Arial Black', color: '#ff6600',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(50);

        this.tweens.add({
            targets: flash,
            alpha: 0,
            y: 120,
            duration: 2000,
            onComplete: () => flash.destroy()
        });
    }

    tickClock() {
        if (this.gameOver) return;

        this.timeLeft--;
        this.timerText.setText(this.formatTime(this.timeLeft));

        // Color change when low
        if (this.timeLeft <= 10) {
            this.timerText.setColor('#ff0000');
            this.playSound('sfx_alarm');

            this.tweens.add({
                targets: this.timerText,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 200,
                yoyo: true
            });
        } else if (this.timeLeft <= 30) {
            this.timerText.setColor('#ffcc00');
        }

        if (this.timeLeft <= 0) {
            this.endGame('TIME_UP');
        }
    }

    showRandomMessage() {
        if (this.gameOver) return;

        const msg = this.flavorMessages[Math.floor(Math.random() * this.flavorMessages.length)];
        this.messageText.setText(msg);
        this.messageText.setAlpha(1);

        this.tweens.add({
            targets: this.messageText,
            alpha: 0,
            duration: 4000,
            onComplete: () => {
                this.time.delayedCall(3000 + Math.random() * 5000, () => {
                    this.showRandomMessage();
                });
            }
        });
    }

    showPoints(x, y, text, color) {
        const txt = this.add.text(x, y, text, {
            fontSize: '22px',
            fontFamily: 'Arial Black',
            color: color,
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(20);

        this.tweens.add({
            targets: txt,
            y: y - 50,
            alpha: 0,
            duration: 1000,
            onComplete: () => txt.destroy()
        });
    }

    createHitParticles(x, y) {
        // Simple particle burst using sprites
        for (let i = 0; i < 8; i++) {
            const p = this.add.sprite(x, y, 'particle').setDepth(15);
            p.setTint(Phaser.Utils.Array.GetRandom([0xff6600, 0xffcc00, 0xff0000, 0xffffff]));
            const angle = (Math.PI * 2 / 8) * i;
            const speed = 50 + Math.random() * 80;
            this.tweens.add({
                targets: p,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed,
                alpha: 0,
                scale: 0.2,
                duration: 400 + Math.random() * 300,
                onComplete: () => p.destroy()
            });
        }
    }

    playSound(key) {
        try {
            if (this.sound && this.cache.audio.exists(key)) {
                this.sound.play(key, { volume: 0.5 });
            }
        } catch (e) {
            // Sounds are optional
        }
    }

    endGame(reason) {
        if (this.gameOver) return;
        this.gameOver = true;

        // Stop timers
        this.spawnTimer.remove();
        this.difficultyTimer.remove();
        this.clockEvent.remove();

        // Dramatic slow-mo
        this.cameras.main.flash(500, 255, 100, 0);

        // Show game over text briefly
        const overText = this.add.text(512, 250, reason === 'TIME_UP' ? '⏱️ TEMPO SCADUTO!' : '⛽ BENZINA ESAURITA!', {
            fontSize: '36px', fontFamily: 'Arial Black', color: '#ff0000',
            stroke: '#000000', strokeThickness: 5
        }).setOrigin(0.5).setDepth(100);

        this.tweens.add({
            targets: overText,
            scale: 1.2,
            duration: 1000,
            yoyo: true,
            onComplete: () => {
                this.scene.start('GameOverScene', {
                    score: this.score,
                    hoardersCaught: this.hoardersCaught,
                    hoardersEscaped: Math.floor(this.hoardersEscaped),
                    normalHit: this.normalHit,
                    difficulty: Math.floor(this.difficulty),
                    reason: reason
                });
            }
        });
    }

    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    update(time, delta) {
        if (this.gameOver) return;

        // Update combo timer
        if (this.combo > 0) {
            this.comboTimer -= delta;
            if (this.comboTimer <= 0) {
                this.combo = 0;
            }
        }

        // Update customers
        for (let i = this.customers.length - 1; i >= 0; i--) {
            const cust = this.customers[i];
            if (cust.state === Customer.STATES.GONE) {
                this.customers.splice(i, 1);
                continue;
            }
            cust.update(time, delta);
        }

        // Check for escaped hoarders
        for (const cust of this.customers) {
            if (cust.isHoarder && cust.state === Customer.STATES.LEAVING && !cust.wasHit && !cust.penalized) {
                if (cust.escapedAsHoarder()) {
                    this.hoardersEscaped++;
                    this.updateFuelStolenBar();
                    this.combo = 0;

                    if (this.hoardersEscaped >= this.maxFuelStolen) {
                        this.endGame('FUEL_OUT');
                    }
                }
            }
        }

        // Update score display
        this.scoreText.setText(this.score.toString());
    }
}
