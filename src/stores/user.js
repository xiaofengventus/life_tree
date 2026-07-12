import { defineStore } from "pinia";
import { ref, computed } from "vue";
import axios from "axios";

export const useUserStore = defineStore("user", () => {
  const user = ref(null);
  const token = ref(localStorage.getItem("token") || null);

  const userTypes = {
    UNREGISTERED: "未注册",
    USER: "普通用户",
    ADMIN: "管理员",
    COOPERATOR: "合作社团",
  };

  const permissions = {
    UNREGISTERED: ["read"],
    USER: ["read", "create_article", "edit_own_article", "delete_own_article"],
    ADMIN: ["read", "create_article", "edit_article", "delete_article", "manage_users"],
    COOPERATOR: ["read", "create_article", "edit_article", "delete_article", "manage_group"],
  };

  const isLoggedIn = computed(() => !!token.value && user.value !== null);

  const currentType = computed(() => {
    if (!user.value) return userTypes.UNREGISTERED;
    return user.value.type || userTypes.UNREGISTERED;
  });

  const currentPermissions = computed(() => {
    const type = currentType.value;
    for (const [key, value] of Object.entries(userTypes)) {
      if (value === type) {
        return permissions[key] || permissions.UNREGISTERED;
      }
    }
    return permissions.UNREGISTERED;
  });

  function hasPermission(perm) {
    return currentPermissions.value.includes(perm);
  }

  async function login(username, password) {
    try {
      const response = await axios.post("/api/login", { username, password });
      if (response.data.success) {
        token.value = response.data.token;
        user.value = response.data.user;
        localStorage.setItem("token", token.value);
        localStorage.setItem("user", JSON.stringify(user.value));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  }

  async function register(userData) {
    try {
      const response = await axios.post("/api/register", {
        ...userData,
        uid: generateUid(),
        type: userTypes.UNREGISTERED,
        signup_data: new Date().toISOString(),
        level: 0,
      });
      if (response.data.success) {
        return true;
      }
      return false;
    } catch (error) {
      console.error("Registration failed:", error);
      return false;
    }
  }

  async function logout() {
    try {
      await axios.post("/api/logout");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      user.value = null;
      token.value = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }

  async function updateProfile(profileData) {
    if (!user.value) return false;
    try {
      const response = await axios.put("/api/user/profile", profileData);
      if (response.data.success) {
        user.value = { ...user.value, ...response.data.user };
        localStorage.setItem("user", JSON.stringify(user.value));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Update profile failed:", error);
      return false;
    }
  }

  function loadUserFromStorage() {
    const storedUser = localStorage.getItem("user");
    if (storedUser && token.value) {
      try {
        user.value = JSON.parse(storedUser);
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("user");
      }
    }
  }

  function generateUid() {
    return "UID" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  function initGuestUser() {
    if (!user.value && !token.value) {
      user.value = {
        name: "未注册用户",
        uid: "GUEST" + Math.random().toString(36).substring(2, 8).toUpperCase(),
        level: 0,
        introduce: "",
        type: userTypes.UNREGISTERED,
        signup_data: new Date().toISOString(),
      };
    }
  }

  return {
    user,
    token,
    userTypes,
    permissions,
    isLoggedIn,
    currentType,
    currentPermissions,
    hasPermission,
    login,
    register,
    logout,
    updateProfile,
    loadUserFromStorage,
    initGuestUser,
  };
});
