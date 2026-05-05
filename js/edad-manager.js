(function() {
    'use strict';
    
    
    class EdadManager {
        constructor() {
            this.datosEdades = {};
            this.datosOriginales = {};
            this.chartBar = null;
            this.chartPie = null;
            this.chartAmpliado = null;
            this.utils = new EdadUtils();
        }

        // Función para calcular edad
        calcularEdad(fechaNacimiento) {
            try {
                const nacimiento = new Date(fechaNacimiento);
                const hoy = new Date();
                
                if (isNaN(nacimiento.getTime())) {
                    console.warn('Fecha de nacimiento inválida:', fechaNacimiento);
                    return null;
                }
                
                let edad = hoy.getFullYear() - nacimiento.getFullYear();
                const mes = hoy.getMonth() - nacimiento.getMonth();
                
                if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
                    edad--;
                }
                
                return edad >= 0 ? edad : null;
            } catch (error) {
                console.error('Error calculando edad:', error);
                return null;
            }
        }

        // Clasificar edad en categorías
        clasificarEdad(edad) {
            if (edad <= 17) return '0-17';
            if (edad <= 25) return '18-25';
            if (edad <= 35) return '26-35';
            if (edad <= 50) return '36-50';
            if (edad <= 65) return '51-65';
            return '66+';
        }

        // Función principal para cargar datos de edad
        async cargarDatosEdad() {
            try {
                console.log('=== CARGANDO DATOS DE EDAD ===');
                
                const { data: participantes, error } = await supabase
                    .from('participantes_reserva')
                    .select(`
                        fecha_nacimiento,
                        fecha_visita,
                        id_genero,
                        nombre,
                        apellido,
                        genero!inner(genero)
                    `)
                    .not('fecha_nacimiento', 'is', null);

                if (error) {
                    console.error('Error en consulta:', error);
                    throw new Error(`Error de base de datos: ${error.message}`);
                }

                console.log('✅ Datos de participantes con fecha_nacimiento:', participantes);

                if (participantes && participantes.length > 0) {
                    this.procesarDatosEdad(participantes);
                } else {
                    console.log('No se encontraron participantes con fecha de nacimiento registrada');
                    this.mostrarSinDatos();
                }
                
            } catch (error) {
                console.error('Error cargando edades:', error);
                this.mostrarErrorEdad(error.message);
            }
        }

        // Procesar datos de edad
        procesarDatosEdad(participantes) {
            const conteoEdades = {
                '0-17': 0, '18-25': 0, '26-35': 0, 
                '36-50': 0, '51-65': 0, '66+': 0
            };

            const edadesIndividuales = [];
            let sumaEdades = 0;
            let totalConEdad = 0;

            participantes.forEach(participante => {
                const fechaNacimiento = participante.fecha_nacimiento;
                if (fechaNacimiento) {
                    const edad = this.calcularEdad(fechaNacimiento);
                    if (edad !== null && edad >= 0 && edad <= 120) {
                        const categoria = this.clasificarEdad(edad);
                        conteoEdades[categoria]++;
                        edadesIndividuales.push(edad);
                        sumaEdades += edad;
                        totalConEdad++;
                    }
                }
            });

            if (totalConEdad === 0) {
                this.mostrarSinDatos();
                return;
            }

            const edadPromedio = totalConEdad > 0 ? Math.round(sumaEdades / totalConEdad) : 0;
            const edadMinima = edadesIndividuales.length > 0 ? Math.min(...edadesIndividuales) : 0;
            const edadMaxima = edadesIndividuales.length > 0 ? Math.max(...edadesIndividuales) : 0;

            this.datosEdades = {
                edad: {
                    labels: Object.keys(conteoEdades),
                    values: Object.values(conteoEdades)
                },
                estadisticas: {
                    total: totalConEdad,
                    promedio: edadPromedio,
                    minima: edadMinima,
                    maxima: edadMaxima,
                    suma: sumaEdades
                },
                datosIndividuales: edadesIndividuales,
                participantesAnalizados: participantes.length
            };

            this.datosOriginales = JSON.parse(JSON.stringify(this.datosEdades));
            this.generarInterfazEdades();
            this.actualizarEstadisticas();
        }

        // Actualizar estadísticas en la UI
        actualizarEstadisticas() {
            const stats = this.datosEdades.estadisticas;
            
            if (document.getElementById('total-visitantes')) {
                document.getElementById('total-visitantes').textContent = stats.total.toLocaleString();
            }
            if (document.getElementById('edad-promedio')) {
                document.getElementById('edad-promedio').textContent = stats.promedio + ' años';
            }
            if (document.getElementById('total-grupos')) {
                const gruposActivos = this.datosEdades.edad.values.filter(val => val > 0).length;
                document.getElementById('total-grupos').textContent = gruposActivos;
            }
        }

        // Generar interfaz de edades
        generarInterfazEdades() {
            const container = document.getElementById('data-container');
            if (!container) return;

            const stats = this.datosEdades.estadisticas;
            
            container.innerHTML = `
                <div class="chart-controls">
                    <div class="chart-header">
                        <h3 style="margin: 0; display: flex; align-items: center; gap: 6px">
                            <i class="fas fa-user"></i> Estadísticas por Edad
                            <span style="background: #27ae60; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; margin-left: 10px;">
                                ${stats.total} participantes
                            </span>
                        </h3>
                        <div style="display: flex; gap: 10px;">
                            <button class="download-btn" onclick="window.EdadSystem.descargarGraficoPrincipal()">
                                <i class="fas fa-download"></i> Descargar Gráfico
                            </button>
                            <button class="download-btn" onclick="window.EdadSystem.descargarReporteCompleto()" style="background: linear-gradient(135deg, #e67e22, #f39c12);">
                                <i class="fas fa-file-pdf"></i> Reporte Completo
                            </button>
                        </div>
                    </div>

                    <div class="age-stats-grid">
                        <div class="age-stat-card">
                            <div class="age-stat-number">${stats.total}</div>
                            <div class="age-stat-label">Total con Edad</div>
                        </div>
                        <div class="age-stat-card">
                            <div class="age-stat-number">${stats.promedio}</div>
                            <div class="age-stat-label">Edad Promedio</div>
                        </div>
                        <div class="age-stat-card">
                            <div class="age-stat-number">${stats.minima}</div>
                            <div class="age-stat-label">Edad Mínima</div>
                        </div>
                        <div class="age-stat-card">
                            <div class="age-stat-number">${stats.maxima}</div>
                            <div class="age-stat-label">Edad Máxima</div>
                        </div>
                    </div>

                    <div style="background: #e8f5e8; padding: 12px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #27ae60;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-info-circle" style="color: #27ae60;"></i>
                            <div>
                                <strong>Información:</strong> Las edades se calculan automáticamente a partir de las fechas de nacimiento registradas.
                                Se analizaron <strong>${stats.total}</strong> participantes con fecha de nacimiento válida.
                                <br><small>Rango de edades: ${stats.minima} - ${stats.maxima} años</small>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="charts-grid">
                    <div class="chart-card" onclick="window.EdadSystem.abrirModal('bar')">
                        <div class="chart-card-header">
                            <div class="chart-card-title">
                                <i class="fas fa-chart-bar"></i> Distribución por Edad - Barras
                            </div>
                            <div class="chart-card-badge">Haz clic para ampliar</div>
                        </div>
                        <div class="chart-canvas-wrap">
                            <canvas id="chartBarEdad"></canvas>
                        </div>
                    </div>

                    <div class="chart-card" onclick="window.EdadSystem.abrirModal('pie')">
                        <div class="chart-card-header">
                            <div class="chart-card-title">
                                <i class="fas fa-chart-pie"></i> Distribución por Edad - Circular
                            </div>
                            <div class="chart-card-badge">Haz clic para ampliar</div>
                        </div>
                        <div class="chart-canvas-wrap pie-chart-container">
                            <canvas id="chartPieEdad"></canvas>
                        </div>
                    </div>
                </div>

                <div class="data-table">
                    <div class="chart-header">
                        <h3 style="margin: 0; display: flex; align-items: center; gap: 6px">
                            <i class="fas fa-table"></i> Detalle por Grupos de Edad
                        </h3>
                        <button class="download-btn" onclick="window.EdadSystem.descargarExcel()">
                            <i class="fas fa-file-excel"></i> Exportar Excel
                        </button>
                    </div>
                    <div style="overflow-x: auto;">
                        <table class="table" style="min-width: 700px;">
                            <thead>
                                <tr>
                                    <th style="width: 50px;">#</th>
                                    <th style="min-width: 120px;">Grupo de Edad</th>
                                    <th style="min-width: 100px;">Rango</th>
                                    <th style="width: 120px;">Total Visitantes</th>
                                    <th style="width: 100px;">Porcentaje</th>
                                    <th style="min-width: 150px;">Descripción</th>
                                </tr>
                            </thead>
                            <tbody id="tabla-edad-body">
                                <!-- Los datos se llenarán dinámicamente -->
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            this.mostrarGraficasEdad();
            this.llenarTablaEdad();
        }

        // Mostrar gráficas de edad
        mostrarGraficasEdad() {
            const { labels, values } = this.datosEdades.edad;
            this.crearGraficaBarrasEdad(labels, values);
            this.crearGraficaCircularEdad(labels, values);
        }

        // Crear gráfica de barras para edad
        crearGraficaBarrasEdad(labels, values) {
            const ctxBar = document.getElementById("chartBarEdad");
            if (!ctxBar) return;

            if (this.chartBar) this.chartBar.destroy();

            const colors = this.generarColoresEdad(labels);

            this.chartBar = new Chart(ctxBar, {
                type: "bar",
                data: {
                    labels: labels.map(label => this.formatearEtiquetaEdad(label)),
                    datasets: [{
                        label: "Cantidad de Participantes",
                        data: values,
                        backgroundColor: colors,
                        borderRadius: 8,
                        barThickness: 25,
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        title: {
                            display: true,
                            text: 'Distribución por Grupos de Edad',
                            font: { size: 16, weight: 'bold' }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((context.parsed.y / total) * 100);
                                    return `${context.parsed.y} participantes (${percentage}%)`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: { display: true, text: 'Cantidad de Participantes' }
                        },
                        x: {
                            title: { display: true, text: 'Grupos de Edad' }
                        }
                    }
                },
            });
        }

        // Crear gráfica circular para edad
        crearGraficaCircularEdad(labels, values) {
            const ctxPie = document.getElementById("chartPieEdad");
            if (!ctxPie) return;

            if (this.chartPie) this.chartPie.destroy();

            const colors = this.generarColoresEdad(labels);

            this.chartPie = new Chart(ctxPie, {
                type: "doughnut",
                data: {
                    labels: labels.map(label => this.formatearEtiquetaEdad(label)),
                    datasets: [{
                        data: values,
                        backgroundColor: colors,
                        borderWidth: 2,
                        borderColor: '#fff'
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                usePointStyle: true,
                                padding: 15,
                                font: { size: 11 }
                            }
                        },
                        title: {
                            display: true,
                            text: 'Distribución por Grupos de Edad',
                            font: { size: 16, weight: 'bold' }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((context.parsed / total) * 100);
                                    return `${context.label}: ${context.parsed} participantes (${percentage}%)`;
                                }
                            }
                        }
                    },
                    cutout: '60%'
                },
            });
        }

        // Generar colores para grupos de edad
        generarColoresEdad(labels) {
            const coloresPorEdad = {
                '0-17': '#27ae60', '18-25': '#3498db', '26-35': '#f39c12',
                '36-50': '#e67e22', '51-65': '#9b59b6', '66+': '#e74c3c'
            };
            return labels.map(label => coloresPorEdad[label] || '#95a5a6');
        }

        // Formatear etiquetas de edad
        formatearEtiquetaEdad(etiqueta) {
            const formatos = {
                '0-17': '0-17 años', '18-25': '18-25 años', '26-35': '26-35 años',
                '36-50': '36-50 años', '51-65': '51-65 años', '66+': '66+ años'
            };
            return formatos[etiqueta] || etiqueta;
        }

        // Obtener descripción del grupo de edad
        obtenerDescripcionEdad(grupo) {
            const descripciones = {
                '0-17': 'Niños y adolescentes', '18-25': 'Jóvenes adultos',
                '26-35': 'Adultos jóvenes', '36-50': 'Adultos',
                '51-65': 'Adultos mayores', '66+': 'Tercera edad'
            };
            return descripciones[grupo] || 'Grupo de edad';
        }

        // Llenar tabla de edades
        llenarTablaEdad() {
            const tbody = document.getElementById('tabla-edad-body');
            if (!tbody) return;

            const { labels, values } = this.datosEdades.edad;
            const total = values.reduce((a, b) => a + b, 0);

            tbody.innerHTML = labels.map((grupo, index) => {
                const cantidad = values[index];
                const porcentaje = total > 0 ? ((cantidad / total) * 100).toFixed(1) : 0;
                const descripcion = this.obtenerDescripcionEdad(grupo);
                
                return `
                    <tr>
                        <td style="font-weight: bold; text-align: center;">${index + 1}</td>
                        <td>
                            <span class="age-badge age-badge-${grupo.replace('+', '')}">
                                <i class="fas fa-user"></i>
                                ${this.formatearEtiquetaEdad(grupo)}
                            </span>
                        </td>
                        <td>${grupo} años</td>
                        <td style="text-align: center; font-weight: bold">${cantidad.toLocaleString()}</td>
                        <td style="text-align: center; font-weight: bold; color: #2e7d32">${porcentaje}%</td>
                        <td style="color: #7f8c8d; font-size: 0.9rem">${descripcion}</td>
                    </tr>
                `;
            }).join('');

            if (total > 0) {
                tbody.innerHTML += `
                    <tr style="background: #f8f9fa; font-weight: bold;">
                        <td colspan="3">TOTAL GENERAL</td>
                        <td style="text-align: center">${total.toLocaleString()}</td>
                        <td style="text-align: center">100%</td>
                        <td></td>
                    </tr>
                `;
            }
        }

        // Mostrar error
        mostrarErrorEdad(mensaje) {
            const container = document.getElementById('data-container');
            if (!container) return;
            
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error al cargar datos de edad</h3>
                    <p>${mensaje || 'No se pudieron cargar los datos de edad.'}</p>
                    <button class="btn btn-primary" onclick="window.EdadSystem.cargarDatosEdad()">
                        <i class="fas fa-redo"></i> Reintentar
                    </button>
                </div>
            `;
        }

        // Mostrar cuando no hay datos
        mostrarSinDatos() {
            const container = document.getElementById('data-container');
            if (!container) return;
            
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-user-slash"></i>
                    <h3>No hay datos de edad disponibles</h3>
                    <p>No se encontraron participantes con fecha de nacimiento registrada en la base de datos.</p>
                    <button class="btn btn-primary" onclick="window.EdadSystem.cargarDatosEdad()">
                        <i class="fas fa-redo"></i> Reintentar
                    </button>
                </div>
            `;
        }
    }

    
    class EdadUtils {
        validarFechaNacimiento(fecha) {
            if (!fecha) return false;
            const fechaNac = new Date(fecha);
            const hoy = new Date();
            return fechaNac <= hoy;
        }

        formatearEdad(edad) {
            return edad === 1 ? '1 año' : `${edad} años`;
        }
    }

  
    const edadManager = new EdadManager();

    // Crear namespace global SEGURO
    if (!window.EdadSystem) {
        window.EdadSystem = {};
    }

    // Métodos públicos
    window.EdadSystem.cargarDatosEdad = () => edadManager.cargarDatosEdad();
    window.EdadSystem.abrirModal = (tipo) => edadManager.abrirModal(tipo);
    window.EdadSystem.descargarExcel = () => edadManager.descargarExcel();
    window.EdadSystem.descargarGraficoPrincipal = () => edadManager.descargarGraficoPrincipal();
    window.EdadSystem.descargarReporteCompleto = () => edadManager.descargarReporteCompleto();

    // Métodos que necesitan implementación (placeholders)
    window.EdadSystem.abrirModal = (tipo) => {
        Swal.fire({
            icon: 'info',
            title: 'Vista Ampliada - Edad',
            text: `Modal para gráfica ${tipo} del sistema de edad`,
            confirmButtonColor: '#3498db'
        });
    };

    window.EdadSystem.descargarExcel = () => {
        Swal.fire({
            icon: 'info', 
            title: 'Descargar Excel - Edad',
            text: 'Función de descarga Excel para edad',
            confirmButtonColor: '#3498db'
        });
    };

    window.EdadSystem.descargarGraficoPrincipal = () => {
        Swal.fire({
            icon: 'info',
            title: 'Descargar Gráfico - Edad', 
            text: 'Función de descarga de gráfico para edad',
            confirmButtonColor: '#3498db'
        });
    };

    window.EdadSystem.descargarReporteCompleto = () => {
        Swal.fire({
            icon: 'info',
            title: 'Reporte Completo - Edad',
            text: 'Función de reporte completo para edad',
            confirmButtonColor: '#3498db'
        });
    };

    console.log('✅ Sistema de Edad cargado sin conflictos');
})();

