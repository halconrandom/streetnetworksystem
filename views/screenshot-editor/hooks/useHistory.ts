import { useState, useCallback } from 'react';

export type HistoryState<T> = {
    past: T[];
    present: T;
    future: T[];
};

export function useHistory<T>(initialPresent: T) {
    const [state, setState] = useState<HistoryState<T>>({
        past: [],
        present: initialPresent,
        future: [],
    });

    const canUndo = state.past.length > 0;
    const canRedo = state.future.length > 0;

    const undo = useCallback(() => {
        setState((prev) => {
            if (prev.past.length === 0) return prev;

            const previous = prev.past[prev.past.length - 1];
            const newPast = prev.past.slice(0, prev.past.length - 1);

            return {
                past: newPast,
                present: previous,
                future: [prev.present, ...prev.future],
            };
        });
    }, []);

    const redo = useCallback(() => {
        setState((prev) => {
            if (prev.future.length === 0) return prev;

            const next = prev.future[0];
            const newFuture = prev.future.slice(1);

            return {
                past: [...prev.past, prev.present],
                present: next,
                future: newFuture,
            };
        });
    }, []);

    const push = useCallback((newPresent: T) => {
        setState((prev) => {
            // Avoid pushing identical state if possible (optional but good)
            if (JSON.stringify(newPresent) === JSON.stringify(prev.present)) return prev;

            return {
                past: [...prev.past, prev.present].slice(-50), // Limit history size
                present: newPresent,
                future: [],
            };
        });
    }, []);

    const reset = useCallback((newPresent: T) => {
        setState({
            past: [],
            present: newPresent,
            future: [],
        });
    }, []);

    return {
        state: state.present,
        canUndo,
        canRedo,
        undo,
        redo,
        push,
        reset,
    };
}
