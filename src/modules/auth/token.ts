import * as SecureStore from "expo-secure-store";

/**
 * Clerk token cache backed by expo-secure-store.
 * Passed to ClerkProvider so session tokens persist across app restarts.
 */
export const tokenCache = {
  async getToken(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },
  async clearToken(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },
};

/**
 * Bridge between React (useAuth) and the Axios interceptor.
 *
 * Clerk's `getToken` is only available inside React via useAuth().
 * The Axios client lives outside React. This module bridges them:
 *
 *   1. A React component calls setTokenGetter(getToken) on mount.
 *   2. The Axios request interceptor calls getBearerToken() per request.
 */
type TokenGetter = () => Promise<string | null>;

let _tokenGetter: TokenGetter | null = null;

export function setTokenGetter(getter: TokenGetter | null): void {
  _tokenGetter = getter;
}

export async function getBearerToken(): Promise<string | null> {
  if (!_tokenGetter) return null;
  return _tokenGetter();
}
