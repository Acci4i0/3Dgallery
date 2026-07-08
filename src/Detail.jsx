import { AnimatePresence, motion } from 'framer-motion';
import { DETAIL } from './config.js';

/**
 * Caption del frame in focus: titolo della mostra in corsivo sopra, nome
 * dell'artista sotto, centrati in basso (bottom 20px), colore highlight.
 * Fade-in con delay 1 s. Su touch compare anche il bottone "view this
 * project" (transizione al portfolio; la navigazione è fuori scope) — la x
 * fissa in alto del riferimento è decorativa (pointer-events: none).
 */
export default function Detail({ activeItem, isTransitioning, isTouch, onPortfolioTransition }) {
  const highlight = activeItem ? activeItem.highlightColor : '#000000';

  return (
    <AnimatePresence>
      {activeItem && !isTransitioning ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: { delay: DETAIL.delayIn, duration: DETAIL.duration, ease: DETAIL.ease },
            }}
            exit={{
              opacity: 0,
              transition: { duration: DETAIL.duration, ease: DETAIL.ease },
            }}
            style={{
              display: 'flex',
              position: 'fixed',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              pointerEvents: isTouch ? 'auto' : 'none',
              zIndex: 1,
              color: highlight,
            }}
          >
            <span style={{ fontSize: 16, lineHeight: '20px', fontStyle: 'italic', textAlign: 'center' }}>
              {activeItem.exhibitionName}
            </span>
            <span style={{ fontSize: 16, lineHeight: '20px', textAlign: 'center' }}>
              {activeItem.artistName}
            </span>
            {isTouch ? (
              <button
                onClick={onPortfolioTransition}
                style={{
                  display: 'flex',
                  width: 351,
                  height: 40,
                  marginTop: 16,
                  justifyContent: 'center',
                  alignItems: 'center',
                  background: 'none',
                  border: `1px solid ${highlight}`,
                  color: highlight,
                  fontSize: 14,
                }}
              >
                view this project
              </button>
            ) : null}
          </motion.div>
          {isTouch ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                transition: { delay: DETAIL.delayIn, duration: DETAIL.duration, ease: DETAIL.ease },
              }}
              exit={{
                opacity: 0,
                transition: { duration: DETAIL.duration, ease: DETAIL.ease },
              }}
              style={{
                display: 'flex',
                position: 'fixed',
                top: 0,
                left: '50%',
                width: 35,
                height: 35,
                marginTop: 16,
                justifyContent: 'center',
                alignItems: 'center',
                transform: 'translateX(-50%)',
                border: `1px solid ${highlight}`,
                color: highlight,
                pointerEvents: 'none',
                zIndex: 1,
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none">
                <path stroke="currentColor" d="M12.685 1.077.703 13.059M.704.862l11.982 11.982" />
              </svg>
            </motion.div>
          ) : null}
        </>
      ) : null}
    </AnimatePresence>
  );
}
