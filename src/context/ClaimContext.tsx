import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/integrations/api/client";
import { STORAGE_KEYS } from "@/constants/storage";

interface ClaimContextValue {
  claimComplete: boolean;
}

const ClaimContext = createContext<ClaimContextValue>({ claimComplete: false });

export function useClaimStatus() {
  return useContext(ClaimContext);
}

export function ClaimProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [claimComplete, setClaimComplete] = useState(false);
  const claimRef = useRef(false);

  useEffect(() => {
    if (!user) {
      setClaimComplete(true);
      return;
    }

    if (claimRef.current) return;
    claimRef.current = true;

    const funnelSessionId = localStorage.getItem(STORAGE_KEYS.FUNNEL_SESSION_ID);

    api
      .post("/claim/funnel-assets", { funnelSessionId })
      .catch((err) => console.warn("claim-funnel-assets failed:", err))
      .finally(() => setClaimComplete(true));
  }, [user]);

  return (
    <ClaimContext.Provider value={{ claimComplete }}>
      {children}
    </ClaimContext.Provider>
  );
}
