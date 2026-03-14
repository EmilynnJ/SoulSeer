import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { apiRequest } from "./queryClient";
import type { User } from "@shared/schema";

const AUTH0_DOMAIN = import.meta.env.VITE_AUTH0_DOMAIN || "dev-2x1dti3irhuz62jc.us.auth0.com";
const AUTH0_CLIENT_ID = import.meta.env.VITE_AUTH0_CLIENT_ID || "v94S3wtQm2JDqeJEBF6It0G4pJLEOwkD";
const AUTH0_AUDIENCE = `https://${AUTH0_DOMAIN}/api/v2/`;

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  login: () => void;
  logout: () => void;
  updateBalance: (newBalance: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  accessToken: null,
  login: () => {},
  logout: () => {},
  updateBalance: () => {},
});

function generateRandomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => chars[b % chars.length]).join("");
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  return crypto.subtle.digest("SHA-256", encoder.encode(plain));
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

let _pkceVerifier: string | null = null;
let _pkceState: string | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const syncUserWithBackend = useCallback(async (token: string) => {
    if (syncing) return;
    setSyncing(true);
    try {
      const userInfoRes = await fetch(`https://${AUTH0_DOMAIN}/userinfo`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!userInfoRes.ok) {
        setSyncing(false);
        return;
      }
      const auth0User = await userInfoRes.json();

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: auth0User.email,
          displayName: auth0User.name || auth0User.nickname || auth0User.email,
          auth0Id: auth0User.sub,
        }),
      });
      if (res.ok) {
        const dbUser = await res.json();
        setUser(dbUser);
      }
    } catch (err) {
      console.error("Failed to sync user with backend:", err);
    } finally {
      setSyncing(false);
    }
  }, [syncing]);

  useEffect(() => {
    const hash = window.location.hash;
    const searchStr = window.location.search;

    let params: URLSearchParams | null = null;
    if (searchStr && searchStr.includes("code=")) {
      params = new URLSearchParams(searchStr);
    } else if (hash.includes("code=")) {
      const qIndex = hash.indexOf("?");
      if (qIndex !== -1) {
        params = new URLSearchParams(hash.substring(qIndex));
      }
    }

    if (params && params.get("code") && _pkceVerifier) {
      const code = params.get("code")!;
      const verifier = _pkceVerifier;
      _pkceVerifier = null;
      _pkceState = null;

      window.history.replaceState({}, document.title, window.location.pathname + "#/");

      (async () => {
        try {
          const tokenRes = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              grant_type: "authorization_code",
              client_id: AUTH0_CLIENT_ID,
              code_verifier: verifier,
              code,
              redirect_uri: window.location.origin,
              audience: AUTH0_AUDIENCE,
            }),
          });
          if (tokenRes.ok) {
            const tokenData = await tokenRes.json();
            setAccessToken(tokenData.access_token);
            await syncUserWithBackend(tokenData.access_token);
          }
        } catch (err) {
          console.error("Token exchange failed:", err);
        } finally {
          setIsLoading(false);
        }
      })();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async () => {
    const verifier = generateRandomString(64);
    const state = generateRandomString(32);
    _pkceVerifier = verifier;
    _pkceState = state;

    const challengeBuffer = await sha256(verifier);
    const challenge = base64UrlEncode(challengeBuffer);

    const authUrl = new URL(`https://${AUTH0_DOMAIN}/authorize`);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", AUTH0_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", window.location.origin);
    authUrl.searchParams.set("scope", "openid profile email");
    authUrl.searchParams.set("audience", AUTH0_AUDIENCE);
    authUrl.searchParams.set("code_challenge", challenge);
    authUrl.searchParams.set("code_challenge_method", "S256");
    authUrl.searchParams.set("state", state);

    window.location.href = authUrl.toString();
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    const logoutUrl = new URL(`https://${AUTH0_DOMAIN}/v2/logout`);
    logoutUrl.searchParams.set("client_id", AUTH0_CLIENT_ID);
    logoutUrl.searchParams.set("returnTo", window.location.origin);
    window.location.href = logoutUrl.toString();
  }, []);

  const updateBalance = useCallback((newBalance: string) => {
    setUser((prev) => (prev ? { ...prev, balance: newBalance } : null));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!accessToken && !!user,
        isLoading: isLoading || syncing,
        accessToken,
        login,
        logout,
        updateBalance,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
