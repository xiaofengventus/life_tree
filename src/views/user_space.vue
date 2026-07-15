<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "../stores/user";

const router = useRouter();
const userStore = useUserStore();

const isEditing = ref(false);
const editName = ref("");
const editIntroduce = ref("");
const editLevel = ref(0);
const errorMessage = ref("");

const user = computed(() => userStore.user);
const currentType = computed(() => userStore.currentType);
const currentPermissions = computed(() => userStore.currentPermissions);

onMounted(() => {
  if (!user.value) {
    router.push("/login");
  } else {
    editName.value = user.value.name || "";
    editIntroduce.value = user.value.introduce || "";
    editLevel.value = user.value.level || 0;
  }
});

function startEdit() {
  editName.value = user.value.name || "";
  editIntroduce.value = user.value.introduce || "";
  editLevel.value = user.value.level || 0;
  isEditing.value = true;
}

async function saveEdit() {
  errorMessage.value = "";
  
  if (!editName.value.trim()) {
    errorMessage.value = "请输入昵称";
    return;
  }
  
  const success = await userStore.updateProfile({
    name: editName.value.trim(),
    introduce: editIntroduce.value.trim(),
    level: editLevel.value,
  });
  
  if (success) {
    isEditing.value = false;
  } else {
    errorMessage.value = "更新失败，请重试";
  }
}

function cancelEdit() {
  isEditing.value = false;
}

async function handleLogout() {
  await userStore.logout();
  router.push("/");
}

function formatDate(dateString) {
  if (!dateString) return "未知";
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPermissionLabel(perm) {
  const labels = {
    read: "阅读",
    create_article: "发布文章",
    edit_own_article: "修改自己的文章",
    delete_own_article: "删除自己的文章",
    edit_article: "修改文章",
    delete_article: "删除文章",
    manage_users: "管理用户",
    manage_group: "管理社团",
  };
  return labels[perm] || perm;
}
</script>

<template>
  <div class="user-space-container">
    <nav>
      生命时序 life_tree
      <div id="function">
        <button class="btn-secondary" @click="router.push('/')">返回首页</button>
        <button class="btn-danger" @click="handleLogout">退出登录</button>
      </div>
    </nav>

    <div class="user-space-content">
      <div class="profile-card">
        <div class="profile-header">
          <div class="avatar-container">
            <img src="@/assets/pic/200-year-old-fox.png" alt="用户头像" class="profile-avatar" />
            <div class="level-badge">Lv.{{ user?.level || 0 }}</div>
          </div>
          
          <div class="profile-info">
            <div class="name-section">
              <template v-if="isEditing">
                <input type="text" v-model="editName" class="edit-input" />
              </template>
              <template v-else>
                <h1>{{ user?.name || '未注册用户' }}</h1>
              </template>
              <span class="type-badge">{{ currentType }}</span>
            </div>
            
            <p class="uid">UID: {{ user?.uid || '-' }}</p>
            
            <template v-if="isEditing">
              <textarea v-model="editIntroduce" class="edit-textarea" placeholder="个人简介"></textarea>
            </template>
            <template v-else>
              <p class="introduce">{{ user?.introduce || '暂无简介' }}</p>
            </template>
            
            <div class="action-buttons">
              <template v-if="isEditing">
                <button class="btn-primary" @click="saveEdit">保存</button>
                <button class="btn-secondary" @click="cancelEdit">取消</button>
              </template>
              <template v-else>
                <button class="btn-primary" @click="startEdit">编辑资料</button>
              </template>
            </div>
          </div>
        </div>

        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ user?.level || 0 }}</div>
            <div class="stat-label">等级</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ formatDate(user?.signup_data) }}</div>
            <div class="stat-label">注册时间</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ currentPermissions.length }}</div>
            <div class="stat-label">权限数量</div>
          </div>
        </div>
      </div>

      <div class="permissions-card">
        <h2>操作权限</h2>
        <div class="permissions-list">
          <div
            v-for="perm in currentPermissions"
            :key="perm"
            class="permission-item"
          >
            <span class="permission-check">✓</span>
            <span class="permission-label">{{ getPermissionLabel(perm) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-space-container {
  min-height: 100vh;
  background: #f5f7fa;
}

nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  z-index: 100;
  font-size: 1.5rem;
  font-weight: bold;
}

#function {
  display: flex;
  gap: 10px;
}

#function button {
  padding: 6px 12px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-secondary {
  background: #e2e8f0;
  color: #475569;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.user-space-content {
  padding-top: 80px;
  padding-left: 20px;
  padding-right: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.profile-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 30px;
  margin-bottom: 20px;
}

.profile-header {
  display: flex;
  gap: 30px;
  margin-bottom: 30px;
}

.avatar-container {
  position: relative;
  flex-shrink: 0;
}

.profile-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #e2e8f0;
}

.level-badge {
  position: absolute;
  bottom: -5px;
  right: -5px;
  background: #4f46e5;
  color: white;
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.profile-info {
  flex: 1;
}

.name-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.name-section h1 {
  font-size: 1.8rem;
  color: #1e293b;
  margin: 0;
}

.type-badge {
  background: #f0f4f8;
  color: #475569;
  font-size: 0.8rem;
  padding: 4px 12px;
  border-radius: 20px;
}

.uid {
  color: #94a3b8;
  font-size: 0.9rem;
  margin-bottom: 15px;
}

.introduce {
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 20px;
}

.edit-input {
  width: 300px;
  padding: 8px 12px;
  border: 1px solid #cbd5dc;
  border-radius: 6px;
  font-size: 1.2rem;
}

.edit-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #cbd5dc;
  border-radius: 6px;
  font-size: 1rem;
  resize: vertical;
  min-height: 80px;
  margin-bottom: 15px;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.btn-primary {
  background: #4f46e5;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-primary:hover {
  background: #4338ca;
}

.error-message {
  background: #fee2e2;
  color: #dc2626;
  padding: 10px 15px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  font-size: 0.85rem;
  color: #94a3b8;
  margin-top: 4px;
}

.permissions-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 30px;
}

.permissions-card h2 {
  font-size: 1.2rem;
  color: #1e293b;
  margin-bottom: 20px;
}

.permissions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.permission-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8fafc;
  padding: 8px 16px;
  border-radius: 20px;
}

.permission-check {
  color: #22c55e;
  font-weight: bold;
}

.permission-label {
  color: #475569;
  font-size: 0.9rem;
}
</style>
