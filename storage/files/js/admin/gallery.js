(function(AdminApp) {

const {
    api, Toast, escapeHtml,
    statusBadge, formatCurrency,
    formatDate, progressBar
} = AdminApp;

const PropertyPresentation = {
    overlay: null,
    lightbox: null,
    images: [],
    currentIndex: 0,
    _keyHandler: null,

    async open(activoId) {
        try {
            const data = await api.get(`/properties/${activoId}/detail`);
            const a = data.property;
            const f = data.financial;
            const images = data.images || [];
            this.images = images;
            this.currentIndex = 0;

            const overlay = document.createElement('div');
            overlay.className = 'presentation-overlay';
            overlay.innerHTML = `
                <div class="presentation-modal">
                    <div class="presentation-header">
                        <h2>${escapeHtml(a.property_name)}</h2>
                        ${statusBadge(a.status, 'property')}
                        <button class="presentation-close">&times;</button>
                    </div>
                    <div class="presentation-content">
                        <div class="presentation-gallery">
                            ${this._renderGallery(images)}
                        </div>
                        <div class="presentation-details">
                            ${this._renderDetails(a, f)}
                        </div>
                    </div>
                </div>`;

            document.body.appendChild(overlay);
            this.overlay = overlay;
            AdminApp.ScrollLock.lock();

            requestAnimationFrame(() => overlay.classList.add('active'));

            overlay.querySelector('.presentation-close').addEventListener('click', () => this.close());
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) this.close();
            });

            overlay.querySelectorAll('.gallery-thumbnail').forEach((img, i) => {
                img.addEventListener('click', () => this.openLightbox(i));
            });

            this._keyHandler = (e) => this._handleKey(e);
            document.addEventListener('keydown', this._keyHandler);
        } catch (e) {
            Toast.show('Error loading property: ' + e.message, 'error');
        }
    },

    _renderGallery(images) {
        if (images.length === 0) {
            return '<div class="gallery-empty">No photos available</div>';
        }
        return `
            <div class="gallery-grid">
                ${images.map((img, i) => `<div class="gallery-thumb-wrapper">
                    <img class="gallery-thumbnail" src="${escapeHtml(img.url)}" alt="${escapeHtml(img.filename)}" loading="lazy" data-index="${i}">
                    ${img.is_primary ? '<span class="gallery-primary-badge">&#9733;</span>' : ''}
                </div>`).join('')}
            </div>
            <div class="gallery-count">${images.length} photo${images.length !== 1 ? 's' : ''}</div>`;
    },

    _renderDetails(a, f) {
        let html = '';

        html += `<div class="presentation-info-group">
            <h4>Location</h4>
            <div class="presentation-info-row"><span class="label">Address</span><span class="value">${escapeHtml(a.address)}</span></div>
            ${a.cadastral_ref ? `<div class="presentation-info-row"><span class="label">Cadastral ref</span><span class="value">${escapeHtml(a.cadastral_ref)}</span></div>` : ''}
        </div>`;

        const hasStats = a.area_sqm || a.bedrooms || a.year_built;
        if (hasStats) {
            html += `<div class="presentation-stats">
                ${a.area_sqm ? `<div class="presentation-stat"><div class="stat-value">${a.area_sqm}</div><div class="stat-label">m&sup2;</div></div>` : ''}
                ${a.bedrooms ? `<div class="presentation-stat"><div class="stat-value">${a.bedrooms}</div><div class="stat-label">Bedrooms</div></div>` : ''}
                ${a.year_built ? `<div class="presentation-stat"><div class="stat-value">${a.year_built}</div><div class="stat-label">Year</div></div>` : ''}
            </div>`;
        }

        if (a.contract_ref || a.rent) {
            html += `<div class="presentation-info-group">
                <h4>Contract</h4>
                ${a.contract_ref ? `<div class="presentation-info-row"><span class="label">Contract</span><span class="value">${escapeHtml(a.contract_ref)}</span></div>` : ''}
                ${a.rent ? `<div class="presentation-info-row"><span class="label">Monthly rent</span><span class="value">${formatCurrency(a.rent)}</span></div>` : ''}
                ${a.start_date ? `<div class="presentation-info-row"><span class="label">Start</span><span class="value">${formatDate(a.start_date)}</span></div>` : ''}
                ${a.end_date ? `<div class="presentation-info-row"><span class="label">End</span><span class="value">${formatDate(a.end_date)}</span></div>` : ''}
            </div>`;
        }

        if (f) {
            const facturado = parseFloat(f.total_invoiced || 0);
            const collected = parseFloat(f.total_collected || 0);
            const outstanding = parseFloat(f.total_outstanding || 0);

            html += `<div class="presentation-info-group">
                <h4>Financial summary</h4>
                <div class="presentation-financial-cards">
                    <div class="presentation-financial-card billed"><div class="fin-value">${formatCurrency(facturado)}</div><div class="fin-label">Invoiced</div></div>
                    <div class="presentation-financial-card collected"><div class="fin-value">${formatCurrency(collected)}</div><div class="fin-label">Collected</div></div>
                    <div class="presentation-financial-card pending"><div class="fin-value">${formatCurrency(outstanding)}</div><div class="fin-label">Outstanding</div></div>
                </div>
            </div>`;
        }

        if (a.tags && a.tags.length) {
            html += `<div class="presentation-info-group">
                <h4>Tags</h4>
                <div class="presentation-tags">
                    ${a.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
                </div>
            </div>`;
        }

        return html;
    },

    openLightbox(index) {
        this.currentIndex = index;
        const img = this.images[index];
        if (!img) return;

        const lb = document.createElement('div');
        lb.className = 'lightbox-overlay';
        lb.innerHTML = `
            <button class="lightbox-close">&times;</button>
            ${this.images.length > 1 ? `<button class="lightbox-nav prev">&#8249;</button><button class="lightbox-nav next">&#8250;</button>` : ''}
            <img class="lightbox-image" src="${escapeHtml(img.url)}" alt="${escapeHtml(img.filename)}">
            <div class="lightbox-counter">${index + 1} / ${this.images.length}</div>`;

        document.body.appendChild(lb);
        this.lightbox = lb;
        requestAnimationFrame(() => lb.classList.add('active'));

        lb.querySelector('.lightbox-close').addEventListener('click', () => this.closeLightbox());
        lb.addEventListener('click', (e) => {
            if (e.target === lb) this.closeLightbox();
        });

        const prevBtn = lb.querySelector('.lightbox-nav.prev');
        const nextBtn = lb.querySelector('.lightbox-nav.next');
        if (prevBtn) prevBtn.addEventListener('click', () => this.navigateLightbox(-1));
        if (nextBtn) nextBtn.addEventListener('click', () => this.navigateLightbox(1));
    },

    navigateLightbox(dir) {
        if (!this.lightbox || this.images.length === 0) return;
        this.currentIndex = (this.currentIndex + dir + this.images.length) % this.images.length;
        const img = this.images[this.currentIndex];
        this.lightbox.querySelector('.lightbox-image').src = img.url;
        this.lightbox.querySelector('.lightbox-counter').textContent = `${this.currentIndex + 1} / ${this.images.length}`;
    },

    closeLightbox() {
        if (!this.lightbox) return;
        this.lightbox.classList.remove('active');
        setTimeout(() => {
            if (this.lightbox) {
                this.lightbox.remove();
                this.lightbox = null;
            }
        }, 250);
    },

    close() {
        if (this._keyHandler) {
            document.removeEventListener('keydown', this._keyHandler);
            this._keyHandler = null;
        }
        this.closeLightbox();
        if (!this.overlay) return;
        this.overlay.classList.remove('active');
        setTimeout(() => {
            if (this.overlay) {
                this.overlay.remove();
                this.overlay = null;
            }
            AdminApp.ScrollLock.unlock();
        }, 350);
    },

    _handleKey(e) {
        if (e.key === 'Escape') {
            if (this.lightbox) {
                this.closeLightbox();
            } else {
                this.close();
            }
        } else if (this.lightbox) {
            if (e.key === 'ArrowLeft') this.navigateLightbox(-1);
            if (e.key === 'ArrowRight') this.navigateLightbox(1);
        }
    }
};

window.PropertyPresentation = PropertyPresentation;

Object.assign(AdminApp, { PropertyPresentation });

})(window.AdminApp);
