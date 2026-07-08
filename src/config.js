/**
 * Tutte le costanti di comportamento, con provenienza:
 *
 *   [bundle]          — valore esplicito nel chunk pages/talent-2024 del sito originale
 *   [bundle-default]  — non specificato dal sito; default della libreria, verificato
 *                       dentro il bundle stesso (chunk 4651 / fb7d5399)
 *   [CMS]             — dato Storyblok embedded in __NEXT_DATA__
 *
 * Dettaglio completo e righe di evidenza: ANALYSIS.md.
 */

// Camera iniziale: <Canvas flat camera={{position:[0,0,10]}}> [bundle].
// fov/near/far non specificati -> default di react-three-fiber: 75 / 0.1 / 1000
// [bundle-default]. `flat` = nessun tone mapping [bundle].
export const CAMERA_POSITION = [0, 0, 10];

// <ambientLight intensity={5}> [bundle] (ininfluente sui placeholder unlit,
// tenuta per fedeltà alla scena).
export const AMBIENT_LIGHT_INTENSITY = 5;

// OrbitControls, config esatta [bundle]. Non overridati e quindi ai default
// three r160 (verificati nel chunk 4651): dampingFactor 0.05, rotateSpeed 1,
// minDistance 0 [bundle-default].
export const ORBIT = {
  zoomSpeed: 0.3,
  maxDistance: 30,
  minPolarAngle: Math.PI / 4.1,
  maxPolarAngle: Math.PI / 1.1,
  autoRotateSpeed: 0.2,
};

// Scala dei piani: 0.0015 x dimensioni pixel dell'immagine sorgente; il frame
// primario usa 0.00175 [bundle].
export const IMAGE_SCALE = 0.0015;
export const IMAGE_SCALE_PRIMARY = 0.00175;

// I frame non primari riposano a z_CMS + 2 (arrivo della variante "default"
// del motion.group) [bundle]. Il primario riposa a (0,0,0) [bundle].
export const REST_Z_OFFSET = 2;

// Hover in nuvola: solo scala 1 -> 1.1, nessun movimento [bundle].
export const HOVER = {
  scale: 1.1,
  duration: 0.5,
  ease: [0.05, 0.29, 0, 1],
};

// Focus: la camera vola sul frame (il frame non si muove) [bundle].
// - durata/ease dei tween per componente (funzione animateVector del bundle)
// - offset di arrivo sull'asse z mondo: fattore x dimensione pixel dominante
//   (altezza se portrait, larghezza se landscape); 0.002 su mobile
// - segno: -r se |azimut| > 2 rad (la camera arriva da dietro la nuvola)
// - al rilascio la camera torna alla posizione salvata e il target va a
//   (0,0,-10) — quirk reale del bundle: NON torna al target iniziale (0,0,0)
export const FOCUS = {
  duration: 1.2,
  ease: [0.43, 0.19, 0.02, 1],
  approachFactor: 0.00125,
  approachFactorTouch: 0.002,
  behindAzimuthThreshold: 2,
  releaseTarget: { x: 0, y: 0, z: -10 },
};

// Dissolvenza degli altri frame quando uno è in focus (e ritorno) [bundle].
export const FRAME_FADE = {
  duration: 1,
  ease: [0.43, 0.19, 0.02, 1],
};

// Sfondo: div DOM (canvas trasparente), animato al frameBackgroundColor del
// frame attivo e ritorno al bianco [bundle].
export const BACKGROUND = {
  duration: 0.2,
  ease: 'linear',
  defaultColor: '#ffffff',
};

// Caption in focus (exhibitionName corsivo + artistName), in basso al centro,
// colore = frameHighlightColor [bundle].
export const DETAIL = {
  delayIn: 1,
  duration: 1,
  ease: [0.43, 0.19, 0.02, 1],
};

// Cursore custom in focus [bundle]: box 35x35 con la x fuori dalla foto,
// pill 202x40 "enter portfolio" sopra la foto; fade 1 s; scala 0.8 alla
// pressione. Nota: nel bundle i listener mousedown/mouseup del press-scale
// sono registrati con un bug (handler inerte), quindi l'effetto non si vede
// mai sul sito live; qui è implementato funzionante perché l'intento è
// evidente e l'impatto visivo è un istante.
export const CURSOR_ICON = {
  closeSize: 35,
  pillWidth: 202,
  pillHeight: 40,
  pressedScale: 0.8,
  duration: 1,
  ease: [0.43, 0.19, 0.02, 1],
};

// Secondo click sulla foto attiva: fade di tutte le mesh, poi l'originale
// naviga al portfolio (navigazione esclusa dallo scope confermato) [bundle].
export const PORTFOLIO_TRANSITION = {
  duration: 1,
  ease: 'linear',
};

// L'originale distingue mobile con un breakpoint in px (modulo non presente
// nei chunk archiviati, valore non estraibile — vedi ANALYSIS.md §9); qui si
// usa pointer:coarse. La registrazione di riferimento è desktop.
export const TOUCH_MEDIA_QUERY = '(pointer: coarse)';

// ---------------------------------------------------------------------------
// Intro (sequenza verificata sia nel bundle sia sul sito live con hard
// refresh; vedi ANALYSIS.md §8). La camera NON si muove mai durante l'intro:
// il "zoom-out" percepito è il piano primario fullscreen che si restringe.
// ---------------------------------------------------------------------------
export const INTRO = {
  // Sfondo iniziale nero; diventa bianco (0.2 s linear, BACKGROUND.duration)
  // quando lo slideshow raggiunge il passo 2 [bundle, confermato live].
  initialBackground: '#000000',

  // Contenitore titolo+sottotitolo: fade-in delay 2 s durata 3 s; fade-out
  // delay 1.5 s durata 1 s quando parte lo slideshow. Il reveal è un fade,
  // non mask/slide [bundle, confermato live]. Dopo l'intro il titolo NON
  // resta: esce con questo fade [live].
  typography: {
    fadeInDelay: 2,
    fadeInDuration: 3,
    fadeOutDelay: 1.5,
    fadeOutDuration: 1,
    ease: [0.43, 0.19, 0.02, 1],
  },

  // Lettere del titolo: animazione CSS per-lettera, 2000 ms forwards, delay
  // (indice+5)*200ms con indice 1-based -> prima lettera a 1.2 s, +200 ms le
  // successive. Nel riferimento anima font-size 64->130 px e gli assi
  // variabili WTUN 300->600 / WTSP 100->500 del font proprietario PurpleHaze
  // (base 44px prima che l'animazione parta); qui l'asse WTUN è mappato su
  // font-weight 300->600 (i valori degli assi proprietari non sono
  // riproducibili senza il font) [bundle].
  letter: {
    durationMs: 2000,
    delayBaseMs: 1200,
    staggerMs: 200,
    fromSizePx: 64,
    toSizePx: 130,
    baseSizePx: 44,
    fromWeight: 300,
    toWeight: 600,
  },

  // Sottotitolo: parole in blocchi larghi max 180 px che vanno a capo,
  // 18 px; ogni carattere fa fade-in con delay 2 + 0.25*parola + 0.05*char,
  // durata 1 s, ease easeInOut. Il completamento dell'ultimo carattere fa
  // partire lo slideshow (playIntro) [bundle].
  subtitle: {
    baseDelay: 2,
    wordStagger: 0.25,
    charStagger: 0.05,
    duration: 1,
    widthPx: 180,
    fontSizePx: 18,
    wordGapPx: 3,
  },

  // Layout del blocco tipografico [bundle CSS]: titolo e sottotitolo
  // centrati a metà schermo; gap 6 px tra le lettere, 15 px tra titolo e
  // sottotitolo.
  titleLetterGapPx: 6,
  titleMarginBottomPx: 15,

  // Slideshow del frame primario: piano fullscreen, un passo ogni 250 ms;
  // al passo >1 parte l'uscita della tipografia e lo sfondo va al bianco;
  // al passo >6 (e con tutti i frame caricati — coi placeholder è immediato)
  // parte lo shrink: delay 1.5 s, durata 1.2 s, ease (0.65, 0.03, 0, 1),
  // dal viewport alla dimensione finale in nuvola (0.00175 x px). L'auto-
  // rotate si abilita 1.5 s dopo la schedulazione dello shrink (= al suo
  // avvio); a shrink completato: isIntroComplete, controlli abilitati,
  // cursore grab [bundle].
  slideshow: {
    stepMs: 250,
    lastStep: 6,
    // 8 immagini, una per passo; l'ultima resta sul piano che si restringe e
    // diventa il frame primario in nuvola [bundle: overview_frame_1..8.jpeg
    // precaricate con <link rel="preload">]. Qui: INTRO_SLIDES in
    // gallery-data.js (selezione casuale dalla cartella locale).
    slideCount: 8,
    shrinkDelay: 1.5,
    shrinkDuration: 1.2,
    shrinkEase: [0.65, 0.03, 0, 1],
    autoRotateDelayMs: 1500,
  },

  // Entrata degli altri 19 frame: montano a z_CMS - 10 quando parte lo
  // slideshow e volano alla posizione di riposo (z_CMS + 2) con delay 3.5 s,
  // durata 1.2 s, ease (0.65, 0.03, 0, 1). Dopo l'intro i re-render usano
  // delay 0 ed ease (0.43, 0.19, 0.02, 1) [bundle].
  entrance: {
    mountZOffset: -10,
    delay: 3.5,
    duration: 1.2,
    ease: [0.65, 0.03, 0, 1],
  },
};

// Flag di debug (solo sviluppo): sostituisce le immagini dello slideshow
// dell'intro con tonalità di grigio numerate, per verificare a occhio passi
// e cadenza. Default false: immagini reali da INTRO_SLIDES.
export const DEBUG_INTRO_SLIDES = false;
