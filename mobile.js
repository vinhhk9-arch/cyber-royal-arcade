/* Cyber Royal Arcade: responsive touch layout + true fullscreen where supported.
   iOS Safari does not offer Fullscreen API for ordinary websites. Installing to
   the home screen activates standalone display mode instead. */
(() => {
    'use strict';

    const stage = document.getElementById('gameStage');
    const fullBtn = document.getElementById('arcadeFullscreenBtn');
    const coarse = window.matchMedia('(pointer: coarse)');
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const standalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
    const isMobile = () => coarse.matches && Math.min(innerWidth, innerHeight) <= 850;

    window.arcadeIsTouchDevice = coarse.matches;
    window.arcadeIsMobileGame = false;

    function viewportSize() {
        // visualViewport reports actual height left after mobile browser toolbars.
        const vv = window.visualViewport;
        return {
            w: Math.max(1, Math.round(vv ? vv.width : innerWidth)),
            h: Math.max(1, Math.round(vv ? vv.height : innerHeight)),
            left: vv ? vv.offsetLeft : 0,
            top: vv ? vv.offsetTop : 0
        };
    }

    let previousSignature = '';
    function fitStage() {
        if (!stage) return;
        const {w, h, left, top} = viewportSize();
        const mobile = isMobile();
        const rotate = mobile && h > w;
        const areaW = rotate ? h : w;
        const areaH = rotate ? w : h;
        // Wide virtual world keeps controls at readable sizes and never stretches geometry.
        const worldH = mobile ? 480 : areaH;
        const worldW = mobile ? Math.max(860, Math.round(worldH * areaW / areaH)) : areaW;
        const scale = Math.min(areaW / worldW, areaH / worldH);
        const signature = [w,h,left,top,mobile,rotate,worldW,worldH,scale].join('/');
        if (signature === previousSignature) return;
        previousSignature = signature;
        stage.style.width = worldW + 'px';
        stage.style.height = worldH + 'px';
        stage.dataset.scale = String(scale);
        stage.dataset.rotated = rotate ? 'true' : 'false';
        if (rotate) {
            const tx = left + (w + worldH * scale) / 2;
            const ty = top + (h - worldW * scale) / 2;
            stage.style.transform = `translate3d(${tx}px, ${ty}px, 0) rotate(90deg) scale(${scale})`;
        } else {
            stage.style.transform = `translate3d(${left + (w - worldW * scale) / 2}px, ${top + (h - worldH * scale) / 2}px, 0) scale(${scale})`;
        }
        window.arcadeIsMobileGame = mobile;
        document.documentElement.classList.toggle('arcade-mobile-playing', mobile);
        window.dispatchEvent(new Event('arcadestagechange'));
    }

    window.arcadeFitGame = fitStage;
    window.arcadeToGame = (clientX, clientY) => {
        if (!stage) return {x: clientX, y: clientY};
        const rect = stage.getBoundingClientRect();
        const scale = Number(stage.dataset.scale) || 1;
        return stage.dataset.rotated === 'true'
            ? {x: (clientY - rect.top) / scale, y: (rect.right - clientX) / scale}
            : {x: (clientX - rect.left) / scale, y: (clientY - rect.top) / scale};
    };

    fitStage();
    window.addEventListener('resize', fitStage, {passive: true});
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', fitStage, {passive: true});
        window.visualViewport.addEventListener('scroll', fitStage, {passive: true});
    }
    window.addEventListener('orientationchange', () => {
        previousSignature = '';
        requestAnimationFrame(fitStage);
        setTimeout(fitStage, 200);
    }, {passive: true});

    const fullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement;
    function syncBtn() {
        if (!fullBtn) return;
        const full = Boolean(fullscreenElement());
        fullBtn.textContent = full ? '🗗 Thu nhỏ' : '⛶ Phóng to';
        fullBtn.setAttribute('aria-label', full ? 'Thoát chế độ toàn màn hình' : 'Mở chế độ toàn màn hình');
        fullBtn.setAttribute('aria-pressed', String(full));
        previousSignature = '';
        fitStage();
    }

    function guideForIOS() {
        let popup = document.getElementById('arcadeFullscreenGuide');
        if (popup) { popup.remove(); return; }
        popup = document.createElement('section');
        popup.id = 'arcadeFullscreenGuide';
        popup.setAttribute('role','dialog');
        popup.setAttribute('aria-modal','true');
        popup.setAttribute('aria-label','Hướng dẫn mở toàn màn hình');
        popup.innerHTML = `<div class="arcade-guide-inner">
          <div class="arcade-guide-icon">📱</div>
          <h2>Chơi toàn màn hình trên iPhone</h2>
          <p>Safari không cho trang game bật toàn màn hình trực tiếp.</p>
          <p>Nhấn <strong>Chia sẻ</strong> (biểu tượng mũi tên lên) → <strong>Thêm vào Màn hình chính</strong> → <strong>Thêm</strong>. Sau đó mở game từ biểu tượng trên màn hình chính.</p>
          <button type="button" id="arcadeCloseGuide">Đã hiểu</button>
        </div>`;
        document.body.appendChild(popup);
        popup.querySelector('button').addEventListener('click', () => popup.remove());
        popup.addEventListener('click', e => { if (e.target === popup) popup.remove(); });
    }

    if (fullBtn) {
        fullBtn.addEventListener('click', async e => {
            e.preventDefault();
            e.stopPropagation();
            try {
                if (fullscreenElement()) {
                    if (document.exitFullscreen) await document.exitFullscreen();
                    else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
                } else if (document.documentElement.requestFullscreen) {
                    await document.documentElement.requestFullscreen({navigationUI: 'hide'});
                    if (stage && isMobile() && screen.orientation && screen.orientation.lock) {
                        try { await screen.orientation.lock('landscape'); } catch (_) { /* nonfatal */ }
                    }
                } else if (document.documentElement.webkitRequestFullscreen && !ios) {
                    await document.documentElement.webkitRequestFullscreen();
                } else if (ios) {
                    // iPhone home-screen mode already runs without Safari's toolbars.
                    if (standalone()) {
                        window.alert('Game đang mở ở chế độ ứng dụng toàn màn hình. Vuốt lên để về màn hình chính.');
                    } else guideForIOS();
                } else {
                    window.alert('Trình duyệt chưa hỗ trợ toàn màn hình. Hãy thử Chrome trên Android hoặc PC.');
                }
            } catch (_) {
                if (ios) guideForIOS();
                else window.alert('Không thể bật toàn màn hình. Hãy thử mở bằng Chrome và nhấn lại.');
            } finally { syncBtn(); }
        });
    }
    document.addEventListener('fullscreenchange', syncBtn);
    document.addEventListener('webkitfullscreenchange', syncBtn);

    // HTTPS is provided by GitHub Pages. Relative registration keeps project sites working.
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js').catch(() => {});
        }, {once: true});
    }
})();
