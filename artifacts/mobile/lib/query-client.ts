import {
  QueryClient,
  QueryCache,
  MutationCache,
} from "@tanstack/react-query";
import { ApiError } from "@workspace/api-client-react";
import { getCurrentToken } from "@/lib/token";

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

function handleApiError(error: unknown): void {
  // Only force a sign-out when we believed we had a valid session — this avoids
  // treating a failed login attempt (401) as an expired-session redirect.
  if (error instanceof ApiError && error.status === 401 && getCurrentToken()) {
    unauthorizedHandler?.();
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleApiError }),
  mutationCache: new MutationCache({ onError: handleApiError }),
});
