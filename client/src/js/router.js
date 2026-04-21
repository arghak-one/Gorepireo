/**
 * GoRepireo SPA Router - ULTIMATE STABILITY RESET
 * Handles seamless navigation with CSS-first visibility and atomic swaps.
 */

class Router {
  constructor() {
    this.appContent = document.getElementById('app-content');
    this.progressBar = document.getElementById('loading-bar');
    this.cache = new Map();
    this.isNavigating = false;
    this.initialized = false;
    window.isSPA = true;
    window.appRouter = this;
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    console.log("[Router] Initializing Shell Infrastructure...");
    
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (this.isInternalLink(link)) {
        e.preventDefault();
        this.navigateTo(link.getAttribute('href'));

        // Auto-close mobile drawer if open
        const drawer = document.querySelector('.premium-side-drawer');
        if (drawer && drawer.classList.contains('active') && typeof window.togglePremiumDrawer === 'function') {
            window.togglePremiumDrawer();
        }
      }
    });

    window.addEventListener('popstate', () => {
      const path = window.location.pathname + window.location.search;
      this.loadPage(path, false);
    });

    const params = new URLSearchParams(window.location.search);
    const deepLink = params.get('p');
    const initialUrl = window.location.pathname.split('/').pop() || 'index.html';

    if (deepLink) {
        this.loadPage(deepLink, false);
    } else if (initialUrl !== 'index.html' && initialUrl !== '') {
        this.loadPage(initialUrl, false);
    } else {
        document.documentElement.classList.remove('is-subpage');
        this.updateActiveLinks('index.html');
        if (typeof window.checkAuth === 'function') window.checkAuth();
    }
  }

  isInternalLink(link) {
    if (!link) return false;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
    return true;
  }

  async navigateTo(url) {
    if (this.isNavigating) return;
    const currentPath = (window.location.pathname.split('/').pop() || 'index.html') + window.location.search;
    if (url === currentPath || url === '/' + currentPath) return;
    await this.loadPage(url, true);
  }

  async loadPage(url, pushState = true) {
    if (this.isNavigating) return;
    this.isNavigating = true;
    this.setProgressBar(30);

    try {
        let fetchUrl = url;
        const rawUrl = url || 'index.html';
        const [pathOnly, queryString = ''] = rawUrl.split('?');
        let cleanPath = pathOnly.startsWith('/') ? pathOnly.substring(1) : pathOnly;
        const querySuffix = queryString ? `?${queryString}` : '';
        
        // Path Mapping
        if (!cleanPath.startsWith('src/pages/') && cleanPath.endsWith('.html') && cleanPath !== 'index.html') {
            fetchUrl = `src/pages/${cleanPath}`;
        } else if (cleanPath === '' || cleanPath === 'index.html') {
            fetchUrl = 'index.html';
        } else {
            fetchUrl = cleanPath;
        }
        fetchUrl += querySuffix;

        // Visibility Guard
        if (cleanPath !== 'index.html' && cleanPath !== '') {
            document.documentElement.classList.add('is-subpage');
        } else {
            document.documentElement.classList.remove('is-subpage');
        }

        const response = await fetch(fetchUrl);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const html = await response.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        document.title = doc.title || "GoRepireo";

        const content = doc.querySelector('#app-content') || 
                        doc.querySelector('#page-content') || 
                        doc.querySelector('[id$="-fragment"]') || 
                        doc.querySelector('main') || 
                        doc.body;

        if (!content) throw new Error("No usable content found.");

        this.setProgressBar(60);
        this.injectPageStyles(doc); // Non-blocking in reset version for speed

        // Atomic Swap
        if (this.appContent) {
            this.appContent.innerHTML = content.innerHTML;
            this.appContent.id = 'app-content';
            
            if (pushState) {
                const filename = rawUrl.split('/').pop() || 'index.html';
                window.history.pushState({}, '', filename);
            }
            
            this.updateActiveLinks(url);
            this.executePageScripts(this.appContent);
            this.setProgressBar(100);
            
            window.dispatchEvent(new CustomEvent('page-loaded', { detail: { url } }));
            if (typeof window.checkAuth === 'function') window.checkAuth();
        }

        this.isNavigating = false;
        setTimeout(() => this.setProgressBar(0), 400);

    } catch (err) {
        console.error("[Router] Reset Error:", err);
        this.isNavigating = false;
        this.setProgressBar(0);
        if (url.includes('index.html')) window.location.reload();
    }
  }

  injectPageStyles(doc) {
    const head = doc.head;
    if (!head) return;
    head.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => {
        const href = el.getAttribute('href');
        if (href && (href.includes('font-awesome') || href.includes('fonts.googleapis.com'))) return;
        if (href && document.querySelector(`link[href="${href}"]`)) return;

        const newEl = document.createElement(el.tagName);
        Array.from(el.attributes).forEach(attr => newEl.setAttribute(attr.name, attr.value));
        newEl.setAttribute('data-router-css', 'true');
        if (el.tagName === 'STYLE') newEl.innerHTML = el.innerHTML;
        document.head.appendChild(newEl);
    });
  }

  executePageScripts(container) {
    if (!container) return;
    
    container.querySelectorAll('script').forEach(oldScript => {
      const src = oldScript.getAttribute('src');
      
      // Skip if external script is already in head
      if (src && document.head.querySelector(`script[src="${src}"]`)) return;
      
      const newScript = document.createElement('script');
      
      // Copy all attributes (including type="module")
      Array.from(oldScript.attributes).forEach(attr => {
          newScript.setAttribute(attr.name, attr.value);
      });
      
      if (src) {
          // External script logic
          newScript.src = src;
          document.head.appendChild(newScript);
      } else {
          // Inline script logic: append to body to force execution, then cleanup
          newScript.textContent = oldScript.textContent;
          document.body.appendChild(newScript);
          document.body.removeChild(newScript);
      }
      
      console.log(`[Router] Executed script: ${src || 'inline'}`);
    });
  }

  updateActiveLinks(url) {
    const filename = (url.split('/').pop() || 'index.html').split('?')[0];
    const normalized = filename === '' ? 'index.html' : filename;
    document.querySelectorAll('.desktop-nav-link, .mbn-item, .mobile-link').forEach(link => {
        const href = link.getAttribute('href') || '/';
        const linkFile = (href.split('/').pop() || 'index.html').split('?')[0];
        const active = (normalized === (linkFile || 'index.html'));
        link.classList.toggle('active', active);
    });
  }

  setProgressBar(percent) {
    if (!this.progressBar) return;
    this.progressBar.style.opacity = percent > 0 ? '1' : '0';
    this.progressBar.style.width = `${percent}%`;
  }
}

export const router = new Router();
router.init();
