document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginOverlay = document.getElementById('login-overlay');
    const dashboard = document.getElementById('dashboard');
    const loginError = document.getElementById('login-error');

    const profileForm = document.getElementById('profile-form');
    const formFeedback = document.getElementById('form-feedback');
    const submitBtn = profileForm.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('.btn-text');
    const loader = submitBtn.querySelector('.loader');

    const grid = document.getElementById('operators-grid');
    const emptyState = document.getElementById('empty-state');
    const counter = document.getElementById('counter');
    const searchInput = document.getElementById('search');
    const toggleModeBtn = document.getElementById('toggle-mode');
    const openNewBtn = document.getElementById('open-new');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalClose = document.getElementById('modal-close');
    const btnCancel = document.getElementById('btn-cancel');
    const modalTitle = document.getElementById('modal-title');
    const editIdField = document.getElementById('edit-id');
    const traitsContainer = document.getElementById('traits-container');
    const lineaSel = document.getElementById('linea');
    const sectorSel = document.getElementById('sector');
    const afinidadSel = document.getElementById('afinidad');
    const semDots = document.querySelectorAll('.sem-dot');

    const state = {
        operators: [],
        traits: [],
        selectedTraits: new Set(),
        semaforo: 'green',
        viewMode: 'public',
        search: '',
    };

    function fillSelect(sel, options) {
        sel.innerHTML = options.map(o => `<option value="${o}">${o}</option>`).join('');
    }

    function renderTraits() {
        traitsContainer.innerHTML = state.traits.map(t => {
            const active = state.selectedTraits.has(t) ? 'active' : '';
            return `<button type="button" class="trait-chip ${active}" data-trait="${t}">${t}</button>`;
        }).join('');
        traitsContainer.querySelectorAll('.trait-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                const t = btn.dataset.trait;
                if (state.selectedTraits.has(t)) state.selectedTraits.delete(t);
                else state.selectedTraits.add(t);
                renderTraits();
            });
        });
    }

    function updateSemaforoUI() {
        semDots.forEach(d => {
            d.classList.toggle('active', d.dataset.value === state.semaforo);
        });
    }

    semDots.forEach(d => {
        d.addEventListener('click', () => {
            state.semaforo = d.dataset.value;
            updateSemaforoUI();
        });
    });

    async function loadConfig() {
        const res = await fetch('/api/config');
        const cfg = await res.json();
        fillSelect(lineaSel, cfg.lineas);
        fillSelect(sectorSel, cfg.sectores);
        fillSelect(afinidadSel, cfg.colaboradores);
        state.traits = cfg.traits;
        renderTraits();
    }

    async function loadOperators() {
        const res = await fetch('/api/perfiles');
        const data = await res.json();
        state.operators = data.perfiles || [];
        renderGrid();
    }

    function escapeHtml(str) {
        return (str || '').replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[c]);
    }

    function renderGrid() {
        const q = state.search.toLowerCase();
        const filtered = state.operators.filter(op =>
            (op.nombre || '').toLowerCase().includes(q) ||
            (op.linea || '').toLowerCase().includes(q) ||
            (op.sector || '').toLowerCase().includes(q)
        );

        counter.textContent = `${filtered.length} agente${filtered.length === 1 ? '' : 's'}`;

        if (filtered.length === 0) {
            grid.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }
        emptyState.classList.add('hidden');

        grid.innerHTML = filtered.map(op => {
            const traits = (op.perfilProfesional || [])
                .map(t => `<span class="chip">${escapeHtml(t)}</span>`).join('');
            const semClass = op.semaforo || 'green';
            const photo = op.fotoUrl
                ? `<img src="${escapeHtml(op.fotoUrl)}" alt="">`
                : `<div class="avatar-placeholder">${escapeHtml((op.nombre || '?').charAt(0).toUpperCase())}</div>`;

            const publicBody = `
                <div class="card-section">
                    <div class="section-label">Perfil RRHH</div>
                    <div class="chips">${traits || '<span class="muted small">Sin tags</span>'}</div>
                    <div class="contact-row">
                        ${op.email ? `<span class="contact">✉ ${escapeHtml(op.email)}</span>` : ''}
                        ${op.celular ? `<span class="contact">☎ ${escapeHtml(op.celular)}</span>` : ''}
                    </div>
                </div>`;

            const privateBody = `
                <div class="card-section lado-b-card">
                    <div class="section-label amber">Estrategia Lado B</div>
                    <p class="lado-b-text">"${escapeHtml(op.perfilInterno || 'Sin notas.')}"</p>
                    <div class="lado-b-meta">
                        <span>Habla: <strong>${escapeHtml(op.afinidad || 'Ninguno')}</strong></span>
                        <span class="trato trato-${semClass}">Trato: ${semClass}</span>
                    </div>
                    ${op.vinculo ? `<div class="vinculo"><em>Vínculo:</em> ${escapeHtml(op.vinculo)}</div>` : ''}
                </div>`;

            return `
                <article class="op-card">
                    <div class="op-head">
                        <div class="avatar">
                            ${photo}
                            <span class="dot dot-${semClass}"></span>
                        </div>
                        <div class="op-id">
                            <h3>${escapeHtml(op.nombre || 'Sin nombre')}</h3>
                            <div class="tags">
                                <span class="tag tag-linea">Línea ${escapeHtml(op.linea || '-')}</span>
                                <span class="tag tag-sector">${escapeHtml(op.sector || '-')}</span>
                            </div>
                        </div>
                        <div class="op-actions">
                            <button class="icon-btn" data-action="edit" data-id="${op.id}" title="Editar">✎</button>
                            <button class="icon-btn danger" data-action="delete" data-id="${op.id}" title="Eliminar">🗑</button>
                        </div>
                    </div>
                    ${state.viewMode === 'public' ? publicBody : privateBody}
                </article>`;
        }).join('');

        grid.querySelectorAll('button[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                if (btn.dataset.action === 'edit') openEdit(id);
                if (btn.dataset.action === 'delete') confirmDelete(id);
            });
        });
    }

    function resetForm() {
        editIdField.value = '';
        modalTitle.textContent = 'Nuevo Agente';
        profileForm.reset();
        state.selectedTraits = new Set();
        state.semaforo = 'green';
        renderTraits();
        updateSemaforoUI();
        formFeedback.textContent = '';
        formFeedback.className = 'feedback-msg';
    }

    function openModal() {
        modalOverlay.classList.remove('hidden');
    }

    function closeModal() {
        modalOverlay.classList.add('hidden');
        resetForm();
    }

    function openNew() {
        resetForm();
        openModal();
    }

    function openEdit(id) {
        const op = state.operators.find(o => o.id === id);
        if (!op) return;
        resetForm();
        modalTitle.textContent = 'Editar Agente';
        editIdField.value = op.id;
        document.getElementById('nombre').value = op.nombre || '';
        document.getElementById('celular').value = op.celular || '';
        document.getElementById('email').value = op.email || '';
        document.getElementById('fotoUrl').value = op.fotoUrl || '';
        document.getElementById('vinculo').value = op.vinculo || '';
        document.getElementById('perfilInterno').value = op.perfilInterno || '';
        lineaSel.value = op.linea || lineaSel.options[0].value;
        sectorSel.value = op.sector || sectorSel.options[0].value;
        afinidadSel.value = op.afinidad || 'Ninguno';
        state.selectedTraits = new Set(op.perfilProfesional || []);
        state.semaforo = op.semaforo || 'green';
        renderTraits();
        updateSemaforoUI();
        openModal();
    }

    async function confirmDelete(id) {
        if (!confirm('¿Eliminar definitivamente este agente?')) return;
        const res = await fetch(`/api/perfiles/${id}`, { method: 'DELETE' });
        if (res.ok) await loadOperators();
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('access-code').value;
        loginError.textContent = '';
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                loginOverlay.style.opacity = '0';
                loginOverlay.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    loginOverlay.classList.add('hidden');
                    dashboard.classList.remove('hidden');
                    loadConfig().then(loadOperators);
                }, 400);
            } else {
                loginError.textContent = data.message || 'Código inválido';
                loginOverlay.animate([
                    { transform: 'translateX(0)' },
                    { transform: 'translateX(-10px)' },
                    { transform: 'translateX(10px)' },
                    { transform: 'translateX(-10px)' },
                    { transform: 'translateX(10px)' },
                    { transform: 'translateX(0)' }
                ], { duration: 400, easing: 'ease-in-out' });
            }
        } catch (error) {
            loginError.textContent = 'Error de conexión. Intente nuevamente.';
        }
    });

    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        btnText.classList.add('hidden');
        loader.classList.remove('hidden');
        submitBtn.disabled = true;
        formFeedback.textContent = '';
        formFeedback.className = 'feedback-msg';

        const payload = {
            nombre: document.getElementById('nombre').value,
            celular: document.getElementById('celular').value,
            email: document.getElementById('email').value,
            fotoUrl: document.getElementById('fotoUrl').value,
            vinculo: document.getElementById('vinculo').value,
            linea: lineaSel.value,
            sector: sectorSel.value,
            afinidad: afinidadSel.value,
            semaforo: state.semaforo,
            perfilProfesional: Array.from(state.selectedTraits),
            perfilInterno: document.getElementById('perfilInterno').value,
        };

        const id = editIdField.value;
        const url = id ? `/api/perfiles/${id}` : '/api/perfiles';
        const method = id ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (response.ok && data.success) {
                formFeedback.textContent = '✅ ' + data.message;
                formFeedback.classList.add('success');
                await loadOperators();
                setTimeout(closeModal, 600);
            } else {
                formFeedback.textContent = '❌ ' + (data.message || 'Error al guardar');
                formFeedback.classList.add('error');
            }
        } catch (error) {
            formFeedback.textContent = '❌ Error de conexión. Intente nuevamente.';
            formFeedback.classList.add('error');
        } finally {
            btnText.classList.remove('hidden');
            loader.classList.add('hidden');
            submitBtn.disabled = false;
        }
    });

    toggleModeBtn.addEventListener('click', () => {
        state.viewMode = state.viewMode === 'public' ? 'private' : 'public';
        toggleModeBtn.textContent = state.viewMode === 'public' ? 'Modo RRHH' : 'Modo Lado B';
        toggleModeBtn.classList.toggle('mode-private', state.viewMode === 'private');
        renderGrid();
    });

    openNewBtn.addEventListener('click', openNew);
    modalClose.addEventListener('click', closeModal);
    btnCancel.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    searchInput.addEventListener('input', (e) => {
        state.search = e.target.value;
        renderGrid();
    });
});
