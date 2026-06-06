import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        aboutUs: resolve(__dirname, "aboutUs/aboutUs.html"),
        account: resolve(__dirname, "account/account.html"),
        catalog: resolve(__dirname, "catalog/catalog.html"),
        contact: resolve(__dirname, "contact/contact.html"),
        forums: resolve(__dirname, "forums/forums.html"),
        shoppingCart: resolve(__dirname, "shoppingCart/shopping.html"),
      },
    },
  },
});
