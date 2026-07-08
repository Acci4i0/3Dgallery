# 3Dgallery — rebuild study

Studio di ricostruzione 1:1 della digital exhibition **Foam Talent 2024**
([foam.org/talent-2024](https://www.foam.org/talent-2024)): una nuvola 3D di
fotografie navigabile in orbita, con intro tipografica, hover, focus con volo
di camera e sfondo colorato per opera.

![Screenshot della nuvola 3D](docs/screenshot.png)

## Stack

Lo stesso del sito originale, verificato nei suoi bundle di produzione:

- [three.js](https://threejs.org) r160 + [@react-three/fiber](https://github.com/pmndrs/react-three-fiber)
- [@react-three/drei](https://github.com/pmndrs/drei) (`OrbitControls`)
- [framer-motion](https://www.framer.com/motion/) 10.18 + framer-motion-3d
- [@use-gesture/react](https://use-gesture.netlify.app)
- Build con [Vite](https://vitejs.dev)

## Sviluppo

```bash
npm install
npm run dev       # server di sviluppo
npm run build     # build di produzione in dist/
npm run preview   # serve la build
```

## Struttura

```
gallery-data.js        i 20 frame (immagine, posizione, dimensioni, colori,
                       isPrimary) + le 8 slide dell'intro (INTRO_SLIDES)
public/img/            le fotografie (con _selection.json che documenta la
                       selezione casuale)
src/
  config.js            ogni costante di comportamento, con provenienza
                       ([bundle] / [bundle-default] / [CMS])
  App.jsx              pagina: canvas trasparente su sfondo animato, UI DOM
  Controls.jsx         OrbitControls + volo della camera in focus/unfocus
  Frame.jsx            frame della nuvola: billboard, hover, dissolvenze
  PrimaryFrame.jsx     frame primario: slideshow fullscreen + shrink dell'intro
  IntroTypography.jsx  titolo e sottotitolo dell'intro
  CursorIcon.jsx       cursore custom in focus (x / "enter portfolio")
  Detail.jsx           caption del frame in focus
  debug-slides.js      texture numerate per verificare lo slideshow
                       (flag DEBUG_INTRO_SLIDES in config.js, default false)
docs/                  screenshot per questo README
ANALYSIS.md            reverse engineering del sito originale
AUDIT.md               audit (storico) dell'implementazione precedente
```

## Come nasce

Ogni parametro numerico — easing, durate, damping, fattori di scala, posizioni
— è estratto dai bundle JavaScript del sito originale o dai suoi dati embedded,
mai stimato a occhio, e verificato contro il comportamento live. Il metodo e i
valori sono documentati in **[ANALYSIS.md](ANALYSIS.md)**;
**[AUDIT.md](AUDIT.md)** è il documento storico che motivò la riscrittura di
una prima implementazione (i riferimenti a file e righe sono di quella
codebase, non di questa).

## Comportamenti replicati

Intro (tipografia, slideshow fullscreen a 250 ms/passo, shrink verso la
nuvola), auto-rotate, orbita con damping, zoom dolly, hover (scala 1.1), focus
con volo di camera e sfondo colorato, cursore custom, unfocus, dissolvenza
verso il portfolio. Fuori scope: modalità filtri e navigazione alle pagine
artista del sito originale.

## Disclaimer

Questo è uno **studio didattico di ricostruzione**, non affiliato a Foam né
approvato da Foam. Concept e design originali © Foam Fotografiemuseum
Amsterdam. Nessun asset del sito originale (immagini, font, codice) è incluso:
le fotografie sono immagini personali dell'autore usate come contenuto
segnaposto.

## Licenza

[MIT](LICENSE) © Andrea ([Acci4i0](https://github.com/Acci4i0))
