/**
 * Customer - Normal or Hoarder customer at the fuel station
 * 
 * States: ARRIVING → FUELING_VEHICLE → (FUELING_CANS if hoarder) → LEAVING
 */
class Customer extends Phaser.GameObjects.Container {
    static STATES = {
        ARRIVING: 'arriving',
        FUELING_VEHICLE: 'fueling_vehicle',
        FUELING_CANS: 'fueling_cans',
        LEAVING: 'leaving',
        HIT: 'hit',
        GONE: 'gone'
    };

    constructor(scene, pump, isHoarder, difficulty) {
        super(scene, -60, 0);
        scene.add.existing(this);

        this.pump = pump;
        this.isHoarder = isHoarder;
        this.difficulty = difficulty || 1;
        this.state = Customer.STATES.ARRIVING;
        this.fuelProgress = 0;
        this.cansFilled = 0;
        this.maxCans = isHoarder ? Math.floor(1 + difficulty * 0.5) : 0;
        this.wasHit = false;
        this.scored = false;
        this.penalized = false;
        this.fuelSpeed = 0.3 + difficulty * 0.08; // gets faster with difficulty

        // Vehicle
        const vehicleTypes = isHoarder ? ['van', 'suv'] : ['small', 'suv'];
        const vType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
        this.vehicle = new Vehicle(scene, 0, 0, vType);
        this.add(this.vehicle);

        // Customer sprite
        const custTexture = isHoarder ? 'customerHoarder' : 'customerNormal';
        this.sprite = scene.add.sprite(40, -10, custTexture);
        this.sprite.setOrigin(0.5, 1);
        this.add(this.sprite);

        // Jerry cans (hoarders only)
        this.jerryCanSprites = [];
        if (isHoarder) {
            for (let i = 0; i < this.maxCans; i++) {
                const can = scene.add.sprite(55 + i * 18, -5, 'jerryCan');
                can.setOrigin(0.5, 1);
                can.setAlpha(0.4);
                this.add(can);
                this.jerryCanSprites.push(can);
            }
        }

        // Progress bar background
        this.progressBg = scene.add.graphics();
        this.progressBg.fillStyle(0x333333, 0.7);
        this.progressBg.fillRect(-10, -65, 60, 8);
        this.add(this.progressBg);

        // Progress bar fill
        this.progressBar = scene.add.graphics();
        this.add(this.progressBar);

        // Label showing customer type (hint for players)
        if (isHoarder) {
            this.warningIcon = scene.add.text(0, -75, '⚠️', {
                fontSize: '14px'
            }).setOrigin(0.5);
            this.warningIcon.setAlpha(0);
            this.add(this.warningIcon);
        }

        // Target position near pump
        this.targetX = pump.x;
        this.targetY = pump.y + 30;

        // Scale based on Y position to fake perspective
        this.updateScale();

        this.setDepth(3);

        // Hitbox for shooting
        this.hitArea = new Phaser.Geom.Rectangle(-20, -60, 80, 65);
    }

    updateScale() {
        // Objects lower on screen (farther Y) appear slightly larger -> perspective
        const baseScale = 0.6;
        const perspScale = baseScale + (this.y - 250) * 0.002;
        this.setScale(Phaser.Math.Clamp(perspScale, 0.5, 1.2));
    }

    updateProgressBar() {
        this.progressBar.clear();

        let progress = 0;
        let color = 0x00cc00;

        if (this.state === Customer.STATES.FUELING_VEHICLE) {
            progress = this.fuelProgress;
            color = 0x00cc00;
        } else if (this.state === Customer.STATES.FUELING_CANS) {
            progress = this.fuelProgress;
            color = 0xff6600; // orange for hoarder cans
        }

        if (progress > 0) {
            this.progressBar.fillStyle(color, 0.9);
            this.progressBar.fillRect(-10, -65, 60 * progress, 8);
        }
    }

    checkHit(worldX, worldY) {
        if (this.state === Customer.STATES.GONE || this.state === Customer.STATES.HIT) return false;
        if (this.state === Customer.STATES.ARRIVING) return false;

        // Transform click to local coords
        const localX = (worldX - this.x) / this.scaleX;
        const localY = (worldY - this.y) / this.scaleY;

        return this.hitArea.contains(localX, localY);
    }

    hit() {
        this.wasHit = true;
        this.state = Customer.STATES.HIT;

        // Flash effect
        this.scene.tweens.add({
            targets: this.sprite,
            tint: 0xffffff,
            duration: 100,
            yoyo: true,
            repeat: 2
        });

        // Stumble animation
        this.scene.tweens.add({
            targets: this,
            y: this.y + 5,
            angle: Phaser.Math.Between(-15, 15),
            duration: 200,
            yoyo: true,
            onComplete: () => {
                this.startLeaving();
            }
        });

        // Show hit text
        const messages = this.isHoarder
            ? ['BECCATO!', 'FUORI DI QUI!', 'ACCAPARRATORE!', 'VIA! VIA!', 'SGAMATO!', 'NIENTE SCORTE!']
            : ['INNOCENTE!', 'NOOO!', 'ERA NORMALE!', 'ERRORE!', 'SBAGLIATO!'];

        const msg = messages[Math.floor(Math.random() * messages.length)];
        const color = this.isHoarder ? '#00ff00' : '#ff0000';

        const txt = this.scene.add.text(this.x, this.y - 80, msg, {
            fontSize: '18px',
            fontFamily: 'Arial Black',
            color: color,
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(20);

        this.scene.tweens.add({
            targets: txt,
            y: txt.y - 40,
            alpha: 0,
            duration: 1200,
            onComplete: () => txt.destroy()
        });

        return this.isHoarder;
    }

    startLeaving() {
        this.state = Customer.STATES.LEAVING;
        this.pump.release();

        // Drive away
        this.scene.tweens.add({
            targets: this,
            x: 1100,
            duration: 1500 + Math.random() * 500,
            ease: 'Quad.easeIn',
            onComplete: () => {
                this.state = Customer.STATES.GONE;
                this.destroy();
            }
        });
    }

    escapedAsHoarder() {
        // Called when hoarder finishes and leaves without being caught
        if (this.isHoarder && !this.wasHit && !this.penalized) {
            this.penalized = true;

            const messages = ['SCAPPATO!', 'TROPPO TARDI!', 'HA FATTO SCORTA!', 'CARBURANTE RUBATO!'];
            const msg = messages[Math.floor(Math.random() * messages.length)];

            const txt = this.scene.add.text(this.x, this.y - 80, msg, {
                fontSize: '16px',
                fontFamily: 'Arial Black',
                color: '#ff4444',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5).setDepth(20);

            this.scene.tweens.add({
                targets: txt,
                y: txt.y - 40,
                alpha: 0,
                duration: 1500,
                onComplete: () => txt.destroy()
            });

            return true;
        }
        return false;
    }

    update(time, delta) {
        if (this.state === Customer.STATES.GONE) return;

        switch (this.state) {
            case Customer.STATES.ARRIVING:
                // Drive toward pump
                const dx = this.targetX - this.x;
                const speed = 3 + this.difficulty * 0.5;
                if (Math.abs(dx) > speed) {
                    this.x += Math.sign(dx) * speed;
                } else {
                    this.x = this.targetX;
                    this.y = this.targetY;
                    this.state = Customer.STATES.FUELING_VEHICLE;
                    this.fuelProgress = 0;

                    // Show warning for hoarders after a delay
                    if (this.isHoarder && this.warningIcon) {
                        this.scene.time.delayedCall(800 + Math.random() * 1200, () => {
                            if (this.state !== Customer.STATES.HIT && this.state !== Customer.STATES.GONE) {
                                this.scene.tweens.add({
                                    targets: this.warningIcon,
                                    alpha: 1,
                                    duration: 300,
                                    yoyo: true,
                                    repeat: -1,
                                    repeatDelay: 500
                                });
                            }
                        });
                    }
                }
                this.updateScale();
                break;

            case Customer.STATES.FUELING_VEHICLE:
                this.fuelProgress += this.fuelSpeed * (delta / 1000);

                // Small bobbing animation
                this.sprite.y = -10 + Math.sin(time * 0.003) * 2;

                if (this.fuelProgress >= 1) {
                    this.fuelProgress = 1;
                    if (this.isHoarder && this.cansFilled < this.maxCans) {
                        this.state = Customer.STATES.FUELING_CANS;
                        this.fuelProgress = 0;
                    } else {
                        this.startLeaving();
                    }
                }
                break;

            case Customer.STATES.FUELING_CANS:
                this.fuelProgress += this.fuelSpeed * 0.7 * (delta / 1000);

                // Nervous look-around animation
                this.sprite.y = -10 + Math.sin(time * 0.005) * 3;
                this.sprite.x = 40 + Math.sin(time * 0.008) * 4;

                if (this.fuelProgress >= 1) {
                    // Fill one can
                    if (this.cansFilled < this.jerryCanSprites.length) {
                        this.jerryCanSprites[this.cansFilled].setAlpha(1);
                        this.jerryCanSprites[this.cansFilled].setTint(0xff6600);
                    }
                    this.cansFilled++;
                    this.fuelProgress = 0;

                    if (this.cansFilled >= this.maxCans) {
                        // All cans filled, escape!
                        this.escapedAsHoarder();
                        this.startLeaving();
                    }
                }
                break;

            case Customer.STATES.LEAVING:
                this.updateScale();
                break;
        }

        this.updateProgressBar();
    }
}
