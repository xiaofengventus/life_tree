<script setup>
import { computed, onMounted, ref } from "vue";
import navBar from "@/components/navBar.vue";
import evolution_mind_map from "@/components/evolution_mind_map.vue";
import {
  createInitialMindMapDocument,
  normalizeMindMapDocument,
} from "@/utils/evolutionMindMapModel";

const document = ref(createInitialMindMapDocument());
const loading = ref(true);
const errorMessage = ref("");
const treeOptions = ref([]);
const selectedTreeUrl = ref("");
const treeBaseUrl = `${import.meta.env.BASE_URL}trees/`;
const selectedTree = computed(() =>
  treeOptions.value.find((tree) => tree.url === selectedTreeUrl.value),
);

function normalizeCatalogEntry(entry, index) {
  const file = typeof entry === "string" ? entry : entry?.file;
  if (!file) return null;
  try {
    const base = new URL(treeBaseUrl, window.location.origin);
    const url = new URL(file, base);
    if (
      url.origin !== base.origin ||
      !url.pathname.startsWith(base.pathname) ||
      !url.pathname.toLowerCase().endsWith(".xur")
    )
      return null;
    return {
      id: typeof entry === "object" && entry.id ? entry.id : `tree-${index}`,
      name:
        (typeof entry === "object" && entry.name) ||
        decodeURIComponent(
          url.pathname
            .split("/")
            .pop()
            .replace(/\.xur$/i, ""),
        ),
      url: url.href,
    };
  } catch {
    return null;
  }
}

async function loadTreeCatalog() {
  try {
    const response = await fetch(`${treeBaseUrl}index.json`, {
      cache: "no-cache",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const entries = Array.isArray(payload) ? payload : payload.trees;
    treeOptions.value = (Array.isArray(entries) ? entries : [])
      .map(normalizeCatalogEntry)
      .filter(Boolean);
  } catch (error) {
    console.error("进化树目录加载失败，将使用默认树", error);
  }

  if (!treeOptions.value.length) {
    treeOptions.value = [
      normalizeCatalogEntry({ name: "LUCA 生命之树", file: "LUCA.xur" }, 0),
    ];
  }
  selectedTreeUrl.value = treeOptions.value[0].url;
  await loadSelectedTree();
}

async function loadSelectedTree() {
  if (!selectedTreeUrl.value) return;
  loading.value = true;
  errorMessage.value = "";
  try {
    const response = await fetch(selectedTreeUrl.value, {
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

onMounted(loadTreeCatalog);
</script>

<template>
  <navBar />
  <main class="communication-page">
    <header class="page-heading">
      <div>
        <span>OFFICIAL LIFE TREE</span>
        <h1>生命时序官方进化树</h1>
      </div>
      <div class="heading-actions">
        <p>拖动画布浏览，使用 Ctrl + 滚轮缩放，点击节点文字查看资料。</p>
        <label class="tree-picker">
          <span>选择进化树</span>
          <select
            v-model="selectedTreeUrl"
            :disabled="loading || treeOptions.length < 2"
            @change="loadSelectedTree"
          >
            <option
              v-for="tree in treeOptions"
              :key="tree.id"
              :value="tree.url"
            >
              {{ tree.name }}
            </option>
          </select>
        </label>
      </div>
    </header>

    <section class="communication-tree-card">
      <div v-if="loading" class="tree-status">
        <i></i>
        <span>正在加载官方进化树……</span>
      </div>
      <div v-else-if="errorMessage" class="tree-status error">
        {{ errorMessage }}
      </div>
      <evolution_mind_map
        v-else
        v-model="document"
        read-only
        :file-owner="selectedTree?.name || '生命时序官方树'"
      />
    </section>
  </main>
</template>

<style scoped>
.communication-page {
  min-height: 100vh;
  padding: 84px 22px 24px;
  background:
    radial-gradient(
      circle at 15% 10%,
      rgba(116, 162, 129, 0.16),
      transparent 30%
    ),
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

.heading-actions {
  display: flex;
  align-items: end;
  gap: 14px;
  margin-left: 24px;
}

.heading-actions p {
  margin: 0 0 8px;
  color: #6c7d72;
  font-size: 13px;
}

.tree-picker {
  display: grid;
  gap: 4px;
  color: #65806e;
  font-size: 11px;
}

.tree-picker select {
  min-width: 210px;
  min-height: 36px;
  padding: 6px 32px 6px 10px;
  border: 1px solid #c7d5cb;
  border-radius: 8px;
  background: #ffffff;
  color: #294236;
  font: inherit;
  font-size: 13px;
}

.tree-picker select:disabled {
  cursor: default;
  opacity: 0.72;
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

  .heading-actions p {
    display: none;
  }

  .heading-actions {
    margin-left: 12px;
  }

  .tree-picker span {
    display: none;
  }

  .tree-picker select {
    min-width: 150px;
    max-width: 48vw;
  }

  .communication-tree-card {
    height: calc(100vh - 130px);
    min-height: 520px;
    border-radius: 12px;
  }
}
</style>
