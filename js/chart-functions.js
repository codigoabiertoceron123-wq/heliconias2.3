// Función para crear gráficas en 3D
function crearGraficas(tipo) {
    console.log(`=== CREANDO GRÁFICA 3D PARA: ${tipo} ===`);
    
    const datos = datosSimulados[tipo];
    console.log('Datos completos:', datos);

    let labels = [];
    let values = [];

    if (tipo === 'fecha') {
        if (datos && datos.labels && datos.values) {
            labels = datos.labels;
            values = datos.values;
            console.log('Usando datos de BD para fecha:', { labels, values });
        } else {
            labels = ['Sin datos'];
            values = [0];
            console.log('Usando datos de fallback para fecha');
        }
    } else if (datos && datos.labels && datos.values) {
        labels = datos.labels;
        values = datos.values;
        console.log('Usando datos existentes:', { labels, values });
    } else {
        labels = ['Dato 1', 'Dato 2', 'Dato 3'];
        values = [10, 20, 15];
        console.log('Usando datos de ejemplo por defecto:', { labels, values });
    }

    // Validación simple
    if (!labels.length || !values.length || values.reduce((a, b) => a + b, 0) === 0) {
        console.log('No hay datos - labels:', labels, 'values:', values);
        mostrarMensajeSinDatos(`No hay datos disponibles para ${obtenerTituloDescriptivo(tipo)}`);
        return;
    }

    console.log('Procesando con labels:', labels, 'values:', values);

    const colors = generarColores(tipo, labels);
    const etiquetaDescriptiva = obtenerEtiquetaDescriptiva(tipo);
    const tituloDescriptivo = obtenerTituloDescriptivo(tipo);

    // Configurar barras 3D
    const ctxBar = document.getElementById("chartBar").getContext("2d");
    if (chartBar) chartBar.destroy();
    
    const labelsParaGrafica = tipo === 'genero' ? labels.map(formatearGenero) : 
                            tipo === 'fecha' ? labels.map(formatearGenero) : 
                            labels;
    
    console.log('Creando gráfica de barras 3D con:', labelsParaGrafica, values);
    
    chartBar = new Chart(ctxBar, {
        type: "bar",
        data: {
            labels: labelsParaGrafica,
            datasets: [
                {
                    label: "Total de Visitantes",
                    data: values,
                    backgroundColor: colors.map(color => 
                        typeof color === 'string' ? color : 
                        Array.isArray(color) ? color[0] : '#3498db'
                    ),
                    borderColor: colors.map(color => 
                        typeof color === 'string' ? 
                        darkenColor(color, 0.2) : 
                        '#2980b9'
                    ),
                    borderWidth: 2,
                    borderRadius: 8,
                    barThickness: 25,
                    hoverBackgroundColor: colors.map(color => 
                        typeof color === 'string' ? 
                        lightenColor(color, 0.1) : 
                        '#5dade2'
                    ),
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: tituloDescriptivo + ' - Vista 3D',
                    font: { size: 16, weight: 'bold' },
                    padding: 20
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleFont: { size: 13 },
                    bodyFont: { size: 13 },
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        title: function(tooltipItems) {
                            return tooltipItems[0].label;
                        },
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((context.parsed.y / total) * 100);
                            return `Visitantes: ${context.parsed.y.toLocaleString()} (${percentage}%)`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { 
                        color: 'rgba(0,0,0,0.1)',
                        drawBorder: false
                    },
                    title: {
                        display: true,
                        text: 'Cantidad de Visitantes',
                        font: { weight: 'bold' }
                    }
                },
                x: {
                    grid: { 
                        display: false 
                    },
                    title: {
                        display: true,
                        text: etiquetaDescriptiva,
                        font: { weight: 'bold' }
                    },
                    ticks: {
                        maxRotation: 45,
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

    // Configurar gráfica circular 3D
    const ctxPie = document.getElementById("chartPie").getContext("2d");
    if (chartPie) chartPie.destroy();
    
    console.log('Creando gráfica circular 3D con:', labelsParaGrafica, values);
    
    chartPie = new Chart(ctxPie, {
        type: "doughnut",
        data: {
            labels: labelsParaGrafica,
            datasets: [
                {
                    data: values,
                    backgroundColor: colors,
                    borderWidth: 3,
                    borderColor: '#fff',
                    hoverBorderWidth: 4,
                    hoverBorderColor: '#fff',
                    hoverBackgroundColor: colors.map(color => 
                        typeof color === 'string' ? 
                        lightenColor(color, 0.2) : color
                    ),
                },
            ],
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
                    text: tituloDescriptivo + ' - Vista 3D',
                    font: { size: 16, weight: 'bold' },
                    padding: 20
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleFont: { size: 11 },
                    bodyFont: { size: 11 },
                    padding: 8,
                    cornerRadius: 6,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value.toLocaleString()} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '60%',
            spacing: 5,
            rotation: -30, // Efecto 3D - inclinación
            circumference: 360,
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1000,
                easing: 'easeOutQuart'
            }
        },
    });

    // Aplicar efectos 3D manualmente con sombras
    aplicarEfectos3D();

    console.log('=== GRÁFICAS 3D CREADAS EXITOSAMENTE ===');
}

// Función para aplicar efectos 3D
function aplicarEfectos3D() {
    // Efecto para barras
    const barCanvas = document.getElementById("chartBar");
    if (barCanvas) {
        barCanvas.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)';
        barCanvas.style.borderRadius = '12px';
        barCanvas.style.background = 'linear-gradient(145deg, #ffffff, #f8f9fa)';
        barCanvas.style.padding = '15px';
    }
    
    // Efecto para doughnut
    const pieCanvas = document.getElementById("chartPie");
    if (pieCanvas) {
        pieCanvas.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)';
        pieCanvas.style.borderRadius = '12px';
        pieCanvas.style.background = 'linear-gradient(145deg, #ffffff, #f8f9fa)';
        pieCanvas.style.padding = '15px';
    }
}

// Función para oscurecer colores (efecto 3D)
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

// Función para aclarar colores (efecto hover)
function lightenColor(color, factor) {
    if (color.startsWith('#')) {
        let r = parseInt(color.slice(1, 3), 16);
        let g = parseInt(color.slice(3, 5), 16);
        let b = parseInt(color.slice(5, 7), 16);
        
        r = Math.min(255, Math.floor(r + (255 - r) * factor));
        g = Math.min(255, Math.floor(g + (255 - g) * factor));
        b = Math.min(255, Math.floor(b + (255 - b) * factor));
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    return color;
}

// Función para mostrar gráficas
function mostrarGraficas(tipo) {
    tipoActual = tipo;
    console.log(`🔄 Mostrando gráficas 3D para: ${tipo}`);
    crearGraficas(tipo);
}

// Función para abrir modal
function abrirModal(tipoGrafica) {
    console.log(`🔓 Abriendo modal para tipo: ${tipoGrafica}, tipoActual: ${tipoActual}`);
    
    const modal = document.getElementById("chartModal");
    modal.classList.add("show");

    document.querySelector('.modal-chart-container').setAttribute('data-tipo-grafica', tipoGrafica);

    crearFiltrosModal();
    actualizarGraficaModal(tipoGrafica);
}

// Función para actualizar la gráfica del modal en 3D - VERSIÓN MEJORADA
function actualizarGraficaModal(tipoGrafica, tituloPersonalizado = null) {
    console.log(`🔄 Actualizando gráfica modal - Tipo: ${tipoGrafica}, tipoActual: ${tipoActual}`);
    
    const ctx = document.getElementById("chartAmpliado").getContext("2d");
    
    // VALIDACIÓN CRÍTICA
    let datos = datosSimulados[tipoActual];
    if (!datos) {
        console.error(`❌ Error: No hay datos para ${tipoActual}`);
        mostrarMensajeSinDatos(`No hay datos disponibles para ${obtenerTituloDescriptivo(tipoActual)}`);
        return;
    }

    console.log(`🔍 Datos para ${tipoActual}:`, datos);

    // DETERMINAR TIPO DE DATOS
    const esDatosAgrupados = datos.type === 'grouped' && datos.datasets && datos.datasets.length > 0;
    const esDatosSimples = datos.labels && datos.values;
    
    if (!esDatosAgrupados && !esDatosSimples) {
        console.error('❌ Estructura de datos no reconocida:', datos);
        mostrarMensajeSinDatos('Formato de datos no compatible');
        return;
    }

    const tituloFinal = (tituloPersonalizado || obtenerTituloDescriptivo(tipoActual)) + ' - Vista 3D';
    const modalTitle = document.getElementById("modalTitle");
    
    if (modalTitle) {
        modalTitle.innerHTML = `<i class="fas fa-cube"></i> ${tituloFinal}`;
    }

    // DESTRUIR GRÁFICA ANTERIOR
    if (chartAmpliado) {
        console.log('🗑️ Destruyendo gráfica anterior');
        chartAmpliado.destroy();
    }

    // CREAR NUEVA GRÁFICA SEGÚN TIPO DE DATOS
    if (esDatosAgrupados) {
        crearGraficaAgrupadaModal(ctx, datos, tipoGrafica, tituloFinal);
        actualizarTablaDatosAgrupadosModal(datos, tipoActual);
    } else {
        crearGraficaSimpleModal(ctx, datos, tipoGrafica, tituloFinal);
        actualizarTablaDatosSimplesModal(datos, tipoActual, calcularTotal(datos));
    }

    // APLICAR EFECTOS VISUALES 3D
    aplicarEfectos3DModal();

    // REDIMENSIONAR DESPUÉS DE UN RETRASO
    setTimeout(() => {
        if (chartAmpliado) {
            console.log('📐 Redimensionando gráfica');
            chartAmpliado.resize();
        }
    }, 200);
}

// FUNCIÓN AUXILIAR: Calcular total
function calcularTotal(datos) {
    if (datos.type === 'grouped' && datos.totalGeneral) {
        return datos.totalGeneral;
    } else if (datos.type === 'grouped' && datos.datasets) {
        return datos.datasets.reduce((sum, dataset) => 
            sum + (dataset.data?.reduce((a, b) => a + b, 0) || 0), 0);
    } else if (datos.values && Array.isArray(datos.values)) {
        return datos.values.reduce((a, b) => a + b, 0);
    }
    return 0;
}

// FUNCIÓN AUXILIAR: Crear gráfica agrupada
function crearGraficaAgrupadaModal(ctx, datos, tipoGrafica, titulo) {
    console.log('🎨 Creando gráfica AGRUPADA para', tipoActual);
    
    // Preparar datasets con efectos 3D
    const datasets3D = datos.datasets.map(dataset => ({
        ...dataset,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: darkenColor(dataset.backgroundColor, 0.3),
        hoverBorderWidth: 3,
        hoverBackgroundColor: lightenColor(dataset.backgroundColor, 0.1),
        barThickness: tipoActual === 'anio' ? 25 : 30,
    }));

    // Formatear labels según tipo
    let labelsFormateados = datos.labels;
    if (tipoActual === 'fecha') {
        labelsFormateados = datos.labels.map(fecha => formatearFechaCorta(fecha));
    } else if (tipoActual === 'anio') {
        labelsFormateados = datos.labels.map(anio => `Año ${anio}`);
    }
    
    // DECIDIR TIPO DE GRÁFICA SEGÚN PARÁMETRO Y DATOS
    const tipoChart = determinarTipoChart(tipoGrafica, datos);
    
    // Configurar opciones según tipo de chart
    const opcionesChart = obtenerOpcionesChartAgrupado(tipoChart, titulo, datos);
    
    // Crear chart
    chartAmpliado = new Chart(ctx, {
        type: tipoChart,
        data: {
            labels: labelsFormateados,
            datasets: datasets3D
        },
        options: opcionesChart
    });
}

// FUNCIÓN AUXILIAR: Crear gráfica simple - VERSIÓN CORREGIDA
function crearGraficaSimpleModal(ctx, datos, tipoGrafica, titulo) {
    console.log('🎨 Creando gráfica SIMPLE para', tipoActual);
    
    // Preparar datos
    let labelsOriginales = datos.labels || [];
    let valoresParaGrafica = datos.values || [];
    
    if (labelsOriginales.length === 0 || valoresParaGrafica.length === 0) {
        console.error('❌ No hay datos para mostrar');
        mostrarMensajeSinDatos('No hay datos disponibles');
        return;
    }

    // Generar colores con labels ORIGINALES (antes de formatear)
    const colors = generarColores(tipoActual, labelsOriginales);
    
    // Formatear labels SOLO para mostrar
    let labelsParaMostrar = [...labelsOriginales]; // Copia
    if (tipoActual === 'genero') {
        labelsParaMostrar = labelsParaMostrar.map(formatearGenero);
    } else if (tipoActual === 'fecha') {
        labelsParaMostrar = labelsParaMostrar.map(formatearFechaCorta);
    }
    
    // DECIDIR TIPO DE GRÁFICA
    const tipoChart = determinarTipoChart(tipoGrafica, datos);
    
    // Configurar opciones según tipo de chart
    const opcionesChart = obtenerOpcionesChartSimple(tipoChart, titulo);
    
    // Crear dataset
    const dataset = {
        label: "Total de Visitantes",
        data: valoresParaGrafica,
        backgroundColor: colors,
        borderColor: colors.map(color => darkenColor(color, 0.3)),
        borderWidth: tipoChart === "bar" ? 2 : 3,
        borderRadius: tipoChart === "bar" ? 10 : 0,
        barThickness: tipoChart === "bar" ? 25 : undefined,
        hoverBorderWidth: tipoChart === "bar" ? 3 : 4,
        hoverBackgroundColor: colors.map(color => lightenColor(color, 0.1)),
    };
    
    chartAmpliado = new Chart(ctx, {
        type: tipoChart,
        data: {
            labels: labelsParaMostrar,
            datasets: [dataset]
        },
        options: opcionesChart
    });
}

// FUNCIÓN AUXILIAR: Determinar tipo de chart - VERSIÓN MEJORADA
function determinarTipoChart(tipoGrafica, datos) {
    // Si el usuario específicamente pidió doughnut/pie, respetarlo (excepto para datos agrupados grandes)
    if (tipoGrafica === "pie" || tipoGrafica === "doughnut") {
        // Para datos agrupados con muchos períodos, no usar doughnut
        if (datos.type === 'grouped' && datos.labels && datos.labels.length > 6) {
            console.log('⚠️ Demasiados períodos para doughnut, usando bar');
            return "bar";
        }
        // Para datos simples con muchas categorías (>8), usar bar
        if (datos.labels && datos.labels.length > 8) {
            console.log('⚠️ Demasiadas categorías para doughnut, usando bar');
            return "bar";
        }
        return tipoGrafica;
    }
    
    // Por defecto: bar para datos agrupados, respetar tipoGrafica para simples
    if (datos.type === 'grouped') {
        return "bar";
    }
    
    // Para datos simples, usar lo que pidió el usuario
    return tipoGrafica === "pie" ? "pie" : "bar";
}

// FUNCIÓN AUXILIAR: Obtener opciones para chart agrupado
function obtenerOpcionesChartAgrupado(tipoChart, titulo, datos) {
    const esBar = tipoChart === "bar";
    const etiquetaDescriptiva = obtenerEtiquetaDescriptiva(tipoActual);
    
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    padding: 15,
                    usePointStyle: true,
                    pointStyle: 'circle',
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
                backgroundColor: 'rgba(0,0,0,0.8)',
                titleFont: { size: 14 },
                bodyFont: { size: 14 },
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                    title: function(tooltipItems) {
                        if (tipoActual === 'fecha') {
                            return `Fecha: ${formatearFecha(tooltipItems[0].label)}`;
                        } else if (tipoActual === 'anio') {
                            return `Año: ${tooltipItems[0].label}`;
                        } else if (tipoActual === 'mes') {
                            return `Mes: ${tooltipItems[0].label}`;
                        }
                        return tooltipItems[0].label;
                    },
                    label: function(context) {
                        const index = context.dataIndex;
                        let totalPeriodo = 0;
                        
                        if (tipoActual === 'fecha' && datos.totalPorFecha) {
                            totalPeriodo = datos.totalPorFecha[index] || 0;
                        } else if (tipoActual === 'anio' && datos.totalPorAño) {
                            totalPeriodo = datos.totalPorAño[index] || 0;
                        } else if (tipoActual === 'mes' && datos.totalPorMes) {
                            totalPeriodo = datos.totalPorMes[index] || 0;
                        } else {
                            totalPeriodo = datos.datasets.reduce((sum, dataset) => 
                                sum + (dataset.data[index] || 0), 0);
                        }
                        
                        const valor = context.parsed.y;
                        const porcentaje = totalPeriodo > 0 ? Math.round((valor / totalPeriodo) * 100) : 0;
                        return `${context.dataset.label}: ${valor} visitantes (${porcentaje}%)`;
                    }
                }
            }
        },
        scales: esBar ? {
            y: {
                beginAtZero: true,
                grid: { 
                    color: 'rgba(0,0,0,0.1)',
                    drawBorder: false
                },
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
                    text: etiquetaDescriptiva,
                    font: { weight: 'bold', size: 14 }
                },
                ticks: {
                    maxRotation: 45,
                    minRotation: 0
                }
            }
        } : {},
        cutout: esBar ? '0%' : '40%',
        rotation: esBar ? 0 : -25,
        animation: {
            duration: 1000,
            easing: 'easeOutQuart',
            animateRotate: !esBar,
            animateScale: true
        }
    };
}

// FUNCIÓN AUXILIAR: Obtener opciones para chart simple
function obtenerOpcionesChartSimple(tipoChart, titulo) {
    const esBar = tipoChart === "bar";
    const etiquetaDescriptiva = obtenerEtiquetaDescriptiva(tipoActual);
    
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: esBar ? 'top' : 'right',
                labels: {
                    padding: 15,
                    usePointStyle: true,
                    pointStyle: 'circle',
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
                backgroundColor: 'rgba(0,0,0,0.8)',
                titleFont: { size: 14 },
                bodyFont: { size: 14 },
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const value = context.parsed.y || context.parsed;
                        const datasetTotal = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = datasetTotal > 0 ? Math.round((value / datasetTotal) * 100) : 0;
                        return `${label}: ${value.toLocaleString()} visitantes (${percentage}%)`;
                    }
                }
            }
        },
        scales: esBar ? {
            y: {
                beginAtZero: true,
                grid: { 
                    color: 'rgba(0,0,0,0.1)',
                    drawBorder: false
                },
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
                    text: etiquetaDescriptiva,
                    font: { weight: 'bold', size: 14 }
                },
                ticks: {
                    maxRotation: 45,
                    minRotation: 0
                }
            }
        } : {},
        cutout: esBar ? '0%' : '50%',
        rotation: esBar ? 0 : -25,
        animation: {
            duration: 1000,
            easing: 'easeOutQuart',
            animateRotate: !esBar,
            animateScale: true
        }
    };
}

// FUNCIÓN AUXILIAR: Aplicar efectos 3D al modal
function aplicarEfectos3DModal() {
    const modalCanvas = document.getElementById("chartAmpliado");
    if (modalCanvas) {
        modalCanvas.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)';
        modalCanvas.style.borderRadius = '15px';
        modalCanvas.style.background = 'linear-gradient(145deg, #ffffff, #f8f9fa)';
        modalCanvas.style.padding = '20px';
    }
}

// Función para actualizar tabla con datos agrupados en el modal
function actualizarTablaDatosAgrupadosModal(datos, tipo) {
    const tbody = document.querySelector("#tablaDatos tbody");
    if (!tbody) {
        console.error('❌ No se encontró tbody en tablaDatos');
        return;
    }
    
    let tablaHTML = '';
    const totalGeneral = datos.totalGeneral || 0;
    
    console.log(`📊 Actualizando tabla para ${tipo} con`, datos.labels.length, 'períodos');
    
    // Para cada período (fecha, año, mes)
    datos.labels.forEach((periodo, periodoIndex) => {
        let totalPeriodo = 0;
        
        // Calcular total por período
        if (tipo === 'fecha' && datos.totalPorFecha) {
            totalPeriodo = datos.totalPorFecha[periodoIndex] || 0;
        } else if (tipo === 'anio' && datos.totalPorAño) {
            totalPeriodo = datos.totalPorAño[periodoIndex] || 0;
        } else if (tipo === 'mes' && datos.totalPorMes) {
            totalPeriodo = datos.totalPorMes[periodoIndex] || 0;
        } else {
            // Calcular sumando todos los datasets
            totalPeriodo = datos.datasets.reduce((sum, dataset) => 
                sum + (dataset.data[periodoIndex] || 0), 0);
        }
        
        if (totalPeriodo > 0) {
            // Formatear el período para mostrar
            let periodoFormateado = periodo;
            if (tipo === 'fecha') {
                periodoFormateado = formatearFechaCorta(periodo);
            } else if (tipo === 'anio') {
                periodoFormateado = `Año ${periodo}`;
            }
            
            // Encabezado de período
            tablaHTML += `
                <tr style="background: linear-gradient(145deg, #f8f9fa, #e9ecef);">
                    <td colspan="3" style="font-weight: bold; color: #2c3e50; padding: 12px; border-bottom: 2px solid #dee2e6;">
                        <i class="fas ${tipo === 'fecha' ? 'fa-calendar-day' : tipo === 'anio' ? 'fa-calendar-alt' : 'fa-calendar-week'}"></i> 
                        ${periodoFormateado} - Total: ${totalPeriodo} visitantes
                    </td>
                </tr>
            `;
            
            // Detalle por género para este período
            datos.datasets.forEach(dataset => {
                const valor = dataset.data[periodoIndex] || 0;
                if (valor > 0) {
                    const porcentaje = totalPeriodo > 0 ? ((valor / totalPeriodo) * 100).toFixed(1) : 0;
                    const claseGenero = obtenerClaseGenero(dataset.label.toLowerCase());
                    
                    tablaHTML += `
                        <tr>
                            <td style="padding-left: 30px;">
                                <span class="gender-badge-3d ${claseGenero}">
                                    <i class="fas ${dataset.label === 'Masculino' ? 'fa-mars' : dataset.label === 'Femenino' ? 'fa-venus' : 'fa-genderless'}"></i>
                                    ${formatearGenero(dataset.label)}
                                </span>
                            </td>
                            <td style="text-align: center; font-weight: bold">${valor.toLocaleString()}</td>
                            <td style="text-align: center; color: #2c3e50; font-weight: bold">${porcentaje}%</td>
                        </tr>
                    `;
                }
            });
        }
    });
    
    // Fila de total general
    if (totalGeneral > 0) {
        tablaHTML += `
            <tr style="background: linear-gradient(135deg, #a8e6cf, #dcedc1); font-weight: bold;">
                <td colspan="2" style="padding: 12px; border-top: 2px solid #2ecc71;">
                    <i class="fas fa-chart-bar"></i> TOTAL GENERAL
                </td>
                <td style="text-align: center; border-top: 2px solid #2ecc71;">${totalGeneral.toLocaleString()}</td>
            </tr>
        `;
    }
    
    tbody.innerHTML = tablaHTML;
}

// Función para actualizar tabla con datos simples en el modal
function actualizarTablaDatosSimplesModal(datos, tipo, total) {
    const tbody = document.querySelector("#tablaDatos tbody");
    if (!tbody) return;
    
    let tablaHTML = '';
    
    if (datos.labels && datos.values) {
        tablaHTML = datos.labels
            .map((label, index) => {
                const valor = datos.values[index] || 0;
                const porcentaje = total > 0 ? ((valor / total) * 100).toFixed(1) : 0;
                
                if (tipo === 'genero') {
                    const claseGenero = obtenerClaseGenero(label.toLowerCase());
                    const generoFormateado = formatearGenero(label);
                    
                    return `<tr>
                        <td>
                            <span class="gender-badge-3d ${claseGenero}">
                                <i class="fas ${label === 'Masculino' ? 'fa-mars' : label === 'Femenino' ? 'fa-venus' : 'fa-genderless'}"></i>
                                ${generoFormateado}
                            </span>
                        </td>
                        <td style="text-align: center;"><strong>${valor.toLocaleString()}</strong></td>
                        <td style="text-align: center; color: #2c3e50; font-weight: bold">${porcentaje}%</td>
                    </tr>`;
                } else {
                    return `<tr>
                        <td><strong>${label}</strong></td>
                        <td style="text-align: center;"><strong>${valor.toLocaleString()}</strong></td>
                        <td style="text-align: center; color: #2c3e50; font-weight: bold">${porcentaje}%</td>
                    </tr>`;
                }
            })
            .join('');
    }
    
    // Fila de total
    if (total > 0) {
        tablaHTML += `
            <tr style="background: linear-gradient(135deg, #a8e6cf, #dcedc1); font-weight: bold;">
                <td style="padding: 12px;">
                    <i class="fas fa-users"></i> TOTAL
                </td>
                <td style="text-align: center;">${total.toLocaleString()}</td>
                <td style="text-align: center;">100%</td>
            </tr>
        `;
    }
    
    tbody.innerHTML = tablaHTML;
}

// Función para cerrar modal
function cerrarModal() {
    console.log('🔒 Cerrando modal');
    document.getElementById("chartModal").classList.remove("show");
    
    // Limpiar filtros
    const filtrosAnteriores = document.getElementById('filtrosModal');
    if (filtrosAnteriores) {
        filtrosAnteriores.remove();
    }
}

// Función para descargar gráfico como PNG
function descargarPNG() {
    if (!chartAmpliado) {
        mostrarMensajeSinDatos('No hay gráfica para descargar');
        return;
    }
    
    const link = document.createElement('a');
    link.download = `grafica-${tipoActual}-${new Date().toISOString().slice(0,10)}.png`;
    link.href = chartAmpliado.toBase64Image();
    link.click();
    
    mostrarExito('Gráfico descargado como PNG');
}

// Función para descargar datos como Excel
function descargarExcel() {
    const datos = datosSimulados[tipoActual];
    if (!datos) {
        mostrarMensajeSinDatos('No hay datos para descargar');
        return;
    }
    
    try {
        let datosExcel = [];
        
        if (datos.type === 'grouped' && datos.datasets) {
            // Para datos agrupados
            datos.labels.forEach((label, index) => {
                const fila = { 'Período': label };
                
                datos.datasets.forEach(dataset => {
                    fila[dataset.label] = dataset.data[index] || 0;
                });
                
                datosExcel.push(fila);
            });
        } else if (datos.labels && datos.values) {
            // Para datos simples
            datos.labels.forEach((label, index) => {
                datosExcel.push({
                    'Categoría': label,
                    'Cantidad': datos.values[index] || 0
                });
            });
        }
        
        const ws = XLSX.utils.json_to_sheet(datosExcel);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Datos');
        XLSX.writeFile(wb, `datos-${tipoActual}-${new Date().toISOString().slice(0,10)}.xlsx`);
        
        mostrarExito('Datos descargados como Excel');
    } catch (error) {
        console.error('Error descargando Excel:', error);
        mostrarMensajeSinDatos('Error al descargar los datos');
    }
}

// Agregar CSS para efectos 3D
function agregarCSS3D() {
    const style = document.createElement('style');
    style.textContent = `
        .chart-container {
            perspective: 1000px;
        }

        canvas {
            transition: all 0.3s ease;
            transform-style: preserve-3d;
        }

        canvas:hover {
            transform: translateY(-5px) rotateX(5deg);
            box-shadow: 0 15px 35px rgba(0,0,0,0.2) !important;
        }

        .chart-bar-3d {
            background: linear-gradient(145deg, #ffffff, #f8f9fa);
            border-radius: 15px;
            padding: 20px;
            box-shadow: 
                0 10px 30px rgba(0,0,0,0.1),
                inset 0 1px 0 rgba(255,255,255,0.8);
        }

        .gender-badge-3d {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-weight: 600;
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
            transform: translateZ(0);
            transition: all 0.3s ease;
            border: 2px solid transparent;
        }

        .gender-badge-3d:hover {
            transform: translateY(-2px) translateZ(10px);
            box-shadow: 0 6px 15px rgba(0,0,0,0.2);
            border-color: rgba(255,255,255,0.5);
        }

        .modal-3d {
            background: rgba(0,0,0,0.7);
            backdrop-filter: blur(10px);
        }

        .modal-content-3d {
            background: linear-gradient(145deg, #ffffff, #f8f9fa);
            border-radius: 20px;
            box-shadow: 0 25px 50px rgba(0,0,0,0.3);
            border: none;
            transform-style: preserve-3d;
        }
        
        /* Estilos para filtros en modal */
        #filtrosModal {
            margin-bottom: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #e9ecef;
        }
        
        .filtro-grupo {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .filtro-grupo label {
            font-weight: 600;
            color: #2c3e50;
            white-space: nowrap;
        }
        
        .filtro-grupo select,
        .filtro-grupo input[type="date"] {
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 0.9rem;
            min-width: 150px;
        }
        
        .btn-aplicar-filtro {
            background: #3498db;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: background 0.3s;
        }
        
        .btn-aplicar-filtro:hover {
            background: #2980b9;
        }
        
        .btn-limpiar-filtro {
            background: #95a5a6;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.85rem;
        }
        
        .btn-limpiar-filtro:hover {
            background: #7f8c8d;
        }
    `;
    document.head.appendChild(style);
}

// Llamar esta función al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('📦 Cargando efectos 3D...');
    agregarCSS3D();
    console.log('✅ Chart-functions.js cargado correctamente');
});

// Función auxiliar para formatear fecha (si no existe en data-functions.js)
function formatearFechaParaTabla(fechaStr) {
    try {
        const fecha = new Date(fechaStr);
        return fecha.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch (error) {
        return fechaStr;
    }
}