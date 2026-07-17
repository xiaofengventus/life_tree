<template>
  <main v-if="post" class="view-post-page">
    <header class="post-header">
      <div>
        <h1>{{ post.title || "未命名帖子" }}</h1>
        <p>
          作者：{{ post.author || post.creator || "未署名作者" }}
          · 提交：{{ formatSubmittedTime(post.submittedAt) }}
        </p>
      </div>

      <button
        v-if="isCreator"
        class="update-button"
        type="button"
        aria-label="更新文章"
        title="更新文章"
        @click="updatePost"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
          <path d="m14.5 7.5 3 3" />
        </svg>
      </button>
    </header>

    <div v-if="post.tags?.length" class="post-tags">
      <span v-for="tag in post.tags" :key="tag">{{ tag }}</span>
    </div>

    <article class="post-content" v-html="post.content"></article>

    <section v-if="historyRecords.length" class="submission-history">
      <h2>提交历史</h2>
      <ol>
        <li v-for="record in historyRecords" :key="`${record.submittedAt}-${record.revisionCount}`">
          <time :datetime="record.submittedAt">
            {{ formatSubmittedTime(record.submittedAt) }}
          </time>
          <strong>第{{ record.revisionCount }}次提交</strong>
          <span>{{ record.note }}</span>
        </li>
      </ol>
    </section>

    <footer class="post-footer">
      <p>{{ post.changeNote || "暂无提交说明" }}</p>
      <span>第{{ post.revisionCount || 1 }}次提交</span>
    </footer>
  </main>

  <main v-else class="missing-post">
    <h1>文章不存在</h1>
    <p>这篇文章可能已被删除，或当前浏览器中没有保存它。</p>
  </main>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import { formatDateTime } from "@/utils/date";

const POSTS_STORAGE_KEY = "life_tree_posts";
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const post = ref(null);

const historyRecords = computed(() => {
  if (!post.value) return [];

  if (Array.isArray(post.value.history) && post.value.history.length) {
    return [...post.value.history].sort(
      (first, second) =>
        Date.parse(first.submittedAt || "") -
        Date.parse(second.submittedAt || ""),
    );
  }

  return [
    {
      revisionCount: post.value.revisionCount || 1,
      submittedAt: post.value.submittedAt,
      note: post.value.changeNote || "提交文章",
    },
  ];
});

const isCreator = computed(() => {
  if (!post.value || !userStore.user) return false;

  if (post.value.creatorUid && userStore.user.uid) {
    return post.value.creatorUid === userStore.user.uid;
  }

  return post.value.creator === userStore.user.name;
});

function loadPost() {
  try {
    const posts = JSON.parse(localStorage.getItem(POSTS_STORAGE_KEY) || "[]");
    post.value = Array.isArray(posts)
      ? posts.find((item) => String(item.id) === String(route.params.id)) || null
      : null;
  } catch {
    post.value = null;
  }
}

function formatSubmittedTime(value) {
  return value ? formatDateTime(value) : "提交时间未知";
}

function updatePost() {
  if (!isCreator.value || !post.value) return;

  router.push(`/create-post?edit=${encodeURIComponent(post.value.id)}`);
}

watch(() => route.params.id, loadPost, { immediate: true });
</script>

<style scoped>
.view-post-page,
.missing-post {
  width: min(calc(100% - 40px), 960px);
  min-height: 100vh;
  margin: 0 auto;
  padding: 88px 0 60px;
}

.post-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 22px;
  border-bottom: 1px solid #e2e8f0;
}

.post-header h1,
.missing-post h1 {
  margin: 0 0 10px;
  color: #1e293b;
  font-size: 2.1rem;
  overflow-wrap: anywhere;
}

.post-header p,
.missing-post p,
.post-footer {
  color: #64748b;
}

.submission-history {
  padding: 22px 0;
  border-top: 1px solid #e2e8f0;
}

.submission-history h2 {
  margin: 0 0 14px;
  color: #1e293b;
  font-size: 1.15rem;
}

.submission-history ol {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding-left: 24px;
  color: #64748b;
}

.submission-history li {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  line-height: 1.6;
}

.submission-history strong {
  color: #334155;
}

.update-button {
  display: grid;
  width: 58px;
  height: 58px;
  flex: 0 0 auto;
  place-items: center;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: #dc2626;
  color: #ffffff;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(127, 29, 29, 0.25);
  transition: transform 0.2s, background-color 0.2s;
}

.update-button:hover {
  background: #b91c1c;
  transform: translateY(-3px);
}

.update-button svg {
  width: 30px;
  height: 30px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 20px 0;
}

.post-tags span {
  padding: 4px 10px;
  border-radius: 999px;
  background: #e0f2fe;
  color: #0369a1;
  font-size: 0.9rem;
}

.post-content {
  min-height: 360px;
  padding: 34px 0;
  color: #334155;
  font-size: 1.05rem;
  line-height: 1.9;
  overflow-wrap: anywhere;
}

.post-content :deep(img) {
  max-width: 100%;
}

.post-content :deep(p) {
  margin: 0 0 1em;
}

.post-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
  padding-top: 18px;
  border-top: 1px solid #e2e8f0;
}

.post-footer p {
  margin: 0;
}

.missing-post {
  text-align: center;
}

@media (max-width: 640px) {
  .view-post-page,
  .missing-post {
    width: min(calc(100% - 24px), 960px);
    padding-top: 80px;
  }

  .post-header h1,
  .missing-post h1 {
    font-size: 1.7rem;
  }
}
</style>
