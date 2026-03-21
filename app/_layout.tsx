import { useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { ClerkProvider, ClerkLoaded, useAuth } from "@clerk/clerk-expo";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Slot, useRouter, useSegments } from "expo-router";

import { env } from "@/shared/config/env";
import { tokenCache, setTokenGetter } from "@/modules/auth/token";
import { fetchMe } from "@/modules/auth/api";
import { queryClient } from "@/api/query-client";
import { queryKeys } from "@/api/query-keys";
import { ToastProviderWithViewport } from "@/shared/ui/molecules/Toast";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";

function InitialLayout() {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const queryClient = useQueryClient();
  const previousUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    setTokenGetter(isSignedIn ? getToken : null);
  }, [getToken, isSignedIn]);

  useEffect(() => {
    if (!isLoaded) return;

    const previousUserId = previousUserIdRef.current;

    if (previousUserId !== undefined && previousUserId !== userId) {
      queryClient.clear();
    }

    previousUserIdRef.current = userId;
  }, [isLoaded, queryClient, userId]);

  useEffect(() => {
    if (!isLoaded || !userId) return;

    void queryClient.prefetchQuery({
      queryKey: queryKeys.me(userId),
      queryFn: fetchMe,
    });
  }, [isLoaded, queryClient, userId]);

  useEffect(() => {
    if (!isLoaded) return;

    const inProtectedGroup = segments[0] === "(tabs)";

    if (isSignedIn && !inProtectedGroup) {
      router.replace("/(tabs)");
    } else if (!isSignedIn) {
      router.replace("/sign-in");
    }
  }, [isSignedIn, isLoaded, router, segments]);

  return (
    <>
      <StatusBar style="light" />
      <Slot />
    </>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ClerkProvider
          publishableKey={env.CLERK_PUBLISHABLE_KEY}
          tokenCache={tokenCache}
        >
          <ClerkLoaded>
            <QueryClientProvider client={queryClient}>
              <ToastProviderWithViewport>
                <ErrorBoundary>
                  <InitialLayout />
                </ErrorBoundary>
              </ToastProviderWithViewport>
            </QueryClientProvider>
          </ClerkLoaded>
        </ClerkProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
