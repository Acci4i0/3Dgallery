import { AnimatePresence, motion } from 'framer-motion';
import { INTRO } from './config.js';

const TITLE = 'ANDRE';
const SUBTITLE = 'ecco alcune foto prese dalla galleria del telefono';

/**
 * Tipografia dell'intro: titolo enorme centrato che cresce lettera per
 * lettera (animazione CSS `intro-letter-grow` in index.html) dentro un
 * fade-in del contenitore, sottotitolo piccolo sotto che compare carattere
 * per carattere. Al completamento dell'ultimo carattere parte lo slideshow
 * (onTypographyComplete). Quando lo slideshow è avviato (isIntroUnderway) il
 * blocco esce con un fade e non torna più. Il logo in alto del riferimento è
 * eliminato di proposito.
 */
export default function IntroTypography({ isIntroUnderway, onTypographyComplete }) {
  const words = SUBTITLE.split(' ');
  const { typography, letter, subtitle } = INTRO;

  return (
    <AnimatePresence>
      {isIntroUnderway ? null : (
        <motion.div
          initial={{ x: '-50%', y: '-50%', opacity: 0 }}
          animate={{
            opacity: 1,
            transition: {
              delay: typography.fadeInDelay,
              duration: typography.fadeInDuration,
              ease: typography.ease,
            },
          }}
          exit={{
            opacity: 0,
            transition: {
              delay: typography.fadeOutDelay,
              duration: typography.fadeOutDuration,
              ease: typography.ease,
            },
          }}
          style={{
            display: 'flex',
            position: 'fixed',
            width: 'fit-content',
            top: '50%',
            left: '50%',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2,
            pointerEvents: 'none',
            color: '#ffffff',
          }}
        >
          <div
            style={{
              display: 'flex',
              marginBottom: INTRO.titleMarginBottomPx,
              gap: 8,
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <p
              style={{
                display: 'flex',
                width: '100%',
                padding: '0 10px',
                gap: INTRO.titleLetterGapPx,
                margin: 0,
              }}
            >
              {TITLE.split('').map((char, index) => (
                <span
                  key={`letter-${index}`}
                  className="intro-letter"
                  style={{ animationDelay: `${letter.delayBaseMs + index * letter.staggerMs}ms` }}
                >
                  {char}
                </span>
              ))}
            </p>
          </div>
          <div
            style={{
              display: 'flex',
              width: subtitle.widthPx,
              flexWrap: 'wrap',
              gap: subtitle.wordGapPx,
              justifyContent: 'center',
            }}
          >
            {words.map((word, wordIndex) => {
              const chars = word.split('');
              return (
                <div
                  key={`word-${wordIndex}`}
                  style={{ fontSize: subtitle.fontSizePx, textAlign: 'center' }}
                >
                  {chars.map((char, charIndex) => (
                    <motion.span
                      key={`char-${charIndex}`}
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: 1,
                        transition: {
                          delay:
                            subtitle.baseDelay +
                            (subtitle.wordStagger * wordIndex + subtitle.charStagger * charIndex),
                          duration: subtitle.duration,
                          ease: 'easeInOut',
                        },
                      }}
                      onAnimationComplete={() => {
                        if (wordIndex === words.length - 1 && charIndex === chars.length - 1) {
                          onTypographyComplete();
                        }
                      }}
                    >
                      {char}
                    </motion.span>
                  ))}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
