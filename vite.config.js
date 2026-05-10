import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  base: "/mailstone-pwa/",
  plugins: [
    vue(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "MailStone PWA App",
        short_name: "MailStone",
        description: "Leave messages on the map.",
        theme_color: "#1a110a",
        background_color: "#1a110a",
        display: "standalone",
        icons: [
          {
            src: "icon_x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icon_x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
