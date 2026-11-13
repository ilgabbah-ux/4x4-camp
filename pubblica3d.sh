#!/bin/sh
# Costruisce la pagina del gioco 3D (index.html) dal build in ../camp3d
set -e
HEAD='<!doctype html>\n<html lang="it">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<meta name="theme-color" content="#121914">\n<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-title" content="4x4 Camp">\n<link rel="icon" type="image/png" href="favicon.png">\n<link rel="apple-touch-icon" href="apple-touch-icon.png">\n<link rel="manifest" href="manifest.webmanifest">\n<meta property="og:title" content="4x4 Camp: Ridotte Inserite">\n<meta property="og:image" content="https://ilgabbah-ux.github.io/4x4-camp/logo-ridotte-inserite.png">\n</head>\n<body>\n'
{ printf "$HEAD"; cat ../camp3d/build.html; printf '\n</body>\n</html>\n'; } > index.html
