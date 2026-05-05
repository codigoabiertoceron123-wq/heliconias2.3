// js/ciudad.js - Sistema de Estadísticas por Ciudad - CON GRÁFICOS DE BARRAS
(function() {
    'use strict';
    
    // Variables del sistema
    let chartBarCiudad, chartPieCiudad, chartAmpliadoCiudad;
    let datosCiudades = {};
    let datosFechaCiudad = {};
    let datosMesCiudad = {};
    let datosAnioCiudad = {};
    let todasLasCiudades = [];
    let tipoActual = "ciudad";
    
    // Objetos para almacenar instancias de gráficos por tipo
    const chartInstances = {
        fecha: null,
        mes: null,
        anio: null,
        bar: null,
        pie: null,
        ampliado: null
    };
    
    // PALETA DE COLORES MEJORADA - UN COLOR POR CIUDAD
    const coloresBase = [
        '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', 
        '#34495e', '#e67e22', '#27ae60', '#8e44ad', '#16a085', '#c0392b',
        '#2980b9', '#d35400', '#7f8c8d', '#f1c40f', '#95a5a6', '#d35400'
    ];
    
    // Mapa para mantener colores consistentes por ciudad
    let mapaColoresCiudades = {};

    // Paleta para gráficos de tiempo
    const coloresPorTiempo = {
        fecha: ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e', '#e67e22'],
        mes: ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c', '#d35400', '#27ae60', '#8e44ad', '#16a085', '#c0392b', '#2980b9'],
        anio: ['#3498db', '#e67e22', '#2ecc71', '#9b59b6', '#f1c40f', '#e74c3c']
    };

    // =============================================
    // FUNCIONES PRINCIPALES DEL SISTEMA DE CIUDAD
    // =============================================

    // Función principal para cargar datos de ciudad
    async function cargarDatosCiudad() {
        try {
            console.log('🚀 Iniciando carga de datos de ciudad...');
            mostrarLoading('Cargando datos de ciudades...');

            // Obtener todos los participantes con ciudad
            const { data: participantes, error: errorParticipantes } = await supabase
                .from('participantes_reserva')
                .select('id_ciudad, fecha_visita')
                .not('id_ciudad', 'is', null);

            if (errorParticipantes) {
                console.error('Error al obtener participantes:', errorParticipantes);
                mostrarErrorCiudad();
                return;
            }

            console.log('Participantes con ciudades:', participantes);

            if (!participantes || participantes.length === 0) {
                mostrarSinDatosCiudad();
                return;
            }

            // Obtener IDs de ciudades únicos
            const idsCiudadesUnicos = [...new Set(participantes.map(p => p.id_ciudad))];
            console.log('IDs de ciudades únicos:', idsCiudadesUnicos);

            // Obtener información de ciudades
            const { data: ciudades, error: errorCiudades } = await supabase
                .from('ciudades')
                .select('id, nombre')
                .in('id', idsCiudadesUnicos);

            if (errorCiudades) {
                console.error('Error al obtener ciudades:', errorCiudades);
                mostrarErrorCiudad();
                return;
            }

            console.log('Ciudades obtenidas:', ciudades);

            // Guardar todas las ciudades para el buscador
            todasLasCiudades = ciudades.map(c => c.nombre).sort();

            // Procesar datos de ciudades
            procesarDatosCiudad(participantes, ciudades);
            mostrarInterfazCiudad();

            cerrarLoading();
            
        } catch (error) {
            console.error('Error en cargarDatosCiudad:', error);
            cerrarLoading();
            mostrarErrorCiudad();
        }
    }

    // Función para procesar datos de ciudad
    function procesarDatosCiudad(participantes, ciudades) {
        // Inicializar mapa de colores
        mapaColoresCiudades = {};
        
        // Conteo general por ciudad - ahora dinámico
        const conteoGeneral = {};
        let totalConCiudad = 0;
        let sinCiudad = 0;

        // Mapeo de IDs de ciudad a nombres
        const mapaCiudades = {};
        ciudades.forEach(ciudad => {
            mapaCiudades[ciudad.id] = ciudad.nombre;
            
            // Asignar color único a cada ciudad
            if (!mapaColoresCiudades[ciudad.nombre]) {
                // Usar color predefinido para ciudades principales
                const ciudadLower = ciudad.nombre.toLowerCase();
                if (ciudadLower.includes('bogotá') || ciudadLower.includes('bogota')) {
                    mapaColoresCiudades[ciudad.nombre] = '#e74c3c'; // Rojo
                } else if (ciudadLower.includes('medellín') || ciudadLower.includes('medellin')) {
                    mapaColoresCiudades[ciudad.nombre] = '#3498db'; // Azul
                } else if (ciudadLower.includes('cali')) {
                    mapaColoresCiudades[ciudad.nombre] = '#f39c12'; // Naranja
                } else if (ciudadLower.includes('barranquilla')) {
                    mapaColoresCiudades[ciudad.nombre] = '#2ecc71'; // Verde
                } else if (ciudadLower.includes('cartagena')) {
                    mapaColoresCiudades[ciudad.nombre] = '#9b59b6'; // Púrpura
                } else if (ciudadLower.includes('bucaramanga')) {
                    mapaColoresCiudades[ciudad.nombre] = '#1abc9c'; // Turquesa
                } else {
                    // Para otras ciudades, asignar color único
                    const index = Object.keys(mapaColoresCiudades).length % coloresBase.length;
                    mapaColoresCiudades[ciudad.nombre] = coloresBase[index];
                }
            }
        });

        // Contar participantes por ciudad
        participantes.forEach(participante => {
            if (participante.id_ciudad) {
                const nombreCiudad = mapaCiudades[participante.id_ciudad];
                if (nombreCiudad) {
                    // Contar por nombre exacto de ciudad
                    conteoGeneral[nombreCiudad] = (conteoGeneral[nombreCiudad] || 0) + 1;
                    totalConCiudad++;
                } else {
                    sinCiudad++;
                }
            } else {
                sinCiudad++;
            }
        });

        // Ordenar ciudades por cantidad (de mayor a menor)
        const conteoOrdenado = Object.entries(conteoGeneral)
            .sort((a, b) => b[1] - a[1]);

        // Separar en grupos para mejor visualización
        const ciudadesPrincipales = [];
        const otrasCiudades = [];
        
        conteoOrdenado.forEach(([ciudad, cantidad], index) => {
            if (index < 8) { // Top 8 ciudades principales
                ciudadesPrincipales.push({ ciudad, cantidad });
            } else {
                otrasCiudades.push({ ciudad, cantidad });
            }
        });

        // Si hay muchas "otras ciudades", agruparlas
        let otrasCiudadesTotal = 0;
        if (otrasCiudades.length > 0) {
            otrasCiudadesTotal = otrasCiudades.reduce((sum, item) => sum + item.cantidad, 0);
        }

        // Preparar datos finales para gráficos
        const labelsGrafico = [];
        const valuesGrafico = [];
        const coloresGrafico = [];
        
        // Agregar ciudades principales
        ciudadesPrincipales.forEach(item => {
            labelsGrafico.push(item.ciudad);
            valuesGrafico.push(item.cantidad);
            coloresGrafico.push(mapaColoresCiudades[item.ciudad] || '#95a5a6');
        });
        
        // Agregar "Otras" si hay
        if (otrasCiudadesTotal > 0) {
            labelsGrafico.push('Otras ciudades');
            valuesGrafico.push(otrasCiudadesTotal);
            coloresGrafico.push('#7f8c8d');
        }

        // Calcular estadísticas
        const totalParticipantes = totalConCiudad + sinCiudad;
        const totalCiudadesUnicas = Object.keys(conteoGeneral).length;

        // Guardar datos procesados
        datosCiudades = {
            general: {
                labels: labelsGrafico,
                values: valuesGrafico,
                colors: coloresGrafico,
                total: totalConCiudad
            },
            detallado: {
                todasLasCiudades: conteoOrdenado,
                ciudadesPrincipales: ciudadesPrincipales,
                otrasCiudades: otrasCiudades,
                totalOtras: otrasCiudadesTotal
            },
            estadisticas: {
                totalParticipantes: totalParticipantes,
                totalConCiudad: totalConCiudad,
                totalSinCiudad: sinCiudad,
                totalCiudadesUnicas: totalCiudadesUnicas,
                porcentajeConCiudad: totalParticipantes > 0 ? 
                    Math.round((totalConCiudad / totalParticipantes) * 100) : 0
            },
            rawData: participantes,
            ciudadesMapa: mapaCiudades,
            coloresMapa: mapaColoresCiudades
        };

        console.log('✅ Datos procesados:', datosCiudades);
        
        // Actualizar estadísticas en la UI
        actualizarEstadisticas();
    }

    // Función para actualizar estadísticas en la UI
    function actualizarEstadisticas() {
        const stats = datosCiudades.estadisticas;
        
        // Actualizar tarjetas de estadísticas
        if (document.getElementById('total-visitantes')) {
            document.getElementById('total-visitantes').textContent = 
                stats.totalParticipantes.toLocaleString();
        }
        
        if (document.getElementById('visitantes-con-ciudad')) {
            document.getElementById('visitantes-con-ciudad').textContent = 
                stats.totalConCiudad.toLocaleString();
        }
        
        if (document.getElementById('total-ciudades')) {
            document.getElementById('total-ciudades').textContent = 
                stats.totalCiudadesUnicas.toLocaleString();
        }
    }

    // Función para mostrar interfaz de ciudad
    function mostrarInterfazCiudad() {
        const container = document.getElementById('data-container');
        const stats = datosCiudades.estadisticas;
        
        container.innerHTML = `
            <div class="chart-controls">
                <div class="chart-header">
                    <h3 style="margin: 0; display: flex; align-items: center; gap: 6px">
                        <i class="fas fa-city"></i> Distribución por Ciudad
                        <span style="background: #e74c3c; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; margin-left: 10px;">
                            ${stats.totalConCiudad} visitantes de ${stats.totalCiudadesUnicas} ciudades
                        </span>
                    </h3>
                    <div style="display: flex; gap: 10px;">
                        <button class="download-btn" onclick="window.CiudadSystem.descargarGraficoPrincipal()">
                            <i class="fas fa-download"></i> Descargar Gráfico
                        </button>
                    </div>
                </div>
            </div>

            <div class="charts-grid">
                <div class="chart-card" onclick="window.CiudadSystem.abrirModal('bar')">
                    <div class="chart-card-header">
                        <div class="chart-card-title">
                            <i class="fas fa-chart-bar"></i> Distribución por Ciudad - Barras
                        </div>
                        <div class="chart-card-badge">Haz clic para ampliar</div>
                    </div>
                    <div class="chart-canvas-wrap">
                        <canvas id="chartBarCiudad"></canvas>
                    </div>
                </div>

                <div class="chart-card" onclick="window.CiudadSystem.abrirModal('pie')">
                    <div class="chart-card-header">
                        <div class="chart-card-title">
                            <i class="fas fa-chart-pie"></i> Distribución por Ciudad - Circular
                        </div>
                        <div class="chart-card-badge">Haz clic para ampliar</div>
                    </div>
                    <div class="chart-canvas-wrap pie-chart-container">
                        <canvas id="chartPieCiudad"></canvas>
                    </div>
                </div>
            </div>

            <div class="data-table">
                <div class="chart-header">
                    <h3 style="margin: 0; display: flex; align-items: center; gap: 6px">
                        <i class="fas fa-table"></i> Detalle por Ciudad
                    </h3>
                    <div style="display: flex; gap: 10px;">
                        <button class="download-btn" onclick="window.CiudadSystem.descargarExcel()">
                            <i class="fas fa-file-excel"></i> Exportar Excel
                        </button>
                        <button class="btn" onclick="window.CiudadSystem.mostrarTodasLasCiudades()" style="background: linear-gradient(135deg, #9b59b6, #8e44ad); color: white;">
                            <i class="fas fa-list"></i> Ver todas las ciudades
                        </button>
                    </div>
                </div>
                <div style="overflow-x: auto;">
                    <table class="table" style="min-width: 700px;">
                        <thead>
                            <tr>
                                <th style="width: 50px;">#</th>
                                <th style="min-width: 150px;">Ciudad</th>
                                <th style="width: 120px;">Total Visitantes</th>
                                <th style="width: 100px;">Porcentaje</th>
                                <th style="min-width: 150px;">Descripción</th>
                            </tr>
                        </thead>
                        <tbody id="tabla-ciudad-body">
                            ${generarFilasTablaCiudad()}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        mostrarGraficasCiudad();
    }

    // Función para generar filas de tabla de ciudad
    function generarFilasTablaCiudad() {
        const { labels, values, total } = datosCiudades.general;
        const colores = datosCiudades.general.colors;
        
        return labels.map((ciudad, index) => {
            const cantidad = values[index];
            const porcentaje = total > 0 ? ((cantidad / total) * 100).toFixed(1) : 0;
            const descripcion = obtenerDescripcionCiudad(ciudad);
            const color = colores[index];
            
            return `
                <tr>
                    <td style="font-weight: bold; text-align: center;">${index + 1}</td>
                    <td>
                        <span class="ciudad-badge" style="background: ${color}; color: white; padding: 4px 8px; border-radius: 12px; display: inline-flex; align-items: center; gap: 5px;">
                            <i class="fas fa-city"></i> ${ciudad}
                        </span>
                    </td>
                    <td style="text-align: center; font-weight: bold">${cantidad.toLocaleString()}</td>
                    <td style="text-align: center; font-weight: bold; color: #2e7d32">${porcentaje}%</td>
                    <td style="color: #7f8c8d; font-size: 0.9rem">${descripcion}</td>
                </tr>
            `;
        }).join('') + (total > 0 ? `
            <tr style="background: #f8f9fa; font-weight: bold;">
                <td colspan="2">TOTAL GENERAL</td>
                <td style="text-align: center">${total.toLocaleString()}</td>
                <td style="text-align: center">100%</td>
                <td></td>
            </tr>
        ` : '');
    }

    // Función para obtener descripción de ciudad
    function obtenerDescripcionCiudad(ciudad) {
        const ciudadLower = ciudad.toLowerCase();
        if (ciudadLower.includes('bogotá') || ciudadLower.includes('bogota')) {
            return 'Capital de Colombia';
        } else if (ciudadLower.includes('medellín') || ciudadLower.includes('medellin')) {
            return 'Ciudad de la eterna primavera';
        } else if (ciudadLower.includes('cali')) {
            return 'Capital mundial de la salsa';
        } else if (ciudadLower === 'otras ciudades') {
            return `${datosCiudades.detallado.otrasCiudades.length} ciudades adicionales`;
        } else {
            return 'Ciudad de Colombia';
        }
    }

    // Función para mostrar gráficas de ciudad
    function mostrarGraficasCiudad() {
        const { labels, values, colors } = datosCiudades.general;
        
        // Destruir gráficas anteriores si existen
        if (chartInstances.bar) {
            chartInstances.bar.destroy();
        }
        if (chartInstances.pie) {
            chartInstances.pie.destroy();
        }
        
        // Gráfica de barras
        const ctxBar = document.getElementById("chartBarCiudad");
        if (ctxBar) {
            chartInstances.bar = new Chart(ctxBar, {
                type: "bar",
                data: {
                    labels: labels,
                    datasets: [{
                        label: "Cantidad de Visitantes",
                        data: values,
                        backgroundColor: colors,
                        borderColor: colors.map(color => darkenColor(color, 0.2)),
                        borderWidth: 2,
                        borderRadius: 8,
                        barThickness: 30,
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        title: {
                            display: true,
                            text: 'Distribución por Ciudad - Top ' + labels.length,
                            font: { size: 16, weight: 'bold' }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed.y;
                                    const total = values.reduce((a, b) => a + b, 0);
                                    const porcentaje = total > 0 ? Math.round((value / total) * 100) : 0;
                                    return `${label}: ${value} visitantes (${porcentaje}%)`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: { display: true, text: 'Cantidad de Visitantes' },
                            ticks: { stepSize: 1 }
                        },
                        x: {
                            title: { display: true, text: 'Ciudad' }
                        }
                    }
                },
            });
        }

        // Gráfica circular
        const ctxPie = document.getElementById("chartPieCiudad");
        if (ctxPie) {
            chartInstances.pie = new Chart(ctxPie, {
                type: "doughnut",
                data: {
                    labels: labels,
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
                                font: { size: 12 }
                            }
                        }
                    },
                    cutout: '60%'
                },
            });
        }
    }

    // Función para actualizar contenido del modal con filtros
    function actualizarContenidoModal(tipo, tipoGrafica) {
        const modal = document.getElementById("chartModalCiudad");
        if (!modal) return;
        
        // Crear contenido completo del modal
        const titulo = tipo === 'ciudad' ? 'Distribución por Ciudad' : getTituloTiempo(tipo);
        const iconoTitulo = tipo === 'ciudad' ? 'fa-city' : 
                           tipo === 'fecha' ? 'fa-calendar-day' : 
                           tipo === 'mes' ? 'fa-calendar-week' : 'fa-calendar-alt';
        
        const html = `
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title" id="modalTitleCiudad">
                        <i class="fas ${iconoTitulo}"></i> ${titulo} - Vista Ampliada
                    </div>
                    <div class="modal-actions">
                        <button class="download-btn-small secondary" onclick="window.CiudadSystem.descargarPNGModal()">
                            <i class="fas fa-image"></i> PNG
                        </button>
                        <button class="download-btn-small" onclick="window.CiudadSystem.descargarExcelModal()">
                            <i class="fas fa-file-excel"></i> Excel
                        </button>
                        <span class="close" onclick="window.CiudadSystem.cerrarModal()">&times;</span>
                    </div>
                </div>

                <!-- FILTROS DENTRO DEL MODAL -->
                ${crearHTMLFiltrosModal(tipo)}

                <div class="modal-chart-container">
                    <canvas id="chartAmpliadoCiudad"></canvas>
                </div>

                <div class="data-table">
                    <h4 style="margin: 0 0 12px 0; display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-table"></i> Datos Detallados
                    </h4>
                    <table class="table" id="tablaDatosCiudad">
                        <thead>
                            <tr>
                                <th>${tipo === 'ciudad' ? 'Ciudad' : 'Período'}</th>
                                <th>${tipo === 'ciudad' ? 'Descripción' : 'Fecha'}</th>
                                <th>Total Visitantes</th>
                                <th>Porcentaje</th>
                                ${tipo !== 'ciudad' ? '<th>Ciudades</th>' : ''}
                            </tr>
                        </thead>
                        <tbody id="tbodyDatosCiudad">
                            <!-- Los datos se llenarán dinámicamente -->
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        modal.innerHTML = html;
        
        // Establecer valor inicial del tipo de gráfica
        const selectTipoGrafica = document.getElementById('modalTipoGrafica');
        if (selectTipoGrafica && selectTipoGrafica.tagName === 'SELECT') {
            selectTipoGrafica.value = tipoGrafica || 'bar';
        }
        
        // Establecer fechas por defecto si es tipo tiempo
        if (tipo !== 'ciudad') {
            const ahora = new Date();
            const haceUnMes = new Date();
            haceUnMes.setMonth(ahora.getMonth() - 1);
            
            const fechaInicio = document.getElementById('modalFechaInicio');
            const fechaFin = document.getElementById('modalFechaFin');
            
            if (fechaInicio && fechaFin) {
                fechaInicio.value = haceUnMes.toISOString().split('T')[0];
                fechaFin.value = ahora.toISOString().split('T')[0];
            }
        }
    }

    // Función para determinar el tipo actual del modal
    function determinarTipoActualModal() {
        const titulo = document.getElementById('modalTitleCiudad')?.textContent || '';
        if (titulo.includes('Ciudad') && !titulo.includes('Fecha') && !titulo.includes('Mes') && !titulo.includes('Año')) {
            return 'ciudad';
        }
        if (titulo.includes('Fecha')) return 'fecha';
        if (titulo.includes('Mes')) return 'mes';
        if (titulo.includes('Año')) return 'anio';
        return 'ciudad';
    }

    // Función para aplicar filtros del modal
    async function aplicarFiltrosModal() {
        try {
            mostrarLoading('Aplicando filtros...');
            
            const tipoGrafica = document.getElementById('modalTipoGrafica')?.value || 'bar';
            const fechaInicio = document.getElementById('modalFechaInicio')?.value;
            const fechaFin = document.getElementById('modalFechaFin')?.value;
            const ciudadFiltro = document.getElementById('modalCiudad')?.value || 'todas';
            const cantidad = parseInt(document.getElementById('modalCantidad')?.value || '10');
            const orden = document.getElementById('modalOrden')?.value || 'desc';
            
            const tipo = determinarTipoActualModal();
            let datosFiltrados;
            
            if (tipo === 'ciudad') {
                // Filtrar datos de ciudad general
                datosFiltrados = await filtrarDatosCiudadModal(ciudadFiltro, cantidad, orden);
                crearGraficaAmpliadaCiudadConDatos(datosFiltrados, tipoGrafica);
                llenarTablaModalCiudadConDatos(datosFiltrados);
            } else {
                // Filtrar datos de tiempo
                datosFiltrados = await filtrarDatosCiudadTiempoModal(tipo, fechaInicio, fechaFin, ciudadFiltro, cantidad, orden);
                crearGraficaAmpliadaCiudadTiempo(tipo, tipoGrafica, datosFiltrados);
                llenarTablaModalCiudadTiempoConDatos(tipo, datosFiltrados);
            }
            
            mostrarExito(`Filtros aplicados: ${datosFiltrados.total || 0} registros encontrados`);
            cerrarLoading();
            
        } catch (error) {
            console.error('Error aplicando filtros:', error);
            cerrarLoading();
            mostrarErrorCiudad('Error al aplicar los filtros: ' + error.message);
        }
    }

    // Función para filtrar datos de ciudad en modal
    async function filtrarDatosCiudadModal(ciudadFiltro, cantidad, orden) {
    let datos = { ...datosCiudades.general };
    
    // Filtrar por ciudad específica
    if (ciudadFiltro !== 'todas') {
        const index = datos.labels.indexOf(ciudadFiltro);
        
        if (index !== -1) {
            // Es una ciudad válida
            datos = {
                labels: [ciudadFiltro],
                values: [datos.values[index]],
                colors: [datos.colors[index]],
                total: datos.values[index]
            };
        } else {
            // No encontrado, devolver datos vacíos
            datos = {
                labels: [],
                values: [],
                colors: [],
                total: 0
            };
        }
    }
    
    // Ordenar datos
    if (orden === 'desc') {
        // Orden descendente (mayor a menor)
        const indices = datos.labels
            .map((label, i) => ({ label, value: datos.values[i], color: datos.colors[i] }))
            .sort((a, b) => b.value - a.value)
            .map(item => datos.labels.indexOf(item.label));
        
        datos.labels = indices.map(i => datos.labels[i]);
        datos.values = indices.map(i => datos.values[i]);
        datos.colors = indices.map(i => datos.colors[i]);
    } else if (orden === 'asc') {
        // Orden ascendente (menor a mayor)
        const indices = datos.labels
            .map((label, i) => ({ label, value: datos.values[i], color: datos.colors[i] }))
            .sort((a, b) => a.value - b.value)
            .map(item => datos.labels.indexOf(item.label));
        
        datos.labels = indices.map(i => datos.labels[i]);
        datos.values = indices.map(i => datos.values[i]);
        datos.colors = indices.map(i => datos.colors[i]);
    } else if (orden === 'alpha') {
        // Orden alfabético
        const indices = datos.labels
            .map((label, i) => ({ label, value: datos.values[i], color: datos.colors[i] }))
            .sort((a, b) => a.label.localeCompare(b.label))
            .map(item => datos.labels.indexOf(item.label));
        
        datos.labels = indices.map(i => datos.labels[i]);
        datos.values = indices.map(i => datos.values[i]);
        datos.colors = indices.map(i => datos.colors[i]);
    }
    
    // Limitar cantidad
    if (cantidad > 0 && cantidad < datos.labels.length) {
        datos.labels = datos.labels.slice(0, cantidad);
        datos.values = datos.values.slice(0, cantidad);
        datos.colors = datos.colors.slice(0, cantidad);
        datos.total = datos.values.reduce((a, b) => a + b, 0);
    }
    
    return datos;
}


    // Función para filtrar datos de tiempo en modal CON FILTRO DE CIUDAD
    async function filtrarDatosCiudadTiempoModal(tipo, fechaInicio, fechaFin, ciudadFiltro, cantidad, orden) {
        let query = supabase
            .from('participantes_reserva')
            .select('fecha_visita, id_ciudad')
            .not('fecha_visita', 'is', null)
            .not('id_ciudad', 'is', null);
        
        // Aplicar filtros de fecha si existen
        if (fechaInicio) {
            query = query.gte('fecha_visita', fechaInicio + 'T00:00:00');
        }
        if (fechaFin) {
            query = query.lte('fecha_visita', fechaFin + 'T23:59:59');
        }
        
        const { data: participantes, error } = await query;
        if (error) throw error;
        
        // Obtener ciudades de los participantes
        const idsCiudadesUnicos = [...new Set(participantes.map(p => p.id_ciudad))];
        const { data: ciudades, error: errorCiudades } = await supabase
            .from('ciudades')
            .select('id, nombre')
            .in('id', idsCiudadesUnicos);
        
        if (errorCiudades) throw errorCiudades;
        
        const mapaCiudades = {};
        ciudades.forEach(ciudad => {
            mapaCiudades[ciudad.id] = ciudad.nombre;
        });
        
        // FILTRAR por ciudad si no es "todas"
        let participantesFiltrados = participantes;
        if (ciudadFiltro && ciudadFiltro !== 'todas') {
            participantesFiltrados = participantes.filter(participante => {
                const ciudad = mapaCiudades[participante.id_ciudad];
                return ciudad === ciudadFiltro;
            });
        }
        
        // Procesar datos con la función existente
        const datosProcesados = await procesarDatosCiudadTiempo(participantesFiltrados, tipo);
        
        // FILTRAR datasets por ciudad específica
        if (ciudadFiltro && ciudadFiltro !== 'todas') {
            // Encontrar el dataset que corresponde a la ciudad seleccionada
            const datasetFiltrado = datosProcesados.datasets.find(
                dataset => dataset.label === ciudadFiltro
            );
            
            if (datasetFiltrado) {
                // Si encontramos la ciudad, mantener solo ese dataset
                datosProcesados.datasets = [datasetFiltrado];
                datosProcesados.ciudades = [ciudadFiltro];
            } else {
                // Si no encontramos datos para esa ciudad, devolver datos vacíos
                datosProcesados.datasets = [];
                datosProcesados.ciudades = [];
            }
        }
        
        // Aplicar ordenamiento
        if (orden === 'desc') {
            // Ordenar por total de cada fecha (más visitas primero)
            const indices = datosProcesados.labels
                .map((label, i) => ({
                    label,
                    total: datosProcesados.datasets.reduce((sum, dataset) => sum + (dataset.data[i] || 0), 0)
                }))
                .sort((a, b) => b.total - a.total)
                .map(item => datosProcesados.labels.indexOf(item.label));
            
            datosProcesados.labels = indices.map(i => datosProcesados.labels[i]);
            datosProcesados.datasets.forEach(dataset => {
                dataset.data = indices.map(i => dataset.data[i]);
            });
        } else if (orden === 'asc') {
            // Ordenar por total de cada fecha (menos visitas primero)
            const indices = datosProcesados.labels
                .map((label, i) => ({
                    label,
                    total: datosProcesados.datasets.reduce((sum, dataset) => sum + (dataset.data[i] || 0), 0)
                }))
                .sort((a, b) => a.total - b.total)
                .map(item => datosProcesados.labels.indexOf(item.label));
            
            datosProcesados.labels = indices.map(i => datosProcesados.labels[i]);
            datosProcesados.datasets.forEach(dataset => {
                dataset.data = indices.map(i => dataset.data[i]);
            });
        } else if (orden === 'alpha') {
            // Ordenar alfabéticamente
            const indices = datosProcesados.labels
                .map((label, i) => ({ label, index: i }))
                .sort((a, b) => a.label.localeCompare(b.label))
                .map(item => item.index);
            
            datosProcesados.labels = indices.map(i => datosProcesados.labels[i]);
            datosProcesados.datasets.forEach(dataset => {
                dataset.data = indices.map(i => dataset.data[i]);
            });
        } else if (orden === 'fecha') {
            // Ordenar por fecha (ya está ordenado por defecto)
            // No hacer nada
        }
        
        // Limitar cantidad de períodos
        if (cantidad > 0 && cantidad < datosProcesados.labels.length) {
            datosProcesados.labels = datosProcesados.labels.slice(0, cantidad);
            datosProcesados.datasets.forEach(dataset => {
                dataset.data = dataset.data.slice(0, cantidad);
            });
        }

        // Asegurar que tenga la propiedad ciudades si no la tiene
        if (!datosProcesados.ciudades && datosProcesados.datasets) {
            datosProcesados.ciudades = datosProcesados.datasets.map(d => d.label);
        }
        
        // Recalcular total
        datosProcesados.total = datosProcesados.datasets.reduce((total, dataset) => 
            total + dataset.data.reduce((sum, val) => sum + (val || 0), 0), 0);
        
        return datosProcesados;
    }

    // =============================================
    // FUNCIONES PARA CIUDAD POR TIEMPO - CON BARRAS
    // =============================================

    async function cargarDatosCiudadTiempo(tipo) {
        try {
            mostrarLoading(`Cargando datos por ${tipo}...`);
            
            // Obtener participantes con ciudad y fecha
            const { data: participantes, error } = await supabase
                .from('participantes_reserva')
                .select('id_ciudad, fecha_visita')
                .not('id_ciudad', 'is', null)
                .not('fecha_visita', 'is', null);

            if (error) throw error;

            if (participantes && participantes.length > 0) {
                await procesarDatosCiudadTiempo(participantes, tipo);
                mostrarInterfazCiudadTiempo(tipo);
            } else {
                mostrarSinDatosTiempo(tipo);
            }

            cerrarLoading();
            
        } catch (error) {
            console.error(`Error cargando datos de ${tipo}:`, error);
            cerrarLoading();
            mostrarErrorCiudad(`Error al cargar datos de ${tipo}: ` + error.message);
        }
    }

    async function procesarDatosCiudadTiempo(participantes, tipo) {
        // Obtener información de ciudades
        const idsCiudadesUnicos = [...new Set(participantes.map(p => p.id_ciudad))];
        
        const { data: ciudades, error } = await supabase
            .from('ciudades')
            .select('id, nombre')
            .in('id', idsCiudadesUnicos);

        if (error) throw error;

        const mapaCiudades = {};
        ciudades.forEach(ciudad => {
            mapaCiudades[ciudad.id] = ciudad.nombre;
        });

        const conteo = {};
        const todasLasFechas = [];
        
        // Agrupar por período de tiempo
        participantes.forEach(participante => {
            if (participante.fecha_visita) {
                const fecha = new Date(participante.fecha_visita);
                let clave = '';
                
                switch(tipo) {
                    case 'fecha':
                        clave = fecha.toISOString().split('T')[0];
                        break;
                    case 'mes':
                        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                        clave = `${meses[fecha.getMonth()]} ${fecha.getFullYear()}`;
                        break;
                    case 'anio':
                        clave = fecha.getFullYear().toString();
                        break;
                }
                
                // Agregar a todas las fechas para ordenamiento
                if (!todasLasFechas.includes(clave)) {
                    todasLasFechas.push(clave);
                }
                
                if (!conteo[clave]) {
                    conteo[clave] = {};
                }
                
                // Obtener nombre de ciudad
                const nombreCiudad = mapaCiudades[participante.id_ciudad] || 'Desconocida';
                
                // Contar por ciudad
                if (!conteo[clave][nombreCiudad]) {
                    conteo[clave][nombreCiudad] = 0;
                }
                conteo[clave][nombreCiudad]++;
            }
        });

        // Ordenar fechas
        let labels = ordenarFechas(todasLasFechas, tipo);

        // Obtener todas las ciudades únicas para las series
        const todasCiudadesUnicas = new Set();
        Object.values(conteo).forEach(periodo => {
            Object.keys(periodo).forEach(ciudad => {
                todasCiudadesUnicas.add(ciudad);
            });
        });

        // Convertir a array y ordenar alfabéticamente
        const ciudadesArray = Array.from(todasCiudadesUnicas).sort();

        // Preparar datasets para gráficas AGRUPADAS
        const datasets = ciudadesArray.map(ciudad => {
            // Determinar color basado en la ciudad
            const color = obtenerColorParaCiudad(ciudad);
            
            return {
                label: ciudad,
                data: labels.map(label => conteo[label] ? (conteo[label][ciudad] || 0) : 0),
                backgroundColor: color + 'CC', // Agregar transparencia
                borderColor: color,
                borderWidth: 1,
                borderRadius: 4,
                barThickness: 20,
                categoryPercentage: 0.8,
                barPercentage: 0.9
            };
        });

        // Ordenar datasets por total (mayor a menor)
        const datasetsOrdenados = datasets.sort((a, b) => {
            const totalA = a.data.reduce((sum, val) => sum + val, 0);
            const totalB = b.data.reduce((sum, val) => sum + val, 0);
            return totalB - totalA;
        });

        const datosTiempo = {
            labels: labels,
            datasets: datasetsOrdenados,
            ciudades: ciudadesArray,
            total: participantes.length,
            conteo: conteo
        };

        // Guardar datos
        switch(tipo) {
            case 'fecha': datosFechaCiudad = datosTiempo; break;
            case 'mes': datosMesCiudad = datosTiempo; break;
            case 'anio': datosAnioCiudad = datosTiempo; break;
        }

        console.log(`✅ Datos ${tipo} procesados para gráficas agrupadas:`, datosTiempo);
        return datosTiempo;
    }

    // =============================================
    // FUNCIONES PARA RANGOS DE FECHA
    // =============================================

    async function aplicarRangoFechas(tipo) {
        let fechaInicio = document.getElementById(`filtro-${tipo}-inicio`)?.value;
        let fechaFin = document.getElementById(`filtro-${tipo}-fin`)?.value;
        
        if (!fechaInicio || !fechaFin) {
            Swal.fire({
                icon: 'warning',
                title: 'Fechas requeridas',
                text: 'Por favor selecciona ambas fechas para el rango'
            });
            return;
        }
        
        // CORRECCIÓN: Formatear fechas correctamente según el tipo
        if (tipo === 'anio') {
            // Para año, las fechas ya son solo números
            if (parseInt(fechaInicio) > parseInt(fechaFin)) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Fechas inválidas',
                    text: 'El año inicial no puede ser mayor que el año final'
                });
                return;
            }
            // Formatear para consulta SQL
            fechaInicio = `${fechaInicio}-01-01`;
            fechaFin = `${fechaFin}-12-31`;
        } else if (tipo === 'mes') {
            // Para mes, necesitamos convertir a formato de fecha
            const meses = {
                'Enero': '01', 'Febrero': '02', 'Marzo': '03', 'Abril': '04',
                'Mayo': '05', 'Junio': '06', 'Julio': '07', 'Agosto': '08',
                'Septiembre': '09', 'Octubre': '10', 'Noviembre': '11', 'Diciembre': '12'
            };
            
            // Parsear mes y año
            const [mesInicioStr, añoInicio] = fechaInicio.split(' ');
            const [mesFinStr, añoFin] = fechaFin.split(' ');
            
            const mesInicio = meses[mesInicioStr];
            const mesFin = meses[mesFinStr];
            
            if (!mesInicio || !mesFin) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Formato inválido',
                    text: 'Por favor usa el formato "Mes Año" (ej: Enero 2023)'
                });
                return;
            }
            
            // Obtener último día del mes
            const ultimoDiaMes = new Date(parseInt(añoFin), parseInt(mesFin), 0).getDate();
            
            fechaInicio = `${añoInicio}-${mesInicio}-01`;
            fechaFin = `${añoFin}-${mesFin}-${ultimoDiaMes}`;
        } else {
            // Para fecha normal, validar orden
            if (fechaInicio > fechaFin) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Fechas inválidas',
                    text: 'La fecha inicial no puede ser mayor que la fecha final'
                });
                return;
            }
        }

        try {
            mostrarLoading(`Cargando datos del rango de ${tipo}...`);
            
            let query = supabase
                .from('participantes_reserva')
                .select('id_ciudad, fecha_visita')
                .not('id_ciudad', 'is', null)
                .not('fecha_visita', 'is', null)
                .gte('fecha_visita', fechaInicio + 'T00:00:00')
                .lte('fecha_visita', fechaFin + 'T23:59:59');

            const { data: participantes, error } = await query;

            if (error) throw error;

            if (participantes && participantes.length > 0) {
                await procesarDatosCiudadTiempo(participantes, tipo);
                mostrarInterfazCiudadTiempo(tipo);
                
                Swal.fire({
                    icon: 'success',
                    title: 'Rango aplicado',
                    text: `Se encontraron ${participantes.length} participantes en el rango seleccionado`,
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                mostrarMensajeNoHayDatos('No hay participantes en el rango de fechas seleccionado');
            }

            cerrarLoading();
            
        } catch (error) {
            console.error('Error aplicando rango de fechas:', error);
            cerrarLoading();
            mostrarErrorCiudad('Error al aplicar el rango de fechas: ' + error.message);
        }
    }

    // =============================================
    // INTERFAZ PARA CIUDAD POR TIEMPO - CON BARRAS
    // =============================================

    function mostrarInterfazCiudadTiempo(tipo) {
        const container = document.getElementById('data-container');
        const datos = getDatosCiudadTiempo(tipo);
        const titulo = getTituloTiempo(tipo);
        const icono = getIconoTiempo(tipo);

        container.innerHTML = `
            <div class="chart-controls">
                <div class="chart-header">
                    <h3 style="margin: 0; display: flex; align-items: center; gap: 6px">
                        ${icono} ${titulo}
                        <span style="background: #27ae60; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; margin-left: 10px;">
                            ${datos.total} visitantes
                        </span>
                    </h3>
                    <div style="display: flex; gap: 10px;">
                        <button class="download-btn" onclick="window.CiudadSystem.descargarGraficoPrincipalTiempo('${tipo}')">
                            <i class="fas fa-download"></i> Descargar Gráfico
                        </button>
                        <button class="btn" onclick="window.CiudadSystem.abrirModalTiempoDetalle('${tipo}')" style="background: linear-gradient(135deg, #9b59b6, #8e44ad); color: white;">
                            <i class="fas fa-expand"></i> Ver Detalle Completo
                        </button>
                    </div>
                </div>
                
                <!-- CONTROLES DE RANGO DE FECHA -->
                <div style="margin-top: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                    <h4 style="margin: 0 0 12px 0; display: flex; align-items: center; gap: 6px; color: #2c3e50;">
                        <i class="fas fa-calendar-alt"></i> Rango de ${tipo}
                    </h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div>
                            <label style="font-weight: 600; margin-bottom: 5px; display: block; font-size: 0.9rem;">
                                ${getLabelFechaInicio(tipo)}
                            </label>
                            ${getInputFechaInicio(tipo)}
                        </div>
                        <div>
                            <label style="font-weight: 600; margin-bottom: 5px; display: block; font-size: 0.9rem;">
                                ${getLabelFechaFin(tipo)}
                            </label>
                            ${getInputFechaFin(tipo)}
                        </div>
                        <div style="display: flex; align-items: flex-end;">
                            <button class="btn btn-primary" onclick="window.CiudadSystem.aplicarRangoFechas('${tipo}')" style="width: 100%;">
                                <i class="fas fa-filter"></i> Aplicar Rango
                            </button>
                        </div>
                        <div style="display: flex; align-items: flex-end;">
                            <button class="btn" onclick="window.CiudadSystem.limpiarRangoFechas('${tipo}')" style="width: 100%; background: #95a5a6; color: white;">
                                <i class="fas fa-broom"></i> Limpiar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="charts-grid">
                <div class="chart-card">
                    <div class="chart-card-header">
                        <div class="chart-card-title">
                            <i class="fas fa-chart-bar"></i> ${titulo} - Barras Agrupadas
                        </div>
                        <div class="chart-card-badge">
                            <i class="fas fa-sort-amount-down"></i> Ordenado cronológicamente
                        </div>
                    </div>
                    <div class="chart-canvas-wrap">
                        <canvas id="chart${tipo.charAt(0).toUpperCase() + tipo.slice(1)}Ciudad"></canvas>
                    </div>
                </div>

                <div class="chart-card">
                    <div class="chart-card-header">
                        <div class="chart-card-title">
                            <i class="fas fa-list"></i> Distribución por Ciudad
                        </div>
                        <div class="chart-card-badge">
                            <i class="fas fa-search"></i> Con buscador
                        </div>
                    </div>
                    <div class="chart-canvas-wrap" style="overflow-x: auto;">
                        <div style="padding: 15px;">
                            <!-- BUSCADOR DE CIUDADES -->
                            <div style="margin-bottom: 15px;">
                                <div style="position: relative;">
                                    <i class="fas fa-search" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #7f8c8d;"></i>
                                    <input type="text" 
                                           id="buscador-ciudad-${tipo}" 
                                           style="width: 100%; padding: 8px 8px 8px 35px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;"
                                           placeholder="Buscar ciudad por nombre..."
                                           onkeyup="window.CiudadSystem.filtrarTablaCiudades('${tipo}', this.value)">
                                </div>
                            </div>
                            
                            <!-- LISTA DE CIUDADES -->
                            <div id="lista-ciudades-${tipo}" style="max-height: 250px; overflow-y: auto;">
                                <!-- Se llenará dinámicamente -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- TABLA DE DETALLE -->
            <div class="data-table" style="margin-top: 20px;">
                <div class="chart-header">
                    <h3 style="margin: 0; display: flex; align-items: center; gap: 6px">
                        <i class="fas fa-table"></i> Detalle por ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                        <div style="margin-left: auto; display: flex; gap: 10px;">
                            <button class="btn" onclick="window.CiudadSystem.ordenarTabla('${tipo}', 'desc')" style="background: #e74c3c; color: white; font-size: 12px; padding: 6px 12px;">
                                <i class="fas fa-sort-amount-down"></i> Mayor a menor
                            </button>
                            <button class="btn" onclick="window.CiudadSystem.ordenarTabla('${tipo}', 'asc')" style="background: #3498db; color: white; font-size: 12px; padding: 6px 12px;">
                                <i class="fas fa-sort-amount-up"></i> Menor a mayor
                            </button>
                            <button class="btn" onclick="window.CiudadSystem.ordenarTabla('${tipo}', 'fecha')" style="background: #2ecc71; color: white; font-size: 12px; padding: 6px 12px;">
                                <i class="fas fa-calendar"></i> Por fecha
                            </button>
                        </div>
                    </h3>
                </div>
                <div style="overflow-x: auto;">
                    <table class="table" style="min-width: 800px;" id="tabla-detalle-${tipo}">
                        <thead>
                            <tr>
                                <th>${getTituloColumna(tipo)}</th>
                                <th>Total Ciudades</th>
                                <th>Visitantes</th>
                                <th>Ciudad Principal</th>
                                <th>Detalle</th>
                            </tr>
                        </thead>
                        <tbody id="tabla-${tipo}-body">
                            ${generarFilasTablaCiudadTiempo(datos, tipo)}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        mostrarGraficaCiudadTiempo(tipo);
        llenarListaCiudades(tipo);
    }

    // Funciones auxiliares para controles de fecha
    function getLabelFechaInicio(tipo) {
        switch(tipo) {
            case 'fecha': return 'Fecha Inicial';
            case 'mes': return 'Mes Inicial';
            case 'anio': return 'Año Inicial';
            default: return 'Inicio';
        }
    }

    function getLabelFechaFin(tipo) {
        switch(tipo) {
            case 'fecha': return 'Fecha Final';
            case 'mes': return 'Mes Final';
            case 'anio': return 'Año Final';
            default: return 'Fin';
        }
    }

    function getInputFechaInicio(tipo) {
        const fechaActual = new Date();
        switch(tipo) {
            case 'fecha': 
                const fechaInicioDefault = new Date(fechaActual);
                fechaInicioDefault.setMonth(fechaInicioDefault.getMonth() - 1);
                return `<input type="date" id="filtro-${tipo}-inicio" class="filtro-input" value="${fechaInicioDefault.toISOString().split('T')[0]}">`;
            case 'mes':
                const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                             'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                let añoInicio = fechaActual.getFullYear();
                let mesInicio = fechaActual.getMonth() - 1;
                if (mesInicio < 0) {
                    mesInicio = 11;
                    añoInicio--;
                }
                return `
                    <select id="filtro-${tipo}-inicio" class="filtro-input" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                        ${Array.from({length: 24}, (_, i) => {
                            const fecha = new Date(fechaActual);
                            fecha.setMonth(fecha.getMonth() - i);
                            const mes = fecha.getMonth();
                            const año = fecha.getFullYear();
                            const seleccionado = i === 1 ? 'selected' : '';
                            return `<option value="${meses[mes]} ${año}" ${seleccionado}>${meses[mes]} ${año}</option>`;
                        }).reverse().join('')}
                    </select>`;
            case 'anio':
                return `
                    <select id="filtro-${tipo}-inicio" class="filtro-input" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                        ${Array.from({length: 10}, (_, i) => {
                            const año = fechaActual.getFullYear() - i;
                            const seleccionado = i === 1 ? 'selected' : '';
                            return `<option value="${año}" ${seleccionado}>${año}</option>`;
                        }).join('')}
                    </select>`;
            default:
                return `<input type="date" id="filtro-${tipo}-inicio" class="filtro-input">`;
        }
    }

    function getInputFechaFin(tipo) {
        const fechaActual = new Date();
        switch(tipo) {
            case 'fecha': 
                return `<input type="date" id="filtro-${tipo}-fin" class="filtro-input" value="${fechaActual.toISOString().split('T')[0]}">`;
            case 'mes':
                const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                             'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                return `
                    <select id="filtro-${tipo}-fin" class="filtro-input" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                        ${Array.from({length: 24}, (_, i) => {
                            const fecha = new Date(fechaActual);
                            fecha.setMonth(fecha.getMonth() - i);
                            const mes = fecha.getMonth();
                            const año = fecha.getFullYear();
                            const seleccionado = i === 0 ? 'selected' : '';
                            return `<option value="${meses[mes]} ${año}" ${seleccionado}>${meses[mes]} ${año}</option>`;
                        }).reverse().join('')}
                    </select>`;
            case 'anio':
                return `
                    <select id="filtro-${tipo}-fin" class="filtro-input" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                        ${Array.from({length: 10}, (_, i) => {
                            const año = fechaActual.getFullYear() - i;
                            const seleccionado = i === 0 ? 'selected' : '';
                            return `<option value="${año}" ${seleccionado}>${año}</option>`;
                        }).join('')}
                    </select>`;
            default:
                return `<input type="date" id="filtro-${tipo}-fin" class="filtro-input" value="${fechaActual.toISOString().split('T')[0]}">`;
        }
    }

    // =============================================
    // FUNCIONES AUXILIARES MEJORADAS
    // =============================================

    function obtenerColorParaCiudad(nombreCiudad) {
        if (!nombreCiudad) return '#95a5a6';
        
        // Primero verificar si ya tenemos un color asignado
        if (mapaColoresCiudades[nombreCiudad]) {
            return mapaColoresCiudades[nombreCiudad];
        }
        
        // Si no, asignar uno nuevo
        const ciudadLower = nombreCiudad.toLowerCase();
        
        // Colores predefinidos para ciudades principales
        if (ciudadLower.includes('bogotá') || ciudadLower.includes('bogota')) {
            return '#e74c3c'; // Rojo
        } else if (ciudadLower.includes('medellín') || ciudadLower.includes('medellin')) {
            return '#3498db'; // Azul
        } else if (ciudadLower.includes('cali')) {
            return '#f39c12'; // Naranja
        } else if (ciudadLower.includes('barranquilla')) {
            return '#2ecc71'; // Verde
        } else if (ciudadLower.includes('cartagena')) {
            return '#9b59b6'; // Púrpura
        } else if (ciudadLower.includes('bucaramanga')) {
            return '#1abc9c'; // Turquesa
        }
        
        // Para otras ciudades, generar color único basado en el nombre
        let hash = 0;
        for (let i = 0; i < nombreCiudad.length; i++) {
            hash = nombreCiudad.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        // Usar el hash para generar un color HSL
        const hue = Math.abs(hash % 360);
        const saturation = 70;
        const lightness = 60;
        
        const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        
        // Guardar en el mapa para consistencia
        mapaColoresCiudades[nombreCiudad] = color;
        
        return color;
    }

    function ordenarFechas(fechas, tipo) {
        return fechas.sort((a, b) => {
            switch(tipo) {
                case 'fecha':
                    return new Date(a) - new Date(b);
                case 'mes':
                    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                    const [mesA, añoA] = a.split(' ');
                    const [mesB, añoB] = b.split(' ');
                    
                    if (añoA !== añoB) {
                        return parseInt(añoA) - parseInt(añoB);
                    }
                    return meses.indexOf(mesA) - meses.indexOf(mesB);
                case 'anio':
                    return parseInt(a) - parseInt(b);
                default:
                    return 0;
            }
        });
    }

    function generarFilasTablaCiudadTiempo(datos, tipo) {
        if (!datos.labels || datos.labels.length === 0) {
            return '<tr><td colspan="5" style="text-align: center; padding: 20px;">No hay datos disponibles</td></tr>';
        }

        return datos.labels.map((label, index) => {
            // Calcular total para este período
            let totalPeriodo = 0;
            let ciudadesPeriodo = new Set();
            let ciudadPrincipal = '';
            let maxVisitantes = 0;
            
            datos.datasets.forEach(dataset => {
                const valor = dataset.data[index] || 0;
                totalPeriodo += valor;
                if (valor > 0) {
                    ciudadesPeriodo.add(dataset.label);
                    if (valor > maxVisitantes) {
                        maxVisitantes = valor;
                        ciudadPrincipal = dataset.label;
                    }
                }
            });
            
            const numCiudades = ciudadesPeriodo.size;
            const colorPrincipal = obtenerColorParaCiudad(ciudadPrincipal);
            
            return `
                <tr data-fecha="${label}" data-total="${totalPeriodo}">
                    <td><strong>${label}</strong></td>
                    <td style="text-align: center;">${numCiudades}</td>
                    <td style="text-align: center; font-weight: bold;">${totalPeriodo.toLocaleString()}</td>
                    <td>
                        ${ciudadPrincipal ? `
                        <span class="ciudad-badge-mini" style="background: ${colorPrincipal}; color: white; padding: 3px 8px; border-radius: 12px; display: inline-flex; align-items: center; gap: 4px;">
                            <i class="fas fa-city"></i> ${ciudadPrincipal} (${maxVisitantes})
                        </span>` : 'N/A'}
                    </td>
                    <td>
                        <button class="btn-detalle" onclick="window.CiudadSystem.mostrarDetallePeriodo('${tipo}', '${label}')" style="background: #f8f9fa; border: 1px solid #ddd; padding: 6px 12px; border-radius: 6px; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 5px;">
                            <i class="fas fa-eye"></i> Ver detalle
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // FUNCIÓN PRINCIPAL CAMBIADA: Ahora usa gráficos de barras agrupadas
    function mostrarGraficaCiudadTiempo(tipo) {
        const datos = getDatosCiudadTiempo(tipo);
        const ctx = document.getElementById(`chart${tipo.charAt(0).toUpperCase() + tipo.slice(1)}Ciudad`);
        
        if (!ctx || !datos.labels || datos.labels.length === 0) return;
        
        // Destruir gráfica anterior si existe
        if (chartInstances[tipo]) {
            chartInstances[tipo].destroy();
        }
        
        // Ordenar datasets por total (mayor a menor) para mejor visualización
        const datasetsOrdenados = [...datos.datasets]
            .sort((a, b) => {
                const totalA = a.data.reduce((sum, val) => sum + val, 0);
                const totalB = b.data.reduce((sum, val) => sum + val, 0);
                return totalB - totalA;
            })
            .slice(0, 8); // Mostrar solo las 8 ciudades principales para mejor visualización
        
        chartInstances[tipo] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: datos.labels,
                datasets: datasetsOrdenados
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: getTituloTiempo(tipo) + ` (${datos.total} visitantes)`,
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        position: 'top',
                        labels: {
                            boxWidth: 12,
                            padding: 15,
                            usePointStyle: true,
                            font: { size: 11 }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleFont: { size: 12 },
                        bodyFont: { size: 12 },
                        padding: 10,
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y} visitantes`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        stacked: false,
                        title: {
                            display: true,
                            text: 'Cantidad de Visitantes'
                        },
                        ticks: {
                            stepSize: 1
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: tipo === 'fecha' ? 45 : 0,
                            font: {
                                size: tipo === 'fecha' ? 10 : 12
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    function llenarListaCiudades(tipo) {
        const datos = getDatosCiudadTiempo(tipo);
        const container = document.getElementById(`lista-ciudades-${tipo}`);
        
        if (!container) return;
        
        // Calcular totales por ciudad
        const ciudadesConTotal = datos.ciudades.map(ciudad => {
            const dataset = datos.datasets.find(d => d.label === ciudad);
            const total = dataset ? dataset.data.reduce((a, b) => a + b, 0) : 0;
            return { ciudad, total };
        });
        
        // Ordenar de mayor a menor
        ciudadesConTotal.sort((a, b) => b.total - a.total);
        
        container.innerHTML = ciudadesConTotal.map(item => {
            const porcentaje = datos.total > 0 ? ((item.total / datos.total) * 100).toFixed(1) : 0;
            const color = obtenerColorParaCiudad(item.ciudad);
            
            return `
                <div class="ciudad-item" style="padding: 8px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; cursor: pointer;" 
                     onclick="window.CiudadSystem.mostrarDetalleCiudad('${tipo}', '${item.ciudad}')"
                     onmouseover="this.style.backgroundColor='#f8f9fa'" 
                     onmouseout="this.style.backgroundColor='transparent'">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 12px; height: 12px; border-radius: 50%; background: ${color};"></div>
                        <span style="font-weight: 600; font-size: 14px;">${item.ciudad}</span>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: bold; font-size: 14px;">${item.total}</div>
                        <div style="font-size: 12px; color: #27ae60;">${porcentaje}%</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // =============================================
    // MODAL PARA DETALLE COMPLETO - CON BARRAS
    // =============================================

    function abrirModalTiempoDetalle(tipo) {
        const datos = getDatosCiudadTiempo(tipo);
        const titulo = getTituloTiempo(tipo);
        
        // Crear modal
        const modalHTML = `
            <div class="modal-overlay" id="modal-tiempo-detalle" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 10000; padding: 20px;">
                <div style="background: white; border-radius: 12px; width: 90%; max-width: 1400px; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; display: flex; justify-content: space-between; align-items: center;">
                        <h2 style="margin: 0; display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-chart-bar"></i> ${titulo} - Vista Detallada
                        </h2>
                        <button onclick="document.getElementById('modal-tiempo-detalle').remove()" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div style="display: flex; height: calc(90vh - 140px);">
                        <!-- Panel izquierdo: Gráfico de BARRAS -->
                        <div style="flex: 3; padding: 20px; border-right: 1px solid #eee; display: flex; flex-direction: column;">
                            <h3 style="margin: 0 0 15px 0; color: #2c3e50;">
                                <i class="fas fa-chart-bar"></i> Distribución Temporal por Ciudad
                            </h3>
                            <div style="flex: 1; position: relative;">
                                <canvas id="chartModalDetalle"></canvas>
                            </div>
                        </div>
                        
                        <!-- Panel derecho: Datos -->
                        <div style="flex: 2; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px;">
                            <div>
                                <h3 style="margin: 0 0 10px 0; color: #2c3e50;">
                                    <i class="fas fa-info-circle"></i> Estadísticas Generales
                                </h3>
                                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                                    <div style="text-align: center; padding: 15px; background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-radius: 8px; border: 1px solid #dee2e6;">
                                        <div style="font-size: 12px; color: #6c757d; margin-bottom: 5px;">Total Visitantes</div>
                                        <div style="font-size: 28px; font-weight: bold; color: #27ae60;">${datos.total}</div>
                                    </div>
                                    <div style="text-align: center; padding: 15px; background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-radius: 8px; border: 1px solid #dee2e6;">
                                        <div style="font-size: 12px; color: #6c757d; margin-bottom: 5px;">Total Ciudades</div>
                                        <div style="font-size: 28px; font-weight: bold; color: #3498db;">${datos.ciudades.length}</div>
                                    </div>
                                    <div style="text-align: center; padding: 15px; background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-radius: 8px; border: 1px solid #dee2e6; grid-column: span 2;">
                                        <div style="font-size: 12px; color: #6c757d; margin-bottom: 5px;">Períodos Analizados</div>
                                        <div style="font-size: 24px; font-weight: bold; color: #e74c3c;">${datos.labels.length}</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <h3 style="margin: 0 0 10px 0; color: #2c3e50;">
                                    <i class="fas fa-city"></i> Ciudades Principales
                                </h3>
                                <div id="lista-ciudades-modal" style="max-height: 200px; overflow-y: auto;">
                                    <!-- Se llenará dinámicamente -->
                                </div>
                            </div>
                            
                            <div>
                                <h3 style="margin: 0 0 10px 0; color: #2c3e50;">
                                    <i class="fas fa-download"></i> Exportar Datos
                                </h3>
                                <div style="display: flex; gap: 10px;">
                                    <button onclick="window.CiudadSystem.exportarExcelModal('${tipo}')" style="flex: 1; background: linear-gradient(135deg, #27ae60, #2ecc71); color: white; padding: 12px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px;">
                                        <i class="fas fa-file-excel"></i> Excel
                                    </button>
                                    <button onclick="window.CiudadSystem.exportarPDFModal('${tipo}')" style="flex: 1; background: linear-gradient(135deg, #e74c3c, #c0392b); color: white; padding: 12px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px;">
                                        <i class="fas fa-file-pdf"></i> PDF
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 15px; display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid #eee;">
                        <button onclick="document.getElementById('modal-tiempo-detalle').remove()" style="background: #95a5a6; color: white; padding: 10px 20px; border-radius: 6px; border: none; cursor: pointer; font-weight: 600;">
                            Cerrar
                        </button>
                        <button onclick="window.CiudadSystem.descargarGraficoModal()" style="background: linear-gradient(135deg, #3498db, #2980b9); color: white; padding: 10px 20px; border-radius: 6px; border: none; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-download"></i> Descargar Gráfico
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Agregar modal al DOM
        const modalDiv = document.createElement('div');
        modalDiv.innerHTML = modalHTML;
        document.body.appendChild(modalDiv.firstElementChild);
        
        // Inicializar gráfico y datos del modal
        inicializarGraficoModal(tipo);
        llenarListaCiudadesModal(tipo);
    }

    // Función para abrir modal de ciudad CON FILTROS DENTRO
    function abrirModalCiudad(tipoGrafica) {
        const modal = document.getElementById("chartModalCiudad");
        if (!modal) {
            console.error('Modal no encontrado');
            return;
        }
        
        // Limpiar modal anterior
        const modalContent = document.querySelector('.modal-content');
        if (modalContent) {
            modalContent.innerHTML = '';
        }
        
        modal.classList.add("show");
        
        // Actualizar contenido del modal
        actualizarContenidoModal('ciudad', tipoGrafica);
        
        // Crear gráfica ampliada
        setTimeout(() => {
            crearGraficaAmpliadaCiudad(tipoGrafica);
            llenarTablaModalCiudad();
        }, 100);
    }

    // Llenar tabla del modal de ciudad
    function llenarTablaModalCiudad() {
        const tbody = document.getElementById("tbodyDatosCiudad");
        if (!tbody) return;

        const { labels, values, total } = datosCiudades.general;

        tbody.innerHTML = labels.map((ciudad, index) => {
            const cantidad = values[index];
            const porcentaje = total > 0 ? ((cantidad / total) * 100).toFixed(1) : 0;
            const descripcion = obtenerDescripcionCiudad(ciudad);
            
            return `
                <tr>
                    <td><strong>${ciudad}</strong></td>
                    <td>${descripcion}</td>
                    <td style="text-align: center; font-weight: bold">${cantidad.toLocaleString()}</td>
                    <td style="text-align: center; color: #e74c3c; font-weight: bold">${porcentaje}%</td>
                </tr>
            `;
        }).join('') + (total > 0 ? `
            <tr style="background: #f8f9fa; font-weight: bold;">
                <td colspan="2">TOTAL GENERAL</td>
                <td style="text-align: center">${total.toLocaleString()}</td>
                <td style="text-align: center">100%</td>
            </tr>
        ` : '');
    }

    function formatearFecha(fecha, tipo) {
        switch(tipo) {
            case 'fecha':
                const fechaObj = new Date(fecha);
                return fechaObj.toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
            case 'mes':
                return 'Mes completo';
            case 'anio':
                return 'Año completo';
            default:
                return fecha;
        }
    }

    function obtenerColorParaCiudad(nombreCiudad) {
        if (!nombreCiudad) return '#95a5a6';
        
        // Primero verificar si ya tenemos un color asignado
        if (mapaColoresCiudades[nombreCiudad]) {
            return mapaColoresCiudades[nombreCiudad];
        }
        
        // Si no, asignar uno nuevo
        const ciudadLower = nombreCiudad.toLowerCase();
        
        // Colores predefinidos para ciudades principales
        if (ciudadLower.includes('bogotá') || ciudadLower.includes('bogota')) {
            return '#e74c3c'; // Rojo
        } else if (ciudadLower.includes('medellín') || ciudadLower.includes('medellin')) {
            return '#3498db'; // Azul
        } else if (ciudadLower.includes('cali')) {
            return '#f39c12'; // Naranja
        } else if (ciudadLower.includes('barranquilla')) {
            return '#2ecc71'; // Verde
        } else if (ciudadLower.includes('cartagena')) {
            return '#9b59b6'; // Púrpura
        } else if (ciudadLower.includes('bucaramanga')) {
            return '#1abc9c'; // Turquesa
        }
        
        // Para otras ciudades, generar color único basado en el nombre
        let hash = 0;
        for (let i = 0; i < nombreCiudad.length; i++) {
            hash = nombreCiudad.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        // Usar el hash para generar un color HSL
        const hue = Math.abs(hash % 360);
        const saturation = 70;
        const lightness = 60;
        
        const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        
        // Guardar en el mapa para consistencia
        mapaColoresCiudades[nombreCiudad] = color;
        
        return color;
    }

    function ordenarFechas(fechas, tipo) {
        return fechas.sort((a, b) => {
            switch(tipo) {
                case 'fecha':
                    return new Date(a) - new Date(b);
                case 'mes':
                    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                    const [mesA, añoA] = a.split(' ');
                    const [mesB, añoB] = b.split(' ');
                    
                    if (añoA !== añoB) {
                        return parseInt(añoA) - parseInt(añoB);
                    }
                    return meses.indexOf(mesA) - meses.indexOf(mesB);
                case 'anio':
                    return parseInt(a) - parseInt(b);
                default:
                    return 0;
            }
        });
    }

    function obtenerDescripcionCiudad(ciudad) {
        const ciudadLower = ciudad.toLowerCase();
        if (ciudadLower.includes('bogotá') || ciudadLower.includes('bogota')) {
            return 'Capital de Colombia';
        } else if (ciudadLower.includes('medellín') || ciudadLower.includes('medellin')) {
            return 'Ciudad de la eterna primavera';
        } else if (ciudadLower.includes('cali')) {
            return 'Capital mundial de la salsa';
        } else if (ciudadLower === 'otras ciudades') {
            return `${datosCiudades.detallado.otrasCiudades.length} ciudades adicionales`;
        } else {
            return 'Ciudad de Colombia';
        }
    }

    function getDatosCiudadTiempo(tipo) {
        switch(tipo) {
            case 'fecha': return datosFechaCiudad || { labels: [], datasets: [], ciudades: [], total: 0 };
            case 'mes': return datosMesCiudad || { labels: [], datasets: [], ciudades: [], total: 0 };
            case 'anio': return datosAnioCiudad || { labels: [], datasets: [], ciudades: [], total: 0 };
            default: return { labels: [], datasets: [], ciudades: [], total: 0 };
        }
    }

    function getTituloTiempo(tipo) {
        const titulos = {
            'fecha': '🏙️ Ciudad por Fecha',
            'mes': '🏙️ Ciudad por Mes', 
            'anio': '🏙️ Ciudad por Año'
        };
        return titulos[tipo] || 'Ciudad por Tiempo';
    }

     function darkenColor(color, factor) {
        if (color.startsWith('#')) {
            let r = parseInt(color.slice(1, 3), 16);
            let g = parseInt(color.slice(3, 5), 16);
            let b = parseInt(color.slice(5, 7), 16);
            
            r = Math.max(0, Math.floor(r * (1 - factor)));
            g = Math.max(0, Math.floor(g * (1 - factor)));
            b = Math.max(0, Math.floor(b * (1 - factor)));
            
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        }
        return color;
    }

    function mostrarLoading(mensaje) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: mensaje,
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });
        }
    }

    function cerrarLoading() {
        if (typeof Swal !== 'undefined') Swal.close();
    }

    function mostrarErrorCiudad(mensaje = 'Error al cargar los datos de ciudad') {
        const container = document.getElementById('data-container');
        container.innerHTML = `
            <div class="no-data" style="text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #e74c3c;"></i>
                <h3 style="color: #e74c3c;">Error al cargar datos</h3>
                <p>${mensaje}</p>
                <button class="btn btn-primary" onclick="window.CiudadSystem.cargarDatos()" style="background: #3498db; color: white; padding: 10px 20px; border-radius: 6px; border: none; cursor: pointer;">
                    <i class="fas fa-redo"></i> Reintentar
                </button>
            </div>
        `;
    }

    function mostrarSinDatosCiudad() {
        const container = document.getElementById('data-container');
        container.innerHTML = `
            <div class="no-data" style="text-align: center; padding: 40px;">
                <i class="fas fa-city" style="font-size: 48px; color: #7f8c8d;"></i>
                <h3>No hay datos de ciudades disponibles</h3>
                <p>No se encontraron participantes con ciudad registrada.</p>
                <button class="btn btn-primary" onclick="window.CiudadSystem.cargarDatos()" style="background: #3498db; color: white; padding: 10px 20px; border-radius: 6px; border: none; cursor: pointer;">
                    <i class="fas fa-redo"></i> Reintentar
                </button>
            </div>
        `;
    }

    function mostrarSinDatosTiempo(tipo) {
        const container = document.getElementById('data-container');
        container.innerHTML = `
            <div class="no-data" style="text-align: center; padding: 40px;">
                <i class="fas fa-calendar-times" style="font-size: 48px; color: #7f8c8d;"></i>
                <h3>No hay datos de ${tipo} disponibles</h3>
                <p>No se encontraron visitantes con fechas de visita registradas.</p>
                <button class="btn btn-primary" onclick="window.CiudadSystem.cargarDatosCiudadTiempo('${tipo}')" style="background: #3498db; color: white; padding: 10px 20px; border-radius: 6px; border: none; cursor: pointer;">
                    <i class="fas fa-redo"></i> Reintentar
                </button>
            </div>
        `;
    }

    function mostrarExito(mensaje) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: mensaje,
                timer: 3000,
                showConfirmButton: false
            });
        }
    }

    function actualizarEstadisticas() {
        const stats = datosCiudades.estadisticas;
        
        // Actualizar tarjetas de estadísticas
        if (document.getElementById('total-visitantes')) {
            document.getElementById('total-visitantes').textContent = 
                stats.totalParticipantes.toLocaleString();
        }
        
        if (document.getElementById('visitantes-con-ciudad')) {
            document.getElementById('visitantes-con-ciudad').textContent = 
                stats.totalConCiudad.toLocaleString();
        }
        
        if (document.getElementById('total-ciudades')) {
            document.getElementById('total-ciudades').textContent = 
                stats.totalCiudadesUnicas.toLocaleString();
        }
    }


    // Llenar tabla del modal de tiempo con datos filtrados
    function llenarTablaModalCiudadTiempoConDatos(tipo, datosFiltrados) {
        const tbody = document.getElementById("tbodyDatosCiudad");
        if (!tbody) return;

        // Verificar si tenemos datos
        if (!datosFiltrados || !datosFiltrados.datasets || datosFiltrados.datasets.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px; color: #7f8c8d;">
                        <i class="fas fa-exclamation-circle"></i> No hay datos disponibles con los filtros
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        const totalGeneral = datosFiltrados.total || 0;
        
        // Si solo hay una ciudad, mostrar formato simple
        if (datosFiltrados.ciudades.length === 1) {
            const ciudad = datosFiltrados.ciudades[0];
            const dataset = datosFiltrados.datasets[0];
            
            html += `
                <tr style="background: #f8f9fa; font-weight: bold;">
                    <th>Fecha/Período</th>
                    <th>Fecha Formato</th>
                    <th>${ciudad}</th>
                    <th>Porcentaje</th>
                </tr>
            `;
            
            datosFiltrados.labels.forEach((fecha, fechaIndex) => {
                const valor = dataset.data[fechaIndex] || 0;
                const porcentaje = totalGeneral > 0 ? ((valor / totalGeneral) * 100).toFixed(1) : 0;
                
                html += `
                    <tr>
                        <td><strong>${fecha}</strong></td>
                        <td>${formatearFecha(fecha, tipo)}</td>
                        <td style="text-align: center; font-weight: bold">${valor.toLocaleString()}</td>
                        <td style="text-align: center; color: #e74c3c; font-weight: bold">${porcentaje}%</td>
                    </tr>
                `;
            });
            
            const totalCiudad = dataset.data.reduce((sum, val) => sum + (val || 0), 0);
            
            html += `
                <tr style="background: #f0f7ff; font-weight: bold;">
                    <td colspan="2"><strong>TOTAL ${ciudad}</strong></td>
                    <td style="text-align: center; background: #e74c3c; color: white;">${totalCiudad.toLocaleString()}</td>
                    <td style="text-align: center; background: #e74c3c; color: white;">100%</td>
                </tr>
            `;
        } else {
            // Formato para múltiples ciudades
            html += `
                <tr style="background: #f8f9fa; font-weight: bold;">
                    <th>Fecha/Período</th>
                    <th>Fecha Formato</th>
                    ${datosFiltrados.ciudades.map(ciudad => `<th>${ciudad}</th>`).join('')}
                    <th>Total</th>
                </tr>
            `;
            
            datosFiltrados.labels.forEach((fecha, fechaIndex) => {
                const totalPorFecha = datosFiltrados.datasets.reduce((sum, dataset) => 
                    sum + (dataset.data[fechaIndex] || 0), 0);
                
                html += `
                    <tr>
                        <td><strong>${fecha}</strong></td>
                        <td>${formatearFecha(fecha, tipo)}</td>
                        ${datosFiltrados.datasets.map(dataset => 
                            `<td style="text-align: center; font-weight: ${dataset.data[fechaIndex] > 0 ? 'bold' : 'normal'}">
                                ${(dataset.data[fechaIndex] || 0).toLocaleString()}
                            </td>`
                        ).join('')}
                        <td style="text-align: center; background: #ffeaa7; font-weight: bold;">
                            ${totalPorFecha.toLocaleString()}
                        </td>
                    </tr>
                `;
            });
            
            // Fila de totales
            html += `
                <tr style="background: #f0f7ff; font-weight: bold;">
                    <td colspan="2"><strong>Total por Ciudad</strong></td>
                    ${datosFiltrados.datasets.map(dataset => {
                        const totalCiudad = dataset.data.reduce((sum, val) => sum + (val || 0), 0);
                        return `<td style="text-align: center; color: #e74c3c;">${totalCiudad.toLocaleString()}</td>`;
                    }).join('')}
                    <td style="text-align: center; background: #e74c3c; color: white;">
                        ${totalGeneral.toLocaleString()}
                    </td>
                </tr>
            `;
        }
        
        tbody.innerHTML = html;
    }

    // Llenar tabla del modal de tiempo
    function llenarTablaModalCiudadTiempo(tipo) {
        const tbody = document.getElementById("tbodyDatosCiudad");
        if (!tbody) return;

        const datos = getDatosCiudadTiempo(tipo);
        
        // Verificar si tenemos datos
        if (!datos || !datos.datasets || datos.datasets.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px; color: #7f8c8d;">
                        <i class="fas fa-exclamation-circle"></i> No hay datos disponibles
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        const totalGeneral = datos.total || 0;
        
        // Encabezado para formato de barras agrupadas
        html += `
            <tr style="background: #f8f9fa; font-weight: bold;">
                <th>Fecha/Período</th>
                <th>Fecha Formato</th>
                ${datos.ciudades.slice(0, 5).map(ciudad => `<th>${ciudad}</th>`).join('')}
                ${datos.ciudades.length > 5 ? '<th>Otras</th>' : ''}
                <th>Total</th>
            </tr>
        `;
        
        // Filas de datos para cada fecha
        datos.labels.forEach((fecha, fechaIndex) => {
            const totalPorFecha = datos.datasets.reduce((sum, dataset) => 
                sum + (dataset.data[fechaIndex] || 0), 0);
            
            // Calcular total de "otras" ciudades (más allá de las 5 principales)
            let otrasTotal = 0;
            if (datos.ciudades.length > 5) {
                otrasTotal = datos.datasets.slice(5).reduce((sum, dataset) => 
                    sum + (dataset.data[fechaIndex] || 0), 0);
            }
            
            html += `
                <tr>
                    <td><strong>${fecha}</strong></td>
                    <td>${formatearFecha(fecha, tipo)}</td>
                    ${datos.datasets.slice(0, 5).map(dataset => 
                        `<td style="text-align: center; font-weight: ${dataset.data[fechaIndex] > 0 ? 'bold' : 'normal'}">
                            ${(dataset.data[fechaIndex] || 0).toLocaleString()}
                        </td>`
                    ).join('')}
                    ${datos.ciudades.length > 5 ? 
                        `<td style="text-align: center; color: #7f8c8d; font-weight: ${otrasTotal > 0 ? 'bold' : 'normal'}">
                            ${otrasTotal.toLocaleString()}
                        </td>` : ''}
                    <td style="text-align: center; background: #ffeaa7; font-weight: bold;">
                        ${totalPorFecha.toLocaleString()}
                    </td>
                </tr>
            `;
        });
        
        // Fila de totales
        html += `
            <tr style="background: #f0f7ff; font-weight: bold;">
                <td colspan="2"><strong>Total por Ciudad</strong></td>
                ${datos.datasets.slice(0, 5).map(dataset => {
                    const totalCiudad = dataset.data.reduce((sum, val) => sum + (val || 0), 0);
                    return `<td style="text-align: center; color: #e74c3c;">${totalCiudad.toLocaleString()}</td>`;
                }).join('')}
                ${datos.ciudades.length > 5 ? 
                    `<td style="text-align: center; color: #7f8c8d;">
                        ${datos.datasets.slice(5).reduce((sum, dataset) => 
                            sum + dataset.data.reduce((s, v) => s + (v || 0), 0), 0).toLocaleString()}
                    </td>` : ''}
                <td style="text-align: center; background: #e74c3c; color: white;">
                    ${totalGeneral.toLocaleString()}
                </td>
            </tr>
        `;
        
        tbody.innerHTML = html;
    }

    // Llenar tabla del modal de ciudad con datos filtrados
    function llenarTablaModalCiudadConDatos(datosFiltrados) {
        const tbody = document.getElementById("tbodyDatosCiudad");
        if (!tbody) return;

        tbody.innerHTML = datosFiltrados.labels.map((ciudad, index) => {
            const cantidad = datosFiltrados.values[index];
            const porcentaje = datosFiltrados.total > 0 ? ((cantidad / datosFiltrados.total) * 100).toFixed(1) : 0;
            const descripcion = obtenerDescripcionCiudad(ciudad);
            
            return `
                <tr>
                    <td><strong>${ciudad}</strong></td>
                    <td>${descripcion}</td>
                    <td style="text-align: center; font-weight: bold">${cantidad.toLocaleString()}</td>
                    <td style="text-align: center; color: #e74c3c; font-weight: bold">${porcentaje}%</td>
                </tr>
            `;
        }).join('') + (datosFiltrados.total > 0 ? `
            <tr style="background: #f8f9fa; font-weight: bold;">
                <td colspan="2">TOTAL GENERAL</td>
                <td style="text-align: center">${datosFiltrados.total.toLocaleString()}</td>
                <td style="text-align: center">100%</td>
            </tr>
        ` : '');
    }


    // Crear gráfica ampliada de tiempo
    function crearGraficaAmpliadaCiudadTiempo(tipo, tipoGrafica, datosFiltrados = null) {
        const canvas = document.getElementById("chartAmpliadoCiudad");
        if (!canvas) {
            console.error('❌ Canvas no encontrado!');
            return;
        }
        
        const ctx = canvas.getContext('2d');

        // Destruir gráfica anterior si existe
        if (chartAmpliadoCiudad) {
            chartAmpliadoCiudad.destroy();
        }

        // Usar datos filtrados si se proporcionan, SINO datos originales
        let datos;
        if (datosFiltrados) {
            datos = datosFiltrados;
            console.log('✅ Usando datos filtrados en modal');
        } else {
            datos = getDatosCiudadTiempo(tipo);
            console.log('✅ Usando datos originales en modal');
        }

        // Verificar si tenemos datos
        if (!datos || !datos.datasets || datos.datasets.length === 0) {
            console.log('⚠️ No hay datos para el modal');
            // Mostrar gráfica vacía con mensaje
            chartAmpliadoCiudad = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Sin datos'],
                    datasets: [{
                        data: [100],
                        backgroundColor: ['#95a5a6']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'No hay datos disponibles',
                            font: { size: 16, weight: 'bold' }
                        }
                    }
                }
            });
            return;
        }

        const tipoChart = tipoGrafica;

        if (tipoChart === 'bar') {
            // Verificar que tenemos datos
            if (!datos.datasets || datos.datasets.length === 0) {
                console.log('⚠️ No hay datasets para el gráfico de barras');
                return;
            }
            
            console.log('📊 Creando gráfico de barras AGRUPADAS con', datos.datasets.length, 'datasets');
            
            // Limitar a las 8 ciudades principales para mejor visualización
            const datasetsLimitados = datos.datasets.slice(0, 8);
            
            chartAmpliadoCiudad = new Chart(ctx, {
                type: tipoChart,
                data: {
                    labels: datos.labels,
                    datasets: datasetsLimitados
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                padding: 15,
                                usePointStyle: true,
                                font: { size: 12 }
                            }
                        },
                        title: {
                            display: true,
                            text: `${getTituloTiempo(tipo)} - Vista Ampliada ${datosFiltrados ? '(Filtrado)' : ''}`,
                            font: { size: 18, weight: 'bold' },
                            padding: 20
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            titleFont: { size: 14 },
                            bodyFont: { size: 14 },
                            padding: 12,
                            cornerRadius: 8,
                            callbacks: {
                                label: function(context) {
                                    const label = context.dataset.label || '';
                                    const value = context.raw || 0;
                                    return `${label}: ${value} visitantes`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            stacked: false,
                            grid: { color: 'rgba(0,0,0,0.1)' },
                            title: {
                                display: true,
                                text: 'Cantidad de Visitantes',
                                font: { weight: 'bold', size: 14 }
                            }
                        },
                        x: {
                            stacked: false,
                            grid: { display: false },
                            title: {
                                display: true,
                                text: getTituloTiempo(tipo).split(' ')[2] || 'Período',
                                font: { weight: 'bold', size: 14 }
                            },
                            ticks: {
                                maxRotation: tipo === 'fecha' ? 45 : 0,
                                minRotation: 0
                            }
                        }
                    }
                }
            });
        } else if (tipoChart === 'doughnut' || tipoChart === 'pie') {
            // Calcular totales por ciudad
            const totalesPorCiudad = {};
            datos.datasets.forEach(dataset => {
                const total = dataset.data.reduce((sum, val) => sum + (val || 0), 0);
                if (total > 0) {
                    totalesPorCiudad[dataset.label] = total;
                }
            });
            
            const labels = Object.keys(totalesPorCiudad);
            const data = Object.values(totalesPorCiudad);

            chartAmpliadoCiudad = new Chart(ctx, {
                type: tipoChart,
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: labels.map((label, index) => 
                            obtenerColorParaCiudad(label)
                        ),
                        borderColor: '#fff',
                        borderWidth: 2,
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                padding: 15,
                                usePointStyle: true,
                                font: { size: 12 }
                            }
                        },
                        title: {
                            display: true,
                            text: `${getTituloTiempo(tipo)} - Distribución por Ciudad ${datosFiltrados ? '(Filtrado)' : ''}`,
                            font: { size: 18, weight: 'bold' },
                            padding: 20
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            titleFont: { size: 14 },
                            bodyFont: { size: 14 },
                            padding: 12,
                            cornerRadius: 8,
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                    return `${label}: ${value} visitantes (${percentage}%)`;
                                }
                            }
                        }
                    },
                    cutout: tipoChart === 'doughnut' ? '50%' : '0%'
                }
            });
        }
    }


    // Crear gráfica ampliada de ciudad con datos filtrados
    function crearGraficaAmpliadaCiudadConDatos(datosFiltrados, tipoGrafica) {
        const ctx = document.getElementById("chartAmpliadoCiudad");
        if (!ctx) return;

        if (chartAmpliadoCiudad) {
            chartAmpliadoCiudad.destroy();
        }

        const tipoChart = tipoGrafica;

        chartAmpliadoCiudad = new Chart(ctx, {
            type: tipoChart,
            data: {
                labels: datosFiltrados.labels,
                datasets: [{
                    label: "Cantidad de Visitantes",
                    data: datosFiltrados.values,
                    backgroundColor: datosFiltrados.colors,
                    borderColor: tipoChart === "bar" ? 'transparent' : datosFiltrados.colors.map(color => darkenColor(color, 0.2)),
                    borderWidth: tipoChart === "bar" ? 0 : 2,
                    borderRadius: tipoChart === "bar" ? 8 : 0,
                    barThickness: tipoChart === "bar" ? 35 : undefined,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: tipoChart === "bar" ? 'top' : 'right',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            font: { size: 12 }
                        }
                    },
                    title: {
                        display: true,
                        text: datosFiltrados.labels.length === 1 ? 
                            `Visitantes de ${datosFiltrados.labels[0]}` : 
                            'Distribución por Ciudad (Filtrado)',
                        font: { size: 18, weight: 'bold' },
                        padding: 20
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleFont: { size: 14 },
                        bodyFont: { size: 14 },
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed.y || context.parsed;
                                const percentage = Math.round((value / datosFiltrados.total) * 100);
                                return `${label}: ${value} visitantes (${percentage}%)`;
                            }
                        }
                    }
                },
                scales: tipoChart === "bar" ? {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.1)' },
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
                            text: 'Ciudad',
                            font: { weight: 'bold', size: 14 }
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 0
                        }
                    }
                } : {},
                cutout: tipoChart === "bar" ? '0%' : (tipoChart === 'doughnut' ? '40%' : '0%')
            },
        });
    }

    // Crear gráfica ampliada de ciudad
    function crearGraficaAmpliadaCiudad(tipoGrafica) {
        const ctx = document.getElementById("chartAmpliadoCiudad");
        if (!ctx) return;

        // Destruir gráfica anterior si existe
        if (chartAmpliadoCiudad) {
            chartAmpliadoCiudad.destroy();
        }

        const { labels, values, colors, total } = datosCiudades.general;
        const tipoChart = tipoGrafica;

        chartAmpliadoCiudad = new Chart(ctx, {
            type: tipoChart,
            data: {
                labels: labels,
                datasets: [{
                    label: "Cantidad de Visitantes",
                    data: values,
                    backgroundColor: colors,
                    borderColor: tipoChart === "bar" ? 'transparent' : colors.map(color => darkenColor(color, 0.2)),
                    borderWidth: tipoChart === "bar" ? 0 : 2,
                    borderRadius: tipoChart === "bar" ? 8 : 0,
                    barThickness: tipoChart === "bar" ? 35 : undefined,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: tipoChart === "bar" ? 'top' : 'right',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            font: { size: 12 }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Distribución por Ciudad - Vista Ampliada',
                        font: { size: 18, weight: 'bold' },
                        padding: 20
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleFont: { size: 14 },
                        bodyFont: { size: 14 },
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed.y || context.parsed;
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} visitantes (${percentage}%)`;
                            }
                        }
                    }
                },
                scales: tipoChart === "bar" ? {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.1)' },
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
                            text: 'Ciudad',
                            font: { weight: 'bold', size: 14 }
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 0
                        }
                    }
                } : {},
                cutout: tipoChart === "bar" ? '0%' : (tipoChart === 'doughnut' ? '40%' : '0%')
            },
        });
    }


    // Función para abrir modal de tiempo CON FILTROS DENTRO
    function abrirModalCiudadTiempo(tipo, tipoGrafica) {
        const modal = document.getElementById("chartModalCiudad");
        if (!modal) {
            console.error('Modal no encontrado');
            return;
        }
        
        // DEBUG
        console.log('🎯 Abriendo modal para tipo:', tipo, 'con gráfica:', tipoGrafica);
        
        // Limpiar modal anterior
        const modalContent = document.querySelector('.modal-content');
        if (modalContent) {
            modalContent.innerHTML = '';
        }
        
        modal.classList.add("show");
        
        // Actualizar contenido del modal
        actualizarContenidoModal(tipo, tipoGrafica);
        
        // Crear gráfica ampliada
        setTimeout(() => {
            console.log('⏰ Creando gráfica para modal...');
            const datosActuales = getDatosCiudadTiempo(tipo);
            crearGraficaAmpliadaCiudadTiempo(tipo, tipoGrafica, datosActuales);
            llenarTablaModalCiudadTiempo(tipo);
        }, 200);
    }

    // FUNCIÓN CAMBIADA: Ahora usa gráfico de barras en el modal
    function inicializarGraficoModal(tipo) {
        const datos = getDatosCiudadTiempo(tipo);
        const ctx = document.getElementById('chartModalDetalle');
        
        if (!ctx || !datos.labels || datos.labels.length === 0) return;
        
        // Destruir gráfico anterior si existe
        if (chartInstances.ampliado) {
            chartInstances.ampliado.destroy();
        }
        
        // Ordenar datasets por total y tomar solo las principales
        const datasetsPrincipales = [...datos.datasets]
            .sort((a, b) => {
                const totalA = a.data.reduce((sum, val) => sum + val, 0);
                const totalB = b.data.reduce((sum, val) => sum + val, 0);
                return totalB - totalA;
            })
            .slice(0, 6); // Solo las 6 ciudades principales
        
        chartInstances.ampliado = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: datos.labels,
                datasets: datasetsPrincipales.map(dataset => ({
                    label: dataset.label,
                    data: dataset.data,
                    backgroundColor: dataset.backgroundColor,
                    borderColor: dataset.borderColor,
                    borderWidth: 1,
                    borderRadius: 4,
                    barThickness: 25,
                    categoryPercentage: 0.8,
                    barPercentage: 0.9
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Distribución Temporal por Ciudad',
                        font: { size: 18, weight: 'bold' }
                    },
                    legend: {
                        position: 'top',
                        labels: {
                            font: { size: 12 },
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleFont: { size: 14 },
                        bodyFont: { size: 14 },
                        padding: 12,
                        cornerRadius: 6,
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y} visitantes`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Visitantes',
                            font: { size: 14, weight: 'bold' }
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxRotation: 45,
                            font: {
                                size: 12
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    function llenarListaCiudadesModal(tipo) {
        const datos = getDatosCiudadTiempo(tipo);
        const container = document.getElementById('lista-ciudades-modal');
        
        if (!container) return;
        
        // Calcular totales por ciudad
        const ciudadesConTotal = datos.ciudades.map(ciudad => {
            const dataset = datos.datasets.find(d => d.label === ciudad);
            const total = dataset ? dataset.data.reduce((a, b) => a + b, 0) : 0;
            return { ciudad, total };
        });
        
        // Ordenar de mayor a menor y tomar las 10 principales
        ciudadesConTotal.sort((a, b) => b.total - a.total);
        const ciudadesPrincipales = ciudadesConTotal.slice(0, 10);
        
        container.innerHTML = ciudadesPrincipales.map(item => {
            const porcentaje = datos.total > 0 ? ((item.total / datos.total) * 100).toFixed(1) : 0;
            const color = obtenerColorParaCiudad(item.ciudad);
            
            // Calcular progreso para barra
            const maxTotal = ciudadesPrincipales[0].total;
            const porcentajeBarra = maxTotal > 0 ? (item.total / maxTotal) * 100 : 0;
            
            return `
                <div style="margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-radius: 6px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="width: 12px; height: 12px; border-radius: 50%; background: ${color};"></div>
                            <span style="font-weight: 600; font-size: 14px;">${item.ciudad}</span>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: bold; font-size: 14px;">${item.total}</div>
                            <div style="font-size: 12px; color: #27ae60;">${porcentaje}%</div>
                        </div>
                    </div>
                    <div style="height: 6px; background: #e9ecef; border-radius: 3px; overflow: hidden;">
                        <div style="height: 100%; width: ${porcentajeBarra}%; background: ${color}; border-radius: 3px;"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // =============================================
    // FUNCIONES DE INTERFAZ DE USUARIO
    // =============================================

    function mostrarLoading(mensaje) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: mensaje,
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });
        }
    }

    function cerrarLoading() {
        if (typeof Swal !== 'undefined') Swal.close();
    }

    function mostrarErrorCiudad(mensaje = 'Error al cargar los datos de ciudad') {
        const container = document.getElementById('data-container');
        container.innerHTML = `
            <div class="no-data" style="text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #e74c3c;"></i>
                <h3 style="color: #e74c3c;">Error al cargar datos</h3>
                <p>${mensaje}</p>
                <button class="btn btn-primary" onclick="window.CiudadSystem.cargarDatos()" style="background: #3498db; color: white; padding: 10px 20px; border-radius: 6px; border: none; cursor: pointer;">
                    <i class="fas fa-redo"></i> Reintentar
                </button>
            </div>
        `;
    }

    function mostrarSinDatosCiudad() {
        const container = document.getElementById('data-container');
        container.innerHTML = `
            <div class="no-data" style="text-align: center; padding: 40px;">
                <i class="fas fa-city" style="font-size: 48px; color: #7f8c8d;"></i>
                <h3>No hay datos de ciudades disponibles</h3>
                <p>No se encontraron participantes con ciudad registrada.</p>
                <button class="btn btn-primary" onclick="window.CiudadSystem.cargarDatos()" style="background: #3498db; color: white; padding: 10px 20px; border-radius: 6px; border: none; cursor: pointer;">
                    <i class="fas fa-redo"></i> Reintentar
                </button>
            </div>
        `;
    }

    function mostrarSinDatosTiempo(tipo) {
        const container = document.getElementById('data-container');
        container.innerHTML = `
            <div class="no-data" style="text-align: center; padding: 40px;">
                <i class="fas fa-calendar-times" style="font-size: 48px; color: #7f8c8d;"></i>
                <h3>No hay datos de ${tipo} disponibles</h3>
                <p>No se encontraron visitantes con fechas de visita registradas.</p>
                <button class="btn btn-primary" onclick="window.CiudadSystem.cargarDatosCiudadTiempo('${tipo}')" style="background: #3498db; color: white; padding: 10px 20px; border-radius: 6px; border: none; cursor: pointer;">
                    <i class="fas fa-redo"></i> Reintentar
                </button>
            </div>
        `;
    }

    function mostrarExito(mensaje) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: mensaje,
                timer: 3000,
                showConfirmButton: false
            });
        }
    }

    function mostrarMensajeNoHayDatos(mensaje = 'No hay datos disponibles para los filtros seleccionados') {
        Swal.fire({
            icon: 'info',
            title: 'Sin datos',
            text: mensaje,
            confirmButtonColor: '#3498db'
        });
    }


    // CAMBIA ESTA FUNCIÓN COMPLETA:
function crearHTMLFiltrosModal(tipo) {
    // Obtener todas las ciudades de datosCiudades
    const opcionesCiudad = todasLasCiudades || [];

    let html = `
    <div class="modal-filtros-container" style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h4 style="margin: 0; color: #2c3e50;">
                <i class="fas fa-filter"></i> Filtros Avanzados
            </h4>
            <div style="display: flex; gap: 8px;">
                <button class="btn-filter-modal" onclick="window.CiudadSystem.aplicarFiltrosModal()" style="background: #e74c3c; color: white;">
                    <i class="fas fa-check"></i> Aplicar
                </button>
                <button class="btn-filter-modal" onclick="window.CiudadSystem.limpiarFiltrosModal()" style="background: #95a5a6; color: white;">
                    <i class="fas fa-times"></i> Limpiar
                </button>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
    `;

    // SI ES GRÁFICA DE BARRAS, mostrar tipo de gráfica
    // Para esto necesitamos saber qué tipo de gráfica vamos a mostrar
    const modalTipoGrafica = document.getElementById('modalTipoGrafica')?.value || 'bar';
    
    if (modalTipoGrafica === 'bar') {
        html += `
            
        `;
    } else {
        // Para gráficas circulares, ocultamos el selector pero lo mantenemos
        html += `
            <!-- Tipo de Gráfica (oculto para circulares) -->
            <input type="hidden" id="modalTipoGrafica" value="${modalTipoGrafica}">
        `;
    }

    // Si no es ciudad general, agregar filtros de fecha
    if (tipo !== 'ciudad') {
        html += `
            <!-- Fecha Inicial -->
            <div class="filter-group">
                <label><i class="fas fa-calendar-alt"></i> Fecha Inicial:</label>
                <input type="date" id="modalFechaInicio" class="filter-input">
            </div>
            
            <!-- Fecha Final -->
            <div class="filter-group">
                <label><i class="fas fa-calendar-alt"></i> Fecha Final:</label>
                <input type="date" id="modalFechaFin" class="filter-input">
            </div>
        `;
    }

    // Agregar filtro de ciudad para todos los tipos
    html += `
            <!-- Ciudad -->
            <div class="filter-group">
                <label><i class="fas fa-city"></i> Ciudad:</label>
                <select id="modalCiudad" class="filter-select">
                    <option value="todas">Todas las ciudades</option>
                    ${opcionesCiudad.map(ciudad => 
                        `<option value="${ciudad}">${ciudad}</option>`
                    ).join('')}
                </select>
            </div>
            
            <!-- Número de resultados -->
            <div class="filter-group">
                <label><i class="fas fa-list-ol"></i> Mostrar:</label>
                <select id="modalCantidad" class="filter-select">
                    <option value="5">Top 5</option>
                    <option value="10" selected>Top 10</option>
                    <option value="15">Top 15</option>
                    <option value="20">Top 20</option>
                    <option value="0">Todos</option>
                </select>
            </div>
            
            <!-- Ordenar por -->
            <div class="filter-group">
                <label><i class="fas fa-sort-amount-down"></i> Ordenar por:</label>
                <select id="modalOrden" class="filter-select">
                    <option value="desc">Mayor a menor</option>
                    <option value="asc">Menor a mayor</option>
                    <option value="alpha">Alfabético</option>
                    ${tipo !== 'ciudad' ? '<option value="fecha">Por fecha</option>' : ''}
                </select>
            </div>
        </div>
    </div>
    `;

    return html;
}

    
   // Función para limpiar filtros del modal
    function limpiarFiltrosModal() {
        // Limpiar todos los filtros
        document.querySelectorAll('.filter-input, .filter-select').forEach(element => {
            if (element.tagName === 'SELECT') {
                if (element.id === 'modalTipoGrafica') {
                    element.value = 'bar';
                } else if (element.id === 'modalCantidad') {
                    element.value = '10';
                } else if (element.id === 'modalOrden') {
                    element.value = 'desc';
                } else if (element.id === 'modalCiudad') {
                    element.value = 'todas';
                }
            } else if (element.tagName === 'INPUT') {
                element.value = '';
            }
        });
        
        // Recargar gráfica original
        const tipo = determinarTipoActualModal();
        const tipoGrafica = document.getElementById('modalTipoGrafica')?.value || 'bar';
        
        if (tipo === 'ciudad') {
            crearGraficaAmpliadaCiudad(tipoGrafica);
            llenarTablaModalCiudad();
        } else {
            const datosOriginales = getDatosCiudadTiempo(tipo);
            crearGraficaAmpliadaCiudadTiempo(tipo, tipoGrafica, datosOriginales);
            llenarTablaModalCiudadTiempo(tipo);
        }
        
        mostrarExito('Filtros limpiados - Mostrando todos los datos');
    }

    // =============================================
    // EXPOSICIÓN DE FUNCIONES GLOBALES - COMPLETO
    // =============================================

    if (!window.CiudadSystem) {
        window.CiudadSystem = {};
    }

    // Funciones principales
    window.CiudadSystem.cargarDatos = cargarDatosCiudad;
    window.CiudadSystem.cargarDatosCiudadTiempo = cargarDatosCiudadTiempo;
    window.CiudadSystem.cambiarTipoReporte = function(tipo) {
        console.log('🔄 Cambiando a reporte:', tipo);
        
        // Actualizar botones activos
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const btn = document.querySelector(`.chart-btn[data-type="${tipo}"]`);
        if (btn) btn.classList.add('active');
        
        if (tipo === 'ciudad') {
            cargarDatosCiudad();
        } else {
            cargarDatosCiudadTiempo(tipo);
        }
    };

    // Funciones de filtros y rangos
    window.CiudadSystem.aplicarRangoFechas = aplicarRangoFechas;
    window.CiudadSystem.limpiarRangoFechas = function(tipo) {
        // Recargar datos originales
        cargarDatosCiudadTiempo(tipo);
        
        mostrarExito('Filtros limpiados - Mostrando todos los datos');
    };

    // Funciones de ordenamiento de tabla
    window.CiudadSystem.ordenarTabla = function(tipo, orden) {
        const tbody = document.getElementById(`tabla-${tipo}-body`);
        if (!tbody) return;
        
        const filas = Array.from(tbody.querySelectorAll('tr'));
        if (filas.length === 0) return;
        
        filas.sort((a, b) => {
            if (orden === 'fecha') {
                const fechaA = a.getAttribute('data-fecha');
                const fechaB = b.getAttribute('data-fecha');
                
                if (tipo === 'fecha') {
                    return new Date(fechaA) - new Date(fechaB);
                } else if (tipo === 'mes') {
                    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                    const [mesA, añoA] = fechaA.split(' ');
                    const [mesB, añoB] = fechaB.split(' ');
                    
                    if (añoA !== añoB) {
                        return parseInt(añoA) - parseInt(añoB);
                    }
                    return meses.indexOf(mesA) - meses.indexOf(mesB);
                } else {
                    return parseInt(fechaA) - parseInt(fechaB);
                }
            } else {
                const totalA = parseInt(a.getAttribute('data-total') || 0);
                const totalB = parseInt(b.getAttribute('data-total') || 0);
                
                return orden === 'desc' ? totalB - totalA : totalA - totalB;
            }
        });
        
        // Reordenar filas
        filas.forEach(fila => tbody.appendChild(fila));
    };

    // Funciones de filtrado de ciudades
    window.CiudadSystem.filtrarTablaCiudades = function(tipo, termino) {
        const container = document.getElementById(`lista-ciudades-${tipo}`);
        if (!container) return;
        
        const items = container.querySelectorAll('.ciudad-item');
        const terminoLower = termino.toLowerCase();
        
        items.forEach(item => {
            const ciudadElement = item.querySelector('span');
            if (ciudadElement) {
                const ciudad = ciudadElement.textContent.toLowerCase();
                if (ciudad.includes(terminoLower)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            }
        });
    };

    // Funciones para mostrar detalles
    window.CiudadSystem.mostrarDetallePeriodo = function(tipo, periodo) {
        const datos = getDatosCiudadTiempo(tipo);
        
        if (!datos.conteo || !datos.conteo[periodo]) {
            Swal.fire({
                icon: 'info',
                title: 'Sin datos',
                text: `No hay datos disponibles para ${periodo}`,
                confirmButtonText: 'OK'
            });
            return;
        }
        
        const ciudadesDetalle = Object.entries(datos.conteo[periodo])
            .map(([ciudad, valor]) => ({ ciudad, valor }))
            .sort((a, b) => b.valor - a.valor);
        
        const totalPeriodo = ciudadesDetalle.reduce((sum, ciudad) => sum + ciudad.valor, 0);
        
        let contenido = `<div style="max-height: 400px; overflow-y: auto;">`;
        contenido += `<div style="margin-bottom: 15px; padding: 15px; background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-radius: 8px;">
            <div style="font-size: 18px; font-weight: bold; color: #2c3e50; margin-bottom: 5px;">${periodo}</div>
            <div style="display: flex; gap: 20px;">
                <div>
                    <div style="font-size: 12px; color: #7f8c8d;">Total visitantes</div>
                    <div style="font-size: 24px; font-weight: bold; color: #27ae60;">${totalPeriodo}</div>
                </div>
                <div>
                    <div style="font-size: 12px; color: #7f8c8d;">Ciudades diferentes</div>
                    <div style="font-size: 24px; font-weight: bold; color: #3498db;">${ciudadesDetalle.length}</div>
                </div>
            </div>
        </div>`;
        contenido += `<table style="width: 100%; border-collapse: collapse;">`;
        contenido += `<thead><tr style="background: #f8f9fa;"><th style="padding: 12px; text-align: left;">Ciudad</th><th style="padding: 12px; text-align: center;">Visitantes</th><th style="padding: 12px; text-align: center;">Porcentaje</th></tr></thead>`;
        contenido += `<tbody>`;
        
        ciudadesDetalle.forEach(ciudad => {
            const porcentaje = totalPeriodo > 0 ? ((ciudad.valor / totalPeriodo) * 100).toFixed(1) : 0;
            const color = obtenerColorParaCiudad(ciudad.ciudad);
            
            contenido += `
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 12px; height: 12px; background: ${color}; border-radius: 2px;"></div>
                            <span style="font-weight: 600;">${ciudad.ciudad}</span>
                        </div>
                    </td>
                    <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee; font-weight: bold;">${ciudad.valor}</td>
                    <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee;">
                        <span style="background: #27ae60; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px;">${porcentaje}%</span>
                    </td>
                </tr>
            `;
        });
        
        contenido += `</tbody></table></div>`;
        
        Swal.fire({
            title: `Detalle: ${periodo}`,
            html: contenido,
            width: 700,
            confirmButtonText: 'Cerrar',
            customClass: {
                container: 'swal-detalle-container'
            }
        });
    };

    window.CiudadSystem.mostrarDetalleCiudad = function(tipo, ciudadNombre) {
        const datos = getDatosCiudadTiempo(tipo);
        const dataset = datos.datasets.find(d => d.label === ciudadNombre);
        
        if (!dataset) {
            Swal.fire({
                icon: 'info',
                title: 'Sin datos',
                text: `No hay datos disponibles para ${ciudadNombre}`,
                confirmButtonText: 'OK'
            });
            return;
        }
        
        const totalCiudad = dataset.data.reduce((a, b) => a + b, 0);
        const color = obtenerColorParaCiudad(ciudadNombre);
        
        let contenido = `<div style="max-height: 400px; overflow-y: auto;">`;
        contenido += `<div style="margin-bottom: 15px; padding: 15px; background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-radius: 8px;">
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 10px;">
                <div style="width: 40px; height: 40px; background: ${color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white;">
                    <i class="fas fa-city"></i>
                </div>
                <div>
                    <div style="font-size: 20px; font-weight: bold; color: #2c3e50;">${ciudadNombre}</div>
                    <div style="font-size: 14px; color: #7f8c8d;">Distribución temporal</div>
                </div>
            </div>
            <div style="display: flex; gap: 20px;">
                <div>
                    <div style="font-size: 12px; color: #7f8c8d;">Total visitantes</div>
                    <div style="font-size: 24px; font-weight: bold; color: #27ae60;">${totalCiudad}</div>
                </div>
                <div>
                    <div style="font-size: 12px; color: #7f8c8d;">Porcentaje total</div>
                    <div style="font-size: 24px; font-weight: bold; color: #3498db;">${datos.total > 0 ? ((totalCiudad / datos.total) * 100).toFixed(1) : 0}%</div>
                </div>
            </div>
        </div>`;
        contenido += `<table style="width: 100%; border-collapse: collapse;">`;
        contenido += `<thead><tr style="background: #f8f9fa;"><th style="padding: 12px; text-align: left;">Período</th><th style="padding: 12px; text-align: center;">Visitantes</th><th style="padding: 12px; text-align: center;">Porcentaje</th></tr></thead>`;
        contenido += `<tbody>`;
        
        datos.labels.forEach((label, index) => {
            const valor = dataset.data[index] || 0;
            if (valor > 0) {
                const porcentaje = totalCiudad > 0 ? ((valor / totalCiudad) * 100).toFixed(1) : 0;
                
                contenido += `
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${label}</td>
                        <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee; font-weight: bold;">${valor}</td>
                        <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee;">
                            <span style="background: #f39c12; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px;">${porcentaje}%</span>
                        </td>
                    </tr>
                `;
            }
        });
        
        contenido += `</tbody></table></div>`;
        
        Swal.fire({
            title: `Detalle: ${ciudadNombre}`,
            html: contenido,
            width: 700,
            confirmButtonText: 'Cerrar'
        });
    };

    // Funciones modales
    window.CiudadSystem.abrirModal = function(tipoGrafica) {
        // Crear modal simple para gráficas principales
        const { labels, values, colors, total } = datosCiudades.general;
        
        let contenido = `<div style="max-width: 800px; margin: 0 auto;">`;
        contenido += `<div style="margin-bottom: 20px; text-align: center;">
            <h2 style="color: #2c3e50; margin-bottom: 10px;">
                <i class="fas fa-chart-bar"></i> Distribución por Ciudad
            </h2>
            <p style="color: #7f8c8d;">Total: ${total} visitantes</p>
        </div>`;
        
        // Crear canvas para gráfico
        contenido += `<div style="height: 400px; margin-bottom: 20px;">
            <canvas id="modalChartCanvas"></canvas>
        </div>`;
        
        // Tabla de datos
        contenido += `<div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f8f9fa;">
                        <th style="padding: 12px; text-align: left;">Ciudad</th>
                        <th style="padding: 12px; text-align: center;">Visitantes</th>
                        <th style="padding: 12px; text-align: center;">Porcentaje</th>
                    </tr>
                </thead>
                <tbody>`;
        
        labels.forEach((ciudad, index) => {
            const cantidad = values[index];
            const porcentaje = total > 0 ? ((cantidad / total) * 100).toFixed(1) : 0;
            const color = colors[index];
            
            contenido += `
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 12px; height: 12px; background: ${color}; border-radius: 2px;"></div>
                            <span>${ciudad}</span>
                        </div>
                    </td>
                    <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee; font-weight: bold;">${cantidad}</td>
                    <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee;">
                        <span style="background: #27ae60; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px;">${porcentaje}%</span>
                    </td>
                </tr>
            `;
        });
        
        contenido += `</tbody></table></div></div>`;
        
        Swal.fire({
            title: 'Distribución por Ciudad - Vista Ampliada',
            html: contenido,
            width: 900,
            showCloseButton: true,
            showConfirmButton: false,
            didOpen: () => {
                // Crear gráfico dentro del modal
                const ctx = document.getElementById('modalChartCanvas');
                if (ctx) {
                    new Chart(ctx, {
                        type: tipoGrafica === 'bar' ? 'bar' : 'doughnut',
                        data: {
                            labels: labels,
                            datasets: [{
                                label: 'Visitantes',
                                data: values,
                                backgroundColor: colors,
                                borderColor: tipoGrafica === 'bar' ? colors.map(c => darkenColor(c, 0.2)) : '#fff',
                                borderWidth: 2
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: tipoGrafica === 'bar' ? 'top' : 'right'
                                }
                            }
                        }
                    });
                }
            }
        });
    };

    window.CiudadSystem.abrirModalTiempoDetalle = abrirModalTiempoDetalle;

    // Funciones de descarga
    window.CiudadSystem.descargarGraficoPrincipal = function() {
        if (chartInstances.bar) {
            const link = document.createElement("a");
            link.download = "grafica_ciudad_principal.png";
            link.href = chartInstances.bar.canvas.toDataURL("image/png");
            link.click();
        }
    };

    window.CiudadSystem.descargarGraficoPrincipalTiempo = function(tipo) {
        if (chartInstances[tipo]) {
            const link = document.createElement("a");
            link.download = `grafica_ciudad_${tipo}.png`;
            link.href = chartInstances[tipo].canvas.toDataURL("image/png");
            link.click();
        }
    };

    window.CiudadSystem.descargarGraficoModal = function() {
        if (chartInstances.ampliado) {
            const link = document.createElement("a");
            link.download = `grafica_detalle_${new Date().toISOString().split('T')[0]}.png`;
            link.href = chartInstances.ampliado.canvas.toDataURL("image/png");
            link.click();
        }
    };

    window.CiudadSystem.descargarExcel = function() {
        const { labels, values } = datosCiudades.general;
        const total = values.reduce((a, b) => a + b, 0);
        
        const datosExcel = [
            ['Ciudad', 'Total Visitantes', 'Porcentaje'],
            ...labels.map((ciudad, i) => {
                const porcentaje = total > 0 ? ((values[i] / total) * 100).toFixed(1) : 0;
                return [ciudad, values[i], `${porcentaje}%`];
            }),
            ['TOTAL', total, '100%']
        ];

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(datosExcel);
        XLSX.utils.book_append_sheet(wb, ws, "Datos por Ciudad");
        XLSX.writeFile(wb, "reporte_ciudad.xlsx");
    };

    // Funciones de exportación del modal
    window.CiudadSystem.exportarExcelModal = function(tipo) {
        const datos = getDatosCiudadTiempo(tipo);
        
        // Preparar datos para Excel
        const datosExcel = [
            ['Período', ...datos.ciudades, 'Total'],
            ...datos.labels.map((label, index) => {
                const fila = [label];
                let totalFila = 0;
                
                datos.ciudades.forEach(ciudad => {
                    const dataset = datos.datasets.find(d => d.label === ciudad);
                    const valor = dataset ? dataset.data[index] || 0 : 0;
                    fila.push(valor);
                    totalFila += valor;
                });
                
                fila.push(totalFila);
                return fila;
            }),
            ['TOTAL', ...datos.ciudades.map(ciudad => {
                const dataset = datos.datasets.find(d => d.label === ciudad);
                return dataset ? dataset.data.reduce((a, b) => a + b, 0) : 0;
            }), datos.total]
        ];

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(datosExcel);
        XLSX.utils.book_append_sheet(wb, ws, `Datos ${tipo}`);
        XLSX.writeFile(wb, `reporte_ciudad_${tipo}.xlsx`);
    };

    window.CiudadSystem.exportarPDFModal = function(tipo) {
        Swal.fire({
            icon: 'info',
            title: 'Exportar a PDF',
            text: 'Esta funcionalidad se implementará próximamente',
            confirmButtonText: 'OK'
        });
    };

    // Función para ver todas las ciudades
    window.CiudadSystem.mostrarTodasLasCiudades = function() {
        if (!datosCiudades.detallado) return;
        
        const todasCiudades = datosCiudades.detallado.todasLasCiudades;
        const total = datosCiudades.estadisticas.totalConCiudad;
        
        let contenido = '<div style="max-height: 500px; overflow-y: auto; padding-right: 10px;">';
        contenido += '<table style="width: 100%; border-collapse: collapse;">';
        contenido += '<thead><tr style="background: #f8f9fa; position: sticky; top: 0; z-index: 1;"><th style="padding: 12px; text-align: left;">#</th><th style="padding: 12px; text-align: left;">Ciudad</th><th style="padding: 12px; text-align: center;">Visitantes</th><th style="padding: 12px; text-align: center;">Porcentaje</th></tr></thead>';
        contenido += '<tbody>';
        
        todasCiudades.forEach(([ciudad, cantidad], index) => {
            const porcentaje = total > 0 ? ((cantidad / total) * 100).toFixed(1) : 0;
            const color = obtenerColorParaCiudad(ciudad);
            
            contenido += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px; font-weight: bold; color: #7f8c8d;">${index + 1}</td>
                    <td style="padding: 10px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 12px; height: 12px; background: ${color}; border-radius: 2px;"></div>
                            ${ciudad}
                        </div>
                    </td>
                    <td style="padding: 10px; text-align: center; font-weight: bold;">${cantidad}</td>
                    <td style="padding: 10px; text-align: center;">
                        <span style="background: #27ae60; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px;">${porcentaje}%</span>
                    </td>
                </tr>
            `;
        });
        
        contenido += '</tbody></table></div>';
        
        Swal.fire({
            title: `Todas las Ciudades (${todasCiudades.length})`,
            html: contenido,
            width: 800,
            showConfirmButton: false,
            showCloseButton: true
        });
    };

    // =============================================
    // FUNCIONES AUXILIARES
    // =============================================

    function getDatosCiudadTiempo(tipo) {
        switch(tipo) {
            case 'fecha': return datosFechaCiudad || { labels: [], datasets: [], ciudades: [], total: 0 };
            case 'mes': return datosMesCiudad || { labels: [], datasets: [], ciudades: [], total: 0 };
            case 'anio': return datosAnioCiudad || { labels: [], datasets: [], ciudades: [], total: 0 };
            default: return { labels: [], datasets: [], ciudades: [], total: 0 };
        }
    }

    function getTituloTiempo(tipo) {
        const titulos = {
            'fecha': '🏙️ Ciudad por Fecha',
            'mes': '🏙️ Ciudad por Mes', 
            'anio': '🏙️ Ciudad por Año'
        };
        return titulos[tipo] || 'Ciudad por Tiempo';
    }

    function getIconoTiempo(tipo) {
        const iconos = {
            'fecha': '<i class="fas fa-calendar-day"></i>',
            'mes': '<i class="fas fa-calendar-week"></i>',
            'anio': '<i class="fas fa-calendar-alt"></i>'
        };
        return iconos[tipo] || '<i class="fas fa-chart-bar"></i>';
    }

    function getTituloColumna(tipo) {
        switch(tipo) {
            case 'fecha': return 'Fecha';
            case 'mes': return 'Mes';
            case 'anio': return 'Año';
            default: return 'Período';
        }
    }

    function darkenColor(color, factor) {
        if (color.startsWith('#')) {
            let r = parseInt(color.slice(1, 3), 16);
            let g = parseInt(color.slice(3, 5), 16);
            let b = parseInt(color.slice(5, 7), 16);
            
            r = Math.max(0, Math.floor(r * (1 - factor)));
            g = Math.max(0, Math.floor(g * (1 - factor)));
            b = Math.max(0, Math.floor(b * (1 - factor)));
            
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        }
        return color;
    }

    if (!window.CiudadSystem) {
        window.CiudadSystem = {};
    }

    // Busca la sección "EXPOSICIÓN DE FUNCIONES GLOBALES" y agrega:
    window.CiudadSystem.aplicarFiltrosModal = () => aplicarFiltrosModal();
    window.CiudadSystem.limpiarFiltrosModal = () => limpiarFiltrosModal();

    // Funciones principales
    window.CiudadSystem.cargarDatos = cargarDatosCiudad;
    window.CiudadSystem.cargarDatosCiudadTiempo = cargarDatosCiudadTiempo;
    window.CiudadSystem.cambiarTipoReporte = function(tipo) {
        console.log('🔄 Cambiando a reporte:', tipo);
        
        // Actualizar botones activos
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const btn = document.querySelector(`.chart-btn[data-type="${tipo}"]`);
        if (btn) btn.classList.add('active');
        
        tipoActual = tipo;
        
        if (tipo === 'ciudad') {
            cargarDatosCiudad();
        } else {
            cargarDatosCiudadTiempo(tipo);
        }
    };

    // Funciones de modal con filtros
    window.CiudadSystem.abrirModal = (tipo) => abrirModalCiudad(tipo);
    window.CiudadSystem.abrirModalTiempo = (tipo, tipoGrafica) => abrirModalCiudadTiempo(tipo, tipoGrafica);
    window.CiudadSystem.cerrarModal = () => {
        const modal = document.getElementById("chartModalCiudad");
        if (modal) {
            modal.classList.remove("show");
        }
    };
    window.CiudadSystem.aplicarFiltrosModal = () => aplicarFiltrosModal();
    window.CiudadSystem.limpiarFiltrosModal = () => limpiarFiltrosModal();
    
    // Funciones de descarga del modal
    window.CiudadSystem.descargarPNGModal = () => {
        const canvas = document.getElementById("chartAmpliadoCiudad");
        if (canvas) {
            const link = document.createElement("a");
            link.download = "grafica_ampliada_ciudad.png";
            link.href = canvas.toDataURL("image/png");
            link.click();
        }
    };
    
    window.CiudadSystem.descargarExcelModal = () => {
        const titulo = document.getElementById('modalTitleCiudad')?.textContent || 'Reporte Ciudad';
        const tbody = document.getElementById("tbodyDatosCiudad");
        if (!tbody) return;
        
        const filas = tbody.querySelectorAll('tr');
        const datosExcel = [];
        
        // Obtener encabezados de la tabla
        const thead = document.querySelector('#tablaDatosCiudad thead');
        const encabezados = [];
        if (thead) {
            const ths = thead.querySelectorAll('th');
            ths.forEach(th => encabezados.push(th.textContent.trim()));
            datosExcel.push(encabezados);
        } else {
            // Encabezados por defecto
            datosExcel.push(['Ciudad/Período', 'Descripción', 'Total Visitantes', 'Porcentaje', 'Detalles']);
        }
        
        // Obtener datos de las filas
        filas.forEach(fila => {
            const celdas = fila.querySelectorAll('td');
            if (celdas.length > 0) {
                const filaDatos = [];
                celdas.forEach(celda => filaDatos.push(celda.textContent.trim()));
                datosExcel.push(filaDatos);
            }
        });
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(datosExcel);
        XLSX.utils.book_append_sheet(wb, ws, "Datos Filtrados Ciudad");
        XLSX.writeFile(wb, "reporte_filtrado_ciudad.xlsx");
    };

    console.log('✅ Sistema de Ciudad CON GRÁFICAS AGRUPADAS Y FILTROS EN MODAL cargado correctamente');

    console.log('✅ Sistema de Ciudad CON BARRAS cargado correctamente');

    // =============================================
    // FUNCIÓN DE INICIALIZACIÓN
    // =============================================

    window.CiudadSystem.inicializar = function() {
        console.log('✅ Inicializando sistema de ciudad...');
        this.cargarDatos();
    };

    // Funciones de filtros combinados (si no existen)
    window.CiudadSystem.aplicarFiltrosCombinados = function() {
        console.log('Aplicando filtros combinados...');
        // Implementa esta función según necesites
        alert('Funcionalidad de filtros combinados en desarrollo');
    };

    window.CiudadSystem.limpiarFiltrosCombinados = function() {
        console.log('Limpiando filtros combinados...');
        // Implementa esta función según necesites
        alert('Funcionalidad de limpiar filtros en desarrollo');
    };

    window.CiudadSystem.exportarDatosFiltrados = function() {
        console.log('Exportando datos filtrados...');
        // Implementa esta función según necesites
        alert('Funcionalidad de exportar datos filtrados en desarrollo');
    };

    // Inicializar automáticamente cuando se carga el DOM
    document.addEventListener('DOMContentLoaded', function() {
        if (window.CiudadSystem && window.CiudadSystem.inicializar) {
            setTimeout(() => {
                window.CiudadSystem.inicializar();
            }, 1000);
        }
    });

    console.log('✅ Sistema de Ciudad CON BARRAS cargado correctamente');

})();