import { guestOnly, requireAuth } from "@sottosviluppo/auth-frontend";
import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/login",
      component: () => import("@/views/Login.vue"),
      beforeEnter: guestOnly,
    },
    {
      path: "/",
      component: () => import("@/views/Home.vue"),
      beforeEnter: requireAuth,
    },
  ],
});

export default router;
