#!/usr/bin/env python3
"""Costruisce index.html (il sito su GitHub Pages) da src/game.html.

Tutto quello che serve sta nel repo: non occorre più lo zip sorgente.
  src/game.html            il gioco, unico sorgente da modificare
  src/embed/               file incorporati nella pagina (fuoristrada base, loghi, foto del menù, Terrano)
  src/embed/img/*.webp     card dei percorsi (trk_<id>), garage, arrivo, icone dei ricambi (ic_<pezzo>)
  voci/*.mp3               voci: nella pagina finisce solo l'elenco dei nomi

Uso, dalla radice del repo:  python3 src/build.py      (aggiungere --check per controllare senza scrivere)
"""
import base64, glob, json, os, sys

SRC = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(SRC)
EMB = os.path.join(SRC, 'embed')
HEAD = '<!doctype html>\n<html lang="it">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<meta name="theme-color" content="#121914">\n<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-title" content="4x4 Camp">\n<link rel="icon" type="image/png" href="favicon.png">\n<link rel="apple-touch-icon" href="apple-touch-icon.png">\n<link rel="manifest" href="manifest.webmanifest">\n<meta property="og:title" content="4x4 Camp: Ridotte Inserite">\n<meta property="og:image" content="https://ilgabbah-ux.github.io/4x4-camp/logo-ridotte-inserite.png">\n</head>\n<body>\n'
TAIL = '\n<script src="autoupdate.js"></script>\n</body>\n</html>\n'


def uri(path, mime):
    return 'data:' + mime + ';base64,' + base64.b64encode(open(os.path.join(EMB, path), 'rb').read()).decode()


def build():
    s = open(os.path.join(SRC, 'game.html'), encoding='utf-8').read()
    voci = sorted(os.path.basename(f)[:-4] for f in glob.glob(os.path.join(ROOT, 'voci', '*.mp3')))
    imgs = {os.path.basename(f)[:-5]: uri(os.path.join('img', os.path.basename(f)), 'image/webp')
            for f in sorted(glob.glob(os.path.join(EMB, 'img', '*.webp')))}
    rep = {"'__VOCI__'": json.dumps(voci),
           "'__IMGS__'": json.dumps(imgs),
           "'__TRUCK__'": "'" + uri('fuoristrada.glb', 'model/gltf-binary') + "'",
           "'__TERRANO__'": "'" + uri('terrano_gabbah.glb', 'model/gltf-binary') + "'",
           "'__LOGO__'": "'" + uri('logo.webp', 'image/webp') + "'",
           "'__LOGORI__'": "'" + uri('logo_ri.webp', 'image/webp') + "'",
           "'__LOGO4__'": "'" + uri('logo4.webp', 'image/webp') + "'",
           "'__HERO__'": "'" + uri('hero_emb.webp', 'image/webp') + "'"}
    for k, v in rep.items():
        if s.count(k) != 1:
            sys.exit('segnaposto %s trovato %d volte in game.html' % (k, s.count(k)))
        s = s.replace(k, v)
    return HEAD + s + TAIL


if __name__ == '__main__':
    out = build()
    dst = os.path.join(ROOT, 'index.html')
    if '--check' in sys.argv:
        old = open(dst, encoding='utf-8').read()
        print('index.html è aggiornato' if old == out else 'index.html è DIVERSO dal build di src/game.html')
        sys.exit(0 if old == out else 1)
    open(dst, 'w', encoding='utf-8').write(out)
    print('index.html scritto: %d caratteri' % len(out))
