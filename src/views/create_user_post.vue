<script setup>
import { useRouter } from "vue-router";
import create_post from "@/components/create_post.vue";
import navBar from "@/components/navBar.vue";
import { useUserStore } from "@/stores/user";

const router = useRouter();
const userStore = useUserStore();
const POSTS_STORAGE_KEY = "life_tree_posts";

function createHistoryEntry(post) {
  return {
    revisionCount: post.revisionCount || 1,
    submittedAt: post.submittedAt || new Date().toISOString(),
    title: post.title || "未命名帖子",
    note: post.changeNote || "提交文章",
  };
}

function getHistory(post) {
  if (Array.isArray(post.history) && post.history.length) {
    return [...post.history];
  }

  return [createHistoryEntry(post)];
}

function readPosts() {
  try {
    const storedPosts = JSON.parse(
      localStorage.getItem(POSTS_STORAGE_KEY) || "[]",
    );
    return Array.isArray(storedPosts) ? storedPosts : [];
  } catch {
    return [];
  }
}

function handleSubmit(post) {
  const posts = readPosts();
  const existingIndex = post.id
    ? posts.findIndex((item) => String(item.id) === String(post.id))
    : -1;

  if (existingIndex >= 0) {
    const existingPost = posts[existingIndex];
    const isCreator = existingPost.creatorUid
      ? existingPost.creatorUid === userStore.user?.uid
      : existingPost.creator === userStore.user?.name;

    if (!isCreator) return;

    const history = getHistory(existingPost);
    const updatedPost = {
      ...existingPost,
      ...post,
      id: existingPost.id,
      creator: existingPost.creator,
      creatorUid: existingPost.creatorUid,
    };

    if (post.isMinorChange) {
      posts[existingIndex] = {
        ...updatedPost,
        history,
        submittedAt: existingPost.submittedAt,
        revisionCount: existingPost.revisionCount || 1,
        changeNote: existingPost.changeNote,
      };
    } else {
      posts[existingIndex] = {
        ...updatedPost,
        history: [...history, createHistoryEntry(post)],
      };
    }
  } else {
    const postRecord = {
      id: globalThis.crypto?.randomUUID?.() || `${Date.now()}`,
      ...post,
    };

    postRecord.history = [createHistoryEntry(postRecord)];
    posts.unshift(postRecord);
  }

  localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
  router.push(post.id ? `/view-post/${post.id}` : "/research");
}
</script>

<template>
  <navBar />
  <create_post @submit="handleSubmit" />
</template>
