<template>
  <section class="user-space-card">
    <div class="profile-layout">
      <div class="avatar-column">
        <img :src="homePicture" alt="用户头像" class="profile-avatar" />
      </div>

      <div class="basic-information">
        <h1>{{ user.name || "未注册用户" }}</h1>
        <p><strong>UID</strong>{{ user.uid || "-" }}</p>
        <p><strong>等级</strong>{{ user.level ?? 0 }}</p>
        <p><strong>类型</strong>{{ userStore.currentType }}</p>
      </div>

      <div class="other-information">
        <h2>其他信息</h2>
        <p v-if="user.sex"><strong>性别</strong>{{ user.sex }}</p>
        <p v-if="user.bilibili || user.bilibili_link">
          <strong>Bilibili</strong>
          <a
            :href="user.bilibili || user.bilibili_link"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ user.bilibili || user.bilibili_link }}
          </a>
        </p>
        <p v-if="user.introduce"><strong>简介</strong>{{ user.introduce }}</p>
        <p v-if="!user.sex && !user.bilibili && !user.bilibili_link && !user.introduce" class="empty-information">
          暂无其他信息
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";
import { useUserStore } from "@/stores/user";
import avatarImg from "@/assets/pic/200-year-old-fox.png";

const userStore = useUserStore();

const user = computed(() => userStore.user || {});
const homePicture = computed(() => user.value.home_picture || avatarImg);
</script>

<style scoped>
.user-space-card {
  width: min(100% - 40px, 1280px);
  margin: 24px auto 0;
  padding: 32px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-top: 4px solid #0f75b5;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.08);
}

.profile-layout {
  display: grid;
  grid-template-columns: 190px minmax(220px, 1fr) minmax(280px, 1.4fr);
  align-items: center;
  gap: 36px;
}

.avatar-column {
  display: flex;
  justify-content: center;
}

.profile-avatar {
  width: 128px;
  height: 128px;
  border: 1px solid #0f75b5;
  border-radius: 50%;
  object-fit: cover;
  transition: transform 0.2s ease;
}

.profile-avatar:hover {
  transform: scale(1.04);
}

.basic-information,
.other-information {
  min-width: 0;
}

.basic-information h1,
.other-information h2 {
  margin: 0 0 18px;
  color: #0f172a;
}

.basic-information h1 {
  font-size: 1.8rem;
}

.other-information h2 {
  font-size: 1.25rem;
}

.basic-information p,
.other-information p {
  margin: 8px 0;
  color: #475569;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.basic-information strong,
.other-information strong {
  display: inline-block;
  min-width: 76px;
  margin-right: 8px;
  color: #0f172a;
}

.other-information a {
  color: #0f75b5;
  overflow-wrap: anywhere;
}

.empty-information {
  color: #94a3b8 !important;
}

@media (max-width: 800px) {
  .user-space-card {
    width: min(100% - 24px, 640px);
    padding: 24px 18px;
  }

  .profile-layout {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .basic-information h1,
  .other-information h2 {
    text-align: center;
  }
}
</style>
