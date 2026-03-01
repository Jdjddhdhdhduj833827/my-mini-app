// FILE: app.js  (NO REG/DEPOSIT CHECK • ALWAYS OPEN)
(() => {
  "use strict";

  // =========================
  // CONFIG (оставь свои ссылки 1в1)
  // =========================
  const CONFIG = {
    REG_URL: "https://u3.shortink.io/register?utm_campaign=838492&utm_source=affiliate&utm_medium=sr&a=M2nsxBfYsujho1&ac=craft_academy&code=WELCOME50",
    DEPOSIT_URL: "https://u3.shortink.io/register?utm_campaign=838492&utm_source=affiliate&utm_medium=sr&a=M2nsxBfYsujho1&ac=craft_academy&code=WELCOME50",
    DEBUG: true,
  };

  const tg = window.Telegram?.WebApp || null;

  const log = (...a) => CONFIG.DEBUG && console.log("[APP]", ...a);

  // =========================
  // DOM helpers
  // =========================
  const $ = (id) => document.getElementById(id);
  const show = (el) => el && el.classList.remove("hidden");
  const hide = (el) => el && el.classList.add("hidden");
  const safeText = (el, v) => { if (el) el.textContent = String(v ?? ""); };

  function openURL(url) {
    if (!url) return;
    try {
      if (tg?.openLink) tg.openLink(url);
      else window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  function popup(title
