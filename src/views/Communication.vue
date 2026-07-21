<script setup>
import { onMounted, ref } from "vue";
import navBar from "@/components/navBar.vue";
import evolution_mind_map from "@/components/evolution_mind_map.vue";
import {
  createInitialMindMapDocument,
  normalizeMindMapDocument,
} from "@/utils/evolutionMindMapModel";

const document = ref(createInitialMindMapDocument());
const loading = ref(true);
const errorMessage = ref("");

async function loadOfficialTree() {
  try {
    const response = await fetch("/trees/communication-tree.json", {
      cache: "no-cache",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    document.value = normalizeMindMapDocument(await response.json());
  } catch (error) {
    console.error(error);
    errorMessage.value = "官方进化树暂时无法加载";
  } finally {
    loading.value = false;
  }
}

onMounted(loadOfficialTree);
</script>

<template>
  <navBar />
  <main class="communication-page">
    <header class="page-heading">
      <div>
        <span>OFFICIAL LIFE TREE</span>
        <h1>生命时序官方进化树</h1>
      </div>
      <p>拖动画布浏览，使用 Ctrl + 滚轮缩放，点击节点链接查看资料。</p>
    </header>

    <section class="communication-tree-card">
      <div v-if="loading" class="tree-status">
        <i></i>
        <span>正在加载官方进化树……</span>
      </div>
      <div v-else-if="errorMessage" class="tree-status error">
        {{ errorMessage }}
      </div>
      <evolution_mind_map v-else v-model="document" read-only file-owner="生命时序官方树" />
    </section>
  </main>
</template>

<style scoped>
.communication-page {
  min-height: 100vh;
  padding: 84px 22px 24px;
  background:
    radial-gradient(circle at 15% 10%, rgba(116, 162, 129, 0.16), transparent 30%),
    #f3f7f3;
}

.page-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  width: min(100%, 1560px);
  margin: 0 auto 14px;
  color: #294236;
}

.page-heading span {
  color: #65806e;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

.page-heading h1 {
  margin: 3px 0 0;
  color: #153727;
  font-size: clamp(22px, 3vw, 34px);
}

.page-heading p {
  margin: 0 0 4px 24px;
  color: #6c7d72;
  font-size: 13px;
}

.communication-tree-card {
  width: min(100%, 1560px);
  height: calc(100vh - 168px);
  min-height: 600px;
  margin: 0 auto;
  overflow: hidden;
  border: 1px solid rgba(42, 91, 60, 0.16);
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 24px 70px rgba(24, 53, 35, 0.11);
}

.tree-status {
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #5d6d60;
}

.tree-status i {
  width: 22px;
  height: 22px;
  border: 2px solid #c9d7ce;
  border-top-color: #286b49;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.tree-status.error {
  color: #b04840;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 720px) {
  .communication-page {
    padding: 74px 8px 8px;
  }

  .page-heading {
    padding: 0 8px;
  }

  .page-heading p {
    display: none;
  }

  .communication-tree-card {
    height: calc(100vh - 130px);
    min-height: 520px;
    border-radius: 12px;
  }
}
</style>
