import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";

export function useAppNavigation() {
  const router = useRouter();
  const userStore = useUserStore();

  function goToHome() {
    router.push("/");
  }

  function goToCommunication() {
    if (userStore.isLoggedIn) {
      router.push("/communication");
    } else {
      router.push("/login");
    }
  }

  function goToResearch() {
    if (userStore.isLoggedIn) {
      router.push("/research");
    } else {
      router.push("/login");
    }
  }

  function goToWorkplace() {
    if (userStore.isLoggedIn) {
      router.push("/workplace");
    } else {
      router.push("/login");
    }
  }

  return {
    goToHome,
    goToCommunication,
    goToResearch,
    goToWorkplace,
  };
}
