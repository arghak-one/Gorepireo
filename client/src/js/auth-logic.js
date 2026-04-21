/**
 * GoRepireo Centralized Authentication Logic
 * Provides global handlers for Login, Registration, and Session Management.
 * Integrated with window.appRouter for SPA navigation.
 */

(function() {
    console.log("[AuthLogic] Global Auth System Initialized.");

    // --- HELPER: GET DATABASE CLIENT ---
    function getSB() {
        return window.dbClient?.database || window.supabaseClient || (window.getSB ? window.getSB() : null);
    }

    function getAuth() {
        return window.dbClient?.auth;
    }

    // --- HELPER: NOTIFY ---
    function notify(msg) {
        if (window.alert) window.alert(msg); // app-init.js overrides this with a toast
        else console.log("[Auth] Notification:", msg);
    }

    // --- LOGIN HANDLER ---
    window.loginUser = async function(email, password) {
        if (!email || !password) {
            notify("Please enter both email and password.");
            return;
        }

        const SB = getSB();
        if (!SB) {
            notify("Authentication system is initializing. Please wait.");
            return;
        }

        try {
            console.log("[Auth] Attempting login for:", email);
            const { data, error } = await SB.from('users')
                .select('*')
                .eq('email', email.trim().toLowerCase())
                .eq('password', password)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                // Set Session
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userRole', data.role || 'user');
                localStorage.setItem('userEmail', data.email);
                localStorage.setItem('currentUserEmail', data.email); // Fixed: Added for dashboard compatibility
                localStorage.setItem('userName', data.name || 'User');
                localStorage.setItem('userId', data.id);
                localStorage.setItem('userAvatar', data.avatar_url || ''); // Added for Instant UI

                notify(`Welcome back, ${data.name || 'User'}!`);

                // SPA Redirection Logic
                if (window.appRouter) {
                    const dashboards = {
                        'admin': '/src/pages/admin.html',
                        'worker': '/src/pages/worker-dashboard.html',
                        'shop': '/src/pages/shop-dashboard.html',
                        'shopkeeper': '/src/pages/shop-dashboard.html',
                        'user': '/src/pages/user-dashboard.html'
                    };
                    const target = dashboards[data.role] || '/index.html';
                    console.log("[Auth] Redirecting to dashboard:", target);
                    window.appRouter.navigateTo(target);
                } else {
                    window.location.href = '/index.html';
                }
                
                // Update navigation UI
                if (window.updateNavAuth) window.updateNavAuth();
            } else {
                notify("Invalid email or password. Please try again.");
            }
        } catch (err) {
            console.error("[Auth] Login error:", err);
            notify("Login failed: " + (err.message || "Unknown error"));
        }
    };

    // --- REGISTRATION HANDLER ---
    window.registerUser = async function(userData) {
        const SB = getSB();
        if (!SB) {
            notify("System initialization failure.");
            return;
        }

        try {
            // Check for existing user
            const { data: existing } = await SB.from('users')
                .select('id')
                .eq('email', userData.email.toLowerCase())
                .maybeSingle();

            if (existing) {
                notify("An account with this email already exists.");
                return;
            }

            const { error } = await SB.from('users').insert([{
                ...userData,
                email: userData.email.trim().toLowerCase(),
                role: userData.role || 'user',
                status: 'offline',
                created_at: new Date().toISOString()
            }]);

            if (error) throw error;

            notify("Account created successfully! Redirecting to login...");
            
            if (window.appRouter) {
                window.appRouter.navigateTo('/src/pages/login.html');
            } else {
                window.location.href = '/src/pages/login.html';
            }
        } catch (err) {
            console.error("[Auth] Registration error:", err);
            notify("Registration failed: " + (err.message || "Unknown error"));
        }
    };

    // --- IDENTITY SYNC HELPER ---
    window.syncSession = async function() {
        const auth = getAuth();
        if (!auth) {
            console.warn("[Auth] Client not ready for syncSession.");
            return null;
        }

        try {
            console.log("[Auth] Syncing session with backend...");
            // Corrected: InsForge SDK method is getCurrentUser()
            if (typeof auth.getCurrentUser !== 'function') {
                console.error("[Auth] getCurrentUser is not a function on auth client.");
                return null;
            }
            
            const { data, error } = await auth.getCurrentUser();
            if (error) throw error;
            
            const user = data?.user;
            if (user) {
                console.log("[Auth] Session recovered for:", user.email);
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userEmail', user.email);
                localStorage.setItem('currentUserEmail', user.email);
                localStorage.setItem('userId', user.id);
                
                // metadata in InsForge is typically in user.profile or user.metadata
                const profile = user.profile || {};
                if (profile.name) localStorage.setItem('userName', profile.name);
                if (profile.avatar_url) localStorage.setItem('userAvatar', profile.avatar_url);
                
                return user;
            } else {
                console.log("[Auth] No active session found.");
                localStorage.setItem('isLoggedIn', 'false');
            }
        } catch (err) {
            console.warn("[Auth] Session sync failed:", err.message || err);
        }
        return null;
    };

    // --- LOGOUT HANDLER ---
    window.logoutUser = function() {
        console.log("[Auth] Logging out...");
        localStorage.clear();
        localStorage.setItem('isLoggedIn', 'false');
        
        notify("Logged out successfully.");
        
        if (window.appRouter) {
            window.appRouter.navigateTo('/index.html');
        } else {
            window.location.href = '/index.html';
        }

        if (window.updateNavAuth) window.updateNavAuth();
    };

    // Compatibility shim for older onclick handlers
    window.logout = window.logoutUser;

})();
