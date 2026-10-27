/**
 * Detect mobile phone vs tablet vs desktop and manage the portrait overlay.
 * Phones: show overlay in portrait, hide in landscape.
 * Tablets & desktop: never show.
 * Also synchronizes the Phaser game scale/resolution on orientation change.
 */
(function() {
    var overlay = null;

    function getOverlay() {
        if (!overlay) {
            overlay = document.getElementById('rotate-overlay');
        }
        return overlay;
    }

    // Heuristic: a phone is a touch device with a short screen edge < 600 CSS px
    function isPhone() {
        var hasTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
        if (!hasTouch) return false;
        var shorter = Math.min(screen.width, screen.height);
        // Phones typically < 500-550 CSS px on short edge; iPads are >= 768
        return shorter < 600;
    }

    function syncGameResolution() {
        if (!window.game || !window.game.scale) return;

        var w = (document.body && document.body.clientWidth) || window.innerWidth;
        var h = (document.body && document.body.clientHeight) || window.innerHeight;

        if (w > 0 && h > 0) {
            window.game.scale.resize(w, h);
            window.game.scale.refresh();
        }
    }

    function update() {
        var targetOverlay = getOverlay();
        if (!targetOverlay) return;
        if (!isPhone()) {
            targetOverlay.style.display = 'none';
            syncGameResolution();
            return;
        }
        // Portrait = height > width
        var portrait = window.innerHeight > window.innerWidth;
        targetOverlay.style.display = portrait ? 'flex' : 'none';

        // When in landscape (or changed orientation), ensure Phaser resolution is synchronized
        if (!portrait) {
            syncGameResolution();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', update);
    } else {
        update();
    }

    // Viewport or orientation changes: mobile browsers update dimensions asynchronously
    function onViewportChange() {
        update();
        syncGameResolution();
        setTimeout(function() {
            update();
            syncGameResolution();
        }, 50);
        setTimeout(function() {
            update();
            syncGameResolution();
        }, 150);
        setTimeout(function() {
            update();
            syncGameResolution();
        }, 300);
        setTimeout(function() {
            update();
            syncGameResolution();
        }, 500);
    }

    window.addEventListener('resize', onViewportChange);
    window.addEventListener('orientationchange', onViewportChange);
    if (screen.orientation && screen.orientation.addEventListener) {
        screen.orientation.addEventListener('change', onViewportChange);
    }

    // ResizeObserver watches for real layout changes on document.body
    if (window.ResizeObserver && document.body) {
        var ro = new ResizeObserver(function() {
            update();
            syncGameResolution();
        });
        ro.observe(document.body);
    }
})();