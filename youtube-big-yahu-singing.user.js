// ==UserScript==
// @name         YouTube - Everything is cGBufCGdZoA
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Changes every YouTube video link, thumbnail and player to https://www.youtube.com/watch?v=cGBufCGdZoA
// @author       you
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const TARGET_ID = 'cGBufCGdZoA';
    const TARGET_URL = `https://www.youtube.com/watch?v=${TARGET_ID}`;
    const TARGET_THUMB = `https://i.ytimg.com/vi/${TARGET_ID}/hqdefault.jpg`;
    const TARGET_THUMB_MQ = `https://i.ytimg.com/vi/${TARGET_ID}/mqdefault.jpg`;
    const TARGET_THUMB_HQ720 = `https://i.ytimg.com/vi/${TARGET_ID}/hq720.jpg`;

    // 1. Redirect if you actually open any other video/short
    function redirectPlayer() {
        const url = new URL(location.href);
        const currentId = url.searchParams.get('v');
        // if on a watch page with a different video id -> redirect
        if (url.pathname === '/watch' && currentId && currentId !== TARGET_ID) {
            window.location.replace(TARGET_URL);
        }
        // if on shorts with different id -> redirect
        if (url.pathname.startsWith('/shorts/') && !url.pathname.includes(TARGET_ID)) {
            window.location.replace(TARGET_URL);
        }
    }
    redirectPlayer();

    // Hijack SPA navigation (YouTube doesn't reload page)
    const origPushState = history.pushState;
    history.pushState = function() {
        origPushState.apply(this, arguments);
        setTimeout(redirectPlayer, 100);
        setTimeout(replaceAll, 100);
    };
    window.addEventListener('yt-navigate-finish', () => {
        redirectPlayer();
        replaceAll();
    });

    // 2. Replace all links and thumbnails
    function replaceAll() {
        // Replace all video links
        document.querySelectorAll('a[href*="/watch?v="], a[href*="/shorts/"], a#thumbnail, a.ytd-thumbnail').forEach(a => {
            if (a.href.includes('/watch?v=') || a.href.includes('/shorts/')) {
                a.href = TARGET_URL;
                // Remove navigation endpoints that YouTube uses internally
                a.removeAttribute('data-href');
            }
        });

        // Replace thumbnails
        document.querySelectorAll('img[src*="i.ytimg.com/vi/"], img[src*="ytimg.com/vi/"]').forEach(img => {
            if (!img.src.includes(TARGET_ID)) {
                // keep same resolution format if possible
                if (img.src.includes('hq720')) img.src = TARGET_THUMB_HQ720;
                else if (img.src.includes('mqdefault')) img.src = TARGET_THUMB_MQ;
                else img.src = TARGET_THUMB;
                
                // also srcset
                if (img.srcset) img.srcset = TARGET_THUMB + " 1x, " + TARGET_THUMB_HQ720 + " 2x";
            }
        });

        // Replace background thumbnails (used in some layouts)
        document.querySelectorAll('yt-image img, #img, ytd-thumbnail img').forEach(el => {
            // handled above
        });

        // Replace CSS background images
        document.querySelectorAll('[style*="i.ytimg.com/vi/"]').forEach(el => {
            el.style.backgroundImage = `url("${TARGET_THUMB_HQ720}")`;
        });

        // Optional: Replace titles on homepage to hide the prank a bit less obvious
        // Uncomment if you want all titles to say the same thing
        /*
        document.querySelectorAll('#video-title, #video-title-link, yt-formatted-string#video-title').forEach(t => {
            t.textContent = "Totally not rickrolled :)";
        });
        */
    }

    // Run constantly because YouTube lazy-loads
    const observer = new MutationObserver(() => {
        replaceAll();
    });

    // Start observing once body exists
    function startObserve() {
        if (document.body) {
            observer.observe(document.body, { childList: true, subtree: true });
            replaceAll();
            setInterval(replaceAll, 1000); // fallback for lazy load
        } else {
            requestAnimationFrame(startObserve);
        }
    }
    startObserve();
})();
