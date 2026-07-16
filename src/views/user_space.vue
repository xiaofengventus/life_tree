<script setup>
// 要记得写setup标签，才能使用vue3的组合式API
import navBar from "@/components/navBar.vue";
import work_count from "@/components/work_count.vue";
import user_space_card from "@/components/user_space_card.vue";
</script>

<template>
  <navBar />
  <main class="user-space-page">
    <user_space_card />
    <work_count />
  </main>
</template>

<style scoped>
.user-space-page {
  min-height: 100vh;
  padding-top: 60px;
}
</style>
