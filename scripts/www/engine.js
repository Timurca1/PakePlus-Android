// ============================================
//  ЕДИНЫЙ ИГРОВОЙ ДВИЖОК - 60 FPS
//  Без лагов, без тормозов, максимальная скорость
// ============================================

class GameEngine {
    constructor(canvasId, config) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.config = config;
        this.running = false;
        this.animId = null;
        this.lastTime = 0;
        this.deltaAccumulator = 0;
        this.fixedDelta = 1000 / 60; // 60 FPS
        this.keys = {};
        this.mouse = { x: 0, y: 0, down: false };
        
        // Состояние игры
        this.state = {
            score: 0,
            lives: 3,
            level: 1,
            gameOver: false,
            paused: false,
            win: false
        };
        
        // Привязка событий
        this.bindEvents();
    }
    
    // ===== ЗАПУСК =====
    start() {
        if (this.running) return;
        this.running = true;
        this.lastTime = 0;
        this.deltaAccumulator = 0;
        this.animId = requestAnimationFrame((t) => this.loop(t));
    }
    
    // ===== ОСТАНОВКА =====
    stop() {
        this.running = false;
        if (this.animId) {
            cancelAnimationFrame(this.animId);
            this.animId = null;
        }
    }
    
    // ===== ГЛАВНЫЙ ЦИКЛ =====
    loop(timestamp) {
        if (!this.running) return;
        if (!this.lastTime) this.lastTime = timestamp;
        
        const delta = Math.min(timestamp - this.lastTime, 33);
        this.lastTime = timestamp;
        this.deltaAccumulator += delta;
        
        // Фиксированный шаг для стабильности
        while (this.deltaAccumulator >= this.fixedDelta) {
            this.update(this.fixedDelta / 16.67); // Нормализованный шаг
            this.deltaAccumulator -= this.fixedDelta;
        }
        
        // Рендер
        this.render();
        
        // Следующий кадр
        this.animId = requestAnimationFrame((t) => this.loop(t));
    }
    
    // ===== ОБНОВЛЕНИЕ (переопределяется в игре) =====
    update(dt) {
        // Переопределяется в дочернем классе
    }
    
    // ===== ОТРИСОВКА (переопределяется в игре) =====
    render() {
        // Переопределяется в дочернем классе
    }
    
    // ===== СОБЫТИЯ =====
    bindEvents() {
        // Клавиатура
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            this.onKeyDown(e);
        });
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
            this.onKeyUp(e);
        });
        
        // Мышь
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            this.mouse.x = (e.clientX - rect.left) * scaleX;
            this.mouse.y = (e.clientY - rect.top) * scaleY;
            this.onMouseMove(e);
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            this.mouse.down = true;
            this.onMouseDown(e);
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            this.mouse.down = false;
            this.onMouseUp(e);
        });
        
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Touch (для мобильных)
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            this.mouse.x = (touch.clientX - rect.left) * scaleX;
            this.mouse.y = (touch.clientY - rect.top) * scaleY;
            this.mouse.down = true;
            this.onTouchStart(e);
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            this.mouse.x = (touch.clientX - rect.left) * scaleX;
            this.mouse.y = (touch.clientY - rect.top) * scaleY;
            this.onTouchMove(e);
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.mouse.down = false;
            this.onTouchEnd(e);
        });
    }
    
    // ===== ХУКИ ДЛЯ ПЕРЕОПРЕДЕЛЕНИЯ =====
    onKeyDown(e) {}
    onKeyUp(e) {}
    onMouseMove(e) {}
    onMouseDown(e) {}
    onMouseUp(e) {}
    onTouchStart(e) {}
    onTouchMove(e) {}
    onTouchEnd(e) {}
    
    // ===== УТИЛИТЫ =====
    clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    }
    
    rand(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    randf(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    dist(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }
    
    lerp(a, b, t) {
        return a + (b - a) * t;
    }
}

// ============================================
//  ЗВУКОВАЯ СИСТЕМА (легкая)
// ============================================
class SoundSystem {
    constructor() {
        this.ctx = null;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch(e) {}
    }
    
    play(type) {
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            const now = this.ctx.currentTime;
            
            const sounds = {
                click: { freq: 800, duration: 0.08, volume: 0.12, type: 'sine' },
                win: { freq: [523, 659, 784], duration: 0.4, volume: 0.15, type: 'sine' },
                lose: { freq: [300, 200], duration: 0.4, volume: 0.12, type: 'sawtooth' },
                move: { freq: 400, duration: 0.05, volume: 0.06, type: 'sine' },
                explode: { freq: 150, duration: 0.3, volume: 0.2, type: 'sawtooth' }
            };
            
            const s = sounds[type] || sounds.click;
            
            if (Array.isArray(s.freq)) {
                s.freq.forEach((f, i) => {
                    const osc2 = this.ctx.createOscillator();
                    const gain2 = this.ctx.createGain();
                    osc2.connect(gain2);
                    gain2.connect(this.ctx.destination);
                    osc2.type = s.type;
                    osc2.frequency.setValueAtTime(f, now + i * 0.15);
                    gain2.gain.setValueAtTime(s.volume, now + i * 0.15);
                    gain2.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.2);
                    osc2.start(now + i * 0.15);
                    osc2.stop(now + i * 0.15 + 0.2);
                });
                return;
            }
            
            osc.type = s.type;
            osc.frequency.setValueAtTime(s.freq, now);
            osc.frequency.exponentialRampToValueAtTime(s.freq * 1.5, now + s.duration);
            gain.gain.setValueAtTime(s.volume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + s.duration);
            osc.start(now);
            osc.stop(now + s.duration);
        } catch(e) {}
    }
}

// Глобальный экземпляр
const Sound = new SoundSystem();

// ============================================
//  СИСТЕМА РЕКОРДОВ
// ============================================
const Records = {
    get(key, def = 0) {
        try {
            return parseInt(localStorage.getItem('record_' + key)) || def;
        } catch { return def; }
    },
    set(key, val) {
        try {
            localStorage.setItem('record_' + key, String(val));
            return true;
        } catch { return false; }
    },
    update(key, val) {
        const old = this.get(key);
        if (val > old) {
            this.set(key, val);
            return true;
        }
        return false;
    }
};