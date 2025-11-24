import React, { useRef } from "react";
import { Upload, ClipboardPaste, FileCode } from "lucide-react";

interface ExplorerActionsProps {
    setInputCode: (value: string) => void;
    setMode: (mode: "code" | "prompt") => void;
}

export default function ExplorerActions({
    setInputCode,
    setMode,
}: ExplorerActionsProps) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
            const text = e.target?.result as string;
            if (text) {
                setInputCode(text);
                setMode("code");
            }
        };
        reader.readAsText(file);
    };

    const handlePasteFromClipboard = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                setInputCode(text);
                setMode("code");
            }
        } catch (error) {
            console.error("Erreur clipboard:", error);
            // Fallback: demander à l'utilisateur de coller manuellement
            const manualInput = prompt("Collez votre code models.py ici:");
            if (manualInput) {
                setInputCode(manualInput);
                setMode("code");
            }
        }
    };

    const openFilePicker = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <div className="flex items-center gap-3 overflow-x-auto py-1">
            <button
                onClick={openFilePicker}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 
                           rounded text-xs text-slate-200 whitespace-nowrap"
            >
                <Upload size={14} />
                Importer un fichier
            </button>

            <input
                type="file"
                ref={fileInputRef}
                accept=".py,.txt"
                onChange={handleFileUpload}
                className="hidden"
            />

            <button
                onClick={() => setMode("prompt")}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 
                           rounded text-xs whitespace-nowrap"
            >
                <FileCode size={14} />
                Utiliser un prompt
            </button>
        </div>
    );
}