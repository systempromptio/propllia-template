(function(AdminApp) {

const { escapeHtml } = AdminApp;

function renderActionPopup(row, config) {
    const id = escapeHtml(row.id);
    return `<td class="actions col-actions">
        <button class="btn-actions-trigger" data-id="${id}" aria-label="Acciones" aria-haspopup="true" aria-expanded="false" type="button">&#8942;</button>
    </td>`;
}

function _buildPopupHtml(id, config, row) {
    return `
        ${config.onRowClick ? `<button class="actions-popup-item" data-action="view" data-id="${id}" role="menuitem"><span class="popup-icon">&#9654;</span>View details</button>` : ''}
        ${row.imagen_carpeta ? `<button class="actions-popup-item" data-action="gallery" data-id="${id}" role="menuitem"><span class="popup-icon">&#128247;</span>View photos</button>` : ''}
        ${config.hasPdf ? `<button class="actions-popup-item" data-action="pdf" data-id="${id}" role="menuitem"><span class="popup-icon">&#128196;</span>Download PDF</button>` : ''}
        <button class="actions-popup-item" data-action="edit" data-id="${id}" role="menuitem"><span class="popup-icon">&#9998;</span>Edit</button>
        <button class="actions-popup-item" data-action="history" data-id="${id}" role="menuitem"><span class="popup-icon">&#128337;</span>History</button>
        <div class="actions-popup-separator"></div>
        <button class="actions-popup-item actions-popup-item--danger" data-action="delete" data-id="${id}" role="menuitem"><span class="popup-icon">&#10005;</span>Delete</button>`;
}

function closeAllPopups() {
    const popup = document.getElementById('actions-popup-portal');
    if (popup) {
        popup.classList.remove('open');
        const triggerId = popup.dataset.triggerId;
        if (triggerId) {
            const trigger = document.querySelector(`.btn-actions-trigger[data-id="${triggerId}"]`);
            if (trigger) {
                trigger.setAttribute('aria-expanded', 'false');
                trigger.classList.remove('active');
            }
        }
    }
}

function _getOrCreatePortal() {
    let portal = document.getElementById('actions-popup-portal');
    if (!portal) {
        portal = document.createElement('div');
        portal.id = 'actions-popup-portal';
        portal.className = 'actions-popup';
        portal.setAttribute('role', 'menu');
        portal.setAttribute('aria-label', 'Actions');
        document.body.appendChild(portal);
    }
    return portal;
}

function bindActionPopupEvents(tbody, dataTable) {
    tbody.querySelectorAll('.btn-actions-trigger').forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = trigger.dataset.id;
            const portal = _getOrCreatePortal();
            const isOpen = portal.classList.contains('open') && portal.dataset.triggerId === id;
            closeAllPopups();
            if (!isOpen) {
                const row = dataTable.data.find(r => r.id === id);
                if (!row) return;
                portal.innerHTML = _buildPopupHtml(id, dataTable.config, row);
                portal.dataset.triggerId = id;
                portal.classList.add('open');
                trigger.setAttribute('aria-expanded', 'true');
                trigger.classList.add('active');
                const rect = trigger.getBoundingClientRect();
                const popupH = portal.offsetHeight || 240;
                const spaceBelow = window.innerHeight - rect.bottom;
                if (spaceBelow < popupH) {
                    portal.style.top = `${rect.top - popupH}px`;
                } else {
                    portal.style.top = `${rect.bottom + 4}px`;
                }
                const popupW = portal.offsetWidth || 180;
                if (window.innerWidth < popupW + 16) {
                    portal.style.left = '8px';
                    portal.style.right = '8px';
                } else {
                    portal.style.right = `${window.innerWidth - rect.right}px`;
                    portal.style.left = '';
                }

                portal.querySelectorAll('.actions-popup-item').forEach(item => {
                    item.addEventListener('click', (ev) => {
                        ev.stopPropagation();
                        const action = item.dataset.action;
                        const itemId = item.dataset.id;
                        const itemRow = dataTable.data.find(r => r.id === itemId);
                        closeAllPopups();
                        if (action === 'view') {
                            if (itemRow && dataTable.config.onRowClick) dataTable.config.onRowClick(itemRow);
                        } else {
                            if (dataTable.config.onAction) dataTable.config.onAction(action, itemRow);
                        }
                    });
                });

                portal.addEventListener('keydown', function onKey(ev) {
                    const items = [...portal.querySelectorAll('.actions-popup-item')];
                    const idx = items.indexOf(document.activeElement);
                    if (ev.key === 'ArrowDown') { ev.preventDefault(); (items[idx + 1] || items[0]).focus(); }
                    else if (ev.key === 'ArrowUp') { ev.preventDefault(); (items[idx - 1] || items[items.length - 1]).focus(); }
                    else if (ev.key === 'Escape') {
                        closeAllPopups();
                        trigger.focus();
                        portal.removeEventListener('keydown', onKey);
                    }
                });

                const firstItem = portal.querySelector('.actions-popup-item');
                if (firstItem) firstItem.focus();
            }
        });
    });
}

function setupPopupDismissHandlers(container) {
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.btn-actions-trigger') && !e.target.closest('#actions-popup-portal')) {
            closeAllPopups();
        }
    });

    const tableScroll = container.querySelector('.table-scroll');
    if (tableScroll) {
        tableScroll.addEventListener('scroll', () => {
            closeAllPopups();
        });
    }
}

Object.assign(AdminApp, {
    renderActionPopup,
    bindActionPopupEvents,
    setupPopupDismissHandlers,
    closeAllPopups
});

})(window.AdminApp);
