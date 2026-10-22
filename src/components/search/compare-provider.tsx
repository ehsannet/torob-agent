"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const MAX_COMPARE = 4;

type CompareContextValue = {
  selected: string[];
  toggle: (productId: string) => void;
  clear: () => void;
  isSelected: (productId: string) => boolean;
  isFull: boolean;
};

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = useCallback((productId: string) => {
    setSelected((current) => {
      if (current.includes(productId)) {
        return current.filter((id) => id !== productId);
      }
      if (current.length >= MAX_COMPARE) return current;
      return [...current, productId];
    });
  }, []);

  const clear = useCallback(() => setSelected([]), []);
  const isSelected = useCallback(
    (productId: string) => selected.includes(productId),
    [selected],
  );

  const value = useMemo(
    () => ({
      selected,
      toggle,
      clear,
      isSelected,
      isFull: selected.length >= MAX_COMPARE,
    }),
    [selected, toggle, clear, isSelected],
  );

  return (
    <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
  );
}

export function useCompare(): CompareContextValue {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error("useCompare must be used inside CompareProvider");
  }
  return context;
}
