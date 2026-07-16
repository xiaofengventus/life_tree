<template>
  <!-- 双向绑定更换图片 -->
  <img :src="mainPicture" alt="Main Picture" />
</template>

<script setup>
import { ref } from "vue";
// 使用 import 让 Vite 在构建时处理并生成正确的资源路径（避免生产环境路径问题、大小写敏感等）
import mainPic from "@/assets/pic/jmgmksz-fox.png";
const mainPicture = ref(mainPic);
</script>

<style scoped>
img {
  width: 100%;
  height: auto;
}
</style>
