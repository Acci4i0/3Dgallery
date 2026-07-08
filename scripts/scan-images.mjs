import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

/**
 * public/img è l'unica fonte di verità delle immagini: questo script gira
 * automaticamente prima di `npm run dev` e `npm run build` (pre-hook) e
 *
 * 1. normalizza in-place i file che ne hanno bisogno (orientamento EXIF
 *    baked, resize a larghezza max 2000 px, ri-encode JPEG q80 che rimuove
 *    i metadati, GPS incluso) — idempotente: i file già conformi non
 *    vengono toccati;
 * 2. assegna le immagini ai 20 slot del layout (posizioni CMS del
 *    riferimento, vedi gallery-data.js) con uno shuffle seedato dall'hash
 *    della lista file: stabile finché la cartella non cambia, si rimescola
 *    quando cambia. Con meno di 20 immagini ricicla ciclicamente, con più
 *    di 20 ne sceglie 20;
 * 3. sceglie le 8 slide dell'intro: 7 immagini + quella dello slot primario
 *    per ultima (nel riferimento l'ultima slide resta sul piano che si
 *    restringe e diventa il frame primario in nuvola);
 * 4. emette src/gallery-images.generated.js con dimensioni normalizzate a
 *    larghezza 2000 (convenzione del CMS del riferimento: mantiene identica
 *    la scala mondo e la distanza di focus) e query ?v=<hash> di
 *    cache-busting su ogni src.
 */

const IMG_DIR = new URL('../public/img/', import.meta.url).pathname;
const OUT_FILE = new URL('../src/gallery-images.generated.js', import.meta.url).pathname;
const MAX_WIDTH = 2000;
const NORMALIZED_WIDTH = 2000;
const SLOT_COUNT = 20;
const PRIMARY_SLOT_INDEX = 12;
const INTRO_SLIDE_COUNT = 8;
const JPEG_QUALITY = 80;

const files = readdirSync(IMG_DIR)
  .filter((name) => /\.(jpe?g|png|webp)$/i.test(name))
  .sort();

if (files.length === 0) {
  console.error('scan-images: nessuna immagine in public/img — aggiungi dei file e rilancia.');
  process.exit(1);
}

// --- 1. normalizzazione in-place (solo dove serve) --------------------------

const images = [];
for (const name of files) {
  const path = join(IMG_DIR, name);
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

  images.push({ name, width, height });
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

const deck = shuffled(images);
if (deck.length < SLOT_COUNT) {
  console.warn(
    `scan-images: ${deck.length} immagini per ${SLOT_COUNT} slot — alcune verranno riusate.`,
  );
}
const slotImages = Array.from({ length: SLOT_COUNT }, (_, i) => deck[i % deck.length]);

// --- 3. slide dell'intro ------------------------------------------------------

const primaryImage = slotImages[PRIMARY_SLOT_INDEX];
const otherImages = shuffled(images.filter((img) => img.name !== primaryImage.name));
const introSlides = [];
for (let i = 0; introSlides.length < INTRO_SLIDE_COUNT - 1; i++) {
  introSlides.push(otherImages[i % otherImages.length]);
}
introSlides.push(primaryImage);

// --- 4. emissione del modulo generato ----------------------------------------

const versions = new Map(
  images.map((img) => [
    img.name,
    createHash('md5').update(readFileSync(join(IMG_DIR, img.name))).digest('hex').slice(0, 8),
  ]),
);
// Path relativo (niente slash iniziale): risolto rispetto alla pagina, così
// funziona anche servito da un sottopercorso come GitHub Pages /3Dgallery/.
const srcOf = (img) => `img/${img.name}?v=${versions.get(img.name)}`;
const normalizedHeight = (img) => Math.round((img.height * NORMALIZED_WIDTH) / img.width);

const module_ = `// GENERATO da scripts/scan-images.mjs — non modificare a mano.
// Rigenerato automaticamente prima di ogni dev/build dal contenuto di
// public/img. Dimensioni normalizzate a larghezza ${NORMALIZED_WIDTH} (convenzione del
// riferimento); ?v= è cache-busting sul contenuto del file.

export const SLOT_IMAGES = [
${slotImages
  .map(
    (img) =>
      `  { src: '${srcOf(img)}', width: ${NORMALIZED_WIDTH}, height: ${normalizedHeight(img)} },`,
  )
  .join('\n')}
];

export const INTRO_SLIDES = [
${introSlides.map((img) => `  '${srcOf(img)}',`).join('\n')}
];
`;

writeFileSync(OUT_FILE, module_);
console.log(
  `scan-images: ${images.length} immagini -> ${SLOT_COUNT} slot + ${INTRO_SLIDE_COUNT} slide intro (src/gallery-images.generated.js)`,
);
