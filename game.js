/**
 * MODULE 2: BỘ MÁY GAME, VŨ KHÍ, KỸ NĂNG & ĐỒNG BỘ VÍ XU (game.js)
 * - Đồng bộ Ví Xu ('ARCADE_WALLET_COINS') với sanhcho.html & doden.html
 * - Cơ chế mới: Bắn đạn càng nhanh, toàn bộ cá và Boss càng được buff thêm Giáp (rapidFireArmorBuff tối đa +45%)
 * - Tích hợp cập nhật Bom Hẹn Giờ 3 Giây (updateAndDrawTimeBombs) và Mũi Khoan (updateAndDrawActiveDrills)
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });

const bgCacheCanvas = document.createElement('canvas');
const bgCacheCtx = bgCacheCanvas.getContext('2d');

// HUD DOM Elements
const stageLevelBadgeEl = document.getElementById('stageLevelBadge');
const stageNameTextEl = document.getElementById('stageNameText');
const stageBonusTextEl = document.getElementById('stageBonusText');
const expBarFillEl = document.getElementById('expBarFill');
const expTextEl = document.getElementById('expText');
const fpsCounterEl = document.getElementById('fpsCounter');

// ==========================================
// 1. ĐỒNG BỘ VÍ XU TOÀN SẢNH
// ==========================================
const WALLET_KEY = 'ARCADE_WALLET_COINS';
const DEFAULT_WALLET_COINS = 2500;
const walletChannel = ('BroadcastChannel' in window) ? new BroadcastChannel('ARCADE_WALLET_SYNC') : null;

let score = DEFAULT_WALLET_COINS;
let formattedScore = '2.500';
let pendingScore = 0;

function updateFormattedScore() {
    formattedScore = score.toLocaleString('vi-VN');
}

function loadWalletFromStorage() {
    try {
        const raw = localStorage.getItem(WALLET_KEY);
        if (raw === null || isNaN(parseInt(raw, 10))) {
            localStorage.setItem(WALLET_KEY, String(DEFAULT_WALLET_COINS));
            return DEFAULT_WALLET_COINS;
        }
        return Math.max(0, parseInt(raw, 10));
    } catch (e) {
        return DEFAULT_WALLET_COINS;
    }
}

function saveWalletToStorage(newScore, broadcast = true) {
    score = Math.max(0, Math.round(newScore));
    updateFormattedScore();
    try {
        localStorage.setItem(WALLET_KEY, String(score));
        if (broadcast && walletChannel) {
            walletChannel.postMessage({ type: 'WALLET_UPDATE', coins: score, source: 'banca' });
        }
    } catch (e) {}
}

function flushPendingCoinsToWallet() {
    if (pendingScore > 0) {
        score += pendingScore;
        pendingScore = 0;
        flyingCoins.length = 0;
    }
    saveWalletToStorage(score, true);
}

function navigateWithWalletSync(targetFile) {
    flushPendingCoinsToWallet();
    window.location.href = targetFile;
}

score = loadWalletFromStorage();
updateFormattedScore();

window.addEventListener('storage', (e) => {
    if (e.key === WALLET_KEY && e.newValue !== null) {
        const incoming = parseInt(e.newValue, 10);
        if (!isNaN(incoming)) {
            score = Math.max(0, incoming);
            updateFormattedScore();
            coinBoxPulse = 1.0;
        }
    }
});

if (walletChannel) {
    walletChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'WALLET_UPDATE' && typeof event.data.coins === 'number') {
            score = Math.max(0, Math.round(event.data.coins));
            updateFormattedScore();
            coinBoxPulse = 1.0;
        }
    };
}

window.addEventListener('pageshow', () => {
    score = loadWalletFromStorage();
    updateFormattedScore();
});

window.addEventListener('beforeunload', () => {
    flushPendingCoinsToWallet();
});
document.addEventListener('visibilitychange', () => {
    if (document.hidden) flushPendingCoinsToWallet();
});

document.getElementById('backLobbyBtn').addEventListener('click', () => navigateWithWalletSync('sanhcho.html'));
document.getElementById('goDoDenBtn').addEventListener('click', () => navigateWithWalletSync('doden.html'));

// ==========================================
// 2. BỘ TỔNG HỢP ÂM THANH (WEB AUDIO API)
// ==========================================
class SoundManager {
    constructor() {
        this.enabled = true;
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playShoot(level, isElectric = false) {
        if (!this.enabled || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            if (isElectric) {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(920, now);
                osc.frequency.exponentialRampToValueAtTime(180, now + 0.11);
                gain.gain.setValueAtTime(0.11, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
            } else if (level === 5) {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(240, now);
                osc.frequency.exponentialRampToValueAtTime(38, now + 0.22);
                gain.gain.setValueAtTime(0.16, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
            } else {
                const types = ['triangle', 'square', 'sawtooth', 'sawtooth'];
                osc.type = types[(level - 1) % types.length];
                const baseFreq = 540 - level * 65;
                osc.frequency.setValueAtTime(baseFreq, now);
                osc.frequency.exponentialRampToValueAtTime(65, now + 0.12);
                gain.gain.setValueAtTime(0.08 + level * 0.012, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            }
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.22);
        } catch (e) {}
    }

    playFreezeSkill() {
        if (!this.enabled || !this.ctx) return;
        try {
            const notes = [1046.5, 1318.5, 1567.98];
            notes.forEach((f, i) => {
                const now = this.ctx.currentTime + i * 0.05;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(f, now);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.3);
            });
        } catch (e) {}
    }

    playLaserAimReady() {
        if (!this.enabled || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.linearRampToValueAtTime(880, now + 0.18);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.2);
        } catch (e) {}
    }

    playLaserBlast() {
        if (!this.enabled || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(720, now);
            osc.frequency.linearRampToValueAtTime(95, now + 0.8);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.85);
        } catch (e) {}
    }

    playElectricZap() {
        if (!this.enabled || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(1250, now);
            osc.frequency.exponentialRampToValueAtTime(240, now + 0.08);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.08);
        } catch (e) {}
    }

    playBounce() {
        if (!this.enabled || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(820, now);
            osc.frequency.exponentialRampToValueAtTime(1350, now + 0.035);
            gain.gain.setValueAtTime(0.03, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.035);
        } catch (e) {}
    }

    playNetHit(level) {
        if (!this.enabled || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = level === 5 ? 'sawtooth' : 'triangle';
            const startF = level === 5 ? 150 : 220;
            const dur = level === 5 ? 0.16 : 0.09;
            osc.frequency.setValueAtTime(startF, now);
            osc.frequency.exponentialRampToValueAtTime(35, now + dur);
            gain.gain.setValueAtTime(level === 5 ? 0.11 : 0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + dur);
        } catch (e) {}
    }

    playCoinCollect() {
        if (!this.enabled || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1046.5, now);
            osc.frequency.setValueAtTime(1318.5, now + 0.04);
            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.13);
        } catch (e) {}
    }

    playSwitchLevel() {
        if (!this.enabled || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(740, now + 0.07);
            gain.gain.setValueAtTime(0.07, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.07);
        } catch (e) {}
    }

    playBossSpawn() {
        if (!this.enabled || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(130, now);
            osc.frequency.linearRampToValueAtTime(65, now + 0.55);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.6);
        } catch (e) {}
    }

    playJackpotExplosion() {
        if (!this.enabled || !this.ctx) return;
        try {
            const t0 = this.ctx.currentTime;
            const boom = this.ctx.createOscillator();
            const boomGain = this.ctx.createGain();
            boom.type = 'sine';
            boom.frequency.setValueAtTime(120, t0);
            boom.frequency.exponentialRampToValueAtTime(28, t0 + 0.7);
            boomGain.gain.setValueAtTime(0.35, t0);
            boomGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.7);
            boom.connect(boomGain);
            boomGain.connect(this.ctx.destination);
            boom.start(t0);
            boom.stop(t0 + 0.7);

            [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568, 2093, 2637].forEach((freq, idx) => {
                const t = t0 + 0.12 + idx * 0.09;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(freq, t);
                gain.gain.setValueAtTime(0.06, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(t);
                osc.stop(t + 0.35);
            });
        } catch (e) {}
    }

    playBossJackpot() {
        if (!this.enabled || !this.ctx) return;
        try {
            const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
            notes.forEach((freq, idx) => {
                const now = this.ctx.currentTime + idx * 0.07;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.3);
            });
        } catch (e) {}
    }

    playLevelUp() {
        if (!this.enabled || !this.ctx) return;
        try {
            const notes = [440, 554.37, 659.25, 880, 1108.73];
            notes.forEach((freq, idx) => {
                const now = this.ctx.currentTime + idx * 0.065;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now);
                gain.gain.setValueAtTime(0.14, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.35);
            });
        } catch (e) {}
    }
}

const sound = new SoundManager();

// ==========================================
// 3. TRẠNG THÁI GAME, BUFF GIÁP THEO TỐC ĐỘ BẮN & 3 KỸ NĂNG
// ==========================================
let coinBoxPulse = 0;
let autoFire = false;
let lockBoss = false;
let isMouseDown = false;
let lastShotTime = 0;
let screenShake = 0;
let bossWarningBanner = { alpha: 0, text: '', subtext: '', color: '#fbbf24' };

// CƠ CHẾ MỚI: Bắn càng nhanh, giáp của toàn bộ cá càng tăng (tối đa +45% giáp)
let rapidFireArmorBuff = 0;

const SKILLS_CONFIG = {
    freeze: {
        key: 'Q',
        name: 'ĐÓNG BĂNG',
        cost: 300,
        cooldown: 8000,
        lastUsed: -99999,
        color: '#38bdf8',
        icon: '❄️'
    },
    laser: {
        key: 'W',
        name: 'NGẮM LAZE',
        cost: 600,
        cooldown: 5000,
        lastUsed: -99999,
        color: '#ec4899',
        icon: '🎯'
    },
    electric: {
        key: 'E',
        name: 'ĐẠN ĐIỆN 20S',
        cost: 1200,
        cooldown: 20000,
        lastUsed: -99999,
        color: '#facc15',
        icon: '⚡'
    }
};

let freezeFramesRemaining = 0;
const FREEZE_DURATION_FRAMES = 360;
// Tỉ lệ đóng băng theo loại cá (cá càng to, boss càng dễ kháng băng)
const FREEZE_CHANCE = { small: 0.75, medium: 0.65, large: 0.5, special: 0.4, boss: 0.25 };
// Sát thương mỗi nhịp laze (cũ: 52) – Đại Boss còn bị thêm 1.2% máu tối đa mỗi nhịp
const LASER_TICK_DAMAGE = 150;
let laserAimMode = false;
let isDraggingLaserAim = false;
let electricPinFramesRemaining = 0;
let pinnedElectricTarget = null;

const OCEAN_STAGES = [
    { name: 'VỊNH SAN HÔ', topColor: '#072a4f', midColor: '#03152c', botColor: '#010712' },
    { name: 'VỰC THẲM ÁNH SAO', topColor: '#1e1b4b', midColor: '#0f172a', botColor: '#020617' },
    { name: 'LÃNH ĐỊA THỦY QUÁI', topColor: '#064e3b', midColor: '#022c22', botColor: '#010d0a' },
    { name: 'LONG CUNG HOÀNG KIM', topColor: '#451a03', midColor: '#1c1917', botColor: '#090705' },
    { name: 'ĐẠI DƯƠNG VÔ CỰC', topColor: '#3b0764', midColor: '#170529', botColor: '#05010a' }
];

let oceanLevel = 1;
let currentExp = 0;
let expToNextLevel = 450;
let rewardMultiplier = 1.0;

let frameCount = 0;
let lastFpsUpdate = performance.now();

const TURRET_SPECS = {
    1: {
        name: 'PHÁO PLASMA HẠNG NHẸ',
        cost: 5,
        damage: 6,
        fireDelay: 130,
        speed: 15.5,
        bulletRadius: 7,
        netRadius: 68,
        caliber: 14,
        barrelLen: 58,
        recoilForce: 10,
        color: '#00f2fe',
        coreColor: '#e0f2fe',
        secondary: '#0284c7'
    },
    2: {
        name: 'PHÁO XUNG KÍCH TỪ TRƯỜNG',
        cost: 12,
        damage: 14,
        fireDelay: 125,
        speed: 16.5,
        bulletRadius: 9,
        netRadius: 85,
        caliber: 18,
        barrelLen: 62,
        recoilForce: 13,
        color: '#ff2a85',
        coreColor: '#fce7f3',
        secondary: '#be185d'
    },
    3: {
        name: 'PHÁO LÕI HƯ KHÔNG',
        cost: 25,
        damage: 28,
        fireDelay: 118,
        speed: 17.5,
        bulletRadius: 11.5,
        netRadius: 105,
        caliber: 22,
        barrelLen: 66,
        recoilForce: 16,
        color: '#a855f7',
        coreColor: '#f3e8ff',
        secondary: '#6b21a8'
    },
    4: {
        name: 'SIÊU PHÁO ĐIỆN TỪ RAILGUN',
        cost: 45,
        damage: 52,
        fireDelay: 110,
        speed: 19,
        bulletRadius: 14,
        netRadius: 130,
        caliber: 26,
        barrelLen: 72,
        recoilForce: 20,
        color: '#22c55e',
        coreColor: '#dcfce7',
        secondary: '#15803d'
    },
    5: {
        name: 'SIÊU PHÁO HẠT NHÂN LONG HỒN',
        cost: 80,
        damage: 95,
        fireDelay: 105,
        speed: 20.5,
        bulletRadius: 18.5,
        netRadius: 165,
        caliber: 32,
        barrelLen: 78,
        recoilForce: 26,
        color: '#ffd700',
        coreColor: '#ffffff',
        secondary: '#dc2626'
    }
};

const cannon = {
    x: 0,
    y: 0,
    angle: -Math.PI / 2,
    level: 5,
    recoil: 0,
    muzzleFlash: 0,
    gearAngle: 0,
    minusBtn: { x: 0, y: 0, r: 21, hover: false },
    plusBtn: { x: 0, y: 0, r: 21, hover: false },
    coinBox: { x: 0, y: 0, w: 210, h: 66, coinTargetX: 0, coinTargetY: 0 },
    rechargeBtn: { x: 0, y: 0, w: 210, h: 30, hover: false },
    autoBtn: { x: 0, y: 0, w: 105, h: 30, hover: false },
    lockBtn: { x: 0, y: 0, w: 105, h: 30, hover: false },
    summonBtn: { x: 0, y: 0, w: 216, h: 32, hover: false },
    skillBtns: {
        freeze: { x: 0, y: 0, w: 68, h: 52, hover: false },
        laser: { x: 0, y: 0, w: 68, h: 52, hover: false },
        electric: { x: 0, y: 0, w: 68, h: 52, hover: false }
    }
};

const mouse = { x: 0, y: 0 };

const bullets = [];
const fishes = [];
const nets = [];
const shockwaves = [];
const particles = [];
const flyingCoins = [];
const floatingTexts = [];
const jackpotBadges = [];
let jackpotShow = null;        // Màn hình NỔ HŨ toàn màn khi hạ Đại Boss
const jackpotCoinRain = [];    // Mưa xu rơi (chỉ là hiệu ứng, xu thật bay về ví)
const bubbles = [];
const lightRays = [];
const activeLasers = [];
const lightningArcs = [];

// ==========================================
// 4. BỐ CỤC MÀN HÌNH & BỘ ĐỆM NỀN
// ==========================================
function rebuildBackgroundCache() {
    bgCacheCanvas.width = canvas.width;
    bgCacheCanvas.height = canvas.height;

    const stage = OCEAN_STAGES[(oceanLevel - 1) % OCEAN_STAGES.length];
    const bgGrad = bgCacheCtx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, stage.topColor);
    bgGrad.addColorStop(0.55, stage.midColor);
    bgGrad.addColorStop(1, stage.botColor);
    bgCacheCtx.fillStyle = bgGrad;
    bgCacheCtx.fillRect(0, 0, canvas.width, canvas.height);

    bgCacheCtx.strokeStyle = 'rgba(56, 189, 248, 0.03)';
    bgCacheCtx.lineWidth = 1;
    const step = 95;
    bgCacheCtx.beginPath();
    for (let x = 0; x < canvas.width; x += step) {
        bgCacheCtx.moveTo(x, 0);
        bgCacheCtx.lineTo(x, canvas.height);
    }
    for (let y = 0; y < canvas.height; y += step) {
        bgCacheCtx.moveTo(0, y);
        bgCacheCtx.lineTo(canvas.width, y);
    }
    bgCacheCtx.stroke();
}

function updateLayout() {
    // gameStage can be scaled/rotated on mobile; canvas drawing stays in stage coordinates.
    const stage = document.getElementById('gameStage');
    const targetWidth = Math.round(stage ? stage.clientWidth : window.innerWidth);
    const targetHeight = Math.round(stage ? stage.clientHeight : window.innerHeight);
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        rebuildBackgroundCache();
    }

    cannon.x = canvas.width / 2;
    cannon.y = canvas.height - 44;

    cannon.minusBtn.x = cannon.x - 76;
    cannon.minusBtn.y = cannon.y + 8;
    cannon.plusBtn.x = cannon.x + 76;
    cannon.plusBtn.y = cannon.y + 8;

    const isCompact = canvas.width < 760;
    const sideOffset = isCompact ? 110 : 128;

    cannon.coinBox.w = isCompact ? 160 : 215;
    cannon.coinBox.h = isCompact ? 56 : 64;
    cannon.coinBox.x = Math.max(10, cannon.x - sideOffset - cannon.coinBox.w);
    cannon.coinBox.y = canvas.height - cannon.coinBox.h - 8;

    cannon.coinBox.coinTargetX = cannon.coinBox.x + 28;
    cannon.coinBox.coinTargetY = cannon.coinBox.y + cannon.coinBox.h / 2;

    cannon.rechargeBtn.w = cannon.coinBox.w;
    cannon.rechargeBtn.h = 28;
    cannon.rechargeBtn.x = cannon.coinBox.x;
    cannon.rechargeBtn.y = cannon.coinBox.y - 33;

    const rightDockX = Math.min(
        canvas.width - (isCompact ? 185 : 228) - 10,
        cannon.x + sideOffset
    );
    const rightDockW = isCompact ? 180 : 222;
    const halfW = (rightDockW - 6) / 2;

    cannon.autoBtn.w = halfW;
    cannon.autoBtn.h = 28;
    cannon.autoBtn.x = rightDockX;
    cannon.autoBtn.y = canvas.height - 70;

    cannon.lockBtn.w = halfW;
    cannon.lockBtn.h = 28;
    cannon.lockBtn.x = rightDockX + halfW + 6;
    cannon.lockBtn.y = canvas.height - 70;

    cannon.summonBtn.w = rightDockW;
    cannon.summonBtn.h = 28;
    cannon.summonBtn.x = rightDockX;
    cannon.summonBtn.y = canvas.height - 36;

    const skillGap = 6;
    const skillW = (rightDockW - skillGap * 2) / 3;
    const skillH = 54;
    const skillY = canvas.height - 130;

    cannon.skillBtns.freeze = { x: rightDockX, y: skillY, w: skillW, h: skillH, hover: false };
    cannon.skillBtns.laser = { x: rightDockX + skillW + skillGap, y: skillY, w: skillW, h: skillH, hover: false };
    cannon.skillBtns.electric = { x: rightDockX + (skillW + skillGap) * 2, y: skillY, w: skillW, h: skillH, hover: false };
}

window.addEventListener('resize', updateLayout);
window.addEventListener('arcadestagechange', updateLayout);
updateLayout();
mouse.x = canvas.width / 2;
mouse.y = canvas.height / 3;

for (let i = 0; i < (window.arcadeIsMobileGame ? 3 : 5); i++) {
    lightRays.push({
        x: Math.random() * window.innerWidth,
        width: 85 + Math.random() * 100,
        angle: 0.16 + Math.random() * 0.1,
        speed: 0.0007 + Math.random() * 0.0005,
        phase: Math.random() * Math.PI * 2
    });
}

for (let i = 0; i < (window.arcadeIsMobileGame ? 9 : 16); i++) {
    bubbles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: 2 + Math.random() * 4.5,
        speed: 0.5 + Math.random() * 1.0,
        wobble: Math.random() * Math.PI * 2
    });
}

// ==========================================
// 5. HỆ THỐNG LÊN CẤP ĐẠI DƯƠNG
// ==========================================
function updateProgressionHUD() {
    const stage = OCEAN_STAGES[(oceanLevel - 1) % OCEAN_STAGES.length];
    stageLevelBadgeEl.textContent = `CẤP ${oceanLevel}`;
    stageNameTextEl.textContent = stage.name;
    const bonusPct = Math.round((rewardMultiplier - 1) * 100);
    stageBonusTextEl.textContent = `+${bonusPct}% THƯỞNG XU`;
    const pct = Math.min(100, Math.round((currentExp / expToNextLevel) * 100));
    expBarFillEl.style.width = `${pct}%`;
    expTextEl.textContent = `${Math.floor(currentExp)}/${expToNextLevel} EXP`;
}

function addOceanExp(amount) {
    currentExp += amount;
    while (currentExp >= expToNextLevel) {
        currentExp -= expToNextLevel;
        oceanLevel++;
        expToNextLevel = Math.round(450 * Math.pow(1.32, oceanLevel - 1));
        rewardMultiplier = 1 + (oceanLevel - 1) * 0.10;
        triggerOceanLevelUp();
    }
    updateProgressionHUD();
}

function triggerOceanLevelUp() {
    sound.playLevelUp();
    rebuildBackgroundCache();
    screenShake = 14;

    const stage = OCEAN_STAGES[(oceanLevel - 1) % OCEAN_STAGES.length];
    const levelBonusCoins = 1500;

    shockwaves.push({
        x: cannon.x,
        y: cannon.y,
        radius: 25,
        maxRadius: Math.max(canvas.width, canvas.height) * 0.65,
        color: '#ffd700',
        alpha: 0.95,
        lineWidth: 8
    });

    for (let i = 0; i < 15; i++) {
        spawnFlyingCoin(
            canvas.width / 2 + (Math.random() - 0.5) * 240,
            canvas.height / 2 + (Math.random() - 0.5) * 110,
            100,
            i * 2
        );
    }

    bossWarningBanner = {
        alpha: 1.35,
        text: `🌟 THĂNG CẤP ĐẠI DƯƠNG: CẤP ${oceanLevel} - ${stage.name} 🌟`,
        subtext: `THƯỞNG LÊN CẤP +${levelBonusCoins.toLocaleString('vi-VN')} XU • ĐỘ KHÓ & MÁU CÁ TĂNG CAO!`,
        color: '#4ade80'
    };

    if (countActiveBosses() < 4) {
        spawnBoss();
    }
}

updateProgressionHUD();

// ==========================================
// 6. KÍCH HOẠT 3 KỸ NĂNG HỖ TRỢ
// ==========================================
function activateSupportSkill(skillId) {
    sound.init();
    const now = performance.now();
    const cfg = SKILLS_CONFIG[skillId];
    if (!cfg) return;

    if (skillId === 'laser' && laserAimMode) {
        laserAimMode = false;
        addFloatingText(cannon.x, cannon.y - 90, 'ĐÃ HỦY NGẮM LAZE', '#94a3b8', 0.9);
        return;
    }

    if (now - cfg.lastUsed < cfg.cooldown) {
        const remainSec = ((cfg.cooldown - (now - cfg.lastUsed)) / 1000).toFixed(1);
        addFloatingText(cannon.x, cannon.y - 90, `⏳ HỒI CHIÊU ${cfg.name}: ${remainSec}s`, '#94a3b8', 0.9);
        return;
    }

    if (score < cfg.cost) {
        coinBoxPulse = 1.4;
        addFloatingText(
            cannon.coinBox.x + cannon.coinBox.w / 2,
            cannon.coinBox.y - 50,
            `⚠️ CẦN ${cfg.cost.toLocaleString('vi-VN')} XU!`,
            '#f43f5e',
            1.0
        );
        return;
    }

    if (skillId === 'freeze') {
        saveWalletToStorage(score - cfg.cost, true);
        cfg.lastUsed = now;
        sound.playFreezeSkill();
        freezeFramesRemaining = FREEZE_DURATION_FRAMES;
        screenShake = 10;
        const freezeResult = applyFreezeChance();

        shockwaves.push({
            x: cannon.x,
            y: cannon.y,
            radius: 20,
            maxRadius: Math.max(canvas.width, canvas.height),
            color: '#38bdf8',
            alpha: 1.0,
            lineWidth: 10
        });

        addFloatingText(canvas.width / 2, canvas.height / 2 - 40, `❄️ ĐÓNG BĂNG ${freezeResult.frozen}/${freezeResult.total} CÁ (-${cfg.cost} XU) ❄️`, '#38bdf8', 1.15);

    } else if (skillId === 'laser') {
        sound.playLaserAimReady();
        laserAimMode = true;
        isMouseDown = false;
        addFloatingText(
            cannon.x,
            cannon.y - 110,
            '🎯 CHẠM VUỐT ĐỂ NGẮM ĐƯỜNG LAZE • NHẢ TAY / ẤN ĐỂ KHAI HỎA!',
            '#f472b6',
            1.05
        );

    } else if (skillId === 'electric') {
        saveWalletToStorage(score - cfg.cost, true);
        cfg.lastUsed = now;
        sound.playElectricZap();
        electricPinFramesRemaining = 1200;
        screenShake = 12;

        pinnedElectricTarget = getLockedTarget();

        shockwaves.push({
            x: cannon.x,
            y: cannon.y,
            radius: 15,
            maxRadius: 340,
            color: '#facc15',
            alpha: 1.0,
            lineWidth: 8
        });

        addFloatingText(
            canvas.width / 2,
            canvas.height / 2 - 50,
            `⚡ BẬT ĐẠN ĐIỆN GHIM TÂM 20 GIÂY (-1.200 XU) • ẤN VÀO CÁ ĐỂ KHÓA MỤC TIÊU!`,
            '#facc15',
            1.1
        );
    }
}

function fireAimedLaser() {
    if (!laserAimMode) return;
    const cfg = SKILLS_CONFIG.laser;
    const now = performance.now();

    if (score < cfg.cost) {
        laserAimMode = false;
        coinBoxPulse = 1.4;
        addFloatingText(cannon.x, cannon.y - 90, '⚠️ KHÔNG ĐỦ 600 XU ĐỂ BẮN LAZE!', '#f43f5e', 1.0);
        return;
    }

    saveWalletToStorage(score - cfg.cost, true);
    cfg.lastUsed = now;
    laserAimMode = false;
    isDraggingLaserAim = false;

    sound.playLaserBlast();
    cannon.recoil = 30;
    screenShake = 16;

    activeLasers.push({
        x: cannon.x,
        y: cannon.y,
        angle: cannon.angle,
        life: 65,
        maxLife: 65,
        width: 78,
        tickCounter: 0
    });

    addFloatingText(
        cannon.x + Math.cos(cannon.angle) * 140,
        cannon.y + Math.sin(cannon.angle) * 140,
        `⚡ KHAI HỎA LAZE XUYÊN THẤU (-${cfg.cost} XU)! ⚡`,
        '#f472b6',
        1.2
    );
}

function findFishAtPoint(px, py) {
    let bestFish = null;
    let minDistSq = Infinity;
    for (let i = fishes.length - 1; i >= 0; i--) {
        const f = fishes[i];
        const dx = px - f.x;
        const dy = py - f.y;
        const hitR = f.size * 1.25 + 18;
        const dSq = dx * dx + dy * dy;
        if (dSq <= hitR * hitR && dSq < minDistSq) {
            minDistSq = dSq;
            bestFish = f;
        }
    }
    return bestFish;
}

// ==========================================
// 7. NGẮM BẮN, ĐẠN ĐIỆN GHIM TÂM & VA CHẠM
// ==========================================
function clampTurretAngle(rawAngle) {
    if (rawAngle > -0.10 && rawAngle < Math.PI / 2) return -0.10;
    if (rawAngle >= Math.PI / 2 || rawAngle < -Math.PI + 0.10) return -Math.PI + 0.10;
    return rawAngle;
}

function updateAimAngle(clientX, clientY) {
    mouse.x = clientX;
    mouse.y = clientY;
    if (laserAimMode || (!lockBoss && electricPinFramesRemaining <= 0)) {
        cannon.angle = clampTurretAngle(Math.atan2(mouse.y - cannon.y, mouse.x - cannon.x));
    }
}

function getLockedTarget() {
    let best = null;
    let bestPriority = -1;
    for (let i = 0; i < fishes.length; i++) {
        const f = fishes[i];
        if (f.isDead || f.x < 10 || f.x > canvas.width - 10 || f.y < 10 || f.y > canvas.height - 70) continue;
        const tierWeight = f.tier === 'boss' ? 10000 : (f.tier === 'special' ? 2000 : 0);
        const priority = tierWeight + f.reward;
        if (priority > bestPriority) {
            bestPriority = priority;
            best = f;
        }
    }
    return best;
}

function changeTurretLevel(deltaOrExact, isExact = false) {
    sound.init();
    const oldLevel = cannon.level;
    if (isExact) {
        cannon.level = Math.max(1, Math.min(5, deltaOrExact));
    } else {
        cannon.level += deltaOrExact;
        if (cannon.level > 5) cannon.level = 1;
        if (cannon.level < 1) cannon.level = 5;
    }
    if (cannon.level !== oldLevel) {
        sound.playSwitchLevel();
        cannon.recoil = 10;
    }
}

function triggerFreeRecharge() {
    sound.init();
    for (let i = 0; i < 10; i++) {
        spawnFlyingCoin(
            cannon.coinBox.x + cannon.coinBox.w / 2 + (Math.random() - 0.5) * 90,
            cannon.coinBox.y - 65 - Math.random() * 45,
            100,
            i * 2
        );
    }
    addFloatingText(cannon.coinBox.x + cannon.coinBox.w / 2, cannon.coinBox.y - 45, '+1.000 XU TIẾP TẾ!', '#4ade80', 1.1);
}

function addParticle(x, y, vx, vy, radius, color, decay) {
    if (particles.length >= (window.arcadeIsMobileGame ? 38 : 65)) particles.shift();
    particles.push({ x, y, vx, vy, radius, color, alpha: 1, decay });
}

function addFloatingText(x, y, text, color, scale = 1.0) {
    if (floatingTexts.length >= 18) floatingTexts.shift();
    floatingTexts.push({ x, y, text, color, alpha: 1, scale });
}

function tryShoot(now) {
    if (laserAimMode) return;

    const spec = TURRET_SPECS[cannon.level];
    const isElectricMode = electricPinFramesRemaining > 0;
    const effectiveDelay = isElectricMode ? spec.fireDelay * 0.8 : spec.fireDelay;

    if (now - lastShotTime < effectiveDelay) return;

    if (score < spec.cost) {
        coinBoxPulse = 1.3;
        return;
    }

    sound.init();
    saveWalletToStorage(score - spec.cost, true);
    lastShotTime = now;

    // CƠ CHẾ MỚI: Bắn càng nhanh, giáp của tất cả cá càng được buff lên (tối đa +45%)
    rapidFireArmorBuff = Math.min(0.45, rapidFireArmorBuff + 0.032);

    cannon.recoil = spec.recoilForce;
    cannon.muzzleFlash = 1.0;
    sound.playShoot(cannon.level, isElectricMode);

    const barrelTipDist = spec.barrelLen + 8;
    const spawnX = cannon.x + Math.cos(cannon.angle) * barrelTipDist;
    const spawnY = cannon.y + Math.sin(cannon.angle) * barrelTipDist;

    bullets.push({
        x: spawnX,
        y: spawnY,
        vx: Math.cos(cannon.angle) * (isElectricMode ? 24 : spec.speed),
        vy: Math.sin(cannon.angle) * (isElectricMode ? 24 : spec.speed),
        radius: spec.bulletRadius,
        power: spec.damage,
        netRadius: spec.netRadius,
        level: cannon.level,
        color: isElectricMode ? '#00f2fe' : spec.color,
        coreColor: spec.coreColor,
        secondary: spec.secondary,
        bounces: 0,
        maxBounces: 10,
        spin: 0,
        isElectric: isElectricMode,
        lockedFish: isElectricMode ? pinnedElectricTarget : null,
        trail: []
    });

    const sparkCount = isElectricMode ? 4 : (cannon.level === 5 ? 6 : 3);
    for (let i = 0; i < sparkCount; i++) {
        const spread = cannon.angle + (Math.random() - 0.5) * 0.8;
        const spd = 3 + Math.random() * 5;
        addParticle(
            spawnX,
            spawnY,
            Math.cos(spread) * spd,
            Math.sin(spread) * spd,
            2.5,
            isElectricMode ? '#fef08a' : spec.color,
            0.09
        );
    }
}

function triggerElectricShockHit(hitFish, basePower) {
    sound.playElectricZap();

    // Khi bắn quá nhanh, giáp cộng thêm vẫn giảm một phần sát thương của đạn điện
    const rapidPenalty = 1 - rapidFireArmorBuff * 0.65;

    hitFish.stunFrames = 25;
    hitFish.hp -= basePower * 1.25 * rapidPenalty;
    hitFish.hitFlash = 6;

    let chainCount = 0;
    const maxChainDistSq = 220 * 220;

    for (let i = fishes.length - 1; i >= 0; i--) {
        const other = fishes[i];
        if (other === hitFish || other.isDead) continue;
        const dx = other.x - hitFish.x;
        const dy = other.y - hitFish.y;
        if (dx * dx + dy * dy <= maxChainDistSq) {
            other.hp -= basePower * 0.55 * rapidPenalty;
            other.hitFlash = 5;
            other.stunFrames = 18;

            lightningArcs.push({
                x1: hitFish.x,
                y1: hitFish.y,
                x2: other.x,
                y2: other.y,
                life: 10
            });

            chainCount++;
            if (chainCount >= 3) break;
        }
    }

    if (Math.random() < 0.45) {
        lightningArcs.push({
            x1: cannon.x + Math.cos(cannon.angle) * 75,
            y1: cannon.y + Math.sin(cannon.angle) * 75,
            x2: hitFish.x,
            y2: hitFish.y,
            life: 8
        });
    }
}

// ==========================================
// 8. ĐIỀU KHIỂN CHUỘT, PHÍM & CHẠM VUỐT DI ĐỘNG
// ==========================================
function pointInRect(px, py, rect) {
    return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
}

function isUIButtonTap(clientX, clientY) {
    if (pointInRect(clientX, clientY, cannon.skillBtns.freeze)) {
        activateSupportSkill('freeze');
        return true;
    }
    if (pointInRect(clientX, clientY, cannon.skillBtns.laser)) {
        activateSupportSkill('laser');
        return true;
    }
    if (pointInRect(clientX, clientY, cannon.skillBtns.electric)) {
        activateSupportSkill('electric');
        return true;
    }
    if (Math.hypot(clientX - cannon.minusBtn.x, clientY - cannon.minusBtn.y) <= cannon.minusBtn.r + 6) {
        changeTurretLevel(-1);
        return true;
    }
    if (Math.hypot(clientX - cannon.plusBtn.x, clientY - cannon.plusBtn.y) <= cannon.plusBtn.r + 6) {
        changeTurretLevel(1);
        return true;
    }
    if (pointInRect(clientX, clientY, cannon.rechargeBtn)) {
        triggerFreeRecharge();
        return true;
    }
    if (pointInRect(clientX, clientY, cannon.autoBtn)) {
        autoFire = !autoFire;
        sound.playSwitchLevel();
        return true;
    }
    if (pointInRect(clientX, clientY, cannon.lockBtn)) {
        lockBoss = !lockBoss;
        sound.playSwitchLevel();
        return true;
    }
    if (pointInRect(clientX, clientY, cannon.summonBtn)) {
        spawnBoss();
        return true;
    }
    return false;
}

canvas.addEventListener('mousemove', (e) => {
    const {x, y} = window.arcadeToGame(e.clientX, e.clientY);
    updateAimAngle(x, y);
    cannon.minusBtn.hover = Math.hypot(x - cannon.minusBtn.x, y - cannon.minusBtn.y) <= cannon.minusBtn.r + 4;
    cannon.plusBtn.hover = Math.hypot(x - cannon.plusBtn.x, y - cannon.plusBtn.y) <= cannon.plusBtn.r + 4;
    cannon.rechargeBtn.hover = pointInRect(x, y, cannon.rechargeBtn);
    cannon.autoBtn.hover = pointInRect(x, y, cannon.autoBtn);
    cannon.lockBtn.hover = pointInRect(x, y, cannon.lockBtn);
    cannon.summonBtn.hover = pointInRect(x, y, cannon.summonBtn);
    cannon.skillBtns.freeze.hover = pointInRect(x, y, cannon.skillBtns.freeze);
    cannon.skillBtns.laser.hover = pointInRect(x, y, cannon.skillBtns.laser);
    cannon.skillBtns.electric.hover = pointInRect(x, y, cannon.skillBtns.electric);
});

canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    const {x, y} = window.arcadeToGame(e.clientX, e.clientY);
    sound.init();
    if (isUIButtonTap(x, y)) return;
    if (laserAimMode) {
        updateAimAngle(x, y);
        fireAimedLaser();
        return;
    }
    if (electricPinFramesRemaining > 0) {
        const clickedFish = findFishAtPoint(x, y);
        if (clickedFish) {
            pinnedElectricTarget = clickedFish;
            sound.playSwitchLevel();
            addFloatingText(clickedFish.x, clickedFish.y - 25, '⚡ ĐÃ GHIM TÂM!', '#facc15', 0.95);
        }
    }
    updateAimAngle(x, y);
    isMouseDown = true;
    tryShoot(performance.now());
});
window.addEventListener('mouseup', () => { isMouseDown = false; });
window.addEventListener('blur', () => { isMouseDown = false; });

let activeGameTouchId = null;
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (activeGameTouchId !== null || e.changedTouches.length === 0) return;
    const t = e.changedTouches[0];
    const {x, y} = window.arcadeToGame(t.clientX, t.clientY);
    sound.init();
    if (isUIButtonTap(x, y)) return;
    activeGameTouchId = t.identifier;
    if (laserAimMode) {
        isDraggingLaserAim = true;
        updateAimAngle(x, y);
        return;
    }
    if (electricPinFramesRemaining > 0) {
        const tappedFish = findFishAtPoint(x, y);
        if (tappedFish) {
            pinnedElectricTarget = tappedFish;
            sound.playSwitchLevel();
            addFloatingText(tappedFish.x, tappedFish.y - 25, '⚡ ĐÃ GHIM TÂM!', '#facc15', 0.95);
        }
    }
    updateAimAngle(x, y);
    isMouseDown = true;
    tryShoot(performance.now());
}, {passive: false});
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (activeGameTouchId === null) return;
    const t = Array.from(e.touches).find(t => t.identifier === activeGameTouchId);
    if (!t) return;
    const {x, y} = window.arcadeToGame(t.clientX, t.clientY);
    updateAimAngle(x, y);
}, {passive: false});
function finishGameTouch(e) {
    e.preventDefault();
    if (activeGameTouchId === null) return;
    if (!Array.from(e.changedTouches).some(t => t.identifier === activeGameTouchId)) return;
    activeGameTouchId = null;
    isMouseDown = false;
    if (laserAimMode && isDraggingLaserAim) {
        isDraggingLaserAim = false;
        fireAimedLaser();
    }
}
canvas.addEventListener('touchend', finishGameTouch, {passive: false});
canvas.addEventListener('touchcancel', finishGameTouch, {passive: false});

window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (['1', '2', '3', '4', '5'].includes(key)) {
        changeTurretLevel(parseInt(key), true);
    } else if (key === '-' || key === '_') {
        changeTurretLevel(-1);
    } else if (key === '=' || key === '+') {
        changeTurretLevel(1);
    } else if (key === 'b') {
        spawnBoss();
    } else if (key === 'q') {
        activateSupportSkill('freeze');
    } else if (key === 'w') {
        activateSupportSkill('laser');
    } else if (key === 'e') {
        activateSupportSkill('electric');
    }
});

document.getElementById('spawnBossTopBtn').addEventListener('click', () => {
    sound.init();
    spawnBoss();
});

document.getElementById('soundBtn').addEventListener('click', () => {
    sound.init();
    sound.enabled = !sound.enabled;
    document.getElementById('soundText').textContent = sound.enabled ? 'BẬT' : 'TẮT';
});

// ==========================================
// 9. THƯỞNG XU BAY VÀO KHAY, NỔ DÂY CHUYỀN & NỔ HŨ BOSS
// ==========================================
function spawnFlyingCoin(startX, startY, value, delayFrames = 0) {
    if (flyingCoins.length >= 36) {
        saveWalletToStorage(score + value, true);
        return;
    }
    pendingScore += value;
    const cpX = (startX + cannon.coinBox.coinTargetX) / 2 + (Math.random() - 0.5) * 150;
    const cpY = Math.min(startY, cannon.coinBox.coinTargetY) - 85 - Math.random() * 70;

    flyingCoins.push({
        startX,
        startY,
        cpX,
        cpY,
        x: startX,
        y: startY,
        t: 0,
        speed: 0.026 + Math.random() * 0.01,
        delay: delayFrames,
        value,
        spinPhase: Math.random() * Math.PI * 2
    });
}

// Đóng băng theo tỉ lệ: mỗi con cá tự "quay số" – con kháng băng vẫn bơi bình thường,
// cá mới sinh ra sau đó cũng không bị đóng băng
function applyFreezeChance() {
    let frozen = 0;
    let total = 0;
    for (let i = 0; i < fishes.length; i++) {
        const f = fishes[i];
        if (f.isDead) continue;
        total++;
        const chance = FREEZE_CHANCE[f.tier] !== undefined ? FREEZE_CHANCE[f.tier] : 0.6;
        if (Math.random() < chance) {
            f.frozenFrames = FREEZE_DURATION_FRAMES;
            frozen++;
            for (let k = 0; k < 2; k++) {
                addParticle(f.x, f.y, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, 2.5, '#bae6fd', 0.05);
            }
        } else if (f.tier === 'boss' || f.tier === 'special') {
            addFloatingText(f.x, f.y - f.size, '🛡️ KHÁNG BĂNG', '#fde047', 0.85);
        }
    }
    return { frozen, total };
}

// ==========================================
// NỔ HŨ ĐẠI BOSS: sóng nổ vàng + mưa xu + màn hình chữ NỔ HŨ đếm tiền
// ==========================================
function triggerBossJackpot(fish) {
    sound.playJackpotExplosion();
    screenShake = 34;

    const rings = [
        { max: 260, color: '#ffd700', w: 9 },
        { max: 420, color: '#ffffff', w: 6 },
        { max: 600, color: '#f97316', w: 4 }
    ];
    rings.forEach(r => shockwaves.push({
        x: fish.x, y: fish.y, radius: 20, maxRadius: r.max, color: r.color, alpha: 1.0, lineWidth: r.w
    }));

    for (let c = 0; c < 55; c++) {
        jackpotCoinRain.push({
            x: Math.random() * canvas.width,
            y: -20 - Math.random() * canvas.height * 0.7,
            vx: (Math.random() - 0.5) * 1.6,
            vy: 4 + Math.random() * 5,
            r: 8 + Math.random() * 7,
            phase: Math.random() * Math.PI * 2
        });
    }
    if (jackpotCoinRain.length > 140) jackpotCoinRain.splice(0, jackpotCoinRain.length - 140);

    if (jackpotShow && jackpotShow.life > 0) {
        // Hạ nhiều boss liên tiếp -> cộng dồn thành COMBO
        jackpotShow.total += fish.reward;
        jackpotShow.count++;
        jackpotShow.name = `COMBO ${jackpotShow.count} ĐẠI BOSS`;
        jackpotShow.life = jackpotShow.maxLife;
        jackpotShow.age = 0;
    } else {
        jackpotShow = { total: fish.reward, shown: 0, count: 1, name: fish.name, life: 210, maxLife: 210, age: 0 };
    }
}

function drawJackpotShow(time) {
    for (let i = jackpotCoinRain.length - 1; i >= 0; i--) {
        const c = jackpotCoinRain[i];
        c.x += c.vx;
        c.y += c.vy;
        if (c.y > canvas.height + 30) {
            jackpotCoinRain.splice(i, 1);
            continue;
        }
        if (c.y > -c.r) drawSpinningCoin(c.x, c.y, c.r, time * 0.02 + c.phase);
    }

    const js = jackpotShow;
    if (!js) return;
    js.life--;
    js.age++;
    if (js.life <= 0) {
        jackpotShow = null;
        return;
    }
    js.shown = Math.min(js.total, js.shown + Math.max(js.total / 70, (js.total - js.shown) * 0.08));

    const fade = Math.min(1, js.life / 30, js.age / 10);
    const cx = canvas.width / 2;
    const cy = canvas.height * 0.36;
    const pop = Math.min(1, js.age / 14);
    const scale = (0.4 + 0.6 * (1 - Math.pow(1 - pop, 3))) * (1 + Math.sin(time * 0.012) * 0.04) * Math.min(1, canvas.width / 760);

    ctx.save();
    ctx.globalAlpha = fade * 0.4;
    const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(canvas.width, canvas.height) * 0.6);
    glow.addColorStop(0, 'rgba(255, 215, 0, 0.85)');
    glow.addColorStop(1, 'rgba(255, 140, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.translate(cx, cy);
    ctx.globalAlpha = fade * 0.28;
    ctx.fillStyle = '#fde047';
    const rayLen = Math.max(canvas.width, canvas.height);
    for (let k = 0; k < 14; k++) {
        const a = time * 0.0006 + (k * Math.PI * 2) / 14;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a - 0.07) * rayLen, Math.sin(a - 0.07) * rayLen);
        ctx.lineTo(Math.cos(a + 0.07) * rayLen, Math.sin(a + 0.07) * rayLen);
        ctx.closePath();
        ctx.fill();
    }

    ctx.globalAlpha = fade;
    ctx.scale(scale, scale);
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';

    ctx.font = '900 96px Orbitron, sans-serif';
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#7c2d12';
    ctx.strokeText('NỔ HŨ!', 0, 0);
    const grad = ctx.createLinearGradient(0, -80, 0, 20);
    grad.addColorStop(0, '#fff7ae');
    grad.addColorStop(0.5, '#ffd700');
    grad.addColorStop(1, '#f97316');
    ctx.fillStyle = grad;
    ctx.fillText('NỔ HŨ!', 0, 0);

    const nameText = '👑 ' + js.name + ' 👑';
    ctx.font = '800 26px Chakra Petch, sans-serif';
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#1e1b4b';
    ctx.strokeText(nameText, 0, 48);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(nameText, 0, 48);

    const amountText = '+' + Math.round(js.shown).toLocaleString('vi-VN') + ' XU';
    ctx.font = '900 54px Orbitron, sans-serif';
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#422006';
    ctx.strokeText(amountText, 0, 112);
    ctx.fillStyle = '#fde047';
    ctx.fillText(amountText, 0, 112);
    ctx.restore();

    if (js.age < 10) {
        ctx.save();
        ctx.globalAlpha = (1 - js.age / 10) * 0.55;
        ctx.fillStyle = '#fff7d6';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }
}

function sweepDeadFishes() {
    let foundDead = true;
    let safety = 0;
    while (foundDead && safety < 8) {
        foundDead = false;
        safety++;
        for (let i = fishes.length - 1; i >= 0; i--) {
            const f = fishes[i];
            if (f.hp <= 0 && !f.isDead) {
                f.isDead = true;
                fishes.splice(i, 1);
                onFishDefeated(f);
                foundDead = true;
            }
        }
    }
}

function onFishDefeated(fish) {
    if (fish === pinnedElectricTarget) {
        pinnedElectricTarget = null;
    }

    if (fish.tier === 'special' && typeof triggerSpecialFishMechanic === 'function') {
        triggerSpecialFishMechanic(fish);
    }

    const isBoss = fish.tier === 'boss';
    const isSpecial = fish.tier === 'special';
    const coinCount = isBoss ? 36 : (isSpecial ? 12 : (fish.tier === 'large' ? 7 : 3));
    const baseVal = Math.floor(fish.reward / coinCount);
    let remainder = fish.reward - baseVal * coinCount;

    for (let c = 0; c < coinCount; c++) {
        const coinValue = baseVal + (c === 0 ? remainder : 0);
        spawnFlyingCoin(
            fish.x + (Math.random() - 0.5) * fish.size,
            fish.y + (Math.random() - 0.5) * fish.size,
            coinValue,
            c * 2
        );
    }

    addOceanExp(fish.exp || 15);

    if (isBoss) {
        sound.playBossJackpot();
        triggerBossJackpot(fish);
    } else {
        addFloatingText(
            fish.x,
            fish.y - 12,
            `+${fish.rewardFormatted || fish.reward} XU`,
            (fish.tier === 'large' || isSpecial) ? '#fde047' : '#38bdf8',
            (fish.tier === 'large' || isSpecial) ? 1.15 : 0.95
        );
    }

    const pCount = isBoss ? 22 : (isSpecial ? 14 : (fish.tier === 'large' ? 10 : 5));
    for (let p = 0; p < pCount; p++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 2 + Math.random() * (isBoss ? 7 : 4);
        addParticle(
            fish.x,
            fish.y,
            Math.cos(ang) * spd,
            Math.sin(ang) * spd,
            isBoss ? 3.5 : 2.5,
            p % 2 === 0 ? '#ffd700' : fish.primary,
            isBoss ? 0.025 : 0.045
        );
    }
}

// ==========================================
// 10. VẼ NỀN ĐẠI DƯƠNG, ĐẠN, LAZE, TIA SÉT & TRỤ SÚNG
// ==========================================
function drawOceanBackground(time) {
    ctx.drawImage(bgCacheCanvas, 0, 0);

    ctx.fillStyle = freezeFramesRemaining > 0 ? 'rgba(125, 211, 252, 0.08)' : 'rgba(56, 189, 248, 0.04)';
    for (let i = 0; i < lightRays.length; i++) {
        const ray = lightRays[i];
        const sway = Math.sin(time * ray.speed + ray.phase) * 40;
        const topX = ray.x + sway;
        const botX = topX + Math.tan(ray.angle) * canvas.height;

        ctx.beginPath();
        ctx.moveTo(topX - ray.width / 2, 0);
        ctx.lineTo(topX + ray.width / 2, 0);
        ctx.lineTo(botX + ray.width * 1.2, canvas.height * 0.85);
        ctx.lineTo(botX - ray.width * 1.2, canvas.height * 0.85);
        ctx.closePath();
        ctx.fill();
    }

    if (freezeFramesRemaining > 0) {
        ctx.fillStyle = 'rgba(14, 165, 233, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.fillStyle = 'rgba(186, 230, 253, 0.15)';
    ctx.beginPath();
    for (let i = 0; i < bubbles.length; i++) {
        const b = bubbles[i];
        b.y -= b.speed * (freezeFramesRemaining > 0 ? 0.2 : 1);
        b.x += Math.sin(time * 0.003 + b.wobble) * 0.3;
        if (b.y < -15) {
            b.y = canvas.height + 15;
            b.x = Math.random() * canvas.width;
        }
        ctx.moveTo(b.x + b.r, b.y);
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    }
    ctx.fill();
}

function drawBullet(b) {
    if (b.isElectric) {
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.fillStyle = '#00f2fe';
        ctx.beginPath();
        ctx.arc(0, 0, b.radius * 1.15, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(0, 0, b.radius * 0.65, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return;
    }

    for (let i = 0; i < b.trail.length; i++) {
        const pt = b.trail[i];
        const ratio = (i + 1) / b.trail.length;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, b.radius * ratio * 0.75, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.globalAlpha = ratio * 0.32;
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    const angle = Math.atan2(b.vy, b.vx);
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(angle);

    if (b.level === 5) {
        b.spin += 0.18;
        ctx.fillStyle = 'rgba(255, 165, 0, 0.24)';
        ctx.beginPath();
        ctx.arc(0, 0, b.radius * 1.75, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.ellipse(0, 0, b.radius * 1.5, b.radius, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(b.radius * 0.2, 0, b.radius * 0.9, b.radius * 0.58, 0, 0, Math.PI * 2);
        ctx.fill();
    } else {
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, b.radius * 1.75, b.radius * 0.92, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(b.radius * 0.3, 0, b.radius * 0.95, b.radius * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

function drawLaserAimPreview(time) {
    if (!laserAimMode) return;
    const beamLen = Math.max(canvas.width, canvas.height) * 1.35;
    const previewW = 62;

    ctx.save();
    ctx.translate(cannon.x, cannon.y);
    ctx.rotate(cannon.angle);

    ctx.fillStyle = 'rgba(236, 72, 153, 0.16)';
    ctx.fillRect(65, -previewW / 2, beamLen, previewW);

    ctx.strokeStyle = '#f472b6';
    ctx.lineWidth = 2.2;
    ctx.setLineDash([12, 8]);
    ctx.lineDashOffset = -time * 0.06;
    ctx.beginPath();
    ctx.moveTo(65, -previewW / 2);
    ctx.lineTo(beamLen, -previewW / 2);
    ctx.moveTo(65, previewW / 2);
    ctx.lineTo(beamLen, previewW / 2);
    ctx.stroke();

    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(65, 0);
    ctx.lineTo(beamLen, 0);
    ctx.stroke();

    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    roundRectPath(ctx, cannon.x - 190, cannon.y - 125, 380, 32, 8);
    ctx.fill();
    ctx.strokeStyle = '#f472b6';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.font = '800 12px Chakra Petch, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎯 VUỐT ĐỂ CHỈNH ĐƯỜNG LAZE • NHẢ TAY / ẤN ĐỂ BẮN!', cannon.x, cannon.y - 109);
    ctx.restore();
}

function drawAndUpdateLasers() {
    for (let i = activeLasers.length - 1; i >= 0; i--) {
        const lz = activeLasers[i];
        lz.life--;
        lz.tickCounter++;

        const ratio = lz.life / lz.maxLife;
        const beamLen = Math.max(canvas.width, canvas.height) * 1.4;
        const curW = lz.width * (0.7 + Math.sin(lz.life * 0.6) * 0.2) * ratio;

        ctx.save();
        ctx.translate(lz.x, lz.y);
        ctx.rotate(lz.angle);

        ctx.fillStyle = 'rgba(236, 72, 153, 0.42)';
        ctx.fillRect(60, -curW * 0.85, beamLen, curW * 1.7);

        ctx.fillStyle = 'rgba(0, 242, 254, 0.78)';
        ctx.fillRect(60, -curW * 0.45, beamLen, curW * 0.9);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(60, -curW * 0.2, beamLen, curW * 0.4);

        ctx.restore();

        if (lz.tickCounter % 5 === 0) {
            const cosA = Math.cos(lz.angle);
            const sinA = Math.sin(lz.angle);

            for (let k = fishes.length - 1; k >= 0; k--) {
                const f = fishes[k];
                if (f.isDead) continue;
                const dx = f.x - lz.x;
                const dy = f.y - lz.y;
                const proj = dx * cosA + dy * sinA;
                if (proj > 0 && proj < beamLen) {
                    const perpDist = Math.abs(-dx * sinA + dy * cosA);
                    if (perpDist < f.size * 0.9 + curW * 0.6) {
                        f.hp -= LASER_TICK_DAMAGE + (f.tier === 'boss' ? f.maxHp * 0.012 : 0);
                        f.hitFlash = 4;
                    }
                }
            }
        }

        if (lz.life <= 0) {
            activeLasers.splice(i, 1);
        }
    }
}

function drawAndUpdateLightningArcs() {
    if (lightningArcs.length === 0) return;
    ctx.save();
    for (let i = lightningArcs.length - 1; i >= 0; i--) {
        const arc = lightningArcs[i];
        arc.life--;
        if (arc.life <= 0) {
            lightningArcs.splice(i, 1);
            continue;
        }

        ctx.strokeStyle = arc.life % 2 === 0 ? '#00f2fe' : '#fef08a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(arc.x1, arc.y1);
        const steps = 4;
        for (let s = 1; s < steps; s++) {
            const t = s / steps;
            const mx = arc.x1 + (arc.x2 - arc.x1) * t + (Math.random() - 0.5) * 28;
            const my = arc.y1 + (arc.y2 - arc.y1) * t + (Math.random() - 0.5) * 28;
            ctx.lineTo(mx, my);
        }
        ctx.lineTo(arc.x2, arc.y2);
        ctx.stroke();
    }
    ctx.restore();
}

function drawNet(n) {
    ctx.save();
    ctx.translate(n.x, n.y);
    ctx.rotate(n.rotation);
    ctx.globalAlpha = n.alpha;

    ctx.fillStyle = n.color;
    ctx.globalAlpha = n.alpha * 0.16;
    ctx.beginPath();
    ctx.arc(0, 0, n.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = n.alpha;
    ctx.strokeStyle = n.color;
    ctx.lineWidth = 2.2;

    const sides = 8;
    ctx.beginPath();
    for (let i = 0; i <= sides; i++) {
        const a = (i * Math.PI * 2) / sides;
        const px = Math.cos(a) * n.radius;
        const py = Math.sin(a) * n.radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    for (let i = 0; i < sides; i += 2) {
        const a = (i * Math.PI * 2) / sides;
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * n.radius, Math.sin(a) * n.radius);
    }
    ctx.stroke();
    ctx.restore();
}

function roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function drawSpinningCoin(x, y, radius, spinPhase) {
    ctx.save();
    ctx.translate(x, y);
    const scaleX = Math.max(0.22, Math.abs(Math.cos(spinPhase)));
    ctx.scale(scaleX, 1);

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 1.8;
    ctx.strokeStyle = '#fef9c3';
    ctx.stroke();
    ctx.restore();
}

function drawTurretStepButton(btn, symbol) {
    ctx.save();
    ctx.translate(btn.x, btn.y);

    const r = btn.r;
    ctx.fillStyle = btn.hover ? '#0284c7' : '#1e293b';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 2.2;
    ctx.strokeStyle = btn.hover ? '#fef08a' : '#eab308';
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 22px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbol, 0, 1);
    ctx.restore();
}

function drawTurretAndDocks(time, activeLockTarget) {
    const spec = TURRET_SPECS[cannon.level];
    const isElectricMode = electricPinFramesRemaining > 0;
    cannon.gearAngle += isElectricMode ? 0.06 : 0.025;

    drawLaserAimPreview(time);

    if (!laserAimMode) {
        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([7, 7]);
        ctx.lineDashOffset = -time * 0.05;
        ctx.moveTo(cannon.x + Math.cos(cannon.angle) * 68, cannon.y + Math.sin(cannon.angle) * 68);
        const aimLen = activeLockTarget ? Math.hypot(activeLockTarget.x - cannon.x, activeLockTarget.y - cannon.y) : 280;
        ctx.lineTo(cannon.x + Math.cos(cannon.angle) * aimLen, cannon.y + Math.sin(cannon.angle) * aimLen);
        ctx.strokeStyle = isElectricMode ? '#00f2fe' : (activeLockTarget ? '#ef4444' : spec.color);
        ctx.globalAlpha = 0.65;
        ctx.lineWidth = isElectricMode ? 3 : 2.2;
        ctx.stroke();
        ctx.restore();
    }

    if (activeLockTarget) {
        ctx.save();
        ctx.translate(activeLockTarget.x, activeLockTarget.y);
        ctx.rotate(time * (isElectricMode ? 0.008 : 0.004));
        ctx.strokeStyle = isElectricMode ? '#00f2fe' : '#ef4444';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.arc(0, 0, 34, 0, Math.PI * 2);
        ctx.moveTo(-46, 0); ctx.lineTo(-22, 0);
        ctx.moveTo(22, 0); ctx.lineTo(46, 0);
        ctx.moveTo(0, -46); ctx.lineTo(0, -22);
        ctx.moveTo(0, 22); ctx.lineTo(0, 46);
        ctx.stroke();

        if (isElectricMode) {
            ctx.rotate(-time * 0.008);
            const secLeft = Math.ceil(electricPinFramesRemaining / 60);
            ctx.fillStyle = '#fef08a';
            ctx.font = '800 11px Orbitron, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`⚡ GHIM TÂM (${secLeft}s)`, 0, 48);
        }
        ctx.restore();
    }

    // Hiển thị thanh Cảnh Giác Giáp Cá khi người chơi xả đạn liên thanh
    if (rapidFireArmorBuff > 0.03) {
        const buffPct = Math.round(rapidFireArmorBuff * 100);
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        roundRectPath(ctx, cannon.x - 115, canvas.height - 122, 230, 22, 6);
        ctx.fill();
        ctx.strokeStyle = buffPct > 28 ? '#ef4444' : '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = buffPct > 28 ? '#fca5a5' : '#fde047';
        ctx.font = '800 10.5px Chakra Petch, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`🛡️ BẮN NHANH: GIÁP CÁ TĂNG +${buffPct}%`, cannon.x, canvas.height - 111);
        ctx.restore();
    }

    ctx.save();
    const dockW = 216;
    const dockH = 58;
    ctx.fillStyle = '#0f172a';
    roundRectPath(ctx, cannon.x - dockW / 2, canvas.height - dockH, dockW, dockH + 10, 22);
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = isElectricMode ? '#00f2fe' : '#eab308';
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(cannon.x, cannon.y);
    ctx.rotate(cannon.angle);
    ctx.translate(-cannon.recoil, 0);

    const bLen = spec.barrelLen;
    const bCaliber = spec.caliber;

    if (cannon.muzzleFlash > 0.05) {
        ctx.save();
        ctx.translate(bLen + 6, 0);
        ctx.fillStyle = isElectricMode ? '#00f2fe' : spec.color;
        ctx.globalAlpha = cannon.muzzleFlash * 0.85;
        const flashR = 26 * cannon.muzzleFlash;
        ctx.beginPath();
        ctx.arc(0, 0, flashR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    if (cannon.level >= 3) {
        ctx.fillStyle = cannon.level === 5 ? '#991b1b' : spec.secondary;
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.5;
        for (const side of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(12, side * (bCaliber * 0.45));
            ctx.lineTo(28, side * (bCaliber * 0.92));
            ctx.lineTo(bLen - 10, side * (bCaliber * 0.62));
            ctx.lineTo(bLen - 6, side * (bCaliber * 0.45));
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
    }

    ctx.fillStyle = cannon.level === 5 ? '#78350f' : '#334155';
    roundRectPath(ctx, 10, -bCaliber / 2, bLen, bCaliber, 6);
    ctx.fill();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = isElectricMode ? '#00f2fe' : spec.color;
    ctx.stroke();

    ctx.fillStyle = isElectricMode ? '#00f2fe' : spec.color;
    roundRectPath(ctx, 18, -bCaliber * 0.24, bLen - 12, bCaliber * 0.48, 3);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(22, -2, bLen - 18, 4);

    ctx.fillStyle = '#f59e0b';
    roundRectPath(ctx, 12, -bCaliber * 0.65, 24, bCaliber * 1.3, 6);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(cannon.x, cannon.y);

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(0, 0, 39, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = isElectricMode ? '#00f2fe' : '#facc15';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fillStyle = '#091326';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = isElectricMode ? '#fef08a' : spec.color;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 13px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`-${spec.cost} XU`, 0, -3);

    ctx.fillStyle = isElectricMode ? '#00f2fe' : spec.color;
    ctx.font = '700 10px Chakra Petch, sans-serif';
    ctx.fillText(isElectricMode ? '⚡ ĐẠN ĐIỆN' : `PHÁO CẤP ${cannon.level}`, 0, 11);
    ctx.restore();

    drawTurretStepButton(cannon.minusBtn, '−');
    drawTurretStepButton(cannon.plusBtn, '+');

    drawAdjacentCoinBox(time);
    drawRightTacticalDock(time);
}

function drawAdjacentCoinBox(time) {
    const box = cannon.coinBox;
    ctx.save();

    const centerX = box.x + box.w / 2;
    const centerY = box.y + box.h / 2;
    const scale = 1 + coinBoxPulse * 0.08;
    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);
    ctx.translate(-centerX, -centerY);

    ctx.fillStyle = '#0f172a';
    roundRectPath(ctx, box.x, box.y, box.w, box.h, 14);
    ctx.fill();

    ctx.lineWidth = 2.5;
    ctx.strokeStyle = score < 80 ? '#f43f5e' : '#facc15';
    ctx.stroke();

    ctx.fillStyle = '#030712';
    roundRectPath(ctx, box.x + 6, box.y + 6, box.w - 12, box.h - 12, 10);
    ctx.fill();

    drawSpinningCoin(box.coinTargetX, box.coinTargetY, 16, time * 0.005);

    ctx.fillStyle = '#34d399';
    ctx.font = '700 9.5px Chakra Petch, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('VÍ XU ĐỒNG BỘ SẢNH', box.x + 52, box.y + 10);

    ctx.fillStyle = score < 80 ? '#fb7185' : '#ffd700';
    ctx.font = '900 22px Orbitron, monospace';
    ctx.textBaseline = 'bottom';
    ctx.fillText(formattedScore, box.x + 52, box.y + box.h - 9);
    ctx.restore();

    const rb = cannon.rechargeBtn;
    ctx.save();
    ctx.fillStyle = (score < 200 || rb.hover) ? '#059669' : '#0f172a';
    roundRectPath(ctx, rb.x, rb.y, rb.w, rb.h, 8);
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = score < 200 ? '#6ee7b7' : '#38bdf8';
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 11px Chakra Petch, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎁 +NẠP 1.000 XU MIỄN PHÍ', rb.x + rb.w / 2, rb.y + rb.h / 2 + 1);
    ctx.restore();
}

function drawSkillButton(btn, skillId, now) {
    const cfg = SKILLS_CONFIG[skillId];
    const elapsed = now - cfg.lastUsed;
    const onCooldown = elapsed < cfg.cooldown;
    const cdRatio = onCooldown ? Math.max(0, 1 - elapsed / cfg.cooldown) : 0;
    const isLaserWaiting = (skillId === 'laser' && laserAimMode);
    const isElectricActive = (skillId === 'electric' && electricPinFramesRemaining > 0);

    ctx.save();
    ctx.fillStyle = isLaserWaiting ? '#831843' : (isElectricActive ? '#713f12' : (btn.hover ? '#1e293b' : '#090f1d'));
    roundRectPath(ctx, btn.x, btn.y, btn.w, btn.h, 10);
    ctx.fill();

    if (onCooldown && !isElectricActive) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
        roundRectPath(ctx, btn.x, btn.y + btn.h * (1 - cdRatio), btn.w, btn.h * cdRatio, 8);
        ctx.fill();
    }

    ctx.lineWidth = (isLaserWaiting || isElectricActive) ? 2.5 : 1.6;
    ctx.strokeStyle = (onCooldown && !isElectricActive) ? '#475569' : cfg.color;
    roundRectPath(ctx, btn.x, btn.y, btn.w, btn.h, 10);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 12px Chakra Petch, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${cfg.icon} [${cfg.key}]`, btn.x + btn.w / 2, btn.y + 16);

    ctx.fillStyle = cfg.color;
    ctx.font = '800 9.5px Chakra Petch, sans-serif';
    ctx.fillText(isLaserWaiting ? 'ĐANG NGẮM' : cfg.name, btn.x + btn.w / 2, btn.y + 31);

    ctx.fillStyle = isElectricActive ? '#4ade80' : (onCooldown ? '#94a3b8' : '#fef08a');
    ctx.font = '900 10px Orbitron, sans-serif';
    if (isElectricActive) {
        ctx.fillText(`${Math.ceil(electricPinFramesRemaining / 60)}s`, btn.x + btn.w / 2, btn.y + 45);
    } else if (onCooldown) {
        ctx.fillText(`${((cfg.cooldown - elapsed) / 1000).toFixed(0)}s`, btn.x + btn.w / 2, btn.y + 45);
    } else {
        ctx.fillText(`-${cfg.cost}`, btn.x + btn.w / 2, btn.y + 45);
    }

    ctx.restore();
}

function drawRightTacticalDock(now) {
    drawSkillButton(cannon.skillBtns.freeze, 'freeze', now);
    drawSkillButton(cannon.skillBtns.laser, 'laser', now);
    drawSkillButton(cannon.skillBtns.electric, 'electric', now);

    const ab = cannon.autoBtn;
    ctx.save();
    ctx.fillStyle = autoFire ? '#059669' : (ab.hover ? '#1e293b' : '#0f172a');
    roundRectPath(ctx, ab.x, ab.y, ab.w, ab.h, 8);
    ctx.fill();
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = autoFire ? '#34d399' : '#38bdf8';
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 11px Chakra Petch, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(autoFire ? '⚡ TỰ BẮN: BẬT' : '⚡ TỰ BẮN: TẮT', ab.x + ab.w / 2, ab.y + ab.h / 2 + 1);
    ctx.restore();

    const lb = cannon.lockBtn;
    ctx.save();
    ctx.fillStyle = lockBoss ? '#be123c' : (lb.hover ? '#1e293b' : '#0f172a');
    roundRectPath(ctx, lb.x, lb.y, lb.w, lb.h, 8);
    ctx.fill();
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = lockBoss ? '#fda4af' : '#f59e0b';
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 11px Chakra Petch, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(lockBoss ? '🎯 KHÓA BOSS: BẬT' : '🎯 KHÓA BOSS', lb.x + lb.w / 2, lb.y + lb.h / 2 + 1);
    ctx.restore();

    const sb = cannon.summonBtn;
    ctx.save();
    ctx.fillStyle = sb.hover ? '#f43f5e' : '#e11d48';
    roundRectPath(ctx, sb.x, sb.y, sb.w, sb.h, 8);
    ctx.fill();
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = '#fef08a';
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 11px Chakra Petch, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐉 TRIỆU HỒI BOSS NGAY', sb.x + sb.w / 2, sb.y + sb.h / 2 + 1);
    ctx.restore();
}

// ==========================================
// 11. VÒNG LẶP CHÍNH 60 FPS (GAME LOOP)
// ==========================================
function gameLoop(time) {
    frameCount++;
    if (time - lastFpsUpdate >= 500) {
        const currentFps = Math.min(60, Math.round((frameCount * 1000) / (time - lastFpsUpdate)));
        fpsCounterEl.textContent = currentFps;
        frameCount = 0;
        lastFpsUpdate = time;
    }

    if (freezeFramesRemaining > 0) freezeFramesRemaining--;
    if (electricPinFramesRemaining > 0) electricPinFramesRemaining--;

    // Giảm dần buff giáp khi ngừng bắn hoặc bắn chậm lại
    if (rapidFireArmorBuff > 0) {
        rapidFireArmorBuff = Math.max(0, rapidFireArmorBuff - 0.0018);
    }

    ctx.save();
    if (screenShake > 0.5) {
        const dx = (Math.random() - 0.5) * screenShake;
        const dy = (Math.random() - 0.5) * screenShake;
        ctx.translate(dx, dy);
        screenShake *= 0.85;
    } else {
        screenShake = 0;
    }

    drawOceanBackground(time);

    let activeLockTarget = null;
    if (electricPinFramesRemaining > 0) {
        if (!pinnedElectricTarget || pinnedElectricTarget.isDead || !fishes.includes(pinnedElectricTarget) ||
            pinnedElectricTarget.x < 0 || pinnedElectricTarget.x > canvas.width) {
            pinnedElectricTarget = getLockedTarget();
        }
        activeLockTarget = pinnedElectricTarget;
    } else if (lockBoss) {
        activeLockTarget = getLockedTarget();
    }

    if (activeLockTarget && !laserAimMode) {
        cannon.angle = clampTurretAngle(Math.atan2(activeLockTarget.y - cannon.y, activeLockTarget.x - cannon.x));
    }

    if (!laserAimMode && (isMouseDown || autoFire || (electricPinFramesRemaining > 0 && activeLockTarget) || (lockBoss && activeLockTarget))) {
        tryShoot(time);
    }

    cannon.recoil *= 0.82;
    cannon.muzzleFlash *= 0.78;
    coinBoxPulse *= 0.85;

    for (let i = fishes.length - 1; i >= 0; i--) {
        const f = fishes[i];
        if (f.stunFrames > 0) f.stunFrames--;
        if (f.frozenFrames > 0) f.frozenFrames--;
        const freezeFactor = f.frozenFrames > 0 ? 0.08 : 1.0;
        const stunFactor = f.stunFrames > 0 ? 0.25 : 1.0;
        const bossEnrageBoost = (f.tier === 'boss' && f.hp < f.maxHp * 0.4) ? 1.35 : 1.0;

        f.x += f.speed * freezeFactor * stunFactor * bossEnrageBoost * f.dir;
        f.y = f.baseY + Math.sin(time * f.waveFreq + f.waveOffset) * f.waveAmp;
        if (f.hitFlash > 0) f.hitFlash--;

        drawCreature(f, time);

        const offMargin = f.size * 2.6;
        if (f.tier === 'boss') {
            if (f.dir === 1 && f.x > canvas.width + offMargin * 0.6) {
                if (f.turnsRemaining > 0) {
                    f.dir = -1;
                    f.turnsRemaining--;
                } else {
                    addFloatingText(canvas.width - 180, f.y, `💨 ${f.name} ĐÃ LẶN TRỐN MẤT!`, '#f43f5e', 1.05);
                    fishes.splice(i, 1);
                }
            } else if (f.dir === -1 && f.x < -offMargin * 0.6) {
                if (f.turnsRemaining > 0) {
                    f.dir = 1;
                    f.turnsRemaining--;
                } else {
                    addFloatingText(180, f.y, `💨 ${f.name} ĐÃ LẶN TRỐN MẤT!`, '#f43f5e', 1.05);
                    fishes.splice(i, 1);
                }
            }
        } else {
            if ((f.dir === 1 && f.x > canvas.width + offMargin) || (f.dir === -1 && f.x < -offMargin)) {
                fishes.splice(i, 1);
            }
        }
    }

    drawAndUpdateLasers();
    drawAndUpdateLightningArcs();
    if (typeof updateAndDrawActiveDrills === 'function') {
        updateAndDrawActiveDrills();
    }
    if (typeof updateAndDrawTimeBombs === 'function') {
        updateAndDrawTimeBombs();
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];

        if (b.isElectric && b.lockedFish && !b.lockedFish.isDead && fishes.includes(b.lockedFish)) {
            const ang = Math.atan2(b.lockedFish.y - b.y, b.lockedFish.x - b.x);
            b.vx = Math.cos(ang) * 25;
            b.vy = Math.sin(ang) * 25;
        } else if (!b.isElectric) {
            b.trail.push({ x: b.x, y: b.y });
            if (b.trail.length > (b.level === 5 ? 6 : 4)) b.trail.shift();
        }

        b.x += b.vx;
        b.y += b.vy;

        let bounced = false;
        if (b.x <= b.radius) {
            b.x = b.radius;
            b.vx = Math.abs(b.vx);
            bounced = true;
        } else if (b.x >= canvas.width - b.radius) {
            b.x = canvas.width - b.radius;
            b.vx = -Math.abs(b.vx);
            bounced = true;
        }

        if (b.y <= b.radius) {
            b.y = b.radius;
            b.vy = Math.abs(b.vy);
            bounced = true;
        } else if (b.y >= canvas.height - b.radius) {
            b.y = canvas.height - b.radius;
            b.vy = -Math.abs(b.vy);
            bounced = true;
        }

        if (bounced) {
            b.bounces++;
            sound.playBounce();
            if (b.bounces > b.maxBounces) {
                bullets.splice(i, 1);
                continue;
            }
        }

        drawBullet(b);

        let hitFish = false;

        if (b.isElectric && b.lockedFish && !b.lockedFish.isDead && fishes.includes(b.lockedFish)) {
            const f = b.lockedFish;
            const dx = b.x - f.x;
            const dy = b.y - f.y;
            const hitR = f.size * 0.85 + b.radius;
            if (dx * dx + dy * dy < hitR * hitR) {
                hitFish = true;
                triggerElectricShockHit(f, b.power);
            }
        } else {
            for (let j = fishes.length - 1; j >= 0; j--) {
                const f = fishes[j];
                if (f.isDead) continue;
                const dx = b.x - f.x;
                const dy = b.y - f.y;
                const hitR = f.size * 0.88 + b.radius;
                if (dx * dx + dy * dy < hitR * hitR) {
                    hitFish = true;
                    if (b.isElectric) {
                        triggerElectricShockHit(f, b.power);
                    } else {
                        sound.playNetHit(b.level);
                        nets.push({
                            x: b.x,
                            y: b.y,
                            radius: 16,
                            maxRadius: b.netRadius,
                            color: b.color,
                            level: b.level,
                            alpha: 1,
                            rotation: Math.random() * Math.PI
                        });

                        for (let k = fishes.length - 1; k >= 0; k--) {
                            const target = fishes[k];
                            if (target.isDead) continue;
                            const tdx = b.x - target.x;
                            const tdy = b.y - target.y;
                            const aoeR = b.netRadius + target.size * 0.55;
                            if (tdx * tdx + tdy * tdy <= aoeR * aoeR) {
                                // Tính tổng giáp = Giáp gốc của cá + Buff giáp do bắn nhanh (tối đa giảm 82% sát thương)
                                const effectiveArmor = Math.min(0.82, (target.armor || 0) + rapidFireArmorBuff);
                                const isIced = target.frozenFrames > 0;
                                const armorFactor = isIced
                                    ? (1 - rapidFireArmorBuff * 0.5)
                                    : (1 - effectiveArmor);

                                target.hp -= b.power * armorFactor * (isIced ? 1.25 : 1.0);
                                target.hitFlash = 5;
                            }
                        }
                    }
                    break;
                }
            }
        }

        if (hitFish) {
            bullets.splice(i, 1);
        }
    }

    // Quét tất cả cá bị tiêu diệt (bởi Đạn, Laze, Sét, Mũi Khoan hoặc Bom Hẹn Giờ 3 Giây)
    sweepDeadFishes();

    for (let i = nets.length - 1; i >= 0; i--) {
        const n = nets[i];
        n.radius += (n.maxRadius - n.radius) * 0.25;
        n.alpha -= 0.048;
        n.rotation += 0.018;
        drawNet(n);
        if (n.alpha <= 0) nets.splice(i, 1);
    }

    for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sw.radius += (sw.maxRadius - sw.radius) * 0.18;
        sw.alpha -= 0.045;
        if (sw.alpha <= 0) {
            shockwaves.splice(i, 1);
            continue;
        }
        ctx.save();
        ctx.globalAlpha = sw.alpha;
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = sw.lineWidth;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    if (particles.length > 0) {
        ctx.save();
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= p.decay;

            if (p.alpha <= 0) {
                particles.splice(i, 1);
                continue;
            }

            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawTurretAndDocks(time, activeLockTarget);

    for (let i = flyingCoins.length - 1; i >= 0; i--) {
        const fc = flyingCoins[i];
        if (fc.delay > 0) {
            fc.delay--;
            continue;
        }

        fc.t += fc.speed;
        const t = Math.min(1, fc.t);
        const invT = 1 - t;

        fc.x = invT * invT * fc.startX + 2 * invT * t * fc.cpX + t * t * cannon.coinBox.coinTargetX;
        fc.y = invT * invT * fc.startY + 2 * invT * t * fc.cpY + t * t * cannon.coinBox.coinTargetY;

        drawSpinningCoin(fc.x, fc.y, 11, time * 0.018 + fc.spinPhase);

        if (fc.t >= 1) {
            pendingScore = Math.max(0, pendingScore - fc.value);
            saveWalletToStorage(score + fc.value, true);
            coinBoxPulse = 1.0;
            sound.playCoinCollect();
            flyingCoins.splice(i, 1);
        }
    }

    for (let i = jackpotBadges.length - 1; i >= 0; i--) {
        const jb = jackpotBadges[i];
        jb.life--;
        jb.scale = Math.min(1.0, jb.scale + 0.08);
        jb.rotation += 0.025;

        ctx.save();
        ctx.translate(jb.x, jb.y);
        ctx.scale(jb.scale, jb.scale);
        ctx.globalAlpha = Math.min(1, jb.life / 25);

        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.arc(0, 0, 58, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#fef08a';
        ctx.stroke();

        ctx.fillStyle = '#fef08a';
        ctx.font = '800 12px Chakra Petch, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🎉 NỔ HŨ ĐẠI BOSS 🎉', 0, -20);

        ctx.fillStyle = '#ffffff';
        ctx.font = '700 11px Chakra Petch, sans-serif';
        ctx.fillText(jb.bossName, 0, -4);

        ctx.fillStyle = '#ffd700';
        ctx.font = '900 22px Orbitron, sans-serif';
        ctx.fillText(jb.rewardText, 0, 22);
        ctx.restore();

        if (jb.life <= 0) jackpotBadges.splice(i, 1);
    }

    drawJackpotShow(time);

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.y -= 1.3;
        ft.alpha -= 0.026;

        if (ft.alpha <= 0) {
            floatingTexts.splice(i, 1);
            continue;
        }

        ctx.save();
        ctx.globalAlpha = ft.alpha;
        ctx.font = `900 ${Math.round(18 * ft.scale)}px Orbitron, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
    }

    if (bossWarningBanner.alpha > 0.01) {
        bossWarningBanner.alpha -= 0.008;
        ctx.save();
        ctx.globalAlpha = Math.min(1, bossWarningBanner.alpha * 1.4);
        const bw = Math.min(620, canvas.width - 30);
        const bx = (canvas.width - bw) / 2;
        const by = 58;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        roundRectPath(ctx, bx, by, bw, 50, 12);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = bossWarningBanner.color;
        ctx.stroke();

        ctx.fillStyle = '#fef08a';
        ctx.font = '800 14px Chakra Petch, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(bossWarningBanner.text, canvas.width / 2, by + 20);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '700 11px Chakra Petch, sans-serif';
        ctx.fillText(bossWarningBanner.subtext, canvas.width / 2, by + 38);
        ctx.restore();
    }

    ctx.restore();
    requestAnimationFrame(gameLoop);
}

window.onload = function () {
    score = loadWalletFromStorage();
    updateFormattedScore();
    updateLayout();
    initFishSpawners();
    requestAnimationFrame(gameLoop);
};