// ============================================
//  ЕДИНЫЙ ИГРОВОЙ ДВИЖОК - 60 FPS
//  С ПОДДЕРЖКОЙ СЕНСОРНОГО УПРАВЛЕНИЯ
// ============================================

class GameEngine {
    constructor(canvasId, config) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.config = config || {};
        this.running = false;
        this.animId = null;
        this.lastTime = 0;
        this.deltaAccumulator = 0;
        this.fixedDelta = 1000 / 60;
        
        // Клавиши (для десктопа)
        this.keys = {};
        
        // Сенсорное управление
        this.touch = {
            startX: 0,
            startY: 0,
            endX: 0,
            endY: 0,
            isDragging: false,
            activeTouches: {}
        };
        
        // Виртуальные кнопки
        this.buttons = [];
        
        // Состояние игры
        this.state = {
            score: 0,
            lives: 3,
            level: 1,
            gameOver: false,
            paused: false,
            win: false
        };
        
        // Определяем мобильное устройство
        this.isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        this.bindEvents();
        this.setupTouchControls();
    }
    
    // ===== НАСТРОЙКА СЕНСОРНЫХ КНОПОК =====
    setupTouchControls() {
        // Создаём контейнер для кнопок
        const container = document.createElement('div');
        container.id = 'touch-controls';
        container.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 0;
            right: 0;
            display: none;
            justify-content: space-between;
            padding: 0 20px;
            pointer-events: none;
            z-index: 10;
        `;
        
        // Левые кнопки
        const leftGroup = document.createElement('div');
        leftGroup.style.cssText = 'display:flex;gap:12px;pointer-events:all;';
        
        // Правые кнопки
        const rightGroup = document.createElement('div');
        rightGroup.style.cssText = 'display:flex;gap:12px;pointer-events:all;';
        
        // Определяем кнопки для каждой игры
        const gameId = this.config.gameId || 'default';
        const buttonConfigs = this.getButtonConfigs(gameId);
        
        buttonConfigs.left.forEach(cfg => {
            const btn = this.createButton(cfg);
            leftGroup.appendChild(btn);
            this.buttons.push(btn);
        });
        
        buttonConfigs.right.forEach(cfg => {
            const btn = this.createButton(cfg);
            rightGroup.appendChild(btn);
            this.buttons.push(btn);
        });
        
        container.appendChild(leftGroup);
        container.appendChild(rightGroup);
        
        // Добавляем на страницу
        const wrapper = this.canvas.parentElement;
        if (wrapper) {
            wrapper.style.position = 'relative';
            wrapper.appendChild(container);
        }
        
        // Показываем на мобильных
        if (this.isMobile) {
            container.style.display = 'flex';
        }
    }
    
    createButton(config) {
        const btn = document.createElement('button');
        btn.textContent = config.label || '◀';
        btn.dataset.action = config.action;
        btn.style.cssText = `
            width: ${config.size || 60}px;
            height: ${config.size || 60}px;
            border-radius: 50%;
            border: 2px solid rgba(255,255,255,0.3);
            background: rgba(255,255,255,0.15);
            backdrop-filter: blur(8px);
            color: white;
            font-size: ${config.fontSize || 24}px;
            display: flex;
            align-items: center;
            justify-content: center;
            touch-action: none;
            user-select: none;
            -webkit-user-select: none;
            transition: background 0.15s;
            pointer-events: all;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        `;
        
        // Подсветка при нажатии
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            btn.style.background = 'rgba(255,255,255,0.35)';
            this.handleButtonPress(config.action);
        });
        
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            btn.style.background = 'rgba(255,255,255,0.15)';
        });
        
        btn.addEventListener('mousedown', (e) => {
            btn.style.background = 'rgba(255,255,255,0.35)';
            this.handleButtonPress(config.action);
        });
        
        btn.addEventListener('mouseup', (e) => {
            btn.style.background = 'rgba(255,255,255,0.15)';
        });
        
        return btn;
    }
    
    getButtonConfigs(gameId) {
        const configs = {
            'snake': {
                left: [
                    { action: 'up', label: '⬆', size: 65, fontSize: 28 },
                    { action: 'down', label: '⬇', size: 65, fontSize: 28 },
                    { action: 'left', label: '⬅', size: 65, fontSize: 28 },
                    { action: 'right', label: '➡', size: 65, fontSize: 28 }
                ],
                right: [
                    { action: 'restart', label: '🔄', size: 55, fontSize: 22 }
                ]
            },
            'arkanoid': {
                left: [
                    { action: 'left', label: '⬅', size: 70, fontSize: 30 },
                    { action: 'right', label: '➡', size: 70, fontSize: 30 }
                ],
                right: [
                    { action: 'restart', label: '🔄', size: 55, fontSize: 22 }
                ]
            },
            'tetris': {
                left: [
                    { action: 'left', label: '⬅', size: 60, fontSize: 26 },
                    { action: 'right', label: '➡', size: 60, fontSize: 26 },
                    { action: 'down', label: '⬇', size: 60, fontSize: 26 },
                    { action: 'rotate', label: '↻', size: 60, fontSize: 26 }
                ],
                right: [
                    { action: 'drop', label: '⤓', size: 65, fontSize: 28 },
                    { action: 'restart', label: '🔄', size: 55, fontSize: 22 }
                ]
            },
            'flappy': {
                left: [],
                right: [
                    { action: 'jump', label: '⬆', size: 80, fontSize: 34 },
                    { action: 'restart', label: '🔄', size: 55, fontSize: 22 }
                ]
            },
            'minesweeper': {
                left: [
                    { action: 'flag', label: '🚩', size: 65, fontSize: 28 }
                ],
                right: [
                    { action: 'restart', label: '🔄', size: 55, fontSize: 22 }
                ]
            },
            '2048': {
                left: [
                    { action: 'up', label: '⬆', size: 55, fontSize: 24 },
                    { action: 'down', label: '⬇', size: 55, fontSize: 24 },
                    { action: 'left', label: '⬅', size: 55, fontSize: 24 },
                    { action: 'right', label: '➡', size: 55, fontSize: 24 }
                ],
                right: [
                    { action: 'restart', label: '🔄', size: 55, fontSize: 22 }
                ]
            },
            'memory': {
                left: [],
                right: [
                    { action: 'restart', label: '🔄', size: 55, fontSize: 22 }
                ]
            },
            'racer': {
                left: [
                    { action: 'left', label: '⬅', size: 70, fontSize: 30 },
                    { action: 'right', label: '➡', size: 70, fontSize: 30 }
                ],
                right: [
                    { action: 'restart', label: '🔄', size: 55, fontSize: 22 }
                ]
            },
            'shooter': {
                left: [],
                right: [
                    { action: 'restart', label: '🔄', size: 55, fontSize: 22 }
                ]
            },
            'pong': {
                left: [
                    { action: 'up', label: '⬆', size: 70, fontSize: 30 },
                    { action: 'down', label: '⬇', size: 70, fontSize: 30 }
                ],
                right: [
                    { action: 'restart', label: '🔄', size: 55, fontSize: 22 }
                ]
            }
        };
        
        return configs[gameId] || configs.default || { left: [], right: [] };
    }
    
    handleButtonPress(action) {
        // Переопределяется в игре
        if (this.onButtonPress) {
            this.onButtonPress(action);
        }
    }
    
    // ===== БИНДИНГ СОБЫТИЙ =====
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
        
        // ===== СВАЙПЫ (движение пальцем) =====
        let touchStartX = 0, touchStartY = 0;
        let touchEndX = 0, touchEndY = 0;
        let isSwiping = false;
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            
            touchStartX = (touch.clientX - rect.left) * scaleX;
            touchStartY = (touch.clientY - rect.top) * scaleY;
            isSwiping = true;
            
            this.mouse.x = touchStartX;
            this.mouse.y = touchStartY;
            this.mouse.down = true;
            
            this.onTouchStart(e);
        }, { passive: false });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!isSwiping) return;
            
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            
            touchEndX = (touch.clientX - rect.left) * scaleX;
            touchEndY = (touch.clientY - rect.top) * scaleY;
            
            this.mouse.x = touchEndX;
            this.mouse.y = touchEndY;
            
            // Определяем направление свайпа
            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;
            
            if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
                const swipeThreshold = 30;
                if (Math.abs(dx) > Math.abs(dy)) {
                    if (dx > swipeThreshold) this.onSwipe('right');
                    else if (dx < -swipeThreshold) this.onSwipe('left');
                } else {
                    if (dy > swipeThreshold) this.onSwipe('down');
                    else if (dy < -swipeThreshold) this.onSwipe('up');
                }
                // Сбрасываем, чтобы не спамило
                touchStartX = touchEndX;
                touchStartY = touchEndY;
            }
            
            this.onTouchMove(e);
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            isSwiping = false;
            this.mouse.down = false;
            
            // Если свайпа не было, считаем как клик
            if (Math.abs(touchEndX - touchStartX) < 20 && Math.abs(touchEndY - touchStartY) < 20) {
                this.onTap(touchEndX, touchEndY);
            }
            
            this.onTouchEnd(e);
        }, { passive: false });
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
    onSwipe(direction) {} // left, right, up, down
    onTap(x, y) {}
    onButtonPress(action) {}
    
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
}

// ============================================
//  ЗВУКОВАЯ СИСТЕМА
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
                click: { freq: 800, duration: 0.08, volume: 0.12 },
                win: { freq: [523, 659, 784], duration: 0.4, volume: 0.15 },
                lose: { freq: [300, 200], duration: 0.4, volume: 0.12 },
                move: { freq: 400, duration: 0.05, volume: 0.06 },
                explode: { freq: 150, duration: 0.3, volume: 0.2 }
            };
            
            const s = sounds[type] || sounds.click;
            
            if (Array.isArray(s.freq)) {
                s.freq.forEach((f, i) => {
                    const osc2 = this.ctx.createOscillator();
                    const gain2 = this.ctx.createGain();
                    osc2.connect(gain2);
                    gain2.connect(this.ctx.destination);
                    osc2.type = 'sine';
                    osc2.frequency.setValueAtTime(f, now + i * 0.15);
                    gain2.gain.setValueAtTime(s.volume, now + i * 0.15);
                    gain2.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.2);
                    osc2.start(now + i * 0.15);
                    osc2.stop(now + i * 0.15 + 0.2);
                });
                return;
            }
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(s.freq, now);
            gain.gain.setValueAtTime(s.volume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + s.duration);
            osc.start(now);
            osc.stop(now + s.duration);
        } catch(e) {}
    }
}

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