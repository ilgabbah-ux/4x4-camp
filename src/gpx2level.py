#!/usr/bin/env python3
"""Ricava curve e pendenze di un livello di 4x4 Camp da una traccia GPX.

Il gioco ha una pista lunga qualche centinaio di metri che corre lungo un asse:
qui la traccia vera viene compressa su quella lunghezza.
 - curve: scostamento laterale della traccia rispetto alla sua linea media
   (destra vera = destra nel gioco), tabella `cx` campionata ogni 2 m;
 - pendenze: per ogni zona, il dislivello vero del tratto corrispondente,
   esagerato in verticale finché la zona più ripida arriva al massimo scelto.

Uso: gpx2level.py traccia.gpx config.json  -> stampa JSON con cx e pendenze
"""
import json, math, re, sys

K = 1.3            # il gioco allunga zone e lunghezza di 1.3 al caricamento
STEP = 2.0         # passo della tabella cx (m di gioco)
PRE, POST = 40, 200  # metri di tabella prima della partenza e dopo l'arrivo


def load(path):
    t = open(path, encoding='utf-8', errors='replace').read()
    return [(float(a), float(b), float(e)) for a, b, e in re.findall(
        r'<trkpt\s+lat="([-\d.]+)"\s+lon="([-\d.]+)"[^>]*>\s*<ele>([-\d.]+)</ele>', t)]


def to_xy(pts):
    la0 = math.radians(sum(p[0] for p in pts) / len(pts))
    return [(math.radians(p[1]) * 6371000 * math.cos(la0), math.radians(p[0]) * 6371000, p[2]) for p in pts]


def cumdist(xy):
    d = [0.0]
    for a, b in zip(xy, xy[1:]):
        d.append(d[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
    return d


def sampler(xy, d):
    """Funzione dist -> (x, y, quota) con interpolazione lineare."""
    def f(q):
        q = min(max(q, 0.0), d[-1])
        lo, hi = 0, len(d) - 1
        while hi - lo > 1:
            m = (lo + hi) // 2
            if d[m] <= q: lo = m
            else: hi = m
        w = 0 if d[hi] == d[lo] else (q - d[lo]) / (d[hi] - d[lo])
        return tuple(xy[lo][k] + (xy[hi][k] - xy[lo][k]) * w for k in range(3))
    return f


def smooth(v, r):
    if r < 1: return list(v)
    out = []
    for i in range(len(v)):
        a, b = max(0, i - r), min(len(v), i + r + 1)
        out.append(sum(v[a:b]) / (b - a))
    return out


def lateral(f, D, L, win, amp, max_dx, max_ddx):
    """Scostamento laterale (m di gioco) ogni STEP metri, da 0 a L."""
    n = int(round(L / STEP)) + 1
    P = [f(D * i / (n - 1)) for i in range(n)]
    r = max(1, int(round(win / STEP / 2)))
    cx_, cy_ = smooth([p[0] for p in P], r), smooth([p[1] for p in P], r)
    cx_, cy_ = smooth(cx_, r), smooth(cy_, r)          # due passate: linea media morbida
    lat = []
    for i in range(n):
        a, b = max(0, i - 1), min(n - 1, i + 1)
        tx, ty = cx_[b] - cx_[a], cy_[b] - cy_[a]
        m = math.hypot(tx, ty) or 1.0
        tx, ty = tx / m, ty / m
        ox, oy = P[i][0] - cx_[i], P[i][1] - cy_[i]
        lat.append(ox * ty - oy * tx)                   # positivo = a destra del senso di marcia
    lat = smooth(lat, 1)
    srt = sorted(abs(v) for v in lat)
    ref = srt[int(len(srt) * .97)] or 1.0
    x = [max(-amp * 1.25, min(amp * 1.25, v / ref * amp)) for v in lat]
    # guidabilità: finché curva o inclinazione laterale sono troppo strette, liscia e riprova
    for _ in range(60):
        dx = max(abs(x[i + 1] - x[i]) / STEP for i in range(n - 1))
        ddx = max(abs(x[i + 1] - 2 * x[i] + x[i - 1]) / STEP ** 2 for i in range(1, n - 1))
        if dx <= max_dx and ddx <= max_ddx: break
        x = smooth(x, 1)
    # partenza e arrivo: si entra e si esce senza gradini, poi si rifinisce tutta la tabella
    ss = lambda t: (lambda q: q * q * (3 - 2 * q))(min(1.0, max(0.0, t)))
    tab = [0.0] * int(PRE / STEP) + [x[i] * ss(i * STEP / 30.0) for i in range(n)]
    tab += [x[-1] * (1 - ss(j * STEP / 60.0)) for j in range(1, int(POST / STEP) + 1)]
    for _ in range(200):
        ddx = max(abs(tab[i + 1] - 2 * tab[i] + tab[i - 1]) / STEP ** 2 for i in range(1, len(tab) - 1))
        dx = max(abs(tab[i + 1] - tab[i]) / STEP for i in range(len(tab) - 1))
        if dx <= max_dx and ddx <= max_ddx: break
        tab = smooth(tab, 1)
    dx = max(abs(tab[i + 1] - tab[i]) / STEP for i in range(len(tab) - 1))
    ddx = max(abs(tab[i + 1] - 2 * tab[i] + tab[i - 1]) / STEP ** 2 for i in range(1, len(tab) - 1))
    return tab, dx, ddx


def slopes(f, D, zones, length, max_sl, ewin):
    """Pendenza di ogni zona dal profilo vero (zone e length in unità pre-scala)."""
    n = 400
    E = smooth([f(D * i / n)[2] for i in range(n + 1)], max(1, int(n * ewin / D / 2)))
    ele = lambda u: E[min(n, max(0, int(round(u * n))))]
    raw = []
    for z in zones:
        if z['a'] >= length or z is zones[-1]: raw.append(0.0); continue
        ua, ub = z['a'] / length, min(1.0, z['b'] / length)
        raw.append((ele(ub) - ele(ua)) / ((min(z['b'], length) - z['a']) * K))
    lim = {'acqua': 0.0, 'fangoProf': .03, 'ghiaccio': .12}
    free = [abs(g) for g, z in zip(raw, zones) if z['t'] not in lim and z is not zones[-1]]
    v = max_sl / (max(free) or 1.0)                     # esagerazione verticale
    out = []
    for g, z in zip(raw, zones):
        s = g * v
        if z['t'] in lim: s = max(-lim[z['t']], min(lim[z['t']], s))
        if z['t'] == 'fangoProf': s = min(s, z.get('sl0', .01))   # nel fango profondo in salita ci si pianta: mai più ripido di prima
        if z['t'] == 'fango': s = max(-.12, min(.2, s))
        out.append(round(max(-.2, min(max_sl, s)), 3))
    return out, v, E[0], E[-1], min(E), max(E)


def main():
    cfg = json.load(open(sys.argv[2]))
    pts = load(sys.argv[1])
    a, b = cfg.get('from', 0), cfg.get('to', len(pts) - 1)
    xy = to_xy(pts[a:b + 1]); d = cumdist(xy); f = sampler(xy, d); D = d[-1]
    L = round(cfg['len'] * K)
    drive = cfg['zones'][-1]['a']                       # la traccia finisce dove comincia lo spiazzo del campo
    Lr = round(drive * K)
    tab, dx, ddx = lateral(f, D, Lr, cfg.get('win', 110), cfg.get('amp', 9), cfg.get('max_dx', .55), cfg.get('max_ddx', .05))
    sl, v, e0, e1, emin, emax = slopes(f, D, cfg['zones'], drive, cfg['max_sl'], cfg.get('ewin', 300))
    h = sum(s * (z['b'] - z['a']) * K for s, z in zip(sl, cfg['zones']))
    json.dump({'km': round(D / 1000, 1), 'compress': round(D / L, 1), 'slope_x': round(v * D / L, 1),
               'ele': [round(e0), round(e1), round(emin), round(emax)], 'game_len': L, 'game_climb': round(h, 1),
               'cx_max': round(max(abs(t) for t in tab), 1), 'dx_max': round(dx, 2), 'ddx_max': round(ddx, 3),
               'slopes': sl, 'cx': {'o': -PRE, 'd': STEP, 'v': [round(t, 1) for t in tab]}}, sys.stdout)


if __name__ == '__main__':
    main()
