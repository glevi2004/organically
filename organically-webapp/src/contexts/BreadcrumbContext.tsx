"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface BreadcrumbContextType {
  customTitle: string | null;
  setCustomTitle: (title: string | null) => void;
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

  return (
    <BreadcrumbContext.Provider value={{ customTitle, setCustomTitle }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

