import React, { useRef } from 'react';
import { FileCode, CheckCircle, Split, Wand2, UploadCloud, Edit2, Download, Trash2, Archive } from 'lucide-react';

const FileExplorer = ({ 
  files, activeFileId, editingFileId, extractionMode, selectedForExtraction, 
  setExtractionMode, setSelectedForExtraction, generateBaseFromSelection, 
  handleFileUpload, updateFileName, setEditingFileId, handleNameKeyDown, 
  selectFile, removeFile, downloadFile, downloadAll 
}) => {
  const fileInputRef = useRef(null);

  return (
    <div className="w-full md:w-72 bg-slate-900 border-r border-slate-800 flex flex-col h-[300px] md:h-screen flex-shrink-0 relative">
       <div className="p-4 border-b border-slate-800">
         <h2 className="font-bold text-white flex items-center gap-2 mb-4"><FileCode size={20} className="text-green-500"/> <span>Explorateur</span></h2>
         <button onClick={() => { setExtractionMode(!extractionMode); setSelectedForExtraction([]); }} className={`w-full py-3 px-4 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg ${extractionMode ? 'bg-purple-600 text-white ring-2 ring-purple-400' : 'bg-slate-800 text-slate-300 hover:bg-purple-900/50 hover:text-white border border-slate-700'}`}>
           {extractionMode ? <CheckCircle size={16}/> : <Split size={16}/>} {extractionMode ? 'Mode Actif' : 'Extraire Base & Enfants'}
         </button>
         {extractionMode && (
           <div className="mt-3 bg-purple-900/20 p-3 rounded border border-purple-500/30 text-center">
             <p className="text-[10px] text-purple-300 mb-2">Sélectionne 2 fichiers identiques.</p>
             <button onClick={generateBaseFromSelection} disabled={selectedForExtraction.length !== 2} className="w-full bg-purple-600 disabled:bg-slate-700 disabled:text-slate-500 text-white py-1.5 rounded text-[10px] font-bold flex items-center justify-center gap-1"><Wand2 size={12}/> FUSIONNER ({selectedForExtraction.length}/2)</button>
           </div>
         )}
       </div>
       
       <div className="p-4 border-b border-slate-800">
          <label className="group flex flex-col items-center justify-center w-full h-12 border-2 border-slate-700 border-dashed rounded-lg cursor-pointer bg-slate-800 hover:bg-slate-750 transition-all hover:border-green-500/50">
             <div className="flex items-center justify-center gap-2"><UploadCloud className="w-5 h-5 text-slate-400 group-hover:text-green-400" /><span className="text-[10px] text-slate-500 group-hover:text-slate-300">Ajouter fichiers</span></div>
             <input ref={fileInputRef} type="file" className="hidden" multiple onChange={handleFileUpload} accept=".html,.txt,.htm" />
         </label>
       </div>

       <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
         {files.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 opacity-50">
               <FileCode size={32} className="text-slate-600 mb-2"/>
               <p className="text-xs text-slate-500 text-center px-4">Aucun fichier chargé.<br/>Utilisez le bouton ci-dessus.</p>
            </div>
         )}
         {files.map(file => (
           <div key={file.id} onClick={() => !editingFileId && selectFile(file.id)} className={`group relative flex flex-col p-2 rounded-md cursor-pointer transition-all border ${extractionMode ? (selectedForExtraction.includes(file.id) ? 'bg-purple-900/40 border-purple-500 text-white' : 'bg-slate-800 border-transparent opacity-60') : (activeFileId === file.id ? 'bg-green-900/20 border-green-600/50 text-green-400' : 'bg-slate-800/50 border-transparent hover:bg-slate-800 text-slate-300')}`}>
               <div className="flex justify-between items-center w-full">
                   <div className="flex items-center gap-2 overflow-hidden flex-1">
                   {extractionMode && selectedForExtraction.includes(file.id) && <CheckCircle size={12} className="text-purple-400 flex-shrink-0"/>}
                   {editingFileId === file.id ? (
                       <input type="text" value={file.name} onClick={(e) => e.stopPropagation()} onChange={(e) => updateFileName(e, file.id)} onBlur={() => setEditingFileId(null)} onKeyDown={handleNameKeyDown} className="bg-slate-950 text-white text-xs px-1 py-0.5 rounded border border-blue-500 w-full outline-none" autoFocus />
                   ) : (<span className="text-xs font-mono truncate" title={file.name}>{file.name}</span>)}
                   </div>
                   {!extractionMode && (
                   <div className="flex items-center gap-1 ml-2">
                       {editingFileId === file.id ? <button onClick={(e) => {e.stopPropagation(); setEditingFileId(null);}} className="text-green-400 hover:text-green-300 p-1"><CheckCircle size={12}/></button> : (
                       <>
                           <button onClick={(e) => {e.stopPropagation(); setEditingFileId(file.id)}} className="text-slate-500 hover:text-blue-400 opacity-0 group-hover:opacity-100 p-1"><Edit2 size={12} /></button>
                           <button onClick={(e) => downloadFile(e, file)} className="text-slate-500 hover:text-green-400 opacity-0 group-hover:opacity-100 p-1"><Download size={12} /></button>
                           <button onClick={(e) => removeFile(e, file.id)} className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 p-1"><Trash2 size={12} /></button>
                       </>
                       )}
                   </div>
                   )}
               </div>
           </div>
         ))}
       </div>
       {files.length > 0 && !extractionMode && <div className="p-4 border-t border-slate-800 bg-slate-900"><button onClick={downloadAll} className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-2 rounded border border-slate-700 transition-colors"><Archive size={14} /> Tout télécharger</button></div>}
    </div>
  );
};

export default FileExplorer;