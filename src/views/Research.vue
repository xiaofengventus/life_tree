<script setup>
import { ref } from "vue";

// 引入导航栏
import navBar from "../components/navBar.vue";

//
import user_show from "@/components/user_show.vue";
</script>

<template>
  <!-- 引入导航栏 -->
  <navBar />

  <!-- 引入用户卡片 -->
  <user_show />
</template>
