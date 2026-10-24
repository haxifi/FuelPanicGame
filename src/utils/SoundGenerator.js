/**
 * SoundGenerator - Creates placeholder sound effects using Web Audio API
 */
class SoundGenerator {
    static generate(scene) {
        // Web Audio must be available and Phaser must be using it
        if (!scene.sound || !scene.sound.context) return;

        try {
            this.createShootSound(scene);
            this.createReloadSound(scene);
            this.createHitSound(scene);
            this.createMissSound(scene);
            this.createEmptySound(scene);
            this.createAlarmSound(scene);
        } catch (e) {
            // Sound generation is optional - game works without it
            console.warn('Sound generation skipped:', e.message);
        }
    }

    static createToneBuffer(scene, frequency, duration, type = 'square', volume = 0.3) {
        const ctx = scene.sound.context;
        if (!ctx) return null;

        const sampleRate = ctx.sampleRate;
        const length = sampleRate * duration;
        const buffer = ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            let val = 0;
            const env = Math.max(0, 1 - t / duration); // decay envelope

            switch (type) {
                case 'square':
                    val = Math.sign(Math.sin(2 * Math.PI * frequency * t));
                    break;
                case 'sawtooth':
                    val = 2 * (t * frequency - Math.floor(t * frequency + 0.5));
                    break;
                case 'sine':
                    val = Math.sin(2 * Math.PI * frequency * t);
                    break;
                case 'noise':
                    val = Math.random() * 2 - 1;
                    break;
            }
            data[i] = val * env * volume;
        }
        return buffer;
    }

    static addBufferAsSound(scene, key, buffer) {
        if (!buffer) return;
        try {
            scene.cache.audio.add(key, buffer);
        } catch (e) {
            // Silently fail - sounds are optional
        }
    }

    static createShootSound(scene) {
        const ctx = scene.sound.context;
        if (!ctx) return;
        const sampleRate = ctx.sampleRate;
        const length = sampleRate * 0.15;
        const buffer = ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const env = Math.max(0, 1 - t / 0.15);
            const freq = 200 - t * 800;
            data[i] = (Math.random() * 0.5 + Math.sin(2 * Math.PI * freq * t) * 0.5) * env * 0.4;
        }
        this.addBufferAsSound(scene, 'sfx_shoot', buffer);
    }

    static createReloadSound(scene) {
        const ctx = scene.sound.context;
        if (!ctx) return;
        const sampleRate = ctx.sampleRate;
        const length = sampleRate * 0.5;
        const buffer = ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            let val = 0;
            if (t < 0.1) val = Math.sin(2 * Math.PI * 800 * t) * (1 - t / 0.1);
            else if (t > 0.2 && t < 0.35) val = Math.sin(2 * Math.PI * 600 * t) * ((t - 0.2) / 0.15);
            else if (t > 0.35 && t < 0.5) val = Math.sin(2 * Math.PI * 1000 * t) * (1 - (t - 0.35) / 0.15);
            data[i] = val * 0.3;
        }
        this.addBufferAsSound(scene, 'sfx_reload', buffer);
    }

    static createHitSound(scene) {
        const ctx = scene.sound.context;
        if (!ctx) return;
        const sampleRate = ctx.sampleRate;
        const length = sampleRate * 0.3;
        const buffer = ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const env = Math.max(0, 1 - t / 0.3);
            data[i] = (Math.sin(2 * Math.PI * 300 * t) + Math.sin(2 * Math.PI * 150 * t)) * env * 0.3;
        }
        this.addBufferAsSound(scene, 'sfx_hit', buffer);
    }

    static createMissSound(scene) {
        const buffer = this.createToneBuffer(scene, 100, 0.1, 'noise', 0.15);
        this.addBufferAsSound(scene, 'sfx_miss', buffer);
    }

    static createEmptySound(scene) {
        const buffer = this.createToneBuffer(scene, 1200, 0.08, 'sine', 0.2);
        this.addBufferAsSound(scene, 'sfx_empty', buffer);
    }

    static createAlarmSound(scene) {
        const ctx = scene.sound.context;
        if (!ctx) return;
        const sampleRate = ctx.sampleRate;
        const length = sampleRate * 0.6;
        const buffer = ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const freq = 400 + 200 * Math.sin(2 * Math.PI * 4 * t);
            data[i] = Math.sin(2 * Math.PI * freq * t) * 0.25;
        }
        this.addBufferAsSound(scene, 'sfx_alarm', buffer);
    }
}
