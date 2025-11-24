// src/components/CodeToolLayout.jsx
import React, { useState } from 'react';
import {
  Code as CodeIcon,
  FileDiff,
  RefreshCw,
  Undo2,
  Redo2,
  Copy,
  CheckCircle,
  Settings as SettingsIcon,
} from 'lucide-react';
import DiffViewer from './DiffViewer'; // réutilise ton DiffViewer existant

const CodeToolLayout = ({
  sidebar,               // <FileExplorer ... /> ou autre
  badgeLabel,            // ex: "Gabarits"
  badgeClass = 'bg-slate-800 text-emerald-400',
  title,                 // ex: "HTML → Templates Django"

  optionsBar,            // contenu de la barre d'options (grid)
  toolbar,               // ex: <Toolbox ... /> (affiché seulement en mode split)

  inputCode,
  onInputChange,
  inputRef,
  inputPlaceholder = 'Code source...',
  inputHeader,           // ReactNode pour le titre du panneau gauche

  outputCode,
  outputPlaceholder = 'Résultat...',
  outputHeader,          // ReactNode pour le titre du panneau droit

  onResetAll,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) => {
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'diff'
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (navigator && navigator.clipboard) {
      navigator.clipboard.writeText(outputCode || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleViewMode = () =>
    setViewMode((prev) => (prev === 'split' ? 'diff' : 'split'));

  return (
    <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
      {/* SIDEBAR (explorateur de fichiers, etc.) */}
      {sidebar}

      {/* ZONE PRINCIPALE */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* HEADER */}
        <div className="bg-slate-900 border-b border-slate-800 p-3 shadow-md z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              {badgeLabel && (
                <span className={`px-2 py-0.5 rounded ${badgeClass}`}>
                  {badgeLabel}
                </span>
              )}
              {title && <span>{title}</span>}
            </div>

            <div className="flex gap-2">
              {onUndo && (
                <button
                  onClick={onUndo}
                  disabled={!canUndo}
                  className="text-[10px] font-bold flex items-center gap-1 px-2 py-1 rounded border border-slate-700 text-slate-300 disabled:text-slate-700 disabled:border-slate-800 hover:text-white hover:border-slate-500 transition-colors"
                >
                  <Undo2 size={12} /> UNDO
                </button>
              )}

              {onRedo && (
                <button
                  onClick={onRedo}
                  disabled={!canRedo}
                  className="text-[10px] font-bold flex items-center gap-1 px-2 py-1 rounded border border-slate-700 text-slate-300 disabled:text-slate-700 disabled:border-slate-800 hover:text-white hover:border-slate-500 transition-colors"
                >
                  <Redo2 size={12} /> REDO
                </button>
              )}

              {onResetAll && (
                <button
                  onClick={onResetAll}
                  className="text-[10px] font-bold text-slate-500 hover:text-red-400 flex items-center gap-1"
                >
                  <RefreshCw size={12} /> RESET
                </button>
              )}

              <button
                onClick={toggleViewMode}
                className={`text-[10px] font-bold px-3 py-1.5 rounded border transition-colors flex items-center gap-1.5 ${
                  viewMode === 'diff'
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {viewMode === 'split' ? <FileDiff size={12} /> : <CodeIcon size={12} />}
                {viewMode === 'split' ? 'VOIR DIFF' : 'MODE ÉDITEUR'}
              </button>
            </div>
          </div>

          {/* BARRE D’OPTIONS */}
          {optionsBar && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 text-xs bg-slate-950/50 p-2 rounded border border-slate-800">
              {optionsBar}
            </div>
          )}
        </div>

        {/* TOOLBAR (loop, var, snippets, etc.) */}
        {viewMode === 'split' && toolbar}

        {/* ZONE D’ÉDITION / DIFF */}
        {viewMode === 'split' ? (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden bg-slate-950">
            {/* INPUT */}
            <div className="flex flex-col h-full border-r border-slate-800 relative">
              <div className="absolute top-0 left-0 right-0 h-6 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between px-3 z-10">
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                  {inputHeader || (
                    <>
                      <CodeIcon size={10} /> INPUT
                    </>
                  )}
                </span>
              </div>
              <textarea
                ref={inputRef}
                className="flex-1 w-full bg-transparent text-slate-300 font-mono text-xs md:text-sm p-4 pt-8 outline-none resize-none custom-scrollbar focus:bg-slate-900/30"
                placeholder={inputPlaceholder}
                value={inputCode}
                onChange={(e) => onInputChange(e.target.value)}
                spellCheck="false"
              />
            </div>

            {/* OUTPUT */}
            <div className="flex flex-col h-full bg-black/20 relative">
              <div className="absolute top-0 left-0 right-0 h-8 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between px-3 z-10">
                <span className="text-[10px] font-bold text-green-500 flex items-center gap-1">
                  {outputHeader || (
                    <>
                      <SettingsIcon size={10} /> OUTPUT
                    </>
                  )}
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-700 text-slate-300 hover:bg-slate-600"
                >
                  {copied ? <CheckCircle size={10} /> : <Copy size={10} />}
                  {copied ? 'Copié !' : 'Copier'}
                </button>
              </div>
              <textarea
                className="flex-1 w-full bg-transparent text-green-400 font-mono text-xs md:text-sm p-4 pt-10 outline-none resize-none custom-scrollbar"
                value={outputCode}
                readOnly
                placeholder={outputPlaceholder}
              />
            </div>
          </div>
        ) : (
          <DiffViewer oldCode={inputCode} newCode={outputCode} />
        )}
      </div>

      {/* Scrollbar globale (une seule fois ici pour tous les outils) */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar{width:10px;height:10px}
        .custom-scrollbar::-webkit-scrollbar-track{background:#0f172a}
        .custom-scrollbar::-webkit-scrollbar-thumb{background:#334155;border-radius:5px;border:2px solid #0f172a}
        .custom-scrollbar::-webkit-scrollbar-thumb:hover{background:#475569}
      `}</style>
    </div>
  );
};

export default CodeToolLayout;
