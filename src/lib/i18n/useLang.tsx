"use client";

import React, { createContext, useContext, useState, useSyncExternalStore, ReactNode } from "react";
import en from "./en.json";
import kn from "./kn.json";

export type Lang = "en" | "kn";

interface LangContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (keyPath: string, fallback?: string) => string;
}

const LangContext = createContext<LangContextType | undefined>(undefined);

const dictionaries = {
  en,
  kn,
};

const STORAGE_KEY = "dari_lang_preference";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot(): Lang {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (val === "en" || val === "kn") return val;
  } catch {
    // fallback
  }
  return "en";
}

function getServerSnapshot(): Lang {
  return "en";
}

export function LangProvider({ children }: { children: ReactNode }) {
  const storedLang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [localLang, setLocalLang] = useState<Lang | null>(null);

  const lang: Lang = localLang ?? storedLang;

  // Dynamically synchronize the root HTML lang attribute for accessibility and screen readers
  React.useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const setLang = (newLang: Lang) => {
    setLocalLang(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
      window.dispatchEvent(new Event("storage"));
    } catch {
      // Ignore localStorage access failures
    }
  };

  const toggleLang = () => {
    setLang(lang === "en" ? "kn" : "en");
  };

  const t = (keyPath: string, fallback?: string): string => {
    const keys = keyPath.split(".");
    const dict = dictionaries[lang] as Record<string, unknown>;

    let current: unknown = dict;
    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = (current as Record<string, unknown>)[key];
      } else {
        // Fallback to English if translation is missing in Kannada
        let enCurrent: unknown = dictionaries.en;
        for (const enKey of keys) {
          if (enCurrent && typeof enCurrent === "object" && enKey in enCurrent) {
            enCurrent = (enCurrent as Record<string, unknown>)[enKey];
          } else {
            return fallback || keyPath;
          }
        }
        return typeof enCurrent === "string" ? enCurrent : (fallback || keyPath);
      }
    }

    return typeof current === "string" ? current : (fallback || keyPath);
  };

  return (
    <LangContext.Provider value={{ lang, setLang, toggleLang, t }}>
      <div className={lang === "kn" ? "font-kannada" : ""}>
        {children}
      </div>
    </LangContext.Provider>
  );
}

export function useLang(): LangContextType {
  const context = useContext(LangContext);
  if (!context) {
    throw new Error("useLang must be used within a LangProvider");
  }
  return context;
}
