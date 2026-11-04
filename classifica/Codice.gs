// Ridotte Inserite · Classifica dei tempi (Google Apps Script, app web: Esegui come "Me", accesso "Chiunque").
// I tempi finiscono nel foglio "Ridotte Inserite · Classifica" (Drive → Progetti Claude → Gioco 4x4 - Ridotte Inserite).
// GET ?action=top                                   → migliori 10 per tracciato (un tempo per nome)
// GET ?action=add&name=..&track=..&time=..&resc=..&k=..  → salva il tempo e restituisce le classifiche
// Con &callback=nome risponde in JSONP (serve al gioco su GitHub Pages).
// Nomi protetti: il primo telefono che usa un nome lo prenota col suo codice (si salva solo l'impronta).
const SHEET_ID = '12tSdjeERZDV6F7AMwvkBH0At6aDu-ox54pbhGM0ENho';
const TRACKS = ['colle', 'neve'];
const MIN_TIME = { colle: 90, neve: 100 };   // sotto questi secondi un giro non è credibile
const MAX_TIME = 3600;

function sheet_(name, head) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let s = ss.getSheetByName(name);
  if (!s) {
    s = name === 'Tempi' && ss.getSheets().length === 1 && ss.getSheets()[0].getLastRow() === 0 ? ss.getSheets()[0] : ss.insertSheet(name);
    s.setName(name);
    s.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold');
    s.setFrozenRows(1);
  }
  return s;
}
const times_ = () => sheet_('Tempi', ['Data', 'Nome', 'Tracciato', 'Tempo (s)', 'Spinte di Purcello']);
const names_ = () => sheet_('Nomi', ['Nome', 'Impronta codice', 'Dal']);
function hash_(k) { return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, 'ridotte|' + k)).slice(0, 24); }
function clean_(t, n) { return String(t || '').replace(/[<>"'`\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, n); }

function claim_(name, k) {
  const s = names_(), last = s.getLastRow(), key = name.toLowerCase();
  const rows = last > 1 ? s.getRange(2, 1, last - 1, 2).getValues() : [];
  const row = rows.find(r => String(r[0]) === key);
  if (row) return !!k && row[1] === hash_(k);
  if (!k) return false;
  s.appendRow([key, hash_(k), new Date()]);
  return true;
}

function boards_() {
  const s = times_(), last = s.getLastRow(), out = {};
  TRACKS.forEach(t => out[t] = []);
  if (last < 2) return out;
  const rows = s.getRange(2, 1, last - 1, 5).getValues();
  const best = {};
  rows.forEach(r => {
    const n = String(r[1]), t = String(r[2]), tm = Number(r[3]), rs = Number(r[4]) || 0;
    if (!out[t] || !(tm > 0)) return;
    const key = t + '|' + n.toLowerCase();
    if (!best[key] || tm < best[key].t) best[key] = { n, t: tm, r: rs, tr: t };
  });
  Object.keys(best).forEach(k => out[best[k].tr].push({ n: best[k].n, t: best[k].t, r: best[k].r }));
  TRACKS.forEach(t => { out[t].sort((a, b) => a.t - b.t); out[t] = out[t].slice(0, 10); });
  return out;
}

function reply_(p, data) {
  const json = JSON.stringify(data);
  const cb = String(p.callback || '').replace(/[^\w$]/g, '');
  if (cb) return ContentService.createTextOutput(cb + '(' + json + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    if (p.action === 'add') {
      const name = clean_(p.name, 16), track = String(p.track || ''), time = Math.round(Number(p.time) * 10) / 10, resc = Math.max(0, Math.min(99, Math.round(Number(p.resc) || 0)));
      if (!name || TRACKS.indexOf(track) < 0 || !(time >= MIN_TIME[track] && time <= MAX_TIME)) return reply_(p, { error: 'dati non validi', boards: boards_() });
      const lock = LockService.getScriptLock(); lock.waitLock(10000);
      try {
        if (!claim_(name, String(p.k || ''))) return reply_(p, { error: 'nome già usato', taken: true, boards: boards_() });
        times_().appendRow([new Date(), name, track, time, resc]);
      } finally { lock.releaseLock(); }
      return reply_(p, { ok: true, boards: boards_() });
    }
    return reply_(p, boards_());
  } catch (err) {
    return reply_(p, { error: String(err) });
  }
}
