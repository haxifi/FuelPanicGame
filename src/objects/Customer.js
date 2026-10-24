/**
 * Customer - Normal, hoarder or ApeCar customer at the fuel station.
 *
 * Normal:
 * ARRIVING -> FUELING_VEHICLE -> LEAVING
 *
 * Hoarder:
 * ARRIVING -> FUELING_VEHICLE -> FUELING_CANS -> LEAVING
 *
 * ApeCar:
 * ARRIVING -> FUELING_VEHICLE -> STEALING_CANS -> LEAVING
 */
class Customer extends Phaser.GameObjects.Container {
    static STATES = {
        ARRIVING: 'arriving',
        FUELING_VEHICLE: 'fueling_vehicle',
        FUELING_CANS: 'fueling_cans',
        STEALING_CANS: 'stealing_cans',
        LEAVING: 'leaving',
        HIT: 'hit',
        GONE: 'gone'
    };

    constructor(scene, pump, isHoarder, difficulty) {
        super(scene, -60, 0);
        scene.add.existing(this);

        this.pump = pump;
        this.difficulty = difficulty || 1;
        this.state = Customer.STATES.ARRIVING;
        this.fuelProgress = 0;
        this.cansFilled = 0;
        this.wasHit = false;
        this.scored = false;
        this.penalized = false;

        // Vehicle selection.
        // ApeCar customers are always treated as hoarders.
        const vehicleTypes = isHoarder
            ? ['van', 'suv', 'ape']
            : ['small', 'suv'];

        const vType = Phaser.Utils.Array.GetRandom(vehicleTypes);

        this.vehicleType = vType;
        this.isApeCar = vType === 'ape';
        this.isHoarder = isHoarder || this.isApeCar;

        // ApeCar takes two hits; other vehicles take one.
        this.hitPoints = this.isApeCar ? 2 : 1;
        this.maxHitPoints = this.hitPoints;

        // Number of cans carried.
        this.maxCans = this.isHoarder
            ? Math.max(1, Math.floor(1 + this.difficulty * 0.5))
            : 0;

        // Fueling speeds.
        this.fuelSpeed = 0.3 + this.difficulty * 0.08;

        // ApeCar steals faster than regular hoarders.
        this.stealingSpeedMultiplier = this.isApeCar ? 1.8 : 1;

        // Vehicle.
        this.vehicle = new Vehicle(scene, 0, 0, vType);
        this.add(this.vehicle);

        // Customer sprite.
        const custTexture = this.isHoarder
            ? 'customerHoarder'
            : 'customerNormal';

        this.sprite = scene.add.sprite(40, -10, custTexture);
        this.sprite.setOrigin(0.5, 1);
        this.add(this.sprite);

        // Jerry cans.
        this.jerryCanSprites = [];

        if (this.isHoarder) {
            for (let i = 0; i < this.maxCans; i++) {
                const can = scene.add.sprite(
                    55 + i * 18,
                    -5,
                    'jerryCan'
                );

                can.setOrigin(0.5, 1);
                can.setAlpha(0.4);
                this.add(can);
                this.jerryCanSprites.push(can);
            }
        }

        // Progress bar background.
        this.progressBg = scene.add.graphics();
        this.progressBg.fillStyle(0x333333, 0.7);
        this.progressBg.fillRect(-10, -65, 60, 8);
        this.add(this.progressBg);

        // Progress bar.
        this.progressBar = scene.add.graphics();
        this.add(this.progressBar);

        // Warning indicator.
        if (this.isHoarder) {
            const warningText = this.isApeCar ? '🚨' : '⚠️';

            this.warningIcon = scene.add.text(0, -75, warningText, {
                fontSize: this.isApeCar ? '17px' : '14px'
            }).setOrigin(0.5);

            this.warningIcon.setAlpha(0);
            this.add(this.warningIcon);
        }

        // Target position near pump.
        this.targetX = pump.x;
        this.targetY = pump.y + 30;

        this.updateScale();
        this.setDepth(3);

        // Hitbox for shooting.
        this.hitArea = new Phaser.Geom.Rectangle(-20, -60, 80, 65);
    }

    updateScale() {
        const baseScale = 0.6;
        const perspectiveScale = baseScale + (this.y - 250) * 0.002;

        this.setScale(
            Phaser.Math.Clamp(perspectiveScale, 0.5, 1.2)
        );
    }

    updateProgressBar() {
        this.progressBar.clear();

        let progress = 0;
        let color = 0x00cc00;

        switch (this.state) {
            case Customer.STATES.FUELING_VEHICLE:
                progress = this.fuelProgress;
                color = 0x00cc00;
                break;

            case Customer.STATES.FUELING_CANS:
                progress = this.fuelProgress;
                color = 0xff6600;
                break;

            case Customer.STATES.STEALING_CANS:
                progress = this.fuelProgress;
                color = 0xff0000;
                break;

            default:
                return;
        }

        if (progress > 0) {
            this.progressBar.fillStyle(color, 0.9);
            this.progressBar.fillRect(-10, -65, 60 * progress, 8);
        }
    }

    checkHit(worldX, worldY) {
        if (
            this.state === Customer.STATES.GONE ||
            this.state === Customer.STATES.HIT ||
            this.state === Customer.STATES.LEAVING ||
            this.state === Customer.STATES.ARRIVING
        ) {
            return false;
        }

        // Transform world coordinates into local coordinates.
        const localX = (worldX - this.x) / this.scaleX;
        const localY = (worldY - this.y) / this.scaleY;

        return this.hitArea.contains(localX, localY);
    }

    hit() {
        if (
            this.state === Customer.STATES.GONE ||
            this.state === Customer.STATES.HIT ||
            this.state === Customer.STATES.LEAVING
        ) {
            return false;
        }

        this.hitPoints--;

        // The first hit only staggers the ApeCar.
        if (this.hitPoints > 0) {
            this.scene.tweens.add({
                targets: this.sprite,
                alpha: 0.35,
                duration: 80,
                yoyo: true,
                repeat: 2,
                onComplete: () => {
                    if (this.active) {
                        this.sprite.setAlpha(1);
                    }
                }
            });

            this.scene.tweens.add({
                targets: this,
                angle: Phaser.Math.Between(-8, 8),
                duration: 100,
                yoyo: true
            });

            this.showMessage(
                'NON MOLLA!',
                '#ffaa00',
                1000
            );

            return false;
        }

        // Enough hits: customer is stopped.
        this.wasHit = true;
        this.state = Customer.STATES.HIT;

        this.scene.tweens.add({
            targets: this.sprite,
            tint: 0xffffff,
            duration: 100,
            yoyo: true,
            repeat: 2
        });

        this.scene.tweens.add({
            targets: this,
            y: this.y + 5,
            angle: Phaser.Math.Between(-15, 15),
            duration: 200,
            yoyo: true,
            onComplete: () => {
                if (this.active) {
                    this.startLeaving();
                }
            }
        });

        const messages = this.isApeCar
            ? [
                'APE FERMATA!',
                'BECCATO!',
                'NIENTE BENZINA!',
                'FINITA LA CORSA!'
            ]
            : this.isHoarder
                ? [
                    'BECCATO!',
                    'FUORI DI QUI!',
                    'ACCAPARRATORE!',
                    'VIA! VIA!',
                    'SGAMATO!',
                    'NIENTE SCORTE!'
                ]
                : [
                    'INNOCENTE!',
                    'NOOO!',
                    'ERA NORMALE!',
                    'ERRORE!',
                    'SBAGLIATO!'
                ];

        const color = this.isHoarder ? '#00ff00' : '#ff0000';

        this.showMessage(
            Phaser.Utils.Array.GetRandom(messages),
            color,
            1200
        );

        // Preserve the existing scoring contract.
        return this.isHoarder;
    }

    showMessage(message, color, duration = 1200) {
        const txt = this.scene.add.text(
            this.x,
            this.y - 80,
            message,
            {
                fontSize: '18px',
                fontFamily: 'Arial Black',
                color,
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5).setDepth(20);

        this.scene.tweens.add({
            targets: txt,
            y: txt.y - 40,
            alpha: 0,
            duration,
            onComplete: () => txt.destroy()
        });
    }

    startLeaving() {
        if (
            this.state === Customer.STATES.LEAVING ||
            this.state === Customer.STATES.GONE
        ) {
            return;
        }

        this.state = Customer.STATES.LEAVING;

        this.pump.release();

        this.scene.tweens.add({
            targets: this,
            x: 1100,
            duration: (this.isApeCar ? 1100 : 1500) +
                Math.random() * 500,
            ease: 'Quad.easeIn',
            onComplete: () => {
                this.state = Customer.STATES.GONE;
                this.destroy();
            }
        });
    }

    escapedAsHoarder() {
        if (
            this.isHoarder &&
            !this.wasHit &&
            !this.penalized
        ) {
            this.penalized = true;

            const messages = this.isApeCar
                ? [
                    'APE IN FUGA!',
                    'CARBURANTE RUBATO!',
                    'TROPPO VELOCE!',
                    'SCORTA COMPLETATA!'
                ]
                : [
                    'SCAPPATO!',
                    'TROPPO TARDI!',
                    'HA FATTO SCORTA!',
                    'CARBURANTE RUBATO!'
                ];

            this.showMessage(
                Phaser.Utils.Array.GetRandom(messages),
                '#ff4444',
                1500
            );

            return true;
        }

        return false;
    }

    showWarning() {
        if (!this.warningIcon || !this.active) {
            return;
        }

        if (
            this.state === Customer.STATES.HIT ||
            this.state === Customer.STATES.GONE ||
            this.state === Customer.STATES.LEAVING
        ) {
            return;
        }

        this.scene.tweens.add({
            targets: this.warningIcon,
            alpha: 1,
            duration: this.isApeCar ? 150 : 300,
            yoyo: true,
            repeat: -1,
            repeatDelay: this.isApeCar ? 200 : 500
        });
    }

    update(time, delta) {
        if (
            !this.active ||
            this.state === Customer.STATES.GONE ||
            this.state === Customer.STATES.HIT
        ) {
            return;
        }

        const deltaSeconds = delta / 1000;

        switch (this.state) {
            case Customer.STATES.ARRIVING: {
                const dx = this.targetX - this.x;
                const speed = 3 + this.difficulty * 0.5;

                if (Math.abs(dx) > speed) {
                    this.x += Math.sign(dx) * speed;
                } else {
                    this.x = this.targetX;
                    this.y = this.targetY;
                    this.fuelProgress = 0;
                    this.state = Customer.STATES.FUELING_VEHICLE;

                    if (this.isHoarder && this.warningIcon) {
                        this.scene.time.delayedCall(
                            this.isApeCar
                                ? 300 + Math.random() * 400
                                : 800 + Math.random() * 1200,
                            () => this.showWarning()
                        );
                    }
                }

                this.updateScale();
                break;
            }

            case Customer.STATES.FUELING_VEHICLE: {
                this.fuelProgress += this.fuelSpeed * deltaSeconds;

                this.sprite.y = -10 + Math.sin(time * 0.003) * 2;

                if (this.fuelProgress >= 1) {
                    this.fuelProgress = 1;

                    if (this.isApeCar && this.cansFilled < this.maxCans) {
                        this.state = Customer.STATES.STEALING_CANS;
                        this.fuelProgress = 0;
                    } else if (
                        this.isHoarder &&
                        this.cansFilled < this.maxCans
                    ) {
                        this.state = Customer.STATES.FUELING_CANS;
                        this.fuelProgress = 0;
                    } else {
                        this.startLeaving();
                    }
                }
                break;
            }

            case Customer.STATES.FUELING_CANS: {
                this.fuelProgress +=
                    this.fuelSpeed * 0.7 * deltaSeconds;

                this.sprite.y = -10 + Math.sin(time * 0.005) * 3;
                this.sprite.x = 40 + Math.sin(time * 0.008) * 4;

                if (this.fuelProgress >= 1) {
                    this.fillNextCan();
                    this.fuelProgress = 0;

                    if (this.cansFilled >= this.maxCans) {
                        this.escapedAsHoarder();
                        this.startLeaving();
                    }
                }

                break;
            }

            case Customer.STATES.STEALING_CANS: {
                // The ApeCar steals fuel much faster.
                this.fuelProgress +=
                    this.fuelSpeed *
                    this.stealingSpeedMultiplier *
                    deltaSeconds;

                // More frantic animation while stealing.
                this.sprite.y = -10 + Math.sin(time * 0.012) * 4;
                this.sprite.x = 40 + Math.sin(time * 0.018) * 6;

                if (this.fuelProgress >= 1) {
                    this.fillNextCan();
                    this.fuelProgress = 0;

                    if (this.cansFilled >= this.maxCans) {
                        this.escapedAsHoarder();
                        this.startLeaving();
                    }
                }
                break;
            }

            case Customer.STATES.LEAVING:
                this.updateScale();
                break;
        }

        this.updateProgressBar();
    }

    fillNextCan() {
        if (this.cansFilled < this.jerryCanSprites.length) {
            const can = this.jerryCanSprites[this.cansFilled];
            can.setAlpha(1);
            can.setTint(
                this.isApeCar ? 0xff0000 : 0xff6600
            );
        }

        this.cansFilled++;
    }
}