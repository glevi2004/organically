"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface HeaderAction {
  id: string;
  content: ReactNode;
}

interface BreadcrumbContextType {
  // Custom title for breadcrumb
  customTitle: string | null;
  setCustomTitle: (title: string | null) => void;
  
  // Editable title support
  isEditableTitle: boolean;
  setIsEditableTitle: (editable: boolean) => void;
  onTitleChange: ((newTitle: string) => void) | null;
  setOnTitleChange: (callback: ((newTitle: string) => void) | null) => void;
  
  // Header actions (right side of header)
  headerActions: HeaderAction[];
  setHeaderActions: (actions: HeaderAction[]) => void;
  addHeaderAction: (action: HeaderAction) => void;
  removeHeaderAction: (id: string) => void;
  clearHeaderActions: () => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | null>(null);

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error("useBreadcrumb must be used within a BreadcrumbProvider");
  }
  return context;
}

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [customTitle, setCustomTitle] = useState<string | null>(null);
  const [isEditableTitle, setIsEditableTitle] = useState(false);
  const [onTitleChange, setOnTitleChange] = useState<((newTitle: string) => void) | null>(null);
  const [headerActions, setHeaderActions] = useState<HeaderAction[]>([]);

  const addHeaderAction = (action: HeaderAction) => {
    setHeaderActions((prev) => {
      // Replace if exists, otherwise add
      const exists = prev.find((a) => a.id === action.id);
      if (exists) {
        return prev.map((a) => (a.id === action.id ? action : a));
      }
      return [...prev, action];
    });
  };

  const removeHeaderAction = (id: string) => {
    setHeaderActions((prev) => prev.filter((a) => a.id !== id));
  };

  const clearHeaderActions = () => {
    setHeaderActions([]);
  };

  return (
    <BreadcrumbContext.Provider
      value={{
        customTitle,
        setCustomTitle,
        isEditableTitle,
        setIsEditableTitle,
        onTitleChange,
        setOnTitleChange: (cb) => setOnTitleChange(() => cb),
        headerActions,
        setHeaderActions,
        addHeaderAction,
        removeHeaderAction,
        clearHeaderActions,
      }}
    >
      {children}
    </BreadcrumbContext.Provider>
  );
}
