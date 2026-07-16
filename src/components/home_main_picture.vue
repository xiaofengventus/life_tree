<template>
  <!-- 双向绑定更换图片 -->
  <img :src="mainPicture" alt="Main Picture" />
</template>

<script setup>
import { ref } from "vue";
// 使用 import 让 Vite 在构建时处理并生成正确的资源路径（避免生产环境路径问题、大小写敏感等）
// 问题因在组件里用绝对 "/src/..." 路径引用图片，开发时 Windows
// 可以访问但生产构建（在 Vercel 的 Linux 环境）路径会不同且大小写敏感，导致资源找不到或路径错误。
import mainPic from "@/assets/pic/jmgmksz-fox.png";
const mainPicture = ref(mainPic);
</script>

<style scoped>
img {
  width: 100%;
  height: auto;
}
</style>
