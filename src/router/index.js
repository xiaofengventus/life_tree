import { createRouter, createWebHistory } from "vue-router";

import 首页 from "../views/首页.vue";
import 登录 from "../views/登录页面.vue";
import user_space from "../views/user_space.vue";
import Communication from "../views/Communication.vue";
import Workplace from "../views/Workplace.vue";
import Research from "../views/Research.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: 首页,
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
      path: "/communication",
      name: "communication",
      component: Communication,
    },

    {
      path: "/workplace",
      name: "workplace",
      component: Workplace,
    },
    {
      path: "/research",
      name: "research",
      component: Research,
    },
  ],
});

export default router;
