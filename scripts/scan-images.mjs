import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { readVideoDimensions } from './video-dimensions.mjs';

/**
 * public/img è l'unica fonte di verità dei media: questo script gira
 * automaticamente prima di `npm run dev` e `npm run build` (pre-hook) e
 *
 * 1. normalizza in-place le immagini che ne hanno bisogno (orientamento EXIF
 *    baked, resize a larghezza max 2000 px, ri-encode JPEG q80 che rimuove
 *    i metadati, GPS incluso) — idempotente: i file già conformi non
 *    vengono toccati. I video non vengono toccati: se ne legge solo la
 *    dimensione dall'header (vedi video-dimensions.mjs);
 * 2. assegna i media ai 20 slot del layout (posizioni CMS del riferimento,
 *    vedi gallery-data.js) con uno shuffle seedato dall'hash della lista
 *    file: stabile finché la cartella non cambia, si rimescola quando
 *    cambia. Con meno di 20 file ricicla ciclicamente, con più di 20 ne
 *    sceglie 20;
 * 3. sceglie le 8 slide dell'intro: SOLO IMMAGINI, mai video. L'ultima è
 *    quella dello slot primario, che per questo motivo è sempre
 *    un'immagine (nel riferimento l'ultima slide resta sul piano che si
 *    restringe e diventa il frame primario in nuvola);
 * 4. emette src/gallery-images.generated.js con dimensioni normalizzate a
 *    larghezza 2000 (convenzione del CMS del riferimento: mantiene identica
 *    la scala mondo e la distanza di focus) e query ?v=<hash> di
 *    cache-busting su ogni src.
 */

// fileURLToPath e non .pathname: quest'ultimo lascia le sequenze
// percent-encoded, e un percorso che contiene uno spazio non verrebbe trovato.
const IMG_DIR = fileURLToPath(new URL('../public/img/', import.meta.url));
const OUT_FILE = fileURLToPath(new URL('../src/gallery-images.generated.js', import.meta.url));
const MAX_WIDTH = 2000;
const NORMALIZED_WIDTH = 2000;
const SLOT_COUNT = 20;
const PRIMARY_SLOT_INDEX = 12;
const INTRO_SLIDE_COUNT = 8;
const JPEG_QUALITY = 80;
const IMAGE_PATTERN = /\.(jpe?g|png|webp)$/i;
const VIDEO_PATTERN = /\.(mp4|m4v|mov)$/i;
const UNSUPPORTED_VIDEO_PATTERN = /\.(webm|avi|mkv|wmv|flv|mpg|mpeg)$/i;
// I file finiscono nel repo e li serve GitHub Pages, che non è una CDN.
const LARGE_VIDEO_WARNING_BYTES = 8 * 1024 * 1024;

const entries = readdirSync(IMG_DIR);

const unsupported = entries.filter((name) => UNSUPPORTED_VIDEO_PATTERN.test(name));
if (unsupported.length > 0) {
  console.error(
    `scan-images: formato video non supportato: ${unsupported.join(', ')}. ` +
      "Converti in MP4 (H.264): è l'unico che tutti i browser riproducono.",
  );
  process.exit(1);
}

const files = entries
  .filter((name) => IMAGE_PATTERN.test(name) || VIDEO_PATTERN.test(name))
  .sort();

if (files.length === 0) {
  console.error('scan-images: nessun media in public/img — aggiungi dei file e rilancia.');
  process.exit(1);
}

// --- 1. dimensioni + normalizzazione in-place delle sole immagini ------------

const media = [];
for (const name of files) {
  const path = join(IMG_DIR, name);

  if (VIDEO_PATTERN.test(name)) {
    const { width, height, rotated } = await readVideoDimensions(path);
    const bytes = statSync(path).size;
    if (bytes > LARGE_VIDEO_WARNING_BYTES) {
      console.warn(
        `scan-images: ${name} pesa ${(bytes / 1024 / 1024).toFixed(1)} MB — ` +
          'valuta di accorciarlo o ricomprimerlo, finisce nel repo.',
      );
    }
    console.log(`scan-images: video ${name} -> ${width}x${height}${rotated ? ' (ruotato 90°)' : ''}`);
    media.push({ name, width, height, type: 'video' });
    continue;
  }

  const meta = await sharp(path).metadata();
  const needsRotation = meta.orientation !== undefined && meta.orientation !== 1;
  const needsResize = meta.width > MAX_WIDTH;
  const hasMetadata = meta.exif !== undefined || meta.icc !== undefined || meta.xmp !== undefined;

  let { width, height } = meta;
  if (needsRotation || needsResize || hasMetadata) {
    // .rotate() senza argomenti applica l'orientamento EXIF; l'output di
    // sharp non copia i metadati (niente EXIF/GPS) se non richiesto.
    let pipeline = sharp(path).rotate();
    if (needsRotation && meta.orientation >= 5) [width, height] = [height, width];
    if (width > MAX_WIDTH) {
      height = Math.round((height * MAX_WIDTH) / width);
      width = MAX_WIDTH;
      pipeline = pipeline.resize({ width: MAX_WIDTH });
    }
    const buffer = await pipeline.jpeg({ quality: JPEG_QUALITY }).toBuffer();
    writeFileSync(path, buffer);
    console.log(`scan-images: normalizzata ${name} -> ${width}x${height}`);
  }

  media.push({ name, width, height, type: 'image' });
}

const images = media.filter((item) => item.type === 'image');
const videos = media.filter((item) => item.type === 'video');

if (images.length === 0) {
  console.error(
    "scan-images: servono immagini, non solo video — le 8 slide dell'intro e lo slot " +
      'primario devono essere immagini. Aggiungi almeno un file jpg/png/webp.',
  );
  process.exit(1);
}

// --- 2. shuffle seedato dalla lista file -------------------------------------

// mulberry32: PRNG deterministico; il seed viene dall'hash dei nomi file,
// così la mappatura è stabile a cartella invariata.
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const listHash = createHash('md5').update(files.join('\n')).digest();
const random = mulberry32(listHash.readUInt32LE(0));

function shuffled(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const deck = shuffled(media);
if (deck.length < SLOT_COUNT) {
  console.warn(`scan-images: ${deck.length} media per ${SLOT_COUNT} slot — alcuni verranno riusati.`);
}
const slotMedia = Array.from({ length: SLOT_COUNT }, (_, i) => deck[i % deck.length]);

// Lo slot primario è protagonista dell'intro e ne è l'ultima slide: deve
// essere un'immagine. Se lo shuffle ci ha messo un video, scambialo col
// primo slot che ospita un'immagine.
if (slotMedia[PRIMARY_SLOT_INDEX].type === 'video') {
  const swapIndex = slotMedia.findIndex((item) => item.type === 'image');
  [slotMedia[PRIMARY_SLOT_INDEX], slotMedia[swapIndex]] = [
    slotMedia[swapIndex],
    slotMedia[PRIMARY_SLOT_INDEX],
  ];
  console.log(
    `scan-images: slot primario scambiato con lo slot ${swapIndex + 1} — nell'intro non vanno video.`,
  );
}

// --- 3. slide dell'intro: solo immagini ---------------------------------------

const primaryImage = slotMedia[PRIMARY_SLOT_INDEX];
const otherImages = shuffled(images.filter((img) => img.name !== primaryImage.name));
const introPool = otherImages.length > 0 ? otherImages : [primaryImage];
const introSlides = [];
for (let i = 0; introSlides.length < INTRO_SLIDE_COUNT - 1; i++) {
  introSlides.push(introPool[i % introPool.length]);
}
introSlides.push(primaryImage);

// --- 4. emissione del modulo generato ----------------------------------------

const versions = new Map(
  media.map((item) => [
    item.name,
    createHash('md5').update(readFileSync(join(IMG_DIR, item.name))).digest('hex').slice(0, 8),
  ]),
);
// Path relativo (niente slash iniziale): risolto rispetto alla pagina, così
// funziona anche servito da un sottopercorso come GitHub Pages /3Dgallery/.
const srcOf = (item) => `img/${item.name}?v=${versions.get(item.name)}`;
const normalizedHeight = (item) => Math.round((item.height * NORMALIZED_WIDTH) / item.width);

const module_ = `// GENERATO da scripts/scan-images.mjs — non modificare a mano.
// Rigenerato automaticamente prima di ogni dev/build dal contenuto di
// public/img. Dimensioni normalizzate a larghezza ${NORMALIZED_WIDTH} (convenzione del
// riferimento); ?v= è cache-busting sul contenuto del file.
// INTRO_SLIDES contiene solo immagini: nell'intro non compaiono mai video.

export const SLOT_MEDIA = [
${slotMedia
  .map(
    (item) =>
      `  { src: '${srcOf(item)}', type: '${item.type}', width: ${NORMALIZED_WIDTH}, height: ${normalizedHeight(item)} },`,
  )
  .join('\n')}
];

export const INTRO_SLIDES = [
${introSlides.map((img) => `  '${srcOf(img)}',`).join('\n')}
];
`;

writeFileSync(OUT_FILE, module_);
console.log(
  `scan-images: ${images.length} immagini + ${videos.length} video -> ${SLOT_COUNT} slot ` +
    `(${slotMedia.filter((item) => item.type === 'video').length} video in nuvola) ` +
    `+ ${INTRO_SLIDE_COUNT} slide intro senza video (src/gallery-images.generated.js)`,
);
