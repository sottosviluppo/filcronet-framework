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
      path: "/forgot-password",
      component: () => import("@/views/ForgotPassword.vue"),
      beforeEnter: guestOnly,
    },
    {
      path: "/reset-password",
      component: () => import("@/views/ResetPassword.vue"),
      beforeEnter: guestOnly,
    },
    {
      path: "/set-password",
      component: () => import("@/views/SetPassword.vue"),
      beforeEnter: guestOnly,
    },
    {
      path: "/",
      component: () => import("@/views/Home.vue"),
      beforeEnter: requireAuth,
    },
    {
      path: "/forbidden",
      component: () => import("@/views/Forbidden.vue"),
    },
  ],
});

export default router;
