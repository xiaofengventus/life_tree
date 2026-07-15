<template>
  <div class="user-float">
    <!-- 用户头像，点击显示/隐藏用户卡片 -->
    <img
      :src="imgUrl"
      alt="用户头像"
      class="user-avatar"
      @click="handleAvatarClick"
    />
    <!-- 用户卡片 -->
    <div
      class="user-card"
      :style="{ display: showUserCard ? 'block' : 'none' }"
    >
      <div class="card-header">
        <!-- 用户名，未登录显示"未注册用户" -->
        <strong>{{ userStore.user?.name || "未注册用户" }}</strong>
        <!-- 用户等级徽章 -->
        <span class="badge">Lv.{{ userStore.user?.level || 0 }}</span>
      </div>
      <!-- 用户UID -->
      <p><strong>UID:</strong> {{ userStore.user?.uid || "-" }}</p>
      <!-- 用户类型 -->
      <p><strong>类型:</strong> {{ userStore.currentType }}</p>
      <!-- 用户简介（有值时显示） -->
      <p v-if="userStore.user?.introduce">
        <strong>简介:</strong> {{ userStore.user.introduce }}
      </p>
      <!-- 注册时间 -->
      <p>
        <strong>注册时间:</strong>
        {{ formatDate(userStore.user?.signup_data) }}
      </p>
      <!-- 操作按钮 -->
      <div class="card-actions">
        <button class="btn-home" @click="goToUserSpace">进入主页</button>
        <button class="btn-signup" @click="goToLogin">登录</button>
      </div>
    </div>
  </div>
</template>

<script setup>
// 导入Vue响应式工具
import { ref } from "vue";
// 导入Vue路由
import { useRouter } from "vue-router";
// 导入用户状态管理store
import { useUserStore } from "@/stores/user";
// 导入日期格式化工具函数
import { formatDate } from "@/utils/date";

// 创建路由实例
const router = useRouter();
// 创建用户状态store实例
const userStore = useUserStore();

// 用户卡片显示状态（响应式变量）
const showUserCard = ref(false);
// 用户头像图片路径
import avatarImg from "@/assets/pic/200-year-old-fox.png";
const imgUrl = ref(avatarImg);

/**
 * 处理头像点击事件
 * 切换用户卡片的显示/隐藏状态
 */
function handleAvatarClick() {
  showUserCard.value = !showUserCard.value;
}

/**
 * 跳转到用户空间页面
 */
function goToUserSpace() {
  router.push("/user_space");
  // 跳转后隐藏用户卡片
  showUserCard.value = false;
}

/**
 * 跳转到登录页面
 */
function goToLogin() {
  router.push("/login");
  // 跳转后隐藏用户卡片
  showUserCard.value = false;
}
</script>

<style scoped>
/* 用户浮动容器 */
.user-float {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 500;
}

/* 用户头像样式 */
.user-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  transition: transform 0.2s;
  display: block;
}

/* 头像悬停效果 */
.user-avatar:hover {
  transform: scale(1.05);
}

/* 用户卡片样式 */
.user-card {
  position: absolute;
  right: 0;
  bottom: 80px;
  width: 220px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  padding: 16px;
  font-family: system-ui, sans-serif;
  line-height: 1.5;
  animation: fadeIn 0.2s ease;
}

/* 卡片淡入动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 等级徽章样式 */
.badge {
  background: #4f46e5;
  color: #fff;
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: 8px;
}

/* 主页按钮样式 */
.btn-home {
  display: inline-block;
  margin-top: 10px;
  background: #4f46e5;
  color: white;
  padding: 6px 14px;
  border-radius: 6px;
  text-decoration: none;
  font-size: 0.9rem;
  border: none;
  cursor: pointer;
}

/* 登录按钮样式 */
.btn-signup {
  display: inline-block;
  margin-top: 10px;
  margin-left: 8px;
  background: #e2e8f0;
  color: #475569;
  padding: 6px 14px;
  border-radius: 6px;
  text-decoration: none;
  font-size: 0.9rem;
  border: none;
  cursor: pointer;
}

/* 卡片操作按钮容器 */
.card-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
</style>
