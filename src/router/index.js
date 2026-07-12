import { createRouter, createWebHistory } from "vue-router";
import 首页 from "../components/首页.vue";
import 登录 from "../components/登录.vue";
import user_space from "../components/user_space.vue";
import Communication from "../components/Communication.vue";

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
      path: "/about",
      name: "about",
      component: () => import("../views/AboutView.vue"),
    },
  ],
});

export default router;
