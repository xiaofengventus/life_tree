<script setup>
import { onMounted, ref } from "vue";
import navBar from "@/components/navBar.vue";
import evolution_tree_canva from "@/components/evolution_tree_canva.vue";
import {
  createInitialTree,
  createNode,
  walkTree,
} from "@/utils/evolutionTreeModel";

const tree = ref(createInitialTree());
const loading = ref(true);
const errorMessage = ref("");

async function loadOfficialTree() {
  try {
    const response = await fetch("/trees/communication-tree.json", {
      cache: "no-cache",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const officialTree = createNode(data.root || data);
    walkTree(officialTree, (node) => {
      node.colors.branch = "#202122";
      node.colors.text = "#202122";
    });
    tree.value = officialTree;
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
    <section class="communication-tree-card">
      <p v-if="loading" class="tree-status">正在加载官方进化树……</p>
      <p v-else-if="errorMessage" class="tree-status error">{{ errorMessage }}</p>
      <evolution_tree_canva
        v-else
        :model="tree"
        :zoom="1"
        read-only
      />
    </section>
  </main>
</template>

<style scoped>
.communication-page {
  min-height: 100vh;
  padding: 72px 18px 24px;
  background: #f7f4ea;
}

.communication-tree-card {
  width: min(100%, 1440px);
  height: calc(100vh - 96px);
  min-height: 560px;
  margin: 0 auto;
  overflow: hidden;
  border: 1px solid rgba(47, 111, 78, 0.16);
  border-radius: 22px;
  background: #fffef8;
  box-shadow: 0 24px 64px rgba(24, 35, 27, 0.1);
}

.tree-status {
  padding: 24px;
  color: #5d6d60;
}

.tree-status.error {
  color: #b95b50;
}
</style>
