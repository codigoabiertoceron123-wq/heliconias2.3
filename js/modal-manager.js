// Módulo para gestión de modales - VERSIÓN MODULAR
class ModalManager {
    constructor() {
        this.modal = null;
        this.chartAmpliado = null;
        this.app = null;
        this.chartManager = null;
        this.dataProcessor = null;
    }

    setApp(app) {
        this.app = app;
        if (app && app.modules) {
            this.chartManager = app.modules.chartManager;
            this.dataProcessor = app.modules.dataProcessor;
        }
        // Obtener referencia al modal después de setApp
        this.modal = document.getElementById("chartModal");
    }

    abrirModal(tipoGrafica) {
        if (!this.modal) {
            console.warn('Modal no encontrado');
            return;
        }
        
        this.modal.classList.add("show");
        this.actualizarGraficaModal(tipoGrafica);
    }

    actualizarGraficaModal(tipoGrafica) {
        const canvas = document.getElementById("chartAmpliado");
        if (!canvas) {
            console.warn('Canvas chartAmpliado no encontrado');
            return;
        }
        
        // Obtener datos de forma modular
        const tipoActual = this.chartManager ? this.chartManager.tipoActual : 
                          (this.app ? this.app.getTipoActual() : 'tipo_reserva');
        
        const datosSimulados = this.dataProcessor ? this.dataProcessor.datosSimulados :
                              (this.app ? this.app.getDatosSimulados() : {});
        
        const datos = datosSimulados[tipoActual];
        if (!datos) {
            console.warn('No hay datos para:', tipoActual);
            return;
        }

        const ctx = canvas.getContext("2d");
        
        // Destruir gráfica anterior
        if (this.chartAmpliado) this.chartAmpliado.destroy();

        // Generar colores de forma modular
        const colors = this.chartManager ? 
            this.chartManager.generarColores(tipoActual, datos.labels) :
            this.generarColoresFallback(tipoActual, datos.labels);

        this.chartAmpliado = new Chart(ctx, {
            type: tipoGrafica === "bar" ? "bar" : "doughnut",
            data: {
                labels: datos.labels,
                datasets: [{
                    label: "Total de Visitantes",
                    data: datos.values,
                    backgroundColor: colors,
                    borderRadius: tipoGrafica === "bar" ? 6 : 0,
                    borderWidth: tipoGrafica === "bar" ? 0 : 2,
                    borderColor: tipoGrafica === "bar" ? 'transparent' : '#fff'
                }],
            },
            options: this.obtenerOpcionesModal(tipoGrafica, tipoActual)
        });

        this.actualizarTablaDatos(datos);
    }

    generarColoresFallback(tipo, labels) {
        const palettes = {
            tipo_reserva: ['#3498db', '#e74c3c'],
            estado: ['#27ae60', '#f39c12', '#e74c3c'],
            actividad: ['#3498db', '#e67e22', '#9b59b6', '#2ecc71'],
            // ... agregar más paletas según necesites
        };
        const palette = palettes[tipo] || ['#3498db', '#e74c3c', '#f39c12'];
        return labels.map((_, i) => palette[i % palette.length]);
    }

    obtenerOpcionesModal(tipoGrafica, tipoActual) {
        const titulo = this.chartManager ? 
            this.chartManager.obtenerTituloDescriptivo(tipoActual) :
            `Gráfica de ${tipoActual}`;

        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: tipoGrafica === "bar" ? 'top' : 'right',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        font: { size: 13 }
                    }
                },
                title: {
                    display: true,
                    text: titulo,
                    font: { size: 18, weight: 'bold' },
                    padding: 25
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    titleFont: { size: 14 },
                    bodyFont: { size: 14 },
                    padding: 12,
                    cornerRadius: 8
                }
            },
            scales: tipoGrafica === "bar" ? {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    title: {
                        display: true,
                        text: 'Cantidad de Visitantes',
                        font: { weight: 'bold', size: 14 }
                    }
                },
                x: {
                    grid: { display: false },
                    title: {
                        display: true,
                        text: this.obtenerEtiquetaDescriptiva(tipoActual),
                        font: { weight: 'bold', size: 14 }
                    }
                }
            } : {}
        };
    }

    obtenerEtiquetaDescriptiva(tipo) {
        const etiquetas = {
            tipo_reserva: 'Tipo de Reserva',
            estado: 'Estado',
            actividad: 'Actividad',
            institucion: 'Institución',
            intereses: 'Intereses',
            satisfaccion: 'Satisfacción',
            temporada: 'Temporada',
            fecha: 'Fecha',
            mes: 'Mes',
            anio: 'Año',
            genero: 'Género'
        };
        return etiquetas[tipo] || 'Categoría';
    }

    actualizarTablaDatos(datos) {
        const tbody = document.querySelector("#tablaDatos tbody");
        if (!tbody) return;

        const total = datos.values.reduce((a, b) => a + b, 0);
        
        tbody.innerHTML = datos.labels.map((label, i) => {
            const valor = datos.values[i];
            const porcentaje = total > 0 ? ((valor / total) * 100).toFixed(1) : '0.0';
            return `
                <tr>
                    <td><strong>${label}</strong></td>
                    <td style="text-align: center;"><strong>${valor.toLocaleString()}</strong></td>
                    <td style="text-align: center; color: #2c3e50; font-weight: bold">${porcentaje}%</td>
                </tr>
            `;
        }).join("");
    }

    cerrarModal() {
        if (this.modal) {
            this.modal.classList.remove("show");
        }
    }
}

// Asegurar disponibilidad global
if (typeof ModalManager === 'undefined') {
    window.ModalManager = ModalManager;
}

// Crear instancia global
const modalManager = new ModalManager();