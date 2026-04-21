import { createClient } from '@insforge/sdk';
import { router } from './router.js';

// GoRepireo Application Initialization: Migrated from Supabase to InsForge
// Using Vite environment variables for GoRepireo credentials (b5aa28b1-50c0-4d52-954d-2641a4a24c87)
const API_BASE_URL = import.meta.env?.VITE_INSFORGE_BASE_URL || 'https://xipxmg4q.us-west.insforge.app';
const API_ANON_KEY = import.meta.env?.VITE_INSFORGE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyODAxMjd9.5am_8PoTP8gkFToK_Xxm6NbVVrMHydACjCcVYF3Ac7I';

// Initialization complete: Verified GoRepireo Production Backend

window.dbClient = createClient({
  baseUrl: API_BASE_URL,
  anonKey: API_ANON_KEY
});

// Router is self-initializing in router.js
window.appRouter = router;


// Compatibility shim for legacy code

window.supabaseClient = window.dbClient?.database;
window.getSB = () => {
    if (window.dbClient?.database) return window.dbClient.database;
    if (window.supabaseClient) return window.supabaseClient;
    return null;
};
window.isClientReady = true;

// --- PREMIUM GLOBAL NOTIFICATION SYSTEM ---
(function () {
    // Inject Toast CSS
    const styles = `
        .toast-container { 
            position: fixed; 
            bottom: 32px; 
            right: 32px; 
            z-index: 10000; 
            display: flex; 
            flex-direction: column; 
            gap: 12px; 
            pointer-events: none; 
        }
        .toast-card { 
            background: rgba(15, 23, 42, 0.85); 
            backdrop-filter: blur(20px); 
            -webkit-backdrop-filter: blur(20px); 
            border: 1px solid rgba(255, 255, 255, 0.1); 
            color: white; 
            padding: 16px 24px; 
            border-radius: 16px; 
            font-size: 14px; 
            font-weight: 500; 
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4); 
            display: flex; 
            align-items: center; 
            gap: 14px; 
            min-width: 300px; 
            max-width: 450px; 
            pointer-events: auto; 
            animation: toast-in 0.5s cubic-bezier(0.18, 0.89, 0.32, 1.28); 
            transition: 0.4s; 
        }
        .toast-card.fade-out { 
            opacity: 0; 
            transform: translateX(30px) scale(0.95); 
        }
        @keyframes toast-in { 
            from { opacity: 0; transform: translateX(50px) scale(0.9); } 
            to { opacity: 1; transform: translateX(0) scale(1); } 
        }
        .toast-icon { 
            width: 36px; 
            height: 36px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            border-radius: 10px; 
            background: linear-gradient(135deg, #C19A32, #a8852a); 
            color: white; 
            flex-shrink: 0; 
            font-size: 16px; 
            box-shadow: 0 8px 16px rgba(193, 154, 50, 0.2);
        }
        .toast-message {
            line-height: 1.4;
        }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    // Override Global Alert
    window.alert = function (message) {
        // Mobile detection
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (isMobile) {
            // Use Web Notification API if available and permitted
            if ("Notification" in window) {
                if (Notification.permission === "granted") {
                    new Notification("GoRepireo", { body: message, icon: "GoRepireo.png" });
                    return;
                } else if (Notification.permission !== "denied") {
                    Notification.requestPermission().then(permission => {
                        if (permission === "granted") {
                            new Notification("GoRepireo", { body: message, icon: "GoRepireo.png" });
                        } else {
                            // Fallback to in-app toast for mobile if permission denied
                            showToast(message);
                        }
                    });
                    return;
                }
            }
        }

        // Desktop or Fallback: Premium in-app toast
        showToast(message);
    };

    function showToast(message) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        // FIFO: Limit visible toasts to 3
        const existingToasts = container.querySelectorAll('.toast-card:not(.fade-out)');
        if (existingToasts.length >= 3) {
            const oldest = existingToasts[0];
            oldest.classList.add('fade-out');
            setTimeout(() => oldest.remove(), 400);
        }

        const toast = document.createElement('div');
        toast.className = 'toast-card';
        toast.innerHTML = `
            <div class="toast-icon"><i class="fas fa-bell"></i></div>
            <div class="toast-message">${message}</div>
        `;

        container.appendChild(toast);

        // Auto remove after 4.5s
        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.add('fade-out');
                setTimeout(() => toast.remove(), 400);
            }
        }, 4500);
    }
})();

// --- GLOBAL MOBILE NAVIGATION TOGGLE ---
window.togglePremiumDrawer = function () {
    const drawer = document.querySelector('.premium-side-drawer');
    const overlay = document.querySelector('.drawer-overlay');
    
    if (drawer && overlay) {
        const isActive = drawer.classList.contains('active');
        drawer.classList.toggle('active');
        overlay.classList.toggle('active');
        
        // Disable body scroll when drawer is open
        document.body.style.overflow = !isActive ? 'hidden' : '';
    }
};
