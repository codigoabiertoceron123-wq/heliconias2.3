// Función para mostrar mensaje de no datos
function mostrarMensajeSinDatos(mensaje) {
    Swal.fire({
        icon: 'info',
        title: 'Sin datos',
        text: mensaje,
        confirmButtonColor: '#27ae60',
        timer: 3000,
        timerProgressBar: true
    });
}

// Función para mostrar mensaje de error
function mostrarError(mensaje) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: mensaje,
        confirmButtonColor: '#e74c3c'
    });
}

// Función para mostrar mensaje de éxito
function mostrarExito(mensaje) {
    Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: mensaje,
        confirmButtonColor: '#27ae60',
        timer: 3000,
        showConfirmButton: false
    });
}

// Función para mostrar loading
function mostrarLoading(mensaje = 'Cargando...') {
    Swal.fire({
        title: mensaje,
        text: '',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
}

// Función para cerrar loading
function cerrarLoading() {
    Swal.close();
}