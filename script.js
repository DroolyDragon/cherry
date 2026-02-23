const video = document.getElementById('v');

// Remove native controls and ensure audio is enabled
video.controls = false;
video.removeAttribute('controls');
video.muted = false;
video.volume = 1;

// Prevent context menu on video
video.addEventListener('contextmenu', (e) => e.preventDefault());

// Disable media session overlays when possible
try {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = null;
  }
} catch (e) {}

// Attempt closing helper
function attemptClose() {
  try {
    window.close();
  } catch (e) {}

  // Fallback if browser refuses
  setTimeout(() => {
    try {
      location.href = 'about:blank';
    } catch (e) {}
  }, 150);
}

// Force video to visually fill viewport
video.style.position = 'fixed';
video.style.inset = '0';
video.style.width = '100%';
video.style.height = '100%';
video.style.objectFit = 'cover';

// Fullscreen helper
async function attemptFullscreen() {
  if (document.fullscreenElement) return;

  try {
    if (video.requestFullscreen) {
      await video.requestFullscreen();
    } else if (video.webkitRequestFullscreen) {
      video.webkitRequestFullscreen();
    } else if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    }
  } catch (err) {
    // Silent fail (usually needs user interaction)
  }
}

// === 1 SECOND TIMER ===
let stopTimer = null;

function scheduleStopAfter1Second() {
  if (stopTimer) clearTimeout(stopTimer);

  stopTimer = setTimeout(() => {
    try { video.pause(); } catch (e) {}
    attemptClose();
  }, 1000); // 1000ms = 1.0 second
}

// Trigger when playback starts
video.addEventListener('play', () => {
  scheduleStopAfter1Second();
  attemptFullscreen();
});

video.addEventListener('playing', () => {
  scheduleStopAfter1Second();
  attemptFullscreen();
});

// Clear timer if stopped early
video.addEventListener('pause', () => {
  if (stopTimer) {
    clearTimeout(stopTimer);
    stopTimer = null;
  }
});

video.addEventListener('ended', () => {
  if (stopTimer) {
    clearTimeout(stopTimer);
    stopTimer = null;
  }
  attemptClose();
});

// Force cherry favicon
(function setCherryIcon() {
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/png';
  link.href = 'cherryicon.png';

  // Remove existing favicons if any
  document.querySelectorAll("link[rel*='icon']").forEach(el => el.remove());

  document.head.appendChild(link);
})();

// Resume if autoplay blocked
function resumeOnInteraction() {
  video.muted = false;
  video.volume = 1;
  video.play().catch(()=>{});
  attemptFullscreen();

  window.removeEventListener('click', resumeOnInteraction);
  window.removeEventListener('touchstart', resumeOnInteraction);
}

window.addEventListener('click', resumeOnInteraction, {passive: true});
window.addEventListener('touchstart', resumeOnInteraction, {passive: true});

// Try fullscreen shortly after load
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    attemptFullscreen();
  }, 100);
});
