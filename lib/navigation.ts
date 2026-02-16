import type { NextRouter } from "next/router";

function hasInternalHistory(): boolean {
  if (typeof window === "undefined") return false;

  const state = window.history.state as { idx?: number } | null;
  return typeof state?.idx === "number" && state.idx > 0;
}

export function goBackOrPush(router: NextRouter, fallback = "/") {
  if (typeof window === "undefined") {
    router.push(fallback);
    return;
  }

  const currentPath = window.location.pathname + window.location.search + window.location.hash;

  if (hasInternalHistory()) {
    router.back();

    // Some environments report history but cannot navigate back correctly.
    // If path does not change shortly after back(), fallback to a safe route.
    window.setTimeout(() => {
      const nextPath =
        window.location.pathname + window.location.search + window.location.hash;
      if (nextPath === currentPath) {
        router.push(fallback);
      }
    }, 160);

    return;
  }

  router.push(fallback);
}
