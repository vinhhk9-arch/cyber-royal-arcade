/* Cyber Royal Arcade - fullscreen & mobile landscape layout.
 * A user gesture is required for browser Fullscreen API (supported in most Android browsers).
 */
(() => {
    'use strict';
    const gameStage = document.getElementById('gameStage');
    const fullscreenButton = document.getElementById('arcadeFullscreenBtn');
    const mobileQuery = window.matchMedia('(pointer: coarse)');
    const isMobileDevice = () => mobileQuery.matches && Math.min(innerWidth, innerHeight) <= 850;
    window.arcadeIsTouchDevice = mobileQuery.matches;
    window.arcadeIsMobileGame = false;

    function fitGameStage() {
        if (!gameStage) return;
        const screenW = Math.max(1, window.innerWidth);
        const screenH = Math.max(1, window.innerHeight);
        const mobile = isMobileDevice();
        const rotated = mobile && screenH > screenW;
        const areaW = rotated ? screenH : screenW;
        const areaH = rotated ? screenW : screenH;
        // Stable game coordinates. Scale BOTH the canvas and toolbar together so no controls overlap.
        const gameH = mobile ? 480 : areaH;
        const gameW = mobile ? Math.max(860, Math.round(gameH * areaW / areaH)) : areaW;
        const scale = Math.min(areaW / gameW, areaH / gameH);
        gameStage.style.width = gameW + 'px';
        gameStage.style.height = gameH + 'px';
        gameStage.dataset.scale = String(scale);
        gameStage.dataset.rotated = rotated ? 'true' : 'false';
        if (rotated) {
            // Origin at the upper-left; 90deg clockwise maps wide game to portrait viewport.
            const offsetX = (screenW + gameH * scale) / 2;
            const offsetY = (screenH - gameW * scale) / 2;
            gameStage.style.transform = `translate(${offsetX}px, ${offsetY}px) rotate(90deg) scale(${scale})`;
        } else {
            gameStage.style.transform = `translate(${(screenW - gameW * scale) / 2}px, ${(screenH - gameH * scale) / 2}px) scale(${scale})`;
        }
        window.arcadeIsMobileGame = mobile;
        document.documentElement.classList.toggle('arcade-mobile-playing', mobile);
    }

    window.arcadeFitGame = fitGameStage;
    window.arcadeToGame = (clientX, clientY) => {
        if (!gameStage) return {x: clientX, y: clientY};
        const box = gameStage.getBoundingClientRect();
        const scale = Number(gameStage.dataset.scale) || 1;
        return gameStage.dataset.rotated === 'true'
            ? {x: (clientY - box.top) / scale, y: (box.right - clientX) / scale}
            : {x: (clientX - box.left) / scale, y: (clientY - box.top) / scale};
    };

    fitGameStage();
    // Registered before the game engine's resize listener so stage bounds update first.
    if (gameStage) {
        window.addEventListener('resize', fitGameStage, {passive: true});
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                fitGameStage();
                window.dispatchEvent(new Event('arcadestagechange'));
            }, 120);
        });
    }

    function activeFullscreenElement() {
        return document.fullscreenElement || document.webkitFullscreenElement;
    }
    function syncFullscreenButton() {
        if (!fullscreenButton) return;
        const active = Boolean(activeFullscreenElement());
        fullscreenButton.textContent = active ? '🗗 Thu nhỏ' : '⛶ Phóng to';
        fullscreenButton.setAttribute('aria-label', active ? 'Thoát toàn màn hình' : 'Bật toàn màn hình');
        fullscreenButton.setAttribute('aria-pressed', String(active));
        if (gameStage) {
            fitGameStage();
            window.dispatchEvent(new Event('arcadestagechange'));
        }
    }

    if (fullscreenButton) {
        fullscreenButton.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();
            try {
                if (activeFullscreenElement()) {
                    if (document.exitFullscreen) await document.exitFullscreen();
                    else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
                } else {
                    const element = document.documentElement;
                    if (element.requestFullscreen) await element.requestFullscreen({navigationUI: 'hide'});
                    else if (element.webkitRequestFullscreen) await element.webkitRequestFullscreen();
                    else throw new Error('unsupported');
                    // Landscape preference when permitted; CSS rotation still handles browsers that deny it.
                    if (gameStage && isMobileDevice() && screen.orientation && screen.orientation.lock) {
                        try { await screen.orientation.lock('landscape'); } catch (_) {}
                    }
                }
            } catch (_) {
                if (!document.fullscreenElement) {
                    alert('Trình duyệt này chưa cho phép bật toàn màn hình. Trên Android, hãy mở trang bằng Chrome và nhấn lại. Trên iPhone, có thể chọn “Thêm vào Màn hình chính” trong Safari để mở rộng vùng chơi.');
                }
            } finally {
                syncFullscreenButton();
            }
        });
    }
    document.addEventListener('fullscreenchange', syncFullscreenButton);
    document.addEventListener('webkitfullscreenchange', syncFullscreenButton);
})();
