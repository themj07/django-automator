// src/apps/GabaritsTool.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link as LinkIcon, Code, Settings } from 'lucide-react';

import FileExplorer from '../components/FileExplorer';
import Toolbox from '../components/Toolbox';
import CodeToolLayout from '../components/CodeToolLayout';

import { processDjangoCode } from '../utils/djangoProcessor';
import { VOID_TAGS, findClosingTagIndex } from '../utils/htmlHelpers';
import useUndoRedo from '../utils/useUndoRedo';

export default function GabaritsTool() {
  // --- ÉTATS FICHIERS ---
  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);

  // --- CODE INPUT / OUTPUT ---
  const [inputCode, setInputCode] = useState('');
  const [outputCode, setOutputCode] = useState('');

  // --- OPTIONS DJANGO ---
  const [options, setOptions] = useState({
    convertStatic: true,
    convertUrls: true,
    addExtends: true,
    injectCsrf: true,
    cleanComments: true,
    baseTemplateName: 'bases/baseUser.html',
    staticPrefix: 'assets',
  });

  // --- AUTRES ÉTATS SPÉCIFIQUES GABARITS ---
  const [editingFileId, setEditingFileId] = useState(null);
  const [extractionMode, setExtractionMode] = useState(false);
  const [selectedForExtraction, setSelectedForExtraction] = useState([]);
  const [loopConfig, setLoopConfig] = useState({
    varName: 'item',
    listName: 'items',
    smartClean: true,
  });
  const [varName, setVarName] = useState('variable');

  const inputRef = useRef(null);

  // --- HISTORIQUE UNDO/REDO (générique via hook) ---
  const {
    undoStack,
    redoStack,
    canUndo,
    canRedo,
    pushHistory,
    undo: handleUndo,
    redo: handleRedo,
    resetHistory,
  } = useUndoRedo(inputCode, setInputCode);

  // --- GESTION FICHIERS ---

  const handleFileUpload = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const uploadedFiles = Array.from(e.target.files);

    const newFilesPromises = uploadedFiles.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) =>
          resolve({
            id: Date.now() + Math.random(),
            name: file.name,
            content: event.target.result,
          });
        reader.readAsText(file);
      });
    });

    Promise.all(newFilesPromises).then((loadedFiles) => {
      setFiles((prev) => [...prev, ...loadedFiles]);
      if (loadedFiles.length > 0) {
        setActiveFileId(loadedFiles[0].id);
        setInputCode(loadedFiles[0].content);
        resetHistory();
      }
    });
  };

  const updateFileName = (e, id) => {
    const newName = e.target.value;
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, name: newName } : f))
    );
  };

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') setEditingFileId(null);
  };

  const downloadFile = (e, file) => {
    e.stopPropagation();
    const contentToDownload =
      activeFileId === file.id ? outputCode : file.content;
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
        URL.revokeObjectURL(url);
      }, index * 500);
    });
  };

  const selectFile = (id) => {
    if (extractionMode) {
      if (selectedForExtraction.includes(id)) {
        setSelectedForExtraction((prev) => prev.filter((fid) => fid !== id));
      } else if (selectedForExtraction.length < 2) {
        setSelectedForExtraction((prev) => [...prev, id]);
      }
      return;
    }

    if (activeFileId) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === activeFileId ? { ...f, content: inputCode } : f
        )
      );
    }
    const file = files.find((f) => f.id === id);
    if (file) {
      setActiveFileId(id);
      setInputCode(file.content);
      resetHistory();
    }
  };

  const removeFile = (e, id) => {
    e.stopPropagation();
    const newFiles = files.filter((f) => f.id !== id);
    setFiles(newFiles);
    setSelectedForExtraction((prev) => prev.filter((fid) => fid !== id));
    if (activeFileId === id) {
      if (newFiles.length > 0) {
        setActiveFileId(newFiles[0].id);
        setInputCode(newFiles[0].content);
      } else {
        setActiveFileId(null);
        setInputCode('');
      }
      resetHistory();
    }
  };

  // --- EXTRACTION BASE / ENFANTS (inchangée, juste déplacée) ---

  const generateBaseFromSelection = () => {
    if (selectedForExtraction.length !== 2) return;
    const file1 = files.find((f) => f.id === selectedForExtraction[0]);
    const file2 = files.find((f) => f.id === selectedForExtraction[1]);
    if (!file1 || !file2) return;

    const lines1 = file1.content.split('\n');
    const lines2 = file2.content.split('\n');

    let i = 0;
    while (
      i < lines1.length &&
      i < lines2.length &&
      lines1[i].trim() === lines2[i].trim()
    ) {
      i++;
    }
    let j1 = lines1.length - 1;
    let j2 = lines2.length - 1;
    while (j1 >= 0 && j2 >= 0 && lines1[j1].trim() === lines2[j2].trim()) {
      j1--;
      j2--;
    }
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
      {
        id: Date.now() + 1,
        name: 'auto_base.html',
        content: baseContent,
      },
      {
        id: Date.now() + 2,
        name: file1.name.replace('.html', '_child.html'),
        content: child1Content,
      },
      {
        id: Date.now() + 3,
        name: file2.name.replace('.html', '_child.html'),
        content: child2Content,
      },
    ];

    setFiles((prev) => [...prev, ...newFiles]);
    setExtractionMode(false);
    setSelectedForExtraction([]);
    setActiveFileId(newFiles[0].id);
    setInputCode(newFiles[0].content);
    resetHistory();
  };

  // --- CONVERSION DJANGO (identique, mais sortie dans outputCode) ---

  const convertToDjango = () => {
    let finalCode = processDjangoCode(inputCode, options);

    const hasStaticTags = finalCode.includes('{% static');
    const hasLoadStatic = /\{%\s*load\s+static\s*%}/.test(finalCode);

    if (options.addExtends) {
      const hasBlock = finalCode.includes('{% block content %}');
      const hasExtends = /\{%\s*extends\s+['"]/.test(finalCode);

      if (!hasBlock && !hasExtends) {
        let wrapper = `{% extends '${options.baseTemplateName}' %}\n`;
        if ((hasStaticTags || options.convertStatic) && !hasLoadStatic) {
          wrapper += "{% load static %}\n";
        }
        wrapper += `\n{% block content %}\n${finalCode}\n{% endblock content %}`;
        finalCode = wrapper;
      } else {
        if ((hasStaticTags || options.convertStatic) && !hasLoadStatic) {
          finalCode = `{% load static %}\n` + finalCode;
        }
      }
    } else {
      if ((hasStaticTags || options.convertStatic) && !hasLoadStatic) {
        finalCode = `{% load static %}\n` + finalCode;
      }
    }

    setOutputCode(finalCode);
  };

  useEffect(() => {
    convertToDjango();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputCode, options]);

  // --- INSERTION DE TEXTE POUR TOOLBOX ---

  const insertTextAtSelection = (before, after = '', replace = false) => {
    const textarea = inputRef.current;
    if (!textarea) return;

    pushHistory();

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const prevScrollTop = textarea.scrollTop;

    const selectedText = inputCode.substring(start, end);
    const newText = replace
      ? `${before}${after}`
      : `${before}${selectedText}${after}`;

    const newCode =
      inputCode.substring(0, start) + newText + inputCode.substring(end);

    setInputCode(newCode);

    const caretPos = start + before.length;

    setTimeout(() => {
      if (!inputRef.current) return;
      const ta = inputRef.current;
      ta.focus();
      ta.setSelectionRange(caretPos, caretPos);
      ta.scrollTop = prevScrollTop;
    }, 0);
  };

  const insertLoop = () => {
    const textarea = inputRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start === end) {
      alert("Sélectionne d'abord une partie du code !");
      return;
    }

    pushHistory();

    const prevScrollTop = textarea.scrollTop;

    const selectedText = inputCode.substring(start, end);
    let textAfter = inputCode.substring(end);

    if (loopConfig.smartClean) {
      const trimmedSelection = selectedText.trim();
      const tagMatch = trimmedSelection.match(
        /^<([a-zA-Z0-9-]+)(\s+[^>]*)?>/
      );

      if (tagMatch) {
        const tagName = tagMatch[1];

        if (!VOID_TAGS.includes(tagName.toLowerCase())) {
          const classMatch = trimmedSelection.match(
            /class=["']([^"']*)["']/
          );
          let siblingRegex;

          if (classMatch) {
            const classes = classMatch[1]
              .trim()
              .split(/\s+/)
              .filter((c) => c.length > 0);
            if (classes.length > 0) {
              const firstClass = classes[0].replace(
                /[.*+?^${}()|[\]\\]/g,
                '\\$&'
              );
              siblingRegex = new RegExp(
                `^\\s*<${tagName}[^>]*class=["'][^"']*${firstClass}[^"']*["'][^>]*>`,
                'i'
              );
            } else {
              siblingRegex = new RegExp(
                `^\\s*<${tagName}(\\s|>)`,
                'i'
              );
            }
          } else {
            siblingRegex = new RegExp(
              `^\\s*<${tagName}(\\s|>)`,
              'i'
            );
          }

          let maxIterations = 200;
          while (maxIterations > 0) {
            maxIterations--;

            let tempText = textAfter;
            let totalSkip = 0;

            while (true) {
              const spaceMatch = tempText.match(/^\s+/);
              if (spaceMatch) {
                const len = spaceMatch[0].length;
                totalSkip += len;
                tempText = tempText.substring(len);
                continue;
              }

              const commentMatch =
                tempText.match(/^<!--[\s\S]*?-->/);
              if (commentMatch) {
                const len = commentMatch[0].length;
                totalSkip += len;
                tempText = tempText.substring(len);
                continue;
              }
              break;
            }

            const match = tempText.match(siblingRegex);
            if (!match || match.index !== 0) break;

            const tagOpenEndIdx = totalSkip + match[0].length;
            const closingIndex = findClosingTagIndex(
              textAfter,
              tagOpenEndIdx,
              tagName
            );

            if (closingIndex !== -1) {
              textAfter = textAfter.substring(closingIndex);
            } else {
              break;
            }
          }
        }
      }
    }

    const loopBlock =
      `\n{% for ${loopConfig.varName} in ${loopConfig.listName} %}\n` +
      selectedText +
      `\n{% endfor %}\n`;

    const newCode = inputCode.substring(0, start) + loopBlock + textAfter;
    setInputCode(newCode);

    const caretPos = start;

    setTimeout(() => {
      if (!inputRef.current) return;
      const ta = inputRef.current;
      ta.focus();
      ta.setSelectionRange(caretPos, caretPos);
      ta.scrollTop = prevScrollTop;
    }, 0);
  };

  const insertVariable = () => {
    const textarea = inputRef.current;
    if (!textarea) return;
    if (textarea.selectionStart !== textarea.selectionEnd) {
      insertTextAtSelection(`{{ ${varName} }}`, '', true);
    } else {
      insertTextAtSelection(`{{ ${varName} }}`, '', false);
    }
  };

  const handleResetAll = () => {
    setInputCode('');
    setFiles([]);
    setActiveFileId(null);
    resetHistory();
  };

  // --- CONTENU DE LA BARRE D’OPTIONS SPÉCIFIQUE GABARITS ---

  const optionsBar = (
    <>
      <div className="lg:col-span-2 flex flex-col gap-1">
        <label className="font-semibold text-slate-400">Static</label>
        <input
          type="text"
          value={options.staticPrefix}
          onChange={(e) =>
            setOptions({
              ...options,
              staticPrefix: e.target.value,
            })
          }
          className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-green-400 outline-none"
        />
      </div>
      <div
        className={`lg:col-span-3 flex flex-col gap-1 transition-opacity ${
          !options.addExtends && 'opacity-30'
        }`}
      >
        <label className="font-semibold text-slate-400">Base</label>
        <input
          type="text"
          value={options.baseTemplateName}
          onChange={(e) =>
            setOptions({
              ...options,
              baseTemplateName: e.target.value,
            })
          }
          className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-blue-400 outline-none"
        />
      </div>
      <div className="lg:col-span-7 flex flex-wrap items-end gap-x-4 gap-y-2 pb-1">
        <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
          <input
            type="checkbox"
            checked={options.convertUrls}
            onChange={(e) =>
              setOptions({
                ...options,
                convertUrls: e.target.checked,
              })
            }
            className="accent-green-500"
          />
          <LinkIcon size={12} className="text-green-400" /> URLs
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
          <input
            type="checkbox"
            checked={options.injectCsrf}
            onChange={(e) =>
              setOptions({
                ...options,
                injectCsrf: e.target.checked,
              })
            }
            className="accent-green-500"
          />
          Auto CSRF
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
          <input
            type="checkbox"
            checked={options.addExtends}
            onChange={(e) =>
              setOptions({
                ...options,
                addExtends: e.target.checked,
              })
            }
            className="accent-green-500"
          />
          Extends
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
          <input
            type="checkbox"
            checked={options.convertStatic}
            onChange={(e) =>
              setOptions({
                ...options,
                convertStatic: e.target.checked,
              })
            }
            className="accent-green-500"
          />
          Static
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
          <input
            type="checkbox"
            checked={options.cleanComments}
            onChange={(e) =>
              setOptions({
                ...options,
                cleanComments: e.target.checked,
              })
            }
            className="accent-green-500"
          />
          Clean Comments
        </label>
      </div>
    </>
  );

  // --- TOOLBOX (inchangée, mais passée au layout) ---

  const toolbox = (
    <Toolbox
      loopConfig={loopConfig}
      setLoopConfig={setLoopConfig}
      insertLoop={insertLoop}
      varName={varName}
      setVarName={setVarName}
      insertVariable={insertVariable}
      insertTextAtSelection={insertTextAtSelection}
    />
  );

  // --- SIDEBAR FICHIERS (réutilisable dans d'autres apps) ---

  const sidebar = (
    <FileExplorer
      files={files}
      activeFileId={activeFileId}
      editingFileId={editingFileId}
      extractionMode={extractionMode}
      selectedForExtraction={selectedForExtraction}
      setExtractionMode={setExtractionMode}
      setSelectedForExtraction={setSelectedForExtraction}
      generateBaseFromSelection={generateBaseFromSelection}
      handleFileUpload={handleFileUpload}
      updateFileName={updateFileName}
      setEditingFileId={setEditingFileId}
      handleNameKeyDown={handleNameKeyDown}
      selectFile={selectFile}
      removeFile={removeFile}
      downloadFile={downloadFile}
      downloadAll={downloadAll}
    />
  );

  // --- RENDER FINAL VIA LAYOUT GÉNÉRIQUE ---

  return (
    <CodeToolLayout
      sidebar={sidebar}
      badgeLabel="Gabarits"
      badgeClass="bg-slate-800 text-emerald-400"
      title="HTML → Templates Django"
      optionsBar={optionsBar}
      toolbar={toolbox}
      inputCode={inputCode}
      onInputChange={setInputCode}
      inputRef={inputRef}
      inputPlaceholder="Code HTML..."
      inputHeader={
        <>
          <Code size={10} /> HTML EDITABLE (INPUT)
        </>
      }
      outputCode={outputCode}
      outputPlaceholder="Résultat..."
      outputHeader={
        <>
          <Settings size={10} /> DJANGO RESULTAT
        </>
      }
      onResetAll={handleResetAll}
      onUndo={handleUndo}
      onRedo={handleRedo}
      canUndo={canUndo}
      canRedo={canRedo}
    />
  );
}
