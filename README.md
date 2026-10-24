# ⛽ Fuel Panic

![Fuel Panice](cover.jpeg)

A satirical 2D arcade shooter built with **Phaser 3**, inspired by fuel shortages, panic buying, and people stockpiling petrol. 
Stand on your balcony overlooking a petrol station and stop the greedy hoarders before they drain every last drop!

> **Play now:** [https://haxifi.github.io/FuelPanicGame](https://haxifi.github.io/FuelPanicGame)

---

## 🎮 Gameplay

You watch a busy fuel station from a fixed balcony position. 
Vehicles pull up to the pumps and customers get out.
Your job is to identify the **hoarders** — and stop them.

| Customer type | Appearance | Behaviour | Action |
|---|---|---|---|
| **Normal** 🟢 | Green shirt | Fills only their vehicle tank, then leaves | **Do NOT shoot** — you lose 150 points |
| **Hoarder** 🔴 | Red shirt, angry face | Fills their vehicle *then* fills jerry cans | **Shoot them** before they finish! +100 pts |

### Rules

- **Aim** with the mouse (or tap on mobile) and **click / tap** to shoot.
- **Hoarders** show a blinking ⚠️ warning icon once they start filling cans.
- **Combo kills** earn bonus points — catch hoarders in quick succession.
- The game ends when the **90-second timer** runs out, or when **too many hoarders escape** (the "Carburante rubato" bar fills up).
- Difficulty ramps up every 10 seconds: more customers, faster fueling, more jerry cans.

### Controls

| Input | Desktop | Mobile |
|---|---|---|
| Aim | Mouse | Tap position |
| Shoot | Left click | Tap |
| Reload | `R` key | 🔄 R button (bottom-left) |
| Start / Restart | `Space` | Tap button |
| Back to menu | `Esc` | Tap link |

---

## 🛠 Tech Stack

| Component | Technology |
|---|---|
| Game engine | [Phaser 3.60](https://phaser.io/) (loaded from `lib/phaser.min.js`) |
| Language | Vanilla JavaScript (ES6 classes, no transpiler) |
| Graphics | Procedurally generated at runtime via `GraphicsGenerator` |
| Audio | Web Audio API synthesis via `SoundGenerator` |
| Server | Python `http.server` or any static file server |
| Build tools | None required — zero dependencies |

---

## 🚀 Getting Started

### Prerequisites

- A modern desktop browser (Chrome, Firefox, Edge, Safari)
- One of the following to serve files locally:
  - **Python 3** (pre-installed on macOS/Linux)
  - **Node.js** (optional, for `http-server`)

### Install & Run

```bash
# Clone the repository
git clone git@github.com:haxifi/FuelPanicGame.git
cd FuelPanic

# Option A — Python (no install needed)
python -m http.server 8080

# Option B — Node.js
npx http-server -p 8080 -c-1
```

Open **http://localhost:8080** in your browser and play.

> **Mobile:** the game is fully responsive. On phones, rotate to landscape for the best experience.

---

## 📁 Project Structure

```
FuelPanic/
├── index.html                      ← Entry point & responsive viewport
├── package.json                    ← npm scripts (dev / start)
├── phasereditor2d.config.json      ← Phaser Editor project descriptor
├── cover.png                       ← README cover image
├── lib/
│   └── phaser.min.js               ← Phaser 3.60 (vendored, no CDN needed)
└── src/
    ├── main.js                     ← Phaser config & game bootstrap
    ├── utils/
    │   ├── GraphicsGenerator.js    ← Procedural texture creation
    │   └── SoundGenerator.js       ← Web Audio sound synthesis
    ├── objects/
    │   ├── Bullet.js               ← Bullet-hole impact effect
    │   ├── Customer.js             ← Customer state machine (normal / hoarder)
    │   ├── FuelPump.js             ← Fuel pump game object
    │   └── Vehicle.js              ← Vehicle sprite wrapper
    └── scenes/
        ├── BootScene.js            ← Asset generation, then → MenuScene
        ├── MenuScene.js            ← Title screen with instructions
        ├── GameScene.js            ← Core gameplay loop, HUD, input
        └── GameOverScene.js        ← Score summary & restart
```

---

## 🔧 Customisation Guide

The game is designed to be modular and easy to extend. Below are practical examples of common modifications.

### Adjust game balance

All tuneable values live in [`GameScene.create()`](src/scenes/GameScene.js):

```js
// src/scenes/GameScene.js — create()
this.ammo = 6;            // Bullets per magazine
this.maxAmmo = 6;
this.gameTime = 90;       // Round duration in seconds
this.maxFuelStolen = 5;   // Hoarders that can escape before game over
```

Hoarder spawn probability and difficulty ramp are also in `GameScene`:

```js
// spawnCustomer()
const hoarderChance = 0.25 + this.difficulty * 0.06;

// increaseDifficulty() — called every 10 seconds
this.difficulty += 0.5;
const newDelay = Math.max(800, 2500 - this.difficulty * 200);
```

### Add a new customer type

Customer behaviour is controlled by the state machine in [`Customer.js`](src/objects/Customer.js). States flow as:

```
ARRIVING → FUELING_VEHICLE → FUELING_CANS (hoarder only) → LEAVING
```

To add a new type (e.g. a "tanker thief" who fills a fuel tanker):

1. **Add a new state** to `Customer.STATES`:
   ```js
   static STATES = {
       // ...existing states...
       FUELING_TANKER: 'fueling_tanker'
   };
   ```

2. **Add branching logic** in the `update()` switch — after `FUELING_VEHICLE`, transition to `FUELING_TANKER` for the new type:
   ```js
   case Customer.STATES.FUELING_VEHICLE:
       // ...existing code...
       if (this.fuelProgress >= 1) {
           if (this.isTankerThief) {
               this.state = Customer.STATES.FUELING_TANKER;
               this.fuelProgress = 0;
           } else if (this.isHoarder && this.cansFilled < this.maxCans) {
               // ...existing hoarder logic...
           }
       }
       break;
   ```

3. **Create the visual** in [`GraphicsGenerator.js`](src/utils/GraphicsGenerator.js) — add a new `static createXxx(scene)` method and call it from `generate()`. The `fuelTanker` texture already exists and can be reused.

4. **Spawn it** from `GameScene.spawnCustomer()` by passing a flag to the `Customer` constructor.

### Add a new vehicle type

1. Draw it in `GraphicsGenerator.createVehicles()` — use the Phaser `Graphics` API:
   ```js
   const g = scene.make.graphics({ x: 0, y: 0, add: false });
   g.fillStyle(0x..., 1);
   g.fillRoundedRect(x, y, w, h, radius);
   // ...
   g.generateTexture('carPickup', width, height);
   g.destroy();
   ```

2. Register it in the `textureMap` inside [`Vehicle.js`](src/objects/Vehicle.js):
   ```js
   const textureMap = {
       small: 'carSmall',
       suv: 'carSUV',
       van: 'carVan',
       pickup: 'carPickup'  // ← new
   };
   ```

3. Add `'pickup'` to the vehicle type arrays in `Customer`'s constructor.

### Add a new sound effect

Sound effects are synthesised in [`SoundGenerator.js`](src/utils/SoundGenerator.js). Each method creates a `WebAudio AudioBuffer` and registers it in Phaser's audio cache:

```js
static createMySound(scene) {
    const ctx = scene.sound.context;
    if (!ctx) return;
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * 0.2;  // 200ms
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        data[i] = Math.sin(2 * Math.PI * 440 * t) * (1 - t / 0.2) * 0.3;
    }
    this.addBufferAsSound(scene, 'sfx_mysound', buffer);
}
```

Call it from `generate()` and play it anywhere with `this.playSound('sfx_mysound')`.

### Replace placeholder graphics with real assets

The game uses no external image files — all textures are drawn with the Phaser `Graphics` API in `GraphicsGenerator`. To replace any texture with a sprite sheet or image:

1. Place the image in a new `assets/` directory.
2. Load it in `BootScene.create()`:
   ```js
   this.load.image('customerHoarder', 'assets/hoarder.png');
   this.load.start();
   this.load.once('complete', () => { /* continue */ });
   ```
3. Remove the corresponding `createXxx()` call from `GraphicsGenerator.generate()`.

### Add a new scene

1. Create `src/scenes/MyScene.js` with a class extending `Phaser.Scene`.
2. Add a `<script>` tag in `index.html` before `main.js`.
3. Add the class to the `scene` array in [`main.js`](src/main.js):
   ```js
   scene: [BootScene, MenuScene, GameScene, GameOverScene, MyScene]
   ```

---

## 📱 Mobile Support

The game is fully responsive and playable on phones and tablets:

- **iPhone / Android (portrait):** an overlay prompts the user to rotate to landscape.
- **iPad / tablets:** play directly — no rotation prompt.
- **iOS Safari:** handles dynamic browser bars, notch safe areas, and `100dvh` viewports.
- **Touch controls:** tap to shoot, on-screen reload button.

---

## 📜 License

This project is released under the [MIT License](LICENSE).

---

## ✍️ Author

**Salvatore Turboli**
📧 [salvatore.turboli@gmail.com](mailto:salvatore.turboli@gmail.com)
🔗 [github.com/haxifi/FuelPanicGame](https://github.com/haxifi/FuelPanicGame)
