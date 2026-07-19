<template>
  <nav>
    生命时序 life_tree
    <div id="function">
      <!-- 当不在首页时，显示回到首页按钮 -->
      <div class="form-row">
        <button class="btn-secondary" v-show="!isHome" @click="goToHome">
          回到首页
        </button>
      </div>
      <div class="form-row">
        <button class="btn-secondary" @click="goToCommunication">
          社区Communication
        </button>
      </div>
      <div class="form-row">
        <button class="btn-secondary" @click="goToResearch">
          研究Research
        </button>
      </div>
      <div class="form-row">
        <button class="btn-secondary" @click="goToWorkplace">
          绘制UserTree
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
// import { navigateWithAuth, goHome } from "@/utils/navigation";

const router = useRouter();

const isHome = computed(() => {
  return router.currentRoute.value.path === "/";
});

function goToHome() {
  router.push("/");
}

function goToCommunication() {
  // 不再需要登录验证，直接跳转
  router.push("/communication");
}

function goToResearch() {
  // 不再需要登录验证，直接跳转
  router.push("/research");
}

function goToWorkplace() {
  // 不再需要登录验证，直接跳转
  router.push("/workplace");
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  z-index: 100;
  font-size: 1.5rem;
  font-weight: bold;
}

#function {
  display: flex;
  gap: 10px;
}

#function .btn-secondary {
  width: auto;
  padding: 6px 12px;
}
</style>
