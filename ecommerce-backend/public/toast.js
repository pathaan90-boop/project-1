(function() {
    function initToast() {
        if (document.getElementById("toast-container-root")) return;

        const style = document.createElement('style');
        style.textContent = `
        .toast-container{position:fixed;top:25px;right:25px;z-index:999999;display:flex;flex-direction:column;gap:12px;pointer-events:none}
        .toast{padding:14px 24px;border-radius:12px;color:white;font-weight:600;min-width:280px;max-width:400px;box-shadow:0 10px 30px rgba(0,0,0,0.5);animation:slideInToast 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);backdrop-filter:blur(10px);pointer-events:auto;display:flex;align-items:center;gap:10px;font-size:14px;letter-spacing:0.3px}
        .toast.success{background:linear-gradient(135deg,rgba(0,210,106,0.95),rgba(0,168,84,0.95));border:1px solid #00ff85}
        .toast.error{background:linear-gradient(135deg,rgba(255,59,95,0.95),rgba(224,32,64,0.95));border:1px solid #ff6584}
        .toast.info{background:linear-gradient(135deg,rgba(255,123,34,0.95),rgba(255,157,87,0.95));border:1px solid #ffa366}
        @keyframes slideInToast{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}
        `;
        document.head.appendChild(style);

        const container = document.createElement('div');
        container.id = 'toast-container-root';
        container.className = 'toast-container';
        if (document.body) {
            document.body.appendChild(container);
        } else {
            window.addEventListener('DOMContentLoaded', () => document.body.appendChild(container));
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initToast);
    } else {
        initToast();
    }

    window.showToast = function(msg, type = 'info') {
        let container = document.getElementById('toast-container-root');
        if (!container && document.body) {
            initToast();
            container = document.getElementById('toast-container-root');
        }
        if (!container) return;

        const icon = type === 'success' ? '✓ ' : type === 'error' ? '✕ ' : 'ℹ ';
        const t = document.createElement('div');
        t.className = 'toast ' + type;
        t.innerText = icon + msg;
        container.appendChild(t);

        setTimeout(() => {
            t.style.transition = 'all 0.3s ease';
            t.style.opacity = '0';
            t.style.transform = 'translateY(-10px)';
            setTimeout(() => t.remove(), 300);
        }, 3200);
    };
})();