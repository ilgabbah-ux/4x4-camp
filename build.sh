#!/bin/sh
# Costruisce index.html per GitHub Pages dal file del gioco (senza scheletro) in ../ridotte/index.html
SRC=${1:-../ridotte/index.html}
{
printf '<!doctype html>\n<html lang="it">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<meta name="theme-color" content="#121914">\n<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-title" content="4x4 Camp">\n<link rel="icon" type="image/png" href="favicon.png">\n<link rel="apple-touch-icon" href="apple-touch-icon.png">\n<meta property="og:image" content="https://ilgabbah-ux.github.io/4x4-camp/logo-ridotte-inserite.png">\n<style>*,*::before,*::after{box-sizing:border-box}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%%}</style>\n</head>\n<body>\n'
cat "$SRC"
printf '\n</body>\n</html>\n'
} > index.html
