# Sorgente del gioco — LEGGERE PRIMA DI PUBBLICARE

`src/game.html` è **l'unico sorgente valido** del gioco. `index.html` si costruisce da qui.

Regola per chiunque (persone o sessioni Claude) pubblichi una versione:

1. `git pull` e partire **sempre** da `src/game.html` di questo repo, mai da una copia locale o da uno zip vecchio.
2. Modificare `src/game.html`, alzare il numero in «versione N» (deve essere più alto di quello online).
3. Costruire (`build.py` con immagini, modelli e voci dello zip sorgente in archivio; poi `pubblica3d.sh`) e fare commit **insieme** di `index.html` e `src/game.html`.

Il 19/11/2026 una pubblicazione fatta da un sorgente vecchio (v144) ha cancellato dal sito le versioni 145–149; sono state rimesse con la v150.
