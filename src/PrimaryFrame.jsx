import { useEffect, useMemo, useState } from 'react';
import { useLoader, useThree } from '@react-three/fiber';
import { motion } from 'framer-motion-3d';
import { animate } from 'framer-motion';
import * as THREE from 'three';
import { INTRO_SLIDES } from '../gallery-data.js';
import { DEBUG_INTRO_SLIDES, HOVER, IMAGE_SCALE_PRIMARY, INTRO } from './config.js';
import { createDebugSlideTextures } from './debug-slides.js';
import { useFrameInteractions } from './use-frame-interactions.js';

// object-fit: cover sul piano corrente, come lo shader di drei <Image> nel
// riferimento: il piano parte all'aspect del viewport (immagine ritagliata)
// e con lo shrink arriva all'aspect dell'immagine (nessun ritaglio).
function applyCoverFit(texture, planeAspect) {
  const image = texture.image;
  if (!image || !image.width) return;
  const imageAspect = image.width / image.height;
  if (imageAspect > planeAspect) {
    const repeatX = planeAspect / imageAspect;
    texture.repeat.set(repeatX, 1);
    texture.offset.set((1 - repeatX) / 2, 0);
  } else {
    const repeatY = imageAspect / planeAspect;
    texture.repeat.set(1, repeatY);
    texture.offset.set(0, (1 - repeatY) / 2);
  }
}

/**
 * Il frame primario, protagonista dell'intro. Sta sempre a (0,0,0) — il
 * target dell'orbita — e la camera non si muove mai durante l'intro: il
 * "zoom-out" percepito è questo piano che parte fullscreen e si restringe
 * alla dimensione in nuvola.
 *
 * Sequenza (dal riferimento): quando la tipografia completa (playIntro) il
 * piano copre l'intero viewport e avanza uno "slideshow" a passi di 250 ms
 * (nel riferimento 8 fotografie; qui il placeholder nero resta nero, ma la
 * macchina a passi è identica perché governa i tempi). Al passo 2 parte
 * l'uscita della tipografia e lo sfondo va al bianco; al passo 7, con tutti
 * i frame caricati (immediato coi placeholder), lo shrink: delay 1.5 s,
 * durata 1.2 s, ease (0.65, 0.03, 0, 1). L'auto-rotate si abilita all'avvio
 * dello shrink; al completamento l'intro è finita e i controlli si attivano.
 *
 * A ogni passo cambia la texture del piano (8 immagini da INTRO_SLIDES,
 * scelte casualmente; l'ultima è l'immagine del primario e resta sul piano
 * che si restringe, diventando il frame in nuvola — come nel riferimento).
 * DEBUG_INTRO_SLIDES sostituisce le immagini con grigi numerati.
 */
export default function PrimaryFrame({
  item,
  playIntro,
  isIntroComplete,
  activeItem,
  isTouch,
  onActivate,
  onDeactivate,
  onHoverActiveChange,
  onPortfolioTransition,
  onIntroUnderway,
  onCanAutoRotate,
  onIntroComplete,
}) {
  const viewport = useThree((s) => s.viewport);
  const [step, setStep] = useState(0);
  const [planeWidth, setPlaneWidth] = useState(viewport.width);
  const [planeHeight, setPlaneHeight] = useState(viewport.height);

  // Le 8 slide dell'intro: cloni delle texture (l'immagine del primario può
  // comparire anche come frame in nuvola, e il cover-fit non deve toccare
  // quella condivisa). Col flag di debug: grigi numerati.
  const rawSlides = useLoader(THREE.TextureLoader, INTRO_SLIDES);
  const slideTextures = useMemo(() => {
    if (DEBUG_INTRO_SLIDES) return createDebugSlideTextures(INTRO.slideshow.slideCount);
    return rawSlides.map((raw) => {
      const texture = raw.clone();
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
      return texture;
    });
  }, [rawSlides]);
  const currentSlide = Math.min(step, INTRO.slideshow.slideCount - 1);
  const currentTexture = slideTextures[currentSlide];
  applyCoverFit(currentTexture, planeWidth / planeHeight);

  const { group, material, hovered, handlers } = useFrameInteractions({
    item,
    activeItem,
    isIntroComplete,
    isTouch,
    onActivate,
    onDeactivate,
    onHoverActiveChange,
    onPortfolioTransition,
    cursorAfterRelease: 'auto',
  });

  // Macchina a passi dello slideshow + shrink finale. Coi placeholder il
  // gate "tutti i frame caricati" del riferimento è sempre soddisfatto.
  useEffect(() => {
    if (!playIntro || isIntroComplete) return;

    if (step > INTRO.slideshow.lastStep) {
      const targetWidth = item.width * IMAGE_SCALE_PRIMARY;
      const targetHeight = item.height * IMAGE_SCALE_PRIMARY;
      animate(viewport.width, targetWidth, {
        duration: INTRO.slideshow.shrinkDuration,
        delay: INTRO.slideshow.shrinkDelay,
        ease: INTRO.slideshow.shrinkEase,
        onUpdate: setPlaneWidth,
        onComplete: onIntroComplete,
      });
      animate(viewport.height, targetHeight, {
        duration: INTRO.slideshow.shrinkDuration,
        delay: INTRO.slideshow.shrinkDelay,
        ease: INTRO.slideshow.shrinkEase,
        onUpdate: setPlaneHeight,
      });
      const autoRotateTimer = setTimeout(onCanAutoRotate, INTRO.slideshow.autoRotateDelayMs);
      return () => clearTimeout(autoRotateTimer);
    }

    const stepTimer = setTimeout(() => setStep((s) => s + 1), INTRO.slideshow.stepMs);
    return () => clearTimeout(stepTimer);
  }, [playIntro, step, isIntroComplete]);

  // Al passo 2: esce la tipografia e lo sfondo va al bianco.
  useEffect(() => {
    if (playIntro && step > 1) onIntroUnderway();
  }, [playIntro, step, onIntroUnderway]);

  return (
    <motion.group
      ref={group}
      position={[0, 0, 0]}
      animate={{ scale: hovered ? HOVER.scale : 1 }}
      transition={{ scale: { duration: HOVER.duration, ease: HOVER.ease } }}
    >
      <mesh scale={[planeWidth, planeHeight, 1]} {...handlers}>
        <planeGeometry />
        <meshBasicMaterial ref={material} map={currentTexture} color="#ffffff" transparent />
      </mesh>
    </motion.group>
  );
}
