# Sorgente del gioco — LEGGERE PRIMA DI PUBBLICARE

`src/game.html` è **l'unico sorgente valido** del gioco. `index.html` si costruisce da qui.

Regola per chiunque (persone o sessioni Claude) pubblichi una versione:

1. `git pull` e partire **sempre** da `src/game.html` di questo repo, mai da una copia locale o da uno zip vecchio.
2. Modificare `src/game.html`, alzare il numero in «versione N» (deve essere più alto di quello online).
3. Costruire dalla radice del repo con `python3 src/build.py` (scrive `index.html`) e fare commit **insieme** di `index.html` e `src/game.html`. `python3 src/build.py --check` dice se `index.html` corrisponde al sorgente.

Dalla v154 tutto quello che serve al build sta nel repo, lo zip sorgente non serve più:

- `src/embed/`: fuoristrada base, loghi, foto del menù, Terrano (incorporati nella pagina);
- `src/embed/img/`: card dei percorsi (`trk_<id>.webp`, 540×360), garage, arrivo, icone dei ricambi (`ic_<pezzo>.webp`);
- `voci/*.mp3`: nella pagina finisce solo l'elenco dei nomi.

Per aggiungere una card o un'icona basta mettere il file in `src/embed/img/` e ricostruire.

Il 19/11/2026 una pubblicazione fatta da un sorgente vecchio (v144) ha cancellato dal sito le versioni 145–149; sono state rimesse con la v150.

## Livelli ricavati da tracce GPS vere (dalla v151)

Rivoli-Pinerolo Easy (`colle`), Mulino Val (`bassa`) e Cima Mares (`mares`) hanno curve e pendenze prese da tracce GPX.

- `gpx2level.py traccia.gpx livelli-gpx/<id>.json` stampa la tabella delle curve (`cx`) e le pendenze delle zone da incollare in `TRACKS` dentro `game.html`.
- La traccia viene compressa sulla lunghezza del livello; il dislivello è esagerato in verticale finché la zona più ripida arriva a `max_sl`.
- Il tipo di fondo delle zone (fango, guadi, pietraie) resta scelto a mano: il GPX non lo dice.
- I file GPX non stanno nel repo.
- Un percorso con `cx` non usa più `ph`/`amp`; il suo fantasma si salva con il suffisso `_gpx`.
- La classifica online accetta `bandito` e `mares`, e scarta i tempi vecchi di `colle` e `bassa`, solo dopo aver ripubblicato `classifica/Codice.gs` come Apps Script.
- `peak:1` su un percorso apre la vetta: ultimo tratto in cresta e campo su una cupola senza pareti di roccia intorno.

## Vista abitacolo (dalla v157)

L'interno è fatto di pezzi modellati con Higgsfield (foto di riferimento → Tripo H3.1, alleggeriti con gltf-transform: weld, simplify, texture 512/1024 jpeg, quantize):

- `asset/plancia.glb`, `volante.glb`, `porta.glb`, `specchio.glb`, `montante.glb`, `aletta.glb`, `retrovisore.glb`, `inclinometro.glb`; porta, specchio, montante e aletta sono un lato solo, l'altro è specchiato (`both`).
- `tex/abit_cielo.jpg`, `abit_moquette.jpg`, `abit_plastica.jpg`: texture ripetibili per le superfici piatte.
- Si scaricano la prima volta che si entra in abitacolo (`ckpit.loadDash`). Se un file manca resta il pezzo di riserva costruito a codice (gruppi `userData.dash` 1–6 dentro `ckpit`).
- Posizioni e scale dei modelli sono numeri in `loadDash`: se si rigenera un modello vanno rimisurati (contachilometri e contagiri veri sono dischi messi sopra quelli dipinti nella plancia).
- In abitacolo la camera si inclina col mezzo (`cam.up` segue `st.q`); fango e tergicristalli sono allineati alla base del parabrezza al 60% dell'altezza dello schermo.
