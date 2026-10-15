/* Error sound: one short, soft tone when something goes wrong right after the visitor did something.
   The first tap or key press on the page "unlocks" an <audio> element by playing a SILENT clip on it
   (iPhone only allows sound that was unlocked by a tap). Later, the real sound is swapped into that same
   element and played, so it can also play after a slow network answer. Nothing audible happens during the unlock.
   If an error happens while the unlock is still running (the very first tap was the one that failed),
   the sound waits for the unlock to finish and then plays.
   The 90 percent level is built into error-sound.mp3 itself, because iPhone ignores volume settings in code. */
(function () {
  var SILENT = 'data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSADAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==';
  var a = null, src = 'error-sound.mp3', real = false, unlocked = false, priming = false, want = false, lastT = 0;
  try { a = new Audio(SILENT); a.preload = 'auto'; } catch (_) { a = null; }
  try {                                              // fetch the real sound ahead of time so it starts instantly
    fetch('error-sound.mp3').then(function (r) { return r.ok ? r.blob() : Promise.reject(); })
      .then(function (b) { if (!real) src = URL.createObjectURL(b); }).catch(function () {});
  } catch (_) {}
  function play() {
    try {
      if (!real) { a.src = src; real = true; } else a.currentTime = 0;
      var p = a.play(); if (p && p.catch) p.catch(function () {});
    } catch (_) {}
  }
  function finish(ok) {
    try { a.pause(); } catch (_) {}
    priming = false; if (!ok) unlocked = false;
    if (want) { want = false; play(); }
  }
  function unlock() {
    if (!a || unlocked || real) return; unlocked = true; priming = true;
    try {
      var p = a.play();
      if (p && p.then) p.then(function () { finish(true); }, function () { finish(false); }); else finish(true);
    } catch (_) { finish(false); }
  }
  ['touchend', 'click', 'keydown'].forEach(function (ev) { document.addEventListener(ev, unlock, { capture: true, passive: true }); });
  window.errSound = function () {
    if (!a) return;
    var n = Date.now(); if (n - lastT < 400) return; lastT = n;
    if (priming) { want = true; return; }
    play();
  };
})();
