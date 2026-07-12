<script setup>
import "./首页.css";
import "./user.css";
import { useEvolutionTree } from "./首页.composable.js";
import { useUserStore } from "../stores/user";
import { useRouter } from "vue-router";

const userStore = useUserStore();
const router = useRouter();

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

function goToUserSpace() {
  showUserCard.value = false;
  router.push("/user-space");
}

function goToLogin() {
  showUserCard.value = false;
  router.push("/login");
}

function formatDate(dateString) {
  if (!dateString) return "未知";
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-CN");
}
</script>

<template>
  <meta name="desciption" content="一个生物可视化分类网站" />
  <meta name="keywords" content="生物，古生物，分类，可视化，进化树" />

  <nav>
    生命时序 life_tree
    <div id="function">
      <div class="form-row">
        <button class="btn-secondary" @click="router.push('/communication')">
          社区Communication
        </button>
      </div>
      <div class="form-row">
        <button class="btn-secondary">研究Research</button>
      </div>
    </div>
  </nav>

  <div class="toolbar">
    <div class="toolbar-scroll">
      <div class="toolbar-item toolbar-hint">
        拖动根节点移动整棵树；Ctrl/Command + 滚轮缩放
      </div>
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
      <div class="toolbar-item">
        <input
          type="checkbox"
          id="cb-hide-internal"
          v-model="hideInternalNames"
          @change="onHideInternalChange"
        />
        <label for="cb-hide-internal">隐藏中间非叶节点名称</label>
      </div>
      <div class="toolbar-item">
        <input
          type="checkbox"
          id="cb-auto-length"
          v-model="autoBranchLength"
          @change="onAutoLengthChange"
        />
        <label for="cb-auto-length">分支长度自适应名字长度</label>
      </div>
      <div class="toolbar-divider"></div>
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

      <div class="toolbar-divider"></div>
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
      <div class="toolbar-item">
        <button class="toolbar-btn btn-danger" @click="handleReset">
          从 0 开始
        </button>
      </div>
      <div class="toolbar-divider"></div>
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

  <div class="user-float">
    <img
      src="@/assets/pic/200-year-old-fox.png"
      alt="用户头像"
      class="user-avatar"
      @click="handleAvatarClick"
    />
    <div
      class="user-card"
      :style="{ display: showUserCard ? 'block' : 'none' }"
    >
      <div class="card-header">
        <strong>{{ userStore.user?.name || "未注册用户" }}</strong>
        <span class="badge">Lv.{{ userStore.user?.level || 0 }}</span>
      </div>
      <p><strong>UID:</strong> {{ userStore.user?.uid || "-" }}</p>
      <p><strong>类型:</strong> {{ userStore.currentType }}</p>
      <p v-if="userStore.user?.introduce">
        <strong>简介:</strong> {{ userStore.user.introduce }}
      </p>
      <p>
        <strong>注册时间:</strong>
        {{ formatDate(userStore.user?.signup_data) }}
      </p>
      <div class="card-actions">
        <button class="btn-home" @click="goToUserSpace">进入主页</button>
        <button class="btn-signup" @click="goToLogin">登录</button>
      </div>
    </div>
  </div>

  <div class="app-container">
    <div id="canvas-container" ref="containerRef">
      <canvas id="tree-canvas" ref="canvasRef"></canvas>
      <div class="tree-label-layer" ref="labelLayerRef"></div>
      <div id="tooltip" ref="tooltipRef"></div>
    </div>

    <input
      type="file"
      ref="fileInputRef"
      class="hidden"
      accept=".json"
      @change="handleFileChange"
    />
    <input
      type="color"
      ref="colorPickerRef"
      class="hidden"
      @change="handleColorPickerChange"
    />
  </div>
</template>
