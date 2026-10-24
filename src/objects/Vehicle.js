/**
 * Vehicle - A vehicle that drives in and parks at a pump
 */
class Vehicle extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, type) {
        const textureMap = {
            small: 'carSmall',
            suv: 'carSUV',
            van: 'carVan',
            ape: 'apeCar'
        };
        super(scene, x, y, textureMap[type] || 'carSmall');
        scene.add.existing(this);
        this.vehicleType = type;
        this.setDepth(1);
        this.setOrigin(0.5, 1);
    }
}
