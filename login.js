// js/login.js
document.addEventListener('DOMContentLoaded', function() {
    // Toggle para mostrar/ocultar contraseña
    const togglePassword = document.querySelector('.toggle-password');
    const passwordInput = document.getElementById('documento');
    
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }
    
    // Validación del formulario antes de enviar
    const loginForm = document.querySelector('form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            const nombre = document.getElementById('nombre').value.trim();
            const documento = document.getElementById('documento').value.trim();
            
            if (!nombre || !documento) {
                e.preventDefault();
                Swal.fire({
                    icon: 'warning',
                    title: 'Campos incompletos',
                    text: 'Por favor, completa todos los campos'
                });
            }
        });
    }
    
    // Navegación del menú
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remover clase active de todos los items
            menuItems.forEach(i => i.classList.remove('active'));
            // Agregar clase active al item clickeado
            this.classList.add('active');
            
            const section = this.getAttribute('data-section');
            // Aquí puedes agregar lógica para cambiar secciones
            console.log('Navegar a:', section);
        });
    });
});