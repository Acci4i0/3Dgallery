import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { animate } from 'framer-motion';
import { useGesture } from '@use-gesture/react';
import * as THREE from 'three';
import GALLERY, { INTRO_SLIDES } from '../gallery-data.js';
import {
  AMBIENT_LIGHT_INTENSITY,
  BACKGROUND,
  CAMERA_POSITION,
  INTRO,
  TOUCH_MEDIA_QUERY,
} from './config.js';
import Controls from './Controls.jsx';
import Frame from './Frame.jsx';
import PrimaryFrame from './PrimaryFrame.jsx';
import PortfolioTransition from './PortfolioTransition.jsx';
import IntroTypography from './IntroTypography.jsx';
import CursorIcon from './CursorIcon.jsx';
import Detail from './Detail.jsx';

// Precarica tutte le texture (nuvola + slide dell'intro) durante la fase
// tipografica, come i <link rel="preload"> del riferimento: quando parte lo
// slideshow è già tutto in cache e niente sospende.
useLoader.preload(THREE.TextureLoader, [...GALLERY.map((item) => item.src), ...INTRO_SLIDES]);

/**
 * Pagina della nuvola. Struttura come il riferimento: canvas WebGL trasparente
 * (react-three-fiber, prop `flat`) sopra un div il cui background-color viene
 * animato; cursore custom, caption e tipografia dell'intro in DOM.
 *
 * Intro (riparte a ogni refresh, è lo stato iniziale):
 *   nero + tipografia -> playIntro (slideshow del primario, frame montati) ->
 *   isIntroUnderway (tipografia esce, sfondo bianco) -> canAutoRotate
 *   (controlli attivi, drift) -> isIntroComplete (hover/click abilitati,
 *   cursore grab). Da lì in poi la navigazione è quella preesistente.
 */
export default function App() {
  const [playIntro, setPlayIntro] = useState(false);
  const [isIntroUnderway, setIsIntroUnderway] = useState(false);
  const [isIntroComplete, setIsIntroComplete] = useState(false);
  const [canAutoRotate, setCanAutoRotate] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [hoveringActive, setHoveringActive] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [background, setBackground] = useState(INTRO.initialBackground);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const mouseIsDown = useRef(false);

  const isTouch = useMemo(() => window.matchMedia(TOUCH_MEDIA_QUERY).matches, []);

  // Il cursore custom in focus segue il mouse tracciato sul container
  // (nel riferimento: useGesture onMove sul wrapper della pagina).
  useGesture(
    { onMove: ({ xy }) => setMouse({ x: xy[0], y: xy[1] }) },
    { target: containerRef },
  );

  // Sfondo: nero durante l'intro, bianco da quando lo slideshow è avviato,
  // colore del frame attivo in focus (sempre 0.2 s linear).
  const backgroundRef = useRef(INTRO.initialBackground);
  useEffect(() => {
    const target = activeItem
      ? activeItem.backgroundColor
      : isIntroUnderway
        ? BACKGROUND.defaultColor
        : INTRO.initialBackground;
    if (target === backgroundRef.current) return;
    animate(backgroundRef.current, target, {
      duration: BACKGROUND.duration,
      ease: BACKGROUND.ease,
      onUpdate: (v) => {
        backgroundRef.current = v;
        setBackground(v);
      },
    });
  }, [activeItem, isIntroUnderway]);

  // Cursore della nuvola: compare a intro completata, come nel riferimento.
  useEffect(() => {
    if (isIntroComplete) document.body.style.cursor = 'grab';
    return () => {
      document.body.style.cursor = '';
    };
  }, [isIntroComplete]);

  const handleActivate = useCallback((item) => setActiveItem(item), []);
  const handleDeactivate = useCallback(() => {
    setActiveItem(null);
    setHoveringActive(false);
  }, []);
  const handlePortfolioTransition = useCallback(() => setIsTransitioning(true), []);
  const handleTypographyComplete = useCallback(() => setPlayIntro(true), []);
  const handleIntroUnderway = useCallback(() => setIsIntroUnderway(true), []);
  const handleCanAutoRotate = useCallback(() => setCanAutoRotate(true), []);
  const handleIntroComplete = useCallback(() => setIsIntroComplete(true), []);

  const frameProps = {
    activeItem,
    isIntroComplete,
    isTouch,
    onActivate: handleActivate,
    onDeactivate: handleDeactivate,
    onHoverActiveChange: setHoveringActive,
    onPortfolioTransition: handlePortfolioTransition,
  };

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100svh', overflow: 'hidden', backgroundColor: background }}
      onMouseDown={() => {
        mouseIsDown.current = true;
      }}
      onMouseMove={() => {
        if (mouseIsDown.current && isIntroComplete) document.body.style.cursor = 'grabbing';
      }}
      onMouseUp={() => {
        mouseIsDown.current = false;
        if (isIntroComplete) document.body.style.cursor = 'grab';
      }}
    >
      <Canvas flat camera={{ position: CAMERA_POSITION }}>
        <ambientLight intensity={AMBIENT_LIGHT_INTENSITY} />
        <Controls
          activeItem={activeItem}
          canAutoRotate={canAutoRotate}
          isIntroComplete={isIntroComplete}
          isTouch={isTouch}
        />
        <PortfolioTransition isTransitioning={isTransitioning} />
        <Suspense fallback={null}>
          <group>
            {playIntro &&
              GALLERY.map((item) =>
                item.isPrimary ? (
                  <PrimaryFrame
                    key={item.id}
                    item={item}
                    playIntro={playIntro}
                    onIntroUnderway={handleIntroUnderway}
                    onCanAutoRotate={handleCanAutoRotate}
                    onIntroComplete={handleIntroComplete}
                    {...frameProps}
                  />
                ) : (
                  <Frame key={item.id} item={item} {...frameProps} />
                ),
              )}
          </group>
        </Suspense>
      </Canvas>
      <IntroTypography
        isIntroUnderway={isIntroUnderway}
        onTypographyComplete={handleTypographyComplete}
      />
      {!isTouch && (
        <CursorIcon
          mouseX={mouse.x}
          mouseY={mouse.y}
          activeItem={activeItem}
          hoveringActive={hoveringActive}
          isTransitioning={isTransitioning}
        />
      )}
      <Detail
        activeItem={activeItem}
        isTransitioning={isTransitioning}
        isTouch={isTouch}
        onPortfolioTransition={handlePortfolioTransition}
      />
    </div>
  );
}
