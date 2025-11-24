import React, { useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import ViewsConfigOptions from "../components/options/ViewsConfigOptions";
// import n from '../apps/api/generate/models.js';

const copyToClipboard = async (text, message) => {
    try { await navigator.clipboard.writeText(text || ""); alert(message); } catch (e) { console.error(e); alert('Échec de la copie.'); }
};

const downloadFile = (filename, content) => {
    const blob = new Blob([content || ""], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
};

export default function ModelsViewsTool() {
    const [appName, setAppName] = useState("");
    const [prompt, setPrompt] = useState("");
    const [viewOptions, setViewOptions] = useState({ list: true, detail: true, create: true, update: true, delete: true });
    const [outputModels, setOutputModels] = useState("");
    const [outputViews, setOutputViews] = useState("");
    const [outputUrls, setOutputUrls] = useState("");
    const [parsedModels, setParsedModels] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showUrls, setShowUrls] = useState(false);

    const handleGenerate = async () => {
        if (!appName || !prompt) { alert("Merci de renseigner le nom de l'app et un prompt."); return; }
        setLoading(true);
        setOutputModels(""); setOutputViews(""); setOutputUrls(""); setParsedModels(null);

        try {
            // 1) models
            const modelsResp = await fetch("/api/models", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ appName, prompt })
            });
            if (!modelsResp.ok) {
                const err = await modelsResp.json().catch(() => ({}));
                throw new Error(err.error || `Erreur generation modèles (${modelsResp.status})`);
            }
            const modelsData = await modelsResp.json();
            const pm = modelsData.parsedModels || modelsData.models || null;
            const modelsCode = modelsData.modelsCode || modelsData.models || "";
            setParsedModels(pm);
            setOutputModels(modelsCode || "// Aucun models.py généré");

            // 2) views
            const viewsResp = await fetch("/api/views", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ appName, parsedModels: pm, viewOptions })
            });
            if (!viewsResp.ok) {
                const err = await viewsResp.json().catch(() => ({}));
                throw new Error(err.error || `Erreur generation views (${viewsResp.status})`);
            }
            const viewsData = await viewsResp.json();
            const viewsCode = viewsData.viewsCode || viewsData.views || "";
            const urlsCode = viewsData.urlsCode || viewsData.urls || "";
            setOutputViews(viewsCode || "// Aucun views.py généré");
            setOutputUrls(urlsCode || "// Aucun urls.py généré");
        } catch (error) {
            console.error("Generation pipeline error:", error);
            alert("Erreur lors de la génération: " + (error.message || error));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col w-full h-screen bg-slate-900 text-slate-100">
            <div className="w-full px-6 py-4 border-b border-slate-800 bg-slate-950">
                <div className="flex items-center justify-between">
                    <h1 className="text-lg font-semibold text-emerald-400">Générateur de Vues à partir de Models (AI)</h1>
                    <div className="flex items-center gap-3">
                        <button onClick={handleGenerate} disabled={loading} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 rounded text-xs">
                            {loading ? "Génération…" : "Générer (AI)"}
                        </button>
                        <button onClick={() => { setOutputModels(""); setOutputViews(""); setOutputUrls(""); setParsedModels(null); }} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs">Réinitialiser</button>
                    </div>
                </div>
            </div>

            <div className="w-full border-b border-slate-800 px-4 py-4">
                <ViewsConfigOptions
                    appName={appName} setAppName={setAppName}
                    prompt={prompt} setPrompt={setPrompt}
                    onGenerate={handleGenerate}
                    mode={"prompt"} setMode={() => { }}
                    viewOptions={viewOptions} setViewOptions={setViewOptions}
                />
            </div>

            <PanelGroup direction="horizontal" className="flex-1">
                <Panel defaultSize={50} minSize={20} className="min-h-0">
                    <div className="h-full flex flex-col bg-slate-900">
                        <div className="flex justify-between items-center px-4 py-2 border-b border-slate-800">
                            <span className="text-blue-400 font-semibold text-sm">models.py</span>
                            <div className="flex gap-2">
                                <button onClick={() => copyToClipboard(outputModels, "Code models.py copié!")} className="text-xs px-3 py-1 bg-blue-700 hover:bg-blue-800 rounded" disabled={!outputModels}>Copier</button>
                                <button onClick={() => downloadFile(`${appName || "models"}.models.py`, outputModels)} className="text-xs px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded" disabled={!outputModels}>Télécharger</button>
                            </div>
                        </div>

                        <pre className="flex-1 overflow-auto max-h-full min-h-0 p-4 text-xs font-mono bg-slate-800">
                            {outputModels || "// Aucune donnée de modèles. Entrez un prompt et générez."}
                        </pre>
                    </div>
                </Panel>

                <PanelResizeHandle className="w-1 bg-slate-700" />

                <Panel defaultSize={50} minSize={20} className="min-h-0">
                    <div className="h-full flex flex-col bg-slate-900">
                        <div className="flex justify-between items-center px-4 py-2 border-b border-slate-800">
                            <span className="text-blue-400 font-semibold text-sm">views.py</span>
                            <div className="flex gap-2">
                                <button onClick={() => copyToClipboard(outputViews, "Code views.py copié!")} className="text-xs px-3 py-1 bg-blue-700 hover:bg-blue-800 rounded" disabled={!outputViews}>Copier</button>
                                <button onClick={() => downloadFile(`${appName || "views"}.views.py`, outputViews)} className="text-xs px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded" disabled={!outputViews}>Télécharger</button>
                                <button onClick={() => setShowUrls(true)} className="text-xs px-3 py-1 bg-blue-700 hover:bg-blue-800 rounded" disabled={!outputUrls}>Voir les URLs</button>
                            </div>
                        </div>

                        <pre className="flex-1 overflow-auto max-h-full min-h-0 p-4 text-xs font-mono bg-slate-800">
                            {outputViews || "// Aucune vue générée"}
                        </pre>
                    </div>
                </Panel>
            </PanelGroup>

            {showUrls && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-50">
                    <div className="bg-slate-900 border border-slate-700 rounded-lg w-[90%] max-w-2xl p-4">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-blue-400 text-sm font-semibold">urls.py</h2>
                            <div className="flex items-center gap-2">
                                <button onClick={() => copyToClipboard(outputUrls, "Code urls.py copié!")} className="text-xs px-3 py-1 bg-blue-700 hover:bg-blue-800 rounded" disabled={!outputUrls}>Copier</button>
                                <button onClick={() => downloadFile(`${appName || "urls"}.urls.py`, outputUrls)} className="text-xs px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded" disabled={!outputUrls}>Télécharger</button>
                                <button onClick={() => setShowUrls(false)} className="text-slate-400 hover:text-white text-lg font-bold">✕</button>
                            </div>
                        </div>

                        <pre className="bg-slate-800 p-3 rounded text-xs max-h-[65vh] overflow-auto font-mono">
                            {outputUrls || "// Aucun URL généré"}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}
