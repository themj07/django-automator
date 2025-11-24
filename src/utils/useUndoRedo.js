// src/utils/useUndoRedo.js
import { useState, useCallback } from 'react';

/**
 * Hook générique pour gérer l'historique d'une valeur texte
 * sans imposer où est stockée la valeur.
 *
 * Tu lui passes simplement: useUndoRedo(inputCode, setInputCode)
 */
export default function useUndoRedo(currentValue, setValue) {
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const pushHistory = useCallback(() => {
    setUndoStack((prev) => [...prev, currentValue]);
    setRedoStack([]);
  }, [currentValue]);

  const undo = useCallback(() => {
    setUndoStack((prevUndo) => {
      if (prevUndo.length === 0) return prevUndo;
      const previous = prevUndo[prevUndo.length - 1];

      setRedoStack((prevRedo) => [...prevRedo, currentValue]);
      setValue(previous);

      return prevUndo.slice(0, -1);
    });
  }, [currentValue, setValue]);

  const redo = useCallback(() => {
    setRedoStack((prevRedo) => {
      if (prevRedo.length === 0) return prevRedo;
      const next = prevRedo[prevRedo.length - 1];

      setUndoStack((prevUndo) => [...prevUndo, currentValue]);
      setValue(next);

      return prevRedo.slice(0, -1);
    });
  }, [currentValue, setValue]);

  const resetHistory = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  return {
    undoStack,
    redoStack,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    pushHistory,
    undo,
    redo,
    resetHistory,
  };
}
