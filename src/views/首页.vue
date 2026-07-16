<script setup>
import "../utils/user.css";

import { useUserStore } from "../stores/user.js";

//路由
import { useRouter } from "vue-router";
const userStore = useUserStore();
const router = useRouter();

//引入导航栏组件
import navBar from "../components/navBar.vue";
//引入用户显示组件
import user_show from "../components/user_show.vue";
//引入尾页
import footer_page from "../components/footer_page.vue";
//引入首页主图图片组件
import home_main_picture from "../components/home_main_picture.vue";
</script>

<template>
  <navBar />
  <user_show />
  <home_main_picture />
  <!-- 页脚继续接在主图后面。页面整体自然上下滚动。 -->
  <footer_page />
</template>
