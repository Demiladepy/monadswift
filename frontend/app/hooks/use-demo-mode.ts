import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "monadswift-demo-mode";

function readStored(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

/**
 * Hackathon “demo mode”: skip real MoonPay tab and show a simulated success path.
 * Persisted in localStorage so presenters don’t toggle it mid-demo by accident.
 */
export function useDemoMode() {
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    setDemoMode(readStored());
  }, []);

  const setDemoModePersist = useCallback((next: boolean) => {
    setDemoMode(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    }
  }, []);

  return { demoMode, setDemoMode: setDemoModePersist };
}
