import { useUserStore } from "@/stores/user";

export function navigateWithAuth(targetPath, router, fallbackPath = "/login") {
  const userStore = useUserStore();

  if (userStore.isLoggedIn) {
    router.push(targetPath);
  } else {
    router.push(fallbackPath);
  }
}

export function goHome(router) {
  router.push("/");
}

export function requireAuth(to, from, next) {
  const userStore = useUserStore();
  const requiresAuth = to.meta?.requiresAuth === true;

  if (requiresAuth && !userStore.isLoggedIn) {
    next({ name: "login", query: { redirect: to.fullPath } });
  } else {
    next();
  }
}
