(function(AdminApp) {

function openPanel(instance, title) {
    if (instance.panel || instance.overlay) {
        if (instance.overlay && instance.overlay.parentNode) instance.overlay.remove();
        if (instance.panel && instance.panel.parentNode) instance.panel.remove();
        instance.overlay = null;
        instance.panel = null;
        instance._closing = false;
    }

    instance.overlay = document.createElement('div');
    instance.overlay.className = 'panel-overlay';

    instance.panel = document.createElement('div');
    instance.panel.className = 'side-panel';
    instance.panel.innerHTML = `
        <div class="panel-header">
            <h2>${title}</h2>
            <button class="panel-close">\u00D7</button>
        </div>
        <div class="panel-body">
            <div class="panel-loading"><div class="loading-spinner"></div></div>
        </div>`;

    instance.panel.addEventListener('click', e => e.stopPropagation());
    instance.panel.querySelector('.panel-close').addEventListener('click', () => instance.close());
    instance.overlay.addEventListener('click', (e) => {
        if (e.target === instance.overlay) instance.close();
    });

    document.body.appendChild(instance.overlay);
    document.body.appendChild(instance.panel);
    AdminApp.ScrollLock.lock();

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            if (instance.overlay) instance.overlay.classList.add('open');
            if (instance.panel) instance.panel.classList.add('open');
        });
    });
}

function closePanel(instance) {
    if (instance._closing) return;
    if (!instance.panel && !instance.overlay) return;
    instance._closing = true;
    if (instance.panel) instance.panel.classList.remove('open');
    if (instance.overlay) instance.overlay.classList.remove('open');
    setTimeout(() => {
        if (instance.overlay && instance.overlay.parentNode) { instance.overlay.remove(); }
        if (instance.panel && instance.panel.parentNode) { instance.panel.remove(); }
        instance.overlay = null;
        instance.panel = null;
        instance._closing = false;
        AdminApp.ScrollLock.unlock();
    }, 350);
}

Object.assign(AdminApp, { openPanel, closePanel });

})(window.AdminApp);
