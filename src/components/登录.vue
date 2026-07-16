<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "../stores/user";

import footer_page from "@/components/footer_page.vue";

const router = useRouter();
const userStore = useUserStore();

const isLoginMode = ref(true);
const username = ref("");
const password = ref("");
const confirmPassword = ref("");
const name = ref("");
const introduce = ref("");
const errorMessage = ref("");

const passwordMatch = computed(() => password.value === confirmPassword.value);

async function handleSubmit() {
  errorMessage.value = "";

  if (isLoginMode.value) {
    if (!username.value || !password.value) {
      errorMessage.value = "请输入用户名和密码";
      return;
    }

    const success = await userStore.login(username.value, password.value);
    if (success) {
      router.push("/");
    } else {
      errorMessage.value = "用户名或密码错误";
    }
  } else {
    if (
      !username.value ||
      !password.value ||
      !confirmPassword.value ||
      !name.value
    ) {
      errorMessage.value = "请填写所有必填项";
      return;
    }

    if (!passwordMatch.value) {
      errorMessage.value = "两次输入的密码不一致";
      return;
    }

    const success = await userStore.register({
      username: username.value,
      password: password.value,
      name: name.value,
      introduce: introduce.value,
    });

    if (success) {
      isLoginMode.value = true;
      errorMessage.value = "注册成功，请登录";
      username.value = "";
      password.value = "";
      confirmPassword.value = "";
      name.value = "";
      introduce.value = "";
    } else {
      errorMessage.value = "注册失败，请重试";
    }
  }
}

function toggleMode() {
  isLoginMode.value = !isLoginMode.value;
  errorMessage.value = "";
  username.value = "";
  password.value = "";
  confirmPassword.value = "";
  name.value = "";
  introduce.value = "";
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h2>生命时序</h2>
        <p>{{ isLoginMode ? "欢迎回来" : "创建新账户" }}</p>
      </div>

      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>用户名</label>
          <input
            type="text"
            v-model="username"
            placeholder="请输入用户名"
            required
          />
        </div>

        <div class="form-group">
          <label>密码</label>
          <input
            type="password"
            v-model="password"
            placeholder="请输入密码"
            required
          />
        </div>

        <div v-if="!isLoginMode" class="form-group">
          <label>确认密码</label>
          <input
            type="password"
            v-model="confirmPassword"
            placeholder="请再次输入密码"
            :class="{ error: confirmPassword && !passwordMatch }"
            required
          />
        </div>

        <div v-if="!isLoginMode" class="form-group">
          <label>昵称</label>
          <input type="text" v-model="name" placeholder="请输入昵称" required />
        </div>

        <div v-if="!isLoginMode" class="form-group">
          <label>个人简介</label>
          <textarea
            v-model="introduce"
            placeholder="请输入个人简介（可选）"
            rows="3"
          ></textarea>
        </div>

        <button type="submit" class="submit-btn">
          {{ isLoginMode ? "登录" : "注册" }}
        </button>
      </form>

      <div class="toggle-link">
        {{ isLoginMode ? "还没有账户？" : "已有账户？" }}
        <button @click="toggleMode">
          {{ isLoginMode ? "立即注册" : "立即登录" }}
        </button>
      </div>
    </div>
  </div>
  <footer_page />
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: white;
  padding: 120px;
}

.login-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 40px;
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  font-size: 2rem;
  color: #333;
  margin-bottom: 8px;
}

.login-header p {
  color: #666;
  font-size: 1rem;
}

.error-message {
  background: #fee2e2;
  color: #dc2626;
  padding: 10px 15px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 0.9rem;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  color: #333;
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

.form-group input.error {
  border-color: #dc2626;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 10px;
}

.submit-btn:hover {
  opacity: 0.9;
}

.toggle-link {
  text-align: center;
  margin-top: 20px;
  color: #666;
}

.toggle-link button {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  font-weight: 600;
}

.toggle-link button:hover {
  text-decoration: underline;
}
</style>
