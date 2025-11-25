import { useAuthStore } from "@sottosviluppo/auth-frontend";
import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("../views/HomeView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/login",
      name: "login",
      component: () => import("../views/LoginView.vue"),
      meta: { requiresGuest: true },
    },
    {
      path: "/register",
      name: "register",
      component: () => import("../views/RegisterView.vue"),
      meta: { requiresGuest: true },
    },
    {
      path: "/forgot-password",
      name: "forgot-password",
      component: () => import("../views/ForgotPasswordView.vue"),
      meta: { requiresGuest: true },
    },
    {
      path: "/reset-password",
      name: "reset-password",
      component: () => import("../views/ResetPasswordView.vue"),
      meta: { requiresGuest: true },
    },
    {
      path: "/set-password",
      name: "set-password",
      component: () => import("../views/SetPasswordView.vue"),
      meta: { requiresGuest: true },
    },
  ],
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated;

  // Redirect authenticated users away from guest-only pages
  if (to.meta.requiresGuest && isAuthenticated) {
    return next("/");
  }

  // Redirect unauthenticated users to login
  if (to.meta.requiresAuth && !isAuthenticated) {
    return next("/login");
  }

  next();
});

export default router;
