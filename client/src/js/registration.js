/**
 * GoRepireo Registration Logic
 * Handles both Worker and Shop Partner registrations.
 */

(function() {
    console.log("[Registration] Logic Initialized.");

    // --- GLOBAL STATE ---
    let selectedDOB = null;

    // --- ROLE SWITCHING ---
    window.switchRole = function(role) {
        console.log("[Registration] Switching to:", role);
        const isWorker = role === 'worker';
        
        // Toggle Buttons
        const wBtn = document.getElementById('workerRoleBtn');
        const sBtn = document.getElementById('shopRoleBtn');
        if (wBtn) wBtn.classList.toggle('active', isWorker);
        if (sBtn) sBtn.classList.toggle('active', !isWorker);
        
        // Toggle Sections
        const wSec = document.getElementById('workerFormSection');
        const sSec = document.getElementById('shopFormSection');
        if (wSec) wSec.classList.toggle('hidden', !isWorker);
        if (sSec) sSec.classList.toggle('hidden', isWorker);
        
        // Update Headers
        const mainTitle = document.getElementById('mainFormTitle');
        const wTag = document.getElementById('workerTagline');
        const sTag = document.getElementById('shopTagline');
        
        if (mainTitle) {
            if (isWorker) {
                mainTitle.innerHTML = 'Join as a <em>Professional</em>';
                if(wTag) wTag.classList.remove('hidden');
                if(sTag) sTag.classList.add('hidden');
            } else {
                mainTitle.innerHTML = 'Become a <em>Store Partner</em>';
                if(wTag) wTag.classList.add('hidden');
                if(sTag) sTag.classList.remove('hidden');
            }
        }

        // Reset any error states on UI change
        document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // --- CUSTOM DROPDOWNS ---
    window.toggleCustomSelect = function(id) {
        document.querySelectorAll('.custom-select-wrapper').forEach(w => {
            if(w.id !== id) w.classList.remove('open');
        });
        const target = document.getElementById(id);
        if (target) target.classList.toggle('open');
    };

    // --- CALENDAR LOGIC ---
    window.toggleCalendar = function() {
        const p = document.getElementById('calendarPopup');
        if (!p) return;
        p.style.display = p.style.display === 'block' ? 'none' : 'block';
        if (p.style.display === 'block') window.renderRegistrationCalendar(new Date());
    };

    window.renderRegistrationCalendar = function(date) {
        const grid = document.getElementById('calendarGrid');
        const monthText = document.getElementById('calendarMonth');
        if (!grid || !monthText) return;

        grid.innerHTML = '';
        const year = date.getFullYear();
        const month = date.getMonth();
        monthText.innerText = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            const day = document.createElement('div');
            day.className = 'calendar-day';
            day.innerText = i;
            day.onclick = (e) => {
                e.stopPropagation();
                selectedDOB = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                const trigger = document.getElementById('dateTrigger');
                const dobInput = document.getElementById('dob');
                if(trigger) trigger.innerText = selectedDOB;
                if(dobInput) dobInput.value = selectedDOB;
                window.toggleCalendar();
            };
            grid.appendChild(day);
        }
    };

    // Navigation for calendar
    let currentCalDate = new Date();
    window.prevNav = function(e) {
        e.stopPropagation();
        currentCalDate.setMonth(currentCalDate.getMonth() - 1);
        window.renderRegistrationCalendar(currentCalDate);
    };
    window.nextNav = function(e) {
        e.stopPropagation();
        currentCalDate.setMonth(currentCalDate.getMonth() + 1);
        window.renderRegistrationCalendar(currentCalDate);
    };

    // --- SUBMISSION LOGIC ---
    window.submitWorkerApplication = async function() {
        const fields = {
            from_name: document.getElementById('fname')?.value,
            dob: document.getElementById('dob')?.value,
            gender: document.getElementById('gender')?.value,
            mobile: document.getElementById('mobile')?.value,
            whatsapp: document.getElementById('whatsapp')?.value,
            email: document.getElementById('email')?.value,
            service: document.getElementById('service')?.value,
            experience: document.getElementById('experience')?.value,
            pincode: document.getElementById('pincode')?.value,
            district: document.getElementById('district')?.value,
            state: document.getElementById('state')?.value,
            address: document.getElementById('address')?.value,
            tools: document.getElementById('hasTools')?.checked ? 'Yes' : 'No'
        };

        for (const [key, val] of Object.entries(fields)) {
            if (!val && key !== 'tools') {
                alert(`Please fill the ${key.replace('_', ' ')} field.`);
                const fieldEl = document.getElementById(key === 'from_name' ? 'fname' : key);
                if(fieldEl) fieldEl.classList.add('input-error');
                return;
            }
        }

        const SB = window.getSB ? window.getSB() : (window.supabaseClient || window.dbClient?.database);
        if (!SB) { alert("Initialization failure."); return; }

        const appId = 'OH-P-' + Math.floor(Math.random() * 90000 + 10000);

        try {
            const { error } = await SB.from('worker_applications').insert([{
                ...fields,
                app_id: appId,
                status_level: 1,
                login_access: false,
                created_at: new Date().toISOString()
            }]);

            if (error) throw error;
            showSuccess(appId);
        } catch (err) {
            console.error(err);
            alert("Submission failed: " + err.message);
        }
    };

    window.submitShopPartner = async function() {
        const fields = {
            shop_name: document.getElementById('shopName')?.value,
            owner_name: document.getElementById('ownerName')?.value,
            email: document.getElementById('shopEmail')?.value,
            phone: document.getElementById('shopPhone')?.value,
            address: document.getElementById('shopAddress')?.value
        };

        for (const [key, val] of Object.entries(fields)) {
            if (!val) { alert("Please fill all mandatory fields."); return; }
        }

        const SB = window.getSB ? window.getSB() : (window.supabaseClient || window.dbClient?.database);
        const appId = 'OH-S-' + Math.floor(Math.random() * 90000 + 10000);

        try {
            const { error } = await SB.from('shop_applications').insert([{
                ...fields,
                status: 'pending',
                created_at: new Date().toISOString()
            }]);

            if (error) throw error;
            showSuccess(appId);
        } catch (err) {
            console.error(err);
            alert("Submission failed: " + err.message);
        }
    };

    function showSuccess(appId) {
        const container = document.getElementById('formContainer');
        const success = document.getElementById('successScreen');
        const display = document.getElementById('displayAppId');
        
        if(container) container.classList.add('hidden');
        if(success) success.classList.remove('hidden');
        if(display) display.innerText = appId;
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Auto-bind selection clicks for any fragments that reload
    function bindOptions() {
        document.querySelectorAll('.custom-option').forEach(opt => {
            opt.onclick = function() {
                const val = this.getAttribute('data-value');
                const wrapper = this.closest('.custom-select-wrapper');
                if(!wrapper) return;
                
                const trigger = wrapper.querySelector('.custom-select-trigger');
                if(trigger) trigger.innerText = this.innerText;
                
                const select = wrapper.querySelector('select') || wrapper.querySelector('input[type="hidden"]');
                if(select) select.value = val;
                
                wrapper.classList.remove('open');
            };
        });
    }

    // Initialize on load and on any SPA navigation
    window.addEventListener('page-loaded', () => {
        console.log("[Registration] Re-binding UI elements...");
        bindOptions();
    });

    // Initial bind
    document.addEventListener('DOMContentLoaded', bindOptions);
})();
