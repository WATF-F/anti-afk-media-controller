(() => {
    const originalPlay  = HTMLMediaElement.prototype.play;
    const originalPause = HTMLMediaElement.prototype.pause;

    let blockPause = true;

    HTMLMediaElement.prototype.pause = function () {
        if (this.__ghost) return originalPause.call(this);
        if (blockPause) return Promise.resolve();          
        return originalPause.call(this);
    };

    HTMLMediaElement.prototype.play = function () {
        if (this.__ghost) return originalPlay.call(this);
        if (!blockPause) return Promise.resolve();         
        return originalPlay.call(this);
    };
    Object.defineProperty(document, 'hidden', { get: () => false, configurable: true });
    Object.defineProperty(document, 'visibilityState', { get: () => 'visible', configurable: true });
    document.addEventListener('visibilitychange', e => e.stopImmediatePropagation(), true);
    window.addEventListener('blur',  e => e.stopImmediatePropagation(), true);
    window.addEventListener('pagehide', e => e.stopImmediatePropagation(), true);

    const BLANK_MP4 = 'data:video/mp4;base64,AAAAHGZ0eXBtcDQyAAAAAG1wNDJpc29t';

    function spawnGhost(mode) {
        const v = document.createElement('video');
        v.__ghost = true;                  
        v.muted = true;
        v.loop = true;
        v.playsInline = true;
        v.autoplay = mode === 'play';
        v.src = BLANK_MP4;
        v.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:0;top:0;';
        (document.body || document.documentElement).appendChild(v);

        if (mode === 'play') {
            blockPause = true;
            originalPlay.call(v).catch(() => {});
            document.querySelectorAll('video').forEach(x => {
                if (x !== v && !x.__ghost) originalPlay.call(x).catch(() => {});
            });
        } else {
            blockPause = false;
            originalPause.call(v);
            document.querySelectorAll('video').forEach(x => {
                if (x !== v && !x.__ghost) originalPause.call(x);
            });
        }

        return v;
    }

    window.addEventListener('keydown', (e) => {
        const tag = (e.target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;

        if (e.altKey && !e.ctrlKey && !e.metaKey && e.code === 'KeyP') {
            e.preventDefault();
            spawnGhost('play');
        }
        if (e.altKey && !e.ctrlKey && !e.metaKey && e.code === 'KeyS') {
            e.preventDefault();
            spawnGhost('pause');
        }
    }, true);

    setInterval(() => {
        document.querySelectorAll('video').forEach(v => {
            if (v.__ghost) return;
            if (blockPause && v.paused)        originalPlay.call(v).catch(() => {});
            else if (!blockPause && !v.paused) originalPause.call(v);
        });
    }, 500);
})();