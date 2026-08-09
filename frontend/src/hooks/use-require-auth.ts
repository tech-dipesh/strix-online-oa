"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { getAccessToken } from "@/lib/api";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot() {
  return getAccessToken();
}

function getServerSnapshot() {
  return null;
}

export function useRequireAuth() {
  const router = useRouter();
  const token = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (token === null) {
      router.replace("/login");
    }
  }, [token, router]);

  return token !== null;
}
