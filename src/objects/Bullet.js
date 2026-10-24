/**
 * Bullet - Visual bullet impact effect
 */
class Bullet extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'bulletHole');
        scene.add.existing(this);
        this.setDepth(5);
        this.setAlpha(0.8);

        // Fade out and destroy
        scene.tweens.add({
            targets: this,
            alpha: 0,
            scale: 1.5,
            duration: 800,
            onComplete: () => this.destroy()
        });
    }
}
