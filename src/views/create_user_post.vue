<script setup>
import { useRouter } from "vue-router";
import create_post from "@/components/create_post.vue";
import navBar from "@/components/navBar.vue";
import { useUserStore } from "@/stores/user";

const router = useRouter();
const userStore = useUserStore();
const POSTS_STORAGE_KEY = "life_tree_posts";

function handleSubmit(post) {
  let posts = [];

  try {
    const storedPosts = JSON.parse(
      localStorage.getItem(POSTS_STORAGE_KEY) || "[]",
    );
    posts = Array.isArray(storedPosts) ? storedPosts : [];
  } catch {
    posts = [];
  }

  const existingIndex = post.id
    ? posts.findIndex((item) => String(item.id) === String(post.id))
    : -1;

  if (existingIndex >= 0) {
    const existingPost = posts[existingIndex];
    const isCreator = existingPost.creatorUid
      ? existingPost.creatorUid === userStore.user?.uid
      : existingPost.creator === userStore.user?.name;

    if (!isCreator) return;

    posts[existingIndex] = {
      ...existingPost,
      ...post,
      id: existingPost.id,
      creator: existingPost.creator,
      creatorUid: existingPost.creatorUid,
    };
  } else {
    posts.unshift({
      id: globalThis.crypto?.randomUUID?.() || `${Date.now()}`,
      ...post,
      submittedAt: post.submittedAt || new Date().toISOString(),
    });
  }

  localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
  router.push(post.id ? `/view-post/${post.id}` : "/research");
}
</script>

<template>
  <navBar />
  <create_post @submit="handleSubmit" />
</template>
