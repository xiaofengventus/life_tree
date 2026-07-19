<template>
  <div
    ref="scrollRef"
    class="tree-scroll"
    :class="{ 'is-drawing-free-block': freeBlockModeColor }"
    tabindex="0"
  >
    <div
      class="tree-scene-size"
      :style="{
        width: `${layout.width * zoom}px`,
        height: `${layout.height * zoom}px`,
      }"
    >
      <div
        class="tree-zoom-layer"
        :style="{ transform: `scale(${zoom})` }"
      >
        <svg
          ref="svgRef"
          :width="layout.width"
          :height="layout.height"
          :viewBox="`0 0 ${layout.width} ${layout.height}`"
          class="tree-svg"
          @pointerdown.self="startCanvasPointer"
          role="img"
          aria-label="矩形进化树"
        >
          <g class="background-layer">
            <g
              v-for="block in layout.freeBlocks"
              :key="`free-${block.id}`"
              class="free-block"
            >
              <rect
                :x="freeBlockValue(block, 'x')"
                :y="freeBlockValue(block, 'y')"
                :width="freeBlockValue(block, 'width')"
                :height="freeBlockValue(block, 'height')"
                :fill="block.fill"
                :stroke="block.stroke"
                stroke-width="1"
                rx="3"
                @pointerdown.stop="startFreeBlockMove($event, block)"
              />
              <rect
                v-if="!readOnly"
                :x="freeBlockValue(block, 'x') + freeBlockValue(block, 'width') - 5"
                :y="freeBlockValue(block, 'y') + freeBlockValue(block, 'height') - 5"
                width="10"
                height="10"
                class="free-block-handle"
                @pointerdown.stop="startFreeBlockResize($event, block)"
              />
              <text
                v-if="block.name"
                :x="
                  freeBlockValue(block, 'x') +
                  freeBlockValue(block, 'width') +
                  8
                "
                :y="
                  freeBlockValue(block, 'y') +
                  freeBlockValue(block, 'height') / 2
                "
                :fill="block.textColor"
                class="free-block-name"
                dominant-baseline="middle"
              >
                {{ block.name }}
              </text>
            </g>
            <rect
              v-for="clade in layout.clades"
              :key="`clade-${clade.id}`"
              :x="clade.x"
              :y="clade.y"
              :width="clade.width"
              :height="clade.height"
              :fill="clade.fill"
              rx="4"
            />
          </g>

          <g class="branch-layer">
            <path
              :d="layout.rootBranch.path"
              :stroke="layout.rootBranch.color"
              class="branch-visible"
              fill="none"
            />
            <path
              v-if="selectedIds.includes(model.id)"
              :d="layout.rootBranch.path"
              class="branch-selected"
              fill="none"
            />
            <path
              v-if="!readOnly"
              :d="layout.rootBranch.path"
              class="branch-hit"
              fill="none"
              @pointerdown.stop="startDrag($event, model, 'branch')"
            />
            <g
              v-for="edge in layout.edges"
              :key="`${edge.parent.node.id}-${edge.child.node.id}`"
            >
              <path
                :d="edge.path"
                :stroke="edge.color"
                class="branch-visible"
                fill="none"
              />
              <path
                v-if="selectedIds.includes(edge.child.node.id)"
                :d="edge.path"
                class="branch-selected"
                fill="none"
              />
              <path
                v-if="!readOnly"
                :d="edge.path"
                class="branch-hit"
                fill="none"
                @pointerdown.stop="startDrag($event, edge.child.node, 'branch')"
              />
            </g>

            <line
              v-for="line in layout.alignmentLines"
              :key="`alignment-${line.id}`"
              :x1="line.x1"
              :y1="line.y"
              :x2="line.x2"
              :y2="line.y"
              stroke="#a2a9b1"
              stroke-dasharray="6 4"
              stroke-width="1.5"
            />
          </g>

          <g class="triangle-layer">
            <polygon
              v-for="triangle in layout.triangles"
              :key="`triangle-${triangle.id}`"
              :points="triangle.points"
              :fill="triangle.fill"
              :stroke="triangle.stroke"
              stroke-width="1"
            />
          </g>

          <g v-if="dragState?.moved" class="drag-overlay">
            <circle
              :cx="dragState.point.x"
              :cy="dragState.point.y"
              r="110"
              class="drag-radius"
            />
            <circle
              v-if="dragState.target"
              :cx="dragState.target.x"
              :cy="dragState.target.y"
              r="15"
              class="drop-target"
            />
          </g>

          <rect
            v-if="selectionBox?.moved"
            :x="selectionBoxRect.x"
            :y="selectionBoxRect.y"
            :width="selectionBoxRect.width"
            :height="selectionBoxRect.height"
            class="selection-box"
          />

          <rect
            v-if="freeBlockDraft?.moved"
            :x="freeBlockDraftRect.x"
            :y="freeBlockDraftRect.y"
            :width="freeBlockDraftRect.width"
            :height="freeBlockDraftRect.height"
            :fill="rgba(freeBlockDraft.color, 0.16)"
            :stroke="freeBlockDraft.color"
            class="free-block-draft"
          />

          <g v-for="item in layout.nodes" :key="item.node.id" class="tree-node">
            <circle
              v-if="!readOnly"
              :cx="item.x"
              :cy="item.y"
              :r="selectedIds.includes(item.node.id) ? 5 : 3.5"
              :class="{
                'node-handle': true,
                selected: selectedIds.includes(item.node.id),
              }"
              :stroke="item.node.colors.branch"
              @pointerdown.stop="startDrag($event, item.node, 'node')"
            />

            <image
              v-if="item.node.image"
              :href="item.node.image"
              :x="item.imageX"
              :y="item.imageY"
              width="110"
              height="70"
              preserveAspectRatio="xMidYMid meet"
              class="node-image"
            />

            <foreignObject
              v-if="item.showLabel"
              :data-node-id="item.node.id"
              :x="item.labelX"
              :y="item.labelY"
              width="500"
              :height="item.labelHeight"
              class="label-foreign-object"
            >
              <textarea
                v-if="editingId === item.node.id"
                :data-editor-id="item.node.id"
                v-model="editDraft"
                :rows="Math.max(1, editDraft.split('\n').length)"
                class="node-name-editor"
                :style="{
                  width: `${editWidth}px`,
                  height: `${Math.max(26, editDraft.split('\n').length * 22 + 4)}px`,
                  minHeight: '26px',
                  color: item.node.colors.text,
                }"
                @blur="commitNameEdit(item, $event)"
                @keydown="handleNameEditorKeydown($event, item)"
                @mouseup="captureEditorWidth"
                @pointerdown.stop
              ></textarea>

              <a
                v-else-if="item.node.url"
                :href="readOnly ? item.node.url : undefined"
                class="node-label node-label-link"
                :class="{ selected: selectedIds.includes(item.node.id) }"
                :style="{
                  width: `${labelRenderedWidth(item)}px`,
                  '--node-text-color': item.node.colors.text,
                }"
                @click="handleLabelClick($event, item)"
                @dblclick.prevent="beginNameEdit(item)"
              >
                <span class="zh-name">{{ item.node.name.zh }}</span>
                <i v-if="item.node.name.latin" class="latin-name">
                  {{ item.node.name.latin }}
                </i>
                <span
                  v-if="!readOnly && selectedIds.includes(item.node.id)"
                  class="label-resize-handle"
                  @pointerdown.stop.prevent="startLabelResize($event, item)"
                ></span>
              </a>

              <span
                v-else
                class="node-label"
                :class="{ selected: selectedIds.includes(item.node.id) }"
                :style="{
                  width: `${labelRenderedWidth(item)}px`,
                  color: item.node.colors.text,
                }"
                @click="handleLabelClick($event, item)"
                @dblclick="beginNameEdit(item)"
              >
                <span class="zh-name">{{ item.node.name.zh }}</span>
                <i v-if="item.node.name.latin" class="latin-name">
                  {{ item.node.name.latin }}
                </i>
                <span
                  v-if="!readOnly && selectedIds.includes(item.node.id)"
                  class="label-resize-handle"
                  @pointerdown.stop.prevent="startLabelResize($event, item)"
                ></span>
              </span>
            </foreignObject>
          </g>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { descendants, nodeNameText } from "@/utils/evolutionTreeModel";

const props = defineProps({
  model: { type: Object, required: true },
  selectedIds: { type: Array, default: () => [] },
  zoom: { type: Number, default: 1 },
  readOnly: { type: Boolean, default: false },
  hideInternalNames: { type: Boolean, default: false },
  alignRight: { type: Boolean, default: false },
  blankBranchLength: { type: Number, default: 86 },
});

const emit = defineEmits([
  "select",
  "move",
  "rename",
  "resize-label",
  "box-select",
  "clear-selection",
  "create-free-block",
  "update-free-block",
]);
const scrollRef = ref(null);
const svgRef = ref(null);
const dragState = ref(null);
const editingId = ref(null);
const editDraft = ref("");
const editWidth = ref(150);
const selectionBox = ref(null);
const freeBlockDraft = ref(null);
const freeBlockModeColor = ref(null);
const freeBlockModeName = ref("");
const freeBlockTransform = ref(null);
const labelResizeState = ref(null);

function rectFromPoints(start, current) {
  if (!start || !current) return { x: 0, y: 0, width: 0, height: 0 };
  return {
    x: Math.min(start.x, current.x),
    y: Math.min(start.y, current.y),
    width: Math.abs(current.x - start.x),
    height: Math.abs(current.y - start.y),
  };
}

const selectionBoxRect = computed(() =>
  rectFromPoints(selectionBox.value?.start, selectionBox.value?.current),
);

const freeBlockDraftRect = computed(() =>
  rectFromPoints(freeBlockDraft.value?.start, freeBlockDraft.value?.current),
);

function labelRenderedWidth(item) {
  return labelResizeState.value?.id === item.node.id
    ? labelResizeState.value.width
    : item.node.labelWidth;
}

function visibleChildren(node) {
  return node.collapsed ? [] : node.children || [];
}

function walkVisibleTree(node, callback, parent = null) {
  if (!node) return;
  callback(node, parent);
  visibleChildren(node).forEach((child) =>
    walkVisibleTree(child, callback, node),
  );
}

function estimatedLineWidth(line) {
  return [...String(line)].reduce(
    (width, character) =>
      width + (/^[\u0000-\u00ff]$/.test(character) ? 9 : 17),
    8,
  );
}

function textLineCount(node) {
  const availableWidth = Math.max(44, Number(node.labelWidth || 150) - 8);
  return Math.max(
    1,
    nodeNameText(node)
      .split("\n")
      .reduce(
        (count, line) =>
          count +
          Math.max(1, Math.ceil(estimatedLineWidth(line) / availableWidth)),
        0,
      ),
  );
}

function textHeight(node) {
  return Math.max(26, textLineCount(node) * 22 + 4);
}

function leafBlockHeight(node) {
  return Math.max(textHeight(node) + 10, node.image ? 78 : 36);
}

function collectLeaves(node, result = []) {
  const children = visibleChildren(node);
  if (!children.length) result.push(node);
  else children.forEach((child) => collectLeaves(child, result));
  return result;
}

function adaptiveBranchLength(child, parent) {
  if (props.hideInternalNames && child?.children?.length) {
    return props.blankBranchLength;
  }
  const internalLabelSpace = child?.children?.length
    ? Math.max(60, Number(child.labelWidth || 120) + 10)
    : 60;
  return Math.max(60, Number(child.branchLength || 0), internalLabelSpace);
}

function subtreeHorizontalSpan(node) {
  const children = node.children || [];
  if (!children.length) return Math.max(90, node.branchLength || 90);
  return Math.max(
    130,
    ...children.map(
      (child) =>
        adaptiveBranchLength(child, node) + subtreeHorizontalSpan(child),
    ),
  );
}

function rgba(color, alpha) {
  const value = String(color || "").replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(value)) {
    return `rgba(148, 163, 184, ${alpha})`;
  }
  return `rgba(${parseInt(value.slice(0, 2), 16)}, ${parseInt(
    value.slice(2, 4),
    16,
  )}, ${parseInt(value.slice(4, 6), 16)}, ${alpha})`;
}

function buildLayout(root) {
  const leaves = collectLeaves(root);
  const leafY = new Map();
  const gap = 24;
  const verticalOffset = 11;
  const contentHeight = leaves.reduce(
    (sum, leaf, index) => sum + leafBlockHeight(leaf) + (index ? gap : 0),
    0,
  );
  const height = Math.max(680, contentHeight + 160);
  let cursorY = (height - contentHeight) / 2;

  leaves.forEach((leaf) => {
    const blockHeight = leafBlockHeight(leaf);
    leafY.set(leaf.id, cursorY + blockHeight / 2 + verticalOffset);
    cursorY += blockHeight + gap;
  });

  const positions = new Map();
  const edges = [];

  function placeX(node, x, parent = null) {
    positions.set(node.id, { node, x, y: 0, parent });
    visibleChildren(node).forEach((child) => {
      placeX(child, x + adaptiveBranchLength(child, node), node);
    });
  }

  function placeY(node) {
    const children = visibleChildren(node);
    const position = positions.get(node.id);
    if (!children.length) {
      position.y = leafY.get(node.id) ?? height / 2;
      return position.y;
    }
    const childYs = children.map(placeY);
    position.y = (childYs[0] + childYs[childYs.length - 1]) / 2;
    return position.y;
  }

  const rootX = Math.max(150, Number(root.labelWidth || 100) + 42);
  placeX(root, rootX);
  placeY(root);

  walkVisibleTree(root, (node) => {
    const parent = positions.get(node.id)?.parent;
    if (!parent) return;
    const parentPosition = positions.get(parent.id);
    const childPosition = positions.get(node.id);
    edges.push({
      parent: parentPosition,
      child: childPosition,
      color: node.colors.branch,
      path: `M ${parentPosition.x} ${parentPosition.y} V ${childPosition.y} H ${childPosition.x}`,
    });
  });

  const visibleLeafPositions = leaves.map((leaf) => positions.get(leaf.id));
  const rightLabelX =
    Math.max(...visibleLeafPositions.map((position) => position.x)) + 84;
  const nodes = [];
  let maxRight = rightLabelX;

  walkVisibleTree(root, (node) => {
    const position = positions.get(node.id);
    const children = visibleChildren(node);
    const isLeaf = !children.length;
    const isInternal = Boolean(node.children?.length);
    const showLabel = isLeaf || !props.hideInternalNames;
    const triangleEnd = node.collapsed
      ? position.x + subtreeHorizontalSpan(node)
      : position.x;
    const labelAnchorX = node.collapsed ? triangleEnd : position.x;
    const parentPosition = position.parent
      ? positions.get(position.parent.id)
      : null;
    const incomingLabelX = Math.max(
      parentPosition?.x ? parentPosition.x + 5 : 22,
      position.x - Math.max(56, Number(node.labelWidth || 150)) - 4,
    );
    const labelX = isLeaf
      ? props.alignRight
        ? rightLabelX
        : labelAnchorX + 7
      : incomingLabelX;
    const labelHeight = textHeight(node);
    const labelY = isLeaf
      ? position.y - labelHeight / 2
      : position.y - labelHeight - 3;
    const labelWidth = Math.max(56, Number(node.labelWidth || 150));
    const imageX = labelX + labelWidth + 10;
    const imageY = position.y - 35;
    const right = imageX + (node.image ? 116 : 0);

    nodes.push({
      node,
      parent: position.parent,
      x: position.x,
      y: position.y,
      labelX,
      labelY,
      labelHeight,
      labelWidth,
      imageX,
      imageY,
      right,
      showLabel,
      isLeaf,
      isInternal,
    });
    maxRight = Math.max(maxRight, right, triangleEnd + 20);
  });

  const itemMap = new Map(nodes.map((item) => [item.node.id, item]));

  function boundsForIds(ids, padding = 20) {
    const members = ids.map((id) => itemMap.get(id)).filter(Boolean);
    if (!members.length) return null;
    const minX = Math.min(...members.map((item) => item.x)) - padding;
    const maxX = Math.max(...members.map((item) => item.right)) + padding;
    const minY = Math.min(...members.map((item) => item.y - 40)) - padding;
    const maxY = Math.max(...members.map((item) => item.y + 40)) + padding;
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  const clades = nodes
    .filter((item) => item.node.colors.clade)
    .map((item) => {
      const ids = [
        item.node.id,
        ...descendants(item.node).map((node) => node.id),
      ];
      const bounds = boundsForIds(ids, 12);
      return bounds
        ? {
            id: item.node.id,
            ...bounds,
            fill: rgba(item.node.colors.clade, 0.16),
          }
        : null;
    })
    .filter(Boolean);

  const freeBlocks = (root.freeBlocks || [])
    .map((block) => {
      if (
        block.type === "manual" ||
        [block.x, block.y, block.width, block.height].every(Number.isFinite)
      ) {
        return {
          id: block.id,
          x: Number(block.x),
          y: Number(block.y),
          width: Math.max(12, Number(block.width)),
          height: Math.max(12, Number(block.height)),
          name: String(block.name || ""),
          textColor: block.color || "#202122",
          fill: rgba(block.color, block.opacity ?? 0.16),
          stroke: rgba(block.color, 0.7),
        };
      }
      const bounds = boundsForIds(block.nodeIds || [], block.padding || 18);
      return bounds
        ? {
            id: block.id,
            ...bounds,
            name: String(block.name || ""),
            textColor: block.color || "#202122",
            fill: rgba(block.color, block.opacity ?? 0.16),
            stroke: rgba(block.color, 0.55),
          }
        : null;
    })
    .filter(Boolean);

  freeBlocks.forEach((block) => {
    maxRight = Math.max(
      maxRight,
      block.x +
        block.width +
        (block.name ? estimatedLineWidth(block.name) + 20 : 0),
    );
  });

  const triangles = nodes
    .filter((item) => item.node.collapsed && item.node.children?.length)
    .map((item) => {
      const endX = item.x + subtreeHorizontalSpan(item.node);
      const halfHeight = Math.max(28, leafBlockHeight(item.node) / 2);
      return {
        id: item.node.id,
        points: `${item.x},${item.y} ${endX},${item.y - halfHeight} ${endX},${
          item.y + halfHeight
        }`,
        fill: rgba(item.node.colors.triangle, 0.22),
        stroke: item.node.colors.triangle,
      };
    });

  return {
    nodes,
    edges,
    clades,
    freeBlocks,
    triangles,
    leafIds: leaves.map((leaf) => leaf.id),
    itemMap,
    rootBranch: {
      path: `M 20 ${positions.get(root.id).y} H ${positions.get(root.id).x}`,
      color: root.colors.branch,
    },
    alignmentLines: props.alignRight
      ? nodes
          .filter((item) => item.isLeaf)
          .map((item) => ({
            id: item.node.id,
            x1: item.x + 4,
            x2: item.labelX - 7,
            y: item.y,
          }))
      : [],
    width: Math.max(1200, maxRight + 180),
    height,
  };
}

const layout = computed(() => buildLayout(props.model));

function emitSelection(event, item) {
  emit("select", {
    id: item.node.id,
    shift: event.shiftKey,
    toggle: event.ctrlKey || event.metaKey,
    leafOrder: layout.value.leafIds,
  });
}

function handleLabelClick(event, item) {
  if (!props.readOnly) {
    event.preventDefault();
    emitSelection(event, item);
  }
}

function beginNameEdit(item) {
  if (props.readOnly) return;
  if (!props.selectedIds.includes(item.node.id)) {
    emit("select", {
      id: item.node.id,
      shift: false,
      toggle: false,
      leafOrder: layout.value.leafIds,
    });
  }
  editingId.value = item.node.id;
  editDraft.value = nodeNameText(item.node);
  editWidth.value = Math.max(80, item.node.labelWidth || 150);
  nextTick(() => {
    const editor = document.querySelector(`[data-editor-id="${item.node.id}"]`);
    editor?.focus();
    editor?.select();
  });
}

function captureEditorWidth(event) {
  editWidth.value = Math.max(
    80,
    Math.round(event.currentTarget.getBoundingClientRect().width / props.zoom),
  );
}

function commitNameEdit(item, event) {
  captureEditorWidth(event);
  emit("rename", {
    id: item.node.id,
    text: editDraft.value,
    width: editWidth.value,
  });
  editingId.value = null;
}

function handleNameEditorKeydown(event, item) {
  event.stopPropagation();
  if (event.key === "Escape") {
    event.preventDefault();
    editingId.value = null;
  } else if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    event.currentTarget.blur();
  }
}

function scenePoint(event) {
  const rect = svgRef.value.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) / props.zoom,
    y: (event.clientY - rect.top) / props.zoom,
  };
}

function freeBlockValue(block, key) {
  if (freeBlockTransform.value?.id === block.id) {
    return freeBlockTransform.value[key];
  }
  return block[key];
}

function finishCanvasPointer() {
  const state = freeBlockDraft.value || selectionBox.value;
  window.removeEventListener("pointermove", handleCanvasPointerMove);
  window.removeEventListener("pointerup", finishCanvasPointer);
  if (!state) return;

  if (freeBlockDraft.value) {
    const rect = rectFromPoints(state.start, state.current);
    freeBlockDraft.value = null;
    freeBlockModeColor.value = null;
    freeBlockModeName.value = "";
    if (rect.width >= 8 && rect.height >= 8) {
      emit("create-free-block", {
        type: "manual",
        ...rect,
        color: state.color,
        name: state.name,
        opacity: 0.16,
      });
    }
    return;
  }

  const rect = rectFromPoints(state.start, state.current);
  selectionBox.value = null;
  if (!state.moved) {
    editingId.value = null;
    emit("clear-selection");
    return;
  }

  const intersects = (a, b) =>
    a.x <= b.x + b.width &&
    a.x + a.width >= b.x &&
    a.y <= b.y + b.height &&
    a.y + a.height >= b.y;
  const ids = layout.value.nodes
    .filter((item) => {
      const nodeRect = { x: item.x - 6, y: item.y - 6, width: 12, height: 12 };
      const labelRect = {
        x: item.labelX,
        y: item.labelY,
        width: labelRenderedWidth(item),
        height: item.labelHeight,
      };
      const imageRect = item.node.image
        ? { x: item.imageX, y: item.imageY, width: 110, height: 70 }
        : null;
      return (
        intersects(rect, nodeRect) ||
        intersects(rect, labelRect) ||
        (imageRect && intersects(rect, imageRect))
      );
    })
    .map((item) => item.node.id);
  editingId.value = null;
  emit("box-select", ids);
}

function handleCanvasPointerMove(event) {
  const state = freeBlockDraft.value || selectionBox.value;
  if (!state) return;
  const point = scenePoint(event);
  state.current = point;
  state.moved =
    state.moved ||
    Math.hypot(point.x - state.start.x, point.y - state.start.y) > 4;
}

function startCanvasPointer(event) {
  if (props.readOnly || event.button !== 0) return;
  const point = scenePoint(event);
  if (freeBlockModeColor.value) {
    freeBlockDraft.value = {
      start: point,
      current: point,
      moved: false,
      color: freeBlockModeColor.value,
      name: freeBlockModeName.value,
    };
  } else {
    selectionBox.value = { start: point, current: point, moved: false };
  }
  window.addEventListener("pointermove", handleCanvasPointerMove);
  window.addEventListener("pointerup", finishCanvasPointer, { once: true });
}

function startFreeBlock(options) {
  if (props.readOnly) return;
  editingId.value = null;
  emit("clear-selection");
  freeBlockModeColor.value =
    typeof options === "object" ? options.color || "#36c" : options || "#36c";
  freeBlockModeName.value =
    typeof options === "object" ? String(options.name || "") : "";
}

function finishFreeBlockTransform() {
  const result = freeBlockTransform.value;
  freeBlockTransform.value = null;
  window.removeEventListener("pointermove", handleFreeBlockTransform);
  window.removeEventListener("pointerup", finishFreeBlockTransform);
  if (result) {
    emit("update-free-block", {
      id: result.id,
      x: result.x,
      y: result.y,
      width: result.width,
      height: result.height,
    });
  }
}

function handleFreeBlockTransform(event) {
  const state = freeBlockTransform.value;
  if (!state) return;
  const point = scenePoint(event);
  if (state.mode === "move") {
    state.x = state.originX + point.x - state.start.x;
    state.y = state.originY + point.y - state.start.y;
  } else {
    state.width = Math.max(12, state.originWidth + point.x - state.start.x);
    state.height = Math.max(12, state.originHeight + point.y - state.start.y);
  }
}

function beginFreeBlockTransform(event, block, mode) {
  if (props.readOnly || event.button !== 0) return;
  event.preventDefault();
  const point = scenePoint(event);
  freeBlockTransform.value = {
    id: block.id,
    mode,
    start: point,
    originX: block.x,
    originY: block.y,
    originWidth: block.width,
    originHeight: block.height,
    x: block.x,
    y: block.y,
    width: block.width,
    height: block.height,
  };
  window.addEventListener("pointermove", handleFreeBlockTransform);
  window.addEventListener("pointerup", finishFreeBlockTransform, {
    once: true,
  });
}

function startFreeBlockMove(event, block) {
  beginFreeBlockTransform(event, block, "move");
}

function startFreeBlockResize(event, block) {
  beginFreeBlockTransform(event, block, "resize");
}

function handleLabelResize(event) {
  const state = labelResizeState.value;
  if (!state) return;
  state.width = Math.max(
    56,
    Math.min(
      460,
      state.originWidth + (event.clientX - state.startClientX) / props.zoom,
    ),
  );
}

function finishLabelResize() {
  const result = labelResizeState.value;
  labelResizeState.value = null;
  window.removeEventListener("pointermove", handleLabelResize);
  window.removeEventListener("pointerup", finishLabelResize);
  if (result)
    emit("resize-label", { id: result.id, width: Math.round(result.width) });
}

function startLabelResize(event, item) {
  if (props.readOnly || event.button !== 0) return;
  event.preventDefault();
  labelResizeState.value = {
    id: item.node.id,
    startClientX: event.clientX,
    originWidth: labelRenderedWidth(item),
    width: labelRenderedWidth(item),
  };
}

function sourceIdsFor(nodeId) {
  return props.selectedIds.includes(nodeId) ? props.selectedIds : [nodeId];
}

function isInvalidTarget(targetNode, sourceIds) {
  return sourceIds.some((id) => {
    const sourceItem = layout.value.itemMap.get(id);
    return (
      id === targetNode.id ||
      (sourceItem && descendants(sourceItem.node).some((node) => node.id === targetNode.id))
    );
  });
}

function nearestTarget(point, sourceIds) {
  let nearest = null;
  let distance = 110;
  const distanceToRect = (rect) => {
    const dx = Math.max(rect.x - point.x, 0, point.x - (rect.x + rect.width));
    const dy = Math.max(rect.y - point.y, 0, point.y - (rect.y + rect.height));
    return Math.hypot(dx, dy);
  };
  for (const item of layout.value.nodes) {
    if (isInvalidTarget(item.node, sourceIds)) continue;
    const current = Math.min(
      Math.hypot(item.x - point.x, item.y - point.y),
      distanceToRect({
        x: item.labelX,
        y: item.labelY,
        width: item.labelWidth,
        height: item.labelHeight,
      }),
    );
    if (current < distance) {
      nearest = item;
      distance = current;
    }
  }
  return nearest;
}

function startDrag(event, node, sourceType) {
  if (props.readOnly || editingId.value) return;
  event.preventDefault();
  const point = scenePoint(event);
  dragState.value = {
    node,
    sourceType,
    start: point,
    point,
    moved: false,
    target: null,
    shift: event.shiftKey,
    toggle: event.ctrlKey || event.metaKey,
  };
  window.addEventListener("pointermove", handleDragMove);
  window.addEventListener("pointerup", finishDrag, { once: true });
}

function handleDragMove(event) {
  if (!dragState.value) return;
  const point = scenePoint(event);
  dragState.value.point = point;
  dragState.value.moved =
    dragState.value.moved ||
    Math.hypot(
      point.x - dragState.value.start.x,
      point.y - dragState.value.start.y,
    ) > 5;
  if (dragState.value.moved) {
    dragState.value.target = nearestTarget(
      point,
      sourceIdsFor(dragState.value.node.id),
    );
  }
}

function finishDrag(event) {
  const state = dragState.value;
  dragState.value = null;
  window.removeEventListener("pointermove", handleDragMove);
  if (!state) return;

  if (!state.moved) {
    const item = layout.value.itemMap.get(state.node.id);
    if (item) {
      emit("select", {
        id: state.node.id,
        shift: state.shift,
        toggle: state.toggle,
        leafOrder: layout.value.leafIds,
      });
    }
    return;
  }

  if (!state.target) return;
  const sourceItem = layout.value.itemMap.get(state.node.id);
  const sameParent =
    sourceItem?.parent?.id && sourceItem.parent.id === state.target.parent?.id;
  const reorder = sameParent && state.point.x < state.target.x - 28;

  emit("move", {
    nodeId: state.node.id,
    targetId: state.target.node.id,
    mode: reorder ? "reorder" : "reparent",
    before: state.point.y < state.target.y,
  });
}

function createExportSvg() {
  const svg = svgRef.value.cloneNode(true);
  svg
    .querySelectorAll(
      ".branch-hit, .branch-selected, .node-handle, .label-resize-handle, .selection-box, .drag-overlay, .free-block-handle, .free-block-draft",
    )
    .forEach((element) => element.remove());

  const namespace = "http://www.w3.org/2000/svg";
  svg.setAttribute("xmlns", namespace);
  svg.setAttribute("width", String(layout.value.width));
  svg.setAttribute("height", String(layout.value.height));
  svg.setAttribute(
    "viewBox",
    `0 0 ${layout.value.width} ${layout.value.height}`,
  );

  const style = document.createElementNS(namespace, "style");
  style.textContent = `
    .branch-visible { stroke-width: 1; fill: none; }
    .free-block-name { font-family: "Microsoft YaHei", sans-serif; font-size: 15px; }
  `;
  svg.prepend(style);

  svg
    .querySelectorAll("foreignObject[data-node-id]")
    .forEach((foreignObject) => {
      const item = layout.value.itemMap.get(foreignObject.dataset.nodeId);
      if (!item) {
        foreignObject.remove();
        return;
      }

      const text = document.createElementNS(namespace, "text");
      text.setAttribute("x", String(item.labelX + 3));
      text.setAttribute("y", String(item.labelY + 18));
      text.setAttribute("fill", item.node.colors.text || "#202122");
      text.setAttribute("font-size", "17");
      text.setAttribute(
        "font-family",
        '"Noto Sans CJK SC", "Microsoft YaHei", sans-serif',
      );

      const chinese = document.createElementNS(namespace, "tspan");
      chinese.textContent = item.node.name.zh;
      text.appendChild(chinese);

      const latinLines = String(item.node.name.latin || "").split("\n");
      if (latinLines[0]) {
        const latin = document.createElementNS(namespace, "tspan");
        latin.setAttribute("dx", "5");
        latin.setAttribute("font-style", "italic");
        latin.textContent = latinLines[0];
        text.appendChild(latin);
      }
      latinLines.slice(1).forEach((line) => {
        const latin = document.createElementNS(namespace, "tspan");
        latin.setAttribute("x", String(item.labelX + 3));
        latin.setAttribute("dy", "21");
        latin.setAttribute("font-style", "italic");
        latin.textContent = line || " ";
        text.appendChild(latin);
      });

      foreignObject.replaceWith(text);
    });
  return svg;
}

function serializeExportSvg() {
  return new XMLSerializer().serializeToString(createExportSvg());
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function renderExportCanvas() {
  const sourceWidth = layout.value.width;
  const sourceHeight = layout.value.height;
  const renderScale = Math.max(
    0.5,
    Math.min(2, 8192 / Math.max(sourceWidth, sourceHeight)),
  );
  const source = serializeExportSvg();
  const sourceUrl = URL.createObjectURL(
    new Blob([source], { type: "image/svg+xml;charset=utf-8" }),
  );
  try {
    const image = new Image();
    image.src = sourceUrl;
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error("SVG rasterization failed"));
    });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(sourceWidth * renderScale);
    canvas.height = Math.ceil(sourceHeight * renderScale);
    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

async function exportPdf() {
  if (!svgRef.value) return false;
  try {
    const { jsPDF } = await import("jspdf");
    const sourceWidth = layout.value.width;
    const sourceHeight = layout.value.height;
    const maxSide = 2000;
    const scale = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight));
    const pageWidth = Math.max(200, sourceWidth * scale);
    const pageHeight = Math.max(200, sourceHeight * scale);
    const pdf = new jsPDF({
      orientation: pageWidth >= pageHeight ? "landscape" : "portrait",
      unit: "px",
      format: [pageWidth, pageHeight],
      hotfixes: ["px_scaling"],
      compress: true,
    });
    const canvas = await renderExportCanvas();
    pdf.addImage(
      canvas.toDataURL("image/png"),
      "PNG",
      0,
      0,
      pageWidth,
      pageHeight,
      undefined,
      "FAST",
    );
    pdf.save("evolution-tree.pdf");
    return true;
  } catch (error) {
    console.error("PDF export failed", error);
    window.alert("PDF 导出失败，请稍后重试。");
    return false;
  }
}

async function exportPng() {
  if (!svgRef.value) return false;
  try {
    const canvas = await renderExportCanvas();
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!blob) throw new Error("PNG encoding failed");
    downloadBlob(blob, "evolution-tree.png");
    return true;
  } catch (error) {
    console.error("PNG export failed", error);
    window.alert("PNG 导出失败，请检查图片地址后重试。");
    return false;
  }
}

function exportSvg() {
  if (!svgRef.value) return false;
  const source = serializeExportSvg();
  downloadBlob(
    new Blob([source], { type: "image/svg+xml;charset=utf-8" }),
    "evolution-tree.svg",
  );
  return true;
}

function centerRoot() {
  nextTick(() => {
    if (!scrollRef.value) return;
    scrollRef.value.scrollLeft = 0;
    scrollRef.value.scrollTop = Math.max(
      0,
      (layout.value.height * props.zoom - scrollRef.value.clientHeight) / 2,
    );
  });
}

watch(() => props.model?.id, centerRoot, { immediate: true });
onMounted(centerRoot);

defineExpose({ exportPdf, exportPng, exportSvg, centerRoot, startFreeBlock });
</script>

<style scoped>
.tree-scroll {
  width: 100%;
  height: 100%;
  min-height: 560px;
  overflow: auto;
  background: #ffffff;
  outline: none;
  overscroll-behavior: contain;
}

.tree-scroll.is-drawing-free-block .tree-svg {
  cursor: crosshair;
}

.tree-scene-size,
.tree-zoom-layer {
  position: relative;
  transform-origin: top left;
}

.tree-svg {
  display: block;
  overflow: visible;
  background: #ffffff;
}

.branch-visible {
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.branch-selected {
  stroke: #2563eb;
  stroke-width: 3;
  vector-effect: non-scaling-stroke;
}

.branch-hit {
  stroke: transparent;
  stroke-width: 16;
  cursor: grab;
  vector-effect: non-scaling-stroke;
}

.branch-hit:active,
.node-handle:active {
  cursor: grabbing;
}

.node-handle {
  fill: #ffffff;
  stroke-width: 1.2;
  cursor: grab;
  vector-effect: non-scaling-stroke;
}

.node-handle.selected {
  fill: #2563eb;
  stroke: #2563eb;
}

.label-foreign-object {
  overflow: visible;
  pointer-events: none;
}

.node-label,
.node-name-editor {
  position: relative;
  display: inline-block;
  box-sizing: border-box;
  min-width: 56px;
  margin: 0;
  padding: 1px 3px;
  border: 1px solid transparent;
  border-radius: 2px;
  background: transparent;
  font-family: "Noto Sans CJK SC", "Microsoft YaHei", sans-serif;
  font-size: 17px;
  line-height: 1.25;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  user-select: text;
  pointer-events: auto;
}

.label-resize-handle {
  position: absolute;
  top: 3px;
  right: -5px;
  bottom: 3px;
  width: 9px;
  border-left: 2px solid #36c;
  cursor: ew-resize;
  user-select: none;
}

.node-label.selected {
  border-color: #36c;
}

.node-label-link {
  color: var(--node-text-color);
  text-decoration: none;
}

.node-label-link .zh-name {
  color: #36c;
}

.latin-name {
  margin-left: 5px;
  color: var(--node-text-color, inherit);
  font-style: italic;
}

.node-name-editor {
  resize: horizontal;
  overflow: hidden;
  border-color: #36c;
  background: #ffffff;
  outline: none;
}

.node-image {
  pointer-events: none;
}

.drag-radius {
  fill: rgba(54, 102, 204, 0.06);
  stroke: rgba(54, 102, 204, 0.55);
  stroke-dasharray: 5 5;
  stroke-width: 1.5;
  pointer-events: none;
}

.drop-target {
  fill: rgba(34, 197, 94, 0.16);
  stroke: #16a34a;
  stroke-width: 2;
  pointer-events: none;
}

.selection-box {
  fill: rgba(54, 102, 204, 0.1);
  stroke: #36c;
  stroke-width: 1;
  stroke-dasharray: 4 3;
  pointer-events: none;
}

.free-block rect:first-child {
  cursor: move;
}

.free-block-handle {
  fill: #ffffff;
  stroke: #36c;
  stroke-width: 1.5;
  cursor: nwse-resize;
}

.free-block-draft {
  stroke-width: 1.5;
  stroke-dasharray: 6 4;
  pointer-events: none;
}
.free-block-name {
  font-family: "Noto Sans CJK SC", "Microsoft YaHei", sans-serif;
  font-size: 15px;
  pointer-events: none;
  user-select: none;
}
</style>
