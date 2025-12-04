import React, { useMemo } from 'react';
import { computeDiff } from '../utils/diffEngine';

const DiffViewer = ({ oldCode, newCode }) => {
  const diffs = useMemo(() => computeDiff(oldCode, newCode), [oldCode, newCode]);
  return (
    <div className="flex-1 overflow-auto custom-scrollbar bg-slate-950 p-4 font-mono text-xs leading-5">
      {diffs.map((part, index) => (
        <div key={index} className={`flex ${part.type === 'add' ? 'bg-green-900/30 text-green-100' : part.type === 'remove' ? 'bg-red-900/30 text-red-300 opacity-70' : 'text-slate-400'} hover:bg-slate-800/50 transition-colors`}>
           <div className="w-8 text-right select-none pr-2 text-slate-600 border-r border-slate-800 mr-2 flex-shrink-0">{part.oldLine || ''}</div>
           <div className="w-8 text-right select-none pr-2 text-slate-600 border-r border-slate-800 mr-2 flex-shrink-0">{part.newLine || ''}</div>
           <div className="whitespace-pre-wrap break-all flex-1"><span className="select-none mr-2 font-bold w-4 inline-block text-center">{part.type === 'add' ? '+' : part.type === 'remove' ? '-' : ' '}</span>{part.value}</div>
        </div>
      ))}
      {diffs.length === 0 && <div className="text-slate-500 italic text-center mt-10">Aucune différence ou fichiers vides.</div>}
    </div>
  );
};

export default DiffViewer;