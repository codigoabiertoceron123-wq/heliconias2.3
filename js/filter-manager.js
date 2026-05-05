// Módulo para gestión de filtros - VERSIÓN MODULAR
class FilterManager { // probando
    constructor() {
        this.filtrosActivos = {};
        this.app = null;
        this.dataLoader = null;
    }

    setApp(app) {
        this.app = app;
        if (app && app.modules) {
            this.dataLoader = app.modules.dataLoader;
        }
    }

    aplicarFiltros() {
        const tipoEntrada = document.getElementById('filtro-tipo-entrada')?.value;
        const temporada = document.getElementById('filtro-temporada')?.value;
        const actividad = document.getElementById('filtro-actividad')?.value;
        const guia = document.getElementById('filtro-guia')?.value;

        this.filtrosActivos = {};
        
        if (tipoEntrada) this.filtrosActivos.tipo_entrada = tipoEntrada;
        if (temporada) this.filtrosActivos.temporada = temporada;
        if (actividad) this.filtrosActivos.actividad = actividad;
        if (guia) this.filtrosActivos.con_guia = guia === 'true';

        // Usar dataLoader modular si está disponible
        if (this.dataLoader) {
            this.dataLoader.setFiltros(this.filtrosActivos);
            this.dataLoader.cargarDatosVisitantes();
        } else if (typeof dataLoader !== 'undefined') {
            // Fallback a dataLoader global
            dataLoader.setFiltros(this.filtrosActivos);
            dataLoader.cargarDatosVisitantes();
        } else {
            console.error('No hay DataLoader disponible');
            return;
        }

        this.mostrarMensajeExito('Filtros aplicados', 'Los datos se han filtrado correctamente');
    }

    limpiarFiltros() {
        // Limpiar inputs
        const inputs = [
            'filtro-tipo-entrada',
            'filtro-temporada', 
            'filtro-actividad',
            'filtro-guia'
        ];
        
        inputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = '';
        });

        this.filtrosActivos = {};

        // Usar dataLoader modular si está disponible
        if (this.dataLoader) {
            this.dataLoader.limpiarFiltros();
            this.dataLoader.cargarDatosVisitantes();
        } else if (typeof dataLoader !== 'undefined') {
            // Fallback a dataLoader global
            dataLoader.limpiarFiltros();
            dataLoader.cargarDatosVisitantes();
        } else {
            console.error('No hay DataLoader disponible');
            return;
        }

        this.mostrarMensajeExito('Filtros limpiados', 'Se muestran todos los datos');
    }

    aplicarFiltrosModal() {
        // Alias para compatibilidad
        this.aplicarFiltros();
    }

    limpiarFiltrosModal() {
        // Alias para compatibilidad
        this.limpiarFiltros();
    }

    mostrarMensajeExito(titulo, texto) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'success',
                title: titulo,
                text: texto,
                timer: 2000,
                showConfirmButton: false
            });
        } else {
            console.log(`${titulo}: ${texto}`);
        }
    }
}

// Asegurar disponibilidad global
if (typeof FilterManager === 'undefined') {
    window.FilterManager = FilterManager;
}

// ✅ CORREGIDO: Typo arreglado - FilterManag → FilterManager
// Crear instancia global
const filterManager = new FilterManager(); // ← AQUÍ ESTABA EL ERROR
window.filterManager = filterManager; // También asignar a window para acceso global