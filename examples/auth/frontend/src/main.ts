import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";
import { useAuthStore } from "@sottosviluppo/auth-frontend";
import { PrimeVue } from "@primevue/core";
import "./style.css";
import it from "./locales/it";
import { createI18n } from "vue-i18n";

const app = createApp(App);

app.use(createPinia());
app.use(router);

const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: "it", // Default locale
  fallbackLocale: "it",
  messages: {
    it,
  },
});

app.use(i18n);

app.use(PrimeVue);

const authStore = useAuthStore();
authStore.initialize({
  apiBaseUrl: "http://localhost:3000",
  apiVersion: "v1",
  storage: "localStorage",
  redirectOnUnauth: "/login",
  redirectOnLogin: "/",
});

app.mount("#app");
