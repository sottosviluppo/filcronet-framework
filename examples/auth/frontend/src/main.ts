import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";
import { createAuth } from "@sottosviluppo/auth-frontend";
import PrimeVue from "primevue/config";
import Aura from "@primeuix/themes/aura";

import "./tailwind.css";
import "primeicons/primeicons.css";
import { createI18n } from "vue-i18n";
import it from "./locales/it";

const app = createApp(App);

app.use(createPinia());
const i18n = createI18n({
  legacy: false,
  locale: "it",
  fallbackLocale: "it",
  messages: {
    it,
  },
});

app.use(i18n);
app.use(router);
app.use(
  createAuth({
    apiBaseUrl: "http://localhost:3000",
    apiVersion: "v1",
    apiPrefix: "api",
    redirectOnUnauth: "/login",
    redirectOnLogin: "/",
    autoRefreshToken: true,
    refreshBeforeExpiry: 60000,
  })
);
app.use(PrimeVue, {
  theme: {
    preset: Aura,
  },
});

app.mount("#app");
