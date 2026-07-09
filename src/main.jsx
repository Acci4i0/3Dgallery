import { createRoot } from 'react-dom/client';
// Font del titolo dell'intro (self-hostato via Fontsource, licenza SIL OFL).
import '@fontsource/monoton';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(<App />);
