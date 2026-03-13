// Inicializar iconos de Lucide
lucide.createIcons();

/**
 * Función para navegar entre vistas
 * @param {Event} event - El evento del formulario (opcional)
 * @param {string} viewId - El ID de la sección a mostrar
 */
function navigateTo(event, viewId) {
    if (event) event.preventDefault();

    // Ocultar todas las vistas
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });

    // Mostrar la vista seleccionada
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.add('active');
        // Volver a cargar iconos si es necesario para elementos nuevos
        lucide.createIcons();
    }
}

// Lógica simple para los Tabs del Dashboard
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
    });
});

/**
 * Función para cerrar sesión y limpiar el estado
 * @param {Event} event - El evento del click
 */
function logout(event) {
    if (event) event.preventDefault();
    
    // Limpiar datos de sesión si es necesario
    // sessionStorage.clear();
    // localStorage.removeItem('user_token');

    // Navegar a la vista de login (asegúrate de que el ID coincida con tu HTML)
    navigateTo(null, 'view-login');
}

// Inicializar el botón de logout si existe en el DOM
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
});