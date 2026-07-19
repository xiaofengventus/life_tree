<template>
  <nav class="tool-nav" aria-label="进化树编辑工具">
    <div class="tool-row">
      <button type="button" @click="addBlankNode">添加空白节点</button>
      <button type="button" @click="duplicateSelected">复制节点</button>
      <button type="button" class="danger" @click="deleteSelected">
        删除选中
      </button>
      <button type="button" @click="undo">撤销</button>
      <button type="button" @click="saveTree">导出 .xur</button>
      <button type="button" @click="openFile">导入 .xur</button>
      <button type="button" @click="emit('export-pdf')">导出 PDF</button>
      <button type="button" @click="emit('export-png')">导出 PNG</button>
      <button type="button" @click="emit('export-svg')">导出 SVG</button>
      <input
        ref="fileInput"
        type="file"
        accept=".xur,.json"
        hidden
        @change="loadFile"
      />
    </div>

    <div class="tool-row">
      <label>
        <input
          type="checkbox"
          :checked="hideInternalNames"
          @change="emit('update:hideInternalNames', $event.target.checked)"
        />
        隐藏非叶子节点名字
      </label>
      <label>
        <input
          type="checkbox"
          :checked="alignRight"
          @change="emit('update:alignRight', $event.target.checked)"
        />
        物种对齐最右侧
      </label>
      <button type="button" @click="emit('zoom', 1.15)">容器放大</button>
      <button type="button" @click="emit('zoom', 0.87)">容器缩小</button>
      <span class="selection-info">
        已选择 {{ selectedIds.length }} 个节点
      </span>
    </div>

    <div class="tool-row property-row organized-toolbar">
      <section class="toolbar-section">
        <label class="branch-length-control">
          <span>树枝长度</span>
          <input
            v-model.number="branchLengthModel"
            type="range"
            min="40"
            max="500"
            step="1"
          />
          <input
            v-model.number="branchLengthModel"
            class="number-input"
            type="number"
            min="40"
            max="500"
          />
          <output>{{ branchLengthModel }}</output>
        </label>
      </section>

      <section class="toolbar-section color-picker-section">
        <span>统一颜色选择</span>
        <div class="palette-picker">
          <button
            type="button"
            class="palette-trigger"
            @click="paletteOpen = !paletteOpen"
          >
            <span class="current-color" :style="{ background: color }"></span>
            {{ color.toUpperCase() }}
          </button>
          <div v-if="paletteOpen" class="color-palette" @click.stop>
            <div v-for="group in paletteGroups" :key="group.name">
              <span class="palette-title">{{ group.name }}</span>
              <div class="palette-grid">
                <button
                  v-for="item in group.colors"
                  :key="item"
                  type="button"
                  class="color-swatch"
                  :class="{ selected: color === item }"
                  :style="{ background: item }"
                  :title="item"
                  @click="selectColor(item)"
                ></button>
              </div>
            </div>
            <label class="custom-color">
              自定义
              <input v-model="color" type="color" />
            </label>
          </div>
        </div>
      </section>

      <section class="toolbar-section">
        <span>树枝颜色</span>
        <button type="button" @click="setBranchColor">当前节点</button>
        <button type="button" @click="setDescendantBranchColor">
          该节点及其后代
        </button>
      </section>

      <section class="toolbar-section">
        <span>文本颜色</span>
        <button type="button" @click="setTextColor">当前节点</button>
        <button type="button" @click="setDescendantTextColor">
          该节点及其后代
        </button>
      </section>

      <section class="toolbar-section">
        <button type="button" @click="toggleScientificTriangle">
          科学三角形
        </button>
        <button type="button" @click="setCladeColor">单系群色块</button>
        <button type="button" @click="startFreeBlock">自由色块</button>
      </section>

      <section class="toolbar-section">
        <label>
          色块名称
          <input v-model="freeBlockName" class="text-input" type="text" />
        </label>
        <button type="button" @click="clearCladeColor">清除单系群色块</button>
        <button type="button" @click="removeFreeBlocks">清除自由色块</button>
      </section>
    </div>

    <div class="tool-row property-row">
      <label>
        URL
        <input
          class="text-input"
          :value="selectedNode?.url || ''"
          placeholder="对应的 post 地址"
          @change="setNodeUrl($event.target.value)"
        />
      </label>
      <label>
        图片
        <input
          class="text-input"
          :value="selectedNode?.image || ''"
          placeholder="图片地址"
          @change="setNodeImage($event.target.value)"
        />
      </label>
    </div>
  </nav>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import {
  allNodes,
  cloneNodeWithNewIds,
  cloneTree,
  createNode,
  descendants,
  findNode,
  findParent,
  generateNodeId,
  nodeNameText,
  normalizeName,
  selectedRootNodes,
} from "@/utils/evolutionTreeModel";

const props = defineProps({
  modelValue: { type: Object, required: true },
  selectedIds: { type: Array, default: () => [] },
  hideInternalNames: { type: Boolean, default: false },
  alignRight: { type: Boolean, default: false },
  fileOwner: { type: String, default: "生命时序" },
});

const emit = defineEmits([
  "update:modelValue",
  "update:hideInternalNames",
  "update:alignRight",
  "select-all",
  "select",
  "clear-selection",
  "zoom",
  "export-pdf",
  "export-png",
  "export-svg",
  "start-free-block",
]);

const fileInput = ref(null);
const color = ref("#202122");
const paletteOpen = ref(false);
const freeBlockName = ref("空白");
const undoStack = ref([]);
const clipboardFallback = ref("");
const clipboardTreeFallback = ref("");
let pasteEventVersion = 0;

const paletteGroups = [
  {
    name: "主题颜色",
    colors: [
      "#ffffff", "#202122", "#72777d", "#0b3954", "#087e8b",
      "#f26b38", "#14866d", "#0892d0", "#a62f92", "#4f9d32",
      "#eaecf0", "#54595d", "#a2a9b1", "#3366cc", "#36c",
      "#d33", "#00af89", "#2a9df4", "#c542c7", "#70b94f",
      "#c8ccd1", "#3a3f44", "#6b7280", "#1e4e8c", "#155e75",
      "#b45309", "#047857", "#0369a1", "#86198f", "#3f6212",
    ],
  },
  {
    name: "标准色",
    colors: [
      "#c00000", "#ff0000", "#ffc000", "#ffff00", "#92d050",
      "#00b050", "#00b0f0", "#0070c0", "#002060", "#7030a0",
    ],
  },
  {
    name: "渐变填充",
    colors: [
      "#8b0000", "#c0392b", "#d4a017", "#9a8f00", "#5b8c2a",
      "#087f5b", "#087f8c", "#075985", "#1e3a8a", "#581c87",
    ],
  },
];

function selectColor(value) {
  color.value = value;
  paletteOpen.value = false;
}

const selectedNode = computed(() =>
  props.selectedIds.length
    ? findNode(props.modelValue, props.selectedIds[0])
    : null,
);

const branchLengthModel = computed({
  get() {
    return Math.round(selectedNode.value?.branchLength || 100);
  },
  set(value) {
    const length = Math.max(40, Math.min(500, Number(value) || 40));
    updateTree((root) => {
      selectedRootNodes(root, props.selectedIds).forEach((node) => {
        node.branchLength = length;
      });
    });
  },
});

function recordUndo() {
  undoStack.value.push(cloneTree(props.modelValue));
  if (undoStack.value.length > 80) undoStack.value.shift();
}

function updateTree(mutator, { record = true } = {}) {
  if (record) recordUndo();
  const next = cloneTree(props.modelValue);
  mutator(next);
  emit("update:modelValue", next);
}

function undo() {
  const previous = undoStack.value.pop();
  if (previous) emit("update:modelValue", previous);
}

function addBlankNode() {
  updateTree((root) => {
    const parent = findNode(root, props.selectedIds[0]) || root;
    const child = createNode({
      name: { zh: "空白", latin: "" },
      branchLength: 100,
    });
    parent.children.push(child);
    emit("select", [child.id]);
  });
}

function deleteSelected() {
  if (!props.selectedIds.length) return;
  updateTree((root) => {
    selectedRootNodes(root, props.selectedIds).forEach((node) => {
      if (node === root) return;
      const parent = findParent(root, node.id);
      if (parent) {
        parent.children = parent.children.filter(
          (child) => child.id !== node.id,
        );
      }
    });
  });
  emit("clear-selection");
}

function duplicateSelected() {
  if (!props.selectedIds.length) return;
  const newIds = [];
  updateTree((root) => {
    selectedRootNodes(root, props.selectedIds).forEach((node) => {
      const parent = findParent(root, node.id);
      if (!parent) return;
      const copy = cloneNodeWithNewIds(node);
      const index = parent.children.findIndex((child) => child.id === node.id);
      parent.children.splice(index + 1, 0, copy);
      newIds.push(copy.id);
    });
  });
  if (newIds.length) emit("select", newIds);
}

function updateSelectedNodes(mutator) {
  if (!props.selectedIds.length) return;
  updateTree((root) => {
    props.selectedIds.forEach((id) => {
      const node = findNode(root, id);
      if (node) mutator(node);
    });
  });
}

function setBranchColor() {
  updateSelectedNodes((node) => {
    node.colors.branch = color.value;
  });
}

function setTextColor() {
  updateSelectedNodes((node) => {
    node.colors.text = color.value;
  });
}

function setDescendantBranchColor() {
  updateSelectedNodes((node) => {
    [node, ...descendants(node)].forEach((child) => {
      child.colors.branch = color.value;
    });
  });
}

function setDescendantTextColor() {
  updateSelectedNodes((node) => {
    [node, ...descendants(node)].forEach((child) => {
      child.colors.text = color.value;
    });
  });
}

function setNodeUrl(value) {
  updateSelectedNodes((node) => {
    node.url = String(value || "").trim();
  });
}

function setNodeImage(value) {
  updateSelectedNodes((node) => {
    node.image = String(value || "").trim();
  });
}

function toggleScientificTriangle() {
  updateSelectedNodes((node) => {
    if (!node.children.length) return;
    node.collapsed = !node.collapsed;
    if (node.collapsed) node.colors.triangle = color.value;
  });
}

function setCladeColor() {
  updateSelectedNodes((node) => {
    node.colors.clade = color.value;
  });
}

function clearCladeColor() {
  updateSelectedNodes((node) => {
    node.colors.clade = null;
  });
}

function startFreeBlock() {
  emit("start-free-block", {
    color: color.value,
    name: freeBlockName.value.trim(),
  });
}

function createFreeBlock(block) {
  updateTree((root) => {
    root.freeBlocks ||= [];
    root.freeBlocks.push({
      id: `free-block-${generateNodeId()}`,
      type: "manual",
      x: Number(block.x) || 0,
      y: Number(block.y) || 0,
      width: Math.max(12, Number(block.width) || 12),
      height: Math.max(12, Number(block.height) || 12),
      color: block.color || color.value,
      name: String(block.name || "空白").trim() || "空白",
      opacity: 0.16,
    });
  });
}

function updateFreeBlock(block) {
  updateTree((root) => {
    const current = (root.freeBlocks || []).find(
      (item) => item.id === block.id,
    );
    if (!current) return;
    current.type = "manual";
    current.x = Number(block.x) || 0;
    current.y = Number(block.y) || 0;
    current.width = Math.max(12, Number(block.width) || 12);
    current.height = Math.max(12, Number(block.height) || 12);
  });
}

function removeFreeBlocks() {
  updateTree((root) => {
    root.freeBlocks = [];
  });
}

function renameNode({ id, text, width }) {
  updateTree((root) => {
    const node = findNode(root, id);
    if (!node) return;
    node.name = normalizeName(text);
    node.labelWidth = Math.max(56, Math.min(460, Number(width) || 150));
  });
}

function resizeLabel({ id, width }) {
  updateTree((root) => {
    const node = findNode(root, id);
    if (!node) return;
    node.labelWidth = Math.max(56, Math.min(460, Number(width) || 150));
  });
}

function moveNodes({ nodeId, targetId, mode, before }) {
  updateTree((root) => {
    const sourceIds = props.selectedIds.includes(nodeId)
      ? props.selectedIds
      : [nodeId];
    const sources = selectedRootNodes(root, sourceIds).filter(
      (node) => node !== root,
    );
    const target = findNode(root, targetId);
    if (!sources.length || !target) return;
    if (
      sources.some(
        (source) =>
          source === target ||
          descendants(source).some((node) => node.id === target.id),
      )
    ) {
      return;
    }

    if (mode === "reorder") {
      const targetParent = findParent(root, target.id);
      if (!targetParent) return;
      const sourceParents = sources.map((source) =>
        findParent(root, source.id),
      );
      if (sourceParents.some((parent) => parent !== targetParent)) return;

      const orderedSources = targetParent.children.filter((child) =>
        sources.some((source) => source.id === child.id),
      );
      targetParent.children = targetParent.children.filter(
        (child) => !orderedSources.some((source) => source.id === child.id),
      );
      let index = targetParent.children.findIndex(
        (child) => child.id === target.id,
      );
      if (!before) index += 1;
      targetParent.children.splice(index, 0, ...orderedSources);
      return;
    }

    sources.forEach((source) => {
      const parent = findParent(root, source.id);
      if (parent) {
        parent.children = parent.children.filter(
          (child) => child.id !== source.id,
        );
      }
    });
    target.children ||= [];
    target.children.push(...sources);
  });
}

function moveSibling(direction) {
  if (props.selectedIds.length !== 1) return;
  updateTree((root) => {
    const node = findNode(root, props.selectedIds[0]);
    const parent = node ? findParent(root, node.id) : null;
    if (!node || !parent) return;
    const index = parent.children.findIndex((child) => child.id === node.id);
    const nextIndex = Math.max(
      0,
      Math.min(parent.children.length - 1, index + direction),
    );
    if (nextIndex === index) return;
    parent.children.splice(index, 1);
    parent.children.splice(nextIndex, 0, node);
  });
}

function indentedNodeText(node, depth = 0) {
  const name = nodeNameText(node).replace(/\s*\n\s*/g, " ");
  return [
    `${"  ".repeat(depth)}${name}`,
    ...(node.children || []).map((child) => indentedNodeText(child, depth + 1)),
  ].join("\n");
}

function contentForCopy() {
  const browserSelection = window.getSelection?.()?.toString() || "";
  if (browserSelection) return { text: browserSelection, tree: "" };
  const nodes = selectedRootNodes(props.modelValue, props.selectedIds);
  return {
    text: nodes.map((node) => indentedNodeText(node)).join("\n"),
    tree: nodes.length ? `LIFE_TREE_NODES\n${JSON.stringify(nodes)}` : "",
  };
}

function legacyCopyText(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  Object.assign(textarea.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
  });
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

async function copySelectedText() {
  const { text, tree } = contentForCopy();
  if (!text) return;
  clipboardFallback.value = text;
  clipboardTreeFallback.value = tree;
  try {
    if (!navigator.clipboard?.writeText) throw new Error("clipboard unavailable");
    await navigator.clipboard.writeText(text);
  } catch {
    legacyCopyText(text);
  }
}

function parseIndentedText(text) {
  const roots = [];
  const stack = [];
  text.split(/\r?\n/).forEach((line) => {
    if (!line.trim()) return;
    const indent = line.match(/^[ \t]*/)?.[0]?.replace(/\t/g, "  ").length || 0;
    const level = Math.floor(indent / 2);
    const node = createNode({ name: line.trim() });
    while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
    if (stack.length) stack[stack.length - 1].node.children.push(node);
    else roots.push(node);
    stack.push({ level, node });
  });
  return roots;
}

function insertPastedText(text) {
  if (!text?.trim()) return;

  let nodes;
  if (text.startsWith("LIFE_TREE_NODES\n")) {
    try {
      nodes = JSON.parse(text.slice("LIFE_TREE_NODES\n".length)).map((node) =>
        cloneNodeWithNewIds(node),
      );
    } catch {
      return;
    }
  } else {
    nodes = parseIndentedText(text);
  }

  const pastedIds = nodes.map((node) => node.id);
  updateTree((root) => {
    const parent = findNode(root, props.selectedIds[0]) || root;
    parent.children.push(...nodes);
  });
  emit("select", pastedIds);
}

async function pasteNodes() {
  let text = clipboardFallback.value;
  try {
    text = await navigator.clipboard.readText();
  } catch {
    // The native paste event supplies clipboardData when this API is denied.
  }
  const content =
    text === clipboardFallback.value && clipboardTreeFallback.value
      ? clipboardTreeFallback.value
      : text;
  insertPastedText(content);
}

function handlePaste(event) {
  if (isTextInput(event.target)) return;
  const text = event.clipboardData?.getData("text/plain") || "";
  if (!text.trim()) return;
  event.preventDefault();
  pasteEventVersion += 1;
  const content =
    text === clipboardFallback.value && clipboardTreeFallback.value
      ? clipboardTreeFallback.value
      : text;
  if (content === text && text !== clipboardFallback.value) {
    clipboardTreeFallback.value = "";
  }
  clipboardFallback.value = text;
  insertPastedText(content);
}

function encodeXur(tree) {
  return JSON.stringify(tree, null, 2);
}

function decodeXur(raw) {
  const text = String(raw || "").trim();

  if (!text) {
    throw new Error("empty xur content");
  }

  if (text.startsWith("XUR1:")) {
    const payload = text.slice(5);
    try {
      return JSON.parse(payload);
    } catch {
      return JSON.parse(decodeURIComponent(escape(atob(payload))));
    }
  }

  return JSON.parse(text);
}

// function base64ToBytes(value) {
//   const binary = atob(value);
//   return Uint8Array.from(binary, (char) => char.charCodeAt(0));
// }

// async function xurKey() {
//   const digest = await crypto.subtle.digest(
//     "SHA-256",
//     new TextEncoder().encode("life-tree-xur-format-v2"),
//   );
//   return crypto.subtle.importKey("raw", digest, "AES-GCM", false, [
//     "encrypt",
//     "decrypt",
//   ]);
// }

// async function encodeXur(tree) {
//   if (!crypto.subtle) {
//     return `XUR1:${btoa(unescape(encodeURIComponent(JSON.stringify(tree))))}`;
//   }
//   const iv = crypto.getRandomValues(new Uint8Array(12));
//   const encrypted = await crypto.subtle.encrypt(
//     { name: "AES-GCM", iv },
//     await xurKey(),
//     new TextEncoder().encode(JSON.stringify(tree)),
//   );
//   return `XUR2:${bytesToBase64(iv)}:${bytesToBase64(
//     new Uint8Array(encrypted),
//   )}`;
// }

// async function decodeXur(raw) {
//   if (raw.startsWith("XUR2:")) {
//     const [, ivValue, encryptedValue] = raw.split(":");
//     const decrypted = await crypto.subtle.decrypt(
//       { name: "AES-GCM", iv: base64ToBytes(ivValue) },
//       await xurKey(),
//       base64ToBytes(encryptedValue),
//     );
//     return JSON.parse(new TextDecoder().decode(decrypted));
//   }
//   if (raw.startsWith("XUR1:")) {
//     return JSON.parse(decodeURIComponent(escape(atob(raw.slice(5)))));
//   }
//   return JSON.parse(raw);
// }

async function saveTree() {
  const content = await encodeXur(props.modelValue);
  const blob = new Blob([content], { type: "application/x-xur" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const owner = String(props.fileOwner || "生命时序").replace(
    /[\\/:*?"<>|]/g,
    "_",
  );
  link.href = url;
  link.download = `${owner}.xur`;
  link.click();
  URL.revokeObjectURL(url);
}

function openFile() {
  fileInput.value?.click();
}

function loadFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const data = await decodeXur(String(reader.result || ""));
      emit("update:modelValue", createNode(data));
      emit("clear-selection");
    } catch {
      window.alert("无法读取进化树文件");
    }
    event.target.value = "";
  };
  reader.readAsText(file);
}

function isTextInput(target) {
  return Boolean(
    target?.closest?.(
      "input, textarea, select, [contenteditable='true'], .node-name-editor",
    ),
  );
}

function handleShortcut(event) {
  if (isTextInput(event.target)) return;
  const modifier = event.ctrlKey || event.metaKey;
  const key = event.key.toLowerCase();

  if (modifier && key === "z") {
    event.preventDefault();
    undo();
  } else if (modifier && key === "s") {
    event.preventDefault();
    saveTree();
  } else if (modifier && key === "c") {
    event.preventDefault();
    copySelectedText();
  } else if (modifier && key === "v") {
    // Let the native paste event read clipboardData without permission prompts.
    // The fallback below covers environments that do not dispatch paste.
    const currentPasteVersion = pasteEventVersion;
    setTimeout(() => {
      if (pasteEventVersion === currentPasteVersion) pasteNodes();
    }, 0);
  } else if (modifier && key === "d") {
    event.preventDefault();
    duplicateSelected();
  } else if (modifier && key === "a") {
    event.preventDefault();
    emit(
      "select-all",
      allNodes(props.modelValue).map((node) => node.id),
    );
  } else if (modifier && (event.key === "+" || event.key === "=")) {
    event.preventDefault();
    emit("zoom", 1.15);
  } else if (modifier && event.key === "-") {
    event.preventDefault();
    emit("zoom", 0.87);
  } else if (event.key === "Escape") {
    event.preventDefault();
    emit("clear-selection");
  } else if (event.key === "Delete" || event.key === "Backspace") {
    event.preventDefault();
    deleteSelected();
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    moveSibling(-1);
  } else if (event.key === "ArrowDown") {
    event.preventDefault();
    moveSibling(1);
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    branchLengthModel.value -= 5;
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    branchLengthModel.value += 5;
  }
}

defineExpose({
  moveNodes,
  renameNode,
  resizeLabel,
  createFreeBlock,
  updateFreeBlock,
  saveTree,
});

onMounted(() => {
  window.addEventListener("keydown", handleShortcut);
  window.addEventListener("paste", handlePaste);
});
onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleShortcut);
  window.removeEventListener("paste", handlePaste);
});
</script>

<style scoped>
.tool-nav {
  display: grid;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid #a2a9b1;
  background: #f8f9fa;
  color: #202122;
  font-family: sans-serif;
  font-size: 13px;
}

.tool-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
}

.tool-row button {
  width: auto;
  padding: 5px 9px;
  border: 1px solid #a2a9b1;
  border-radius: 2px;
  background: #ffffff;
  color: #202122;
  cursor: pointer;
  font: inherit;
}

.tool-row button:hover {
  border-color: #36c;
  color: #36c;
}

.tool-row button.danger {
  color: #b32424;
}

.tool-row label,
.branch-length-control {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.property-row {
  overflow-x: auto;
  flex-wrap: nowrap;
  padding-bottom: 2px;
  white-space: nowrap;
}

.organized-toolbar {
  align-items: stretch;
  gap: 0;
  border-top: 2px solid #36c;
  border-bottom: 2px solid #36c;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 12px;
  border-right: 1px solid #a2a9b1;
}

.toolbar-section:last-child {
  border-right: 0;
}

.color-picker-section {
  align-items: flex-start;
}

.palette-picker {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.palette-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.current-color {
  width: 18px;
  height: 18px;
  border: 1px solid #72777d;
}

.color-palette {
  width: 250px;
  padding: 7px;
  border: 1px solid #a2a9b1;
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.16);
  white-space: normal;
  z-index: 20;
}

.palette-title {
  display: block;
  margin: 3px 0;
  padding: 2px 5px;
  background: #eaecf0;
  color: #54595d;
}

.palette-grid {
  display: grid;
  grid-template-columns: repeat(10, 18px);
  gap: 4px;
  padding: 3px 5px 6px;
}

.tool-row button.color-swatch {
  width: 18px;
  height: 18px;
  padding: 0;
  border: 1px solid #c8ccd1;
  border-radius: 0;
}

.tool-row button.color-swatch.selected {
  outline: 2px solid #36c;
  outline-offset: 1px;
}

.custom-color {
  margin: 4px 5px 1px;
}

.branch-length-control input[type="range"] {
  width: 170px;
}

.number-input {
  width: 66px;
  padding: 4px 5px;
  border: 1px solid #a2a9b1;
}

.text-input {
  width: 180px;
  padding: 4px 6px;
  border: 1px solid #a2a9b1;
}

.tool-row input[type="color"] {
  width: 30px;
  height: 25px;
  padding: 0;
}

.selection-info {
  color: #54595d;
}
</style>
