<script setup>
import { ref } from "vue";
import navBar from "@/components/navBar.vue";
import evolution_mind_map from "@/components/evolution_mind_map.vue";
import { createInitialMindMapDocument } from "@/utils/evolutionMindMapModel";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();
const document = ref(createInitialMindMapDocument());
</script>

<template>
  <navBar />
  <main class="evolution-editor-page">
    <evolution_mind_map
      v-model="document"
      :file-owner="userStore.user?.name || '生命时序'"
    />
  </main>
</template>

<style scoped>
.evolution-editor-page {
  width: 100%;
  height: 100vh;
  padding-top: 60px;
  overflow: hidden;
  background: #f8faf7;
}
</style>
