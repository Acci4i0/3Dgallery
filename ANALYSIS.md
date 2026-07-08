# ANALYSIS.md — Reverse engineering di foam.org/talent-2024

Ogni valore in questo documento ha una provenienza esplicita:

- **[bundle]** — estratto dai chunk JS Next.js del sito originale (vedi §1)
- **[bundle-default]** — non specificato dal sito, quindi vale il default della libreria; il
  default è stato verificato *dentro il bundle stesso*, non assunto dalla documentazione
- **[CMS]** — dati embedded in `__NEXT_DATA__` nell'HTML della pagina (contenuti Storyblok)
- **[video]** — osservato nella registrazione `reference/original-behavior.mov` (308 frame
  estratti a 12 fps)

Nessun valore di questo documento è "a occhio". Le poche incertezze residue sono in §9.

---

## 1. Fonti

Il sito live è dietro un "Vercel Security Checkpoint" (challenge anti-bot), quindi HTML e
chunk sono stati recuperati dalla Wayback Machine in forma raw (modificatore `id_`):

| Risorsa | Snapshot | Note |
|---|---|---|
| `https://www.foam.org/talent-2024` (HTML + `__NEXT_DATA__`) | 2026-05-13 | 51 KB, buildId `LS5BdKg7qcu7e-PZF8gAW` |
| `chunks/pages/talent-2024-105d6d8207c0c01d.js` | 2025-11-18 | **il chunk con tutta la logica della pagina** (54 KB) |
| `chunks/fb7d5399-5add6e3e54d315ba.js` (id webpack 3737) | 2026-05-13 | three.js core, 702 KB |
| `chunks/4651-546385825eba7165.js` | 2026-05-13 | vendor: fiber + drei + framer-motion, 224 KB |
| `chunks/7210-1bf56d760b327dc0.js` | 2026-05-13 | framer-motion `createMotionValueAnimation` |

La registrazione (26.15 s, 2340×1244 @~20 fps) copre: idle con auto-rotate, drag orbitale
con inerzia, hover, due cicli completi di focus/unfocus. **Non** copre: intro, modalità
filtri, navigazione al portfolio, mobile.

Nota: la registrazione è un **ritaglio** del viewport (la caption in basso risulta tagliata
nei frame f0225–f0232), quindi le misure in pixel sul video sono usate solo come conferma
qualitativa; i numeri autorevoli vengono dal bundle.

## 2. Stack verificato [bundle]

| Libreria | Evidenza nel bundle |
|---|---|
| **three.js r160** | `REVISION` → `l="160"` nel chunk 3737 |
| **@react-three/fiber** | `Canvas` (`v.Xz`) con prop `flat`, hook `useThree`/`useFrame` (modulo 1300) |
| **@react-three/drei** | `OrbitControls` (modulo 30398), `Image` (modulo 83444, uniforms `imageBounds`/`zoom`/`grayscale`/`radius`), `CatmullRomLine` (modulo 33152) |
| **framer-motion 10.18.0** | semver `"10.18.0"` nel chunk 4651; `animate()` (modulo 12064), `useSpring` (4002), `AnimatePresence` (11544), `motion` DOM (51208) |
| **framer-motion-3d** | `motion.group` 3D (modulo 63362, `M.E.group`) |
| **@use-gesture/react** | `useGesture` (modulo 34751) per mousemove/drag DOM |
| styled-components | tutta la UI DOM |
| Next.js (pages router) + Storyblok CMS | `__NEXT_DATA__`, asset `a.storyblok.com` |

**Assenti**: GSAP = 0 occorrenze, Lenis = 0 occorrenze, in *tutti* i chunk.

**Architettura di rendering**: WebGL via react-three-fiber per la nuvola; DOM (styled-components
+ framer-motion) per cursore custom, caption, filtri, modali. Il canvas è trasparente: il
colore di fondo è il `background-color` di un `<div>` DOM animato, non `scene.background`.

## 3. Architettura della scena [bundle]

- `<Canvas flat camera={{position:[0,0,10]}}>` — camera prospettica a `(0,0,10)`;
  nessun altro parametro camera → **fov 75, near 0.1, far 1000** [bundle-default di fiber].
  `flat` = nessun tone mapping.
- `<ambientLight intensity={5}>` (irrilevante coi placeholder: drei `Image` usa uno shader unlit).
- Ogni talent è un **drei `<Image>`** (piano 1×1 scalato) dentro **due gruppi annidati**:
  - gruppo esterno = `motion.group` di framer-motion-3d → posizione/scala animate
  - gruppo interno = offset parallasse (attivo solo in modalità filtri, vedi §8)
- **Scala del piano** = `0.0015 × dimensioni_pixel` dell'immagine sorgente
  (es. 2000×1333 px → piano 3.0×2.0 unità). Il frame primario usa `0.00175`.
  Le dimensioni pixel sono parsate dall'URL Storyblok (`.../2000x1333/...`).
- **La nuvola è statica**: nessuna foto si muove in modalità nuvola. Si muove solo la camera.
- **Billboard**: a ogni tick (`useFrame`) ogni frame copia l'orientamento della camera:
  `rotation.setFromRotationMatrix(camera.matrix)` → le foto sono sempre parallele al piano
  di vista, da qualunque angolo si orbiti. (Con un filtro attivo la rotazione viene invece
  animata a `(0,0,0)` in 0.6 s.)
- Il frame con `isPrimary` sta a `(0,0,0)`; il target orbitale iniziale è `(0,0,0)`.

## 4. Dati CMS: i 20 frame [CMS]

Posizioni (unità mondo), dimensioni pixel (→ aspect ratio dei placeholder), colori:

| # | pos (x, y, z) | dim px | aspect | bg | highlight | isPrimary |
|---|---|---|---|---|---|---|
| 1 | (-4.5, 0, -12) | 2000×1484 | 1.348 | #ffffff | #E98822 | |
| 2 | (-13, 0.5, -8) | 1521×2126 | 0.715 | #ffffff | #CE584E | |
| 3 | (-7, -3.5, -5) | 2000×1391 | 1.438 | #F3FEC5 | #000000 | |
| 4 | (-12, -1, -15.5) | 2000×3001 | 0.666 | #f3f3f3 | #2362B7 | |
| 5 | (-6.25, -3.5, -11) | 2000×2500 | 0.800 | #FA86A9 | #ffffff | |
| 6 | (-2, -7, -12) | 2000×2605 | 0.768 | #ffffff | #83CE57 | |
| 7 | (5, -4, -14) | 2000×3016 | 0.663 | #907ED8 | #ffffff | |
| 8 | (6.5, -8, -10) | 2000×2998 | 0.667 | #000000 | #ffffff | |
| 9 | (7, -3, -4.5) | 2000×1125 | 1.778 | #1F1E4D | #ffffff | |
| 10 | (11, 2, -19) | 2000×3029 | 0.660 | #1E1E1E | #F9DCA1 | |
| 11 | (15.5, -1, -20) | 2000×2666 | 0.750 | #FAE9D7 | #194d25 | |
| 12 | (15, 2, -13) | 2000×2500 | 0.800 | #000000 | #d9d9d9 | |
| 13 | (0, 0, 0) | 2000×1333 | 1.500 | #f4efc9 | #3F6631 | ✔ |
| 14 | (-3, 8.5, -12) | 2000×1306 | 1.531 | #130506 | #FF3535 | |
| 15 | (4, 6, -9) | 2000×2500 | 0.800 | #E4EEFA | #FF6600 | |
| 16 | (-5, 4.5, -15) | 2000×2666 | 0.750 | #024442 | #ffffff | |
| 17 | (2, 4, -11) | 2000×1333 | 1.500 | #667643 | #EFE9D7 | |
| 18 | (-7, 4, -7) | 2000×2531 | 0.790 | #EFFDFD | *(null → #000)* | |
| 19 | (-10, 6, -5) | 2000×1891 | 1.058 | #FBE6DD | #263062 | |
| 20 | (7, 4, -5) | 2000×2095 | 0.955 | #ffffff | #39ff14 | |

Bounds: x ∈ [-13, 15.5], y ∈ [-8, 8.5], z ∈ [-20, 0]. Fallback dal bundle: bg `#fff`,
highlight `#000` se null. Dump completo: `frames-data.json` è ricavabile ripetendo
l'estrazione da `__NEXT_DATA__` (script in §1); le posizioni sopra sono complete.

**Attenzione all'offset z**: i frame non-primari montano a `z_CMS − 10` e si animano in
entrata a **`z_CMS + 2`** (vedi §7). La posizione *di riposo* è quindi `(x, y, z+2)`;
bounds effettivi a riposo: z ∈ [-18, +2].

## 5. Navigazione orbitale (drag, inerzia, zoom, auto-rotate) [bundle]

Tutto delegato a **drei/three `OrbitControls`**. Config esatta dal chunk pagina:

```
makeDefault, enabled:{dopo intro}, enablePan/Zoom/Rotate:{off se frame attivo},
zoomSpeed: 0.3, maxDistance: 30,
minPolarAngle: Math.PI/4.1, maxPolarAngle: Math.PI/1.1,
enableDamping: true, autoRotate:{off se filtro o frame attivo}, autoRotateSpeed: 0.2
```

Parametri non overridati, verificati come default nel codice OrbitControls presente nel
chunk 4651 [bundle-default]:

| Parametro | Valore | Evidenza |
|---|---|---|
| `dampingFactor` | **0.05** | `__publicField(..."dampingFactor", .05)` |
| `rotateSpeed` | **1** | default three r160 (stessa classe nel bundle) |
| `minDistance` | **0** | default |
| `zoomSpeed` default 1 → overridato a **0.3** | `__publicField(..."zoomSpeed", 1)` |
| `autoRotateSpeed` default 2 → overridato a **0.2** | `__publicField(..."autoRotateSpeed", 2)` |

Formule che ne derivano (dal codice OrbitControls nel bundle, sono le formule standard r160):

- **Drag → rotazione**: `Δangolo = 2π · Δpx / altezza_viewport · rotateSpeed(1)`
- **Damping/inerzia**: con `enableDamping`, a ogni tick `spherical += sphericalDelta · 0.05`
  e `sphericalDelta *= (1 − 0.05) = 0.95` → sia lo smoothing durante il drag sia il glide
  al rilascio decadono del 5% a frame. *Non* esiste velocity tracking separato.
- **Wheel/zoom (dolly)**: un evento wheel scala il raggio di `0.95^zoomSpeed = 0.95^0.3 ≈ 0.98466`
  per notch (immediato, non smussato), clampato a `[0, 30]`. Raggio iniziale: 10.
- **Auto-rotate**: `2π/60/60 · 0.2` rad/frame (≈ 0.02°/frame, un giro in 5 minuti),
  applicato **solo quando non si sta interagendo**, e solo se nessun filtro/frame attivo.
- **Polare clampato** a [π/4.1, π/1.1]; azimut libero (giro completo possibile).
- **Touch**: 1 dito = ROTATE, 2 dita = DOLLY_PAN [bundle]. Con filtro attivo: 1 dito = PAN,
  mouse LEFT si comporta da RIGHT (pan).

Conferma [video]: f0001→f0040 (3.25 s di idle) mostrano una deriva quasi impercettibile
(~1°), compatibile con autoRotateSpeed 0.2; i drag mostrano glide breve con arresto morbido.

**Cursori** (modalità nuvola): `grab` di default (da fine intro), `grabbing` durante
mousedown+move (handler DOM sul wrapper del canvas), `pointer` sopra una foto.

## 6. Hover su una foto (modalità nuvola) [bundle]

- **Solo scala, nessun movimento**: il `motion.group` esterno anima `scale: 1 → 1.1`.
- Transizione scala: **durata 0.5 s, ease cubic-bezier(0.05, 0.29, 0, 1)**.
- Al pointer-leave: ritorno a 1 con la stessa transizione.
- Disabilitato su mobile (media query `max-width` breakpoint small) e con intro non completa.
- Il cursore diventa `pointer`; nessun z-index/occlusione speciale, nessuna rivelazione nome
  in hover (il nome compare solo nel focus).

## 7. Click → focus → unfocus [bundle, confermato video]

### Apertura (click su una foto)

1. `document.body.style.cursor = "none"`; salvataggio `cameraPos.clone()` per il ritorno.
2. **La foto non si muove.** Si muovono camera e target dei controls, con tween
   indipendenti per componente (funzione `animateVector` del bundle):
   - `camera.position → posizione_live_del_frame + offset` — **durata 1.2 s,
     ease cubic-bezier(0.43, 0.19, 0.02, 1)**
   - `controls.target → posizione_live_del_frame` — stessi 1.2 s / stessa ease
   - **Offset di arrivo (solo asse z mondo)**: `r = 0.00125 × dim_px` dove `dim_px` è
     l'altezza pixel se l'immagine è portrait, la larghezza se landscape
     (su mobile il fattore è `0.002`). Segno: `-r` se l'azimut corrente
     `|azimuth| > 2` rad (camera oltre ~115°, arriva da dietro), altrimenti `+r`.
     Esempio: 2000×2666 → r = 3.33 unità → la foto (alta 4.0 unità) riempie ~78% del
     viewport in altezza, indipendentemente dalla finestra.
3. **Le altre 19 foto**: `opacity 1 → 0`, durata 1 s, ease (0.43, 0.19, 0.02, 1).
4. **Sfondo**: il div DOM anima `background-color` al `frameBackgroundColor` del CMS,
   **durata 0.2 s, ease linear**.
5. Rotate/zoom/pan e auto-rotate disabilitati finché il frame è attivo.
6. La scala hover si resetta a 1 al click (lo stato hover viene azzerato).
7. Il billboard continua: la foto resta perfettamente frontale alla camera.

### UI in focus (DOM, non WebGL)

- **CursorIcon** segue il mouse (via `useGesture onMove` sul container):
  - fuori dalla foto: box **35×35 px** con icona ×, bordo e colore = `frameHighlightColor`,
    offset dal mouse `(-17.5, -17.5)`
  - sopra la foto: pill **202×40 px** "enter portfolio", sfondo = `frameBackgroundColor`,
    bordo/testo = `frameHighlightColor`, offset `(-101, -20)`
  - ingresso: fade opacity 0→1, durata 1 s, ease (0.43, 0.19, 0.02, 1);
    su mousedown scala a 0.8 (stessa transizione)
- **Detail** (in basso, centrato, `bottom: 20px`): `exhibitionName` in *corsivo* (16 px)
  sopra, `artistName` sotto (16 px), colore = `frameHighlightColor`;
  fade-in con **delay 1 s, durata 1 s**, ease (0.43, 0.19, 0.02, 1).
  Su mobile compare anche un bottone "view this project" (351×40) e una × fissa in alto.

### Secondo click sulla foto attiva → transizione al portfolio

Tutte le mesh della scena fanno fade `opacity → 0` in **1 s linear**, poi
`router.push(slug)` verso la pagina artista. (Fuori scope della registrazione: la
navigazione avviene subito dopo il fade.)

### Chiusura (click fuori dalla foto attiva — "pointer missed")

- `camera.position → posizione salvata al click` — 1.2 s, ease (0.43, 0.19, 0.02, 1)
- `controls.target → (0, 0, -10)` — **quirk reale del bundle**: il target NON torna al
  valore iniziale (0,0,0) ma va al centro-nuvola (0,0,-10). Dopo il primo ciclo di
  focus/unfocus il pivot dell'orbita resta lì.
- Altre foto: `opacity → 1`, 1 s; sfondo → bianco, 0.2 s linear; cursore → `grab`.

Timeline nella registrazione [video]: primo focus ~f0212–f0246 (foto b/n "autobiographies"
di Ricardo Nagaoka, sfondo #024442), unfocus, secondo focus ~f0275–f0295 (Ramos-Woodard,
sfondo #EFFDFD), unfocus, fine su nuvola.

## 8. Comportamenti fuori dalla registrazione (documentati per completezza) [bundle]

- **Intro** (non presente nel video di riferimento; verificata in seguito anche sul
  **sito live con hard refresh** via Chrome headless — vedi note [live] sotto):
  1. Lo sfondo iniziale è **nero** [bundle, confermato live]. Il reveal del titolo è un
     **fade del contenitore** (delay 2 s, durata 3 s, ease (0.43,0.19,0.02,1)) combinato
     con la **crescita per-lettera via CSS** (2000 ms `forwards`, delay `(indice+5)·200ms`
     con indice 1-based → prima lettera a 1.2 s; font-size 64→130 px desktop, assi
     variabili WTUN 300→600 / WTSP 100→500 del font PurpleHaze; base 44 px prima
     dell'avvio) — **niente mask, niente slide** [bundle, confermato live].
  2. Testo "TALENT" + payoff "artists shaping the future of photography"
     (fade per carattere: delay `2 + 0.25·parola + 0.05·carattere` s, durata 1 s,
     ease easeInOut; blocco parole largo 180 px, 18 px, che va a capo) [bundle].
  3. Al completamento dell'ultimo carattere, `playIntro` → monta la nuvola. Il frame
     primario parte **fullscreen** (dimensioni del viewport a z=0) e fa uno slideshow
     di **8 immagini dedicate** (`/overview_intro_frames/overview_frame_1..8.jpeg`,
     precaricate con `<link rel="preload">`) a **250 ms/step** — misurato anche live
     via CDP screencast: 8 immagini distinte, gap 288–463 ms (timer 250 ms + jank di
     caricamento texture) — con la tipografia ancora sopra; al passo 2 lo
     sfondo va al bianco (0.2 s linear) e la tipografia **esce con un fade**
     (delay 1.5 s, durata 1 s) — **il titolo non persiste dopo l'intro** [bundle,
     confermato live]. Al passo 7, con tutte le immagini caricate, il piano fullscreen
     **si restringe** alle dimensioni finali (fattore 0.00175) in **1.2 s, delay 1.5 s,
     ease (0.65, 0.03, 0, 1)**. La camera non si muove mai: lo "zoom-out" percepito è
     questo shrink.
  4. Gli altri frame montano a `z_CMS − 10` e volano a `z_CMS + 2`:
     **durata 1.2 s, delay 3.5 s, ease (0.65, 0.03, 0, 1)** (delay 0 e ease
     (0.43,0.19,0.02,1) nei re-render successivi all'intro).
  5. Controls abilitati (`enabled` = canAutoRotate) e auto-rotate **1500 ms dopo la
     schedulazione dello shrink** (= al suo avvio); rotate/zoom/pan e cursore `grab`
     a shrink completato (isIntroComplete).
  6. [live] Le durate osservate sul sito si allungano rispetto ai timing del codice
     perché slideshow e shrink sono gated sul **caricamento reale delle immagini**
     (drei `Image` sospende via Suspense; gate `allFramesLoaded`); a cache calda la
     sequenza converge ai timing del codice. Con i placeholder il gate è immediato.
- **Modalità filtri** (bottoni in basso a destra): sfondo → nero (0.2 s), i frame col
  filtro selezionato si muovono verso posizioni per-filtro dal CMS (1.2 s), il billboard
  si spegne (rotazione → (0,0,0) in 0.6 s), linee rosse `CatmullRomLine`
  (`tension 10, lineWidth 1–2`, fade-in 1 s delay 1 s) collegano le posizioni, e il mouse
  applica una parallasse al gruppo interno tramite **`useSpring {damping: 20, restDelta:
  0.001}`** (stiffness default 100) con mappatura `((x/vw) − 0.1·distanza)/10`.
  È l'**unica** parallasse da mouse del sito: in modalità nuvola non ce n'è.
- **Resize**: gestito da fiber (aspect/proiezione automatici); nessuna logica custom.

## 9. Incertezze residue

| Punto | Stato |
|---|---|
| `fov` | Non impostato nel bundle → default fiber **75**. Non verificabile al percento sul video perché la registrazione è ritagliata (§1), ma nessun altro valore è presente nel codice. |
| Versione esatta di drei | Non stampata nel bundle. Le firme (`Image` con `radius`, OrbitControls con `__publicField`) collocano una release 9.9x, coerente con three r160. Non influisce sui parametri, che sono tutti espliciti. |
| Posizioni per-filtro e slideshow intro | Dati CMS non tutti estratti (fuori scope della registrazione). Estraibili da `__NEXT_DATA__` se servirà la modalità filtri. |
| Piccole differenze di timing percepito nel video (~20 fps di cattura) | Il video conferma sequenze e ordini di grandezza; i numeri esatti restano quelli del bundle. |
