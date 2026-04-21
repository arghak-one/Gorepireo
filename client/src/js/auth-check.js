(function() {
    // RBAC: Role-Based Access Control - ULTIMATE RESET VERSION
    // Atomic, event-driven authentication checks.

    window.checkAuth = function() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const userRole = localStorage.getItem('userRole'); 
        
        // Robust current page detection
        const url = new URL(window.location.href);
        const currentPage = url.pathname.split('/').pop() || 'index.html';

        console.log("[AuthCheck] Running Reset Auth Check...", { isLoggedIn, userRole, currentPage });

        const dashboards = {
            'user': '/src/pages/user-dashboard.html',
            'worker': '/src/pages/worker-dashboard.html',
            'shopkeeper': '/src/pages/shop-dashboard.html',
            'shop': '/src/pages/shop-dashboard.html',
            'admin': '/src/pages/admin.html'
        };

        const navigate = (path) => {
            const targetFilename = path.split('/').pop();
            if (currentPage === targetFilename || (currentPage === 'index.html' && targetFilename === '')) return;
            
            console.warn(`[AuthCheck] Redirecting: ${currentPage} -> ${path}`);
            if (window.appRouter && typeof window.appRouter.navigateTo === 'function') {
                window.appRouter.navigateTo(path);
            } else {
                window.location.href = path; // Hard fallback during boot
            }
        };

        // 1. Unauthorized Dashboard Access
        const dashboardPages = Object.values(dashboards).map(p => p.split('/').pop());
        if (dashboardPages.includes(currentPage) && !isLoggedIn) {
            navigate('/src/pages/login.html');
            return;
        }

        // 2. Role Mismatch
        if (isLoggedIn && dashboardPages.includes(currentPage)) {
            const correctDashboard = dashboards[userRole];
            if (correctDashboard && currentPage !== correctDashboard.split('/').pop()) {
                navigate(correctDashboard);
                return;
            }
        }

        // 3. Auth Page Protection
        const authPages = ['login.html', 'register.html', 'worker-register.html'];
        if (isLoggedIn && authPages.includes(currentPage)) {
            navigate(dashboards[userRole] || '/index.html');
            return;
        }

        // Sync UI
        if (typeof window.updateNavAuth === 'function') window.updateNavAuth();
    };

    window.updateNavAuth = function() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const userName = localStorage.getItem('userName') || 'User';
        const navAuth = document.getElementById('navAuth');
        
        // 1. Sync Desktop Auth UI
        if (isLoggedIn && navAuth) {
            const avatarSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=C19A32&color=fff`;
            navAuth.innerHTML = `
                <div style="display: flex; align-items: center; gap: 16px;">
                    <button onclick="window.logoutUser()" class="gnav-cta" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #EF4444; padding: 8px 16px; font-size: 13px; border-radius: 99px; cursor: pointer;">Logout</button>
                    <div class="gnav-avatar" style="width: 36px; height: 36px; border-radius: 50%; overflow: hidden; border: 2px solid var(--accent-gold);">
                        <img src="${avatarSrc}" alt="${userName}" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                </div>
            `;
        } else if (navAuth) {
            navAuth.innerHTML = `
                <a href="/src/pages/login.html" class="gnav-profile">
                    <div class="gnav-avatar"><i class="fas fa-user-circle"></i></div>
                    <span data-i18n="nav-login">Profile</span>
                </a>
            `;
        }

        // 2. Sync Side Drawer UI
        const drawerLogin = document.getElementById('drawerLogin');
        if (drawerLogin) {
            if (isLoggedIn) {
                drawerLogin.innerHTML = `<i class="fas fa-user-shield" style="margin-right: 12px; color: var(--accent-gold);"></i> ${userName}'s Profile`;
                drawerLogin.className = 'mobile-link active';
                // Update href to correct dashboard
                const userRole = localStorage.getItem('userRole') || 'user';
                const dashboards = { user: '/src/pages/user-dashboard.html', worker: '/src/pages/worker-dashboard.html', shop: '/src/pages/shop-dashboard.html', admin: '/src/pages/admin.html' };
                drawerLogin.href = dashboards[userRole] || '/src/pages/user-dashboard.html';
            } else {
                drawerLogin.innerHTML = `Login / Profile`;
                drawerLogin.className = 'mobile-link';
                drawerLogin.href = '/src/pages/login.html';
            }
        }

        // 3. Hide 'Become a Partner' if logged in
        const partnerButtons = document.querySelectorAll('.gnav-cta[href*="worker-register"], .gnav-drawer-cta[href*="worker-register"]');
        partnerButtons.forEach(btn => {
            if (isLoggedIn) {
                btn.style.setProperty('display', 'none', 'important');
            } else {
                btn.style.setProperty('display', '', '');
            }
        });

        // 4. Sync Mobile Bottom Nav 'Account' link
        const bottomNavAccount = document.querySelector('.mobile-bottom-nav .mbn-item i.fa-circle-user')?.parentElement;
        if (bottomNavAccount) {
            if (isLoggedIn) {
                const userRole = localStorage.getItem('userRole') || 'user';
                const dashboards = { user: '/src/pages/user-dashboard.html', worker: '/src/pages/worker-dashboard.html', shop: '/src/pages/shop-dashboard.html', admin: '/src/pages/admin.html' };
                bottomNavAccount.href = dashboards[userRole] || '/src/pages/user-dashboard.html';
            } else {
                bottomNavAccount.href = '/src/pages/login.html';
            }
        }
    };

    // Initial Trigger on script load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', window.checkAuth);
    } else {
        window.checkAuth();
    }
})();
