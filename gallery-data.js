// I 20 frame della nuvola. Posizioni (unita' mondo), colori e flag isPrimary
// sono i dati CMS reali del riferimento [CMS] (ANALYSIS.md §4). Le immagini
// vengono da una selezione casuale della cartella locale (vedi
// public/img/_selection.json); le dimensioni sono normalizzate a larghezza
// 2000 px come la convenzione dell'originale (piani = 0.0015 x px, quindi la
// scala mondo resta identica). Descrizioni (exhibitionName/artistName) vuote
// di proposito: la caption in focus non mostra nulla.

export default [
  { id:  1, src: '/img/photo02.jpg', position: { x:   -4.5, y:  0.0, z: -12.0 }, width: 2000, height: 3556, isPrimary: false, backgroundColor: '#ffffff', highlightColor: '#E98822', exhibitionName: '', artistName: '' },
  { id:  2, src: '/img/photo18.jpg', position: { x:  -13.0, y:  0.5, z:  -8.0 }, width: 2000, height: 3548, isPrimary: false, backgroundColor: '#ffffff', highlightColor: '#CE584E', exhibitionName: '', artistName: '' },
  { id:  3, src: '/img/photo21.jpg', position: { x:   -7.0, y: -3.5, z:  -5.0 }, width: 2000, height: 2667, isPrimary: false, backgroundColor: '#F3FEC5', highlightColor: '#000000', exhibitionName: '', artistName: '' },
  { id:  4, src: '/img/photo14.jpg', position: { x:  -12.0, y: -1.0, z: -15.5 }, width: 2000, height: 3002, isPrimary: false, backgroundColor: '#f3f3f3', highlightColor: '#2362B7', exhibitionName: '', artistName: '' },
  { id:  5, src: '/img/photo19.jpg', position: { x:  -6.25, y: -3.5, z: -11.0 }, width: 2000, height: 2667, isPrimary: false, backgroundColor: '#FA86A9', highlightColor: '#ffffff', exhibitionName: '', artistName: '' },
  { id:  6, src: '/img/photo12.jpg', position: { x:   -2.0, y: -7.0, z: -12.0 }, width: 2000, height: 2677, isPrimary: false, backgroundColor: '#ffffff', highlightColor: '#83CE57', exhibitionName: '', artistName: '' },
  { id:  7, src: '/img/photo10.jpg', position: { x:    5.0, y: -4.0, z: -14.0 }, width: 2000, height: 2667, isPrimary: false, backgroundColor: '#907ED8', highlightColor: '#ffffff', exhibitionName: '', artistName: '' },
  { id:  8, src: '/img/photo05.jpg', position: { x:    6.5, y: -8.0, z: -10.0 }, width: 2000, height: 3179, isPrimary: false, backgroundColor: '#000000', highlightColor: '#ffffff', exhibitionName: '', artistName: '' },
  { id:  9, src: '/img/photo01.jpg', position: { x:    7.0, y: -3.0, z:  -4.5 }, width: 2000, height: 3187, isPrimary: false, backgroundColor: '#1F1E4D', highlightColor: '#ffffff', exhibitionName: '', artistName: '' },
  { id: 10, src: '/img/photo11.jpg', position: { x:   11.0, y:  2.0, z: -19.0 }, width: 2000, height: 3552, isPrimary: false, backgroundColor: '#1E1E1E', highlightColor: '#F9DCA1', exhibitionName: '', artistName: '' },
  { id: 11, src: '/img/photo04.jpg', position: { x:   15.5, y: -1.0, z: -20.0 }, width: 2000, height: 2667, isPrimary: false, backgroundColor: '#FAE9D7', highlightColor: '#194d25', exhibitionName: '', artistName: '' },
  { id: 12, src: '/img/photo16.jpg', position: { x:   15.0, y:  2.0, z: -13.0 }, width: 2000, height: 3557, isPrimary: false, backgroundColor: '#000000', highlightColor: '#d9d9d9', exhibitionName: '', artistName: '' },
  { id: 13, src: '/img/photo09.jpg', position: { x:    0.0, y:  0.0, z:   0.0 }, width: 2000, height: 2667, isPrimary: true , backgroundColor: '#f4efc9', highlightColor: '#3F6631', exhibitionName: '', artistName: '' },
  { id: 14, src: '/img/photo07.jpg', position: { x:   -3.0, y:  8.5, z: -12.0 }, width: 2000, height: 3015, isPrimary: false, backgroundColor: '#130506', highlightColor: '#FF3535', exhibitionName: '', artistName: '' },
  { id: 15, src: '/img/photo08.jpg', position: { x:    4.0, y:  6.0, z:  -9.0 }, width: 2000, height: 2667, isPrimary: false, backgroundColor: '#E4EEFA', highlightColor: '#FF6600', exhibitionName: '', artistName: '' },
  { id: 16, src: '/img/photo17.jpg', position: { x:   -5.0, y:  4.5, z: -15.0 }, width: 2000, height: 3552, isPrimary: false, backgroundColor: '#024442', highlightColor: '#ffffff', exhibitionName: '', artistName: '' },
  { id: 17, src: '/img/photo15.jpg', position: { x:    2.0, y:  4.0, z: -11.0 }, width: 2000, height: 3000, isPrimary: false, backgroundColor: '#667643', highlightColor: '#EFE9D7', exhibitionName: '', artistName: '' },
  { id: 18, src: '/img/photo20.jpg', position: { x:   -7.0, y:  4.0, z:  -7.0 }, width: 2000, height: 2667, isPrimary: false, backgroundColor: '#EFFDFD', highlightColor: '#000', exhibitionName: '', artistName: '' },
  { id: 19, src: '/img/photo13.jpg', position: { x:  -10.0, y:  6.0, z:  -5.0 }, width: 2000, height: 2667, isPrimary: false, backgroundColor: '#FBE6DD', highlightColor: '#263062', exhibitionName: '', artistName: '' },
  { id: 20, src: '/img/photo06.jpg', position: { x:    7.0, y:  4.0, z:  -5.0 }, width: 2000, height: 3554, isPrimary: false, backgroundColor: '#ffffff', highlightColor: '#39ff14', exhibitionName: '', artistName: '' },
];

// Le 8 immagini dello slideshow dell'intro (scelta casuale): l'ultima e'
// l'immagine del frame primario, come nel riferimento dove l'ultima slide
// resta sul piano che si restringe e diventa il primario in nuvola.
export const INTRO_SLIDES = [
  '/img/photo03.jpg',
  '/img/photo04.jpg',
  '/img/photo07.jpg',
  '/img/photo14.jpg',
  '/img/photo17.jpg',
  '/img/photo11.jpg',
  '/img/photo16.jpg',
  '/img/photo09.jpg',
];
