// js/edad-system.js - VERSIÓN COMPLETA Y FUNCIONAL
(function() {
    'use strict';
    
 
    let chartBarEdad, chartPieEdad;
    
    let tipoActualEdad = "edad";
    let datosSimuladosEdad = {};
    let datosOriginalesEdad = {};
    let datosFecha = { labels: [], values: [], total: 0 };
    let datosMes = { labels: [], values: [], total: 0 };
    let datosAnio = { labels: [], values: [], total: 0 };
    let chartFechaBar, chartFechaPie, chartMesBar, chartMesPie, chartAnioBar, chartAnioPie;


    // Agrega esto con las otras variables al inicio
    let datosFechaInteligente = { labels: [], datasets: [], total: 0 };
    let datosMesInteligente = { labels: [], datasets: [], total: 0 };
    let datosAnioInteligente = { labels: [], datasets: [], total: 0 };

    // Datos para vistas combinadas
    let datosFechaCombinado = {};
    let datosMesCombinado = {};
    let datosAnioCombinado = {};

    let chartAmpliadoEdad = null;

    // Variables para datos agrupados
    let datosFechaAgrupados = { labels: [], datasets: [], total: 0 };
    let datosMesAgrupados = { labels: [], datasets: [], total: 0 };
    let datosAnioAgrupados = { labels: [], datasets: [], total: 0 };

    // Paletas de colores específicas para edad
    const coloresPorEdad = {
        '0-17': '#27ae60', '18-25': '#3498db', '26-35': '#f39c12',
        '36-50': '#e67e22', '51-65': '#9b59b6', '66+': '#e74c3c'
    };

    // Paletas de colores para fecha, mes y año
    const coloresPorTiempo = {
        fecha: ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e', '#e67e22'],
        mes: ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c', '#d35400', '#27ae60', '#8e44ad', '#16a085', '#c0392b', '#2980b9'],
        anio: ['#3498db', '#e67e22', '#2ecc71', '#9b59b6', '#f1c40f', '#e74c3c']
    };

   

    function calcularEdad(fechaNacimiento) {
        try {
            const nacimiento = new Date(fechaNacimiento);
            const hoy = new Date();
            
            if (isNaN(nacimiento.getTime())) {
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

    function clasificarEdad(edad) {
        if (edad <= 17) return '0-17';
        if (edad <= 25) return '18-25';
        if (edad <= 35) return '26-35';
        if (edad <= 50) return '36-50';
        if (edad <= 65) return '51-65';
        return '66+';
    }

    async function cargarDatosEdades() {
        try {
            mostrarLoadingEdad('Cargando datos de edad...');

            console.log('Consultando datos de edades...');
            
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

            if (error) throw error;

            if (participantes && participantes.length > 0) {
                procesarDatosEdades(participantes);
                mostrarDatosEdad();
            } else {
                mostrarSinDatosEdad();
            }

            cerrarLoadingEdad();
            
        } catch (error) {
            console.error('Error cargando edades:', error);
            cerrarLoadingEdad();
            mostrarErrorEdad(error.message);
        }
    }

    function procesarDatosEdades(participantes) {
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
                const edad = calcularEdad(fechaNacimiento);
                if (edad !== null && edad >= 0 && edad <= 120) {
                    const categoria = clasificarEdad(edad);
                    conteoEdades[categoria]++;
                    edadesIndividuales.push(edad);
                    sumaEdades += edad;
                    totalConEdad++;
                }
            }
        });

        const edadPromedio = totalConEdad > 0 ? Math.round(sumaEdades / totalConEdad) : 0;
        const edadMinima = edadesIndividuales.length > 0 ? Math.min(...edadesIndividuales) : 0;
        const edadMaxima = edadesIndividuales.length > 0 ? Math.max(...edadesIndividuales) : 0;

        // Actualizar estadísticas
        document.getElementById('total-visitantes').textContent = totalConEdad.toLocaleString();
        document.getElementById('edad-promedio').textContent = edadPromedio + ' años';
        document.getElementById('total-grupos').textContent = Object.values(conteoEdades).filter(val => val > 0).length;

        datosSimuladosEdad = {
            edad: {
                labels: Object.keys(conteoEdades),
                values: Object.values(conteoEdades)
            },
            estadisticas: {
                total: totalConEdad,
                promedio: edadPromedio,
                minima: edadMinima,
                maxima: edadMaxima
            },
            datosOriginales: participantes
        };

        datosOriginalesEdad = JSON.parse(JSON.stringify(datosSimuladosEdad));
    }

    // Procesar datos para gráficas AGRUPADAS por tiempo y edad
    function procesarDatosTiempoAgrupados(participantes, tipo) {
        console.log(`🔄 Procesando datos AGRUPADOS de: ${tipo}`);
        
        const datosPorTiempo = {};
        const rangosEdad = ['0-17', '18-25', '26-35', '36-50', '51-65', '66+'];
        const fechasSet = new Set();
        
        // Inicializar estructura para cada rango de edad
        rangosEdad.forEach(rango => {
            datosPorTiempo[rango] = {};
        });
        
        // Procesar cada participante
        participantes.forEach(participante => {
            if (participante.fecha_visita && participante.fecha_nacimiento) {
                const fecha = new Date(participante.fecha_visita);
                const edad = calcularEdad(participante.fecha_nacimiento);
                
                if (edad !== null) {
                    const rango = clasificarEdad(edad);
                    let claveFecha = '';
                    
                    // Determinar clave según tipo
                    switch(tipo) {
                        case 'fecha':
                            claveFecha = fecha.toISOString().split('T')[0];
                            break;
                        case 'mes':
                            const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                            claveFecha = `${meses[fecha.getMonth()]} ${fecha.getFullYear()}`;
                            break;
                        case 'anio':
                            claveFecha = fecha.getFullYear().toString();
                            break;
                    }
                    
                    fechasSet.add(claveFecha);
                    
                    // Contar en el rango correspondiente
                    if (datosPorTiempo[rango][claveFecha]) {
                        datosPorTiempo[rango][claveFecha]++;
                    } else {
                        datosPorTiempo[rango][claveFecha] = 1;
                    }
                }
            }
        });
        
        // Ordenar fechas
        const fechasOrdenadas = Array.from(fechasSet).sort((a, b) => {
            switch(tipo) {
                case 'fecha': return new Date(a) - new Date(b);
                case 'mes': return ordenarMeses(a, b);
                case 'anio': return parseInt(a) - parseInt(b);
                default: return 0;
            }
        });
        
        // Limitar a las últimas fechas si son muchas
        let fechasMostrar = fechasOrdenadas;
        if (tipo === 'fecha' && fechasOrdenadas.length > 10) {
            fechasMostrar = fechasOrdenadas.slice(-10);
        } else if (tipo === 'mes' && fechasOrdenadas.length > 12) {
            fechasMostrar = fechasOrdenadas.slice(-12);
        }
        
        // Preparar datasets para Chart.js (BARRAS AGRUPADAS)
        const datasets = rangosEdad.map((rango, index) => {
            const datosRango = datosPorTiempo[rango] || {};
            const data = fechasMostrar.map(fecha => datosRango[fecha] || 0);
            
            // Verificar si este rango tiene datos
            const totalRango = data.reduce((sum, val) => sum + val, 0);
            
            if (totalRango > 0) {
                return {
                    label: `${rango} años`,
                    data: data,
                    backgroundColor: coloresPorEdad[rango],
                    borderColor: darkenColor(coloresPorEdad[rango], 0.2),
                    borderWidth: 1,
                    borderRadius: 6,
                    barThickness: 15,
                    hidden: false
                };
            } else {
                return null;
            }
        }).filter(dataset => dataset !== null);
        
        // Si no hay datos, crear uno vacío
        if (datasets.length === 0) {
            datasets.push({
                label: 'Sin datos',
                data: fechasMostrar.map(() => 0),
                backgroundColor: '#95a5a6'
            });
        }
        
        // Guardar datos en formato AGRUPADO
        const datosTiempo = {
            labels: fechasMostrar,
            datasets: datasets,
            rangosEdad: datasets.map(d => d.label.replace(' años', '')),
            fechas: fechasMostrar,
            total: datasets.reduce((total, dataset) => 
                total + dataset.data.reduce((sum, val) => sum + val, 0), 0)
        };
        
        console.log(`✅ Datos AGUPADOS de ${tipo} procesados:`, datosTiempo);
        
        // Guardar según tipo
        switch(tipo) {
            case 'fecha': 
                datosFechaAgrupados = datosTiempo;
                break;
            case 'mes': 
                datosMesAgrupados = datosTiempo;
                break;
            case 'anio': 
                datosAnioAgrupados = datosTiempo;
                break;
        }
        
        return datosTiempo;
    }


    function mostrarDatosEdad() {
        const container = document.getElementById('data-container');
        const stats = datosSimuladosEdad.estadisticas;
        
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
                        <button class="download-btn" onclick="window.EdadSystem.mostrarFiltrosAvanzados()" style="background: linear-gradient(135deg, #e67e22, #f39c12);">
                            <i class="fas fa-filter"></i> Filtros Avanzados
                        </button>
                    </div>
                </div>
                <!-- Filtros Avanzados (ocultos inicialmente) -->
                <div id="filtros-avanzados-edad" style="display: none; margin-top: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                    <h4 style="margin: 0 0 12px 0; display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-filter"></i> Filtros Avanzados
                    </h4>
                    <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                        <div class="filtro-grupo">
                            <label for="filtro-fecha-inicial"><i class="fas fa-calendar-alt"></i> Fecha Inicial:</label>
                            <input type="date" id="filtro-fecha-inicial">
                        </div>
                        <div class="filtro-grupo">
                            <label for="filtro-fecha-final"><i class="fas fa-calendar-alt"></i> Fecha Final:</label>
                            <input type="date" id="filtro-fecha-final">
                        </div>
                        <div class="filtro-grupo">
                            <label for="filtro-rango-edad"><i class="fas fa-user"></i> Rango de Edad:</label>
                            <select id="filtro-rango-edad">
                                <option value="todos">Todos los rangos</option>
                                <option value="0-17">0-17 años</option>
                                <option value="18-25">18-25 años</option>
                                <option value="26-35">26-35 años</option>
                                <option value="36-50">36-50 años</option>
                                <option value="51-65">51-65 años</option>
                                <option value="66+">66+ años</option>
                            </select>
                        </div>
                        <div class="filtro-grupo">
                            <button class="btn btn-primary" onclick="window.EdadSystem.aplicarFiltros()" style="margin-top: 22px;">
                                <i class="fas fa-check"></i> Aplicar Filtros
                            </button>
                            <button class="btn" onclick="window.EdadSystem.limpiarFiltros()" style="margin-top: 22px; background: #95a5a6; color: white;">
                                <i class="fas fa-times"></i> Limpiar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="charts-grid">
                <div class="chart-card" onclick="window.EdadSystem.abrirModalEdad('bar')">
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

                <div class="chart-card" onclick="window.EdadSystem.abrirModalEdad('pie')">
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
                            ${generarFilasTablaEdad()}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        // Agregar estilos para los filtros
        agregarEstilosFiltros();
        mostrarGraficasEdad();
    }

    function mostrarInterfazTiempoAgrupada(tipo, datosAgrupados) {
        const container = document.getElementById('data-container');
        const titulo = getTituloTiempo(tipo);
        const icono = getIconoTiempo(tipo);

        container.innerHTML = `
            <div class="chart-controls">
                <div class="chart-header">
                    <h3 style="margin: 0; display: flex; align-items: center; gap: 6px">
                        ${icono} ${titulo} - Gráficas Agrupadas
                        <span style="background: #3498db; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; margin-left: 10px;">
                            ${datosAgrupados.total} visitantes
                        </span>
                    </h3>
                    <div style="display: flex; gap: 10px;">
                        <button class="download-btn" onclick="window.EdadSystem.descargarGraficoAgrupado('${tipo}')">
                            <i class="fas fa-download"></i> Descargar Gráfico
                        </button>
                    </div>
                </div>
            </div>

            <div class="charts-grid">
                <div class="chart-card" onclick="window.EdadSystem.abrirModalTiempoAgrupado('${tipo}', 'bar')">
                    <div class="chart-card-header">
                        <div class="chart-card-title">
                            <i class="fas fa-chart-bar"></i> ${titulo} - Barras Agrupadas
                        </div>
                        <div class="chart-card-badge">Haz clic para ampliar</div>
                    </div>
                    <div class="chart-canvas-wrap">
                        <canvas id="chart${tipo.charAt(0).toUpperCase() + tipo.slice(1)}BarAgrupado"></canvas>
                    </div>
                </div>

                <div class="chart-card" onclick="window.EdadSystem.abrirModalTiempoAgrupado('${tipo}', 'pie')">
                    <div class="chart-card-header">
                        <div class="chart-card-title">
                            <i class="fas fa-chart-pie"></i> ${titulo} - Circular
                        </div>
                        <div class="chart-card-badge">Haz clic para ampliar</div>
                    </div>
                    <div class="chart-canvas-wrap pie-chart-container">
                        <canvas id="chart${tipo.charAt(0).toUpperCase() + tipo.slice(1)}PieAgrupado"></canvas>
                    </div>
                </div>
            </div>

            <div class="data-table">
                <div class="chart-header">
                    <h3 style="margin: 0; display: flex; align-items: center; gap: 6px">
                        <i class="fas fa-table"></i> Detalle por ${titulo.split(' ')[1]} y Rango de Edad
                    </h3>
                    <button class="download-btn" onclick="window.EdadSystem.descargarExcelAgrupado('${tipo}')">
                        <i class="fas fa-file-excel"></i> Exportar Excel
                    </button>
                </div>
                <div style="overflow-x: auto;">
                    <table class="table" style="min-width: 700px;">
                        <thead>
                            <tr>
                                <th style="min-width: 150px;">${titulo.split(' ')[1]}</th>
                                ${datosAgrupados.datasets.map(dataset => `<th>${dataset.label}</th>`).join('')}
                                <th style="width: 120px;">Total por ${titulo.split(' ')[1]}</th>
                            </tr>
                        </thead>
                        <tbody id="tabla-${tipo}-agrupado-body">
                            ${generarFilasTablaAgrupada(datosAgrupados, tipo)}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        mostrarGraficasAgrupadasTiempo(tipo);
    }

    // Función principal para cargar datos de tiempo
    async function cargarDatosTiempo(tipo) {
        try {
            mostrarLoadingEdad(`Cargando datos por ${tipo}...`);
            
            console.log(`📊 Cargando datos AGUPADOS para: ${tipo}`);
            
            const { data: participantes, error } = await supabase
                .from('participantes_reserva')
                .select('fecha_visita, fecha_nacimiento')
                .not('fecha_visita', 'is', null)
                .not('fecha_nacimiento', 'is', null);

            if (error) throw error;

            if (participantes && participantes.length > 0) {
                // Procesar datos para gráficas AGRUPADAS
                const datosProcesados = procesarDatosTiempoAgrupados(participantes, tipo);
                console.log(`✅ Datos procesados para ${tipo}:`, datosProcesados);
                
                // Mostrar interfaz con gráficas agrupadas
                mostrarInterfazTiempoAgrupada(tipo, datosProcesados);
            } else {
                console.warn(`⚠️ No hay participantes con fecha de visita para ${tipo}`);
                mostrarSinDatosTiempo(tipo);
            }

            cerrarLoadingEdad();
            
        } catch (error) {
            console.error(`❌ Error cargando datos de ${tipo}:`, error);
            cerrarLoadingEdad();
            mostrarErrorEdad(`Error al cargar datos de ${tipo}: ` + error.message);
        }
    }

    function mostrarOcultarFiltros() {
        const container = document.getElementById('data-container');
        // Crear contenedor de filtros si no existe
        if (!document.getElementById('filtros-combinados')) {
            const filtrosHTML = `
                <div id="filtros-combinados" style="display: none; margin-bottom: 20px; padding: 20px; background: #f8f9fa; border-radius: 10px; border: 1px solid #e9ecef;">
                    <h4 style="margin: 0 0 15px 0; display: flex; align-items: center; gap: 8px; color: #2c3e50;">
                        <i class="fas fa-filter"></i> Filtros Combinados
                    </h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 15px;">
                        <div>
                            <label style="font-weight: 600; margin-bottom: 5px; display: block; font-size: 0.9rem;">
                                <i class="fas fa-calendar-alt"></i> Fecha Inicial
                            </label>
                            <input type="date" id="filtro-fecha-inicial" class="form-control" style="padding: 8px 12px; border-radius: 6px; border: 1px solid #ddd;">
                        </div>
                        <div>
                            <label style="font-weight: 600; margin-bottom: 5px; display: block; font-size: 0.9rem;">
                                <i class="fas fa-calendar-alt"></i> Fecha Final
                            </label>
                            <input type="date" id="filtro-fecha-final" class="form-control" style="padding: 8px 12px; border-radius: 6px; border: 1px solid #ddd;">
                        </div>
                        <div>
                            <label style="font-weight: 600; margin-bottom: 5px; display: block; font-size: 0.9rem;">
                                <i class="fas fa-user"></i> Rango de Edad
                            </label>
                            <select id="filtro-rango-edad" class="form-control" style="padding: 8px 12px; border-radius: 6px; border: 1px solid #ddd;">
                                <option value="todos">Todos los rangos</option>
                                <option value="0-17">0-17 años</option>
                                <option value="18-25">18-25 años</option>
                                <option value="26-35">26-35 años</option>
                                <option value="36-50">36-50 años</option>
                                <option value="51-65">51-65 años</option>
                                <option value="66+">66+ años</option>
                            </select>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn btn-primary" onclick="window.EdadSystem.aplicarFiltrosCombinados()">
                            <i class="fas fa-check"></i> Aplicar Filtros
                        </button>
                        <button class="btn btn-secondary" onclick="window.EdadSystem.limpiarFiltrosCombinados()">
                            <i class="fas fa-times"></i> Limpiar Filtros
                        </button>
                    </div>
                </div>
            `;
            
            // Insertar al inicio del contenedor
            container.insertAdjacentHTML('afterbegin', filtrosHTML);
        }

        const filtrosDiv = document.getElementById('filtros-combinados');
        if (filtrosDiv.style.display === 'none') {
            filtrosDiv.style.display = 'block';
            // Establecer fechas por defecto (último año)
            const ahora = new Date();
            const haceUnAnio = new Date();
            haceUnAnio.setFullYear(ahora.getFullYear() - 1);
            
            document.getElementById('filtro-fecha-inicial').value = haceUnAnio.toISOString().split('T')[0];
            document.getElementById('filtro-fecha-final').value = ahora.toISOString().split('T')[0];
        } else {
            filtrosDiv.style.display = 'none';
        }
    }

    // Procesar datos por tiempo
    function procesarDatosTiempo(participantes, tipo) {
        const conteo = {};
        const ahora = new Date();
        
        participantes.forEach(participante => {
            if (participante.fecha_visita) {
                const fecha = new Date(participante.fecha_visita);
                let clave = '';
                
                switch(tipo) {
                    case 'fecha':
                        // Formato: YYYY-MM-DD
                        clave = fecha.toISOString().split('T')[0];
                        break;
                    case 'mes':
                        // Formato: YYYY-MM (Enero 2024)
                        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                        clave = `${meses[fecha.getMonth()]} ${fecha.getFullYear()}`;
                        break;
                    case 'anio':
                        // Formato: YYYY
                        clave = fecha.getFullYear().toString();
                        break;
                }
                
                conteo[clave] = (conteo[clave] || 0) + 1;
            }
        });

        // Ordenar datos
        let labels, values;
        
        switch(tipo) {
            case 'fecha':
                // Ordenar fechas cronológicamente
                labels = Object.keys(conteo).sort((a, b) => new Date(a) - new Date(b));
                // Tomar las últimas 10 fechas (más recientes)
                labels = labels.slice(-10);
                break;
            case 'mes':
                // Ordenar meses cronológicamente
                labels = Object.keys(conteo).sort((a, b) => {
                    const [mesA, añoA] = a.split(' ');
                    const [mesB, añoB] = b.split(' ');
                    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                    return new Date(añoA, meses.indexOf(mesA)) - new Date(añoB, meses.indexOf(mesB));
                });
                break;
            case 'anio':
                // Ordenar años cronológicamente
                labels = Object.keys(conteo).sort((a, b) => parseInt(a) - parseInt(b));
                break;
        }
        
        values = labels.map(label => conteo[label]);

        // Guardar datos
        const datosTiempo = {
            labels: labels,
            values: values,
            total: values.reduce((a, b) => a + b, 0)
        };

        switch(tipo) {
            case 'fecha': datosFecha = datosTiempo; break;
            case 'mes': datosMes = datosTiempo; break;
            case 'anio': datosAnio = datosTiempo; break;
        }

        console.log(`✅ Datos ${tipo} procesados:`, datosTiempo);
    }

    // Mostrar interfaz para fecha, mes o año
    function mostrarInterfazTiempo(tipo) {
        const container = document.getElementById('data-container');
        const datos = getDatosTiempo(tipo);
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
                        <button class="download-btn" onclick="window.EdadSystem.descargarGraficoPrincipalTiempo('${tipo}')">
                            <i class="fas fa-download"></i> Descargar Gráfico
                        </button>
                        <button class="btn" onclick="window.EdadSystem.mostrarOcultarFiltros()" style="background: linear-gradient(135deg, #e67e22, #f39c12); color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer;">
                            <i class="fas fa-filter"></i> Filtros
                        </button>
                    </div>
                </div>
            </div>

            <div class="charts-grid">
                <div class="chart-card" onclick="window.EdadSystem.abrirModalTiempo('${tipo}', 'bar')">
                    <div class="chart-card-header">
                        <div class="chart-card-title">
                            <i class="fas fa-chart-bar"></i> ${titulo} - Barras
                        </div>
                        <div class="chart-card-badge">Haz clic para ampliar</div>
                    </div>
                    <div class="chart-canvas-wrap">
                        <canvas id="chart${tipo.charAt(0).toUpperCase() + tipo.slice(1)}Bar"></canvas>
                    </div>
                </div>

                <div class="chart-card" onclick="window.EdadSystem.abrirModalTiempo('${tipo}', 'pie')">
                    <div class="chart-card-header">
                        <div class="chart-card-title">
                            <i class="fas fa-chart-pie"></i> ${titulo} - Circular
                        </div>
                        <div class="chart-card-badge">Haz clic para ampliar</div>
                    </div>
                    <div class="chart-canvas-wrap pie-chart-container">
                        <canvas id="chart${tipo.charAt(0).toUpperCase() + tipo.slice(1)}Pie"></canvas>
                    </div>
                </div>
            </div>

            <div class="data-table">
                <div class="chart-header">
                    <h3 style="margin: 0; display: flex; align-items: center; gap: 6px">
                        <i class="fas fa-table"></i> Detalle por ${titulo.split(' ')[1]}
                    </h3>
                    <button class="download-btn" onclick="window.EdadSystem.descargarExcelTiempo('${tipo}')">
                        <i class="fas fa-file-excel"></i> Exportar Excel
                    </button>
                </div>
                <div style="overflow-x: auto;">
                    <table class="table" style="min-width: 700px;">
                        <thead>
                            <tr>
                                <th style="width: 50px;">#</th>
                                <th style="min-width: 150px;">${titulo.split(' ')[1]}</th>
                                <th style="width: 120px;">Total Visitantes</th>
                                <th style="width: 100px;">Porcentaje</th>
                                <th style="min-width: 100px;">Tendencia</th>
                            </tr>
                        </thead>
                        <tbody id="tabla-${tipo}-body">
                            ${generarFilasTablaTiempo(datos, tipo)}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        mostrarGraficasTiempo(tipo);
    }

  

    async function aplicarFiltrosCombinados() {
        try {
            const fechaInicial = document.getElementById('filtro-fecha-inicial').value;
            const fechaFinal = document.getElementById('filtro-fecha-final').value;
            const rangoEdad = document.getElementById('filtro-rango-edad').value;

            // Validar fechas
            if (!fechaInicial || !fechaFinal) {
                mostrarErrorEdad('Por favor selecciona ambas fechas');
                return;
            }

            if (fechaInicial > fechaFinal) {
                mostrarErrorEdad('La fecha inicial no puede ser mayor que la fecha final');
                return;
            }

            mostrarLoadingEdad('Aplicando filtros...');

            const tipoReporte = obtenerTipoReporteActual();
            
            let query = supabase
                .from('participantes_reserva')
                .select('fecha_visita, fecha_nacimiento')
                .not('fecha_visita', 'is', null)
                .gte('fecha_visita', fechaInicial + 'T00:00:00')
                .lte('fecha_visita', fechaFinal + 'T23:59:59');

            const { data: participantesFiltrados, error } = await query;

            if (error) throw error;

            if (participantesFiltrados && participantesFiltrados.length > 0) {
                // Procesar datos con filtros
                const datosFiltrados = procesarDatosTiempoConFiltros(
                    participantesFiltrados, 
                    tipoReporte, 
                    rangoEdad
                );
                
                // Mostrar interfaz con datos filtrados
                mostrarInterfazTiempoConFiltros(tipoReporte, datosFiltrados, rangoEdad);
                
                mostrarExitoEdad(`Filtros aplicados: ${participantesFiltrados.length} visitas encontradas`);
            } else {
                mostrarMensajeNoHayDatos(rangoEdad);
            }

            cerrarLoadingEdad();
            
        } catch (error) {
            console.error('Error aplicando filtros combinados:', error);
            cerrarLoadingEdad();
            mostrarErrorEdad('Error al aplicar los filtros: ' + error.message);
        }
    }

    async function aplicarFiltrosEdadCombinado(fechaInicial, fechaFinal, rangoEdad) {
        try {
            let query = supabase
                .from('participantes_reserva')
                .select(`
                    fecha_nacimiento,
                    fecha_visita,
                    id_genero,
                    nombre,
                    apellido,
                    genero!inner(genero)
                `)
                .not('fecha_nacimiento', 'is', null)
                .gte('fecha_visita', fechaInicial + 'T00:00:00')
                .lte('fecha_visita', fechaFinal + 'T23:59:59');

            const { data: participantesFiltrados, error } = await query;

            if (error) throw error;

            if (participantesFiltrados && participantesFiltrados.length > 0) {
                let participantesProcesados = participantesFiltrados;

                // Aplicar filtro adicional por rango de edad si no es "todos"
                if (rangoEdad !== 'todos') {
                    participantesProcesados = participantesFiltrados.filter(participante => {
                        const edad = calcularEdad(participante.fecha_nacimiento);
                        if (edad === null) return false;
                        
                        const categoria = clasificarEdad(edad);
                        return categoria === rangoEdad;
                    });
                }

                if (participantesProcesados.length > 0) {
                    procesarDatosEdades(participantesProcesados);
                    mostrarDatosEdad();
                    
                    Swal.fire({
                        icon: 'success',
                        title: 'Filtros aplicados',
                        text: `Se encontraron ${participantesProcesados.length} participantes`,
                        timer: 2000,
                        showConfirmButton: false
                    });
                } else {
                    mostrarMensajeNoHayDatos(rangoEdad);
                }
            } else {
                mostrarMensajeNoHayDatos();
            }
            
        } catch (error) {
            throw error;
        }
    }

    async function aplicarFiltrosTiempoCombinado(fechaInicial, fechaFinal, rangoEdad, tipoTiempo) {
        try {
            let query = supabase
                .from('participantes_reserva')
                .select(`
                    fecha_nacimiento,
                    fecha_visita
                `)
                .not('fecha_visita', 'is', null)
                .gte('fecha_visita', fechaInicial + 'T00:00:00')
                .lte('fecha_visita', fechaFinal + 'T23:59:59');

            // Solo incluir participantes con fecha de nacimiento si se filtra por edad
            if (rangoEdad !== 'todos') {
                query = query.not('fecha_nacimiento', 'is', null);
            }

            const { data: participantesFiltrados, error } = await query;

            if (error) throw error;

            if (participantesFiltrados && participantesFiltrados.length > 0) {
                // Procesar datos para vista inteligente
                procesarDatosTiempoInteligente(participantesFiltrados, tipoTiempo, rangoEdad);
                mostrarInterfazTiempoInteligente(tipoTiempo, rangoEdad);
                
                Swal.fire({
                    icon: 'success',
                    title: 'Filtros aplicados',
                    text: `Se encontraron ${participantesFiltrados.length} visitas`,
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                mostrarMensajeNoHayDatos(rangoEdad);
            }
            
        } catch (error) {
            throw error;
        }
    }

    function mostrarMensajeNoHayDatos(rangoEdad = '') {
        let mensaje = 'No hay datos disponibles para los filtros seleccionados';
        if (rangoEdad && rangoEdad !== 'todos') {
            mensaje = `No hay participantes con edad ${rangoEdad} en las fechas seleccionadas`;
        }
        
        Swal.fire({
            icon: 'info',
            title: 'Sin datos',
            text: mensaje,
            confirmButtonColor: '#3498db'
        });
    }

    function crearGraficaAmpliadaTiempo(tipo, tipoGrafica) {
        const ctx = document.getElementById("chartAmpliadoEdad");
        if (!ctx) {
            console.error('❌ No se encontró el canvas para gráfica ampliada');
            return;
        }

        // Destruir gráfica anterior si existe
        if (chartAmpliadoEdad) {
            chartAmpliadoEdad.destroy();
            chartAmpliadoEdad = null;
        }

        // Obtener datos AGRUPADOS según el tipo
        let datos;
        switch(tipo) {
            case 'fecha':
                datos = datosFechaAgrupados || datosFechaInteligente || { labels: [], datasets: [], total: 0 };
                console.log('📅 Datos AGRUPADOS para fecha ampliada:', datos);
                break;
            case 'mes':
                datos = datosMesAgrupados || datosMesInteligente || { labels: [], datasets: [], total: 0 };
                console.log('📊 Datos AGRUPADOS para mes ampliada:', datos);
                break;
            case 'anio':
                datos = datosAnioAgrupados || datosAnioInteligente || { labels: [], datasets: [], total: 0 };
                console.log('📈 Datos AGRUPADOS para año ampliada:', datos);
                break;
            default:
                console.error(`❌ Tipo de gráfica no válido: ${tipo}`);
                datos = { labels: [], datasets: [], total: 0 };
        }

        console.log(`🔍 Datos para gráfica ampliada ${tipo}:`, {
            labels: datos.labels?.length || 0,
            datasets: datos.datasets?.length || 0,
            total: datos.total || 0
        });

        // Validar que tenemos datos
        if (!datos || !datos.labels || datos.labels.length === 0) {
            console.warn(`⚠️ No hay datos para gráfica ampliada de ${tipo}, mostrando gráfica vacía`);
            
            // Crear gráfica vacía
            chartAmpliadoEdad = new Chart(ctx, {
                type: tipoGrafica === "bar" ? "bar" : "doughnut",
                data: {
                    labels: ['Sin datos'],
                    datasets: [{
                        label: "Sin datos disponibles",
                        data: [1],
                        backgroundColor: '#95a5a6'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        title: {
                            display: true,
                            text: `${getTituloTiempo(tipo)} - No hay datos disponibles`,
                            font: { size: 16, weight: 'bold' }
                        },
                        tooltip: { enabled: false }
                    },
                    scales: tipoGrafica === "bar" ? {
                        y: { display: false },
                        x: { display: false }
                    } : {}
                }
            });
            return;
        }

        // Determinar qué tipo de gráfica crear
        const chartType = tipoGrafica === "bar" ? "bar" : "doughnut";
        
        // Si es gráfica circular o si no hay datasets múltiples, crear gráfica simple
        if (chartType === "doughnut" || !datos.datasets || datos.datasets.length <= 1) {
            console.log(`📊 Creando gráfica SIMPLE para ${tipo} (${chartType})`);
            crearGraficaAmpliadaSimple(tipo, datos, chartType, ctx);
        } else {
            // Si hay múltiples datasets, crear gráfica AGRUPADA
            console.log(`📊 Creando gráfica AGRUPADA para ${tipo} (${chartType}) con ${datos.datasets.length} datasets`);
            crearGraficaAmpliadaAgrupada(tipo, datos, chartType, ctx);
        }
    }

   function llenarTablaModalTiempo(tipo) {
        const tbody = document.getElementById("tbodyDatosEdad");
        if (!tbody) return;

        // Obtener datos AGRUPADOS según el tipo
        let datos;
        switch(tipo) {
            case 'fecha': datos = datosFechaAgrupados; break;
            case 'mes': datos = datosMesAgrupados; break;
            case 'anio': datos = datosAnioAgrupados; break;
            default: datos = { labels: [], datasets: [], total: 0 };
        }

        // Si no hay datasets, intentar con datos normales
        if (!datos.datasets || datos.datasets.length === 0) {
            console.warn(`⚠️ No hay datasets agrupados para ${tipo}, usando datos normales`);
            datos = getDatosTiempo(tipo);
        }

        // Calcular valores totales por fecha/mes/año
        let labels = datos.labels || [];
        let values = [];
        let total = 0;
        
        if (datos.datasets && datos.datasets.length > 0) {
            // Sumar todos los datasets
            values = labels.map((_, index) => {
                return datos.datasets.reduce((sum, dataset) => {
                    return sum + (dataset.data[index] || 0);
                }, 0);
            });
            total = datos.total || values.reduce((a, b) => a + b, 0);
        } else if (datos.values && datos.values.length > 0) {
            values = datos.values;
            total = datos.total || values.reduce((a, b) => a + b, 0);
        } else {
            values = labels.map(() => 0);
            total = 0;
        }

        tbody.innerHTML = labels.map((label, index) => {
            const valor = values[index] || 0;
            const porcentaje = total > 0 ? ((valor / total) * 100).toFixed(1) : 0;
            
            // Calcular tendencia (solo si hay valores anteriores)
            let tendencia = '';
            if (index > 0) {
                const valorAnterior = values[index - 1] || 0;
                const diferencia = valor - valorAnterior;
                const porcentajeCambio = valorAnterior > 0 ? ((diferencia / valorAnterior) * 100).toFixed(1) : 100;
                
                if (diferencia > 0) {
                    tendencia = `<span style="color: #27ae60;"><i class="fas fa-arrow-up"></i> ${porcentajeCambio}%</span>`;
                } else if (diferencia < 0) {
                    tendencia = `<span style="color: #e74c3c;"><i class="fas fa-arrow-down"></i> ${Math.abs(porcentajeCambio)}%</span>`;
                } else {
                    tendencia = `<span style="color: #f39c12;"><i class="fas fa-minus"></i> 0%</span>`;
                }
            } else {
                tendencia = '<span style="color: #95a5a6;">-</span>';
            }
            
            return `
                <tr>
                    <td><strong>${label}</strong></td>
                    <td>${getDescripcionTiempo(tipo, label)}</td>
                    <td style="text-align: center; font-weight: bold">${valor.toLocaleString()}</td>
                    <td style="text-align: center; color: #2e7d32; font-weight: bold">${porcentaje}%</td>
                    <td style="text-align: center;">${tendencia}</td>
                </tr>
            `;
        }).join('') + (total > 0 ? `
            <tr style="background: #f8f9fa; font-weight: bold;">
                <td colspan="2">TOTAL GENERAL</td>
                <td style="text-align: center">${total.toLocaleString()}</td>
                <td style="text-align: center">100%</td>
                <td style="text-align: center;">-</td>
            </tr>
        ` : '');
    }

    function getDescripcionTiempo(tipo, label) {
        switch(tipo) {
            case 'fecha':
                return 'Fecha específica de visita';
            case 'mes':
                return 'Mes completo de visitas';
            case 'anio':
                return 'Año completo de visitas';
            default:
                return 'Período de tiempo';
        }
    }


    async function aplicarFiltrosModalTiempo(tipo) {
        const fechaInicio = document.getElementById('modal-filtro-fecha-inicio-tiempo')?.value;
        const fechaFin = document.getElementById('modal-filtro-fecha-fin-tiempo')?.value;
        
        console.log('🎯 Aplicando filtros tiempo:', { fechaInicio, fechaFin, tipo });
        
        if (!fechaInicio || !fechaFin) {
            mostrarMensajeSinDatos('Por favor selecciona ambas fechas');
            return;
        }
        
        if (fechaInicio > fechaFin) {
            mostrarMensajeSinDatos('La fecha inicial no puede ser mayor que la fecha final');
            return;
        }

        try {
            mostrarLoadingEdad('Aplicando filtros...');

            const { data: participantesFiltrados, error } = await supabase
                .from('participantes_reserva')
                .select('fecha_visita')
                .not('fecha_visita', 'is', null)
                .gte('fecha_visita', fechaInicio + 'T00:00:00')
                .lte('fecha_visita', fechaFin + 'T23:59:59');

            if (error) throw error;

            if (participantesFiltrados && participantesFiltrados.length > 0) {
                procesarDatosTiempo(participantesFiltrados, tipo);
                crearGraficaAmpliadaTiempo(tipo, 'bar');
                llenarTablaModalTiempo(tipo);
                
                mostrarExitoEdad(`Filtros aplicados: ${participantesFiltrados.length} visitas encontradas`);
            } else {
                mostrarMensajeNoHayDatos();
            }

            cerrarLoadingEdad();
            
        } catch (error) {
            console.error('Error aplicando filtros tiempo:', error);
            cerrarLoadingEdad();
            mostrarErrorEdad('Error al aplicar los filtros: ' + error.message);
        }
    }

    function procesarDatosTiempoConFiltros(participantes, tipo, rangoEdad) {
        console.log(`🔄 Procesando datos con filtros: ${tipo}, Rango: ${rangoEdad}`);
        
        const datosPorTiempo = {};
        const rangosEdad = ['0-17', '18-25', '26-35', '36-50', '51-65', '66+'];
        const fechasSet = new Set();
        
        // Determinar qué rangos incluir
        let rangosAIncluir = [];
        if (rangoEdad === 'todos') {
            // Incluir todos los rangos
            rangosAIncluir = rangosEdad;
        } else {
            // Solo el rango específico seleccionado
            rangosAIncluir = [rangoEdad];
        }
        
        // Inicializar estructura para cada rango a incluir
        rangosAIncluir.forEach(rango => {
            datosPorTiempo[rango] = {};
        });
        
        // Procesar cada participante
        participantes.forEach(participante => {
            if (participante.fecha_visita && participante.fecha_nacimiento) {
                const fecha = new Date(participante.fecha_visita);
                const edad = calcularEdad(participante.fecha_nacimiento);
                
                if (edad !== null) {
                    const rango = clasificarEdad(edad);
                    let claveFecha = '';
                    
                    // Determinar clave según tipo
                    switch(tipo) {
                        case 'fecha':
                            claveFecha = fecha.toISOString().split('T')[0];
                            break;
                        case 'mes':
                            const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                            claveFecha = `${meses[fecha.getMonth()]} ${fecha.getFullYear()}`;
                            break;
                        case 'anio':
                            claveFecha = fecha.getFullYear().toString();
                            break;
                    }
                    
                    // Solo procesar si el rango está en los rangos a incluir
                    if (rangosAIncluir.includes(rango)) {
                        fechasSet.add(claveFecha);
                        
                        // Contar en el rango correspondiente
                        if (datosPorTiempo[rango][claveFecha]) {
                            datosPorTiempo[rango][claveFecha]++;
                        } else {
                            datosPorTiempo[rango][claveFecha] = 1;
                        }
                    }
                }
            }
        });
        
        // Ordenar fechas
        const fechasOrdenadas = Array.from(fechasSet).sort((a, b) => {
            switch(tipo) {
                case 'fecha': return new Date(a) - new Date(b);
                case 'mes': return ordenarMeses(a, b);
                case 'anio': return parseInt(a) - parseInt(b);
                default: return 0;
            }
        });
        
        // Limitar a las últimas fechas si son muchas
        let fechasMostrar = fechasOrdenadas;
        if (tipo === 'fecha' && fechasOrdenadas.length > 10) {
            fechasMostrar = fechasOrdenadas.slice(-10);
        } else if (tipo === 'mes' && fechasOrdenadas.length > 12) {
            fechasMostrar = fechasOrdenadas.slice(-12);
        }
        
        // Preparar datasets para Chart.js (BARRAS AGRUPADAS)
        const datasets = rangosAIncluir.map((rango, index) => {
            const datosRango = datosPorTiempo[rango] || {};
            const data = fechasMostrar.map(fecha => datosRango[fecha] || 0);
            
            // Verificar si este rango tiene datos
            const totalRango = data.reduce((sum, val) => sum + val, 0);
            
            if (totalRango > 0 || rangoEdad !== 'todos') {
                return {
                    label: `${rango} años`,
                    data: data,
                    backgroundColor: coloresPorEdad[rango],
                    borderColor: darkenColor(coloresPorEdad[rango], 0.2),
                    borderWidth: 1,
                    borderRadius: 6,
                    barThickness: rangoEdad === 'todos' ? 15 : 35, // Más ancho si solo hay un rango
                    hidden: false
                };
            } else {
                return null; // No incluir rangos sin datos
            }
        }).filter(dataset => dataset !== null); // Filtrar rangos sin datos
        
        // Si no hay datasets (todos los rangos estaban vacíos)
        if (datasets.length === 0) {
            datasets.push({
                label: rangoEdad === 'todos' ? 'Sin datos' : `${rangoEdad} años`,
                data: fechasMostrar.map(() => 0),
                backgroundColor: rangoEdad === 'todos' ? '#95a5a6' : coloresPorEdad[rangoEdad],
                borderWidth: 1,
                borderRadius: 6,
                barThickness: 35
            });
        }
        
        // Calcular total general
        const totalGeneral = datasets.reduce((total, dataset) => 
            total + dataset.data.reduce((sum, val) => sum + val, 0), 0);
        
        // Estructura de datos final
        const datosFiltrados = {
            labels: fechasMostrar,
            datasets: datasets,
            rangosEdad: datasets.map(d => d.label.replace(' años', '')),
            fechas: fechasMostrar,
            total: totalGeneral,
            filtrosAplicados: {
                rangoEdad: rangoEdad,
                participantesAnalizados: participantes.length
            }
        };
        
        console.log(`✅ Datos filtrados de ${tipo} procesados:`, datosFiltrados);
        
        return datosFiltrados;
    }

    function limpiarFiltrosModalTiempo(tipo) {
        // Limpiar inputs
        const fechaInicio = document.getElementById('modal-filtro-fecha-inicio-tiempo');
        const fechaFin = document.getElementById('modal-filtro-fecha-fin-tiempo');
        
        if (fechaInicio) fechaInicio.value = '';
        if (fechaFin) fechaFin.value = '';
        
        // Recargar datos originales
        cargarDatosTiempo(tipo);
        
        mostrarExitoEdad('Filtros limpiados - Mostrando todos los datos');
    }

    // Generar filas de tabla para tiempo
    function generarFilasTablaTiempo(datos, tipo) {
    // Verificar si tenemos datos en el nuevo formato (con datasets)
        if (!datos || !datos.datasets || datos.datasets.length === 0) {
            return `
                <tr>
                    <td colspan="7" style="text-align: center; color: #7f8c8d; padding: 20px;">
                        <i class="fas fa-exclamation-circle"></i> No hay datos disponibles
                    </td>
                </tr>
            `;
        }
        
        let html = '';
        const totalGeneral = datos.total || 0;
        
        // Encabezado para tabla agrupada
        html += `
            <tr style="background: #f8f9fa; font-weight: bold;">
                <th style="min-width: 150px;">${getTituloTiempo(tipo).split(' ')[1]}</th>
                ${datos.datasets.map(dataset => `<th>${dataset.label}</th>`).join('')}
                <th style="width: 120px;">Total por ${getTituloTiempo(tipo).split(' ')[1]}</th>
            </tr>
        `;
        
        // Filas de datos para cada fecha/mes/año
        datos.labels.forEach((fecha, fechaIndex) => {
            html += `
                <tr>
                    <td><strong>${fecha}</strong></td>
                    ${datos.datasets.map(dataset => 
                        `<td style="text-align: center; font-weight: ${dataset.data[fechaIndex] > 0 ? 'bold' : 'normal'}">
                            ${(dataset.data[fechaIndex] || 0).toLocaleString()}
                        </td>`
                    ).join('')}
                    <td style="text-align: center; background: #e8f5e9; font-weight: bold;">
                        ${datos.datasets.reduce((sum, dataset) => 
                            sum + (dataset.data[fechaIndex] || 0), 0
                        ).toLocaleString()}
                    </td>
                </tr>
            `;
        });
        
        // Totales por rango de edad
        html += `
            <tr style="background: #f0f7ff; font-weight: bold;">
                <td><strong>Total por Rango</strong></td>
                ${datos.datasets.map(dataset => {
                    const totalRango = dataset.data.reduce((sum, val) => sum + (val || 0), 0);
                    return `<td style="text-align: center; color: #2e7d32;">${totalRango.toLocaleString()}</td>`;
                }).join('')}
                <td style="text-align: center; background: #2e7d32; color: white;">
                    ${totalGeneral.toLocaleString()}
                </td>
            </tr>
        `;
        
        return html;
    }

    // Mostrar gráficas para tiempo
    function mostrarGraficasTiempo(tipo) {
        console.log(`🎨 Iniciando gráficas para: ${tipo}`);
        
        // Obtener datos
        const datos = getDatosTiempoInteligente(tipo);
        console.log('📊 Datos recibidos para gráficas:', datos);
        
        // Validar que tenemos el contenedor del gráfico de barras
        const ctxBar = document.getElementById(`chart${tipo.charAt(0).toUpperCase() + tipo.slice(1)}Bar`);
        if (!ctxBar) {
            console.error(`❌ No se encontró el canvas para gráfica de barras de ${tipo}`);
            return;
        }
        
        // Validar datos antes de crear gráficas
        if (!datos || !datos.datasets || datos.datasets.length === 0) {
            console.warn(`⚠️ No hay datos válidos para ${tipo}, mostrando gráfica vacía`);
            
            // Mostrar mensaje en el contenedor
            const container = ctxBar.parentElement;
            if (container) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 30px; color: #7f8c8d;">
                        <i class="fas fa-chart-bar fa-2x" style="margin-bottom: 10px;"></i>
                        <h4>No hay datos disponibles</h4>
                        <p>No se encontraron visitantes con datos de edad en este período</p>
                    </div>
                `;
            }
            return;
        }
        
        // Verificar que los datasets tengan datos
        const datasetsValidos = datos.datasets.filter(dataset => 
            dataset.data && dataset.data.length > 0 && dataset.data.some(val => val > 0)
        );
        
        if (datasetsValidos.length === 0) {
            console.warn(`⚠️ Todos los datasets están vacíos para ${tipo}`);
            // Crear gráfica con datos vacíos
            crearGraficaVacia(tipo, ctxBar, 'No hay visitantes en este período');
            return;
        }
        
        // Destruir gráficas anteriores si existen
        console.log(`🗑️ Destruyendo gráficas anteriores de ${tipo}...`);
        switch(tipo) {
            case 'fecha': 
                if (chartFechaBar) {
                    chartFechaBar.destroy();
                    chartFechaBar = null;
                }
                break;
            case 'mes': 
                if (chartMesBar) {
                    chartMesBar.destroy();
                    chartMesBar = null;
                }
                break;
            case 'anio': 
                if (chartAnioBar) {
                    chartAnioBar.destroy();
                    chartAnioBar = null;
                }
                break;
        }
        
        // Crear gráfica de barras
        try {
            console.log(`📈 Creando gráfica de barras para ${tipo}...`);
            const chartBar = new Chart(ctxBar, {
                type: "bar",
                data: {
                    labels: datos.labels || [],
                    datasets: datos.datasets.map((dataset, index) => {
                        // Validar y limpiar datos
                        const datosLimpiados = (dataset.data || []).map(val => {
                            const num = parseFloat(val) || 0;
                            return isNaN(num) ? 0 : num;
                        });
                        
                        // Determinar color
                        const rango = dataset.label ? dataset.label.replace(' años', '') : '';
                        const colorBase = dataset.backgroundColor || coloresPorEdad[rango] || 
                                        coloresPorEdad[Object.keys(coloresPorEdad)[index % Object.keys(coloresPorEdad).length]];
                        
                        return {
                            label: dataset.label || `Rango ${index + 1}`,
                            data: datosLimpiados,
                            backgroundColor: colorBase,
                            borderColor: darkenColor(colorBase, 0.2),
                            borderWidth: dataset.borderWidth || 1,
                            borderRadius: dataset.borderRadius || 6,
                            barThickness: dataset.barThickness || 20,
                            minBarLength: 2
                        };
                    })
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
                            text: `${getTituloTiempo(tipo)} - Distribución por Edad`,
                            font: { size: 16, weight: 'bold' }
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                                label: function(context) {
                                    const label = context.dataset.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                    return `${label}: ${value} visitantes (${percentage}%)`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: { 
                                display: true, 
                                text: 'Cantidad de Visitantes',
                                font: { size: 14, weight: 'bold' }
                            },
                            ticks: {
                                stepSize: 1,
                                callback: function(value) {
                                    return Math.round(value);
                                }
                            }
                        },
                        x: {
                            title: { 
                                display: true, 
                                text: getTituloTiempo(tipo).split(' ')[2] || tipo.toUpperCase(),
                                font: { size: 14, weight: 'bold' }
                            }
                        }
                    },
                    animation: {
                        duration: 1000,
                        easing: 'easeOutQuart'
                    }
                }
            });
            
            // Guardar referencia
            switch(tipo) {
                case 'fecha': chartFechaBar = chartBar; break;
                case 'mes': chartMesBar = chartBar; break;
                case 'anio': chartAnioBar = chartBar; break;
            }
            
            console.log(`✅ Gráfica de barras ${tipo} creada exitosamente`);
            
        } catch (error) {
            console.error(`❌ Error creando gráfica de barras para ${tipo}:`, error);
            crearGraficaVacia(tipo, ctxBar, `Error: ${error.message}`);
        }
        
        // Crear gráfica circular
        crearGraficaCircularTiempo(tipo, datos);
    }

    // Función para mostrar gráficas agrupadas
    function mostrarGraficasAgrupadasTiempo(tipo) {
    // Obtener el canvas correcto
    const ctxBar = document.getElementById(`chart${tipo.charAt(0).toUpperCase() + tipo.slice(1)}BarAgrupado`);
    if (!ctxBar) {
        console.error(`❌ Canvas no encontrado para gráfica agrupada de ${tipo}`);
        return;
    }
    
    // Obtener datos agrupados
    let datos;
    switch(tipo) {
        case 'fecha': datos = datosFechaAgrupados; break;
        case 'mes': datos = datosMesAgrupados; break;
        case 'anio': datos = datosAnioAgrupados; break;
        default: return;
    }
    
    console.log(`🎨 Creando gráfica agrupada para ${tipo}:`, datos);
    
    // Destruir gráficas anteriores si existen
    let chartAnterior;
    switch(tipo) {
        case 'fecha': 
            if (chartFechaBar) {
                chartFechaBar.destroy();
                chartFechaBar = null;
            }
            break;
        case 'mes': 
            if (chartMesBar) {
                chartMesBar.destroy();
                chartMesBar = null;
            }
            break;
        case 'anio': 
            if (chartAnioBar) {
                chartAnioBar.destroy();
                chartAnioBar = null;
            }
            break;
    }
    
    // Verificar que tenemos datos
    if (!datos || !datos.datasets || datos.datasets.length === 0) {
        console.warn(`⚠️ No hay datasets para gráfica agrupada de ${tipo}`);
        
        // Crear gráfica vacía
        new Chart(ctxBar, {
            type: "bar",
            data: {
                labels: ['Sin datos'],
                datasets: [{
                    label: 'Sin datos',
                    data: [1],
                    backgroundColor: '#f8f9fa',
                    borderColor: '#dee2e6',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: 'No hay datos disponibles',
                        font: { size: 14, weight: 'bold' },
                        color: '#95a5a6'
                    },
                    tooltip: { enabled: false }
                },
                scales: {
                    y: { display: false },
                    x: { display: false }
                }
            }
        });
        return;
    }
    
    // Crear gráfica de barras AGRUPADAS
    const chartBar = new Chart(ctxBar, {
        type: "bar",
        data: {
            labels: datos.labels || [],
            datasets: (datos.datasets || []).map((dataset, index) => {
                // Obtener el rango de edad del label
                const rango = dataset.label ? dataset.label.split(' ')[0] : '';
                
                return {
                    label: dataset.label || `Rango ${index + 1}`,
                    data: dataset.data.map(val => val || 0),
                    backgroundColor: dataset.backgroundColor || coloresPorEdad[rango] || 
                                  coloresPorEdad[Object.keys(coloresPorEdad)[index % Object.keys(coloresPorEdad).length]],
                    borderColor: dataset.borderColor || darkenColor(dataset.backgroundColor || '#3498db', 0.2),
                    borderWidth: dataset.borderWidth || 1,
                    borderRadius: dataset.borderRadius || 6,
                    barThickness: dataset.barThickness || 20,
                    minBarLength: 2
                };
            })
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
                    text: `${getTituloTiempo(tipo)} - Gráfica Agrupada por Edad`,
                    font: { size: 16, weight: 'bold' }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${value} visitantes (${percentage}%)`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { 
                        display: true, 
                        text: 'Cantidad de Visitantes',
                        font: { size: 14, weight: 'bold' }
                    },
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            return Math.round(value);
                        }
                    }
                },
                x: {
                    title: { 
                        display: true, 
                        text: getTituloTiempo(tipo).split(' ')[2] || tipo.toUpperCase(),
                        font: { size: 14, weight: 'bold' }
                    },
                    ticks: {
                        maxRotation: tipo === 'fecha' ? 45 : 0,
                        minRotation: 0
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });
    
    // Guardar referencia
    switch(tipo) {
        case 'fecha': chartFechaBar = chartBar; break;
        case 'mes': chartMesBar = chartBar; break;
        case 'anio': chartAnioBar = chartBar; break;
    }
    
    console.log(`✅ Gráfica agrupada ${tipo} creada exitosamente`);
    
    // También crear gráfica circular
    crearGraficaCircularAgrupada(tipo, datos);
}

    // Función auxiliar para crear gráfica vacía
    function crearGraficaVacia(tipo, ctx, mensaje) {
        new Chart(ctx, {
            type: "bar",
            data: {
                labels: ['Sin datos'],
                datasets: [{
                    label: 'Sin datos',
                    data: [1],
                    backgroundColor: '#f8f9fa',
                    borderColor: '#dee2e6',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: mensaje || 'No hay datos disponibles',
                        font: { size: 14, weight: 'bold' },
                        color: '#95a5a6'
                    },
                    tooltip: { enabled: false }
                },
                scales: {
                    y: { display: false },
                    x: { display: false }
                }
            }
        });
    }

    // Función para crear gráfica circular
    function crearGraficaCircularTiempo(tipo, datos) {
        const ctxPie = document.getElementById(`chart${tipo.charAt(0).toUpperCase() + tipo.slice(1)}Pie`);
        if (!ctxPie) {
            console.error(`❌ No se encontró el canvas para gráfica circular de ${tipo}`);
            return;
        }
        
        // Destruir gráfica anterior si existe
        switch(tipo) {
            case 'fecha': 
                if (chartFechaPie) {
                    chartFechaPie.destroy();
                    chartFechaPie = null;
                }
                break;
            case 'mes': 
                if (chartMesPie) {
                    chartMesPie.destroy();
                    chartMesPie = null;
                }
                break;
            case 'anio': 
                if (chartAnioPie) {
                    chartAnioPie.destroy();
                    chartAnioPie = null;
                }
                break;
        }
        
        // Calcular totales por rango
        const totalesPorRango = {};
        if (datos.datasets && datos.datasets.length > 0) {
            datos.datasets.forEach(dataset => {
                const total = (dataset.data || []).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
                if (total > 0 && dataset.label) {
                    totalesPorRango[dataset.label] = total;
                }
            });
        }
        
        // Si no hay datos, crear gráfica vacía
        if (Object.keys(totalesPorRango).length === 0) {
            const chartPie = new Chart(ctxPie, {
                type: "doughnut",
                data: {
                    labels: ['Sin datos'],
                    datasets: [{
                        data: [100],
                        backgroundColor: ['#f8f9fa'],
                        borderColor: '#dee2e6',
                        borderWidth: 2
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        title: {
                            display: true,
                            text: 'No hay datos disponibles',
                            font: { size: 14, weight: 'bold' },
                            color: '#95a5a6'
                        },
                        tooltip: { enabled: false }
                    },
                    cutout: '60%'
                },
            });
            
            switch(tipo) {
                case 'fecha': chartFechaPie = chartPie; break;
                case 'mes': chartMesPie = chartPie; break;
                case 'anio': chartAnioPie = chartPie; break;
            }
            return;
        }
        
        // Crear gráfica con datos
        const labels = Object.keys(totalesPorRango);
        const data = Object.values(totalesPorRango);
        const totalGeneral = data.reduce((a, b) => a + b, 0);
        
        try {
            const chartPie = new Chart(ctxPie, {
                type: "doughnut",
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: labels.map(label => {
                            const rango = label.replace(' años', '');
                            return coloresPorEdad[rango] || generarColorAleatorio();
                        }),
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
                        },
                        title: {
                            display: true,
                            text: 'Distribución por Rangos de Edad',
                            font: { size: 16, weight: 'bold' }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const percentage = totalGeneral > 0 ? ((value / totalGeneral) * 100).toFixed(1) : 0;
                                    return `${label}: ${value} visitantes (${percentage}%)`;
                                }
                            }
                        }
                    },
                    cutout: '60%'
                },
            });
            
            switch(tipo) {
                case 'fecha': chartFechaPie = chartPie; break;
                case 'mes': chartMesPie = chartPie; break;
                case 'anio': chartAnioPie = chartPie; break;
            }
            
            console.log(`✅ Gráfica circular ${tipo} creada exitosamente`);
            
        } catch (error) {
            console.error(`❌ Error creando gráfica circular para ${tipo}:`, error);
        }
    }

    function crearGraficaCircularAgrupada(tipo, datos) {
        const ctxPie = document.getElementById(`chart${tipo.charAt(0).toUpperCase() + tipo.slice(1)}PieAgrupado`);
        if (!ctxPie) {
            console.error(`❌ Canvas no encontrado para gráfica circular agrupada de ${tipo}`);
            return;
        }
        
        // Destruir gráfica anterior si existe
        switch(tipo) {
            case 'fecha': 
                if (chartFechaPie) {
                    chartFechaPie.destroy();
                    chartFechaPie = null;
                }
                break;
            case 'mes': 
                if (chartMesPie) {
                    chartMesPie.destroy();
                    chartMesPie = null;
                }
                break;
            case 'anio': 
                if (chartAnioPie) {
                    chartAnioPie.destroy();
                    chartAnioPie = null;
                }
                break;
        }
        
        // Calcular totales por rango
        const totalesPorRango = {};
        if (datos.datasets && datos.datasets.length > 0) {
            datos.datasets.forEach(dataset => {
                const total = (dataset.data || []).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
                if (total > 0 && dataset.label) {
                    totalesPorRango[dataset.label] = total;
                }
            });
        }
        
        // Si no hay datos, crear gráfica vacía
        if (Object.keys(totalesPorRango).length === 0) {
            const chartPie = new Chart(ctxPie, {
                type: "doughnut",
                data: {
                    labels: ['Sin datos'],
                    datasets: [{
                        data: [100],
                        backgroundColor: ['#f8f9fa'],
                        borderColor: '#dee2e6',
                        borderWidth: 2
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        title: {
                            display: true,
                            text: 'No hay datos disponibles',
                            font: { size: 14, weight: 'bold' },
                            color: '#95a5a6'
                        },
                        tooltip: { enabled: false }
                    },
                    cutout: '60%'
                },
            });
            
            switch(tipo) {
                case 'fecha': chartFechaPie = chartPie; break;
                case 'mes': chartMesPie = chartPie; break;
                case 'anio': chartAnioPie = chartPie; break;
            }
            return;
        }
        
        // Crear gráfica con datos
        const labels = Object.keys(totalesPorRango);
        const data = Object.values(totalesPorRango);
        const totalGeneral = data.reduce((a, b) => a + b, 0);
        
        try {
            const chartPie = new Chart(ctxPie, {
                type: "doughnut",
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: labels.map(label => {
                            const rango = label.split(' ')[0];
                            return coloresPorEdad[rango] || generarColorAleatorio();
                        }),
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
                        },
                        title: {
                            display: true,
                            text: 'Distribución por Rangos de Edad',
                            font: { size: 16, weight: 'bold' }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const percentage = totalGeneral > 0 ? ((value / totalGeneral) * 100).toFixed(1) : 0;
                                    return `${label}: ${value} visitantes (${percentage}%)`;
                                }
                            }
                        }
                    },
                    cutout: '60%'
                },
            });
            
            switch(tipo) {
                case 'fecha': chartFechaPie = chartPie; break;
                case 'mes': chartMesPie = chartPie; break;
                case 'anio': chartAnioPie = chartPie; break;
            }
            
            console.log(`✅ Gráfica circular agrupada ${tipo} creada exitosamente`);
            
        } catch (error) {
            console.error(`❌ Error creando gráfica circular para ${tipo}:`, error);
        }
    }

    // Función auxiliar para generar colores aleatorios
    function generarColorAleatorio() {
        const colores = [
            '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2',
            '#EF476F', '#073B4C', '#7209B7', '#3A86FF', '#FB5607'
        ];
        return colores[Math.floor(Math.random() * colores.length)];
    }

    // ***** FUNCIONES FALTANTES AÑADIDAS *****

    function mostrarInterfazTiempoInteligente(tipo, rangoEdad) {
        const container = document.getElementById('data-container');
        const datos = getDatosTiempoInteligente(tipo);
        const titulo = getTituloTiempo(tipo);

        const subtitulo = rangoEdad === 'todos' ? 
            'Todas las edades' : 
            `Solo ${rangoEdad} años`;

        container.innerHTML = `
            <div class="chart-controls">
                <div class="chart-header">
                    <h3 style="margin: 0; display: flex; align-items: center; gap: 6px">
                        ${getIconoTiempo(tipo)} ${titulo}
                        <span style="background: #3498db; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; margin-left: 10px;">
                            ${subtitulo}
                        </span>
                    </h3>
                </div>
            </div>

            <div class="charts-grid">
                <div class="chart-card">
                    <div class="chart-card-header">
                        <div class="chart-card-title">
                            <i class="fas fa-chart-bar"></i> ${titulo} - ${subtitulo}
                        </div>
                    </div>
                    <div class="chart-canvas-wrap">
                        <canvas id="chartTiempoInteligente"></canvas>
                    </div>
                </div>
            </div>

            <div class="data-table">
                <div class="chart-header">
                    <h3 style="margin: 0; display: flex; align-items: center; gap: 6px">
                        <i class="fas fa-table"></i> Detalle por ${titulo.split(' ')[1]}
                    </h3>
                </div>
                <div style="overflow-x: auto;">
                    <table class="table" style="min-width: 700px;">
                        <thead>
                            <tr>
                                <th>${titulo.split(' ')[1]}</th>
                                ${rangoEdad === 'todos' ? 
                                    '<th>0-17</th><th>18-25</th><th>26-35</th><th>36-50</th><th>51-65</th><th>66+</th>' : 
                                    `<th>${rangoEdad} años</th>`
                                }
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody id="tabla-inteligente-body">
                            ${generarFilasTablaInteligente(datos, tipo, rangoEdad)}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        mostrarGraficaTiempoInteligente(datos, tipo, rangoEdad);
    }

    function procesarDatosTiempoInteligente(participantes, tipo, rangoEdad) {
        console.log(`Procesando para ${tipo} con edad: ${rangoEdad}`);
        
        const datos = {
            labels: [],
            datasets: []
        };

        const conteoPorTiempo = {};
        const todosLosRangos = ['0-17', '18-25', '26-35', '36-50', '51-65', '66+'];

        // Procesar cada participante
        participantes.forEach(participante => {
            if (participante.fecha_visita) {
                const fecha = new Date(participante.fecha_visita);
                const edad = calcularEdad(participante.fecha_nacimiento);
                
                if (edad !== null) {
                    const categoriaEdad = clasificarEdad(edad);
                    
                    // Solo procesar si es "todas" o la edad específica seleccionada
                    if (rangoEdad === 'todos' || categoriaEdad === rangoEdad) {
                        let claveTiempo = '';
                        
                        switch(tipo) {
                            case 'fecha':
                                claveTiempo = fecha.toISOString().split('T')[0];
                                break;
                            case 'mes':
                                const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                                            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                                claveTiempo = `${meses[fecha.getMonth()]} ${fecha.getFullYear()}`;
                                break;
                            case 'anio':
                                claveTiempo = fecha.getFullYear().toString();
                                break;
                        }

                        if (!conteoPorTiempo[claveTiempo]) {
                            conteoPorTiempo[claveTiempo] = {
                                '0-17': 0, '18-25': 0, '26-35': 0, 
                                '36-50': 0, '51-65': 0, '66+': 0
                            };
                        }
                        
                        conteoPorTiempo[claveTiempo][categoriaEdad]++;
                    }
                }
            }
        });

        // Preparar datos para gráficas
        datos.labels = Object.keys(conteoPorTiempo).sort((a, b) => {
            switch(tipo) {
                case 'fecha': return new Date(a) - new Date(b);
                case 'mes': return ordenarMeses(a, b);
                case 'anio': return parseInt(a) - parseInt(b);
                default: return 0;
            }
        });

        if (rangoEdad === 'todos') {
            // Mostrar todas las edades
            todosLosRangos.forEach(rango => {
                datos.datasets.push({
                    label: `${rango} años`,
                    data: datos.labels.map(label => conteoPorTiempo[label][rango] || 0),
                    backgroundColor: coloresPorEdad[rango],
                    borderRadius: 8,
                    barThickness: 20,
                });
            });
        } else {
            // Mostrar solo la edad seleccionada
            datos.datasets.push({
                label: `${rangoEdad} años`,
                data: datos.labels.map(label => conteoPorTiempo[label][rangoEdad] || 0),
                backgroundColor: coloresPorEdad[rangoEdad],
                borderRadius: 8,
                barThickness: 35,
            });
        }

        // Guardar datos
        switch(tipo) {
            case 'fecha': datosFechaInteligente = datos; break;
            case 'mes': datosMesInteligente = datos; break;
            case 'anio': datosAnioInteligente = datos; break;
        }

        console.log(`✅ Datos inteligentes ${tipo}:`, datos);
    }

    function mostrarGraficaTiempoInteligente(datos, tipo, rangoEdad) {
        const ctx = document.getElementById('chartTiempoInteligente');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'bar',
            data: datos,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `${getTituloTiempo(tipo)} - ${rangoEdad === 'todos' ? 'Todas las edades' : rangoEdad + ' años'}`,
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Cantidad de Visitantes' }
                    },
                    x: {
                        title: { display: true, text: getTituloTiempo(tipo).split(' ')[2] }
                    }
                }
            }
        });
    }

    function generarFilasTablaInteligente(datos, tipo, rangoEdad) {
        return datos.labels.map((label, index) => {
            let celdasEdad = '';
            let totalFila = 0;

            if (rangoEdad === 'todos') {
                // Sumar todas las edades para esta fecha/mes/año
                datos.datasets.forEach(dataset => {
                    const valor = dataset.data[index] || 0;
                    celdasEdad += `<td style="text-align: center;">${valor}</td>`;
                    totalFila += valor;
                });
            } else {
                // Solo una edad específica
                const valor = datos.datasets[0].data[index] || 0;
                celdasEdad = `<td style="text-align: center;">${valor}</td>`;
                totalFila = valor;
            }

            return `
                <tr>
                    <td><strong>${label}</strong></td>
                    ${celdasEdad}
                    <td style="text-align: center; font-weight: bold; background: #e8f5e8;">${totalFila}</td>
                </tr>
            `;
        }).join('');
    }

    function generarFilasTablaFiltrada(datos, tipo) {
        let html = '';
        
        // Filas de datos para cada fecha/mes/año
        datos.labels.forEach((fecha, fechaIndex) => {
            const totalFila = datos.datasets.reduce((sum, dataset) => 
                sum + (dataset.data[fechaIndex] || 0), 0);
            
            html += `
                <tr>
                    <td><strong>${fecha}</strong></td>
                    ${datos.datasets.map(dataset => 
                        `<td style="text-align: center; font-weight: ${dataset.data[fechaIndex] > 0 ? 'bold' : 'normal'}">
                            ${(dataset.data[fechaIndex] || 0).toLocaleString()}
                        </td>`
                    ).join('')}
                    <td style="text-align: center; background: #e8f5e9; font-weight: bold;">
                        ${totalFila.toLocaleString()}
                    </td>
                </tr>
            `;
        });
        
        // Totales por rango de edad
        html += `
            <tr style="background: #f0f7ff; font-weight: bold;">
                <td><strong>Total por Rango</strong></td>
                ${datos.datasets.map(dataset => {
                    const totalRango = dataset.data.reduce((sum, val) => sum + (val || 0), 0);
                    return `<td style="text-align: center; color: #2e7d32;">${totalRango.toLocaleString()}</td>`;
                }).join('')}
                <td style="text-align: center; background: #2e7d32; color: white;">
                    ${datos.total.toLocaleString()}
                </td>
            </tr>
        `;
        
        return html;
    }

    function getDatosTiempoInteligente(tipo) {
        switch(tipo) {
            case 'fecha': return datosFechaInteligente;
            case 'mes': return datosMesInteligente;
            case 'anio': return datosAnioInteligente;
            default: return { labels: [], datasets: [] };
        }
    }

    function generarFilasTablaCombinada(datos, tipo) {
        const tiempos = Object.keys(datos.porTiempo).sort((a, b) => {
            // Ordenar según el tipo
            switch(tipo) {
                case 'fecha': return new Date(a) - new Date(b);
                case 'mes': return ordenarMeses(a, b);
                case 'anio': return parseInt(a) - parseInt(b);
                default: return 0;
            }
        });

        return tiempos.map(tiempo => {
            const total = datos.porTiempo[tiempo];
            const edades = datos.porEdadYTiempo[tiempo] || {};
            
            return `
                <tr>
                    <td><strong>${tiempo}</strong></td>
                    <td style="text-align: center; background: ${edades['0-17'] > 0 ? '#e8f5e8' : '#f8f9fa'};">
                        ${edades['0-17'] || 0}
                    </td>
                    <td style="text-align: center; background: ${edades['18-25'] > 0 ? '#e3f2fd' : '#f8f9fa'};">
                        ${edades['18-25'] || 0}
                    </td>
                    <td style="text-align: center; background: ${edades['26-35'] > 0 ? '#fff3e0' : '#f8f9fa'};">
                        ${edades['26-35'] || 0}
                    </td>
                    <td style="text-align: center; background: ${edades['36-50'] > 0 ? '#fbe9e7' : '#f8f9fa'};">
                        ${edades['36-50'] || 0}
                    </td>
                    <td style="text-align: center; background: ${edades['51-65'] > 0 ? '#f3e5f5' : '#f8f9fa'};">
                        ${edades['51-65'] || 0}
                    </td>
                    <td style="text-align: center; background: ${edades['66+'] > 0 ? '#ffebee' : '#f8f9fa'};">
                        ${edades['66+'] || 0}
                    </td>
                    <td style="text-align: center; font-weight: bold; background: #e8f5e8;">
                        ${total}
                    </td>
                </tr>
            `;
        }).join('');
    }

    function mostrarGraficasTiempoCombinado(tipo, datos) {
        // Gráfica de barras principal
        const ctxBar = document.getElementById('chartTiempoPrincipal');
        if (ctxBar) {
            new Chart(ctxBar, {
                type: 'bar',
                data: {
                    labels: Object.keys(datos.porTiempo),
                    datasets: [{
                        label: 'Visitantes Totales',
                        data: Object.values(datos.porTiempo),
                        backgroundColor: '#3498db',
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: `Visitantes por ${tipo} - Totales`
                        }
                    }
                }
            });
        }

        // Gráfica circular
        const ctxPie = document.getElementById('chartTiempoPie');
        if (ctxPie) {
            new Chart(ctxPie, {
                type: 'pie',
                data: {
                    labels: Object.keys(datos.porTiempo),
                    datasets: [{
                        data: Object.values(datos.porTiempo),
                        backgroundColor: generarColoresTiempo(tipo, Object.keys(datos.porTiempo).length)
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
    }

    function mostrarInterfazTiempoConFiltros(tipo, datosFiltrados, rangoEdad) {
    const container = document.getElementById('data-container');
    const titulo = getTituloTiempo(tipo);
    const icono = getIconoTiempo(tipo);
    
    const subtitulo = rangoEdad === 'todos' ? 
        'Todas las edades' : 
        `Solo ${rangoEdad} años`;
    
    container.innerHTML = `
        <div class="chart-controls">
            <div class="chart-header">
                <h3 style="margin: 0; display: flex; align-items: center; gap: 6px">
                    ${icono} ${titulo}
                    <span style="background: #3498db; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; margin-left: 10px;">
                        ${subtitulo}
                    </span>
                    <span style="background: #27ae60; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px;">
                        ${datosFiltrados.total} visitantes
                    </span>
                </h3>
                <div style="display: flex; gap: 10px;">
                    <button class="download-btn" onclick="window.EdadSystem.descargarGraficoFiltrado('${tipo}', '${rangoEdad}')">
                        <i class="fas fa-download"></i> Descargar Gráfico
                    </button>
                    <button class="btn" onclick="window.EdadSystem.limpiarFiltrosCombinados()" style="background: #e74c3c; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer;">
                        <i class="fas fa-times"></i> Limpiar Filtros
                    </button>
                </div>
            </div>
            
            <!-- Indicador de filtros aplicados -->
            <div style="background: #e8f5e8; padding: 12px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #3498db;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-filter" style="color: #3498db;"></i>
                    <div>
                        <strong>Filtros aplicados:</strong> 
                        ${rangoEdad === 'todos' ? 'Todas las edades' : `${rangoEdad} años`}
                        <br><small>${datosFiltrados.filtrosAplicados?.participantesAnalizados || 0} participantes analizados</small>
                    </div>
                </div>
            </div>
        </div>

        <div class="charts-grid">
            <div class="chart-card" onclick="window.EdadSystem.abrirModalTiempoFiltrado('${tipo}', 'bar', '${rangoEdad}')">
                <div class="chart-card-header">
                    <div class="chart-card-title">
                        <i class="fas fa-chart-bar"></i> ${titulo} - Barras Agrupadas
                    </div>
                    <div class="chart-card-badge">Haz clic para ampliar</div>
                </div>
                <div class="chart-canvas-wrap">
                    <canvas id="chart${tipo.charAt(0).toUpperCase() + tipo.slice(1)}BarFiltrado"></canvas>
                </div>
            </div>

            <div class="chart-card" onclick="window.EdadSystem.abrirModalTiempoFiltrado('${tipo}', 'pie', '${rangoEdad}')">
                <div class="chart-card-header">
                    <div class="chart-card-title">
                        <i class="fas fa-chart-pie"></i> ${titulo} - Circular
                    </div>
                    <div class="chart-card-badge">Haz clic para ampliar</div>
                </div>
                <div class="chart-canvas-wrap pie-chart-container">
                    <canvas id="chart${tipo.charAt(0).toUpperCase() + tipo.slice(1)}PieFiltrado"></canvas>
                </div>
            </div>
        </div>

        <div class="data-table">
            <div class="chart-header">
                <h3 style="margin: 0; display: flex; align-items: center; gap: 6px">
                    <i class="fas fa-table"></i> Detalle por ${titulo.split(' ')[1]} y Rango de Edad
                </h3>
                <button class="download-btn" onclick="window.EdadSystem.descargarExcelFiltrado('${tipo}', '${rangoEdad}')">
                    <i class="fas fa-file-excel"></i> Exportar Excel
                </button>
            </div>
            <div style="overflow-x: auto;">
                <table class="table" style="min-width: 700px;">
                    <thead>
                        <tr>
                            <th style="min-width: 150px;">${titulo.split(' ')[1]}</th>
                            ${datosFiltrados.datasets.map(dataset => `<th>${dataset.label}</th>`).join('')}
                            <th style="width: 120px;">Total</th>
                        </tr>
                    </thead>
                    <tbody id="tabla-${tipo}-filtrado-body">
                        ${generarFilasTablaFiltrada(datosFiltrados, tipo)}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    mostrarGraficasTiempoFiltradas(tipo, datosFiltrados);
}

function mostrarGraficasTiempoFiltradas(tipo, datosFiltrados) {
    // Gráfica de barras AGRUPADAS filtrada
    const ctxBar = document.getElementById(`chart${tipo.charAt(0).toUpperCase() + tipo.slice(1)}BarFiltrado`);
    
    new Chart(ctxBar, {
        type: "bar",
        data: {
            labels: datosFiltrados.labels,
            datasets: datosFiltrados.datasets.map((dataset, index) => ({
                label: dataset.label,
                data: dataset.data.map(val => val || 0),
                backgroundColor: dataset.backgroundColor,
                borderColor: dataset.borderColor,
                borderWidth: dataset.borderWidth || 1,
                borderRadius: dataset.borderRadius || 6,
                barThickness: dataset.barThickness || 20
            }))
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
                    text: `${getTituloTiempo(tipo)} - ${datosFiltrados.filtrosAplicados?.rangoEdad === 'todos' ? 'Todas las edades' : datosFiltrados.filtrosAplicados?.rangoEdad + ' años'}`,
                    font: { size: 16, weight: 'bold' }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
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
                    title: { display: true, text: 'Cantidad de Visitantes' },
                    stacked: false
                },
                x: {
                    title: { display: true, text: getTituloTiempo(tipo).split(' ')[2] },
                    stacked: false
                }
            }
        }
    });

    // Gráfica circular filtrada
    const ctxPie = document.getElementById(`chart${tipo.charAt(0).toUpperCase() + tipo.slice(1)}PieFiltrado`);
    
    // Calcular totales por rango para el gráfico circular
    const totalesPorRango = {};
    datosFiltrados.datasets.forEach(dataset => {
        const total = dataset.data.reduce((sum, val) => sum + (val || 0), 0);
        if (total > 0) {
            totalesPorRango[dataset.label] = total;
        }
    });

    const labels = Object.keys(totalesPorRango);
    const data = Object.values(totalesPorRango);

    new Chart(ctxPie, {
        type: "doughnut",
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: labels.map(label => {
                    const rango = label.replace(' años', '');
                    return coloresPorEdad[rango] || '#95a5a6';
                }),
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
                },
                title: {
                    display: true,
                    text: 'Distribución por Rangos de Edad (Filtrado)',
                    font: { size: 16, weight: 'bold' }
                }
            },
            cutout: '60%'
        },
    });
}

    function getDatosTiempoCombinado(tipo) {
        switch(tipo) {
            case 'fecha': return datosFechaCombinado;
            case 'mes': return datosMesCombinado;
            case 'anio': return datosAnioCombinado;
            default: return { porTiempo: {}, porEdadYTiempo: {} };
        }
    }

    function limpiarFiltrosCombinados() {
        document.getElementById('filtro-fecha-inicial').value = '';
        document.getElementById('filtro-fecha-final').value = '';
        document.getElementById('filtro-rango-edad').value = 'todos';
        
        // Recargar datos sin filtros
        const tipoActual = obtenerTipoReporteActual();
        if (tipoActual === 'edad') {
            cargarDatosEdades();
        } else {
            cargarDatosTiempo(tipoActual);
        }
        
        mostrarExitoEdad('Filtros limpiados - Mostrando todos los datos');
    }

    // ***** FUNCIONES COMPLETADAS *****

    function obtenerTipoReporteActual() {
        const btnActivo = document.querySelector('.chart-btn.active');
        if (btnActivo) {
            return btnActivo.dataset.type || 'edad';
        }
        return 'edad';
    }

    function agregarEstilosFiltros() {
        const styles = `
            <style>
                .filtro-grupo {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }
                .filtro-grupo label {
                    font-weight: 600;
                    color: #2c3e50;
                    font-size: 0.85rem;
                }
                .filtro-grupo input,
                .filtro-grupo select {
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 0.85rem;
                    min-width: 150px;
                }
                .chart-btn {
                    background: #f8f9fa;
                    border: 1px solid #e8f5e8;
                    padding: 8px 14px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .chart-btn:hover {
                    background: #e1f0e5;
                }
                .chart-btn.active {
                    background: linear-gradient(135deg, #2e7d32, #4caf50); 
                    color: #fff;
                    border-color: #2e7d32;
                }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    function generarFilasTablaEdad() {
        const { labels, values } = datosSimuladosEdad.edad;
        const total = values.reduce((a, b) => a + b, 0);
        
        const descripciones = {
            '0-17': 'Niños y adolescentes', '18-25': 'Jóvenes adultos',
            '26-35': 'Adultos jóvenes', '36-50': 'Adultos',
            '51-65': 'Adultos mayores', '66+': 'Tercera edad'
        };

        return labels.map((grupo, index) => {
            const cantidad = values[index];
            const porcentaje = total > 0 ? ((cantidad / total) * 100).toFixed(1) : 0;
            const descripcion = descripciones[grupo] || 'Grupo de edad';
            
            return `
                <tr>
                    <td style="font-weight: bold; text-align: center;">${index + 1}</td>
                    <td>
                        <span class="age-badge" style="background: ${coloresPorEdad[grupo]}; color: white;">
                            <i class="fas fa-user"></i>
                            ${grupo} años
                        </span>
                    </td>
                    <td>${grupo}</td>
                    <td style="text-align: center; font-weight: bold">${cantidad.toLocaleString()}</td>
                    <td style="text-align: center; font-weight: bold; color: #2e7d32">${porcentaje}%</td>
                    <td style="color: #7f8c8d; font-size: 0.9rem">${descripcion}</td>
                </tr>
            `;
        }).join('') + (total > 0 ? `
            <tr style="background: #f8f9fa; font-weight: bold;">
                <td colspan="3">TOTAL GENERAL</td>
                <td style="text-align: center">${total.toLocaleString()}</td>
                <td style="text-align: center">100%</td>
                <td></td>
            </tr>
        ` : '');
    }

    // Añade esta función en edad-system.js, cerca de las otras funciones de tablas
    function generarFilasTablaAgrupada(datosAgrupados, tipo) {
        // Verificar si tenemos datos en el formato correcto
        if (!datosAgrupados || !datosAgrupados.datasets || datosAgrupados.datasets.length === 0) {
            return `
                <tr>
                    <td colspan="${datosAgrupados.datasets ? datosAgrupados.datasets.length + 2 : 8}" 
                        style="text-align: center; color: #7f8c8d; padding: 20px;">
                        <i class="fas fa-exclamation-circle"></i> No hay datos disponibles
                    </td>
                </tr>
            `;
        }
        
        let html = '';
        const totalGeneral = datosAgrupados.total || 0;
        
        // Encabezado para tabla agrupada
        html += `
            <tr style="background: #f8f9fa; font-weight: bold;">
                <th style="min-width: 150px;">${getTituloTiempo(tipo).split(' ')[1]}</th>
                ${datosAgrupados.datasets.map(dataset => `<th>${dataset.label}</th>`).join('')}
                <th style="width: 120px;">Total por ${getTituloTiempo(tipo).split(' ')[1]}</th>
            </tr>
        `;
        
        // Filas de datos para cada fecha/mes/año
        datosAgrupados.labels.forEach((fecha, fechaIndex) => {
            // Calcular total para esta fecha
            const totalPorFecha = datosAgrupados.datasets.reduce((sum, dataset) => 
                sum + (dataset.data[fechaIndex] || 0), 0);
            
            html += `
                <tr>
                    <td><strong>${fecha}</strong></td>
                    ${datosAgrupados.datasets.map(dataset => 
                        `<td style="text-align: center; font-weight: ${dataset.data[fechaIndex] > 0 ? 'bold' : 'normal'}">
                            ${(dataset.data[fechaIndex] || 0).toLocaleString()}
                        </td>`
                    ).join('')}
                    <td style="text-align: center; background: #e8f5e9; font-weight: bold;">
                        ${totalPorFecha.toLocaleString()}
                    </td>
                </tr>
            `;
        });
        
        // Totales por rango de edad
        html += `
            <tr style="background: #f0f7ff; font-weight: bold;">
                <td><strong>Total por Rango</strong></td>
                ${datosAgrupados.datasets.map(dataset => {
                    const totalRango = dataset.data.reduce((sum, val) => sum + (val || 0), 0);
                    return `<td style="text-align: center; color: #2e7d32;">${totalRango.toLocaleString()}</td>`;
                }).join('')}
                <td style="text-align: center; background: #2e7d32; color: white;">
                    ${totalGeneral.toLocaleString()}
                </td>
            </tr>
        `;
        
        // Resumen estadístico
        html += `
            <tr style="background: #f8f9fa; font-size: 0.9em; color: #7f8c8d;">
                <td colspan="${datosAgrupados.datasets.length + 2}" style="text-align: center; padding: 10px;">
                    <i class="fas fa-info-circle"></i> Mostrando ${datosAgrupados.labels.length} 
                    ${tipo === 'fecha' ? 'fechas' : tipo === 'mes' ? 'meses' : 'años'} con datos
                </td>
            </tr>
        `;
        
        return html;
    }

    function mostrarGraficasEdad() {
        const { labels, values } = datosSimuladosEdad.edad;
        
        // Gráfica de barras
        const ctxBar = document.getElementById("chartBarEdad");
        if (chartBarEdad) chartBarEdad.destroy();
        
        chartBarEdad = new Chart(ctxBar, {
            type: "bar",
            data: {
                labels: labels.map(label => `${label} años`),
                datasets: [{
                    label: "Cantidad de Participantes",
                    data: values,
                    backgroundColor: labels.map(label => coloresPorEdad[label]),
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

        // Gráfica circular
        const ctxPie = document.getElementById("chartPieEdad");
        if (chartPieEdad) chartPieEdad.destroy();
        
        chartPieEdad = new Chart(ctxPie, {
            type: "doughnut",
            data: {
                labels: labels.map(label => `${label} años`),
                datasets: [{
                    data: values,
                    backgroundColor: labels.map(label => coloresPorEdad[label]),
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
                        labels: { usePointStyle: true, padding: 15 }
                    }
                },
                cutout: '60%'
            },
        });
    }

    

    function abrirModalEdad(tipoGrafica) {
        const modal = document.getElementById("chartModalEdad");
        if (!modal) {
            console.error('Modal no encontrado');
            return;
        }
        
        modal.classList.add("show");
        
        // Guardar tipo de gráfica
        const modalChartContainer = document.querySelector('.modal-chart-container');
        if (modalChartContainer) {
            modalChartContainer.setAttribute('data-tipo-grafica', tipoGrafica);
        }
        
        // Crear filtros
        crearFiltrosModalEdad();
        
        // Crear gráfica inicial
        crearGraficaAmpliadaEdad(tipoGrafica);
        llenarTablaModalEdad();
    }

    function crearGraficaAmpliadaEdad(tipoGrafica) {
        const ctx = document.getElementById("chartAmpliadoEdad");
        if (!ctx) return;

        // Destruir gráfica anterior si existe
        if (chartAmpliadoEdad) {
            chartAmpliadoEdad.destroy();
        }

        const { labels, values } = datosSimuladosEdad.edad;
        const colors = labels.map(label => coloresPorEdad[label] || '#95a5a6');
        const total = values.reduce((a, b) => a + b, 0);

        // Configurar según el tipo de gráfica
        const tipoChart = tipoGrafica === "bar" ? "bar" : "doughnut";

        chartAmpliadoEdad = new Chart(ctx, {
            type: tipoChart,
            data: {
                labels: labels.map(label => `${label} años`),
                datasets: [{
                    label: "Cantidad de Participantes",
                    data: values,
                    backgroundColor: colors,
                    borderColor: colors.map(color => darkenColor(color, 0.2)),
                    borderWidth: 2,
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
                        text: 'Distribución por Grupos de Edad - Vista Ampliada',
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
                                return `${label}: ${value} participantes (${percentage}%)`;
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
                            text: 'Cantidad de Participantes',
                            font: { weight: 'bold', size: 14 }
                        }
                    },
                    x: {
                        grid: { display: false },
                        title: {
                            display: true,
                            text: 'Grupos de Edad',
                            font: { weight: 'bold', size: 14 }
                        }
                    }
                } : {},
                cutout: tipoChart === "bar" ? '0%' : '50%'
            },
        });
    }

    function crearGraficaAmpliadaAgrupada(tipo, datos, chartType, ctx) {
        try {
            console.log(`🎨 Preparando gráfica AGRUPADA para ${tipo}:`, {
                labels: datos.labels, // Estos deben ser los años/fechas/meses
                datasetsCount: datos.datasets.length,
                primeraDataset: datos.datasets[0]
            });
            
            // Asegurar que todos los datasets tengan datos
            const datasetsProcesados = datos.datasets.map((dataset, index) => {
                const data = dataset.data.map(val => val || 0);
                const rango = dataset.label ? dataset.label.replace(' años', '') : '';
                const colorBase = dataset.backgroundColor || coloresPorEdad[rango] || 
                                coloresPorEdad[Object.keys(coloresPorEdad)[index % Object.keys(coloresPorEdad).length]];
                
                return {
                    label: dataset.label || `Rango ${index + 1}`,
                    data: data,
                    backgroundColor: colorBase,
                    borderColor: darkenColor(colorBase, 0.2),
                    borderWidth: 2,
                    borderRadius: 6,
                    barThickness: 25,
                    minBarLength: 2
                };
            });
            
            // Calcular totales para tooltips
            const totalesPorFecha = datos.labels.map((_, index) => {
                return datasetsProcesados.reduce((sum, dataset) => sum + (dataset.data[index] || 0), 0);
            });
            
            // Definir el título del eje X según el tipo
            let tituloEjeX = '';
            switch(tipo) {
                case 'fecha':
                    tituloEjeX = 'Fechas';
                    break;
                case 'mes':
                    tituloEjeX = 'Meses';
                    break;
                case 'anio':
                    tituloEjeX = 'Años';
                    break;
                default:
                    tituloEjeX = 'Período';
            }
            
            chartAmpliadoEdad = new Chart(ctx, {
                type: "bar",
                data: {
                    labels: datos.labels, // Esto debe ser: ['2020', '2021', '2022'] para año
                    datasets: datasetsProcesados
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
                            text: `${getTituloTiempo(tipo)} - Distribución por Edad`,
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
                                    const total = totalesPorFecha[context.dataIndex] || 0;
                                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                    return `${label}: ${value} visitantes (${percentage}%)`;
                                },
                                afterLabel: function(context) {
                                    const total = totalesPorFecha[context.dataIndex] || 0;
                                    return `Total: ${total} visitantes`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(0,0,0,0.1)' },
                            title: {
                                display: true,
                                text: 'Cantidad de Visitantes',
                                font: { weight: 'bold', size: 14 }
                            },
                            ticks: {
                                stepSize: 1,
                                callback: function(value) {
                                    return Math.round(value);
                                }
                            }
                        },
                        x: {
                            grid: { display: false },
                            title: {
                                display: true,
                                text: tituloEjeX, // Aquí se corrige
                                font: { weight: 'bold', size: 14 }
                            },
                            ticks: {
                                maxRotation: tipo === 'fecha' ? 45 : 0,
                                minRotation: 0
                            }
                        }
                    },
                    animation: {
                        duration: 1000,
                        easing: 'easeOutQuart'
                    }
                },
            });
            
            console.log(`✅ Gráfica AGRUPADA ampliada ${tipo} creada exitosamente con labels:`, datos.labels);
            
        } catch (error) {
            console.error(`❌ Error creando gráfica agrupada para ${tipo}:`, error);
            crearGraficaAmpliadaSimple(tipo, datos, 'bar', ctx);
        }
    }

    function crearGraficaAmpliadaSimple(tipo, datos, chartType, ctx) {
        try {
            // Calcular valores totales por fecha/mes/año
            const labels = datos.labels || [];
            let values = [];
            let total = 0;
            
            if (datos.datasets && datos.datasets.length > 0) {
                // Sumar todos los datasets
                values = labels.map((_, index) => {
                    return datos.datasets.reduce((sum, dataset) => {
                        return sum + (dataset.data[index] || 0);
                    }, 0);
                });
                total = datos.total || values.reduce((a, b) => a + b, 0);
            } else if (datos.values && datos.values.length > 0) {
                values = datos.values;
                total = datos.total || values.reduce((a, b) => a + b, 0);
            } else {
                values = labels.map(() => 0);
                total = 0;
            }
            
            // Generar colores
            const colors = generarColoresTiempo(tipo, labels.length);
            
            chartAmpliadoEdad = new Chart(ctx, {
                type: chartType,
                data: {
                    labels: labels,
                    datasets: [{
                        label: "Cantidad de Visitantes",
                        data: values,
                        backgroundColor: colors,
                        borderColor: colors.map(color => darkenColor(color, 0.2)),
                        borderWidth: 2,
                        borderRadius: chartType === "bar" ? 8 : 0,
                        barThickness: chartType === "bar" ? 35 : undefined,
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: chartType === "bar" ? 'top' : 'right',
                            labels: {
                                padding: 15,
                                usePointStyle: true,
                                font: { size: 12 }
                            }
                        },
                        title: {
                            display: true,
                            text: `${getTituloTiempo(tipo)} - Vista Ampliada`,
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
                                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                    return `${label}: ${value} visitantes (${percentage}%)`;
                                }
                            }
                        }
                    },
                    scales: chartType === "bar" ? {
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
                                text: getTituloTiempo(tipo).split(' ')[2] || 'Período',
                                font: { weight: 'bold', size: 14 }
                            }
                        }
                    } : {},
                    cutout: chartType === "bar" ? '0%' : '50%'
                },
            });
            
            console.log(`✅ Gráfica SIMPLE ampliada ${tipo} creada exitosamente`);
            
        } catch (error) {
            console.error(`❌ Error creando gráfica simple para ${tipo}:`, error);
        }
    }

    function llenarTablaModalEdad() {
        const tbody = document.getElementById("tbodyDatosEdad");
        if (!tbody) return;

        const { labels, values } = datosSimuladosEdad.edad;
        const total = values.reduce((a, b) => a + b, 0);

        const descripciones = {
            '0-17': 'Niños y adolescentes',
            '18-25': 'Jóvenes adultos', 
            '26-35': 'Adultos jóvenes',
            '36-50': 'Adultos',
            '51-65': 'Adultos mayores',
            '66+': 'Tercera edad'
        };

        tbody.innerHTML = labels.map((grupo, index) => {
            const cantidad = values[index];
            const porcentaje = total > 0 ? ((cantidad / total) * 100).toFixed(1) : 0;
            const descripcion = descripciones[grupo] || 'Grupo de edad';
            
            return `
                <tr>
                    <td>
                        <span class="age-badge" style="background: ${coloresPorEdad[grupo]}; color: white; padding: 4px 8px; border-radius: 12px;">
                            <i class="fas fa-user"></i> ${grupo} años
                        </span>
                    </td>
                    <td>${grupo}</td>
                    <td style="text-align: center; font-weight: bold">${cantidad.toLocaleString()}</td>
                    <td style="text-align: center; color: #2e7d32; font-weight: bold">${porcentaje}%</td>
                    <td style="color: #7f8c8d">${descripcion}</td>
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

    function cerrarModalEdad() {
        const modal = document.getElementById("chartModalEdad");
        if (modal) {
            modal.classList.remove("show");
        }
    }

    function descargarPNGModalEdad() {
        const canvas = document.getElementById("chartAmpliadoEdad");
        if (canvas) {
            const link = document.createElement("a");
            link.download = "grafica_edad_ampliada.png";
            link.href = canvas.toDataURL("image/png");
            link.click();
        }
    }

    function descargarExcelModalEdad() {
        const { labels, values } = datosSimuladosEdad.edad;
        const total = values.reduce((a, b) => a + b, 0);
        
        const datosExcel = [
            ['Grupo de Edad', 'Rango', 'Total Visitantes', 'Porcentaje'],
            ...labels.map((label, i) => {
                const porcentaje = total > 0 ? ((values[i] / total) * 100).toFixed(1) : 0;
                return [`${label} años`, label, values[i], `${porcentaje}%`];
            }),
            ['TOTAL', '', total, '100%']
        ];

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(datosExcel);
        XLSX.utils.book_append_sheet(wb, ws, "Datos por Edad");
        XLSX.writeFile(wb, "reporte_edad_detallado.xlsx");
    }

   

    function crearFiltrosModalEdad() {
        const modalHeader = document.querySelector('.modal-header');
        if (!modalHeader) return;
        
        // Eliminar filtros anteriores si existen
        const filtrosAnteriores = document.getElementById('filtrosModalEdad');
        if (filtrosAnteriores) {
            filtrosAnteriores.remove();
        }
        
        const ahora = new Date();
        const haceUnMes = new Date();
        haceUnMes.setMonth(ahora.getMonth() - 1);
        
        const formatoFecha = (fecha) => fecha.toISOString().split('T')[0];
        
        const filtrosHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 12px;">
                <div class="filter-group">
                    <label class="filter-label"><i class="fas fa-calendar-alt"></i> Fecha Inicial</label>
                    <input type="date" class="filter-select" id="modal-filtro-fecha-inicio-edad" value="${formatoFecha(haceUnMes)}">
                </div>
                <div class="filter-group">
                    <label class="filter-label"><i class="fas fa-calendar-alt"></i> Fecha Final</label>
                    <input type="date" class="filter-select" id="modal-filtro-fecha-fin-edad" value="${formatoFecha(ahora)}">
                </div>
                <div class="filter-group">
                    <label class="filter-label"><i class="fas fa-user"></i> Rango de Edad</label>
                    <select class="filter-select" id="modal-filtro-rango-edad">
                        <option value="todos">Todos los rangos</option>
                        <option value="0-17">0-17 años</option>
                        <option value="18-25">18-25 años</option>
                        <option value="26-35">26-35 años</option>
                        <option value="36-50">36-50 años</option>
                        <option value="51-65">51-65 años</option>
                        <option value="66+">66+ años</option>
                    </select>
                </div>
            </div>
            <div style="margin-top: 15px; display: flex; gap: 10px;">
                <button class="btn btn-primary" id="aplicar-filtros-modal-edad-btn">
                    <i class="fas fa-check"></i> Aplicar Filtros
                </button>
                <button class="btn btn-danger" id="limpiar-filtros-modal-edad-btn">
                    <i class="fas fa-times"></i> Limpiar Filtros
                </button>
            </div>
        `;

        const filtrosContainer = document.createElement('div');
        filtrosContainer.id = 'filtrosModalEdad';
        filtrosContainer.style.cssText = `
            margin-bottom: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #e9ecef;
        `;
        
        filtrosContainer.innerHTML = `
            <h4 style="margin: 0 0 12px 0; display: flex; align-items: center; gap: 6px">
                <i class="fas fa-filter"></i> Filtros por Fecha y Edad
            </h4>
            ${filtrosHTML}
        `;

        // Insertar después del modal-header
        modalHeader.parentNode.insertBefore(filtrosContainer, modalHeader.nextSibling);
        
        // Configurar eventos
        setTimeout(() => {
            const btnAplicar = document.getElementById('aplicar-filtros-modal-edad-btn');
            const btnLimpiar = document.getElementById('limpiar-filtros-modal-edad-btn');
            
            if (btnAplicar) {
                btnAplicar.addEventListener('click', aplicarFiltrosModalEdad);
            }
            
            if (btnLimpiar) {
                btnLimpiar.addEventListener('click', limpiarFiltrosModalEdad);
            }
        }, 100);
    }

    async function aplicarFiltrosModalEdad() {
        const fechaInicio = document.getElementById('modal-filtro-fecha-inicio-edad')?.value;
        const fechaFin = document.getElementById('modal-filtro-fecha-fin-edad')?.value;
        const rangoEdad = document.getElementById('modal-filtro-rango-edad')?.value;
        
        console.log('🎯 Aplicando filtros edad:', { fechaInicio, fechaFin, rangoEdad });
        
        // Validaciones
        if (!fechaInicio || !fechaFin) {
            mostrarMensajeNoHayDatos('Por favor selecciona ambas fechas');
            return;
        }
        
        if (fechaInicio > fechaFin) {
            mostrarMensajeNoHayDatos('La fecha inicial no puede ser mayor que la fecha final');
            return;
        }

        try {
            mostrarLoadingEdad('Aplicando filtros...');

            let query = supabase
                .from('participantes_reserva')
                .select(`
                    fecha_nacimiento,
                    fecha_visita,
                    id_genero,
                    nombre,
                    apellido,
                    genero!inner(genero)
                `)
                .not('fecha_nacimiento', 'is', null)
                .gte('fecha_visita', fechaInicio + 'T00:00:00')
                .lte('fecha_visita', fechaFin + 'T23:59:59');

            const { data: participantesFiltrados, error } = await query;

            if (error) throw error;

            let participantesProcesados = participantesFiltrados;

            // Aplicar filtro de rango de edad si no es "todos"
            if (rangoEdad !== 'todos') {
                participantesProcesados = participantesFiltrados.filter(participante => {
                    const edad = calcularEdad(participante.fecha_nacimiento);
                    if (edad === null) return false;
                    
                    const categoria = clasificarEdad(edad);
                    return categoria === rangoEdad;
                });
            }

            if (participantesProcesados && participantesProcesados.length > 0) {
                // Procesar datos filtrados
                procesarDatosEdades(participantesProcesados);
                
                // Actualizar gráfica del modal
                const tipoGrafica = document.querySelector('.modal-chart-container')?.getAttribute('data-tipo-grafica') || 'bar';
                actualizarGraficaModalConFiltros(tipoGrafica, { fechaInicio, fechaFin, rangoEdad });
                
                mostrarExitoEdad(`Filtros aplicados: ${participantesProcesados.length} participantes encontrados`);
            } else {
                mostrarMensajeNoHayDatos(rangoEdad);
            }

            cerrarLoadingEdad();
            
        } catch (error) {
            console.error('Error aplicando filtros:', error);
            cerrarLoadingEdad();
            mostrarErrorEdad('Error al aplicar los filtros: ' + error.message);
        }
    }

    function limpiarFiltrosModalEdad() {
        // Limpiar inputs
        const fechaInicio = document.getElementById('modal-filtro-fecha-inicio-edad');
        const fechaFin = document.getElementById('modal-filtro-fecha-fin-edad');
        const rangoEdad = document.getElementById('modal-filtro-rango-edad');
        
        if (fechaInicio) fechaInicio.value = '';
        if (fechaFin) fechaFin.value = '';
        if (rangoEdad) rangoEdad.value = 'todos';
        
        // Recargar datos originales
        if (window.EdadSystem && window.EdadSystem.cargarDatos) {
            window.EdadSystem.cargarDatos();
        }
        
        mostrarExitoEdad('Filtros limpiados - Mostrando todos los datos');
    }

    

    function abrirModalTiempo(tipo, tipoGrafica) {
        const modal = document.getElementById("chartModalEdad");
        if (!modal) {
            console.error('Modal no encontrado');
            return;
        }
        
        modal.classList.add("show");
        
        // Guardar tipo de gráfica y datos
        const modalChartContainer = document.querySelector('.modal-chart-container');
        if (modalChartContainer) {
            modalChartContainer.setAttribute('data-tipo-grafica', tipoGrafica);
            modalChartContainer.setAttribute('data-tipo-datos', tipo);
        }
        
        // Crear filtros específicos para tiempo
        crearFiltrosModalTiempo(tipo);
        
        // Crear gráfica inicial CON LOS PARÁMETROS CORRECTOS
        console.log(`📊 Creando gráfica ampliada para ${tipo} - ${tipoGrafica}`);
        crearGraficaAmpliadaTiempo(tipo, tipoGrafica);
        llenarTablaModalTiempo(tipo);
    }

    function crearFiltrosModalTiempo(tipo) {
        const modalHeader = document.querySelector('.modal-header');
        if (!modalHeader) return;
        
        // Eliminar filtros anteriores
        const filtrosAnteriores = document.getElementById('filtrosModalEdad');
        if (filtrosAnteriores) {
            filtrosAnteriores.remove();
        }
        
        const ahora = new Date();
        let fechaInicioDefault, fechaFinDefault;
        
        switch(tipo) {
            case 'fecha':
                // Últimos 30 días para fecha
                fechaInicioDefault = new Date(ahora);
                fechaInicioDefault.setDate(ahora.getDate() - 30);
                fechaFinDefault = ahora;
                break;
            case 'mes':
                // Últimos 6 meses para mes
                fechaInicioDefault = new Date(ahora);
                fechaInicioDefault.setMonth(ahora.getMonth() - 6);
                fechaFinDefault = ahora;
                break;
            case 'anio':
                // Últimos 3 años para año
                fechaInicioDefault = new Date(ahora);
                fechaInicioDefault.setFullYear(ahora.getFullYear() - 3);
                fechaFinDefault = ahora;
                break;
        }
        
        const formatoFecha = (fecha) => fecha.toISOString().split('T')[0];
        
        const filtrosHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 12px;">
                <div class="filter-group">
                    <label class="filter-label"><i class="fas fa-calendar-alt"></i> Fecha Inicial</label>
                    <input type="date" class="filter-select" id="modal-filtro-fecha-inicio-tiempo" value="${formatoFecha(fechaInicioDefault)}">
                </div>
                <div class="filter-group">
                    <label class="filter-label"><i class="fas fa-calendar-alt"></i> Fecha Final</label>
                    <input type="date" class="filter-select" id="modal-filtro-fecha-fin-tiempo" value="${formatoFecha(fechaFinDefault)}">
                </div>
                <div class="filter-group">
                    <label class="filter-label"><i class="fas fa-user"></i> Rango de Edad</label>
                    <select class="filter-select" id="modal-filtro-rango-edad-tiempo">
                        <option value="todos">Todos los rangos</option>
                        <option value="0-17">0-17 años</option>
                        <option value="18-25">18-25 años</option>
                        <option value="26-35">26-35 años</option>
                        <option value="36-50">36-50 años</option>
                        <option value="51-65">51-65 años</option>
                        <option value="66+">66+ años</option>
                    </select>
                </div>
            </div>
            <div style="margin-top: 15px; display: flex; gap: 10px;">
                <button class="btn btn-primary" id="aplicar-filtros-modal-tiempo-btn">
                    <i class="fas fa-check"></i> Aplicar Filtros
                </button>
                <button class="btn btn-danger" id="limpiar-filtros-modal-tiempo-btn">
                    <i class="fas fa-times"></i> Limpiar Filtros
                </button>
            </div>
        `;

        const filtrosContainer = document.createElement('div');
        filtrosContainer.id = 'filtrosModalEdad';
        filtrosContainer.style.cssText = `
            margin-bottom: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #e9ecef;
        `;
        
        filtrosContainer.innerHTML = `
            <h4 style="margin: 0 0 12px 0; display: flex; align-items: center; gap: 6px">
                <i class="fas fa-filter"></i> Filtros Avanzados - ${getTituloTiempo(tipo)}
            </h4>
            ${filtrosHTML}
        `;

        modalHeader.parentNode.insertBefore(filtrosContainer, modalHeader.nextSibling);
        
        // Configurar eventos
        setTimeout(() => {
            const btnAplicar = document.getElementById('aplicar-filtros-modal-tiempo-btn');
            const btnLimpiar = document.getElementById('limpiar-filtros-modal-tiempo-btn');
            
            if (btnAplicar) {
                btnAplicar.addEventListener('click', () => {
                    aplicarFiltrosModalTiempoCompleto(tipo);
                });
            }
            
            if (btnLimpiar) {
                btnLimpiar.addEventListener('click', () => {
                    limpiarFiltrosModalTiempoCompleto(tipo);
                });
            }
        }, 100);
    }

    async function aplicarFiltrosModalTiempoCompleto(tipo) {
        const fechaInicio = document.getElementById('modal-filtro-fecha-inicio-tiempo')?.value;
        const fechaFin = document.getElementById('modal-filtro-fecha-fin-tiempo')?.value;
        const rangoEdad = document.getElementById('modal-filtro-rango-edad-tiempo')?.value;
        
        console.log('🎯 Aplicando filtros tiempo completo:', { fechaInicio, fechaFin, rangoEdad, tipo });
        
        if (!fechaInicio || !fechaFin) {
            mostrarMensajeNoHayDatos('Por favor selecciona ambas fechas');
            return;
        }
        
        if (fechaInicio > fechaFin) {
            mostrarMensajeNoHayDatos('La fecha inicial no puede ser mayor que la fecha final');
            return;
        }

        try {
            mostrarLoadingEdad('Aplicando filtros...');

            let query = supabase
                .from('participantes_reserva')
                .select('fecha_visita, fecha_nacimiento')
                .not('fecha_visita', 'is', null)
                .gte('fecha_visita', fechaInicio + 'T00:00:00')
                .lte('fecha_visita', fechaFin + 'T23:59:59');

            // Solo incluir fecha nacimiento si se filtra por edad
            if (rangoEdad !== 'todos') {
                query = query.not('fecha_nacimiento', 'is', null);
            }

            const { data: participantesFiltrados, error } = await query;

            if (error) throw error;

            if (participantesFiltrados && participantesFiltrados.length > 0) {
                // Procesar datos según tipo y rango de edad - USAR LA NUEVA FUNCIÓN
                const datosFiltrados = procesarDatosTiempoConEdad(participantesFiltrados, tipo, rangoEdad);
                
                // Obtener el tipo de gráfica actual del modal
                const modalChartContainer = document.querySelector('.modal-chart-container');
                const tipoGrafica = modalChartContainer?.getAttribute('data-tipo-grafica') || 'bar';
                
                // Actualizar la gráfica del modal con los datos filtrados AGRUPADOS
                actualizarGraficaModalConDatosAgrupados(tipo, datosFiltrados, tipoGrafica, { 
                    fechaInicio, 
                    fechaFin, 
                    rangoEdad 
                });
                
                mostrarExitoEdad(`Filtros aplicados: ${participantesFiltrados.length} visitas encontradas`);
            } else {
                mostrarMensajeNoHayDatos(rangoEdad);
            }

            cerrarLoadingEdad();
            
        } catch (error) {
            console.error('Error aplicando filtros tiempo:', error);
            cerrarLoadingEdad();
            mostrarErrorEdad('Error al aplicar los filtros: ' + error.message);
        }
    }

    function procesarDatosTiempoConEdad(participantes, tipo, rangoEdad) {
        console.log(`🔄 Procesando datos AGRUPADOS con filtros: ${tipo}, Rango: ${rangoEdad}`);
        
        const datosPorTiempo = {};
        const rangosEdad = ['0-17', '18-25', '26-35', '36-50', '51-65', '66+'];
        const fechasSet = new Set();
        
        // Determinar qué rangos incluir
        let rangosAIncluir = [];
        if (rangoEdad === 'todos') {
            // Incluir todos los rangos
            rangosAIncluir = rangosEdad;
        } else {
            // Solo el rango específico seleccionado
            rangosAIncluir = [rangoEdad];
        }
        
        // Inicializar estructura para cada rango a incluir
        rangosAIncluir.forEach(rango => {
            datosPorTiempo[rango] = {};
        });
        
        // Procesar cada participante
        participantes.forEach(participante => {
            if (participante.fecha_visita && participante.fecha_nacimiento) {
                const fecha = new Date(participante.fecha_visita);
                const edad = calcularEdad(participante.fecha_nacimiento);
                
                if (edad !== null) {
                    const rango = clasificarEdad(edad);
                    let claveFecha = '';
                    
                    // Determinar clave según tipo
                    switch(tipo) {
                        case 'fecha':
                            claveFecha = fecha.toISOString().split('T')[0];
                            break;
                        case 'mes':
                            const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                            claveFecha = `${meses[fecha.getMonth()]} ${fecha.getFullYear()}`;
                            break;
                        case 'anio':
                            claveFecha = fecha.getFullYear().toString();
                            break;
                    }
                    
                    // Solo procesar si el rango está en los rangos a incluir
                    if (rangosAIncluir.includes(rango)) {
                        fechasSet.add(claveFecha);
                        
                        // Contar en el rango correspondiente
                        if (datosPorTiempo[rango][claveFecha]) {
                            datosPorTiempo[rango][claveFecha]++;
                        } else {
                            datosPorTiempo[rango][claveFecha] = 1;
                        }
                    }
                }
            }
        });
        
        // Ordenar fechas
        const fechasOrdenadas = Array.from(fechasSet).sort((a, b) => {
            switch(tipo) {
                case 'fecha': return new Date(a) - new Date(b);
                case 'mes': return ordenarMeses(a, b);
                case 'anio': return parseInt(a) - parseInt(b);
                default: return 0;
            }
        });
        
        // Limitar a las últimas fechas si son muchas
        let fechasMostrar = fechasOrdenadas;
        if (tipo === 'fecha' && fechasOrdenadas.length > 10) {
            fechasMostrar = fechasOrdenadas.slice(-10);
        } else if (tipo === 'mes' && fechasOrdenadas.length > 12) {
            fechasMostrar = fechasOrdenadas.slice(-12);
        }
        
        // Preparar datasets para Chart.js (BARRAS AGRUPADAS)
        const datasets = rangosAIncluir.map((rango, index) => {
            const datosRango = datosPorTiempo[rango] || {};
            const data = fechasMostrar.map(fecha => datosRango[fecha] || 0);
            
            // Verificar si este rango tiene datos
            const totalRango = data.reduce((sum, val) => sum + val, 0);
            
            if (totalRango > 0 || rangoEdad !== 'todos') {
                return {
                    label: `${rango} años`,
                    data: data,
                    backgroundColor: coloresPorEdad[rango],
                    borderColor: darkenColor(coloresPorEdad[rango], 0.2),
                    borderWidth: 1,
                    borderRadius: 6,
                    barThickness: rangoEdad === 'todos' ? 15 : 35, // Más ancho si solo hay un rango
                    hidden: false
                };
            } else {
                return null; // No incluir rangos sin datos
            }
        }).filter(dataset => dataset !== null); // Filtrar rangos sin datos
        
        // Si no hay datasets (todos los rangos estaban vacíos)
        if (datasets.length === 0) {
            datasets.push({
                label: rangoEdad === 'todos' ? 'Sin datos' : `${rangoEdad} años`,
                data: fechasMostrar.map(() => 0),
                backgroundColor: rangoEdad === 'todos' ? '#95a5a6' : coloresPorEdad[rangoEdad],
                borderWidth: 1,
                borderRadius: 6,
                barThickness: 35
            });
        }
        
        // Calcular total general
        const totalGeneral = datasets.reduce((total, dataset) => 
            total + dataset.data.reduce((sum, val) => sum + val, 0), 0);
        
        // Estructura de datos final (FORMATO AGRUPADO)
        const datosFiltrados = {
            labels: fechasMostrar,
            datasets: datasets,
            rangosEdad: datasets.map(d => d.label.replace(' años', '')),
            fechas: fechasMostrar,
            total: totalGeneral,
            filtrosAplicados: {
                rangoEdad: rangoEdad,
                participantesAnalizados: participantes.length
            }
        };
        
        console.log(`✅ Datos AGRUPADOS filtrados de ${tipo} procesados:`, datosFiltrados);
        
        // Guardar datos según el tipo para uso en el modal
        switch(tipo) {
            case 'fecha': 
                datosFechaAgrupados = datosFiltrados;
                break;
            case 'mes': 
                datosMesAgrupados = datosFiltrados;
                break;
            case 'anio': 
                datosAnioAgrupados = datosFiltrados;
                break;
        }
        
        return datosFiltrados;
    }

    function actualizarGraficaModalTiempoConFiltros(tipo, datos, filtros) {
        const canvas = document.getElementById("chartAmpliadoEdad");
        if (!canvas) return;
        
        const ctx = canvas.getContext("2d");
        
        // Destruir gráfica anterior si existe
        if (chartAmpliadoEdad) {
            chartAmpliadoEdad.destroy();
        }

        const colors = generarColoresTiempo(tipo, datos.labels.length);
        const total = datos.total;

        // Generar título con información de filtros
        let titulo = getTituloTiempo(tipo);
        if (filtros.fechaInicio && filtros.fechaFin) {
            titulo += ` (${formatearFecha(filtros.fechaInicio)} - ${formatearFecha(filtros.fechaFin)})`;
        }
        if (filtros.rangoEdad && filtros.rangoEdad !== 'todos') {
            titulo += ` - ${filtros.rangoEdad} años`;
        }

        // Actualizar título del modal
        const modalTitle = document.getElementById("modalTitleEdad");
        if (modalTitle) {
            modalTitle.innerHTML = `<i class="fas fa-expand"></i> ${titulo} - Vista Ampliada`;
        }

        const tipoGrafica = document.querySelector('.modal-chart-container')?.getAttribute('data-tipo-grafica') || 'bar';
        const chartType = tipoGrafica === "bar" ? "bar" : "doughnut";

        chartAmpliadoEdad = new Chart(ctx, {
            type: chartType,
            data: {
                labels: datos.labels,
                datasets: [{
                    label: filtros.rangoEdad === 'todos' ? "Cantidad de Visitantes" : `Visitantes ${filtros.rangoEdad} años`,
                    data: datos.values,
                    backgroundColor: colors,
                    borderColor: colors.map(color => darkenColor(color, 0.2)),
                    borderWidth: 2,
                    borderRadius: chartType === "bar" ? 8 : 0,
                    barThickness: chartType === "bar" ? 35 : undefined,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: chartType === "bar" ? 'top' : 'right',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            font: { size: 12 }
                        }
                    },
                    title: {
                        display: true,
                        text: titulo,
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
                scales: chartType === "bar" ? {
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
                            text: getTituloTiempo(tipo).split(' ')[2] || 'Período',
                            font: { weight: 'bold', size: 14 }
                        }
                    }
                } : {},
                cutout: chartType === "bar" ? '0%' : '50%'
            },
        });

        // Actualizar tabla
        const tbody = document.getElementById("tbodyDatosEdad");
        if (tbody) {
            tbody.innerHTML = datos.labels.map((label, index) => {
                const valor = datos.values[index];
                const porcentaje = total > 0 ? ((valor / total) * 100).toFixed(1) : 0;
                
                return `
                    <tr>
                        <td><strong>${label}</strong></td>
                        <td>${getDescripcionTiempo(tipo, label)}</td>
                        <td style="text-align: center; font-weight: bold">${valor.toLocaleString()}</td>
                        <td style="text-align: center; color: #2e7d32; font-weight: bold">${porcentaje}%</td>
                        <td style="text-align: center;">
                            <span style="color: #3498db;">
                                <i class="fas fa-filter"></i> Filtrado
                            </span>
                        </td>
                    </tr>
                `;
            }).join('') + (total > 0 ? `
                <tr style="background: #f8f9fa; font-weight: bold;">
                    <td colspan="2">TOTAL GENERAL</td>
                    <td style="text-align: center">${total.toLocaleString()}</td>
                    <td style="text-align: center">100%</td>
                    <td style="text-align: center;">-</td>
                </tr>
            ` : '');
        }
    }

    function limpiarFiltrosModalTiempoCompleto(tipo) {
        // Limpiar inputs
        const fechaInicio = document.getElementById('modal-filtro-fecha-inicio-tiempo');
        const fechaFin = document.getElementById('modal-filtro-fecha-fin-tiempo');
        const rangoEdad = document.getElementById('modal-filtro-rango-edad-tiempo');
        
        if (fechaInicio) fechaInicio.value = '';
        if (fechaFin) fechaFin.value = '';
        if (rangoEdad) rangoEdad.value = 'todos';
        
        // Recargar datos originales
        cargarDatosTiempo(tipo);
        
        mostrarExitoEdad('Filtros limpiados - Mostrando todos los datos');
    }

    function actualizarGraficaModalConFiltros(tipoGrafica, filtros) {
        const canvas = document.getElementById("chartAmpliadoEdad");
        if (!canvas) return;
        
        const ctx = canvas.getContext("2d");
        
        // Destruir gráfica anterior si existe
        if (chartAmpliadoEdad) {
            chartAmpliadoEdad.destroy();
        }

        const { labels, values } = datosSimuladosEdad.edad;
        const colors = labels.map(label => coloresPorEdad[label] || '#95a5a6');
        const total = values.reduce((a, b) => a + b, 0);

        // Generar título con información de filtros
        let titulo = 'Distribución por Edad';
        if (filtros.fechaInicio && filtros.fechaFin) {
            titulo += ` (${formatearFecha(filtros.fechaInicio)} - ${formatearFecha(filtros.fechaFin)})`;
        }
        if (filtros.rangoEdad && filtros.rangoEdad !== 'todos') {
            titulo += ` - ${filtros.rangoEdad} años`;
        }

        // Actualizar título del modal
        const modalTitle = document.getElementById("modalTitleEdad");
        if (modalTitle) {
            modalTitle.innerHTML = `<i class="fas fa-expand"></i> ${titulo} - Vista Ampliada`;
        }

        const tipoChart = tipoGrafica === "bar" ? "bar" : "doughnut";

        chartAmpliadoEdad = new Chart(ctx, {
            type: tipoChart,
            data: {
                labels: labels.map(label => `${label} años`),
                datasets: [{
                    label: "Cantidad de Participantes",
                    data: values,
                    backgroundColor: colors,
                    borderColor: colors.map(color => darkenColor(color, 0.2)),
                    borderWidth: 2,
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
                        text: titulo,
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
                                return `${label}: ${value} participantes (${percentage}%)`;
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
                            text: 'Cantidad de Participantes',
                            font: { weight: 'bold', size: 14 }
                        }
                    },
                    x: {
                        grid: { display: false },
                        title: {
                            display: true,
                            text: 'Grupos de Edad',
                            font: { weight: 'bold', size: 14 }
                        }
                    }
                } : {},
                cutout: tipoChart === "bar" ? '0%' : '50%'
            },
        });

        // Actualizar tabla
        llenarTablaModalEdad();
    }

    function actualizarGraficaModalConDatosAgrupados(tipo, datosFiltrados, tipoGrafica, filtros) {
        const canvas = document.getElementById("chartAmpliadoEdad");
        if (!canvas) return;
        
        const ctx = canvas.getContext("2d");
        
        // Destruir gráfica anterior si existe
        if (chartAmpliadoEdad) {
            chartAmpliadoEdad.destroy();
            chartAmpliadoEdad = null;
        }

        // Generar título con información de filtros
        let titulo = getTituloTiempo(tipo);
        if (filtros.fechaInicio && filtros.fechaFin) {
            titulo += ` (${formatearFecha(filtros.fechaInicio)} - ${formatearFecha(filtros.fechaFin)})`;
        }
        if (filtros.rangoEdad && filtros.rangoEdad !== 'todos') {
            titulo += ` - ${filtros.rangoEdad} años`;
        }

        // Actualizar título del modal
        const modalTitle = document.getElementById("modalTitleEdad");
        if (modalTitle) {
            modalTitle.innerHTML = `<i class="fas fa-expand"></i> ${titulo} - Vista Ampliada`;
        }

        // Definir el título del eje X según el tipo
        let tituloEjeX = '';
        switch(tipo) {
            case 'fecha':
                tituloEjeX = 'Fechas';
                break;
            case 'mes':
                tituloEjeX = 'Meses';
                break;
            case 'anio':
                tituloEjeX = 'Años';
                break;
            default:
                tituloEjeX = 'Período';
        }

        // Si tenemos datos en formato AGRUPADO (con datasets)
        if (datosFiltrados.datasets && datosFiltrados.datasets.length > 0) {
            console.log(`📊 Creando gráfica AGRUPADA para modal ${tipo} con ${datosFiltrados.datasets.length} datasets`);
            console.log(`📊 Labels para eje X (${tipo}):`, datosFiltrados.labels);
            
            // Si es gráfica circular, crear gráfica simple con totales
            if (tipoGrafica === "pie" || tipoGrafica === "doughnut") {
                crearGraficaCircularModal(tipo, datosFiltrados, titulo);
            } else {
                // Crear gráfica de barras AGRUPADAS
                chartAmpliadoEdad = new Chart(ctx, {
                    type: "bar",
                    data: {
                        labels: datosFiltrados.labels || [], // Aquí deben ir los años
                        datasets: datosFiltrados.datasets.map((dataset, index) => {
                            const rango = dataset.label ? dataset.label.replace(' años', '') : '';
                            const colorBase = dataset.backgroundColor || coloresPorEdad[rango] || 
                                            coloresPorEdad[Object.keys(coloresPorEdad)[index % Object.keys(coloresPorEdad).length]];
                            
                            return {
                                label: dataset.label || `Rango ${index + 1}`,
                                data: dataset.data.map(val => val || 0),
                                backgroundColor: colorBase,
                                borderColor: darkenColor(colorBase, 0.2),
                                borderWidth: 2,
                                borderRadius: 6,
                                barThickness: 25,
                                minBarLength: 2
                            };
                        })
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
                                text: titulo,
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
                                        const total = datosFiltrados.total || 0;
                                        const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                        return `${label}: ${value} visitantes (${percentage}%)`;
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: { color: 'rgba(0,0,0,0.1)' },
                                title: {
                                    display: true,
                                    text: 'Cantidad de Visitantes',
                                    font: { weight: 'bold', size: 14 }
                                },
                                ticks: {
                                    stepSize: 1,
                                    callback: function(value) {
                                        return Math.round(value);
                                    }
                                }
                            },
                            x: {
                                grid: { display: false },
                                title: {
                                    display: true,
                                    text: tituloEjeX, // CORREGIDO: Usar el título correcto
                                    font: { weight: 'bold', size: 14 }
                                },
                                ticks: {
                                    maxRotation: tipo === 'fecha' ? 45 : 0,
                                    minRotation: 0
                                }
                            }
                        },
                        animation: {
                            duration: 1000,
                            easing: 'easeOutQuart'
                        }
                    }
                });
            }
        } else {
            // Si no hay datasets, crear gráfica simple
            console.warn(`⚠️ No hay datasets para gráfica agrupada de ${tipo}, creando gráfica simple`);
            
            const colors = generarColoresTiempo(tipo, datosFiltrados.labels?.length || 0);
            const total = datosFiltrados.total || 0;

            chartAmpliadoEdad = new Chart(ctx, {
                type: tipoGrafica === "bar" ? "bar" : "doughnut",
                data: {
                    labels: datosFiltrados.labels || [],
                    datasets: [{
                        label: filtros.rangoEdad === 'todos' ? "Cantidad de Visitantes" : `Visitantes ${filtros.rangoEdad} años`,
                        data: datosFiltrados.values || [],
                        backgroundColor: colors,
                        borderColor: colors.map(color => darkenColor(color, 0.2)),
                        borderWidth: 2,
                        borderRadius: tipoGrafica === "bar" ? 8 : 0,
                        barThickness: tipoGrafica === "bar" ? 35 : undefined,
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: tipoGrafica === "bar" ? 'top' : 'right',
                            labels: {
                                padding: 15,
                                usePointStyle: true,
                                font: { size: 12 }
                            }
                        },
                        title: {
                            display: true,
                            text: titulo,
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
                                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                    return `${label}: ${value} visitantes (${percentage}%)`;
                                }
                            }
                        }
                    },
                    scales: tipoGrafica === "bar" ? {
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
                                text: tituloEjeX, // CORREGIDO: Usar el título correcto
                                font: { weight: 'bold', size: 14 }
                            }
                        }
                    } : {},
                    cutout: tipoGrafica === "bar" ? '0%' : '50%'
                },
            });
        }

        // Actualizar tabla del modal
        actualizarTablaModalConDatosAgrupados(tipo, datosFiltrados, filtros);
    }

function crearGraficaCircularModal(tipo, datosFiltrados, titulo) {
    const canvas = document.getElementById("chartAmpliadoEdad");
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    
    // Destruir gráfica anterior si existe
    if (chartAmpliadoEdad) {
        chartAmpliadoEdad.destroy();
        chartAmpliadoEdad = null;
    }
    
    // Calcular totales por rango de edad para la gráfica circular
    const totalesPorRango = {};
    if (datosFiltrados.datasets && datosFiltrados.datasets.length > 0) {
        datosFiltrados.datasets.forEach(dataset => {
            const total = (dataset.data || []).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
            if (total > 0 && dataset.label) {
                totalesPorRango[dataset.label] = total;
            }
        });
    }
    
    // Si no hay datos, crear gráfica vacía
    if (Object.keys(totalesPorRango).length === 0) {
        chartAmpliadoEdad = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ['Sin datos'],
                datasets: [{
                    data: [100],
                    backgroundColor: ['#f8f9fa'],
                    borderColor: '#dee2e6',
                    borderWidth: 2
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: 'No hay datos disponibles',
                        font: { size: 14, weight: 'bold' },
                        color: '#95a5a6'
                    },
                    tooltip: { enabled: false }
                },
                cutout: '60%'
            },
        });
        return;
    }
    
    // Crear gráfica con datos
    const labels = Object.keys(totalesPorRango);
    const data = Object.values(totalesPorRango);
    const totalGeneral = data.reduce((a, b) => a + b, 0);
    
    try {
        chartAmpliadoEdad = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: labels.map(label => {
                        const rango = label.replace(' años', '');
                        return coloresPorEdad[rango] || generarColorAleatorio();
                    }),
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
                    },
                    title: {
                        display: true,
                        text: titulo,
                        font: { size: 18, weight: 'bold' }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const percentage = totalGeneral > 0 ? ((value / totalGeneral) * 100).toFixed(1) : 0;
                                return `${label}: ${value} visitantes (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '60%'
            },
        });
        
        console.log(`✅ Gráfica circular para modal ${tipo} creada exitosamente`);
        
    } catch (error) {
        console.error(`❌ Error creando gráfica circular para ${tipo}:`, error);
    }
}

    function actualizarTablaModalConDatosAgrupados(tipo, datosFiltrados, filtros) {
        const tbody = document.getElementById("tbodyDatosEdad");
        if (!tbody) return;

        // Calcular valores totales por fecha/mes/año
        let labels = datosFiltrados.labels || [];
        let values = [];
        let total = 0;
        
        if (datosFiltrados.datasets && datosFiltrados.datasets.length > 0) {
            // Sumar todos los datasets
            values = labels.map((_, index) => {
                return datosFiltrados.datasets.reduce((sum, dataset) => {
                    return sum + (dataset.data[index] || 0);
                }, 0);
            });
            total = datosFiltrados.total || values.reduce((a, b) => a + b, 0);
        } else if (datosFiltrados.values && datosFiltrados.values.length > 0) {
            values = datosFiltrados.values;
            total = datosFiltrados.total || values.reduce((a, b) => a + b, 0);
        } else {
            values = labels.map(() => 0);
            total = 0;
        }

        tbody.innerHTML = labels.map((label, index) => {
            const valor = values[index] || 0;
            const porcentaje = total > 0 ? ((valor / total) * 100).toFixed(1) : 0;
            
            // Calcular tendencia (solo si hay valores anteriores)
            let tendencia = '';
            if (index > 0) {
                const valorAnterior = values[index - 1] || 0;
                const diferencia = valor - valorAnterior;
                const porcentajeCambio = valorAnterior > 0 ? ((diferencia / valorAnterior) * 100).toFixed(1) : 100;
                
                if (diferencia > 0) {
                    tendencia = `<span style="color: #27ae60;"><i class="fas fa-arrow-up"></i> ${porcentajeCambio}%</span>`;
                } else if (diferencia < 0) {
                    tendencia = `<span style="color: #e74c3c;"><i class="fas fa-arrow-down"></i> ${Math.abs(porcentajeCambio)}%</span>`;
                } else {
                    tendencia = `<span style="color: #f39c12;"><i class="fas fa-minus"></i> 0%</span>`;
                }
            } else {
                tendencia = '<span style="color: #95a5a6;">-</span>';
            }
            
            return `
                <tr>
                    <td><strong>${label}</strong></td>
                    <td>${getDescripcionTiempo(tipo, label)}</td>
                    <td style="text-align: center; font-weight: bold">${valor.toLocaleString()}</td>
                    <td style="text-align: center; color: #2e7d32; font-weight: bold">${porcentaje}%</td>
                    <td style="text-align: center;">
                        <span style="color: #3498db;">
                            <i class="fas fa-filter"></i> Filtrado
                        </span>
                    </td>
                </tr>
            `;
        }).join('') + (total > 0 ? `
            <tr style="background: #f8f9fa; font-weight: bold;">
                <td colspan="2">TOTAL GENERAL</td>
                <td style="text-align: center">${total.toLocaleString()}</td>
                <td style="text-align: center">100%</td>
                <td style="text-align: center;">-</td>
            </tr>
        ` : '');
    }

    async function aplicarFiltros() {
        try {
            const fechaInicial = document.getElementById('filtro-fecha-inicial').value;
            const fechaFinal = document.getElementById('filtro-fecha-final').value;
            const rangoEdad = document.getElementById('filtro-rango-edad').value;

            mostrarLoadingEdad('Aplicando filtros...');

            let query = supabase
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

            // Aplicar filtro de fechas
            if (fechaInicial && fechaFinal) {
                query = query
                    .gte('fecha_visita', fechaInicial)
                    .lte('fecha_visita', fechaFinal);
            }

            const { data: participantesFiltrados, error } = await query;

            if (error) throw error;

            let participantesProcesados = participantesFiltrados;

            // Aplicar filtro de rango de edad si no es "todos"
            if (rangoEdad !== 'todos') {
                participantesProcesados = participantesFiltrados.filter(participante => {
                    const edad = calcularEdad(participante.fecha_nacimiento);
                    if (edad === null) return false;
                    
                    const categoria = clasificarEdad(edad);
                    return categoria === rangoEdad;
                });
            }

            if (participantesProcesados && participantesProcesados.length > 0) {
                procesarDatosEdades(participantesProcesados);
                mostrarDatosEdad();
                
                Swal.fire({
                    icon: 'success',
                    title: 'Filtros aplicados',
                    text: `Se encontraron ${participantesProcesados.length} participantes con los criterios seleccionados`,
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                mostrarMensajeNoHayDatos(rangoEdad);
            }

            cerrarLoadingEdad();
            
        } catch (error) {
            console.error('Error aplicando filtros:', error);
            cerrarLoadingEdad();
            mostrarErrorEdad('Error al aplicar los filtros: ' + error.message);
        }
    }

    function limpiarFiltros() {
        document.getElementById('filtro-fecha-inicial').value = '';
        document.getElementById('filtro-fecha-final').value = '';
        document.getElementById('filtro-rango-edad').value = 'todos';
        
        // Restaurar datos originales
        datosSimuladosEdad = JSON.parse(JSON.stringify(datosOriginalesEdad));
        mostrarDatosEdad();
        
        Swal.fire({
            icon: 'success',
            title: 'Filtros limpiados',
            text: 'Se muestran todos los datos sin filtros',
            timer: 1500,
            showConfirmButton: false
        });
    }

    // Función para cambiar entre tipos de reporte
    function cambiarTipoReporte(tipo) {
        console.log('🔄 Cambiando a reporte:', tipo);
        
        // Actualizar botones activos
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.chart-btn[data-type="${tipo}"]`).classList.add('active');
        
        if (tipo === 'edad') {
            // Cargar datos de edad
            cargarDatosEdades();
        } else {
            // Cargar datos de tiempo (fecha, mes, año)
            cargarDatosTiempo(tipo);
        }
    }

    function mostrarFiltrosAvanzados() {
        const filtrosDiv = document.getElementById('filtros-avanzados-edad');
        if (filtrosDiv.style.display === 'none') {
            filtrosDiv.style.display = 'block';
        } else {
            filtrosDiv.style.display = 'none';
        }
    }

    // =============================================
    // FUNCIONES AUXILIARES
    // =============================================

    function formatearFecha(fechaStr) {
        try {
            const fecha = new Date(fechaStr);
            return fecha.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            return fechaStr;
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

    function ordenarMeses(mesA, mesB) {
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        
        const [nombreA, añoA] = mesA.split(' ');
        const [nombreB, añoB] = mesB.split(' ');
        
        if (añoA !== añoB) return parseInt(añoA) - parseInt(añoB);
        return meses.indexOf(nombreA) - meses.indexOf(nombreB);
    }

    function getDatosTiempo(tipo) {
        switch(tipo) {
            case 'fecha': return datosFecha;
            case 'mes': return datosMes;
            case 'anio': return datosAnio;
            default: return { labels: [], values: [], total: 0 };
        }
    }

    // En edad-system.js, busca la función getDatosTiempoInteligente y reemplázala por:
    function getDatosTiempoInteligente(tipo) {
        let datos;
        switch(tipo) {
            case 'fecha': 
                datos = datosFechaInteligente; 
                console.log('📅 Datos fecha inteligente:', datos);
                break;
            case 'mes': 
                datos = datosMesInteligente; 
                console.log('📊 Datos mes inteligente:', datos);
                break;
            case 'anio': 
                datos = datosAnioInteligente; 
                console.log('📈 Datos año inteligente:', datos);
                break;
            default: 
                datos = { labels: [], datasets: [], rangosEdad: [], fechas: [], total: 0 };
        }
        
        // Asegurar que tenga la estructura correcta
        if (!datos || !datos.datasets) {
            console.warn(`⚠️ Datos ${tipo} no tienen estructura correcta, inicializando...`);
            return {
                labels: [],
                datasets: [],
                rangosEdad: [],
                fechas: [],
                total: 0
            };
        }
        
        // Si hay datasets pero están vacíos, asegurar que tengan datos
        if (datos.datasets.length === 0) {
            datos.datasets = [{
                label: 'Sin datos',
                data: datos.labels.map(() => 0),
                backgroundColor: '#95a5a6',
                borderWidth: 1,
                borderRadius: 6
            }];
        }
        
        return datos;
    }

    function getTituloTiempo(tipo) {
        const titulos = {
            'fecha': '📅 Visitantes por Fecha',
            'mes': '📊 Visitantes por Mes', 
            'anio': '📈 Visitantes por Año'
        };
        return titulos[tipo] || 'Visitantes';
    }

    function getIconoTiempo(tipo) {
        const iconos = {
            'fecha': '<i class="fas fa-calendar-day"></i>',
            'mes': '<i class="fas fa-calendar-week"></i>',
            'anio': '<i class="fas fa-calendar-alt"></i>'
        };
        return iconos[tipo] || '<i class="fas fa-chart-bar"></i>';
    }

    function generarColoresTiempo(tipo, cantidad) {
        if (!cantidad || cantidad <= 0) {
            console.warn('⚠️ Cantidad inválida para generar colores:', cantidad);
            return ['#3498db']; // Color por defecto
        }
        
        const palette = coloresPorTiempo[tipo] || coloresPorTiempo.fecha || ['#3498db', '#e74c3c', '#2ecc71'];
        
        if (!palette || palette.length === 0) {
            console.warn('⚠️ Paleta de colores vacía para tipo:', tipo);
            // Generar colores básicos
            const coloresBase = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6'];
            palette = coloresBase;
        }
        
        const colors = [];
        for(let i = 0; i < cantidad; i++) {
            colors.push(palette[i % palette.length]);
        }
        return colors;
    }

    function mostrarSinDatosTiempo(tipo) {
        const container = document.getElementById('data-container');
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-calendar-times"></i>
                <h3>No hay datos de ${tipo} disponibles</h3>
                <p>No se encontraron visitantes con fechas de visita registradas.</p>
                <button class="btn btn-primary" onclick="window.EdadSystem.cargarDatosTiempo('${tipo}')">
                    <i class="fas fa-redo"></i> Reintentar
                </button>
            </div>
        `;
    }

    function mostrarLoadingEdad(mensaje) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: mensaje,
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });
        }
    }

    function cerrarLoadingEdad() {
        if (typeof Swal !== 'undefined') Swal.close();
    }

    function mostrarErrorEdad(mensaje) {
        const container = document.getElementById('data-container');
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error al cargar datos de edad</h3>
                <p>${mensaje}</p>
                <button class="btn btn-primary" onclick="window.EdadSystem.cargarDatos()">
                    <i class="fas fa-redo"></i> Reintentar
                </button>
            </div>
        `;
    }

    function mostrarExitoEdad(mensaje) {
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

    function mostrarSinDatosEdad() {
        const container = document.getElementById('data-container');
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-user-slash"></i>
                <h3>No hay datos de edad disponibles</h3>
                <p>No se encontraron participantes con fecha de nacimiento registrada.</p>
                <button class="btn btn-primary" onclick="window.EdadSystem.cargarDatos()">
                    <i class="fas fa-redo"></i> Reintentar
                </button>
            </div>
        `;
    }

   

    if (!window.EdadSystem) {
        window.EdadSystem = {};
    }

    
    window.EdadSystem.cargarDatos = () => cargarDatosEdades();
    window.EdadSystem.abrirModalEdad = (tipo) => abrirModalEdad(tipo);
    window.EdadSystem.cerrarModal = () => cerrarModalEdad();

    
    window.EdadSystem.cargarDatosTiempo = (tipo) => cargarDatosTiempo(tipo);
    window.EdadSystem.cambiarTipoTiempo = (tipo) => cargarDatosTiempo(tipo);
    window.EdadSystem.abrirModalTiempo = (tipo, tipoGrafica) => abrirModalTiempo(tipo, tipoGrafica);

   
    window.EdadSystem.descargarGraficoPrincipal = () => {
        if (chartBarEdad) {
            const link = document.createElement("a");
            link.download = "grafica_edad_principal.png";
            link.href = chartBarEdad.canvas.toDataURL("image/png");
            link.click();
        }
    };

    window.EdadSystem.descargarGraficoPrincipalTiempo = (tipo) => {
        let chart;
        switch(tipo) {
            case 'fecha': chart = chartFechaBar; break;
            case 'mes': chart = chartMesBar; break;
            case 'anio': chart = chartAnioBar; break;
        }
        
        if (chart) {
            const link = document.createElement("a");
            link.download = `grafica_${tipo}_principal.png`;
            link.href = chart.canvas.toDataURL("image/png");
            link.click();
        }
    };

    window.EdadSystem.descargarPNG = () => descargarPNGModalEdad();
    window.EdadSystem.descargarExcel = () => descargarExcelModalEdad();

    window.EdadSystem.descargarExcelTiempo = (tipo) => {
        const datos = getDatosTiempo(tipo);
        const total = datos.values.reduce((a, b) => a + b, 0);
        
        const datosExcel = [
            [getTituloTiempo(tipo).split(' ')[1], 'Total Visitantes', 'Porcentaje'],
            ...datos.labels.map((label, i) => {
                const porcentaje = total > 0 ? ((datos.values[i] / total) * 100).toFixed(1) : 0;
                return [label, datos.values[i], `${porcentaje}%`];
            }),
            ['TOTAL', total, '100%']
        ];

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(datosExcel);
        XLSX.utils.book_append_sheet(wb, ws, `Datos ${tipo}`);
        XLSX.writeFile(wb, `reporte_${tipo}.xlsx`);
    };

   
    window.EdadSystem.aplicarFiltros = () => aplicarFiltros();
    window.EdadSystem.limpiarFiltros = () => limpiarFiltros();
    window.EdadSystem.cambiarTipoReporte = (tipo) => cambiarTipoReporte(tipo);
    window.EdadSystem.mostrarFiltrosAvanzados = () => mostrarFiltrosAvanzados();
    window.EdadSystem.mostrarOcultarFiltros = () => mostrarOcultarFiltros();
    window.EdadSystem.aplicarFiltrosCombinados = () => aplicarFiltrosCombinados();
    window.EdadSystem.limpiarFiltrosCombinados = () => limpiarFiltrosCombinados();

    console.log('✅ Sistema de Edad y Tiempo cargado correctamente');

    // Agrega al final del archivo, en la sección del namespace global
    window.EdadSystem.procesarDatosTiempoConFiltros = (participantes, tipo, rangoEdad) => 
        procesarDatosTiempoConFiltros(participantes, tipo, rangoEdad);

    window.EdadSystem.mostrarInterfazTiempoConFiltros = (tipo, datosFiltrados, rangoEdad) => 
        mostrarInterfazTiempoConFiltros(tipo, datosFiltrados, rangoEdad);

    window.EdadSystem.descargarGraficoFiltrado = (tipo, rangoEdad) => {
        const canvas = document.getElementById(`chart${tipo.charAt(0).toUpperCase() + tipo.slice(1)}BarFiltrado`);
        if (canvas) {
            const link = document.createElement("a");
            link.download = `grafica_${tipo}_filtrada_${rangoEdad}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        }
    };

    window.EdadSystem.descargarExcelFiltrado = (tipo, rangoEdad) => {
        const container = document.getElementById('data-container');
        if (!container) return;
        
        // Aquí implementarías la lógica para exportar a Excel
        // Similar a las funciones de exportación que ya tienes
        mostrarExitoEdad('Función de exportación Excel filtrada - En desarrollo');
    };

    window.EdadSystem.abrirModalTiempoFiltrado = (tipo, tipoGrafica, rangoEdad) => {
        // Implementar modal específico para datos filtrados
        // Similar a abrirModalTiempo pero con datos filtrados
        mostrarExitoEdad(`Modal filtrado para ${tipo} - ${rangoEdad}`);
    };

    // Métodos para gráficas agrupadas
    window.EdadSystem.mostrarGraficasAgrupadas = (tipo) => mostrarGraficasAgrupadasTiempo(tipo);
    window.EdadSystem.descargarGraficoAgrupado = (tipo) => {
        // Implementar descarga
    };
    window.EdadSystem.abrirModalTiempoAgrupado = (tipo, tipoGrafica) => {
        // Implementar modal
    };
    window.EdadSystem.descargarExcelAgrupado = (tipo) => {
        // Implementar Excel
    };

    // Función para abrir modal desde gráficas agrupadas
    window.EdadSystem.abrirModalTiempoAgrupado = function(tipo, tipoGrafica) {
        console.log(`📊 Abriendo modal agrupado: ${tipo} - ${tipoGrafica}`);
        abrirModalTiempo(tipo, tipoGrafica);
    };

    // Función para abrir modal desde gráficas no agrupadas
    window.EdadSystem.abrirModalTiempo = function(tipo, tipoGrafica) {
        console.log(`📊 Abriendo modal normal: ${tipo} - ${tipoGrafica}`);
        abrirModalTiempo(tipo, tipoGrafica);
    };

    // Asegurar que las funciones de modal básicas estén disponibles
    window.EdadSystem.abrirModalEdad = function(tipoGrafica) {
        console.log(`👥 Abriendo modal edad: ${tipoGrafica}`);
        abrirModalEdad(tipoGrafica);
    };

    window.EdadSystem.cerrarModal = function() {
        console.log('❌ Cerrando modal');
        cerrarModalEdad();
    };

    // Función para cambiar tipo de reporte
    window.EdadSystem.cambiarTipoReporte = function(tipo) {
        console.log(`🔄 Cambiando reporte a: ${tipo}`);
        cambiarTipoReporte(tipo);
    };

    // Función para mostrar/ocultar filtros
    window.EdadSystem.mostrarOcultarFiltros = function() {
        const filtrosDiv = document.getElementById('filtros-combinados');
        if (!filtrosDiv) return;
        
        if (filtrosDiv.style.display === 'none' || filtrosDiv.style.display === '') {
            filtrosDiv.style.display = 'block';
            // Establecer fechas por defecto
            const ahora = new Date();
            const haceUnMes = new Date();
            haceUnMes.setMonth(ahora.getMonth() - 1);
            
            document.getElementById('filtro-fecha-inicial').value = 
                haceUnMes.toISOString().split('T')[0];
            document.getElementById('filtro-fecha-final').value = 
                ahora.toISOString().split('T')[0];
        } else {
            filtrosDiv.style.display = 'none';
        }
    };
})();
