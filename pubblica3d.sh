#!/bin/sh
# Costruisce la versione 3D (pagina principale) e la versione classica 2D in classico/
set -e
HEAD='<!doctype html>\n<html lang="it">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<meta name="theme-color" content="#121914">\n<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-title" content="4x4 Camp">\n<link rel="icon" type="image/png" href="%sfavicon.png">\n<link rel="apple-touch-icon" href="%sapple-touch-icon.png">\n<meta property="og:title" content="4x4 Camp · Ridotte inserite">\n<meta property="og:image" content="https://ilgabbah-ux.github.io/4x4-camp/logo-ridotte-inserite.png">\n</head>\n<body>\n'
{ printf "$HEAD" "" ""; cat ../camp3d/build.html; printf '\n</body>\n</html>\n'; } > index.html
mkdir -p classico
{ printf "$HEAD" "../" "../"; sed "s#const BOARD_URL=/github#const BOARD_URL=false\&\&/github#" ../ridotte/index.html; printf '\n</body>\n</html>\n'; } > classico/index.html
cp ../camp3d/game.html sorgente-3d.html
printf '<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=../"><a href="../">4x4 Camp</a>\n' > prova-3d/index.html
rm -f prova-3d/sorgente.html
