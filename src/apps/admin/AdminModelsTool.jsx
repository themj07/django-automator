// src/apps/admin/AdminModelsTool.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Database, Settings } from 'lucide-react';

import CodeToolLayout from '../../components/CodeToolLayout';
import FileExplorer from '../../components/FileExplorer';
import useUndoRedo from '../../utils/useUndoRedo';
import { generateAdminFromModels } from '../../utils/djangoAdminGenerator';

export default function AdminModelsTool() {
  // === Gestion des fichiers (même logique que Gabarits) ===
  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  const [editingFileId, setEditingFileId] = useState(null);

  // props pour FileExplorer (on garde le mode extraction mais on ne l’utilise pas vraiment ici)
  const [extractionMode, setExtractionMode] = useState(false);
  const [selectedForExtraction, setSelectedForExtraction] = useState([]);
  const generateBaseFromSelection = () => {}; // no-op pour Admin

  // === Code models / admin ===
  const [modelsCode, setModelsCode] = useState('');
  const [adminCode, setAdminCode] = useState('');

  const [options, setOptions] = useState({
    useDecorators: true,
    includeListDisplay: true,
    maxListDisplay: 5,
    includeSearchFields: true,
    includeListFilter: true,
    includeOrdering: true,
    includeReadOnlyAutoFields: true,
    includePrepopulatedSlug: true,
  });

  const inputRef = useRef(null);

  // Historique sur le code des models
  const {
    canUndo,
    canRedo,
    undo,
    redo,
    pushHistory,
    resetHistory,
  } = useUndoRedo(modelsCode, setModelsCode);

  // === FICHIERS ===

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
            content: event.target.result.toString(),
          });
        reader.readAsText(file);
      });
    });

    Promise.all(newFilesPromises).then((loadedFiles) => {
      setFiles((prev) => [...prev, ...loadedFiles]);
      if (loadedFiles.length > 0) {
        const first = loadedFiles[0];
        setActiveFileId(first.id);
        setModelsCode(first.content);
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

  const selectFile = (id) => {
    // on sauvegarde le contenu courant dans le fichier actif
    if (activeFileId) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === activeFileId ? { ...f, content: modelsCode } : f
        )
      );
    }

    const file = files.find((f) => f.id === id);
    if (file) {
      setActiveFileId(id);
      setModelsCode(file.content);
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
        setModelsCode(newFiles[0].content);
      } else {
        setActiveFileId(null);
        setModelsCode('');
      }
      resetHistory();
    }
  };

  const downloadFile = (e, file) => {
    e.stopPropagation();
    const contentToDownload =
      activeFileId === file.id ? adminCode : file.content;

    const blob = new Blob([contentToDownload], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // si c'est le fichier actif, on propose un nom admin_...
    const name =
      activeFileId === file.id
        ? file.name.replace(/\.py$/, '_admin.py')
        : file.name;

    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAll = () => {
    files.forEach((file, index) => {
      setTimeout(() => {
        const blob = new Blob([file.content], { type: 'text/x-python' });
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

  // === GÉNÉRATION ADMIN ===

  useEffect(() => {
    setAdminCode(generateAdminFromModels(modelsCode, options));
  }, [modelsCode, options]);

  const handleResetAll = () => {
    setModelsCode('');
    setAdminCode('');
    setFiles([]);
    setActiveFileId(null);
    resetHistory();
  };

  // === BARRE D’OPTIONS ===

  const optionsBar = (
    <>
      <div className="lg:col-span-4 flex flex-col gap-1">
        <label className="font-semibold text-slate-400">
          Importer models.py
        </label>
        <label className="inline-flex items-center gap-2 text-[11px] text-slate-300 bg-slate-900 border border-slate-700 rounded px-2 py-1 cursor-pointer hover:border-emerald-500 hover:text-emerald-300">
          <span>Choisir un fichier .py</span>
          <input
            type="file"
            accept=".py,.txt"
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>
      </div>

      <div className="lg:col-span-3 flex flex-col gap-1">
        <label className="font-semibold text-slate-400">Style d&apos;inscription</label>
        <div className="flex gap-3 text-[11px] text-slate-300">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              className="accent-emerald-500"
              checked={options.useDecorators}
              onChange={() =>
                setOptions({ ...options, useDecorators: true })
              }
            />
            @admin.register
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              className="accent-emerald-500"
              checked={!options.useDecorators}
              onChange={() =>
                setOptions({ ...options, useDecorators: false })
              }
            />
            admin.site.register
          </label>
        </div>
      </div>

      <div className="lg:col-span-2 flex flex-col gap-1">
        <label className="font-semibold text-slate-400">list_display max</label>
        <input
          type="number"
          min={1}
          max={12}
          value={options.maxListDisplay}
          onChange={(e) =>
            setOptions({
              ...options,
              maxListDisplay: Number(e.target.value) || 1,
            })
          }
          className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 outline-none"
        />
      </div>

      <div className="lg:col-span-6 flex flex-wrap items-end gap-x-4 gap-y-1 pb-1">
        {[
          ['list_display', 'includeListDisplay'],
          ['search_fields', 'includeSearchFields'],
          ['list_filter', 'includeListFilter'],
          ['ordering', 'includeOrdering'],
          ['readonly auto', 'includeReadOnlyAutoFields'],
          ['prepopulated slug', 'includePrepopulatedSlug'],
        ].map(([label, key]) => (
          <label
            key={key}
            className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white text-[11px]"
          >
            <input
              type="checkbox"
              className="accent-emerald-500"
              checked={options[key]}
              onChange={(e) =>
                setOptions({ ...options, [key]: e.target.checked })
              }
            />
            {label}
          </label>
        ))}
      </div>
    </>
  );

  // === SIDEBAR : on réutilise *exactement* le même explorateur ===

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

  // === RENDER FINAL via CodeToolLayout ===

  return (
    <CodeToolLayout
      sidebar={sidebar}
      badgeLabel="Admin"
      badgeClass="bg-slate-800 text-sky-400"
      title="Générateur de admin.py à partir de models.py"
      optionsBar={optionsBar}
      toolbar={null}
      inputCode={modelsCode}
      onInputChange={(val) => {
        pushHistory();
        setModelsCode(val);
      }}
      inputRef={inputRef}
      inputPlaceholder="Code de ton models.py (ou celui du fichier sélectionné à gauche)..."
      inputHeader={
        <>
          <Database size={10} /> models.py (INPUT)
        </>
      }
      outputCode={adminCode}
      outputPlaceholder="# Le admin.py généré apparaîtra ici"
      outputHeader={
        <>
          <Settings size={10} /> admin.py (OUTPUT)
        </>
      }
      onResetAll={handleResetAll}
      onUndo={undo}
      onRedo={redo}
      canUndo={canUndo}
      canRedo={canRedo}
    />
  );
}
