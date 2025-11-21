import React, { useState } from 'react';
import GabaritsTool from './apps/GabaritsTool';

export default function App() {
  const [activeTool, setActiveTool] = useState('gabarits');

  const tabButtonClass = (id) =>
    `px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
      activeTool === id
        ? 'bg-emerald-500 text-white'
        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
    }`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* HEADER global */}
      <header className="bg-slate-900 border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-3 py-3">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-bold flex items-center gap-2">
              <span className="bg-gradient-to-r from-green-600 to-emerald-500 px-2 py-0.5 rounded text-sm text-white">
                Django
              </span>
              Automator
            </h1>
          </div>

          <div className="flex gap-2">
            <button
              className={tabButtonClass('gabarits')}
              onClick={() => setActiveTool('gabarits')}
            >
              Gabarits
            </button>
            <button
              className={tabButtonClass('models')}
              onClick={() => setActiveTool('models')}
            >
              Models
            </button>
            <button
              className={tabButtonClass('forms')}
              onClick={() => setActiveTool('forms')}
            >
              Forms
            </button>
          </div>
        </div>
      </header>

      {/* Zone centrale : on affiche la sous-app choisie */}
      <main className="flex-1 flex">
        {activeTool === 'gabarits' && <GabaritsTool />}

        {activeTool === 'models' && (
          <Placeholder label="Générateur de models depuis des views" />
        )}

        {activeTool === 'forms' && (
          <Placeholder label="Générateur de forms / autres outils" />
        )}
      </main>
    </div>
  );
}

function Placeholder({ label }) {
  return (
    <div className="flex-1 flex items-center justify-center bg-slate-950">
      <div className="max-w-md text-center text-sm text-slate-300 px-4">
        <h2 className="text-lg font-semibold mb-2">{label}</h2>
        <p className="mb-3 text-slate-400">
          Cet onglet est prêt pour accueillir ton futur outil.
        </p>
        <p className="text-xs text-slate-500">
          Pour l’instant, seul l’onglet <strong>Gabarits</strong> est
          fonctionnel.
        </p>
      </div>
    </div>
  );
}
