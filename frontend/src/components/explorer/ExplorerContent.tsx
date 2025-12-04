import React, { useRef } from "react";

interface ExplorerContentProps {
    inputCode: string;
    setInputCode: (value: string) => void;
}

export default function ExplorerContent({
    inputCode,
    setInputCode,
}: ExplorerContentProps) {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const handleManualInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputCode(e.target.value);
    };

    return (
        <div className="flex flex-col w-full">

        </div>
    );
}