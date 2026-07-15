<script setup>
import "../utils/Communication.css";
import { useRouter } from "vue-router";
import { useCommunicationTree } from "../utils/Communication.js";

const router = useRouter();

const {
  canvasRef,
  containerRef,
  labelLayerRef,
  tooltipRef,
  selectedInfo,
  loading,
  errorMessage,
  loadTree,
} = useCommunicationTree();
</script>

<template>
  <main class="communication-page">
    <!-- <nav class="communication-nav">
      <div> -->
    <!-- <strong>Communication 共创树</strong>
        <span>Read mode · 人人共创生命时序</span>
      </div>
      <div class="communication-actions">
        <button type="button" @click="router.push('/')">返回 DIY 首页</button>
        <button type="button" @click="loadTree">重新读取树文件</button>
      </div>
    <!-- </nav> -->

    <!-- <section class="communication-shell"> -->
    <!-- <aside class="communication-panel">
        <p class="panel-kicker">Community Tree</p>
        <h1>点击标签，跳转到介绍网页。</h1>
        <p>
          这个页面读取独立树文件
          <code>public/trees/communication-tree.json</code>。当前是只读模式：
          不能拖拽、不能双击修改，但可以平移/缩放和打开百科链接。
        </p>
        <div class="status-card" :class="{ error: errorMessage }">
          <strong>{{ loading ? "正在读取共创树..." : "状态" }}</strong>
          <span>{{ errorMessage || selectedInfo }}</span>
        </div>
        <ul class="read-rules">
          <li>鼠标悬停在带链接标签上会变成跳转指针。</li>
          <li>点击文字标签会在新标签页打开介绍页面。</li>
          <li>DIY 编辑仍然留在首页，双击标签修改文字。</li>
        </ul>
      </aside> -->

    <section class="communication-canvas-card">
      <div id="communication-canvas-container" ref="containerRef">
        <canvas ref="canvasRef"></canvas>
        <div
          class="tree-label-layer communication-label-layer"
          ref="labelLayerRef"
        ></div>
        <div id="tooltip" ref="tooltipRef"></div>
      </div>
    </section>
    <!-- </section> -->
  </main>
</template>
