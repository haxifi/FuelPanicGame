/**
 * GraphicsGenerator - Creates all placeholder graphics as textures
 */
class GraphicsGenerator {
    static generate(scene) {
        this.createCrosshair(scene);
        this.createBulletHole(scene);
        this.createMuzzleFlash(scene);
        this.createFuelPump(scene);
        this.createVehicles(scene);
        this.createApeCar(scene);
        this.createCustomers(scene);
        this.createJerryCan(scene);
        this.createFuelTanker(scene);
        this.createBalconyRailing(scene);
        this.createBackground(scene);
        this.createFuelGauge(scene);
        this.createExplosionParticle(scene);
    }

    static createCrosshair(scene) {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        g.lineStyle(2, 0xff0000, 1);
        // outer circle
        g.strokeCircle(16, 16, 12);
        // cross lines
        g.lineBetween(16, 0, 16, 10);
        g.lineBetween(16, 22, 16, 32);
        g.lineBetween(0, 16, 10, 16);
        g.lineBetween(22, 16, 32, 16);
        // center dot
        g.fillStyle(0xff0000, 1);
        g.fillCircle(16, 16, 2);
        g.generateTexture('crosshair', 32, 32);
        g.destroy();
    }

    static createBulletHole(scene) {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x333333, 1);
        g.fillCircle(6, 6, 6);
        g.fillStyle(0x111111, 1);
        g.fillCircle(6, 6, 3);
        g.generateTexture('bulletHole', 12, 12);
        g.destroy();
    }

    static createMuzzleFlash(scene) {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xffff00, 0.9);
        g.fillCircle(16, 16, 16);
        g.fillStyle(0xffffff, 0.8);
        g.fillCircle(16, 16, 8);
        g.generateTexture('muzzleFlash', 32, 32);
        g.destroy();
    }

    static createFuelPump(scene) {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        // Base
        g.fillStyle(0x888888, 1);
        g.fillRoundedRect(5, 20, 30, 60, 3);
        // Screen
        g.fillStyle(0x00aa00, 1);
        g.fillRect(10, 25, 20, 12);
        // Nozzle holder
        g.fillStyle(0x555555, 1);
        g.fillRect(12, 42, 16, 5);
        // Hose
        g.lineStyle(3, 0x333333, 1);
        g.beginPath();
        g.moveTo(20, 47);
        g.lineTo(20, 55);
        g.lineTo(30, 65);
        g.strokePath();
        // Top
        g.fillStyle(0xcc0000, 1);
        g.fillRect(5, 15, 30, 8);
        g.generateTexture('fuelPump', 40, 80);
        g.destroy();
    }

    static createVehicles(scene) {
        // Small car
        const g1 = scene.make.graphics({ x: 0, y: 0, add: false });
        g1.fillStyle(0x3366cc, 1);
        g1.fillRoundedRect(0, 15, 80, 30, 5);
        g1.fillStyle(0x2255aa, 1);
        g1.fillRoundedRect(15, 5, 45, 18, 4);
        // Windows
        g1.fillStyle(0x88ccff, 0.7);
        g1.fillRect(18, 8, 18, 12);
        g1.fillRect(40, 8, 18, 12);
        // Wheels
        g1.fillStyle(0x222222, 1);
        g1.fillCircle(18, 48, 8);
        g1.fillCircle(62, 48, 8);
        g1.fillStyle(0x666666, 1);
        g1.fillCircle(18, 48, 4);
        g1.fillCircle(62, 48, 4);
        g1.generateTexture('carSmall', 80, 56);
        g1.destroy();

        // SUV
        const g2 = scene.make.graphics({ x: 0, y: 0, add: false });
        g2.fillStyle(0x2d2d2d, 1);
        g2.fillRoundedRect(0, 15, 100, 35, 5);
        g2.fillStyle(0x1a1a1a, 1);
        g2.fillRoundedRect(10, 3, 70, 20, 4);
        g2.fillStyle(0x88ccff, 0.6);
        g2.fillRect(14, 6, 20, 14);
        g2.fillRect(38, 6, 20, 14);
        g2.fillRect(62, 6, 14, 14);
        g2.fillStyle(0x222222, 1);
        g2.fillCircle(22, 54, 9);
        g2.fillCircle(78, 54, 9);
        g2.fillStyle(0x666666, 1);
        g2.fillCircle(22, 54, 5);
        g2.fillCircle(78, 54, 5);
        g2.generateTexture('carSUV', 100, 63);
        g2.destroy();

        // Van (hoarder vehicle)
        const g3 = scene.make.graphics({ x: 0, y: 0, add: false });
        g3.fillStyle(0xcc8833, 1);
        g3.fillRoundedRect(0, 10, 110, 40, 4);
        g3.fillStyle(0xaa6622, 1);
        g3.fillRoundedRect(0, 5, 35, 20, 3);
        g3.fillStyle(0x88ccff, 0.6);
        g3.fillRect(4, 8, 14, 14);
        g3.fillRect(20, 8, 12, 14);
        g3.fillStyle(0x222222, 1);
        g3.fillCircle(22, 54, 9);
        g3.fillCircle(90, 54, 9);
        g3.fillStyle(0x666666, 1);
        g3.fillCircle(22, 54, 5);
        g3.fillCircle(90, 54, 5);
        g3.generateTexture('carVan', 110, 63);
        g3.destroy();
    }

    static createApeCar(scene) {
        const g = scene.make.graphics({
            x: 0,
            y: 0,
            add: false
        });

        // Carrozzeria rossa
        g.fillStyle(0xc62828, 1);
        g.fillRoundedRect(12, 20, 66, 30, 5);

        // Cabina
        g.fillStyle(0xe53935, 1);
        g.fillRoundedRect(12, 5, 32, 27, 5);

        // Finestrino
        g.fillStyle(0xb3e5fc, 1);
        g.fillRoundedRect(17, 9, 21, 12, 2);

        // Cassone
        g.fillStyle(0x8e1818, 1);
        g.fillRect(45, 25, 32, 15);

        // Taniche gialle nel cassone
        g.fillStyle(0xffc107, 1);
        g.fillRoundedRect(49, 18, 10, 17, 2);
        g.fillRoundedRect(62, 18, 10, 17, 2);

        // Ruote
        g.fillStyle(0x222222, 1);
        g.fillCircle(25, 49, 8);
        g.fillCircle(68, 49, 8);

        g.fillStyle(0xcccccc, 1);
        g.fillCircle(25, 49, 3);
        g.fillCircle(68, 49, 3);

        // Faro
        g.fillStyle(0xfff176, 1);
        g.fillRect(9, 29, 5, 6);

        g.generateTexture('apeCar', 90, 60);
        g.destroy();
    }

    static createCustomers(scene) {
        // Normal customer (green tint)
        const gn = scene.make.graphics({ x: 0, y: 0, add: false });
        // Body
        gn.fillStyle(0x44aa44, 1);
        gn.fillRoundedRect(4, 16, 16, 22, 3);
        // Head
        gn.fillStyle(0xffcc99, 1);
        gn.fillCircle(12, 10, 8);
        // Eyes
        gn.fillStyle(0x000000, 1);
        gn.fillCircle(9, 9, 1.5);
        gn.fillCircle(15, 9, 1.5);
        // Legs
        gn.fillStyle(0x3366aa, 1);
        gn.fillRect(6, 38, 5, 10);
        gn.fillRect(13, 38, 5, 10);
        gn.generateTexture('customerNormal', 24, 48);
        gn.destroy();

        // Hoarder customer (red tint, bigger, angrier)
        const gh = scene.make.graphics({ x: 0, y: 0, add: false });
        gh.fillStyle(0xcc3333, 1);
        gh.fillRoundedRect(3, 16, 18, 24, 3);
        // Head
        gh.fillStyle(0xffcc99, 1);
        gh.fillCircle(12, 10, 9);
        // Angry eyebrows
        gh.lineStyle(2, 0x000000, 1);
        gh.lineBetween(6, 6, 10, 8);
        gh.lineBetween(18, 6, 14, 8);
        // Eyes
        gh.fillStyle(0x000000, 1);
        gh.fillCircle(9, 10, 2);
        gh.fillCircle(15, 10, 2);
        // Greedy grin
        gh.lineStyle(1.5, 0x000000, 1);
        gh.beginPath();
        gh.arc(12, 13, 5, 0.2, Math.PI - 0.2);
        gh.strokePath();
        // Legs
        gh.fillStyle(0x333333, 1);
        gh.fillRect(5, 40, 6, 10);
        gh.fillRect(13, 40, 6, 10);
        gh.generateTexture('customerHoarder', 24, 50);
        gh.destroy();
    }

    static createJerryCan(scene) {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xcc0000, 1);
        g.fillRoundedRect(2, 6, 16, 20, 2);
        // Handle
        g.lineStyle(2, 0x990000, 1);
        g.lineBetween(6, 6, 6, 2);
        g.lineBetween(6, 2, 14, 2);
        g.lineBetween(14, 2, 14, 6);
        // Spout
        g.fillStyle(0x666666, 1);
        g.fillRect(16, 4, 4, 4);
        g.generateTexture('jerryCan', 22, 28);
        g.destroy();
    }

    static createFuelTanker(scene) {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x888888, 1);
        g.fillRoundedRect(0, 5, 50, 20, 8);
        g.fillStyle(0xffcc00, 1);
        g.fillRect(5, 10, 40, 2);
        // Hazard symbol
        g.fillStyle(0xff6600, 1);
        g.fillTriangle(25, 8, 20, 18, 30, 18);
        g.generateTexture('fuelTanker', 50, 28);
        g.destroy();
    }

    static createBalconyRailing(scene) {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        const w = 1024;
        // Railing bars
        g.fillStyle(0x8B4513, 1);
        g.fillRect(0, 0, w, 6);
        g.fillRect(0, 28, w, 6);
        for (let x = 0; x < w; x += 30) {
            g.fillRect(x, 0, 4, 34);
        }
        // Flower pots
        g.fillStyle(0xcc6633, 1);
        for (let x = 60; x < w; x += 200) {
            g.fillRoundedRect(x, 8, 30, 18, 3);
            g.fillStyle(0x33aa33, 1);
            g.fillCircle(x + 15, 4, 10);
            g.fillStyle(0xff6699, 1);
            g.fillCircle(x + 10, 2, 4);
            g.fillCircle(x + 20, 2, 4);
            g.fillStyle(0xcc6633, 1);
        }
        g.generateTexture('balconyRailing', w, 34);
        g.destroy();
    }

    static createBackground(scene) {
        const w = 1024, h = 600;
        const g = scene.make.graphics({ x: 0, y: 0, add: false });

        // Sky gradient
        for (let y = 0; y < 200; y++) {
            const t = y / 200;
            const r = Math.floor(135 + t * 50);
            const gb = Math.floor(206 - t * 60);
            const b = Math.floor(235 - t * 40);
            g.fillStyle(Phaser.Display.Color.GetColor(r, gb, b), 1);
            g.fillRect(0, y, w, 1);
        }

        // Distant buildings
        g.fillStyle(0x8899aa, 1);
        g.fillRect(50, 120, 60, 80);
        g.fillRect(150, 100, 40, 100);
        g.fillRect(250, 130, 80, 70);
        g.fillRect(700, 110, 50, 90);
        g.fillRect(800, 90, 70, 110);
        g.fillRect(920, 120, 60, 80);

        // Ground / station area
        g.fillStyle(0x666666, 1);
        g.fillRect(0, 200, w, 400);

        // Station canopy
        g.fillStyle(0xdddddd, 1);
        g.fillRect(80, 200, 860, 15);
        // Canopy supports
        g.fillStyle(0xaaaaaa, 1);
        g.fillRect(120, 200, 8, 120);
        g.fillRect(500, 200, 8, 120);
        g.fillRect(880, 200, 8, 120);

        // Station building (background)
        g.fillStyle(0xbb3333, 1);
        g.fillRect(350, 150, 300, 55);
        // Sign
        g.fillStyle(0xffffff, 1);
        g.fillRect(380, 155, 240, 30);

        // Road markings
        g.fillStyle(0xffcc00, 1);
        for (let x = 0; x < w; x += 60) {
            g.fillRect(x, 500, 30, 4);
        }

        // Lane lines (pump areas)
        g.fillStyle(0xeeeeee, 0.3);
        for (let x = 150; x < 900; x += 200) {
            g.fillRect(x, 250, 2, 250);
        }

        g.generateTexture('background', w, h);
        g.destroy();
    }

    static createFuelGauge(scene) {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x333333, 1);
        g.fillRoundedRect(0, 0, 20, 60, 3);
        g.fillStyle(0x00ff00, 1);
        g.fillRect(3, 3, 14, 54);
        g.generateTexture('fuelGauge', 20, 60);
        g.destroy();
    }

    static createExplosionParticle(scene) {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xffaa00, 1);
        g.fillCircle(4, 4, 4);
        g.generateTexture('particle', 8, 8);
        g.destroy();
    }
}
