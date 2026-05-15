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

    // Login Handler
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
                // Animar salida del login
                loginOverlay.style.opacity = '0';
                loginOverlay.style.transform = 'scale(0.95)';
                
                setTimeout(() => {
                    loginOverlay.classList.add('hidden');
                    dashboard.classList.remove('hidden');
                }, 400);
            } else {
                loginError.textContent = data.message || 'Código inválido';
                // Añadir pequeña animación de sacudida
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

    // Profile Form Handler
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // UI Loading state
        btnText.classList.add('hidden');
        loader.classList.remove('hidden');
        submitBtn.disabled = true;
        formFeedback.textContent = '';
        formFeedback.className = 'feedback-msg';

        const formData = {
            nombre: document.getElementById('nombre').value,
            cargo: document.getElementById('cargo').value,
            institucion: document.getElementById('institucion').value,
            influencia: document.getElementById('influencia').value,
            notas: document.getElementById('notas').value
        };

        try {
            const response = await fetch('/api/perfiles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                formFeedback.textContent = '✅ ' + data.message;
                formFeedback.classList.add('success');
                profileForm.reset();
            } else {
                formFeedback.textContent = '❌ ' + (data.message || 'Error al guardar');
                formFeedback.classList.add('error');
            }
        } catch (error) {
            formFeedback.textContent = '❌ Error de conexión. Intente nuevamente.';
            formFeedback.classList.add('error');
        } finally {
            // Restore UI
            btnText.classList.remove('hidden');
            loader.classList.add('hidden');
            submitBtn.disabled = false;
            
            // Clear success message after 4 seconds
            setTimeout(() => {
                if (formFeedback.classList.contains('success')) {
                    formFeedback.textContent = '';
                    formFeedback.classList.remove('success');
                }
            }, 4000);
        }
    });
});
