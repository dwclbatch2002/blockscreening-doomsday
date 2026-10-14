/* Friendly pop-ups that replace the browser's built-in alert / confirm / prompt boxes.
   ui.confirm(message, {title, ok, cancel, danger, countdown}) -> Promise<true|false>   (countdown: seconds the OK button stays locked, as a safety net)
   ui.alert(message, {title, ok})                   -> Promise<void>
   ui.prompt(message, {title, value, placeholder, ok, cancel, maxlength, multiline}) -> Promise<string|null>
   Self-contained: it injects its own styles, so it looks the same on every page even if a stylesheet is cached. */
(function () {
  if (window.ui && window.ui.__custom) return;
  const css = `
dialog.uim{position:fixed;inset:0;width:100%;height:100%;max-width:none;max-height:none;margin:0;padding:16px;border:0;background:transparent;color:inherit;display:flex;align-items:center;justify-content:center;overflow:auto}
dialog.uim:not([open]){display:none}
dialog.uim::backdrop{background:rgba(0,4,2,.72);backdrop-filter:blur(3px)}
.uim-box{width:100%;max-width:440px;box-sizing:border-box;background:linear-gradient(180deg,#0d1f16,#08140e);border:1px solid rgba(57,255,122,.28);border-radius:16px;padding:22px 22px 18px;box-shadow:0 20px 60px rgba(0,0,0,.6),0 0 0 1px rgba(0,0,0,.4);color:#e8f1ec;font:400 16px/1.5 Metropolis,"Trebuchet MS",Verdana,sans-serif;animation:uim-in .16s ease-out}
.uim-box.danger{border-color:rgba(255,107,129,.5)}
.uim-box.adm{border-color:rgba(255,216,58,.35)}
@keyframes uim-in{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}
.uim-t{margin:0 0 8px;font-size:1.15rem;font-weight:700;color:var(--uim-acc,#39ff7a);line-height:1.25}
.uim-box.danger .uim-t{color:#ff8fa0}
.uim-m{margin:0;white-space:pre-line;color:#dfe8ea;font-size:.98rem;word-break:break-word}
.uim-in{display:block;width:100%;box-sizing:border-box;margin-top:14px;padding:11px 12px;border-radius:9px;border:1px solid #2f6b4a;background:rgba(2,10,6,.85);color:#e8f1ec;font:inherit;resize:vertical}
.uim-in:focus{outline:none;border-color:var(--uim-acc,#39ff7a);box-shadow:0 0 0 3px rgba(57,255,122,.2)}
.uim-b{display:flex;justify-content:flex-end;gap:10px;margin-top:20px;flex-wrap:wrap}
.uim-b button{font:inherit;font-size:.85rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:11px 18px;border-radius:9px;cursor:pointer;border:1px solid transparent;min-width:96px}
.uim-b .uim-c{background:transparent;color:#e8f1ec;border-color:#3f7a58}
.uim-b .uim-c:hover{background:rgba(57,255,122,.1)}
.uim-o{background:var(--uim-acc,#39ff7a);color:#03160b}
.uim-o:hover{filter:brightness(1.08)}
.uim-box.danger .uim-o{background:#ff6b81;color:#2a0509}
.uim-b button:disabled{opacity:.55;cursor:not-allowed;filter:none}
.uim-b button:focus-visible{outline:3px solid #fff;outline-offset:2px}
@media(max-width:480px){.uim-b{flex-direction:column-reverse}.uim-b button{width:100%}}
@media(prefers-reduced-motion:reduce){.uim-box{animation:none}}`;
  let styled = false, chain = Promise.resolve();
  const style = () => { if (styled) return; styled = true; const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); };

  function open(kind, message, o) {
    o = o || {};
    const run = () => new Promise(done => {
      style();
      const prev = document.activeElement, adm = document.body.classList.contains('adm');
      const dlg = document.createElement('dialog'); dlg.className = 'uim';
      const box = document.createElement('div'); box.className = 'uim-box' + (o.danger ? ' danger' : '') + (adm ? ' adm' : '');
      if (adm) box.style.setProperty('--uim-acc', '#ffd83a');
      box.setAttribute('role', kind === 'alert' ? 'alertdialog' : 'dialog'); box.setAttribute('aria-modal', 'true');
      const id = 'uim' + Math.random().toString(36).slice(2, 7);
      const t = document.createElement('h2'); t.className = 'uim-t'; t.id = id + 't';
      t.textContent = o.title || (kind === 'prompt' ? 'Enter a value' : kind === 'alert' ? 'Notice' : 'Please confirm');
      const m = document.createElement('p'); m.className = 'uim-m'; m.id = id + 'm'; m.textContent = message == null ? '' : String(message);
      box.setAttribute('aria-labelledby', id + 't'); box.setAttribute('aria-describedby', id + 'm');
      box.append(t, m);
      let input = null;
      if (kind === 'prompt') {
        input = document.createElement(o.multiline ? 'textarea' : 'input'); input.className = 'uim-in';
        if (o.multiline) input.rows = 3; else input.type = 'text';
        input.value = o.value || ''; if (o.placeholder) input.placeholder = o.placeholder; if (o.maxlength) input.maxLength = o.maxlength;
        input.setAttribute('aria-label', o.title || 'Value'); box.appendChild(input);
      }
      const row = document.createElement('div'); row.className = 'uim-b';
      const cancel = document.createElement('button'); cancel.type = 'button'; cancel.className = 'uim-c'; cancel.textContent = o.cancel || 'Cancel';
      const ok = document.createElement('button'); ok.type = 'button'; ok.className = 'uim-o'; ok.textContent = o.ok || (kind === 'alert' ? 'OK' : kind === 'prompt' ? 'Save' : 'Confirm');
      if (kind !== 'alert') row.appendChild(cancel); row.appendChild(ok); box.appendChild(row); dlg.appendChild(box);
      document.body.appendChild(dlg);
      let finished = false, cdT = null;
      const finish = v => { if (finished) return; finished = true; clearInterval(cdT); try { dlg.close(); } catch (_) {} dlg.remove(); try { prev && prev.focus && prev.focus({ preventScroll: true }); } catch (_) {} done(v); };
      const yes = () => finish(kind === 'prompt' ? input.value : true), no = () => finish(kind === 'prompt' ? null : kind === 'alert' ? undefined : false);
      ok.onclick = yes; cancel.onclick = no;
      dlg.addEventListener('cancel', e => { e.preventDefault(); no(); });                // Esc key
      dlg.addEventListener('mousedown', e => { if (e.target === dlg) no(); });             // tap outside the box
      dlg.addEventListener('keydown', e => {
        if (e.key === 'Enter' && input && !o.multiline) { e.preventDefault(); yes(); }
        if (e.key === 'Tab') {                                                             // keep focus inside the pop-up
          const f = [...box.querySelectorAll('button,input,textarea')].filter(x => !x.disabled), a = f.indexOf(document.activeElement);
          if (e.shiftKey && a <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && a === f.length - 1) { e.preventDefault(); f[0].focus(); }
        }
      });
      if (o.countdown > 0 && kind === 'confirm') {                                         // OK stays locked for a few seconds
        let n = Math.round(o.countdown); const lbl = ok.textContent; ok.disabled = true; ok.textContent = lbl + ' (' + n + ')';
        cdT = setInterval(() => { n--; if (n <= 0) { clearInterval(cdT); ok.disabled = false; ok.textContent = lbl; } else ok.textContent = lbl + ' (' + n + ')'; }, 1000);
      }
      dlg.showModal();
      if (input) { input.focus(); input.select(); } else (o.danger && kind === 'confirm' ? cancel : ok).focus();
    });
    chain = chain.then(run, run);                                                          // one pop-up at a time
    return chain;
  }
  window.ui = {
    __custom: true,
    confirm: (m, o) => open('confirm', m, o),
    alert: (m, o) => open('alert', m, o),
    prompt: (m, o) => open('prompt', m, o)
  };
})();
