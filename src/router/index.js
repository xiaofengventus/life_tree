import { createRouter, createWebHistory } from "vue-router";

import 首页 from "../views/首页.vue";
import 登录 from "../views/登录页面.vue";
import user_space from "../views/user_space.vue";
import create_user_post from "../views/create_user_post.vue";
import view_user_post from "../views/view_user_post.vue";
import Communication from "../views/Communication.vue";
import Workplace from "../views/Workplace.vue";
import Research from "../views/Research.vue";
import { requireAuth } from "@/utils/navigation";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: 首页,
      alias: "/首页",
    },
    {
      path: "/login",
      name: "login",
      component: 登录,
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
      // meta: { requiresAuth: true }, // view 不需要登录
    },
    {
      path: "/communication",
      name: "communication",
      component: Communication,
      // meta: { requiresAuth: true }, // 不再需要登录
    },

    {
      path: "/workplace",
      name: "workplace",
      component: Workplace,
      // meta: { requiresAuth: true }, // 不再需要登录
    },
    {
      path: "/research",
      name: "research",
      component: Research,
      // meta: { requiresAuth: true }, // 不再需要登录
    },
  ],
});

router.beforeEach(requireAuth);

export default router;
