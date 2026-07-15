<template>
  <!-- 工具栏容器 -->
  <div class="toolbar">
    <div class="toolbar-scroll">
      <!-- 布局选择 -->
      <div class="toolbar-item">
        <span class="toolbar-label">布局</span>
        <select
          v-model="layoutMode"
          @change="onLayoutChange"
          class="toolbar-select"
        >
          <option value="rectangular">矩形树</option>
          <option value="circular">环形树</option>
          <option value="radial">放射树</option>
        </select>
      </div>
      <!-- 物种名称对齐到最右侧 -->
      <div class="toolbar-item">
        <input
          type="checkbox"
          id="cb-align"
          v-model="alignRight"
          @change="onAlignChange"
          :disabled="layoutMode !== 'rectangular'"
        />
        <label for="cb-align">物种名称对齐到最右侧</label>
      </div>
      <!-- 隐藏中间非叶节点名称 -->
      <div class="toolbar-item">
        <input
          type="checkbox"
          id="cb-hide-internal"
          v-model="hideInternalNames"
          @change="onHideInternalChange"
        />
        <label for="cb-hide-internal">隐藏中间非叶节点名称</label>
      </div>
      <!-- 分支长度自适应名字长度 -->
      <div class="toolbar-item">
        <input
          type="checkbox"
          id="cb-auto-length"
          v-model="autoBranchLength"
          @change="onAutoLengthChange"
        />
        <label for="cb-auto-length">分支长度自适应名字长度</label>
      </div>
      <!-- 分隔线 -->
      <div class="toolbar-divider"></div>
      <!-- 节点间隔滑块 -->
      <div class="toolbar-item">
        <span class="toolbar-label">节点间隔</span>
        <input
          type="range"
          id="slider-spacing"
          min="22"
          max="96"
          v-model="nodeSpacing"
          @input="onSpacingChange"
          class="toolbar-slider"
        />
      </div>
      <!-- 分隔线 -->
      <div class="toolbar-divider"></div>
      <!-- 文件操作按钮 -->
      <div class="toolbar-item">
        <button class="toolbar-btn btn-primary" @click="handleSave">
          保存
        </button>
        <button class="toolbar-btn btn-secondary" @click="handleOpen">
          打开
        </button>
        <button class="toolbar-btn btn-secondary" @click="handleExport">
          导出 PDF
        </button>
      </div>
      <!-- 重置按钮 -->
      <div class="toolbar-item">
        <button class="toolbar-btn btn-danger" @click="handleReset">
          从 0 开始
        </button>
      </div>
      <!-- 分隔线 -->
      <div class="toolbar-divider"></div>
      <!-- 节点名输入框 -->
      <div class="toolbar-item">
        <span class="toolbar-label">节点名</span>
        <input
          type="text"
          id="edit-name"
          v-model="editName"
          class="toolbar-input"
          @change="onEditNameChange"
        />
      </div>
      <!-- 节点操作按钮 -->
      <div class="toolbar-item">
        <button class="toolbar-btn btn-primary" @click="handleAdd">
          添加新物种
        </button>
        <button class="toolbar-btn btn-secondary" @click="handleAddBlank">
          添加空白节点
        </button>
        <button class="toolbar-btn btn-danger" @click="handleDelete">
          删除选中节点
        </button>
      </div>
      <!-- 颜色操作按钮 -->
      <div class="toolbar-item">
        <button class="toolbar-btn btn-secondary" @click="handleColor">
          改变分支线颜色
        </button>
        <button class="toolbar-btn btn-secondary" @click="handleTextColor">
          改变文本颜色
        </button>
        <button class="toolbar-btn btn-secondary" @click="handleSubtreeColor">
          统一子节点颜色
        </button>
        <button class="toolbar-btn btn-secondary" @click="handleCladeColor">
          添加单系群背景色
        </button>
        <button class="toolbar-btn btn-secondary" @click="handleClearClade">
          清除单系群背景色
        </button>
      </div>
      <!-- 树枝长度滑块 -->
      <div class="toolbar-item">
        <span class="toolbar-label">树枝长度</span>
        <input
          type="range"
          id="slider-length"
          min="20"
          max="500"
          v-model="branchLength"
          @input="onBranchLengthChange"
          class="toolbar-slider"
        />
      </div>
      <!-- 折叠后代分支 -->
      <div class="toolbar-item">
        <input
          type="checkbox"
          id="cb-hide-children"
          v-model="hideChildren"
          @change="onHideChildrenChange"
        />
        <label for="cb-hide-children">折叠后代分支为科学三角形</label>
      </div>
    </div>
  </div>
</template>

<script setup>
// 导入建树工具composable
import { useEvolutionTree } from "@/components/首页.composable";

// 从composable中解构出所有需要的变量和方法
const {
  canvasRef,
  containerRef,
  labelLayerRef,
  tooltipRef,
  fileInputRef,
  colorPickerRef,
  selectedInfo,
  editName,
  showUserCard,
  layoutMode,
  alignRight,
  hideInternalNames,
  nodeSpacing,
  autoBranchLength,
  labelWrapLines,
  labelPositionMode,
  branchLength,
  hideChildren,
  handleAvatarClick,
  onLayoutChange,
  onAlignChange,
  onHideInternalChange,
  onSpacingChange,
  onAutoLengthChange,
  onWrapLinesChange,
  onLabelPositionChange,
  onEditNameChange,
  onBranchLengthChange,
  onHideChildrenChange,
  handleSave,
  handleOpen,
  handleExport,
  handleFileChange,
  handleReset,
  handleAdd,
  handleAddBlank,
  handleDelete,
  handleColor,
  handleTextColor,
  handleSubtreeColor,
  handleCladeColor,
  handleClearClade,
  handleColorPickerChange,
} = useEvolutionTree();
</script>

<style scoped>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 工具栏容器 */
.toolbar {
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  height: 48px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  padding: 0 16px;
  z-index: 90;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

/* 工具栏滚动区域 */
.toolbar-scroll {
  display: flex;
  align-items: center;
  gap: 16px;
  overflow-x: auto;
  flex: 1;
  white-space: nowrap;
}

/* 滚动条样式 */
.toolbar-scroll::-webkit-scrollbar {
  height: 4px;
}

.toolbar-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.toolbar-scroll::-webkit-scrollbar-thumb {
  background: #cbd5dc;
  border-radius: 2px;
}

/* 工具栏项 */
.toolbar-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 工具栏提示 */
.toolbar-hint {
  padding: 5px 10px;
  border-radius: 999px;
  background: #eef6ff;
  color: #2563eb;
  font-size: 12px;
  font-weight: 600;
}

/* 工具栏标签 */
.toolbar-label {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}

/* 工具栏下拉选择框 */
.toolbar-select {
  padding: 4px 8px;
  border: 1px solid #cbd5dc;
  border-radius: 4px;
  font-size: 13px;
  background: white;
  cursor: pointer;
}

/* 工具栏输入框 */
.toolbar-input {
  padding: 4px 8px;
  border: 1px solid #cbd5dc;
  border-radius: 4px;
  font-size: 13px;
  width: 200px !important;
  flex-shrink: 0;
}

/* 工具栏滑块 */
.toolbar-slider {
  width: 160px !important;
  height: 6px;
  background: #e1e8ed;
  border-radius: 3px;
  outline: none;
  -webkit-appearance: none;
  flex-shrink: 0;
}

/* 滑块拇指样式（Chrome/Safari） */
.toolbar-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  background: #4a90e2;
  border-radius: 50%;
  cursor: pointer;
}

/* 滑块拇指样式（Firefox） */
.toolbar-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: #4a90e2;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

/* 工具栏按钮 */
.toolbar-btn {
  padding: 5px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;
}

/* 分隔线 */
.toolbar-divider {
  width: 1px;
  height: 24px;
  background: #e2e8f0;
}

/* 应用容器 */
.app-container {
  display: flex;
  height: calc(100vh - 108px);
  overflow: hidden;
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
  margin-top: 108px;
  position: relative;
  z-index: 1;
}

/* 主页按钮悬停效果 */
.btn-home:hover {
  background: #4338ca;
}

/* 画布容器 */
#canvas-container {
  flex: 1;
  position: relative;
  background-color: white;
  overflow: hidden;
  min-width: 0;
}

/* 画布样式 */
canvas {
  display: block;
  cursor: crosshair;
  width: 100%;
  height: 100%;
}

/* 标签层容器 */
.tree-label-layer {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 5;
}

/* 树标签 */
.tree-label {
  position: absolute;
  display: inline-flex;
  flex-direction: column;
  max-width: 280px;
  color: #111827 !important;
  font-size: 10px;
  line-height: 1.25;
  white-space: nowrap;
  user-select: text;
  cursor: text;
  pointer-events: auto;
  transform-origin: left top;
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  margin: 0 !important;
  outline: none !important;
  box-shadow: none !important;
}

/* 标签行间距 */
.tree-label-line:not(:last-child) {
  margin-bottom: 4px;
}

/* 标签悬停和选中状态 */
.tree-label:hover,
.tree-label.is-selected {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
}

/* 标签编辑状态 */
.tree-label.is-editing {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
  white-space: pre-wrap !important;
}

/* 拉丁学名斜体 */
.tree-label-line.is-latin {
  font-style: italic;
}

/* 只读模式链接样式 */
.tree-label.is-read-link {
  cursor: pointer;
  text-decoration: underline;
  text-decoration-color: rgba(74, 144, 226, 0.45);
  text-underline-offset: 3px;
}

/* 表单控件基础样式 */
select,
input[type="text"],
textarea {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #cbd5dc;
  border-radius: 4px;
  font-size: 13px;
  font-family: inherit;
  background-color: #ffffff;
  outline: none;
  transition: border-color 0.2s;
}

/* 表单控件焦点样式 */
select:focus,
input[type="text"]:focus,
textarea:focus {
  border-color: #4a90e2;
}

/* 文本域样式 */
textarea {
  resize: vertical;
  min-height: 100px;
}

/* 范围输入框样式 */
input[type="range"] {
  width: 100%;
  height: 6px;
  background: #e1e8ed;
  border-radius: 3px;
  outline: none;
  -webkit-appearance: none;
}

/* 范围输入框拇指样式（Chrome/Safari） */
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: #4a90e2;
  border-radius: 50%;
  cursor: pointer;
}

/* 范围输入框拇指样式（Firefox） */
input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #4a90e2;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

/* 按钮基础样式 */
button {
  width: 100%;
  padding: 7px 12px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: background-color 0.2s;
  font-weight: 500;
}

/* 按钮悬停效果 */
button:hover {
  opacity: 0.9;
}

/* 按钮按下效果 */
button:active {
  transform: translateY(1px);
}

/* 主按钮样式 */
.btn-primary {
  background-color: #4a90e2;
  color: white;
}

/* 次按钮样式 */
.btn-secondary {
  background-color: #e1e8ed;
  color: #37474f;
}

/* 危险按钮样式 */
.btn-danger {
  background-color: #e57373;
  color: white;
}

/* 按钮组 */
.btn-group {
  display: flex;
  gap: 6px;
}

.btn-group button {
  flex: 1;
}

/* 复选框行 */
.checkbox-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #455a64;
  cursor: pointer;
}

/* 复选框样式 */
input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

/* 选中信息 */
#selected-info {
  font-weight: bold;
  color: #566573;
  word-break: break-all;
  min-height: 24px;
}

/* 提示文字 */
.hint-text {
  font-size: 12px;
  color: #6c7a89;
  margin-top: 8px;
  line-height: 1.5;
}

/* 颜色预览 */
.color-preview {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid #cbd5dc;
  display: inline-block;
  vertical-align: middle;
  margin-left: 6px;
}

/* 隐藏类 */
.hidden {
  display: none !important;
}

/* 提示框 */
#tooltip {
  position: absolute;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
  z-index: 1000;
}

/* 模态框遮罩 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

/* 模态框 */
.modal {
  background: white;
  border-radius: 8px;
  padding: 20px;
  min-width: 300px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

/* 模态框标题 */
.modal-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #263238;
}

/* 模态框内容 */
.modal-content {
  margin-bottom: 16px;
}

/* 模态框操作按钮 */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
