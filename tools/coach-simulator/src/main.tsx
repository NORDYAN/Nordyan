import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { CoachSimulatorApp } from './CoachSimulatorApp';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Coach simulator root element not found.');
}

createRoot(rootElement).render(
  <StrictMode>
    <CoachSimulatorApp />
  </StrictMode>,
);
