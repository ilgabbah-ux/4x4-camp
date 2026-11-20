# Sorgente del gioco — LEGGERE PRIMA DI PUBBLICARE

`src/game.html` è **l'unico sorgente valido** del gioco. `index.html` si costruisce da qui.

Regola per chiunque (persone o sessioni Claude) pubblichi una versione:

1. `git pull` e partire **sempre** da `src/game.html` di questo repo, mai da una copia locale o da uno zip vecchio.
2. Modificare `src/game.html`, alzare il numero in «versione N» (deve essere più alto di quello online).
3. Costruire (`build.py` con immagini, modelli e voci dello zip sorgente in archivio; poi `pubblica3d.sh`) e fare commit **insieme** di `index.html` e `src/game.html`.

Il 19/11/2026 una pubblicazione fatta da un sorgente vecchio (v144) ha cancellato dal sito le versioni 145–149; sono state rimesse con la v150.

## Livelli ricavati da tracce GPS vere (dalla v151)

Rivoli-Pinerolo Easy (`colle`), Mulino Val (`bassa`) e Cima Mares (`mares`) hanno curve e pendenze prese da tracce GPX.

- `gpx2level.py traccia.gpx livelli-gpx/<id>.json` stampa la tabella delle curve (`cx`) e le pendenze delle zone da incollare in `TRACKS` dentro `game.html`.
- La traccia viene compressa sulla lunghezza del livello; il dislivello è esagerato in verticale finché la zona più ripida arriva a `max_sl`.
- Il tipo di fondo delle zone (fango, guadi, pietraie) resta scelto a mano: il GPX non lo dice.
- I file GPX non stanno nel repo.
- Un percorso con `cx` non usa più `ph`/`amp`; il suo fantasma si salva con il suffisso `_gpx`.
- La classifica online accetta `mares` solo dopo aver ripubblicato `classifica/Codice.gs` come Apps Script.
