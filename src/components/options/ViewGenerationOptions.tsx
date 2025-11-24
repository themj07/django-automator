import React from "react";

interface ViewOptions {
    list: boolean;
    detail: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
}

interface ViewGenerationOptionsProps {
    viewOptions: ViewOptions;
    setViewOptions: (options: ViewOptions) => void;
}

export default function ViewGenerationOptions({
    viewOptions,
    setViewOptions,
}: ViewGenerationOptionsProps) {
    const toggleOption = (key: keyof ViewOptions) => {
        setViewOptions({ ...viewOptions, [key]: !viewOptions[key] });
    };

    return (
        <div className="flex flex-col">
            <label className="text-xs text-slate-400 mb-1">
                Vues à générer :
            </label>
            <div className="flex flex-wrap gap-4 p-2 bg-slate-800 rounded border border-slate-700">
                <label className="flex items-center gap-2 text-xs text-slate-300">
                    <input
                        type="checkbox"
                        checked={viewOptions.list}
                        onChange={() => toggleOption("list")}
                        className="text-emerald-500"
                    />
                    Liste (ListView)
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300">
                    <input
                        type="checkbox"
                        checked={viewOptions.detail}
                        onChange={() => toggleOption("detail")}
                        className="text-emerald-500"
                    />
                    Détail (DetailView)
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300">
                    <input
                        type="checkbox"
                        checked={viewOptions.create}
                        onChange={() => toggleOption("create")}
                        className="text-emerald-500"
                    />
                    Créer (CreateView)
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300">
                    <input
                        type="checkbox"
                        checked={viewOptions.update}
                        onChange={() => toggleOption("update")}
                        className="text-emerald-500"
                    />
                    Mettre à jour (UpdateView)
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300">
                    <input
                        type="checkbox"
                        checked={viewOptions.delete}
                        onChange={() => toggleOption("delete")}
                        className="text-emerald-500"
                    />
                    Supprimer (DeleteView)
                </label>
            </div>
        </div>
    );
}