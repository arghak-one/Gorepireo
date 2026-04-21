import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'client', // Root directory for HTML files
  base: '/',      // Base Public Path
  publicDir: 'public', // Optional, if you have assets in client/public
  build: {
    outDir: '../dist', // Output relative to root
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'client', 'index.html'),
        login: resolve(__dirname, 'client', 'src', 'pages', 'login.html'),
        register: resolve(__dirname, 'client', 'src', 'pages', 'register.html'),
        worker_register: resolve(__dirname, 'client', 'src', 'pages', 'worker-register.html'),
        user_dashboard: resolve(__dirname, 'client', 'src', 'pages', 'user-dashboard.html'),
        worker_dashboard: resolve(__dirname, 'client', 'src', 'pages', 'worker-dashboard.html'),
        shop_dashboard: resolve(__dirname, 'client', 'src', 'pages', 'shop-dashboard.html'),
        service: resolve(__dirname, 'client', 'src', 'pages', 'service.html'),
        shop: resolve(__dirname, 'client', 'src', 'pages', 'shop.html'),
        track: resolve(__dirname, 'client', 'src', 'pages', 'track.html'),
        all_items: resolve(__dirname, 'client', 'src', 'pages', 'all-items.html'),
        forgot_password: resolve(__dirname, 'client', 'src', 'pages', 'forgot-password.html'),
        admin: resolve(__dirname, 'client', 'src', 'pages', 'admin.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: true,
    // Ensure all requests are served by index.html for SPA routing
    historyApiFallback: true, 
  },
});

