import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { setAuthTokenGetter } from "@workspace/api-client-react";

const TOKEN_KEY = "impactiq_token";

let currentToken: string | null = null;

// Supply the bearer token to every API request made through the shared client.
setAuthTokenGetter(() => currentToken);

// SecureStore is not available on web; fall back to localStorage there.
const isWeb = Platform.OS === "web";

async function readStored(): Promise<string | null> {
  if (isWeb) {
    try {
      return typeof localStorage !== "undefined"
        ? localStorage.getItem(TOKEN_KEY)
        : null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

async function writeStored(token: string): Promise<void> {
  if (isWeb) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // ignore storage failures on web
    }
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

async function removeStored(): Promise<void> {
  if (isWeb) {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore storage failures on web
    }
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export function getCurrentToken(): string | null {
  return currentToken;
}

export async function loadToken(): Promise<string | null> {
  currentToken = await readStored();
  return currentToken;
}

export async function saveToken(token: string): Promise<void> {
  currentToken = token;
  await writeStored(token);
}

export async function clearToken(): Promise<void> {
  currentToken = null;
  await removeStored();
}
