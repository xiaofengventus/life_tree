<script setup>
import { ref } from "vue";
import navBar from "@/components/navBar.vue";
import evolution_tree_canva from "@/components/evolution_tree_canva.vue";
import evolution_tree_tool from "@/components/evolution_tree_tool.vue";
import { createInitialTree } from "@/utils/evolutionTreeModel";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();
const tree = ref(createInitialTree());
const selectedIds = ref([]);
const selectionAnchor = ref(null);
const hideInternalNames = ref(false);
const alignRight = ref(false);
const zoom = ref(1);
const toolRef = ref(null);
const canvasRef = ref(null);

function handleSelect({ id, shift, toggle, leafOrder }) {
  if (shift && selectionAnchor.value) {
    const start = leafOrder.indexOf(selectionAnchor.value);
    const end = leafOrder.indexOf(id);
    if (start >= 0 && end >= 0) {
      const [from, to] = start < end ? [start, end] : [end, start];
      selectedIds.value = leafOrder.slice(from, to + 1);
      return;
    }
  }

  if (toggle) {
    selectedIds.value = selectedIds.value.includes(id)
      ? selectedIds.value.filter((selectedId) => selectedId !== id)
      : [...selectedIds.value, id];
  } else {
    selectedIds.value = [id];
  }
  selectionAnchor.value = id;
}

function setSelection(ids) {
  selectedIds.value = Array.isArray(ids) ? ids : [];
  selectionAnchor.value = selectedIds.value[0] || null;
}

function clearSelection() {
  selectedIds.value = [];
  selectionAnchor.value = null;
}

function changeZoom(factor) {
  zoom.value = Math.max(0.35, Math.min(3, zoom.value * factor));
}

function handleMove(payload) {
  toolRef.value?.moveNodes(payload);
}

function handleRename(payload) {
  toolRef.value?.renameNode(payload);
}

function exportPdf() {
  canvasRef.value?.exportPdf();
}
</script>

<template>
  <navBar />
  <main class="evolution-editor-page">
    <evolution_tree_tool
      ref="toolRef"
      v-model="tree"
      v-model:hide-internal-names="hideInternalNames"
      v-model:align-right="alignRight"
      :selected-ids="selectedIds"
      :file-owner="userStore.user?.name || '生命时序'"
      @select-all="setSelection"
      @select="setSelection"
      @clear-selection="clearSelection"
      @zoom="changeZoom"
      @export-pdf="exportPdf"
      @start-free-block="canvasRef?.startFreeBlock($event)"
    />

    <section class="evolution-canvas-panel">
      <evolution_tree_canva
        ref="canvasRef"
        :model="tree"
        :selected-ids="selectedIds"
        :zoom="zoom"
        :hide-internal-names="hideInternalNames"
        :align-right="alignRight"
        :blank-branch-length="86"
        @select="handleSelect"
        @move="handleMove"
        @rename="handleRename"
        @resize-label="toolRef?.resizeLabel($event)"
        @box-select="setSelection"
        @clear-selection="clearSelection"
        @create-free-block="toolRef?.createFreeBlock($event)"
        @update-free-block="toolRef?.updateFreeBlock($event)"
      />
    </section>
  </main>
</template>

<style scoped>
.evolution-editor-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding-top: 60px;
  overflow: hidden;
  background: #ffffff;
}

.evolution-canvas-panel {
  flex: 1;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  background: #ffffff;
}
</style>
