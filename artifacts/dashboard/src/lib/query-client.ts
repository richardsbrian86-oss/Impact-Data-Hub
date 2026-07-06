import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { ApiError } from "@workspace/api-client-react";

let unauthorizedHandler: (() => void) | null = null;
let isKnownAuthenticated = false;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

export function setKnownAuthenticated(v: boolean): void {
  isKnownAuthenticated = v;
}

function handleApiError(error: unknown): void {
  if (error instanceof ApiError && error.status === 401 && isKnownAuthenticated) {
    isKnownAuthenticated = false;
    unauthorizedHandler?.();
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
  queryCache: new QueryCache({ onError: handleApiError }),
  mutationCache: new MutationCache({ onError: handleApiError }),
});
