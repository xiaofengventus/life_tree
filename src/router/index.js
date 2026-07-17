import { createRouter, createWebHistory } from "vue-router";

import homeView from "../views/首页.vue";
import loginView from "../views/登录页面.vue";
import user_space from "../views/user_space.vue";
import create_user_post from "../views/create_user_post.vue";
import view_user_post from "../views/view_user_post.vue";
import Communication from "../views/Communication.vue";
import Workplace from "../views/Workplace.vue";
import Research from "../views/Research.vue";
import evolution_user_tree from "../views/evolution_user_tree.vue";
import { requireAuth } from "@/utils/navigation";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: homeView,
      alias: "/首页〉",
    },
    {
      path: "/login",
      name: "login",
      component: loginView,
    },
    {
      path: "/user-space",
      name: "user-space",
      component: user_space,
    },
    {
      path: "/create-post",
      name: "create-post",
      component: create_user_post,
      meta: { requiresAuth: true },
    },
    {
      path: "/view-post/:id",
      name: "view-user-post",
      component: view_user_post,
    },
    {
      path: "/communication",
      name: "communication",
      component: Communication,
    },
    {
      path: "/workplace",
      name: "workplace",
      component: evolution_user_tree,
    },
    {
      path: "/research",
      name: "research",
      component: Research,
    },
    {
      path: "/evolution-user-tree",
      name: "evolution-user-tree",
      component: evolution_user_tree,
      meta: { requiresAuth: true },
    },
  ],
});

router.beforeEach(requireAuth);

export default router;
