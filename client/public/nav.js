/* ================================================
   GOREPIREO MOBILE NAVIGATION LOGIC
   Handles bottom-nav active states and side drawer
   ================================================ */

(function() {
    // 1. Toggle Side Drawer
    window.togglePremiumDrawer = function() {
        const drawer = document.querySelector('.premium-side-drawer');
        const overlay = document.querySelector('.drawer-overlay');
        if (drawer && overlay) {
            drawer.classList.toggle('active');
            overlay.classList.toggle('active');
        }
    };

    // 2. Update Bottom Nav States
    function updateBottomNav() {
        const navItems = document.querySelectorAll('.mobile-bottom-nav .mbn-item');
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        const scriptTag = document.querySelector('script[src*="nav.js"]');
        const activePage = scriptTag ? scriptTag.getAttribute('data-page') : null;

        navItems.forEach(item => {
            const href = item.getAttribute('href');
            item.classList.remove('active');

            // Match by data-page if specified
            if (activePage && href.includes(activePage)) {
                 item.classList.add('active');
            } 
            // Match by current URL path
            else if (href === currentPath) {
                item.classList.add('active');
            }
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateBottomNav);
    } else {
        updateBottomNav();
    }
})();
