# AUDIT.md — Audit dell'implementazione precedente (documento storico)

> **Nota**: questo documento fotografa la codebase *precedente* alla riscrittura
> (three.js vanilla + GSAP) e motiva le scelte della versione attuale. I
> riferimenti a file e righe (`src/main.js`, `src/field.js`, …) sono di quella
> codebase e non esistono più nel repo: sono conservati come documentazione
> delle divergenze che hanno portato alla riscrittura.

Riferimenti: i comportamenti e i parametri "originale" citati qui sono quelli verificati in
[ANALYSIS.md](ANALYSIS.md) (bundle + video).

## 1. Com'è implementato oggi

**Stack attuale**: Vite + three.js 0.178 vanilla + GSAP 3.12. Un solo entry point
([src/main.js](src/main.js), 547 righe) con orbita custom scritta a mano, più
[src/field.js](src/field.js) (layout della nuvola), [src/placeholder.js](src/placeholder.js)
(piani neri), [src/palette.js](src/palette.js) (colori derivati algoritmicamente),
[gallery-data.js](gallery-data.js) (24 voci), UI in [index.html](index.html).

**Modello di movimento attuale** ([src/main.js:13-54](src/main.js#L13-L54)):

- Orbita sferica custom (theta/phi/radius) attorno a (0,0,0), raggio iniziale 60,
  clamp [18, 110], fov 50.
- Drag → delta angolare `2π·Δpx/vh` con velocity tracking manuale; al rilascio glide con
  decadimento `×0.95` per frame ([src/main.js:491-501](src/main.js#L491-L501)).
- Auto-rotate `0.2` con formula OrbitControls ([src/main.js:52](src/main.js#L52)).
- Wheel → zoom esponenziale `exp(deltaY·0.0012)` lerpato con fattore 0.12
  ([src/main.js:438](src/main.js#L438), [507](src/main.js#L507)).
- Parallasse da mouse sulla camera in modalità nuvola (amp 2.5, lerp 0.05)
  ([src/main.js:531-536](src/main.js#L531-L536)).
- Hover → la foto **si sposta verso la camera** (frazione 0.68 della distanza, tween GSAP
  2.8 s / ritorno 1.2 s) ([src/main.js:453-489](src/main.js#L453-L489)).
- Click → **la foto vola davanti alla camera** a distanza fissa 34, scala "contain" in un
  box 60%×55% del viewport, timeline GSAP 1.25 s `power3.inOut`; sfondo `scene.background`
  animato in 0.55 s; le altre foto fade-out 0.55 s ([src/main.js:206-297](src/main.js#L206-L297)).
- Layout: griglia jitterata + permutazione di profondità, altezze 4–15 e aspect 0.6–1.8
  casuali con RNG seedato ([src/field.js:95-133](src/field.js#L95-L133)).
- Nessun billboard: i piani hanno rotazione fissa (0,0,0) finché non vengono focalizzati.

## 2. Divergenze dal comportamento originale

Legenda verdetto: ❌ = da riscrivere, ⚠️ = giusto in parte, ✅ = combacia.

| Comportamento | Originale (bundle/video) | Attuale | Verdetto |
|---|---|---|---|
| Stack | React + r3f + drei OrbitControls + framer-motion(-3d) + use-gesture; **niente GSAP** | three vanilla + GSAP + orbita custom | ❌ |
| Rendering sfondo | div DOM animato, canvas trasparente, 0.2 s linear | `scene.background`, 0.55 s `power2.inOut` | ❌ |
| Orientamento foto | **billboard a ogni frame** (`setFromRotationMatrix(camera.matrix)`) | rotazione fissa → di lato si vedono di taglio | ❌ (divergenza strutturale: è il motivo per cui la nuvola attuale "funziona" solo frontalmente) |
| Layout nuvola | 20 posizioni **fisse dal CMS** (§4 di ANALYSIS), riposo a `z+2`, primario a (0,0,0) | griglia jitterata casuale, 24 elementi, bounds riscalati ×6 | ❌ |
| Scala mondo | camera (0,0,10), fov 75, raggio 10, maxDistance 30 | raggio 60, fov 50, clamp [18,110] | ❌ (la scala del riferimento è direttamente utilizzabile: non serviva riscalare) |
| Dimensioni foto | `0.0015 × px` (primario `0.00175`) | altezza casuale 4–15, aspect casuale | ❌ |
| Drag/inerzia | OrbitControls `enableDamping`, dampingFactor 0.05 (smoothing anche durante il drag) | delta diretto + velocity custom, decay 0.95 | ⚠️ (il decay al rilascio equivale a 1−0.05, ma manca lo smoothing in presa e il feel del drag è diverso) |
| Zoom | dolly istantaneo `0.95^0.3` per notch, range [0, 30] | zoom esponenziale lerpato (0.0012 / lerp 0.12), range [18, 110] | ❌ |
| Auto-rotate | 0.2, sospeso durante l'interazione | 0.2, ma sommato **anche durante il drag** ([src/main.js:505](src/main.js#L505)) | ⚠️ |
| Clamp polare | [π/4.1, π/1.1] | identico ([src/main.js:43-44](src/main.js#L43-L44)) | ✅ |
| Parallasse mouse in nuvola | **non esiste** (solo in modalità filtri) | camera segue il mouse (amp 2.5) | ❌ (da rimuovere) |
| Hover | solo `scale 1→1.1`, 0.5 s, bezier (.05,.29,0,1) | la foto si sposta verso la camera (2.8 s) | ❌ |
| Click → focus | **si muove la camera** (1.2 s, bezier (.43,.19,.02,1)), arrivo a `0.00125×px` dal piano; la foto resta ferma | si muove **la foto** verso la camera (1.25 s `power3.inOut`), fit 60%×55% viewport | ❌ (inversione strutturale del modello) |
| Fade altre foto | 1 s, bezier (.43,.19,.02,1) | 0.55 s `power2.out` | ❌ |
| Colori focus | `frameBackgroundColor`/`frameHighlightColor` per-item dal CMS | palette derivata algoritmicamente ([src/palette.js](src/palette.js)) | ❌ (coi placeholder: colori per-item nei dati, non derivati) |
| Caption | `exhibitionName` corsivo + `artistName`, colore highlight, delay 1 s / durata 1 s | una sola `descrizione`, delay 0.45 s / 0.5 s | ❌ |
| Cursore focus | × in box 35×35, pill "enter portfolio" 202×40, colori CMS, press-scale 0.8, fade 1 s | pill 16px/56px e × 56×56 con colori derivati, transition CSS 0.15 s | ❌ |
| Unfocus | camera → posizione salvata (1.2 s), target → (0,0,-10) (quirk reale) | la foto torna a casa (0.9 s) | ❌ |
| Secondo click sulla foto attiva | fade totale 1 s linear → naviga al portfolio | TODO vuoto ([src/main.js:423-424](src/main.js#L423-L424)) | ⚠️ (per questo progetto: basta il fade, senza navigazione) |
| Touch | 1 dito ROTATE / 2 dita DOLLY_PAN (OrbitControls) | pinch custom + drag | ⚠️ |
| Resize | fiber automatico | handler manuale corretto | ✅ (concetto) |
| Intro / modalità filtri | presenti nell'originale, assenti nella registrazione | assenti | — (fuori scope, vedi nota sotto) |

Nota di fondo: quasi tutti i commenti in [src/main.js](src/main.js) e
[src/field.js](src/field.js) dichiarano valori "misurati dai bundle" ma poi li riscalano
o li reinterpretano (es. [src/field.js:20-42](src/field.js#L20-L42): bounds CMS giusti,
poi moltiplicati ×6). La scala del riferimento era usabile così com'era: il riscalamento è
la radice di metà delle divergenze (fov, raggi, distanze di focus, gap di hover).

## 3. Cosa si tiene, cosa si riscrive

**Si tiene:**

- Tooling: Vite, `package.json` scripts, struttura `src/`, `.gitignore`.
- Il video di riferimento in `reference/` (rinominato `original-behavior.mov`) e i frame
  estratti come ground truth.
- Il concetto di [gallery-data.js](gallery-data.js) come unica fonte dei contenuti — ma va
  rigenerato: **20 voci** con posizione, dimensioni px (→ aspect ratio), `backgroundColor`,
  `highlightColor`, `isPrimary`, `exhibitionName`/`artistName` placeholder, copiando i
  valori CMS di ANALYSIS §4.
- Il concetto di placeholder nero (piano con aspect ratio dell'originale).

**Si riscrive (da zero, non si patcha):**

- Tutta la logica di navigazione/animazione ([src/main.js](src/main.js)) — il modello è
  invertito (foto→camera invece di camera→foto) e privo di billboard: non recuperabile.
- [src/field.js](src/field.js) (layout casuale → posizioni fisse CMS).
- [src/palette.js](src/palette.js) (derivazione algoritmica → colori per-item nei dati).
- [index.html](index.html) (UI cursore/caption con misure e timing esatti).
- GSAP esce dalle dipendenze; three.js va pinnato a **r160** (oggi 0.178: OrbitControls è
  cambiato tra r160 e r178 — smoothing zoom, ecc.).

**Decisione da confermare — stack di implementazione.** Due opzioni coerenti con la Fase 1:

1. **Stack identico all'originale** (raccomandata): React + @react-three/fiber +
   @react-three/drei (`OrbitControls`, opz. `Image`) + framer-motion/framer-motion-3d +
   @use-gesture/react, versioni coeve (three r160, framer-motion 10.18.0). Ogni
   comportamento passa dagli **stessi code path** del sito vero: damping, dolly, billboard,
   bezier, springs sono garantiti identici per costruzione.
2. Vanilla three r160 + `OrbitControls` ufficiale (è la stessa classe che drei wrappa) +
   un piccolo tween cubic-bezier equivalente ad `animate()` di framer-motion. Niente React;
   restano da replicare a mano le transizioni framer (fattibile: sono tween bezier + uno
   spring documentato), con più superficie di errore.

## 4. Piano Fase 3 (dopo conferma)

1. `config.js`: ogni costante di ANALYSIS.md come costante nominata con commento di
   provenienza (`[bundle]` / `[bundle-default]` / `[CMS]`).
2. `gallery-data.js` rigenerato con i 20 item CMS (placeholder neri, aspect ratio reali).
3. Scena: camera (0,0,10) fov 75, OrbitControls con la config esatta, billboard per-frame,
   nuvola statica alle posizioni CMS (riposo `z+2`), primario a (0,0,0).
4. Interazioni nell'ordine della registrazione: auto-rotate → drag+damping → zoom →
   hover scale → focus/unfocus → UI cursore/caption.
5. Verifica frame-by-frame contro `reference/original-behavior.mov` (stessi punti di
   osservazione usati in ANALYSIS §7).

Fuori scope proposto (assenti nella registrazione): intro tipografica, modalità filtri,
pagine portfolio. Il secondo click sulla foto attiva farà solo il fade di 1 s.
