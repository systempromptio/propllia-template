(function(AdminApp) {

const { api, Toast, confirmAction, escapeHtml } = AdminApp;

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const _fotosState = { webImages: [], activoWebId: null };

function renderImageCard(img) {
    const isPrimary = img.is_primary ? ' active' : '';
    const isWeb = _fotosState.webImages.includes(img.filename);
    const webIdx = isWeb ? _fotosState.webImages.indexOf(img.filename) + 1 : 0;
    return `<div class="image-manage-card${isWeb ? ' web-selected' : ''}" data-filename="${escapeHtml(img.filename)}" draggable="true">
        <div class="image-manage-handle" title="Drag to reorder">&#9776;</div>
        ${isWeb ? `<div class="image-web-badge">${webIdx}</div>` : ''}
        <img class="image-manage-thumb" src="${escapeHtml(img.url)}" alt="${escapeHtml(img.filename)}">
        <div class="image-manage-info">
            <span class="image-manage-name">${escapeHtml(img.filename)}</span>
            <button class="image-manage-web${isWeb ? ' active' : ''}" title="${isWeb ? 'Remove from web' : 'Publish to web'}">&#127760;</button>
            <button class="image-manage-primary${isPrimary}" title="Primary image">&#9733;</button>
            <button class="image-manage-delete" title="Delete">&#10005;</button>
        </div>
    </div>`;
}

async function loadWebImages(activoId) {
    try {
        const data = await api.get(`/property_web/by-activo/${activoId}`);
        _fotosState.activoWebId = data.id;
        _fotosState.webImages = data.imagenes_web || [];
    } catch (e) {
        _fotosState.activoWebId = null;
        _fotosState.webImages = [];
    }
}

async function saveWebImages() {
    if (!_fotosState.activoWebId) return;
    try {
        await api.put(`/property_web/${_fotosState.activoWebId}`, { imagees_web: _fotosState.webImages });
    } catch (err) {
        Toast.show('Error saving web selection: ' + err.message, 'error');
    }
}

async function toggleWebImage(filename, grid, activoId) {
    const idx = _fotosState.webImages.indexOf(filename);
    if (idx >= 0) {
        _fotosState.webImages.splice(idx, 1);
        Toast.show('Image removed from web');
    } else {
        if (!_fotosState.activoWebId) {
            try {
                const created = await api.post('/property_web', { activo_id: activoId, publicado: 'false' });
                _fotosState.activoWebId = created.id;
            } catch (err) {
                Toast.show('Error creating web listing: ' + err.message, 'error');
                return;
            }
        }
        _fotosState.webImages.push(filename);
        Toast.show('Image added to web (#' + _fotosState.webImages.length + ')');
    }
    await saveWebImages();
    refreshWebBadges(grid);
}

function refreshWebBadges(grid) {
    grid.querySelectorAll('.image-manage-card').forEach(card => {
        const fn = card.dataset.filename;
        const isWeb = _fotosState.webImages.includes(fn);
        const webIdx = isWeb ? _fotosState.webImages.indexOf(fn) + 1 : 0;
        card.classList.toggle('web-selected', isWeb);

        let badge = card.querySelector('.image-web-badge');
        if (isWeb) {
            if (!badge) {
                badge = document.createElement('div');
                badge.className = 'image-web-badge';
                card.insertBefore(badge, card.querySelector('.image-manage-thumb'));
            }
            badge.textContent = webIdx;
        } else if (badge) {
            badge.remove();
        }

        const webBtn = card.querySelector('.image-manage-web');
        if (webBtn) {
            webBtn.classList.toggle('active', isWeb);
            webBtn.title = isWeb ? 'Remove from web' : 'Publish to web';
        }
    });
}

async function loadImageGrid(grid, activoId) {
    try {
        const data = await api.get(`/properties/${activoId}/images`);
        const images = Array.isArray(data) ? data : (data.images || []);
        if (images.length === 0) {
            grid.innerHTML = '<p class="image-manage-empty">No images. Upload the first one.</p>';
        } else {
            grid.innerHTML = images.map(img => renderImageCard(img)).join('');
            initDragReorder(grid, activoId);
        }
    } catch (e) {
        grid.innerHTML = `<p class="text-danger">Error loading imagees: ${escapeHtml(e.message)}</p>`;
    }
}

function initDragReorder(grid, activoId) {
    let dragEl = null;

    grid.querySelectorAll('.image-manage-card').forEach(card => {
        card.addEventListener('dragstart', (e) => {
            dragEl = card;
            card.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        card.addEventListener('dragend', () => {
            if (dragEl) dragEl.classList.remove('dragging');
            dragEl = null;
            grid.querySelectorAll('.image-manage-card').forEach(c => c.classList.remove('drag-over'));
        });

        card.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (card !== dragEl) {
                card.classList.add('drag-over');
            }
        });

        card.addEventListener('dragleave', () => {
            card.classList.remove('drag-over');
        });

        card.addEventListener('drop', async (e) => {
            e.preventDefault();
            card.classList.remove('drag-over');
            if (!dragEl || dragEl === card) return;

            const cards = [...grid.querySelectorAll('.image-manage-card')];
            const fromIdx = cards.indexOf(dragEl);
            const toIdx = cards.indexOf(card);
            if (fromIdx < toIdx) {
                card.after(dragEl);
            } else {
                card.before(dragEl);
            }

            const order = [...grid.querySelectorAll('.image-manage-card')].map(c => c.dataset.filename);
            try {
                await api.put(`/properties/${activoId}/images/order`, { order });
                Toast.show('Order updated');
            } catch (err) {
                Toast.show('Error reordering: ' + err.message, 'error');
            }
        });
    });
}

function initFotosTab(container, activoId, initialImages) {
    container.innerHTML = `
        <div class="image-fotos-legend">
            <span><span class="legend-icon">&#127760;</span> = publish to web</span>
            <span><span class="legend-icon">&#9733;</span> = primary image</span>
            <span><span class="legend-icon">&#9776;</span> = drag to reorder</span>
        </div>
        <div class="image-upload-zone" id="image-drop-zone">
            <input type="file" id="image-file-input" multiple accept="image/*" hidden>
            <p>Drag images here or <a href="#" id="image-browse-link">select files</a></p>
            <p class="upload-hint">JPG, PNG, GIF, WebP — Max 10 MB</p>
        </div>
        <div class="image-manage-grid" id="image-manage-grid"></div>`;

    const dropZone = container.querySelector('#image-drop-zone');
    const fileInput = container.querySelector('#image-file-input');
    const browseLink = container.querySelector('#image-browse-link');
    const grid = container.querySelector('#image-manage-grid');

    browseLink.addEventListener('click', (e) => {
        e.preventDefault();
        fileInput.click();
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            handleFiles(fileInput.files, activoId, grid);
            fileInput.value = '';
        }
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', (e) => {
        if (!dropZone.contains(e.relatedTarget)) {
            dropZone.classList.remove('drag-over');
        }
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files, activoId, grid);
        }
    });

    grid.addEventListener('click', async (e) => {
        const card = e.target.closest('.image-manage-card');
        if (!card) return;
        const filename = card.dataset.filename;

        if (e.target.closest('.image-manage-web')) {
            await toggleWebImage(filename, grid, activoId);
            return;
        }

        if (e.target.closest('.image-manage-primary')) {
            try {
                await api.put(`/properties/${activoId}/images/primary`, { filename });
                grid.querySelectorAll('.image-manage-primary').forEach(b => b.classList.remove('active'));
                e.target.closest('.image-manage-primary').classList.add('active');
                Toast.show('Primary image updated');
            } catch (err) {
                Toast.show('Error: ' + err.message, 'error');
            }
            return;
        }

        if (e.target.closest('.image-manage-delete')) {
            const ok = await confirmAction('Delete image', 'Delete "' + filename + '"?');
            if (!ok) return;
            try {
                await api.del(`/properties/${activoId}/images/${encodeURIComponent(filename)}`);
                const webIdx = _fotosState.webImages.indexOf(filename);
                if (webIdx >= 0) {
                    _fotosState.webImages.splice(webIdx, 1);
                    await saveWebImages();
                }
                card.remove();
                Toast.show('Image deleted');
                if (grid.querySelectorAll('.image-manage-card').length === 0) {
                    grid.innerHTML = '<p class="image-manage-empty">No images. Upload the first one.</p>';
                }
            } catch (err) {
                Toast.show('Error: ' + err.message, 'error');
            }
            return;
        }
    });

    (async () => {
        await loadWebImages(activoId);
        await loadImageGrid(grid, activoId);
    })();
}

async function handleFiles(files, activoId, grid) {
    let uploaded = 0;
    let failed = 0;

    for (const file of files) {
        if (file.size > MAX_FILE_SIZE_BYTES) {
            Toast.show(`"${file.name}" exceeds 10 MB`, 'error');
            failed++;
            continue;
        }
        try {
            await api.uploadFile(`/properties/${activoId}/images/upload`, file);
            uploaded++;
        } catch (e) {
            Toast.show(`Error uploading "${file.name}": ${e.message}`, 'error');
            failed++;
        }
    }

    if (uploaded > 0) {
        Toast.show(`${uploaded} image${uploaded !== 1 ? 's' : ''} uploaded`);
        await loadImageGrid(grid, activoId);
    }
}

Object.assign(AdminApp, { initFotosTab });

})(window.AdminApp);
