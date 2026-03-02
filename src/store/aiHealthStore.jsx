import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getAiHealth } from "../api/aiClient";

const AiHealthContext = createContext(null);

export function AiHealthProvider({ children }) {
  const [state, setState] = useState({
    loading: true,
    status: "DOWN",
    features: { enhance: false, bgWhitePro: false },
    version: "unknown",
    lastChecked: null,
    error: ""
  });

  const checkHealth = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    const result = await getAiHealth({ timeoutMs: 8000, retry: 1 });
    setState({
      loading: false,
      status: result.status,
      features: result.features,
      version: result.version || "unknown",
      lastChecked: Date.now(),
      error: result.error || ""
    });
    return result;
  }, []);

  useEffect(() => {
    checkHealth();
    const id = setInterval(() => {
      checkHealth();
    }, 30000);
    return () => clearInterval(id);
  }, [checkHealth]);

  const value = useMemo(() => ({
    ...state,
    checkHealth,
    isUp: state.status === "UP"
  }), [state, checkHealth]);

  return <AiHealthContext.Provider value={value}>{children}</AiHealthContext.Provider>;
}

export function useAiHealth() {
  const ctx = useContext(AiHealthContext);
  if (!ctx) {
    throw new Error("useAiHealth must be used inside AiHealthProvider.");
  }
  return ctx;
}
