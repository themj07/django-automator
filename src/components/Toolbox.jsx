import React from 'react';
import { Repeat, Eraser, Braces, Layers, User, Calendar, MessageSquare, Code } from 'lucide-react';

const Toolbox = ({ 
  loopConfig, setLoopConfig, insertLoop,
  varName, setVarName, insertVariable,
  insertTextAtSelection 
}) => {
  return (
    <div className="bg-slate-800 border-b border-slate-700 px-3 py-2 flex items-center gap-4 overflow-x-auto flex-shrink-0">
      
      {/* LOOP TOOL */}
      <div className="flex items-center gap-2 border-r border-slate-600 pr-4">
        <div className="flex items-center gap-1 text-orange-400 font-bold text-xs select-none">
          <Repeat size={14}/> <span className="hidden lg:inline">Loop</span>
        </div>
        <input 
          type="text" 
          value={loopConfig.varName} 
          onChange={(e) => setLoopConfig({...loopConfig, varName: e.target.value})} 
          className="bg-slate-900 w-14 border border-slate-600 rounded px-1 py-1 text-xs text-white outline-none focus:border-orange-500" 
          placeholder="item"
        />
        <span className="text-slate-500 text-[10px]">in</span>
        <input 
          type="text" 
          value={loopConfig.listName} 
          onChange={(e) => setLoopConfig({...loopConfig, listName: e.target.value})} 
          className="bg-slate-900 w-16 border border-slate-600 rounded px-1 py-1 text-xs text-white outline-none focus:border-orange-500" 
          placeholder="items"
        />
        <label className="flex items-center gap-1 ml-1 cursor-pointer text-[10px] text-slate-300" title="Smart Clean">
          <input 
            type="checkbox" 
            checked={loopConfig.smartClean} 
            onChange={(e) => setLoopConfig({...loopConfig, smartClean: e.target.checked})} 
            className="accent-orange-500 rounded-sm"
          />
          <Eraser size={12}/>
        </label>
        <button onClick={insertLoop} className="bg-orange-600 hover:bg-orange-500 text-white px-2 py-1 rounded text-xs font-bold ml-1 shadow-sm">
          Go
        </button>
      </div>

      {/* VARIABLE TOOL */}
      <div className="flex items-center gap-2 border-r border-slate-600 pr-4">
        <div className="flex items-center gap-1 text-blue-400 font-bold text-xs select-none">
          <Braces size={14}/> <span className="hidden lg:inline">Var</span>
        </div>
        <input 
          type="text" 
          value={varName} 
          onChange={(e) => setVarName(e.target.value)} 
          className="bg-slate-900 w-20 border border-slate-600 rounded px-1 py-1 text-xs text-white outline-none focus:border-blue-500" 
          placeholder="nom_var"
        />
        <button onClick={insertVariable} className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold ml-1 shadow-sm">
          Insérer
        </button>
      </div>

      {/* SNIPPETS */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-purple-400 font-bold text-xs select-none mr-1">
          <Layers size={14}/> <span className="hidden lg:inline">Snippets</span>
        </div>
        
        <button onClick={() => insertTextAtSelection('{% if user.is_authenticated %}\n', '\n{% endif %}')} className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-1 rounded text-[10px] font-bold border border-slate-600 transition-colors">
          <User size={10} className="text-green-400"/> Auth
        </button>
        
        <button onClick={() => insertTextAtSelection('{{ value|date:"d M Y" }}', '', true)} className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-1 rounded text-[10px] font-bold border border-slate-600 transition-colors">
          <Calendar size={10} className="text-yellow-400"/> Date
        </button>
        
        <button onClick={() => insertTextAtSelection('{% comment %}\n', '\n{% endcomment %}')} className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-1 rounded text-[10px] font-bold border border-slate-600 transition-colors">
          <MessageSquare size={10} className="text-blue-400"/> Comment
        </button>
        
        <button onClick={() => insertTextAtSelection('{% block name %}\n', '\n{% endblock %}', false)} className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-1 rounded text-[10px] font-bold border border-slate-600 transition-colors">
          <Code size={10} className="text-purple-400"/> Block
        </button>
      </div>
    </div>
  );
};

export default Toolbox;