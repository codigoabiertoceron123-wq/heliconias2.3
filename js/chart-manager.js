// Módulo para gestión de gráficos - VERSIÓN COMPLETA CORREGIDA
class ChartManager {
    constructor() {
        this.tipoActual = "tipo_reserva";
        this.app = null;
        this.dataProcessor = null;

        this.chartBar = null;
        this.chartPie = null;
        this.chartAmpliado = null;
        
        // Paletas de colores actualizadas con todas las categorías
        this.colorPalettes = {
            tipo_reserva: ['#3498db', '#2ecc71'],
            estado: ['#27ae60', '#f39c12', '#e74c3c'],
            actividad: ['#3498db', '#e67e22', '#9b59b6', '#2ecc71'],
            institucion: ['#e74c3c', '#3498db', '#f39c12', '#27ae60'],
            intereses: ['#27ae60', '#3498db', '#f39c12', '#9b59b6', '#e74c3c'],
            genero: ['#3498db', '#e74c3c', '#f39c12', '#9b59b6'],
            temporada: ['#FF6B6B', '#4ECDC4', '#45B7D1'],
            fecha: ['#3498db', '#e67e22', '#9b59b6', '#1abc9c', '#e74c3c'],
            mes: ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6'],
            anio: ['#3498db', '#e67e22', '#2ecc71', '#9b59b6', '#f1c40f']
        };
    }

    mostrarGraficas(tipo) {
        this.tipoActual = tipo;
        this.crearGraficas(tipo);
    }

    getTituloGrafica(tipo) {
        // Usa el método existente obtenerTituloDescriptivo
        if (this.obtenerTituloDescriptivo) {
            return this.obtenerTituloDescriptivo(tipo);
        }
        
        // Fallback simple si no existe obtenerTituloDescriptivo
        const titulos = {
            'tipo_reserva': 'Reservas por Tipo',
            'fecha': 'Visitantes por Fecha',
            'mes': 'Visitantes por Mes',
            'anio': 'Visitantes por Año',
            'estado': 'Reservas por Estado',
            'actividad': 'Reservas por Actividad',
            'institucion': 'Reservas por Institución',
            'intereses': 'Intereses de los Visitantes',
            'genero': 'Visitantes por Género',
            'temporada': 'Reservas por Temporada'
        };
        return titulos[tipo] || tipo;
    }

    mostrarGraficasAgrupadas(tipo, datos) {
        console.log('📊 Mostrando gráficas AGRUPADAS:', tipo);
        
        // Gráfica de barras agrupada
        const ctxBar = document.getElementById("chartBar");
        if (this.chartBar) this.chartBar.destroy();
        
        this.chartBar = new Chart(ctxBar, {
            type: "bar",
            data: {
                labels: datos.labels || [],
                datasets: (datos.datasets || []).map((dataset, index) => ({
                    label: dataset.label,
                    data: dataset.data.map(val => val || 0),
                    backgroundColor: dataset.backgroundColor || this.generarColores(tipo, datos.labels)[index],
                    borderColor: dataset.borderColor || '#fff',
                    borderWidth: 1,
                    borderRadius: 6,
                    barThickness: 30
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
                        text: this.getTituloGrafica(tipo) + ' (Agrupado)',
                        font: { size: 16, weight: 'bold' }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Cantidad de Visitantes' }
                    }
                }
            }
        });

        // Gráfica circular (totales por tipo)
        const ctxPie = document.getElementById("chartPie");
        if (this.chartPie) this.chartPie.destroy();
        
        // Calcular totales por tipo para el gráfico circular
        const totalesPorTipo = {};
        if (datos.datasets && datos.datasets.length > 0) {
            datos.datasets.forEach(dataset => {
                const total = dataset.data.reduce((sum, val) => sum + (val || 0), 0);
                if (total > 0) {
                    totalesPorTipo[dataset.label] = total;
                }
            });
        }
        
        const labelsCircular = Object.keys(totalesPorTipo);
        const dataCircular = Object.values(totalesPorTipo);
        
        this.chartPie = new Chart(ctxPie, {
            type: "doughnut",
            data: {
                labels: labelsCircular,
                datasets: [{
                    data: dataCircular,
                    backgroundColor: labelsCircular.map((label, index) => 
                        datos.datasets[index]?.backgroundColor || this.generarColores(tipo, labelsCircular)[index]
                    ),
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

    crearGraficas(tipo) {
        console.log('🔍 Buscando datos para:', tipo);
        
        // Obtener datos de múltiples fuentes posibles
        let datos = null;
        
        // Fuente 1: DataProcessor modular
        if (this.dataProcessor && this.dataProcessor.datosSimulados) {
            datos = this.dataProcessor.datosSimulados[tipo];
            console.log('✅ Datos desde DataProcessor:', datos);
        } 
        // Fuente 2: App principal
        else if (this.app && this.app.getDatosSimulados) {
            const datosSimulados = this.app.getDatosSimulados();
            datos = datosSimulados[tipo];
            console.log('✅ Datos desde App:', datos);
        }
        // Fuente 3: Variable global (fallback)
        else if (window.dataProcessor && window.dataProcessor.datosSimulados) {
            datos = window.dataProcessor.datosSimulados[tipo];
            console.log('✅ Datos desde global dataProcessor:', datos);
        }
        // Fuente 4: Variable global directa (último fallback)
        else if (window.datosSimulados) {
            datos = window.datosSimulados[tipo];
            console.log('✅ Datos desde global datosSimulados:', datos);
        }

        // Datos de emergencia si todo falla
        if (!datos) {
            console.warn('⚠ No hay datos en fuentes normales, usando datos de emergencia');
            datos = this.generarDatosEmergencia(tipo);
        }

        console.log('🎯 Datos encontrados para', tipo, ':', datos);

        // DETECTAR SI ES GRÁFICA AGRUPADA
        const esGraficaAgrupada = datos.datasets && datos.datasets.length > 0;
        
        if (esGraficaAgrupada) {
            console.log('📊 Mostrando gráfica AGRUPADA para:', tipo);
            this.crearGraficasAgrupadas(tipo, datos);
        } else {
            // Verificar si hay datos simples válidos
            if (!datos || !datos.labels || !datos.values || datos.labels.length === 0 || datos.values.length === 0) {
                console.error('❌ No hay datos válidos para:', tipo);
                console.log('🔍 Datos recibidos:', datos);
                
                datos = this.generarDatosEmergencia(tipo);
                console.log('🆘 Usando datos de emergencia:', datos);
            }
            
            console.log('📊 Mostrando gráfica SIMPLE para:', tipo);
            this.crearGraficasSimples(tipo, datos);
        }
    }

    crearGraficasAgrupadas(tipo, datos) {
        const etiquetaDescriptiva = this.obtenerEtiquetaDescriptiva(tipo);
        const tituloDescriptivo = this.obtenerTituloDescriptivo(tipo);
        
        // Destruir gráficas anteriores
        this.destruirGraficasAnteriores();
        
        // 1. Gráfica de barras AGRUPADA
        const ctxBar = document.getElementById("chartBar");
        
        this.chartBar = new Chart(ctxBar, {
            type: "bar",
            data: {
                labels: datos.labels || [],
                datasets: (datos.datasets || []).map((dataset, index) => ({
                    label: dataset.label,
                    data: dataset.data.map(val => val || 0),
                    backgroundColor: dataset.backgroundColor || this.generarColores(tipo, datos.labels)[index],
                    borderColor: dataset.borderColor || '#fff',
                    borderWidth: 1,
                    borderRadius: 6,
                    barThickness: 25
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
                        text: tituloDescriptivo + ' (Agrupado)',
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
                        title: { 
                            display: true, 
                            text: 'Cantidad de Visitantes',
                            font: { weight: 'bold' }
                        }
                    },
                    x: {
                        title: { 
                            display: true, 
                            text: etiquetaDescriptiva,
                            font: { weight: 'bold' }
                        }
                    }
                }
            }
        });

        // 2. Gráfica circular (totales por categoría)
        const ctxPie = document.getElementById("chartPie");
        
        // Calcular totales por categoría para el gráfico circular
        const totalesPorCategoria = {};
        if (datos.datasets && datos.datasets.length > 0) {
            datos.datasets.forEach(dataset => {
                const total = dataset.data.reduce((sum, val) => sum + (val || 0), 0);
                if (total > 0) {
                    totalesPorCategoria[dataset.label] = total;
                }
            });
        }
        
        const labelsCircular = Object.keys(totalesPorCategoria);
        const dataCircular = Object.values(totalesPorCategoria);
        const totalGeneral = dataCircular.reduce((a, b) => a + b, 0);
        
        if (labelsCircular.length > 0) {
            this.chartPie = new Chart(ctxPie, {
                type: "doughnut",
                data: {
                    labels: labelsCircular,
                    datasets: [{
                        data: dataCircular,
                        backgroundColor: labelsCircular.map((label, index) => 
                            datos.datasets[index]?.backgroundColor || this.generarColores(tipo, labelsCircular)[index]
                        ),
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
                            text: 'Distribución por Categoría',
                            font: { size: 14, weight: 'bold' }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw;
                                    const percentage = totalGeneral > 0 ? Math.round((value / totalGeneral) * 100) : 0;
                                    return `${label}: ${value} visitantes (${percentage}%)`;
                                }
                            }
                        }
                    },
                    cutout: '60%'
                },
            });
        } else {
            // Mostrar gráfico vacío si no hay datos
            this.chartPie = new Chart(ctxPie, {
                type: "doughnut",
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
                            font: { size: 14 }
                        }
                    }
                }
            });
        }
    }

    destruirGraficasAnteriores() {
        console.log('🗑 Destruyendo gráficas anteriores...');
        
        // También destruir instancias globales de Chart.js
        if (window.Chart && window.Chart.instances) {
            Object.keys(window.Chart.instances).forEach(key => {
                const chart = window.Chart.instances[key];
                if (chart && chart.destroy) {
                    chart.destroy();
                    console.log(`✅ Gráfica global destruida: ${key}`);
                }
            });
        }
        
        if (this.chartBar) {
            this.chartBar.destroy();
            this.chartBar = null;
            console.log('✅ Gráfica de barras destruida');
        } else {
            console.log('ℹ No había gráfica de barras para destruir');
        }
        
        if (this.chartPie) {
            this.chartPie.destroy();
            this.chartPie = null;
            console.log('✅ Gráfica circular destruida');
        } else {
            console.log('ℹ No había gráfica circular para destruir');
        }

        // Opcional: también destruir gráfica ampliada si existe
        if (this.chartAmpliado) {
            this.chartAmpliado.destroy();
            this.chartAmpliado = null;
            console.log('✅ Gráfica ampliada destruida');
        }
    }

    generarDatosEmergencia(tipo) {
        console.log('🆘 Generando datos de emergencia para:', tipo);
        
        const datosEmergencia = {
            tipo_reserva: {
                labels: ['Individual', 'Grupal'],
                values: [65, 35]
            },
            estado: {
                labels: ['Confirmada', 'Pendiente', 'Cancelada'],
                values: [70, 20, 10]
            },
            actividad: {
                labels: ['Tour Guiado', 'Visita Libre', 'Taller'],
                values: [45, 35, 20]
            },
            institucion: {
                labels: ['Universidad', 'Colegio', 'Empresa'],
                values: [40, 35, 25]
            },
            intereses: {
                labels: ['Historia', 'Ciencia', 'Naturaleza'],
                values: [50, 30, 20]
            },
            genero: {
                labels: ['Masculino', 'Femenino'],
                values: [55, 45]
            },
            temporada: {
                labels: ['Alta', 'Media', 'Baja'],
                values: [50, 30, 20]
            },
            fecha: {
                labels: ['2024-01-15', '2024-01-16', '2024-01-17'],
                values: [30, 40, 30]
            },
            mes: {
                labels: ['Enero', 'Febrero', 'Marzo'],
                values: [40, 35, 25]
            },
            anio: {
                labels: ['2024', '2023'],
                values: [70, 30]
            }
        };
        
        return datosEmergencia[tipo] || {
            labels: ['Dato 1', 'Dato 2', 'Dato 3'],
            values: [30, 40, 30]
        };
    }

    crearGraficasSimples(tipo, datos) {
        console.log('📊 Creando gráficas simples para:', tipo);
        
        const etiquetaDescriptiva = this.obtenerEtiquetaDescriptiva(tipo);
        const tituloDescriptivo = this.obtenerTituloDescriptivo(tipo);
        
        // Destruir gráficas anteriores
        this.destruirGraficasAnteriores();
        
        // Usar tus métodos existentes
        this.crearGraficaBarras(tipo, datos, etiquetaDescriptiva, tituloDescriptivo);
        this.crearGraficaCircular(tipo, datos, tituloDescriptivo);
    }

    crearGraficaBarras(tipo, datos, etiquetaDescriptiva, tituloDescriptivo) {
        const ctxBar = document.getElementById("chartBar");
        if (!ctxBar) {
            console.error('❌ No se encontró el canvas chartBar');
            return;
        }

        // Verificar que el canvas esté limpio
        if (ctxBar._chart) {
            console.log('⚠ Canvas chartBar ya tiene una gráfica, destruyendo...');
            ctxBar._chart.destroy();
        }

        // Verificar dimensiones mínimas
        if (ctxBar.offsetWidth < 100 || ctxBar.offsetHeight < 100) {
            console.warn('⚠ Canvas chartBar tiene dimensiones pequeñas:', {
                width: ctxBar.offsetWidth,
                height: ctxBar.offsetHeight
            });
            // Forzar dimensiones mínimas
            ctxBar.style.width = '500px';
            ctxBar.style.height = '400px';
        }

        const colors = this.generarColores(tipo, datos.labels);
        
        // Formatear labels para género
        const labelsParaGrafica = tipo === 'genero' ? datos.labels.map(label => this.formatearGenero(label)) : datos.labels;
        
        try {
            this.chartBar = new Chart(ctxBar, {
                type: "bar",
                data: {
                    labels: labelsParaGrafica,
                    datasets: [{
                        label: "Total de Visitantes",
                        data: datos.values,
                        backgroundColor: colors,
                        borderRadius: 6,
                        barThickness: 18,
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        title: {
                            display: true,
                            text: tituloDescriptivo,
                            font: { size: 16, weight: 'bold' },
                            padding: 20
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(0,0,0,0.05)' },
                            title: {
                                display: true,
                                text: 'Cantidad de Visitantes',
                                font: { weight: 'bold' }
                            }
                        },
                        x: {
                            grid: { display: false },
                            title: {
                                display: true,
                                text: etiquetaDescriptiva,
                                font: { weight: 'bold' }
                            }
                        }
                    },
                    // Callback para redimensionamiento
                    onResize: (chart, size) => {
                        console.log('📏 Chart Bar redimensionado:', size);
                    }
                },
            });
            
            // Guardar referencia en el canvas
            ctxBar._chart = this.chartBar;
            
        } catch (error) {
            console.error('❌ Error creando gráfica de barras:', error);
            // Intentar recrear el canvas si falla
            this.recrearCanvasYReintentar('chartBar', 'bar', tipo, datos, etiquetaDescriptiva, tituloDescriptivo);
        }
    }

    crearGraficaCircular(tipo, datos, tituloDescriptivo) {
        const ctxPie = document.getElementById("chartPie");
        if (!ctxPie) {
            console.error('❌ No se encontró el canvas chartPie');
            return;
        }

        // Verificar que el canvas esté limpio
        if (ctxPie._chart) {
            console.log('⚠ Canvas chartPie ya tiene una gráfica, destruyendo...');
            ctxPie._chart.destroy();
        }

        // Verificar dimensiones mínimas
        if (ctxPie.offsetWidth < 100 || ctxPie.offsetHeight < 100) {
            console.warn('⚠ Canvas chartPie tiene dimensiones pequeñas:', {
                width: ctxPie.offsetWidth,
                height: ctxPie.offsetHeight
            });
            // Forzar dimensiones mínimas
            ctxPie.style.width = '500px';
            ctxPie.style.height = '400px';
        }

        const colors = this.generarColores(tipo, datos.labels);

        // Formatear labels para género
        const labelsParaGrafica = tipo === 'genero' ? datos.labels.map(label => this.formatearGenero(label)) : datos.labels;
        
        try {
            this.chartPie = new Chart(ctxPie, {
                type: "doughnut",
                data: {
                    labels: labelsParaGrafica,
                    datasets: [{
                        data: datos.values,
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
                                padding: 8,
                                usePointStyle: true,
                                pointStyle: 'circle',
                                boxWidth: 8,
                                font: { size: 10 }
                            }
                        },
                        title: {
                            display: true,
                            text: tituloDescriptivo,
                            font: { size: 16, weight: 'bold' },
                            padding: 20
                        }
                    },
                    cutout: '70%',
                    spacing: 2,
                    // Callback para redimensionamiento
                    onResize: (chart, size) => {
                        console.log('📏 Chart Pie redimensionado:', size);
                    }
                },
            });
            
            // Guardar referencia en el canvas
            ctxPie._chart = this.chartPie;
            
        } catch (error) {
            console.error('❌ Error creando gráfica circular:', error);
            // Intentar recrear el canvas si falla
            this.recrearCanvasYReintentar('chartPie', 'doughnut', tipo, datos, '', tituloDescriptivo);
        }
    }

    recrearCanvasYReintentar(canvasId, chartType, tipo, datos, etiquetaDescriptiva, tituloDescriptivo) {
        console.log(`🔄 Recreando canvas ${canvasId}...`);
        
        const oldCanvas = document.getElementById(canvasId);
        if (!oldCanvas) return;
        
        // Crear nuevo canvas
        const newCanvas = document.createElement('canvas');
        newCanvas.id = canvasId;
        newCanvas.width = 500;
        newCanvas.height = 400;
        newCanvas.style.width = '500px';
        newCanvas.style.height = '400px';
        newCanvas.style.border = '2px dashed #666';
        
        // Reemplazar el viejo
        oldCanvas.parentNode.replaceChild(newCanvas, oldCanvas);
        
        console.log(`✅ Canvas ${canvasId} recreado, reintentando gráfica...`);
        
        // Reintentar después de un breve delay
        setTimeout(() => {
            if (chartType === 'bar') {
                this.crearGraficaBarras(tipo, datos, etiquetaDescriptiva, tituloDescriptivo);
            } else {
                this.crearGraficaCircular(tipo, datos, tituloDescriptivo);
            }
        }, 100);
    }

    crearGraficaBarrasTemporal(tipo, datos, etiquetaDescriptiva, tituloDescriptivo, ctx) {
    
        const colors = {
            confirmada: '#27ae60',
            pendiente:  '#f39c12',
            cancelada:  '#e74c3c'
        };

        const estados = ['confirmada', 'pendiente', 'cancelada'];

        const datasets = estados.map(estado => ({
            label: estado.charAt(0).toUpperCase() + estado.slice(1),
            data: datos[estado] || [],
            backgroundColor: colors[estado],
            borderRadius: 6,
            barThickness: 18
        }));

        this.chartBar = new Chart(ctx, {
            type: "bar",
            data: {
                labels: datos.labels,
                datasets: datasets
            },
            options: this.obtenerOpcionesBarras(etiquetaDescriptiva, tituloDescriptivo)
        });
    }

    crearGraficaBarrasNormal(tipo, datos, etiquetaDescriptiva, tituloDescriptivo, ctx) {
        const { labels, values } = datos;
        const colors = this.generarColores(tipo, labels);
        
        this.chartBar = new Chart(ctx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: "Total de reservas",
                    data: values,
                    backgroundColor: colors,
                    borderRadius: 6,
                    barThickness: 18,
                }],
            },
            options: this.obtenerOpcionesBarras(etiquetaDescriptiva, tituloDescriptivo)
        });
    }

    crearGraficaCircularTemporal(tipo, datos, tituloDescriptivo, ctx) {
        const tipoReservaSeleccionado = document.getElementById('modal-filtro-tipo-reserva') ? 
                                    document.getElementById('modal-filtro-tipo-reserva').value : 'todas';
        
        let datosCircular = [];
        let labelsCircular = [];
        let colorsCircular = [];
        
        if (tipoReservaSeleccionado === 'individual') {
            labelsCircular = datos.labels || [];
            datosCircular = datos.individual || [];
            colorsCircular = this.generarColores(tipo, labelsCircular);
        } else if (tipoReservaSeleccionado === 'grupal') {
            labelsCircular = datos.labels || [];
            datosCircular = datos.grupal || [];
            colorsCircular = this.generarColores(tipo, labelsCircular);
        } else {
            labelsCircular = ['Individual', 'Grupal'];
            const totalIndividual = datos.individual ? datos.individual.reduce((a, b) => a + b, 0) : 0;
            const totalGrupal = datos.grupal ? datos.grupal.reduce((a, b) => a + b, 0) : 0;
            datosCircular = [totalIndividual, totalGrupal];
            colorsCircular = ['#3498db', '#2ecc71'];
        }
        
        this.chartPie = new Chart(ctx, {
            type: "doughnut",
            data: { labels: labelsCircular, datasets: [{ data: datosCircular, backgroundColor: colorsCircular, borderWidth: 2, borderColor: '#fff' }] },
            options: this.obtenerOpcionesCircular(tituloDescriptivo, tipoReservaSeleccionado)
        });
    }

    crearGraficaCircularNormal(tipo, datos, tituloDescriptivo, ctx) {
        const { labels, values } = datos;
        const colors = this.generarColores(tipo, labels);
        
        this.chartPie = new Chart(ctx, {
            type: "doughnut",
            data: { labels: labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }] },
            options: this.obtenerOpcionesCircular(tituloDescriptivo)
        });
    }

    generarColores(tipo, labels) {
        const palette = this.colorPalettes[tipo] || this.colorPalettes.estado;
        return labels.map((_, i) => palette[i % palette.length]);
    }

    obtenerOpcionesBarras(etiquetaDescriptiva, tituloDescriptivo, tipoReservaSeleccionado = 'todas') {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: tipoReservaSeleccionado === 'todas', position: 'top' },
                title: {
                    display: true,
                    text: tituloDescriptivo + (tipoReservaSeleccionado !== 'todas' ? ` - ${tipoReservaSeleccionado}` : ''),
                    font: { size: 16, weight: 'bold' },
                    padding: 20
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    titleFont: { size: 13 },
                    bodyFont: { size: 13 },
                    padding: 10,
                    cornerRadius: 6,
                    callbacks: {
                        title: function(tooltipItems) { return tooltipItems[0].label; },
                        label: function(context) { return `${context.dataset.label}: ${context.parsed.y.toLocaleString()} visitantes`; }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    title: { display: true, text: 'Cantidad de Rerservas', font: { weight: 'bold' } }
                },
                x: {
                    grid: { display: false },
                    title: { display: true, text: etiquetaDescriptiva, font: { weight: 'bold' } },
                    ticks: { maxRotation: 45, minRotation: 0 }
                }
            }
        };
    }

    obtenerOpcionesCircular(tituloDescriptivo, tipoReservaSeleccionado = 'todas') {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { padding: 8, usePointStyle: true, pointStyle: 'circle', boxWidth: 8, font: { size: 10 } }
                },
                title: {
                    display: true,
                    text: tituloDescriptivo + (tipoReservaSeleccionado !== 'todas' ? ` - ${tipoReservaSeleccionado}` : ' - Distribución'),
                    font: { size: 16, weight: 'bold' },
                    padding: 20
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    titleFont: { size: 11 },
                    bodyFont: { size: 11 },
                    padding: 6,
                    cornerRadius: 4,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${label}: ${value.toLocaleString()} visitantes (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '70%',
            spacing: 2
        };
    }

    obtenerEtiquetaDescriptiva(tipo) {
        const etiquetas = {
            tipo_reserva: 'Tipo de Reserva',
            estado: 'Estado de Reserva', 
            actividad: 'Actividad',
            institucion: 'Institución',
            intereses: 'Interés Principal',
            genero: 'Género',
            temporada: 'Temporada',
            fecha: 'Fecha de Visita',
            mes: 'Mes del Año',
            anio: 'Año'
        };
        return etiquetas[tipo] || 'Categoría';
    }

    obtenerTituloDescriptivo(tipo) {
        const titulos = {
            tipo_reserva: 'Reservas por Tipo',
            estado: 'Reservas por Estado',
            actividad: 'Reservas por Actividad',
            institucion: 'Reservas por Institución',
            intereses: 'Intereses de los Visitantes',
            genero: 'Visitantes por Género',
            temporada: 'Reservas por Temporada',
            fecha: 'Reservas por Fecha',
            mes: 'Reservas por Mes',
            anio: 'Reservas por Año'
        };
        return titulos[tipo] || 'Distribución de Reservas';
    }

    formatearGenero(genero) {
        const formatos = {
            'masculino': 'Masculino',
            'femenino': 'Femenino', 
            'otro': 'Otro',
            'prefiero-no-decir': 'Prefiero no decir'
        };
        return formatos[genero] || genero;
    }
}

// Verificación mejorada
setTimeout(() => {
    console.log('🔍 VERIFICACIÓN FINAL CHART-MANAGER:');
    console.log('- Instancia chartManager:', !!window.chartManager);
    console.log('- canvas chartBar existe:', !!document.getElementById('chartBar'));
    console.log('- canvas chartPie existe:', !!document.getElementById('chartPie'));
    console.log('- Chart.js cargado:', !!window.Chart);
}, 2000);

// Crear instancia global y asignarla a window
const chartManager = new ChartManager();
window.chartManager = chartManager;

// Agregar también un método de inicialización para mayor control
ChartManager.prototype.inicializar = function(app, dataProcessor) {
    this.app = app;
    this.dataProcessor = dataProcessor;
    console.log('✅ ChartManager inicializado con app y dataProcessor');
};

// Método adicional para limpiar todas las gráficas
ChartManager.prototype.limpiarTodasLasGraficas = function() {
    this.destruirGraficasAnteriores();
    console.log('🧹 Todas las gráficas han sido limpiadas');
};

// Método para obtener el estado actual
ChartManager.prototype.obtenerEstado = function() {
    return {
        tipoActual: this.tipoActual,
        chartBarActiva: !!this.chartBar,
        chartPieActiva: !!this.chartPie,
        chartAmpliadoActiva: !!this.chartAmpliado
    };
};