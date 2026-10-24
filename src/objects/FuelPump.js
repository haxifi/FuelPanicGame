/**
 * FuelPump - Represents a pump at the station
 */
class FuelPump extends Phaser.GameObjects.Container {
    constructor(scene, x, y, pumpIndex) {
        super(scene, x, y);
        scene.add.existing(this);

        this.pumpIndex = pumpIndex;
        this.occupied = false;
        this.currentCustomer = null;

        // Pump sprite
        this.pumpSprite = scene.add.sprite(0, 0, 'fuelPump');
        this.pumpSprite.setOrigin(0.5, 1);
        this.add(this.pumpSprite);

        // Fuel gauge background
        this.gaugeBack = scene.add.graphics();
        this.gaugeBack.fillStyle(0x333333, 0.8);
        this.gaugeBack.fillRoundedRect(-12, -85, 24, 10, 2);
        this.add(this.gaugeBack);

        // Number label
        this.label = scene.add.text(0, -95, `${pumpIndex + 1}`, {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.add(this.label);

        this.setDepth(2);
    }

    occupy(customer) {
        this.occupied = true;
        this.currentCustomer = customer;
    }

    release() {
        this.occupied = false;
        this.currentCustomer = null;
    }
}
