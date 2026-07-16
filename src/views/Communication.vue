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

// 引入导航栏
import navBar from "../components/navBar.vue";
</script>

<template>
  <main class="communication-page">
    <!-- 引入导航栏 -->
    <navBar />

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
  </main>
</template>
