import { useEffect, useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { motion } from 'framer-motion-3d';
import * as THREE from 'three';
import { FOCUS, HOVER, IMAGE_SCALE, INTRO } from './config.js';
import { extractImageColors } from './extract-image-colors.js';
import { restPosition } from './rest-position.js';
import { useFrameInteractions } from './use-frame-interactions.js';

/**
 * Un frame non primario della nuvola: piano con la fotografia dell'item,
 * dimensionato come nel riferimento (0.0015 x dimensioni pixel, normalizzate
 * a larghezza 2000). Il piano ha esattamente l'aspect ratio dell'immagine,
 * quindi non serve alcun ritaglio.
 *
 * Entrata (dall'intro): monta a z_CMS - 10 e vola alla posizione di riposo
 * (z_CMS + 2) con delay 3.5 s, durata 1.2 s, ease (0.65, 0.03, 0, 1); a intro
 * completata i re-render usano delay 0 ed ease del focus, come nel
 * riferimento. Il frame poi non si muove più: si muove solo la camera.
 */
export default function Frame({
  item,
  activeItem,
  isIntroComplete,
  isMobile,
  onActivate,
  onDeactivate,
  onHoverActiveChange,
  onPortfolioTransition,
  onImageColors,
}) {
  const { group, material, hovered, handlers } = useFrameInteractions({
    item,
    activeItem,
    isIntroComplete,
    isMobile,
    onActivate,
    onDeactivate,
    onHoverActiveChange,
    onPortfolioTransition,
  });

  const rawTexture = useLoader(THREE.TextureLoader, item.src);
  const texture = useMemo(() => {
    rawTexture.colorSpace = THREE.SRGBColorSpace;
    rawTexture.needsUpdate = true;
    return rawTexture;
  }, [rawTexture]);

  // Colori del focus estratti dall'immagine (vedi extract-image-colors.js).
  useEffect(() => {
    if (texture.image) onImageColors(item.id, extractImageColors(texture.image, item.src));
  }, [texture, item, onImageColors]);

  const rest = restPosition(item);

  return (
    <motion.group
      ref={group}
      initial={{
        x: item.position.x,
        y: item.position.y,
        z: item.position.z + INTRO.entrance.mountZOffset,
      }}
      animate={{
        x: rest.x,
        y: rest.y,
        z: rest.z,
        scale: hovered ? HOVER.scale : 1,
      }}
      transition={{
        delay: isIntroComplete ? 0 : INTRO.entrance.delay,
        duration: INTRO.entrance.duration,
        ease: isIntroComplete ? FOCUS.ease : INTRO.entrance.ease,
        scale: { duration: HOVER.duration, ease: HOVER.ease },
      }}
    >
      <mesh scale={[item.width * IMAGE_SCALE, item.height * IMAGE_SCALE, 1]} {...handlers}>
        <planeGeometry />
        <meshBasicMaterial ref={material} map={texture} color="#ffffff" transparent />
      </mesh>
    </motion.group>
  );
}
