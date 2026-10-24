/**
 * Detect mobile phone vs tablet vs desktop and manage the portrait overlay.
 * Phones: show overlay in portrait, hide in landscape.
 * Tablets & desktop: never show.
 */
(function() {
    var overlay = document.getElementById('rotate-overlay');

    // Heuristic: a phone is a touch device with a short screen edge < 600 CSS px
    function isPhone() {
        var hasTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
        if (!hasTouch) return false;
        var shorter = Math.min(screen.width, screen.height);
        // Phones typically < 500-550 CSS px on short edge; iPads are >= 768
        return shorter < 600;
    }

    function update() {
        if (!isPhone()) {
            overlay.style.display = 'none';
            return;
        }
        // Portrait = height > width
        var portrait = window.innerHeight > window.innerWidth;
        overlay.style.display = portrait ? 'flex' : 'none';
    }

    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', function() {
        // Small delay so the browser has applied the new dimensions
        setTimeout(update, 150);
    });
})();