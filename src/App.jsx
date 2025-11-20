import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Copy, Code, FileCode, Trash2, CheckCircle, Settings, 
  UploadCloud, RefreshCw, Repeat, Split, Wand2, 
  Download, Edit2, X, Archive, Link as LinkIcon, Eraser,
  Braces, User, Calendar, MessageSquare, Layers, FileDiff, Eye, EyeOff
} from 'lucide-react';

// --- CONSTANTES & DONNÉES ---

// Liste des balises HTML qui ne se ferment pas (Void Elements)
const VOID_TAGS = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];

// --- ALGORITHME DE DIFF (Simple Line Diff) ---

// Calcule la différence ligne par ligne entre deux textes
const computeDiff = (oldText, newText) => {
  if (!oldText) oldText = "";
  if (!newText) newText = "";
  
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  
  // Matrice LCS (Longest Common Subsequence)
  const matrix = Array(oldLines.length + 1).fill(null).map(() => Array(newLines.length + 1).fill(0));
  
  for (let i = 1; i <= oldLines.length; i++) {
    for (let j = 1; j <= newLines.length; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1] + 1;
      } else {
        matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
      }
    }
  }
  
  // Backtracking pour reconstruire le diff
  let i = oldLines.length;
  let j = newLines.length;
  const diffs = [];
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      diffs.unshift({ type: 'same', value: oldLines[i - 1], oldLine: i, newLine: j });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
      diffs.unshift({ type: 'add', value: newLines[j - 1], newLine: j });
      j--;
    } else {
      diffs.unshift({ type: 'remove', value: oldLines[i - 1], oldLine: i });
      i--;
    }
  }
  
  return diffs;
};

// --- COMPOSANT DIFF VIEWER ---

const DiffViewer = ({ oldCode, newCode }) => {
  const diffs = useMemo(() => computeDiff(oldCode, newCode), [oldCode, newCode]);
  
  return (
    <div className="flex-1 overflow-auto custom-scrollbar bg-slate-950 p-4 font-mono text-xs leading-5">
      {diffs.map((part, index) => (
        <div 
          key={index} 
          className={`flex ${
            part.type === 'add' ? 'bg-green-900/30 text-green-100' : 
            part.type === 'remove' ? 'bg-red-900/30 text-red-300 opacity-70' : 
            'text-slate-400'
          } hover:bg-slate-800/50 transition-colors`}
        >
           {/* Numéros de ligne */}
           <div className="w-8 text-right select-none pr-2 text-slate-600 border-r border-slate-800 mr-2 flex-shrink-0">
             {part.oldLine || ''}
           </div>
           <div className="w-8 text-right select-none pr-2 text-slate-600 border-r border-slate-800 mr-2 flex-shrink-0">
             {part.newLine || ''}
           </div>
           
           {/* Contenu */}
           <div className="whitespace-pre-wrap break-all flex-1">
             <span className="select-none mr-2 font-bold w-4 inline-block text-center">
               {part.type === 'add' ? '+' : part.type === 'remove' ? '-' : ' '}
             </span>
             {part.value}
           </div>
        </div>
      ))}
      {diffs.length === 0 && <div className="text-slate-500 italic text-center mt-10">Aucune différence ou fichiers vides.</div>}
    </div>
  );
};

// --- COMPOSANT PRINCIPAL ---

export default function App() {
  // --- ÉTATS ---
  // MODIFICATION : Initialisation vide
  const [files, setFiles] = useState([]); 
  const [activeFileId, setActiveFileId] = useState(null);
  const [inputCode, setInputCode] = useState('');

  const [outputCode, setOutputCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [editingFileId, setEditingFileId] = useState(null);
  const [extractionMode, setExtractionMode] = useState(false);
  const [selectedForExtraction, setSelectedForExtraction] = useState([]);
  
  // Mode Vue : 'split' (Editeur) ou 'diff' (Comparaison)
  const [viewMode, setViewMode] = useState('split'); 

  // Config Outils
  const [loopConfig, setLoopConfig] = useState({ varName: 'item', listName: 'items', smartClean: true });
  const [varName, setVarName] = useState('variable');
  
  const [options, setOptions] = useState({
    convertStatic: true,
    convertUrls: true,
    addExtends: true,
    injectCsrf: true,
    cleanComments: true,
    baseTemplateName: 'bases/baseUser.html',
    staticPrefix: 'assets',
  });

  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- LOGIQUE FICHIERS ---
  const handleFileUpload = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const uploadedFiles = Array.from(e.target.files);
    const newFilesPromises = uploadedFiles.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve({ id: Date.now() + Math.random(), name: file.name, content: event.target.result });
        reader.readAsText(file);
      });
    });

    Promise.all(newFilesPromises).then(loadedFiles => {
      setFiles(prev => [...prev, ...loadedFiles]);
      if (loadedFiles.length > 0) {
        setActiveFileId(loadedFiles[0].id);
        setInputCode(loadedFiles[0].content);
      }
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const updateFileName = (e, id) => {
    const newName = e.target.value;
    setFiles(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
  };

  const handleNameKeyDown = (e) => { if (e.key === 'Enter') setEditingFileId(null); };

  const downloadFile = (e, file) => {
    e.stopPropagation();
    const contentToDownload = (activeFileId === file.id) ? outputCode : file.content;
    const blob = new Blob([contentToDownload], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAll = () => {
    files.forEach((file, index) => {
      setTimeout(() => {
        const blob = new Blob([file.content], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, index * 500);
    });
  };

  const selectFile = (id) => {
    if (extractionMode) {
      if (selectedForExtraction.includes(id)) setSelectedForExtraction(prev => prev.filter(fid => fid !== id));
      else if (selectedForExtraction.length < 2) setSelectedForExtraction(prev => [...prev, id]);
      return;
    }
    if (activeFileId) setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: inputCode } : f));
    const file = files.find(f => f.id === id);
    if (file) {
      setActiveFileId(id);
      setInputCode(file.content);
    }
  };

  const removeFile = (e, id) => {
    e.stopPropagation();
    const newFiles = files.filter(f => f.id !== id);
    setFiles(newFiles);
    setSelectedForExtraction(prev => prev.filter(fid => fid !== id));
    if (activeFileId === id) {
      if (newFiles.length > 0) {
        setActiveFileId(newFiles[0].id);
        setInputCode(newFiles[0].content);
      } else {
        setActiveFileId(null);
        setInputCode('');
      }
    }
  };

  // --- TRANSFORM ENGINE ---
  const addPrefix = (path, prefix) => {
    const cleanPath = path.trim().replace(/^\/+/, '');
    const cleanPrefix = prefix.trim().replace(/\/$/, '');
    if (!cleanPrefix) return cleanPath;
    if (cleanPath.startsWith(cleanPrefix + '/')) return cleanPath;
    return `${cleanPrefix}/${cleanPath}`;
  };

  const processDjangoCode = (code, config) => {
    if (!code) return '';
    let newCode = code;
    
    if (config.cleanComments) newCode = newCode.replace(/<!--[\s\S]*?-->/g, ''); 
    if (config.injectCsrf) newCode = newCode.replace(/(<form\s+[^>]*method=["']?POST["']?[^>]*>)/gi, '$1\n  {% csrf_token %}');
    
    if (config.convertUrls) {
      newCode = newCode.replace(/href=["']([\w-./]+\.html)["']/g, (match, p1) => {
        const parts = p1.split('/');
        let urlName = parts[parts.length - 1].replace('.html', '');
        if (urlName === 'index') urlName = 'index';
        return `href="{% url '${urlName}' %}"`;
      });
    }
    
    const staticExtensions = ['css', 'js', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'ico', 'woff', 'woff2', 'ttf', 'eot', 'mp4', 'webm', 'webp'];
    if (config.convertStatic) {
      const staticRegex = new RegExp(`(href|src)=["'](?!https?:|#|{|mailto:|tel:|javascript:)([^"']+\\.(${staticExtensions.join('|')}))["']`, 'gi');
      newCode = newCode.replace(staticRegex, (match, attr, path) => {
        const newPath = addPrefix(path, config.staticPrefix);
        return `${attr}="{% static '${newPath}' %}"`;
      });
      const cssUrlRegex = new RegExp(`url\\(\\s*['"]?(?!https?:|data:|{|%)([^'"\)]+\\.(${staticExtensions.join('|')}))['"]?\\s*\\)`, 'gi');
      newCode = newCode.replace(cssUrlRegex, (match, path) => {
         const newPath = addPrefix(path, config.staticPrefix);
         return `url("{% static '${newPath}' %}")`;
      });
    }
    return newCode;
  };

  const generateBaseFromSelection = () => {
    if (selectedForExtraction.length !== 2) return;
    const file1 = files.find(f => f.id === selectedForExtraction[0]);
    const file2 = files.find(f => f.id === selectedForExtraction[1]);
    
    const lines1 = file1.content.split('\n');
    const lines2 = file2.content.split('\n');
    
    let i = 0;
    while (i < lines1.length && i < lines2.length && lines1[i].trim() === lines2[i].trim()) { i++; }
    let j1 = lines1.length - 1;
    let j2 = lines2.length - 1;
    while (j1 >= 0 && j2 >= 0 && lines1[j1].trim() === lines2[j2].trim()) { j1--; j2--; }
    if (i > j1) i = j1; 

    const headerPart = lines1.slice(0, i).join('\n');
    const footerPart = lines1.slice(j1 + 1).join('\n');
    const unique1 = lines1.slice(i, j1 + 1).join('\n');
    const unique2 = lines2.slice(i, j2 + 1).join('\n');
    
    const conf = { ...options, addExtends: false };
    const procHeader = processDjangoCode(headerPart, conf);
    const procFooter = processDjangoCode(footerPart, conf);
    const procU1 = processDjangoCode(unique1, conf);
    const procU2 = processDjangoCode(unique2, conf);
    
    const baseContent = `{% load static %}\n${procHeader}\n    {% block content %}\n    {% endblock content %}\n${procFooter}`;
    const child1Content = `{% extends 'auto_base.html' %}\n{% load static %}\n\n{% block content %}\n${procU1}\n{% endblock content %}`;
    const child2Content = `{% extends 'auto_base.html' %}\n{% load static %}\n\n{% block content %}\n${procU2}\n{% endblock content %}`;
    
    const newFiles = [
      { id: Date.now() + 1, name: 'auto_base.html', content: baseContent },
      { id: Date.now() + 2, name: file1.name.replace('.html', '_child.html'), content: child1Content },
      { id: Date.now() + 3, name: file2.name.replace('.html', '_child.html'), content: child2Content },
    ];
    setFiles(prev => [...prev, ...newFiles]);
    setExtractionMode(false);
    setSelectedForExtraction([]);
    setActiveFileId(newFiles[0].id);
    setInputCode(newFiles[0].content);
  };

  const convertToDjango = () => {
    let finalCode = processDjangoCode(inputCode, options);
    if (options.addExtends) {
      const hasBlock = finalCode.includes('{% block content %}');
      const hasExtends = /\{%\s*extends\s+['"]/.test(finalCode);
      if (!hasBlock && !hasExtends) {
        const loadStaticTag = "{% load static %}\n";
        const hasStaticTags = finalCode.includes('{% static');
        let wrapper = `{% extends '${options.baseTemplateName}' %}\n`;
        if (hasStaticTags || options.convertStatic) wrapper += loadStaticTag;
        wrapper += `\n{% block content %}\n${finalCode}\n{% endblock content %}`;
        finalCode = wrapper;
      }
    }
    setOutputCode(finalCode);
  };
  useEffect(() => { convertToDjango(); }, [inputCode, options]);

  // --- TOOLS UTILS ---
  const findClosingTagIndex = (str, startIndex, tagName) => {
    if (VOID_TAGS.includes(tagName.toLowerCase())) return startIndex; 
    let depth = 0;
    const regex = new RegExp(`<\/?${tagName}(\\s|>)`, 'gi');
    regex.lastIndex = startIndex;
    let match;
    while ((match = regex.exec(str)) !== null) {
      if (match[0].toLowerCase().startsWith(`<${tagName}`)) depth++;
      else {
        if (depth === 0) return match.index + match[0].length;
        depth--;
      }
    }
    const simpleClose = new RegExp(`</${tagName}>`, 'i');
    const matchClose = str.substring(startIndex).match(simpleClose);
    if (matchClose) return startIndex + matchClose.index + matchClose[0].length;
    return -1;
  };

  const insertTextAtSelection = (before, after = '', replace = false) => {
    const textarea = inputRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = inputCode.substring(start, end);
    let newText = replace ? `${before}${after}` : `${before}${selectedText}${after}`;
    const newCode = inputCode.substring(0, start) + newText + inputCode.substring(end);
    setInputCode(newCode);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + newText.length, start + newText.length);
    }, 0);
  };

  const insertLoop = () => {
    const textarea = inputRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start === end) { alert("Sélectionne d'abord une partie du code !"); return; }
    const selectedText = inputCode.substring(start, end);
    let textAfter = inputCode.substring(end);

    if (loopConfig.smartClean) {
      const tagMatch = selectedText.match(/^<([a-zA-Z0-9]+)(\s+[^>]*)?>/);
      if (tagMatch) {
        const tagName = tagMatch[1];
        if (!VOID_TAGS.includes(tagName.toLowerCase())) {
            const classMatch = selectedText.match(/class=["']([^"']*)["']/);
            const className = classMatch ? classMatch[1] : null;
            let siblingRegex;
            if (className) {
              const safeClass = className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              siblingRegex = new RegExp(`^\\s*<${tagName}[^>]*class=["'][^"']*${safeClass}[^"']*["'][^>]*>`, 'i');
            } else {
              siblingRegex = new RegExp(`^\\s*<${tagName}(\\s|>)`, 'i');
            }
            while (true) {
              const match = textAfter.match(siblingRegex);
              if (!match) break;
              const siblingContentStart = match.index + match[0].length;
              const closingIndexRelative = findClosingTagIndex(textAfter, siblingContentStart, tagName);
              if (closingIndexRelative !== -1) {
                 let afterTagIndex = closingIndexRelative;
                 if (textAfter[afterTagIndex - 1] !== '>') {
                     const closingBracket = textAfter.indexOf('>', afterTagIndex);
                     if (closingBracket !== -1) afterTagIndex = closingBracket + 1;
                 }
                 textAfter = textAfter.substring(afterTagIndex);
                 if (match.index === 0 && afterTagIndex === 0) break; 
              } else break;
            }
        }
      }
    }
    const loopBlock = `\n{% for ${loopConfig.varName} in ${loopConfig.listName} %}\n${selectedText}\n{% endfor %}\n`;
    const newCode = inputCode.substring(0, start) + loopBlock + textAfter;
    setInputCode(newCode);
    setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + loopBlock.length, start + loopBlock.length); }, 0);
  };

  const insertVariable = () => {
    const textarea = inputRef.current;
    if (textarea && textarea.selectionStart !== textarea.selectionEnd) {
      insertTextAtSelection(`{{ ${varName} }}`, '', true);
    } else {
      insertTextAtSelection(`{{ ${varName} }}`, '', false);
    }
  };

  const insertAuth = () => insertTextAtSelection('{% if user.is_authenticated %}\n', '\n{% endif %}');
  const insertDate = () => insertTextAtSelection('{{ value|date:"d M Y" }}', '', true);
  const insertComment = () => insertTextAtSelection('{% comment %}\n', '\n{% endcomment %}');
  const insertBlock = () => insertTextAtSelection('{% block name %}\n', '\n{% endblock %}', false);
  const handleCopy = () => { navigator.clipboard.writeText(outputCode); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col md:flex-row overflow-hidden">
      
      {/* SIDEBAR */}
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

      {/* MAIN */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="bg-slate-900 border-b border-slate-800 p-3 shadow-md z-10">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold flex items-center gap-2"><span className="bg-gradient-to-r from-green-600 to-emerald-500 px-2 py-0.5 rounded text-sm text-white">Django</span> Automator</h1>
            <div className="flex gap-2">
                <button 
                  onClick={() => setViewMode(viewMode === 'split' ? 'diff' : 'split')} 
                  className={`text-[10px] font-bold px-3 py-1.5 rounded border transition-colors flex items-center gap-1.5 ${viewMode === 'diff' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'}`}
                >
                  {viewMode === 'split' ? <FileDiff size={12}/> : <Code size={12}/>}
                  {viewMode === 'split' ? 'VOIR DIFF' : 'MODE ÉDITEUR'}
                </button>
                <button onClick={() => { setInputCode(''); setFiles([]); setActiveFileId(null); }} className="text-[10px] font-bold text-slate-500 hover:text-red-400 flex items-center gap-1"><RefreshCw size={12} /> RESET</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 text-xs bg-slate-950/50 p-2 rounded border border-slate-800">
            <div className="lg:col-span-2 flex flex-col gap-1"><label className="font-semibold text-slate-400">Static</label><input type="text" value={options.staticPrefix} onChange={(e) => setOptions({...options, staticPrefix: e.target.value})} className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-green-400 outline-none"/></div>
            <div className={`lg:col-span-3 flex flex-col gap-1 transition-opacity ${!options.addExtends && 'opacity-30'}`}><label className="font-semibold text-slate-400">Base</label><input type="text" value={options.baseTemplateName} onChange={(e) => setOptions({...options, baseTemplateName: e.target.value})} className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-blue-400 outline-none"/></div>
            <div className="lg:col-span-7 flex flex-wrap items-end gap-x-4 gap-y-2 pb-1">
               <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white"><input type="checkbox" checked={options.convertUrls} onChange={e => setOptions({...options, convertUrls: e.target.checked})} className="accent-green-500"/> <LinkIcon size={12} className="text-green-400"/> URLs</label>
               <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white"><input type="checkbox" checked={options.injectCsrf} onChange={e => setOptions({...options, injectCsrf: e.target.checked})} className="accent-green-500"/> Auto CSRF</label>
               <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white"><input type="checkbox" checked={options.addExtends} onChange={e => setOptions({...options, addExtends: e.target.checked})} className="accent-green-500"/> Extends</label>
               <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white"><input type="checkbox" checked={options.convertStatic} onChange={e => setOptions({...options, convertStatic: e.target.checked})} className="accent-green-500"/> Static</label>
               <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white"><input type="checkbox" checked={options.cleanComments} onChange={e => setOptions({...options, cleanComments: e.target.checked})} className="accent-green-500"/> Clean Comments</label>
            </div>
          </div>
        </div>

        {/* TOOLBOX (Masquée en mode Diff) */}
        {viewMode === 'split' && (
            <div className="bg-slate-800 border-b border-slate-700 px-3 py-2 flex items-center gap-4 overflow-x-auto flex-shrink-0">
            
            {/* 1. LOOP TOOL */}
            <div className="flex items-center gap-2 border-r border-slate-600 pr-4">
                <div className="flex items-center gap-1 text-orange-400 font-bold text-xs select-none"><Repeat size={14}/> <span className="hidden lg:inline">Loop</span></div>
                <input type="text" value={loopConfig.varName} onChange={(e) => setLoopConfig({...loopConfig, varName: e.target.value})} className="bg-slate-900 w-14 border border-slate-600 rounded px-1 py-1 text-xs text-white outline-none focus:border-orange-500" placeholder="item"/>
                <span className="text-slate-500 text-[10px]">in</span>
                <input type="text" value={loopConfig.listName} onChange={(e) => setLoopConfig({...loopConfig, listName: e.target.value})} className="bg-slate-900 w-16 border border-slate-600 rounded px-1 py-1 text-xs text-white outline-none focus:border-orange-500" placeholder="items"/>
                <label className="flex items-center gap-1 ml-1 cursor-pointer text-[10px] text-slate-300" title="Smart Clean"><input type="checkbox" checked={loopConfig.smartClean} onChange={(e) => setLoopConfig({...loopConfig, smartClean: e.target.checked})} className="accent-orange-500 rounded-sm"/><Eraser size={12}/></label>
                <button onClick={insertLoop} className="bg-orange-600 hover:bg-orange-500 text-white px-2 py-1 rounded text-xs font-bold ml-1 shadow-sm">Go</button>
            </div>

            {/* 2. VARIABLE TOOL */}
            <div className="flex items-center gap-2 border-r border-slate-600 pr-4">
                <div className="flex items-center gap-1 text-blue-400 font-bold text-xs select-none"><Braces size={14}/> <span className="hidden lg:inline">Var</span></div>
                <input type="text" value={varName} onChange={(e) => setVarName(e.target.value)} className="bg-slate-900 w-20 border border-slate-600 rounded px-1 py-1 text-xs text-white outline-none focus:border-blue-500" placeholder="nom_var"/>
                <button onClick={insertVariable} className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold ml-1 shadow-sm">Insérer</button>
            </div>

            {/* 3. SNIPPETS LIBRARY */}
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-purple-400 font-bold text-xs select-none mr-1"><Layers size={14}/> <span className="hidden lg:inline">Snippets</span></div>
                
                <button onClick={insertAuth} className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-1 rounded text-[10px] font-bold border border-slate-600 transition-colors" title="{% if user.is_authenticated %}"><User size={10} className="text-green-400"/> Auth</button>
                <button onClick={insertDate} className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-1 rounded text-[10px] font-bold border border-slate-600 transition-colors" title="{{ value|date:'d M Y' }}"><Calendar size={10} className="text-yellow-400"/> Date</button>
                <button onClick={insertComment} className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-1 rounded text-[10px] font-bold border border-slate-600 transition-colors" title="{% comment %}"><MessageSquare size={10} className="text-blue-400"/> Comment</button>
                <button onClick={insertBlock} className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-1 rounded text-[10px] font-bold border border-slate-600 transition-colors" title="{% block name %}"><Code size={10} className="text-purple-400"/> Block</button>
            </div>

            </div>
        )}

        {/* MAIN EDITOR AREA */}
        {viewMode === 'split' ? (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden bg-slate-950">
            <div className="flex flex-col h-full border-r border-slate-800 relative">
                <div className="absolute top-0 left-0 right-0 h-6 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between px-3 z-10"><span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Code size={10}/> HTML EDITABLE (INPUT)</span></div>
                <textarea ref={inputRef} className="flex-1 w-full bg-transparent text-slate-300 font-mono text-xs md:text-sm p-4 pt-8 outline-none resize-none custom-scrollbar focus:bg-slate-900/30" placeholder="Code HTML..." value={inputCode} onChange={(e) => setInputCode(e.target.value)} spellCheck="false"/>
            </div>
            <div className="flex flex-col h-full bg-black/20 relative">
                <div className="absolute top-0 left-0 right-0 h-8 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between px-3 z-10">
                <span className="text-[10px] font-bold text-green-500 flex items-center gap-1"><Settings size={10}/> DJANGO RESULTAT</span>
                <button onClick={handleCopy} className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-700 text-slate-300 hover:bg-slate-600">{copied ? <CheckCircle size={10}/> : <Copy size={10}/>} {copied ? 'Copié !' : 'Copier'}</button>
                </div>
                <textarea className="flex-1 w-full bg-transparent text-green-400 font-mono text-xs md:text-sm p-4 pt-10 outline-none resize-none custom-scrollbar" value={outputCode} readOnly placeholder="Résultat..."/>
            </div>
            </div>
        ) : (
            <DiffViewer oldCode={inputCode} newCode={outputCode} />
        )}
      </div>
      <style>{`.custom-scrollbar::-webkit-scrollbar{width:10px;height:10px}.custom-scrollbar::-webkit-scrollbar-track{background:#0f172a}.custom-scrollbar::-webkit-scrollbar-thumb{background:#334155;border-radius:5px;border:2px solid #0f172a}.custom-scrollbar::-webkit-scrollbar-thumb:hover{background:#475569}`}</style>
    </div>
  );
}
