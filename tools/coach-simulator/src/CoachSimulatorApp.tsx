import { useState } from 'react';

import { CoachLanguageQaPanel } from './CoachLanguageQaPanel';
import { CoachSimulator } from './coachSimulator';

type AppTab = 'simulator' | 'language-qa';

export function CoachSimulatorApp() {
  const [activeTab, setActiveTab] = useState<AppTab>('simulator');

  return (
    <>
      <nav className="app-tabs">
        <button
          type="button"
          className={activeTab === 'simulator' ? 'app-tab active' : 'app-tab'}
          onClick={() => setActiveTab('simulator')}
        >
          Simulator
        </button>
        <button
          type="button"
          className={activeTab === 'language-qa' ? 'app-tab active' : 'app-tab'}
          onClick={() => setActiveTab('language-qa')}
        >
          Language QA
        </button>
      </nav>
      {activeTab === 'simulator' ? <CoachSimulator /> : <CoachLanguageQaPanel />}
    </>
  );
}
