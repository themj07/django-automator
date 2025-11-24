import React from "react";
import ViewGenerationOptions from "./ViewGenerationOptions";

interface ViewOptions {
    list: boolean;
    detail: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
}

interface ViewsConfigOptionsProps {
    appName: string;
    setAppName: (value: string) => void;

    prompt: string;
    setPrompt: (value: string) => void;

    onGenerate: () => void;

    // mode et setMode ne sont plus nécessaires mais sont gardés dans l'interface pour la cohérence
    mode: "code" | "prompt";
    setMode: (value: "code" | "prompt") => void;

    viewOptions: ViewOptions;
    setViewOptions: (options: ViewOptions) => void;
}

export default function ViewsConfigOptions({
    appName,
    setAppName,
    prompt,
    setPrompt,
    onGenerate,
    viewOptions,
    setViewOptions,
}: ViewsConfigOptionsProps) {
    return (
        <div className="w-full bg-slate-950 rounded-lg border border-slate-800 p-4">

            {/* MODE SELECT RETIRÉ */}

            {/* OPTIONS DE CONFIGURATION */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* NOM APP */}
                <div className="flex flex-col">
                    <label className="text-xs text-slate-400 mb-1">
                        Nom de l'application (obligatoire)
                    </label>
                    <input
                        type="text"
                        value={appName}
                        onChange={(e) => setAppName(e.target.value)}
                        placeholder="ex: blog, shop, dashboard"
                        className="bg-slate-800 text-slate-100 border border-slate-700 rounded 
                                   px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 
                                   focus:ring-emerald-500"
                    />
                </div>

                {/* OPTIONS DE VUES */}
                <div className="md:col-span-2">
                    <ViewGenerationOptions
                        viewOptions={viewOptions}
                        setViewOptions={setViewOptions}
                    />
                </div>
            </div>

            {/* PROMPT (Affiché par défaut) */}
            <div className="flex flex-col mt-4">
                <label className="text-xs text-slate-400 mb-1">
                    Description du Modèle / Prompt (obligatoire)
                </label>

                <textarea
                    rows={3}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ex: Modèle Article avec titre (CharField), contenu (TextField) et date de création (DateTimeField). Modèle Commentaire avec texte (TextField) et relation vers Article (ForeignKey)."
                    className="w-full bg-slate-800 text-slate-100 border border-slate-700 
                       rounded px-3 py-2 text-sm resize-none leading-snug 
                       focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    style={{ whiteSpace: "pre-wrap" }}
                />
            </div>


            {/* BOUTON GENERER */}
            <div className="flex justify-end mt-4">
                <button
                    onClick={onGenerate}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 
                               rounded text-sm font-medium transition-all"
                >
                    Générer
                </button>
            </div>
        </div>
    );
}