<template>
  <!-- 页脚组件 -->
  <footer class="footer">
    <div class="footer-content">
      <!-- 版权信息 -->
      <p>&copy; 2024 生命时序 life_tree. 保留所有权利.</p>
      <!-- 联系方式 -->
      <p>联系我们: contact@lifetree.example.com</p>
    </div>
  </footer>
</template>

<script setup>
// 页脚组件 - 显示网站底部信息
// 无需额外逻辑，纯展示组件
</script>

<style scoped>
/* 页脚容器 */
.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50px;
  background: #1e293b;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  z-index: 100;
}

/* 页脚内容 */
.footer-content {
  text-align: center;
  font-size: 12px;
}

.footer-content p {
  margin: 2px 0;
}
</style>
