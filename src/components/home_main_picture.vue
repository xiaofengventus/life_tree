<template>
  <!-- 双向绑定更换图片 -->
  <img :src="mainPicture" alt="Main Picture" />
</template>

<script setup>
import { ref } from "vue";

// const mainPicture = ref("/src/assets/pic/200-year-old-fox.png");
const mainPicture = ref("/src/assets/pic/jmgmksz-hox.png");
</script>

<style scoped>
img {
  width: 100%;
  height: auto;
}
</style>
