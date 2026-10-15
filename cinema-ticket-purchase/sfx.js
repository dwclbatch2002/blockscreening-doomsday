/* Error sound: one short, soft tone when something goes wrong right after the visitor did something.
   It is played from a pre-loaded <audio>. The first tap or key press on the page "unlocks" it, so it can also
   play later, after a slow answer from the network (iPhone only allows sound that was unlocked by a tap).
   If an error happens while that unlock is still running (the very first tap was the one that failed),
   the sound waits for the unlock to finish and then plays.
   The 90% level is built into error-sound.mp3 itself, because iPhone ignores volume settings in code. */
(function () {
  var a = null, unlocked = false, priming = false, want = false, lastT = 0;
  try { a = new Audio('error-sound.mp3'); a.preload = 'auto'; } catch (_) { a = null; }
  function play() {
    try { a.currentTime = 0; var p = a.play(); if (p && p.catch) p.catch(function () {}); } catch (_) {}
  }
  function finish(ok) {
    try { a.pause(); a.currentTime = 0; } catch (_) {}
    a.muted = false; priming = false; if (!ok) unlocked = false;
    if (want) { want = false; play(); }
  }
  function unlock() {
    if (!a || unlocked) return; unlocked = true; priming = true;
    try {
      a.muted = true; var p = a.play();
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
