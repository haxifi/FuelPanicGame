/**
 * GameScene - Main gameplay scene
 * Supports both desktop (mouse + keyboard) and mobile (touch) input.
 * All positions are computed relative to camera dimensions for full responsiveness.
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

        // ---- Responsive layout helpers ----
        const W = this.cameras.main.width;
        const H = this.cameras.main.height;
        this._W = W;
        this._H = H;
        this._sx = W / DESIGN_WIDTH;
        this._sy = H / DESIGN_HEIGHT;

        // ---- Background ----
        this.bgImage = this.add.image(W / 2, H / 2, 'background')
            .setDisplaySize(W, H).setDepth(0);

        // ---- Station sign text ----
        this.stationSign = this.add.text(W * (500 / 1024), H * (162 / 600), 'TurbOil Service & Fuel 😎', {
            fontSize: `${Math.round(14 * this._sy)}px`,
            fontFamily: 'Arial Black',
            color: '#cc0000'
        }).setOrigin(0.5).setDepth(1);

        // ---- Fuel pumps ----
        this.pumps = [];
        const pumpXRatios = [200 / 1024, 380 / 1024, 560 / 1024, 740 / 1024];
        const pumpYRatio = 400 / 600;
        pumpXRatios.forEach((ratio, i) => {
            const pump = new FuelPump(this, W * ratio, H * pumpYRatio, i);
            this.pumps.push(pump);
        });

        // ---- Balcony railing (foreground) ----
        this.balcony = this.add.image(W / 2, H * (580 / 600), 'balconyRailing')
            .setDisplaySize(W, 34 * this._sy).setDepth(10);

        // ---- HUD ----
        this.createHUD();

        // ---- Crosshair (desktop only) ----
        this.crosshair = this.add.sprite(W / 2, H / 2, 'crosshair').setDepth(100);
        if (isTouchDevice) {
            this.crosshair.setVisible(false);
        }

        // ---- Input ----
        this.input.on('pointermove', (pointer) => {
            this.crosshair.x = pointer.x;
            this.crosshair.y = pointer.y;
        });

        this.input.on('pointerdown', (pointer) => {
            // Check if the user tapped on the reload button area and reload without firing a shot
            if (this.isReloadButtonArea(pointer.x, pointer.y)) {
                this.triggerReload();
                return;
            }

            // On touch devices any tap fires; on desktop only left button
            if (isTouchDevice) {
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

        // ---- Flavor messages ----
        this.flavorMessages = t('game.flavor_messages');
        this.showRandomMessage();

        // ---- Handle resize ----
        this.scale.on('resize', this.handleResize, this);
    }

    handleResize(gameSize) {
        const W = gameSize.width;
        const H = gameSize.height;
        this._W = W;
        this._H = H;
        this._sx = W / DESIGN_WIDTH;
        this._sy = H / DESIGN_HEIGHT;

        this.cameras.main.setSize(W, H);

        // Reposition background
        if (this.bgImage) {
            this.bgImage.setPosition(W / 2, H / 2).setDisplaySize(W, H);
        }

        // Reposition station sign
        if (this.stationSign) {
            this.stationSign.setPosition(W * (500 / 1024), H * (162 / 600));
            this.stationSign.setFontSize(Math.round(14 * this._sy));
        }

        // Reposition balcony
        if (this.balcony) {
            this.balcony.setPosition(W / 2, H * (580 / 600))
                .setDisplaySize(W, 34 * this._sy);
        }

        // Reposition pumps
        const pumpXRatios = [200 / 1024, 380 / 1024, 560 / 1024, 740 / 1024];
        const pumpYRatio = 400 / 600;
        this.pumps.forEach((pump, i) => {
            pump.setPosition(W * pumpXRatios[i], H * pumpYRatio);
        });

        // Reposition active customers associated with pumps
        if (this.customers) {
            this.customers.forEach((cust) => {
                if (cust.pump && cust.state !== Customer.STATES.LEAVING && cust.state !== Customer.STATES.GONE) {
                    cust.targetX = cust.pump.x;
                    cust.targetY = cust.pump.y + 30;
                    if (cust.state !== Customer.STATES.ARRIVING) {
                        cust.x = cust.targetX;
                        cust.y = cust.targetY;
                    }
                    if (cust.updateScale) cust.updateScale();
                }
            });
        }

        // Reposition HUD elements
        this.repositionHUD(W, H);
    }

    createHUD() {
        const W = this._W;
        const H = this._H;
        const sx = this._sx;
        const sy = this._sy;
        const hudY = 20 * sy;

        // Score
        this.scoreLabel = this.add.text(20 * sx, hudY, t('game.score_label'), {
            fontSize: `${Math.round(16 * sy)}px`, fontFamily: 'Arial', color: '#ffffff'
        }).setDepth(50).setScrollFactor(0);

        this.scoreText = this.add.text(120 * sx, hudY, '0', {
            fontSize: `${Math.round(20 * sy)}px`, fontFamily: 'Arial Black', color: '#ffcc00'
        }).setDepth(50).setScrollFactor(0);

        // Ammo
        this.ammoContainer = this.add.container(20 * sx, hudY + 35 * sy).setDepth(50);
        this.ammoText = this.add.text(0, 0, '🔫', {
            fontSize: `${Math.round(16 * sy)}px`, fontFamily: 'Arial', color: '#ffffff'
        });
        this.ammoContainer.add(this.ammoText);
        this.ammoBullets = [];
        this.updateAmmoDisplay();

        // Reload indicator
        this.reloadText = this.add.text(150 * sx, hudY + 35 * sy, '', {
            fontSize: `${Math.round(14 * sy)}px`, fontFamily: 'Arial Black', color: '#ffaa00'
        }).setDepth(50).setScrollFactor(0).setAlpha(0);

        // ---- On-screen reload button (touch devices) ----
        if (isTouchDevice) {
            const btnScale = Math.min(sx, sy);
            this.reloadBtnRadius = Math.max(30, 32 * btnScale);
            this.reloadBtnX = Math.max(this.reloadBtnRadius + 18, 65 * sx);
            this.reloadBtnY = H - Math.max(this.reloadBtnRadius + 18, 65 * sy);

            // Background circle
            this.reloadBtnBg = this.add.graphics().setDepth(55).setScrollFactor(0);

            // Text
            this.reloadBtn = this.add.text(this.reloadBtnX, this.reloadBtnY, '🔄 R', {
                fontSize: `${Math.round(Math.max(16, 18 * btnScale))}px`,
                fontFamily: 'Arial Black',
                color: '#ffcc00'
            }).setOrigin(0.5).setDepth(56).setScrollFactor(0);

            // Interactive zone with generous touch padding (at least 75-80px hit target)
            const touchSize = this.reloadBtnRadius * 2.5;
            this.reloadZone = this.add.zone(this.reloadBtnX, this.reloadBtnY, touchSize, touchSize)
                .setOrigin(0.5)
                .setDepth(57)
                .setScrollFactor(0)
                .setInteractive({ useHandCursor: true });

            this.reloadZone.on('pointerdown', () => {
                this.triggerReload();
            });

            this.drawReloadButton(false);
        }

        // Timer
        this.timerIcon = this.add.text(W - 134 * sx, hudY, '⏱️', {
            fontSize: `${Math.round(16 * sy)}px`, fontFamily: 'Arial', color: '#ffffff'
        }).setDepth(50).setScrollFactor(0);

        this.timerText = this.add.text(W - 104 * sx, hudY, this.formatTime(this.timeLeft), {
            fontSize: `${Math.round(20 * sy)}px`, fontFamily: 'Arial Black', color: '#ffffff'
        }).setDepth(50).setScrollFactor(0);

        // Fuel stolen meter
        this.fuelStolenLabel = this.add.text(W - 224 * sx, hudY + 35 * sy, t('game.fuel_stolen_label'), {
            fontSize: `${Math.round(12 * sy)}px`, fontFamily: 'Arial', color: '#ff6666'
        }).setDepth(50).setScrollFactor(0);

        this.fuelStolenBar = this.add.graphics().setDepth(50).setScrollFactor(0);
        this.updateFuelStolenBar();

        // Combo text
        this.comboText = this.add.text(W / 2, H * (100 / 600), '', {
            fontSize: `${Math.round(24 * sy)}px`, fontFamily: 'Arial Black', color: '#ff6600',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(50).setAlpha(0);

        // Difficulty indicator
        this.diffText = this.add.text(W * (450 / 1024), hudY, t('game.difficulty_label', { level: 1 }), {
            fontSize: `${Math.round(14 * sy)}px`, fontFamily: 'Arial', color: '#aaaaaa'
        }).setDepth(50).setScrollFactor(0);

        // Message area
        this.messageText = this.add.text(W / 2, H * (560 / 600), '', {
            fontSize: `${Math.round(13 * sy)}px`, fontFamily: 'Arial', color: '#ffcc00',
            fontStyle: 'italic', stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(11);
    }

    repositionHUD(W, H) {
        const sx = this._sx;
        const sy = this._sy;
        const hudY = 20 * sy;

        if (this.scoreLabel) {
            this.scoreLabel.setPosition(20 * sx, hudY);
            this.scoreLabel.setFontSize(Math.round(16 * sy));
        }
        if (this.scoreText) {
            this.scoreText.setPosition(120 * sx, hudY);
            this.scoreText.setFontSize(Math.round(20 * sy));
        }
        if (this.ammoContainer) {
            this.ammoContainer.setPosition(20 * sx, hudY + 35 * sy);
        }
        if (this.reloadText) {
            this.reloadText.setPosition(150 * sx, hudY + 35 * sy);
            this.reloadText.setFontSize(Math.round(14 * sy));
        }
        if (this.timerIcon) {
            this.timerIcon.setPosition(W - 134 * sx, hudY);
            this.timerIcon.setFontSize(Math.round(16 * sy));
        }
        if (this.timerText) {
            this.timerText.setPosition(W - 104 * sx, hudY);
            this.timerText.setFontSize(Math.round(20 * sy));
        }
        if (this.fuelStolenLabel) {
            this.fuelStolenLabel.setPosition(W - 224 * sx, hudY + 35 * sy);
            this.fuelStolenLabel.setFontSize(Math.round(12 * sy));
        }
        if (this.comboText) {
            this.comboText.setPosition(W / 2, H * (100 / 600));
            this.comboText.setFontSize(Math.round(24 * sy));
        }
        if (this.diffText) {
            this.diffText.setPosition(W * (450 / 1024), hudY);
            this.diffText.setFontSize(Math.round(14 * sy));
        }
        if (this.messageText) {
            this.messageText.setPosition(W / 2, H * (560 / 600));
            this.messageText.setFontSize(Math.round(13 * sy));
        }

        // Reload button repositioning
        if (isTouchDevice && this.reloadBtnBg) {
            const btnScale = Math.min(sx, sy);
            this.reloadBtnRadius = Math.max(30, 32 * btnScale);
            this.reloadBtnX = Math.max(this.reloadBtnRadius + 18, 65 * sx);
            this.reloadBtnY = H - Math.max(this.reloadBtnRadius + 18, 65 * sy);

            this.drawReloadButton(this.isReloading);

            if (this.reloadBtn) {
                this.reloadBtn.setPosition(this.reloadBtnX, this.reloadBtnY);
                this.reloadBtn.setFontSize(Math.round(Math.max(16, 18 * btnScale)));
            }

            if (this.reloadZone) {
                const touchSize = this.reloadBtnRadius * 2.5;
                this.reloadZone.setPosition(this.reloadBtnX, this.reloadBtnY);
                this.reloadZone.setSize(touchSize, touchSize);
            }
        }

        this.updateAmmoDisplay();
        this.updateFuelStolenBar();
    }

    updateAmmoDisplay() {
        // Clear old bullets
        this.ammoBullets.forEach(b => b.destroy());
        this.ammoBullets = [];

        const sy = this._sy || 1;
        const sx = this._sx || 1;

        for (let i = 0; i < this.maxAmmo; i++) {
            const bullet = this.add.text(30 * sx + i * 18 * sx, 55 * sy, '|', {
                fontSize: `${Math.round(20 * sy)}px`,
                fontFamily: 'Courier',
                fontStyle: 'bold',
                color: i < this.ammo ? '#ffcc00' : '#444444'
            }).setDepth(50);
            this.ammoBullets.push(bullet);
        }
    }

    updateFuelStolenBar() {
        this.fuelStolenBar.clear();

        const W = this._W || DESIGN_WIDTH;
        const sx = this._sx || 1;
        const sy = this._sy || 1;
        const barX = W - 224 * sx;
        const barY = 70 * sy;
        const barW = 180 * sx;
        const barH = 12 * sy;

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
                this.showPoints(x, y - 30, t('game.hit_label'), '#ffaa00');
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
                    this.comboText.setText(t('game.combo_label', { count: this.combo }));
                    this.comboText.setAlpha(1);

                    this.tweens.add({
                        targets: this.comboText,
                        alpha: 0,
                        y: this._H * (80 / 600),
                        duration: 1500,
                        onComplete: () => {
                            this.comboText.y = this._H * (100 / 600);
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

    isReloadButtonArea(x, y) {
        if (!this.reloadBtn && !this.reloadZone && !this.reloadBtnBg) return false;
        const radius = (this.reloadBtnRadius || 30) * 1.35;
        const dx = x - (this.reloadBtnX || 0);
        const dy = y - (this.reloadBtnY || 0);
        return (dx * dx + dy * dy) <= (radius * radius);
    }

    triggerReload() {
        if (this.gameOver || this.isReloading) return;
        if (this.ammo === this.maxAmmo) {
            this.playSound('sfx_empty');
            if (this.reloadBtn) {
                this.tweens.add({
                    targets: this.reloadBtn,
                    scale: { from: 1.25, to: 1 },
                    duration: 160
                });
            }
            return;
        }
        this.reload();
    }

    drawReloadButton(active = false) {
        if (!this.reloadBtnBg) return;
        const x = this.reloadBtnX;
        const y = this.reloadBtnY;
        const r = this.reloadBtnRadius;
        const isReloading = active || this.isReloading;

        this.reloadBtnBg.clear();
        this.reloadBtnBg.fillStyle(isReloading ? 0x664400 : 0x222233, 0.85);
        this.reloadBtnBg.fillCircle(x, y, r);
        this.reloadBtnBg.lineStyle(3, isReloading ? 0xffcc00 : 0xffaa00, 1);
        this.reloadBtnBg.strokeCircle(x, y, r);
    }

    reload() {
        if (this.isReloading || this.ammo === this.maxAmmo || this.gameOver) return;

        this.isReloading = true;
        this.playSound('sfx_reload');

        this.reloadText.setText(t('game.reload'));
        this.reloadText.setAlpha(1);

        // Visual feedback on reload button
        this.drawReloadButton(true);
        if (this.reloadBtn) {
            this.tweens.add({
                targets: this.reloadBtn,
                angle: 360,
                duration: 800,
                ease: 'Cubic.easeOut',
                onComplete: () => {
                    if (this.reloadBtn) this.reloadBtn.setAngle(0);
                }
            });
        }

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
                this.drawReloadButton(false);
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
        this.diffText.setText(t('game.difficulty_label', { level: Math.floor(this.difficulty) }));

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
        const flash = this.add.text(this._W / 2, this._H * (150 / 600), t('game.difficulty_up'), {
            fontSize: `${Math.round(18 * this._sy)}px`, fontFamily: 'Arial Black', color: '#ff6600',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(50);

        this.tweens.add({
            targets: flash,
            alpha: 0,
            y: this._H * (120 / 600),
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
        const sy = this._sy || 1;
        const txt = this.add.text(x, y, text, {
            fontSize: `${Math.round(22 * sy)}px`,
            fontFamily: 'Arial Black',
            color: color,
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(20);

        this.tweens.add({
            targets: txt,
            y: y - 50 * sy,
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

        // Clean up resize listener
        this.scale.off('resize', this.handleResize, this);

        // Dramatic slow-mo
        this.cameras.main.flash(500, 255, 100, 0);

        const W = this._W;
        const H = this._H;
        const sy = this._sy;

        // Show game over text briefly
        const overText = this.add.text(W / 2, H * (250 / 600), reason === 'TIME_UP' ? t('game.time_up_text') : t('game.fuel_out_text'), {
            fontSize: `${Math.round(36 * sy)}px`, fontFamily: 'Arial Black', color: '#ff0000',
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
