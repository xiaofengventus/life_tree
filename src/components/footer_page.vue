<template>
  <!-- 下拉式页脚组件 -->
  <div class="footer-wrapper">
    <!-- 下拉按钮 -->
    <button class="footer-toggle" @click="isExpanded = !isExpanded">
      <span class="footer-title">生命时序 life_tree</span>
      <span class="footer-arrow" :class="{ expanded: isExpanded }">▼</span>
    </button>
    
    <!-- 展开内容区域 -->
    <div class="footer-content" :class="{ expanded: isExpanded }">
      <div class="footer-section">
        <!-- 版权信息 -->
        <p>&copy; 2026.7.13- 生命时序 life_tree. 保留所有权利.</p>
        <!-- 联系方式 -->
        <p><a href="mailto:1163919575@qq.com">邮箱反馈</a></p>
      </div>
      
      <div class="footer-section">
        <p>科普组织推荐：</p>
        <ul>
          <li>
            <a
              href="https://space.bilibili.com/1116218096?spm_id_from=333.337.0.0"
              target="_blank"
              >非村科普墙</a
            >
          </li>
          <li>
            <a
              href="https://space.bilibili.com/346118363?spm_id_from=333.1387"
              target="_blank"
              >烈焰之魂Fire_Soul</a
            >
          </li>
        </ul>
      </div>
      
      <div class="footer-section">
        <p>快速链接：</p>
        <ul>
          <li><a href="/">首页</a></li>
          <li><a href="/communication">社区</a></li>
          <li><a href="/research">研究</a></li>
          <li><a href="/workplace">工作台</a></li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

// 控制展开/收起状态
const isExpanded = ref(false);
</script>

<style scoped>
/* 页脚包装器 */
.footer-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #1e293b;
  color: #94a3b8;
  z-index: 100;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

/* 下拉按钮 */
.footer-toggle {
  width: 100%;
  height: 45px;
  background: #1e293b;
  color: #94a3b8;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.footer-toggle:hover {
  background: #334155;
}

/* 标题 */
.footer-title {
  letter-spacing: 1px;
}

/* 箭头 */
.footer-arrow {
  font-size: 10px;
  transition: transform 0.3s ease;
}

.footer-arrow.expanded {
  transform: rotate(180deg);
}

/* 展开内容区域 */
.footer-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-out;
  padding: 0 20px;
}

.footer-content.expanded {
  max-height: 300px;
  padding: 20px;
  border-top: 1px solid #334155;
}

/* 内容布局 */
.footer-content.expanded {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  gap: 20px;
}

/* 区块 */
.footer-section {
  min-width: 150px;
}

.footer-section p {
  font-size: 12px;
  margin-bottom: 8px;
  font-weight: 500;
  color: #cbd5e1;
}

.footer-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-section li {
  margin-bottom: 4px;
}

.footer-section li a {
  font-size: 12px;
  color: #94a3b8;
  text-decoration: none;
  transition: color 0.2s;
}

.footer-section li a:hover {
  color: aqua;
}

/* 邮箱链接 */
.footer-content a[href^="mailto"] {
  color: aqua;
}

.footer-content a[href^="mailto"]:hover {
  text-decoration: underline;
}
</style>
