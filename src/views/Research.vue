<script setup>
import { computed, onMounted, ref } from "vue";
import navBar from "@/components/navBar.vue";
import user_show from "@/components/user_show.vue";
import { formatDateTime } from "@/utils/date";

const POSTS_STORAGE_KEY = "life_tree_posts";
const searchQuery = ref("");
const posts = ref([]);

const visiblePosts = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase();

  return [...posts.value]
    .sort(
      (first, second) =>
        getTimestamp(second.submittedAt) - getTimestamp(first.submittedAt),
    )
    .filter((post) => {
      if (!keyword) return true;

      const searchableText = [
        post.title,
        post.author,
        post.creator,
        post.content,
        ...(Array.isArray(post.tags) ? post.tags : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(keyword);
    });
});

function getTimestamp(value) {
  const timestamp = Date.parse(value || "");
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function loadPosts() {
  try {
    const storedPosts = JSON.parse(
      localStorage.getItem(POSTS_STORAGE_KEY) || "[]",
    );
    posts.value = Array.isArray(storedPosts) ? storedPosts : [];
  } catch {
    posts.value = [];
  }
}

function getExcerpt(content) {
  const text = String(content || "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

  return text.length > 50 ? `${text.slice(0, 50)}...` : text || "暂无文章摘要";
}

function getAuthor(post) {
  return post.author || post.creator || "未署名作者";
}

function getSubmittedTime(value) {
  return value ? formatDateTime(value) : "提交时间未知";
}

onMounted(loadPosts);
</script>

<template>
  <navBar />
  <user_show :show-write-button="true" />

  <main class="research-page">
    <section class="research-header">
      <h1>Research</h1>
      <input
        v-model="searchQuery"
        class="research-search"
        type="search"
        placeholder="Search 搜索帖子"
      />
    </section>

    <section class="post-list" aria-label="文章列表">
      <article v-for="post in visiblePosts" :key="post.id" class="post-card">
        <div class="post-cover">
          <img v-if="post.coverImage" :src="post.coverImage" alt="文章封面" />
          <span v-else>封面图</span>
        </div>

        <div class="post-information">
          <div class="post-heading">
            <h2>
              <RouterLink :to="`/view-post/${post.id}`">
                {{ post.title || "未命名帖子" }}
              </RouterLink>
            </h2>
            <span>作者：{{ getAuthor(post) }}</span>
          </div>

          <p class="post-excerpt">{{ getExcerpt(post.content) }}</p>

          <div class="post-meta">
            <time :datetime="post.submittedAt">
              最新提交：{{ getSubmittedTime(post.submittedAt) }}
            </time>
            <span v-if="post.tags?.length"
              >标签：{{ post.tags.join("、") }}</span
            >
          </div>
        </div>
      </article>

      <p v-if="!visiblePosts.length" class="empty-posts">
        暂无帖子，点击右下角的羽毛按钮创建第一篇文章。
      </p>
    </section>
  </main>
</template>

<style scoped>
.research-page {
  min-height: 100vh;
  padding: 84px 20px 60px;
  background: #f8fafc;
}

.research-header,
.post-list {
  width: min(100%, 1180px);
  margin: 0 auto;
}

.research-header {
  margin-bottom: 28px;
}

.research-header h1 {
  margin: 0 0 18px;
  color: #1e293b;
  font-size: 2rem;
}

.research-search {
  width: min(100%, 600px);
  padding: 12px 16px;
  border: 1px solid #cbd5e1;
  border-radius: 7px;
  background: #ffffff;
  color: #1e293b;
  font: inherit;
}

.research-search:focus {
  border-color: #4a90e2;
  outline: 2px solid rgba(74, 144, 226, 0.15);
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.post-card {
  display: grid;
  grid-template-columns: minmax(260px, 40%) minmax(0, 1fr);
  min-height: 240px;
  overflow: hidden;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
}

.post-cover {
  display: grid;
  min-height: 240px;
  place-items: center;
  background: #e2e8f0;
  color: #64748b;
}

.post-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-information {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 34px;
}

.post-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.post-heading h2 {
  margin: 0;
  color: #1e293b;
  font-size: 1.35rem;
  overflow-wrap: anywhere;
}

.post-heading h2 a {
  color: inherit;
  text-decoration: none;
}

.post-heading h2 a:hover {
  color: #2563eb;
  text-decoration: underline;
}

.post-heading span,
.post-meta {
  color: #64748b;
  font-size: 0.9rem;
}

.post-excerpt {
  max-width: 520px;
  margin: 28px 0;
  color: #475569;
  line-height: 1.8;
  overflow-wrap: anywhere;
}

.post-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  margin-top: auto;
}

.empty-posts {
  margin: 40px 0;
  color: #64748b;
  text-align: center;
}

@media (max-width: 720px) {
  .research-page {
    padding: 76px 12px 40px;
  }

  .post-card {
    grid-template-columns: 1fr;
  }

  .post-cover {
    min-height: 180px;
  }

  .post-information {
    padding: 22px;
  }

  .post-heading {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
