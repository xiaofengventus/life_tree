<template>
  <section class="mind-map-workbench" :class="{ 'is-readonly': readOnly }">
    <header class="command-bar">
      <div v-if="!readOnly" class="command-group file-group">
        <button type="button" title="新建进化树" @click="newDocument">新建</button>
        <button type="button" title="打开新版 .xur / .smm 文件" @click="openFile">
          打开
        </button>
        <button type="button" class="primary" title="保存新版 .xur" @click="saveXur">
          保存 .xur
        </button>
        <input
          ref="fileInput"
          type="file"
          accept=".xur,.smm,.json"
          hidden
          @change="loadFile"
        />
      </div>

      <div v-if="!readOnly" class="command-group">
        <button type="button" title="撤销 Ctrl+Z" @click="run('BACK')">撤销</button>
        <button type="button" title="重做 Ctrl+Y" @click="run('FORWARD')">重做</button>
        <button type="button" title="添加同级节点 Enter" @click="addSibling">
          同级
        </button>
        <button type="button" title="添加子节点 Tab" @click="addChild">子节点</button>
        <button type="button" title="在当前节点上方插入父节点" @click="addParent">
          父节点
        </button>
        <button type="button" class="danger" title="删除 Delete" @click="removeNodes">
          删除
        </button>
      </div>

      <div class="command-group view-group">
        <label class="select-control">
          <span>布局</span>
          <select v-model="layoutName" @change="changeLayout">
            <option value="logicalStructure">矩形进化树</option>
            <option value="logicalStructureLeft">向左矩形树</option>
            <option value="mindMap">双向辐射树</option>
            <option value="organizationStructure">层级树</option>
            <option value="catalogOrganization">目录树</option>
          </select>
        </label>
        <button type="button" title="让整棵树适应当前画布" @click="fitView">适应</button>
        <button type="button" title="根节点回到画布中央" @click="centerRoot">居中</button>
        <button type="button" title="缩小" @click="zoomOut">−</button>
        <button type="button" class="zoom-value" title="恢复 100%" @click="resetZoom">
          {{ zoomPercent }}%
        </button>
        <button type="button" title="放大" @click="zoomIn">＋</button>
        <button type="button" title="展开全部分类群" @click="run('EXPAND_ALL')">
          展开
        </button>
        <button type="button" title="收起全部分类群" @click="run('UNEXPAND_ALL')">
          收起
        </button>
      </div>

      <div v-if="!readOnly" class="command-group export-group">
        <button type="button" @click="exportFile('svg')">SVG</button>
        <button type="button" @click="exportFile('png')">PNG</button>
        <button type="button" title="使用浏览器打印生成可选中文字的矢量 PDF" @click="exportFile('pdf')">
          矢量 PDF
        </button>
      </div>
    </header>

    <div class="workspace-body">
      <div ref="mapContainer" class="mind-map-canvas" aria-label="生命进化树画布"></div>

      <aside v-if="!readOnly" class="inspector" :class="{ disabled: !selectedCount }">
        <div class="inspector-heading">
          <div>
            <span class="eyebrow">节点属性</span>
            <strong>{{ selectedTitle }}</strong>
          </div>
          <span class="selection-badge">{{ selectedCount }}</span>
        </div>

        <template v-if="selectedCount">
          <label class="field full-field">
            <span>分类群名称</span>
            <textarea
              v-model="inspector.text"
              :disabled="selectedCount !== 1"
              rows="3"
              placeholder="例如：人属 Homo"
              @change="applyText"
              @keydown.stop
            ></textarea>
          </label>

          <label class="field full-field">
            <span>资料链接</span>
            <input
              v-model="inspector.hyperlink"
              :disabled="selectedCount !== 1"
              type="url"
              placeholder="https://..."
              @change="applyHyperlink"
              @keydown.stop
            />
          </label>

          <label class="field full-field">
            <span>图片地址</span>
            <input
              v-model="inspector.image"
              :disabled="selectedCount !== 1"
              type="url"
              placeholder="https://.../species.jpg"
              @change="applyImage"
              @keydown.stop
            />
          </label>

          <div class="color-grid">
            <label class="field color-field">
              <span>文字</span>
              <input v-model="inspector.color" type="color" @change="applyStyle('color')" />
            </label>
            <label class="field color-field">
              <span>节点背景</span>
              <input
                v-model="inspector.fillColor"
                type="color"
                @change="applyStyle('fillColor')"
              />
            </label>
            <label class="field color-field">
              <span>分支</span>
              <input
                v-model="inspector.lineColor"
                type="color"
                @change="applyStyle('lineColor')"
              />
            </label>
          </div>

          <label class="field full-field">
            <span>节点形状</span>
            <select v-model="inspector.shape" @change="applyShape">
              <option value="roundedRectangle">圆角矩形</option>
              <option value="rectangle">矩形</option>
              <option value="ellipse">椭圆</option>
              <option value="diamond">菱形</option>
              <option value="circle">圆形</option>
            </select>
          </label>

          <div class="inspector-actions">
            <button type="button" @click="moveNode('UP_NODE')">上移</button>
            <button type="button" @click="moveNode('DOWN_NODE')">下移</button>
            <button type="button" @click="toggleExpand">展开/折叠</button>
          </div>
        </template>

        <div v-else class="empty-inspector">
          <span class="empty-icon">⌁</span>
          <p>选择一个节点后，可编辑名称、链接、图片与颜色。</p>
        </div>
      </aside>
    </div>

    <footer class="status-bar">
      <span><i class="status-dot"></i>{{ statusText }}</span>
      <span>节点 {{ nodeCount }}</span>
      <span v-if="!readOnly">已选 {{ selectedCount }}</span>
      <span class="shortcut-hint">
        {{ readOnly ? "滚轮平移 · Ctrl+滚轮缩放" : "双击编辑 · Tab 子节点 · Enter 同级 · 拖拽调整结构" }}
      </span>
      <span class="engine-mark">simple-mind-map</span>
    </footer>
  </section>
</template>

<script setup>
import {
  computed,
  markRaw,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  shallowRef,
  watch,
} from "vue";
import MindMap from "simple-mind-map";
import Drag from "simple-mind-map/src/plugins/Drag.js";
import Export from "simple-mind-map/src/plugins/Export.js";
import KeyboardNavigation from "simple-mind-map/src/plugins/KeyboardNavigation.js";
import Select from "simple-mind-map/src/plugins/Select.js";
import TouchEvent from "simple-mind-map/src/plugins/TouchEvent.js";
import "simple-mind-map/dist/simpleMindMap.esm.css";
import {
  countMindMapNodes,
  createInitialMindMapDocument,
  createXurFile,
  normalizeMindMapDocument,
} from "@/utils/evolutionMindMapModel";

MindMap.usePlugin(Drag)
  .usePlugin(Select)
  .usePlugin(TouchEvent)
  .usePlugin(KeyboardNavigation)
  .usePlugin(Export);

const props = defineProps({
  modelValue: { type: Object, required: true },
  readOnly: { type: Boolean, default: false },
  fileOwner: { type: String, default: "生命时序" },
});

const emit = defineEmits(["update:modelValue", "ready", "error"]);

const mapContainer = ref(null);
const fileInput = ref(null);
const mindMap = shallowRef(null);
const activeNodes = shallowRef([]);
const zoomPercent = ref(100);
const nodeCount = ref(countMindMapNodes(props.modelValue?.root));
const layoutName = ref(props.modelValue?.layout || "logicalStructure");
const statusText = ref(props.readOnly ? "只读浏览" : "准备就绪");
const inspector = reactive({
  text: "",
  hyperlink: "",
  image: "",
  color: "#263a30",
  fillColor: "#ffffff",
  lineColor: "#71877a",
  shape: "roundedRectangle",
});

let resizeObserver = null;
let lastPublished = "";
let viewPublishTimer = null;

const selectedCount = computed(() => activeNodes.value.length);
const selectedTitle = computed(() => {
  if (!selectedCount.value) return "未选择";
  if (selectedCount.value > 1) return `${selectedCount.value} 个节点`;
  return inspector.text || "未命名节点";
});

function activeNodeOrRoot() {
  return activeNodes.value[0] || mindMap.value?.renderer?.root || null;
}

function refreshInspector(nodes = activeNodes.value) {
  activeNodes.value = nodes.map((node) => markRaw(node));
  const node = activeNodes.value[0];
  const data = node?.getData?.() || {};
  inspector.text = data.text || "";
  inspector.hyperlink = data.hyperlink || "";
  inspector.image = data.image || "";
  inspector.color = data.color || "#263a30";
  inspector.fillColor = data.fillColor || "#ffffff";
  inspector.lineColor = data.lineColor || "#71877a";
  inspector.shape = data.shape || "roundedRectangle";
}

function currentDocument() {
  return normalizeMindMapDocument(mindMap.value.getData(true));
}

function publishDocument() {
  if (!mindMap.value) return;
  const document = currentDocument();
  nodeCount.value = countMindMapNodes(document.root);
  layoutName.value = document.layout;
  lastPublished = JSON.stringify(document);
  emit("update:modelValue", document);
}

function scheduleViewPublish() {
  window.clearTimeout(viewPublishTimer);
  viewPublishTimer = window.setTimeout(publishDocument, 240);
}

function run(command, ...args) {
  if (!mindMap.value) return;
  mindMap.value.execCommand(command, ...args);
}

function addChild() {
  const target = activeNodeOrRoot();
  if (target) run("INSERT_CHILD_NODE", true, [target], { text: "新分类群" });
}

function addSibling() {
  const target = activeNodeOrRoot();
  if (!target || target.isRoot) return addChild();
  run("INSERT_NODE", true, [target], { text: "新分类群" });
}

function addParent() {
  const target = activeNodeOrRoot();
  if (target && !target.isRoot) {
    run("INSERT_PARENT_NODE", true, [target], { text: "新分类群" });
  }
}

function removeNodes() {
  if (activeNodes.value.some((node) => node.isRoot)) return;
  run("REMOVE_NODE");
}

function moveNode(command) {
  if (selectedCount.value === 1) run(command);
}

function toggleExpand() {
  activeNodes.value.forEach((node) => {
    if (!node.isRoot && node.nodeData?.children?.length) {
      run("SET_NODE_EXPAND", node, node.getData("expand") === false);
    }
  });
}

function applyText() {
  const node = activeNodes.value[0];
  if (node && selectedCount.value === 1) node.setText(inspector.text.trim() || "未命名分类群");
}

function applyHyperlink() {
  const node = activeNodes.value[0];
  if (node && selectedCount.value === 1) {
    node.setHyperlink(inspector.hyperlink.trim(), inspector.text);
  }
}

function applyImage() {
  const node = activeNodes.value[0];
  if (!node || selectedCount.value !== 1) return;
  node.setImage(
    inspector.image
      ? { url: inspector.image.trim(), title: inspector.text, width: 180, height: 110 }
      : { url: "", title: "", width: 0, height: 0 },
  );
}

function applyStyle(property) {
  activeNodes.value.forEach((node) => node.setStyle(property, inspector[property]));
}

function applyShape() {
  activeNodes.value.forEach((node) => node.setShape(inspector.shape));
}

function changeLayout() {
  mindMap.value?.setLayout(layoutName.value);
  window.setTimeout(publishDocument, 0);
}

function zoomIn() {
  mindMap.value?.view.enlarge();
}

function zoomOut() {
  mindMap.value?.view.narrow();
}

function resetZoom() {
  mindMap.value?.view.setScale(1);
}

function fitView() {
  mindMap.value?.view.fit();
}

function centerRoot() {
  mindMap.value?.renderer.setRootNodeCenter();
}

function safeOwner() {
  return String(props.fileOwner || "生命时序").replace(/[\\/:*?"<>|]/g, "_");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function saveXur() {
  try {
    const payload = createXurFile(currentDocument());
    downloadBlob(
      new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }),
      `${safeOwner()}.xur`,
    );
    statusText.value = "已保存新版 .xur";
  } catch (error) {
    handleError(error, "保存失败");
  }
}

function openFile() {
  fileInput.value?.click();
}

async function loadFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const payload = JSON.parse(await file.text());
    const document = normalizeMindMapDocument(payload);
    mindMap.value.setFullData(document);
    layoutName.value = document.layout;
    refreshInspector([]);
    window.setTimeout(() => {
      fitView();
      publishDocument();
    }, 0);
    statusText.value = `已打开 ${file.name}`;
  } catch (error) {
    handleError(error, "文件不是新版 mind-map 文档");
  } finally {
    event.target.value = "";
  }
}

function newDocument() {
  if (!window.confirm("新建会替换当前画布，尚未保存的内容将丢失。继续吗？")) return;
  const document = createInitialMindMapDocument();
  mindMap.value.setFullData(document);
  layoutName.value = document.layout;
  refreshInspector([]);
  window.setTimeout(() => {
    centerRoot();
    publishDocument();
  }, 0);
  statusText.value = "已新建进化树";
}

async function exportFile(type) {
  if (!mindMap.value) return;
  statusText.value = `正在导出 ${type.toUpperCase()}…`;
  try {
    if (type === "pdf") {
      await exportVectorPdf();
      statusText.value = "已打开矢量 PDF 打印窗口";
    } else {
      await mindMap.value.export(type, true, `${safeOwner()}-进化树`);
      statusText.value = `${type.toUpperCase()} 导出完成`;
    }
  } catch (error) {
    handleError(error, `${type.toUpperCase()} 导出失败`);
  }
}

async function exportVectorPdf() {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    throw new Error("浏览器阻止了打印窗口，请允许本站打开弹窗");
  }

  try {
    printWindow.document.title = `${safeOwner()}-进化树`;
    printWindow.document.body.innerHTML =
      '<p style="font-family:sans-serif;padding:24px">正在生成矢量 PDF…</p>';

    const svgDataUrl = await mindMap.value.doExport.svg(`${safeOwner()}-进化树`);
    const svgText = await fetch(svgDataUrl).then((response) => response.text());
    const parsed = new DOMParser().parseFromString(svgText, "image/svg+xml");
    parsed.querySelectorAll("script, foreignObject").forEach((node) => node.remove());
    const cleanSvg = new XMLSerializer().serializeToString(parsed.documentElement);

    printWindow.document.open();
    printWindow.document.write(`<!doctype html>
      <html lang="zh-CN">
        <head>
          <meta charset="UTF-8" />
          <title>${safeOwner()}-进化树</title>
          <style>
            @page { size: A3 landscape; margin: 10mm; }
            * { box-sizing: border-box; }
            html, body { width: 100%; height: 100%; margin: 0; }
            body {
              display: grid;
              place-items: center;
              overflow: hidden;
              background: #fff;
              font-family: "Noto Sans SC", "Microsoft YaHei", sans-serif;
            }
            svg { display: block; width: 100%; height: 100%; }
            .print-tip {
              position: fixed;
              top: 12px;
              left: 50%;
              z-index: 10;
              transform: translateX(-50%);
              padding: 8px 14px;
              border-radius: 8px;
              background: #163d2b;
              color: #fff;
              font: 13px sans-serif;
            }
            @media print { .print-tip { display: none; } }
          </style>
        </head>
        <body>
          <div class="print-tip">在打印目标中选择“保存为 PDF”；文字将保持为可选择的矢量文本</div>
          ${cleanSvg}
        </body>
      </html>`);
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => printWindow.print(), 350);
  } catch (error) {
    printWindow.close();
    throw error;
  }
}

function handleError(error, message = "操作失败") {
  console.error(error);
  statusText.value = message;
  emit("error", error);
  window.alert(`${message}：${error?.message || "未知错误"}`);
}

function bindMindMapEvents(instance, hasSavedView) {
  instance.on("node_active", (_node, nodes) => refreshInspector(nodes || []));
  instance.on("data_change", (root) => {
    nodeCount.value = countMindMapNodes(root);
    statusText.value = "内容已更新";
    window.setTimeout(publishDocument, 0);
  });
  instance.on("scale", (scale) => {
    zoomPercent.value = Math.round(scale * 100);
    scheduleViewPublish();
  });
  instance.on("translate", scheduleViewPublish);
  instance.on("layout_change", (layout) => {
    layoutName.value = layout;
  });
  instance.on("node_tree_render_end", () => {
    if (!hasSavedView) {
      hasSavedView = true;
      instance.view.fit();
    }
  });
}

onMounted(async () => {
  await nextTick();
  try {
    const document = normalizeMindMapDocument(props.modelValue);
    const instance = markRaw(
      new MindMap({
        el: mapContainer.value,
        data: document.root,
        layout: document.layout,
        theme: document.theme.template,
        themeConfig: document.theme.config,
        viewData: document.view || undefined,
        readonly: props.readOnly,
        fit: false,
        scaleRatio: 0.12,
        minZoomRatio: 20,
        maxZoomRatio: 300,
        mousewheelAction: "move",
        mousewheelZoomActionReverse: true,
        enableCtrlKeyNodeSelection: true,
        enableShortcutOnlyWhenMouseInSvg: true,
        enableAutoEnterTextEditWhenKeydown: true,
        autoEmptyTextWhenKeydownEnterEdit: false,
        selectTextOnEnterEditText: true,
        createNewNodeBehavior: "default",
        handleIsSplitByWrapOnPasteCreateNewNode: () => Promise.resolve(),
        maxHistoryCount: 300,
        fitPadding: 72,
        exportPaddingX: 48,
        exportPaddingY: 48,
        errorHandler: (_code, error) => console.error(error),
      }),
    );
    mindMap.value = instance;
    bindMindMapEvents(instance, Boolean(document.view));
    resizeObserver = new ResizeObserver(() => instance.resize());
    resizeObserver.observe(mapContainer.value);
    emit("ready", instance);
    statusText.value = props.readOnly ? "只读浏览" : "准备就绪";
  } catch (error) {
    handleError(error, "进化树初始化失败");
  }
});

watch(
  () => props.readOnly,
  (value) => mindMap.value?.setMode(value ? "readonly" : "edit"),
);

watch(
  () => props.modelValue,
  (value) => {
    if (!mindMap.value) return;
    const serialized = JSON.stringify(value);
    if (serialized === lastPublished) {
      lastPublished = "";
      return;
    }
    try {
      const document = normalizeMindMapDocument(value);
      mindMap.value.setFullData(document);
      layoutName.value = document.layout;
      nodeCount.value = countMindMapNodes(document.root);
    } catch (error) {
      handleError(error, "外部树数据更新失败");
    }
  },
);

onBeforeUnmount(() => {
  window.clearTimeout(viewPublishTimer);
  resizeObserver?.disconnect();
  mindMap.value?.destroy();
  mindMap.value = null;
});

defineExpose({ saveXur, exportFile, fitView, centerRoot, getDocument: currentDocument });
</script>

<style scoped>
.mind-map-workbench {
  --forest-950: #102d21;
  --forest-800: #1f5139;
  --forest-700: #286b49;
  --forest-100: #e6f0e9;
  --line: #d5dfd8;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) 34px;
  width: 100%;
  height: 100%;
  min-height: 520px;
  overflow: hidden;
  background: #f8faf7;
  color: #24342b;
  font-family: "Noto Sans SC", "Microsoft YaHei", sans-serif;
}

.command-bar {
  position: relative;
  z-index: 8;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 54px;
  padding: 8px 12px;
  overflow-x: auto;
  border-bottom: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 3px 14px rgba(31, 59, 43, 0.06);
  scrollbar-width: thin;
}

.command-group {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 5px;
  padding-right: 8px;
  border-right: 1px solid var(--line);
}

.command-group:last-child {
  padding-right: 0;
  border-right: 0;
}

.command-bar button,
.inspector-actions button {
  min-height: 34px;
  padding: 6px 10px;
  border: 1px solid #cbd7cf;
  border-radius: 7px;
  background: #ffffff;
  color: #294236;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  white-space: nowrap;
}

.command-bar button:hover,
.inspector-actions button:hover {
  border-color: var(--forest-700);
  background: #f1f7f3;
  color: var(--forest-800);
}

.command-bar button.primary {
  border-color: var(--forest-700);
  background: var(--forest-700);
  color: #ffffff;
}

.command-bar button.danger {
  color: #a43b35;
}

.zoom-value {
  min-width: 58px;
  font-variant-numeric: tabular-nums;
}

.select-control {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #65746b;
}

.select-control select,
.field select,
.field input,
.field textarea {
  box-sizing: border-box;
  width: 100%;
  border: 1px solid #cbd7cf;
  border-radius: 7px;
  background: #ffffff;
  color: #263a30;
  font: inherit;
}

.select-control select {
  width: auto;
  min-height: 34px;
  padding: 5px 28px 5px 8px;
}

.workspace-body {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 286px;
  min-height: 0;
  overflow: hidden;
}

.is-readonly .workspace-body {
  grid-template-columns: minmax(0, 1fr);
}

.mind-map-canvas {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background-image: radial-gradient(circle at 1px 1px, rgba(42, 88, 61, 0.11) 1px, transparent 0);
  background-size: 24px 24px;
}

.inspector {
  position: relative;
  z-index: 5;
  min-width: 0;
  overflow-y: auto;
  border-left: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.97);
  box-shadow: -10px 0 26px rgba(31, 59, 43, 0.06);
}

.inspector-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 16px 14px;
  border-bottom: 1px solid #e4ebe6;
}

.inspector-heading > div {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.inspector-heading strong {
  overflow: hidden;
  color: var(--forest-950);
  font-size: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.eyebrow {
  color: #74847a;
  font-size: 11px;
  letter-spacing: 0.12em;
}

.selection-badge {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 50%;
  background: var(--forest-100);
  color: var(--forest-800);
  font-size: 12px;
  font-weight: 700;
}

.field {
  display: grid;
  gap: 6px;
  color: #5d6d63;
  font-size: 12px;
}

.full-field {
  margin: 14px 16px 0;
}

.field input,
.field select,
.field textarea {
  min-height: 36px;
  padding: 8px 9px;
  resize: vertical;
  outline: none;
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  border-color: var(--forest-700);
  box-shadow: 0 0 0 3px rgba(40, 107, 73, 0.1);
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin: 15px 16px 0;
}

.color-field input {
  height: 38px;
  padding: 3px;
  cursor: pointer;
}

.inspector-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin: 16px;
}

.inspector-actions button {
  padding-inline: 4px;
  font-size: 12px;
}

.empty-inspector {
  display: grid;
  place-items: center;
  gap: 8px;
  padding: 70px 28px;
  color: #809087;
  text-align: center;
  font-size: 13px;
  line-height: 1.6;
}

.empty-inspector p {
  margin: 0;
}

.empty-icon {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border-radius: 16px;
  background: var(--forest-100);
  color: var(--forest-700);
  font-size: 28px;
}

.status-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 12px;
  overflow: hidden;
  border-top: 1px solid var(--line);
  background: #ffffff;
  color: #68786e;
  font-size: 11px;
  white-space: nowrap;
}

.status-bar span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #34a26a;
  box-shadow: 0 0 0 3px rgba(52, 162, 106, 0.12);
}

.shortcut-hint {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.engine-mark {
  margin-left: auto;
  color: #91a097;
}

@media (max-width: 920px) {
  .workspace-body {
    grid-template-columns: minmax(0, 1fr);
  }

  .inspector {
    position: absolute;
    top: 12px;
    right: 12px;
    bottom: 12px;
    width: min(286px, calc(100% - 24px));
    border: 1px solid var(--line);
    border-radius: 12px;
  }

  .inspector.disabled {
    display: none;
  }

  .shortcut-hint,
  .engine-mark {
    display: none !important;
  }
}
</style>
