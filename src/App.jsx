  // src/App.jsx
  import React, { useState } from 'react';
  import GabaritsTool from './apps/GabaritsTool';
  import AdminModelsTool from './apps/admin/AdminModelsTool';
  import ModelsViewsTool from './apps/ModelsViewsTool';

  export default function App() {
    const [activeTool, setActiveTool] = useState('gabarits'); // 'gabarits' | 'admin' | 'models' | 'forms'

    const tabButtonClass = (id) =>
      `px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${activeTool === id
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
                className={tabButtonClass('admin')}
                onClick={() => setActiveTool('admin')}
              >
                Admin
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

          {activeTool === 'admin' && <AdminModelsTool />}

          {activeTool === 'models' &&
            //   (
            //   <Placeholder label="Générateur de models depuis des views (à venir)" />
            // )
            <ModelsViewsTool />
          }

          {activeTool === 'forms' && (
            <Placeholder label="Générateur de forms / autres outils (à venir)" />
          )}
        </main>
      </div>
    );
  }
