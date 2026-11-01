/**
 * MODULE 1: HỆ THỐNG NHÂN VẬT CÁ, 4 ĐẠI BOSS & 3 CÁ ĐẶC BIỆT (fishes.js)
 * - Cá Bom Hạt Nhân (nuke_fish): Hiếm (weight 2.5), máu trâu (1250 HP), hiện vòng tròn đếm ngược 3 giây
 *   với bán kính nổ 520px và sát thương cực đại 1800 HP.
 * - Cua Máy Khoan & Cá Sét: Tăng máu trâu hơn (680 HP & 620 HP), giảm sát thương kỹ năng.
 */

// Danh sách quản lý Mũi Khoan và Bom Hẹn Giờ 3 Giây đang hoạt động
const activeDrills = [];
const activeTimeBombs = [];

// 1. DANH SÁCH CÁ THƯỜNG, CÁ LỚN & 3 CÁ ĐẶC BIỆT
const FISH_CATALOG = [
    {
        id: 'clown',
        name: 'Cá Hề Nemo',
        tier: 'small',
        size: 19,
        speed: 2.6,
        hp: 25,
        armor: 0.05,
        reward: 15,
        exp: 8,
        primary: '#ff7b00',
        secondary: '#ffffff',
        accent: '#1e293b',
        weight: 19
    },
    {
        id: 'angel',
        name: 'Cá Thần Tiên Neon',
        tier: 'small',
        size: 26,
        speed: 2.2,
        hp: 55,
        armor: 0.08,
        reward: 30,
        exp: 14,
        primary: '#00f2fe',
        secondary: '#3b82f6',
        accent: '#e0f2fe',
        weight: 15
    },
    {
        id: 'puffer',
        name: 'Cá Nóc Gai Đỏ',
        tier: 'medium',
        size: 34,
        speed: 1.75,
        hp: 110,
        armor: 0.12,
        reward: 65,
        exp: 22,
        primary: '#f43f5e',
        secondary: '#fb7185',
        accent: '#fef08a',
        weight: 11
    },
    // --- 3 LOÀI CÁ ĐẶC BIỆT (ĐÃ TĂNG MÁU & CÂN CHỈNH SÁT THƯƠNG) ---
    {
        id: 'drill_crab',
        name: 'Cua Máy Khoan',
        tier: 'special',
        size: 48,
        speed: 1.35,
        hp: 680,          // Tăng máu trâu hơn (300 -> 680)
        armor: 0.22,
        reward: 240,
        exp: 80,
        primary: '#f97316',
        secondary: '#38bdf8',
        accent: '#fef08a',
        weight: 6.5
    },
    {
        id: 'lightning_fish',
        name: 'Cá Sét Cao Áp',
        tier: 'special',
        size: 48,
        speed: 1.5,
        hp: 620,          // Tăng máu trâu hơn (270 -> 620)
        armor: 0.20,
        reward: 220,
        exp: 75,
        primary: '#00f2fe',
        secondary: '#facc15',
        accent: '#ffffff',
        weight: 7
    },
    {
        id: 'nuke_fish',
        name: 'Cá Bom Hạt Nhân',
        tier: 'special',
        size: 56,
        speed: 1.05,
        hp: 1250,         // Máu siêu trâu (340 -> 1250)
        armor: 0.30,      // Giáp dày
        reward: 450,
        exp: 130,
        primary: '#ef4444',
        secondary: '#1e293b',
        accent: '#facc15',
        weight: 2.5       // Giảm tần suất xuất hiện thành cá hiếm!
    },
    // --- 5 LOÀI CÁ LỚN ---
    {
        id: 'manta_gold',
        name: 'Cá Đuối Điện Hoàng Kim',
        tier: 'large',
        size: 54,
        speed: 1.5,
        hp: 220,
        armor: 0.15,
        reward: 120,
        exp: 38,
        primary: '#f59e0b',
        secondary: '#b45309',
        accent: '#fef08a',
        weight: 11
    },
    {
        id: 'swordfish',
        name: 'Cá Kiếm Neon',
        tier: 'large',
        size: 58,
        speed: 2.05,
        hp: 270,
        armor: 0.18,
        reward: 150,
        exp: 45,
        primary: '#06b6d4',
        secondary: '#1d4ed8',
        accent: '#67e8f9',
        weight: 10
    },
    {
        id: 'hammerhead',
        name: 'Cá Mập Đầu Búa',
        tier: 'large',
        size: 64,
        speed: 1.4,
        hp: 340,
        armor: 0.2,
        reward: 190,
        exp: 55,
        primary: '#6366f1',
        secondary: '#312e81',
        accent: '#a5b4fc',
        weight: 9
    },
    {
        id: 'jelly_emperor',
        name: 'Sứa Hoàng Đế Phát Quang',
        tier: 'large',
        size: 56,
        speed: 1.15,
        hp: 390,
        armor: 0.22,
        reward: 220,
        exp: 60,
        primary: '#ec4899',
        secondary: '#831843',
        accent: '#fbcfe8',
        weight: 8
    },
    {
        id: 'jade_turtle',
        name: 'Rùa Giáp Ngọc',
        tier: 'large',
        size: 62,
        speed: 1.1,
        hp: 480,
        armor: 0.28,
        reward: 260,
        exp: 70,
        primary: '#10b981',
        secondary: '#064e3b',
        accent: '#6ee7b7',
        weight: 8
    }
];

// 2. DANH SÁCH 4 ĐẠI BOSS
const BOSS_CATALOG = [
    {
        id: 'boss_kraken',
        name: 'KRAKEN VỰC THẲM',
        tier: 'boss',
        size: 88,
        speed: 0.85,
        hp: 1850,
        armor: 0.25,
        reward: 4500,
        exp: 200,
        primary: '#d946ef',
        secondary: '#581c87',
        accent: '#f0abfc'
    },
    {
        id: 'boss_megalodon',
        name: 'CÁ MẬP BẠO CHÚA MEGALODON',
        tier: 'boss',
        size: 98,
        speed: 0.98,
        hp: 2700,
        armor: 0.28,
        reward: 6800,
        exp: 280,
        primary: '#ef4444',
        secondary: '#7f1d1d',
        accent: '#fca5a5'
    },
    {
        id: 'boss_leviathan_turtle',
        name: 'KIM QUY THẦN THÚ',
        tier: 'boss',
        size: 96,
        speed: 0.75,
        hp: 3800,
        armor: 0.35,
        reward: 10000,
        exp: 360,
        primary: '#f59e0b',
        secondary: '#78350f',
        accent: '#fde047'
    },
    {
        id: 'boss_sea_dragon',
        name: 'HẢI VƯƠNG RỒNG VÀNG',
        tier: 'boss',
        size: 105,
        speed: 1.05,
        hp: 5400,
        armor: 0.32,
        reward: 18000,
        exp: 520,
        primary: '#ffd700',
        secondary: '#991b1b',
        accent: '#fef9c3'
    }
];

// 3. CÁC HÀM SINH CÁ & ĐẠI BOSS
function countActiveBosses() {
    let count = 0;
    for (let i = 0; i < fishes.length; i++) {
        if (fishes[i].tier === 'boss') count++;
    }
    return count;
}

function spawnRegularOrLargeFish(spreadAcrossScreen = false) {
    // Cá đang đóng băng không chiếm chỗ -> cá mới vẫn bơi vào bình thường khi đóng băng
    let liveFish = 0;
    for (let i = 0; i < fishes.length; i++) if (!(fishes[i].frozenFrames > 0)) liveFish++;
    if (document.hidden) return;
    if (liveFish >= (window.arcadeIsMobileGame ? 18 : 26) ||
        fishes.length >= (window.arcadeIsMobileGame ? 30 : 40)) return;

    const totalWeight = FISH_CATALOG.reduce((acc, f) => acc + f.weight, 0);
    let rand = Math.random() * totalWeight;
    let chosen = FISH_CATALOG[0];
    for (let i = 0; i < FISH_CATALOG.length; i++) {
        const item = FISH_CATALOG[i];
        if (rand < item.weight) {
            chosen = item;
            break;
        }
        rand -= item.weight;
    }

    const fromLeft = Math.random() < 0.5;
    const margin = chosen.size * 2.2;
    const yPos = 78 + Math.random() * (canvas.height - 240);
    const difficultyScale = 1 + (oceanLevel - 1) * 0.18;
    const scaledReward = Math.round(chosen.reward * rewardMultiplier);

    fishes.push({
        type: chosen.id,
        name: chosen.name,
        tier: chosen.tier,
        x: spreadAcrossScreen ? (80 + Math.random() * (canvas.width - 160)) : (fromLeft ? -margin : canvas.width + margin),
        y: yPos,
        baseY: yPos,
        dir: fromLeft ? 1 : -1,
        size: chosen.size,
        speed: chosen.speed * (0.92 + Math.random() * 0.25),
        hp: Math.round(chosen.hp * difficultyScale),
        maxHp: Math.round(chosen.hp * difficultyScale),
        armor: chosen.armor || 0.1,
        reward: scaledReward,
        rewardFormatted: scaledReward.toLocaleString('vi-VN'),
        specialTag: chosen.tier === 'special' ? `★ ${chosen.name.toUpperCase()} ★` : '',
        exp: chosen.exp,
        primary: chosen.primary,
        secondary: chosen.secondary,
        accent: chosen.accent,
        waveAmp: chosen.tier === 'large' || chosen.tier === 'special' ? (10 + Math.random() * 14) : (14 + Math.random() * 18),
        waveFreq: 0.0018 + Math.random() * 0.0014,
        waveOffset: Math.random() * Math.PI * 2,
        hitFlash: 0,
        stunFrames: 0,
        frozenFrames: 0,
        turnsRemaining: 0,
        isDead: false
    });
}

function spawnBoss(forceSpecificIndex = null) {
    if (countActiveBosses() >= 4) {
        addFloatingText(canvas.width / 2, 120, 'ĐÃ CÓ TỐI ĐA 4 ĐẠI BOSS TRÊN MÀN HÌNH!', '#fbbf24', 1.0);
        return;
    }

    const chosen = forceSpecificIndex !== null
        ? BOSS_CATALOG[forceSpecificIndex % BOSS_CATALOG.length]
        : BOSS_CATALOG[Math.floor(Math.random() * BOSS_CATALOG.length)];

    const fromLeft = Math.random() < 0.5;
    const margin = chosen.size * 2.1;
    const yPos = 130 + Math.random() * Math.max(120, canvas.height - 340);
    const difficultyScale = 1 + (oceanLevel - 1) * 0.22;
    const scaledHp = Math.round(chosen.hp * difficultyScale);
    const scaledReward = Math.round(chosen.reward * rewardMultiplier);
    const formattedReward = scaledReward.toLocaleString('vi-VN');

    fishes.push({
        type: chosen.id,
        name: chosen.name,
        tier: 'boss',
        x: fromLeft ? -margin : canvas.width + margin,
        y: yPos,
        baseY: yPos,
        dir: fromLeft ? 1 : -1,
        size: chosen.size,
        speed: chosen.speed,
        hp: scaledHp,
        maxHp: scaledHp,
        armor: chosen.armor || 0.3,
        reward: scaledReward,
        rewardFormatted: formattedReward,
        bossTagText: `👑 ${chosen.name} (+${formattedReward} XU)`,
        exp: chosen.exp,
        primary: chosen.primary,
        secondary: chosen.secondary,
        accent: chosen.accent,
        waveAmp: 16 + Math.random() * 14,
        waveFreq: 0.0014,
        waveOffset: Math.random() * Math.PI * 2,
        hitFlash: 0,
        stunFrames: 0,
        frozenFrames: 0,
        turnsRemaining: 2,
        isDead: false
    });

    sound.playBossSpawn();
    bossWarningBanner = {
        alpha: 1.0,
        text: `⚠️ ĐẠI BOSS XUẤT HIỆN: ${chosen.name} ⚠️`,
        subtext: `GIÁP CỨNG • THƯỞNG NỔ HŨ: +${formattedReward} XU (SĂN CÁ BOM HẸN GIỜ ĐỂ NỔ SÁT THƯƠNG CỰC ĐẠI!)`,
        color: chosen.primary
    };
}

function initFishSpawners() {
    for (let i = 0; i < (window.arcadeIsMobileGame ? 14 : 18); i++) {
        spawnRegularOrLargeFish(true);
    }
    setTimeout(() => {
        spawnBoss(0);
        if (fishes.length > 0) fishes[fishes.length - 1].x = canvas.width * 0.25;
        spawnBoss(3);
        if (fishes.length > 0) fishes[fishes.length - 1].x = canvas.width * 0.72;
    }, 150);

    setInterval(() => spawnRegularOrLargeFish(false), window.arcadeIsMobileGame ? 900 : 600);
    setInterval(() => {
        if (!document.hidden && countActiveBosses() < 3) {
            spawnBoss();
        }
    }, 11000);
}

// =========================================================
// 4. CƠ CHẾ KÍCH HOẠT CỦA 3 LOÀI CÁ ĐẶC BIỆT (ANTI-LAG)
// =========================================================
function triggerSpecialFishMechanic(fish) {
    if (fish.type === 'drill_crab') {
        // 1. CUA MÁY KHOAN: Phóng mũi khoan siêu tốc nảy tường 4 giây (Đã giảm sát thương xuống 18/tick)
        sound.playLaserBlast();
        screenShake = Math.max(screenShake, 10);

        const bossTarget = getLockedTarget();
        const aimAngle = bossTarget
            ? Math.atan2(bossTarget.y - fish.y, bossTarget.x - fish.x)
            : Math.atan2(canvas.height / 2 - fish.y, canvas.width / 2 - fish.x);

        const speed = 21;
        activeDrills.push({
            x: fish.x,
            y: fish.y,
            vx: Math.cos(aimAngle) * speed,
            vy: Math.sin(aimAngle) * speed,
            angle: aimAngle,
            radius: 22,
            life: 240,
            trail: []
        });

        addFloatingText(fish.x, fish.y - 25, '🦀 PHÓNG MŨI KHOAN CƠ KHÍ!', '#38bdf8', 1.15);

    } else if (fish.type === 'lightning_fish') {
        // 2. CÁ SÉT CAO ÁP: Giật sét dây chuyền 8 mục tiêu (Đã giảm sát thương từ 340 xuống 150)
        sound.playElectricZap();
        screenShake = Math.max(screenShake, 11);

        shockwaves.push({
            x: fish.x,
            y: fish.y,
            radius: 15,
            maxRadius: 300,
            color: '#00f2fe',
            alpha: 0.95,
            lineWidth: 5
        });

        let struckCount = 0;
        const maxChainDistSq = 400 * 400;
        let prevX = fish.x;
        let prevY = fish.y;

        for (let i = fishes.length - 1; i >= 0; i--) {
            const target = fishes[i];
            if (target.isDead || target === fish) continue;

            const dx = target.x - fish.x;
            const dy = target.y - fish.y;
            if (dx * dx + dy * dy <= maxChainDistSq) {
                target.hp -= 150; // Đã giảm sát thương từ 340 -> 150
                target.hitFlash = 8;
                target.stunFrames = 75;

                lightningArcs.push({
                    x1: prevX,
                    y1: prevY,
                    x2: target.x,
                    y2: target.y,
                    life: 16
                });

                prevX = target.x;
                prevY = target.y;
                struckCount++;
                if (struckCount >= 8) break;
            }
        }

        addFloatingText(fish.x, fish.y - 25, `⚡ SÉT LAN (${struckCount} MỤC TIÊU)!`, '#facc15', 1.15);

    } else if (fish.type === 'nuke_fish') {
        // 3. CÁ BOM HẠT NHÂN: Tạo Vòng Tròn Xác Định Vùng Nổ Khổng Lồ (520px) & Đếm Ngược 3 Giây!
        sound.playSwitchLevel();
        screenShake = Math.max(screenShake, 8);

        activeTimeBombs.push({
            x: Math.max(120, Math.min(canvas.width - 120, fish.x)),
            y: Math.max(120, Math.min(canvas.height - 150, fish.y)),
            radius: 520,       // Tăng phạm vi vùng nổ lên cực rộng (380 -> 520px)
            framesLeft: 180,   // 3 giây đếm ngược (180 frames ở 60 FPS)
            maxFrames: 180,
            damage: 1800,      // Tăng sát thương cực đại (650 -> 1800 HP)
            lastBeepSec: 4
        });

        addFloatingText(fish.x, fish.y - 35, '💣 ĐÃ KÍCH HOẠT BOM HẸN GIỜ (NỔ SAU 3 GIÂY)!', '#ef4444', 1.25);
    }
}

// Cập nhật & vẽ Vòng Tròn Bom Hẹn Giờ 3 Giây (Anti-Lag Vector)
function updateAndDrawTimeBombs() {
    if (activeTimeBombs.length === 0) return;

    for (let i = activeTimeBombs.length - 1; i >= 0; i--) {
        const b = activeTimeBombs[i];
        b.framesLeft--;

        const secLeft = Math.ceil(b.framesLeft / 60);
        if (secLeft < b.lastBeepSec && secLeft > 0) {
            b.lastBeepSec = secLeft;
            sound.playSwitchLevel(); // Tiếng bíp đếm ngược mỗi giây
        }

        const progress = 1 - b.framesLeft / b.maxFrames;

        ctx.save();
        ctx.translate(b.x, b.y);

        // 1. Nền vùng nổ cảnh báo nhấp nháy
        const pulseAlpha = 0.07 + Math.abs(Math.sin(b.framesLeft * 0.18)) * 0.08;
        ctx.fillStyle = `rgba(239, 68, 68, ${pulseAlpha})`;
        ctx.beginPath();
        ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
        ctx.fill();

        // 2. Vòng tròn ngoài xác định phạm vi nổ 520px
        ctx.strokeStyle = b.framesLeft % 16 < 8 ? '#ef4444' : '#facc15';
        ctx.lineWidth = 3.5;
        ctx.setLineDash([18, 12]);
        ctx.beginPath();
        ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
        ctx.stroke();

        // 3. Vòng radar thu hẹp dần về tâm theo thời gian đếm ngược
        ctx.setLineDash([]);
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.65)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, b.radius * (1 - progress), 0, Math.PI * 2);
        ctx.stroke();

        // 4. Tâm quả bom hẹn giờ & chữ đếm ngược 3.. 2.. 1..
        const coreScale = 1 + Math.sin(b.framesLeft * 0.35) * 0.14;
        ctx.scale(coreScale, coreScale);

        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(0, 0, 38, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ef4444';
        ctx.stroke();

        ctx.fillStyle = '#fef08a';
        ctx.font = '900 28px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(secLeft), 0, 2);

        ctx.restore();

        // Nhãn cảnh báo phía trên tâm bom
        ctx.save();
        ctx.font = '800 13px Chakra Petch, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fef08a';
        ctx.fillText(`💣 VÙNG NỔ HẠT NHÂN • PHÁT NỔ SAU ${secLeft} GIÂY!`, b.x, b.y - 52);
        ctx.restore();

        // KHI ĐẾM NGƯỢC VỀ 0 -> KÍCH NỔ ĐẠI HẠT NHÂN!
        if (b.framesLeft <= 0) {
            sound.playLaserBlast();
            screenShake = 30;

            const blastRadiusSq = b.radius * b.radius;

            shockwaves.push({
                x: b.x,
                y: b.y,
                radius: 25,
                maxRadius: b.radius,
                color: '#facc15',
                alpha: 1.0,
                lineWidth: 14
            });
            shockwaves.push({
                x: b.x,
                y: b.y,
                radius: 10,
                maxRadius: b.radius * 0.75,
                color: '#ef4444',
                alpha: 1.0,
                lineWidth: 9
            });

            for (let p = 0; p < 22; p++) {
                const ang = (p * Math.PI * 2) / 22;
                const spd = 5 + Math.random() * 8;
                addParticle(b.x, b.y, Math.cos(ang) * spd, Math.sin(ang) * spd, 4.5, p % 2 === 0 ? '#fef08a' : '#ef4444', 0.025);
            }

            let hitCount = 0;
            for (let k = fishes.length - 1; k >= 0; k--) {
                const target = fishes[k];
                if (target.isDead) continue;

                const dx = target.x - b.x;
                const dy = target.y - b.y;
                if (dx * dx + dy * dy <= blastRadiusSq) {
                    target.hp -= b.damage; // 1800 sát thương hủy diệt!
                    target.hitFlash = 14;
                    hitCount++;
                }
            }

            addFloatingText(b.x, b.y, `💥 ĐẠI NỔ HẠT NHÂN (-${b.damage} HP • ${hitCount} MỤC TIÊU)!`, '#fde047', 1.35);
            activeTimeBombs.splice(i, 1);
        }
    }
}

// Cập nhật & vẽ Mũi Khoan Siêu Tốc đang bay nảy tường trên màn hình
function updateAndDrawActiveDrills() {
    if (activeDrills.length === 0) return;

    for (let i = activeDrills.length - 1; i >= 0; i--) {
        const d = activeDrills[i];
        d.life--;

        d.trail.push({ x: d.x, y: d.y });
        if (d.trail.length > 6) d.trail.shift();

        d.x += d.vx;
        d.y += d.vy;

        let bounced = false;
        if (d.x <= d.radius) {
            d.x = d.radius;
            d.vx = Math.abs(d.vx);
            bounced = true;
        } else if (d.x >= canvas.width - d.radius) {
            d.x = canvas.width - d.radius;
            d.vx = -Math.abs(d.vx);
            bounced = true;
        }
        if (d.y <= d.radius) {
            d.y = d.radius;
            d.vy = Math.abs(d.vy);
            bounced = true;
        } else if (d.y >= canvas.height - d.radius) {
            d.y = canvas.height - d.radius;
            d.vy = -Math.abs(d.vy);
            bounced = true;
        }

        if (bounced) {
            d.angle = Math.atan2(d.vy, d.vx);
            sound.playBounce();
            screenShake = Math.max(screenShake, 3);
        }

        ctx.save();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let t = 0; t < d.trail.length; t++) {
            const pt = d.trail[t];
            if (t === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();

        ctx.translate(d.x, d.y);
        ctx.rotate(d.angle);

        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(-22, -9);
        ctx.lineTo(-42 - (d.life % 3) * 6, 0);
        ctx.lineTo(-22, 9);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#facc15';
        ctx.fillRect(-22, -11, 18, 22);

        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.moveTo(-4, -14);
        ctx.lineTo(32, 0);
        ctx.lineTo(-4, 14);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(10, 10);
        ctx.moveTo(10, -7);
        ctx.lineTo(18, 7);
        ctx.stroke();
        ctx.restore();

        // Đã giảm sát thương xuyên thấu của mũi khoan từ 38 xuống 18
        if (d.life % 3 === 0) {
            for (let k = fishes.length - 1; k >= 0; k--) {
                const f = fishes[k];
                if (f.isDead) continue;
                const dx = d.x - f.x;
                const dy = d.y - f.y;
                const hitR = f.size * 0.9 + d.radius;
                if (dx * dx + dy * dy <= hitR * hitR) {
                    f.hp -= 18;
                    f.hitFlash = 4;
                }
            }
        }

        // Hết 4 giây: Nổ nhẹ 90 sát thương (giảm từ 180)
        if (d.life <= 0) {
            shockwaves.push({
                x: d.x,
                y: d.y,
                radius: 12,
                maxRadius: 170,
                color: '#38bdf8',
                alpha: 0.95,
                lineWidth: 5
            });
            for (let k = fishes.length - 1; k >= 0; k--) {
                const f = fishes[k];
                if (f.isDead) continue;
                const dx = d.x - f.x;
                const dy = d.y - f.y;
                if (dx * dx + dy * dy <= 170 * 170) {
                    f.hp -= 90;
                    f.hitFlash = 7;
                }
            }
            activeDrills.splice(i, 1);
        }
    }
}

// =========================================================
// 5. HÀM VẼ ĐỒ HỌA VECTOR CHO TỪNG LOÀI CÁ (60 FPS ANTI-LAG)
// =========================================================
function drawCreature(f, time) {
    ctx.save();
    ctx.translate(f.x, f.y);

    const vy = Math.cos(time * f.waveFreq + f.waveOffset) * f.waveAmp * f.waveFreq * 14;
    const tilt = Math.atan2(vy, f.speed) * 0.32;
    if (f.dir === -1) ctx.scale(-1, 1);
    ctx.rotate(tilt);

    const s = f.size;
    const isFlashing = f.hitFlash > 0;
    const animTime = (f.frozenFrames > 0 || f.stunFrames > 0) ? time * 0.15 : time;
    const tailSwing = Math.sin(animTime * 0.014 * f.speed + f.waveOffset) * (s * 0.22);

    if (f.tier === 'boss') {
        const lowHpWarning = f.hp < f.maxHp * 0.35;
        ctx.fillStyle = lowHpWarning ? '#ef4444' : f.primary;
        ctx.globalAlpha = lowHpWarning ? 0.22 : 0.12;
        ctx.beginPath();
        ctx.arc(0, 0, s * 1.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    } else if (f.tier === 'special') {
        ctx.strokeStyle = f.accent;
        ctx.lineWidth = f.type === 'nuke_fish' ? 2.8 : 2;
        ctx.setLineDash([6, 5]);
        ctx.beginPath();
        ctx.arc(0, 0, s * 1.12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    if (f.type === 'drill_crab') {
        ctx.strokeStyle = isFlashing ? '#ffffff' : '#facc15';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        for (let side of [-1, 1]) {
            for (let leg = -1; leg <= 1; leg++) {
                const ly = side * s * 0.48;
                const lx = leg * s * 0.26;
                ctx.moveTo(lx, ly * 0.5);
                ctx.lineTo(lx - 6, ly + side * Math.sin(animTime * 0.02 + leg) * 5);
            }
        }
        ctx.stroke();

        ctx.fillStyle = isFlashing ? '#ffffff' : f.primary;
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.72, s * 0.58, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#fef08a';
        ctx.stroke();

        ctx.fillStyle = isFlashing ? '#ffffff' : '#e2e8f0';
        ctx.beginPath();
        ctx.moveTo(s * 0.5, -s * 0.28);
        ctx.lineTo(s * 1.28, 0);
        ctx.lineTo(s * 0.5, s * 0.28);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(s * 0.65, -s * 0.18);
        ctx.lineTo(s * 0.85, s * 0.18);
        ctx.moveTo(s * 0.9, -s * 0.1);
        ctx.lineTo(s * 1.05, s * 0.1);
        ctx.stroke();

    } else if (f.type === 'lightning_fish') {
        ctx.fillStyle = isFlashing ? '#ffffff' : '#facc15';
        ctx.beginPath();
        ctx.moveTo(-s * 0.75, 0);
        ctx.lineTo(-s * 1.38, -s * 0.52 + tailSwing);
        ctx.lineTo(-s * 1.15, 0);
        ctx.lineTo(-s * 1.38, s * 0.52 + tailSwing);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = isFlashing ? '#ffffff' : f.primary;
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.88, s * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#fef08a';
        ctx.stroke();

        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.moveTo(s * 0.35, -s * 0.18);
        ctx.lineTo(-s * 0.05, s * 0.02);
        ctx.lineTo(s * 0.1, s * 0.05);
        ctx.lineTo(-s * 0.35, s * 0.2);
        ctx.lineTo(s * 0.05, -s * 0.02);
        ctx.lineTo(-s * 0.1, -s * 0.06);
        ctx.closePath();
        ctx.fill();

    } else if (f.type === 'nuke_fish') {
        ctx.strokeStyle = isFlashing ? '#ffffff' : '#facc15';
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const a = (i * Math.PI * 2) / 8;
            ctx.moveTo(Math.cos(a) * s * 0.5, Math.sin(a) * s * 0.5);
            ctx.lineTo(Math.cos(a) * s * 0.94, Math.sin(a) * s * 0.94);
        }
        ctx.stroke();

        ctx.fillStyle = isFlashing ? '#ffffff' : f.secondary;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = '#ef4444';
        ctx.stroke();

        const pulseCore = 0.24 + Math.abs(Math.sin(animTime * 0.012)) * 0.15;
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(0, 0, s * pulseCore, 0, Math.PI * 2);
        ctx.fill();

    } else if (f.type === 'boss_kraken') {
        ctx.strokeStyle = isFlashing ? '#ffffff' : f.primary;
        ctx.lineCap = 'round';
        ctx.lineWidth = s * 0.13;
        ctx.beginPath();
        for (let t = 0; t < 8; t++) {
            const spreadY = ((t - 3.5) / 3.5) * s * 0.65;
            const wave1 = Math.sin(animTime * 0.008 + t * 0.9) * (s * 0.24);
            const wave2 = Math.cos(animTime * 0.008 + t * 0.9) * (s * 0.3);
            ctx.moveTo(-s * 0.2, spreadY * 0.5);
            ctx.bezierCurveTo(
                -s * 0.7, spreadY + wave1,
                -s * 1.15, spreadY + wave2,
                -s * 1.55, spreadY * 1.2 + wave1
            );
        }
        ctx.stroke();

        ctx.fillStyle = isFlashing ? '#ffffff' : f.primary;
        ctx.beginPath();
        ctx.moveTo(s * 1.05, 0);
        ctx.quadraticCurveTo(s * 0.4, -s * 0.75, -s * 0.35, -s * 0.52);
        ctx.lineTo(-s * 0.25, s * 0.52);
        ctx.quadraticCurveTo(s * 0.4, s * 0.75, s * 1.05, 0);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = isFlashing ? '#ffffff' : f.accent;
        ctx.beginPath();
        ctx.ellipse(s * 0.25, 0, s * 0.42, s * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(s * 0.25, -s * 0.2, s * 0.14, 0, Math.PI * 2);
        ctx.arc(s * 0.25, s * 0.2, s * 0.14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(s * 0.29, -s * 0.2, s * 0.06, 0, Math.PI * 2);
        ctx.arc(s * 0.29, s * 0.2, s * 0.06, 0, Math.PI * 2);
        ctx.fill();

    } else if (f.type === 'boss_megalodon') {
        ctx.fillStyle = isFlashing ? '#fff' : f.secondary;
        ctx.beginPath();
        ctx.moveTo(-s * 0.85, 0);
        ctx.lineTo(-s * 1.55, -s * 0.7 + tailSwing);
        ctx.lineTo(-s * 1.25, tailSwing * 0.3);
        ctx.lineTo(-s * 1.55, s * 0.7 + tailSwing);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = isFlashing ? '#fff' : '#991b1b';
        ctx.beginPath();
        ctx.moveTo(s * 0.1, -s * 0.45);
        ctx.lineTo(-s * 0.35, -s * 1.05);
        ctx.lineTo(-s * 0.55, -s * 0.42);
        ctx.moveTo(s * 0.15, s * 0.4);
        ctx.lineTo(-s * 0.25, s * 0.98);
        ctx.lineTo(-s * 0.45, s * 0.38);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = isFlashing ? '#ffffff' : f.primary;
        ctx.beginPath();
        ctx.moveTo(s * 1.2, 0);
        ctx.quadraticCurveTo(s * 0.45, -s * 0.65, -s * 0.95, -s * 0.22);
        ctx.lineTo(-s * 0.95, s * 0.22);
        ctx.quadraticCurveTo(s * 0.45, s * 0.65, s * 1.2, 0);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let g = -1; g <= 1; g++) {
            ctx.moveTo(g * s * 0.22, -s * 0.38);
            ctx.lineTo(g * s * 0.22 - 12, s * 0.38);
        }
        ctx.stroke();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(s * 0.68, -s * 0.15, s * 0.11, 0, Math.PI * 2);
        ctx.fill();

    } else if (f.type === 'boss_leviathan_turtle') {
        const flap = Math.sin(animTime * 0.009 + f.waveOffset) * 0.28;
        ctx.fillStyle = isFlashing ? '#fff' : f.secondary;
        for (const side of [-1, 1]) {
            ctx.save();
            ctx.translate(s * 0.32, side * s * 0.55);
            ctx.rotate(side * (0.4 + flap));
            ctx.beginPath();
            ctx.ellipse(0, side * s * 0.2, s * 0.22, s * 0.38, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        ctx.fillStyle = isFlashing ? '#fff' : f.accent;
        ctx.beginPath();
        ctx.ellipse(s * 0.88, 0, s * 0.28, s * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isFlashing ? '#fff' : '#f59e0b';
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.78, s * 0.66, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = '#fef08a';
        ctx.stroke();

        ctx.fillStyle = isFlashing ? '#fff' : '#fef08a';
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.42, s * 0.34, 0, 0, Math.PI * 2);
        ctx.fill();

    } else if (f.type === 'boss_sea_dragon') {
        for (let seg = 7; seg >= 1; seg--) {
            const segX = -seg * s * 0.22;
            const segY = Math.sin(animTime * 0.011 - seg * 0.55 + f.waveOffset) * (s * 0.22);
            const segR = s * (0.36 - seg * 0.025);

            ctx.fillStyle = isFlashing ? '#fff' : '#dc2626';
            ctx.beginPath();
            ctx.arc(segX, segY - segR * 0.95, segR * 0.45, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = isFlashing ? '#fff' : (seg % 2 === 0 ? '#facc15' : '#eab308');
            ctx.beginPath();
            ctx.arc(segX, segY, segR, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = isFlashing ? '#fff' : '#ffd700';
        ctx.beginPath();
        ctx.ellipse(s * 0.25, 0, s * 0.48, s * 0.34, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#dc2626';
        ctx.stroke();

        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(s * 0.45, -s * 0.1, s * 0.08, 0, Math.PI * 2);
        ctx.fill();

    } else if (f.type === 'manta_gold') {
        const wingFlap = Math.sin(animTime * 0.011 + f.waveOffset) * (s * 0.22);
        ctx.fillStyle = isFlashing ? '#fff' : f.primary;
        ctx.beginPath();
        ctx.moveTo(s * 0.95, 0);
        ctx.quadraticCurveTo(s * 0.25, -s * 1.05 + wingFlap, -s * 0.4, -s * 0.85 + wingFlap);
        ctx.quadraticCurveTo(-s * 0.7, -s * 0.25, -s * 1.35, tailSwing * 0.4);
        ctx.quadraticCurveTo(-s * 0.7, s * 0.25, -s * 0.4, s * 0.85 - wingFlap);
        ctx.quadraticCurveTo(s * 0.25, s * 1.05 - wingFlap, s * 0.95, 0);
        ctx.closePath();
        ctx.fill();

    } else if (f.type === 'swordfish') {
        ctx.strokeStyle = isFlashing ? '#fff' : '#67e8f9';
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.moveTo(s * 0.7, 0);
        ctx.lineTo(s * 1.65, 0);
        ctx.stroke();

        ctx.fillStyle = isFlashing ? '#fff' : f.secondary;
        ctx.beginPath();
        ctx.moveTo(-s * 0.75, 0);
        ctx.lineTo(-s * 1.35, -s * 0.55 + tailSwing);
        ctx.lineTo(-s * 1.15, 0);
        ctx.lineTo(-s * 1.35, s * 0.55 + tailSwing);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = isFlashing ? '#fff' : f.primary;
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.92, s * 0.36, 0, 0, Math.PI * 2);
        ctx.fill();

    } else if (f.type === 'hammerhead') {
        ctx.fillStyle = isFlashing ? '#fff' : f.secondary;
        ctx.beginPath();
        ctx.moveTo(-s * 0.8, 0);
        ctx.lineTo(-s * 1.4, -s * 0.58 + tailSwing);
        ctx.lineTo(-s * 1.4, s * 0.58 + tailSwing);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = isFlashing ? '#fff' : f.primary;
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.9, s * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isFlashing ? '#fff' : f.accent;
        ctx.fillRect(s * 0.62, -s * 0.56, s * 0.26, s * 1.12);

    } else if (f.type === 'jelly_emperor') {
        ctx.strokeStyle = isFlashing ? '#fff' : f.accent;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let t = -2; t <= 2; t++) {
            const ty = t * s * 0.16;
            const wave = Math.sin(animTime * 0.01 + t) * (s * 0.18);
            ctx.moveTo(-s * 0.1, ty);
            ctx.quadraticCurveTo(-s * 0.65, ty + wave, -s * 1.25, ty - wave);
        }
        ctx.stroke();

        ctx.fillStyle = isFlashing ? '#fff' : f.primary;
        ctx.beginPath();
        ctx.arc(s * 0.1, 0, s * 0.65, -Math.PI / 2, Math.PI / 2);
        ctx.closePath();
        ctx.fill();

    } else if (f.type === 'jade_turtle') {
        const flap = Math.sin(animTime * 0.012 + f.waveOffset) * (s * 0.2);
        ctx.fillStyle = isFlashing ? '#fff' : f.accent;
        ctx.beginPath();
        ctx.ellipse(s * 0.2, -s * 0.62 + flap, s * 0.16, s * 0.28, 0.3, 0, Math.PI * 2);
        ctx.ellipse(s * 0.2, s * 0.62 - flap, s * 0.16, s * 0.28, -0.3, 0, Math.PI * 2);
        ctx.ellipse(s * 0.78, 0, s * 0.22, s * 0.16, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isFlashing ? '#fff' : f.primary;
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.68, s * 0.56, 0, 0, Math.PI * 2);
        ctx.fill();

    } else {
        ctx.fillStyle = isFlashing ? '#ffffff' : f.secondary;
        ctx.beginPath();
        ctx.moveTo(-s * 0.75, 0);
        ctx.lineTo(-s * 1.4, -s * 0.55 + tailSwing);
        ctx.lineTo(-s * 1.4, s * 0.55 + tailSwing);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = isFlashing ? '#ffffff' : f.primary;
        ctx.beginPath();
        ctx.ellipse(0, 0, s, s * (f.type === 'puffer' ? 0.78 : 0.6), 0, 0, Math.PI * 2);
        ctx.fill();

        if (f.type === 'clown' && !isFlashing) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-s * 0.15, -s * 0.52, s * 0.22, s * 1.04);
            ctx.fillRect(s * 0.32, -s * 0.42, s * 0.18, s * 0.84);
        }

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(s * 0.52, -s * 0.14, s * 0.15, 0, Math.PI * 2);
        ctx.fill();
    }

    if (f.frozenFrames > 0) {
        ctx.fillStyle = 'rgba(125, 211, 252, 0.32)';
        ctx.fillRect(-s * 0.95, -s * 0.55, s * 1.9, s * 1.1);
        ctx.strokeStyle = 'rgba(224, 242, 254, 0.85)';
        ctx.lineWidth = 2;
        ctx.strokeRect(-s * 0.95, -s * 0.55, s * 1.9, s * 1.1);
    }

    ctx.restore();

    if (f.tier === 'boss') {
        const by = f.y - f.size * 0.82 - 10;
        ctx.font = '800 11px Chakra Petch, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = f.hp < f.maxHp * 0.35 ? '#f87171' : '#fef08a';
        ctx.fillText(f.bossTagText, f.x, by);
    } else if (f.tier === 'special') {
        const by = f.y - f.size * 0.95 - 8;
        ctx.font = '800 10px Chakra Petch, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = f.type === 'nuke_fish' ? '#f87171' : f.accent;
        ctx.fillText(f.specialTag, f.x, by);
    }
}