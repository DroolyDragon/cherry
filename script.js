const video = document.getElementById('v');

// Remove native controls and ensure audio is enabled
video.controls = false;
video.removeAttribute('controls');
video.muted = false;
video.volume = 1;

// Prevent context menu on video (removes some browser UI)
video.addEventListener('contextmenu', (e) => e.preventDefault());

// Disable keyboard/media-session overlays when possible
try {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = null;
  }
} catch (e) {}

// Helper to attempt closing the site
function attemptClose() {
  try {
    window.close();
  } catch (e) {}
  // Fallback: navigate to about:blank shortly after
  setTimeout(() => {
    try {
      location.href = 'about:blank';
    } catch (e) {}
  }, 150);
}

// Ensure the video fills the viewport visually (in case CSS didn't apply yet)
video.style.position = 'fixed';
video.style.inset = '0';
video.style.width = '100%';
video.style.height = '100%';
video.style.objectFit = 'cover';

// Request fullscreen helper (best-effort; browsers require a user gesture in many cases)
async function attemptFullscreen() {
  const el = document.fullscreenElement ? document.fullscreenElement : (video || document.documentElement);
  if (document.fullscreenElement) return;
  try {
    if (video.requestFullscreen) {
      await video.requestFullscreen();
    } else if (video.webkitRequestFullscreen) {
      // Safari
      video.webkitRequestFullscreen();
    } else if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    }
  } catch (err) {
    // Fail silently; fullscreen often requires user gesture
  }
}

// We will stop playback and close the page exactly 0.7 seconds after playback starts.
// Use a play-start timer so this triggers regardless of video duration.
let stopTimer = null;
function scheduleStopAfter700ms() {
  if (stopTimer) clearTimeout(stopTimer);
  stopTimer = setTimeout(() => {
    // Pause, then attempt to close/navigate away
    try { video.pause(); } catch (e) {}
    attemptClose();
  }, 700);
}

// If autoplay starts playback, schedule stop immediately on play event and try fullscreen.
video.addEventListener('play', () => {
  scheduleStopAfter700ms();
  attemptFullscreen();
});

// Also schedule when user manually starts playback (gesture cases) and try fullscreen.
video.addEventListener('playing', () => {
  scheduleStopAfter700ms();
  attemptFullscreen();
});

// Clear timer if playback is paused or ended earlier
video.addEventListener('pause', () => {
  if (stopTimer) { clearTimeout(stopTimer); stopTimer = null; }
});
video.addEventListener('ended', () => {
  if (stopTimer) { clearTimeout(stopTimer); stopTimer = null; }
  attemptClose();
});

// In case autoplay with sound is blocked, attempt to play/unmute and fullscreen on first user interaction
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

// Try to request fullscreen on DOMContentLoaded (best-effort; usually requires gesture)
window.addEventListener('DOMContentLoaded', () => {
  // Small delay to let autoplay attempt start; still may be blocked by browser.
  setTimeout(() => {
    attemptFullscreen();
  }, 100);
});