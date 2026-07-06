import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetCurrentUser,
  getGetCurrentUserQueryKey,
  type AuthUser,
} from "@workspace/api-client-react";
import { setUnauthorizedHandler, setKnownAuthenticated } from "@/lib/query-client";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data, isLoading, isSuccess } = useGetCurrentUser({
    query: {
      queryKey: getGetCurrentUserQueryKey(),
      retry: false,
      staleTime: 5 * 60 * 1000,
    },
  });

  useEffect(() => {
    setKnownAuthenticated(isSuccess && !!data);
  }, [isSuccess, data]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      queryClient.clear();
    });
    return () => setUnauthorizedHandler(null);
  }, [queryClient]);

  const refresh = async () => {
    await queryClient.invalidateQueries({
      queryKey: getGetCurrentUserQueryKey(),
    });
  };

  const value: AuthContextValue = {
    user: data ?? null,
    isLoading,
    isAuthenticated: isSuccess && !!data,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
