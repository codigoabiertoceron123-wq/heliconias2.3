// Variables globales
let chartBar, chartPie, chartAmpliado;
let tipoActual = "genero";
let datosGeneros = [];
let datosSimulados = {};
let datosOriginales = {};

// Paletas de colores por género
const coloresPorGenero = {
    'Masculino': '#3498db',
    'Femenino': '#e74c3c',
    'Otro': '#27ae60',
    'Prefiero no decirlo': '#f39c12'
};

// Paletas de colores para otros tipos
const colorPalettes = {
    fecha: [
        '#3498db', '#e67e22', '#9b59b6', '#1abc9c', '#e74c3c',
        '#f1c40f', '#34495e', '#d35400', '#8e44ad', '#16a085'
    ],
    dia: [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8'
    ],
    mes: [
        '#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6',
        '#1abc9c', '#d35400', '#34495e'
    ],
    anio: [
        '#3498db', '#e67e22', '#2ecc71', '#9b59b6', '#f1c40f'
    ],
    intereses: [
        '#27ae60', '#3498db', '#f39c12', '#9b59b6', '#e74c3c'
    ]
};

// Función para generar colores según el tipo
function generarColores(tipo, labels) {
    if (tipo === 'genero') {
        return labels.map(label => coloresPorGenero[label] || '#95a5a6');
    } else if (tipo === 'intereses') {
        const coloresIntereses = {
            'Observación': '#27ae60',
            'Fotografía': '#3498db',
            'Investigación': '#f39c12',
            'Educación': '#9b59b6',
            'Recreación': '#e74c3c'
        };
        return labels.map(label => coloresIntereses[label] || '#95a5a6');
    } else {
        const palette = colorPalettes[tipo] || colorPalettes.fecha;
        const cols = [];
        for(let i = 0; i < labels.length; i++) {
            cols.push(palette[i % palette.length]);
        }
        return cols;
    }
}

// Función auxiliar para procesar cualquier período (fecha, mes, año) de manera consistente
async function procesarDatosPorPeriodo(tipoPeriodo, fechaInicial, fechaFinal, generoSeleccionado = 'todos') {
    console.log(`📊 Procesando ${tipoPeriodo}:`, { fechaInicial, fechaFinal, generoSeleccionado });
    
    try {
        // CONSULTA base para obtener datos
        const { data: participantes, error } = await supabase
            .from('participantes_reserva')
            .select(`
                fecha_visita,
                genero!inner(id_genero, genero)
            `)
            .not('fecha_visita', 'is', null)
            .not('id_genero', 'is', null)
            .gte('fecha_visita', fechaInicial + 'T00:00:00')
            .lte('fecha_visita', fechaFinal + 'T23:59:59')
            .order('fecha_visita', { ascending: true });

        if (error) throw error;

        if (!participantes || participantes.length === 0) {
            return { type: 'grouped', labels: [], datasets: [], totalGeneral: 0 };
        }

        // Obtener todos los géneros
        const { data: generos } = await supabase
            .from('genero')
            .select('id_genero, genero')
            .order('id_genero');

        // Determinar formato de etiquetas según tipoPeriodo
        const formatearEtiqueta = (fechaStr) => {
            const fecha = new Date(fechaStr);
            switch(tipoPeriodo) {
                case 'fecha':
                    return formatearFechaCorta(fechaStr); // 20-ene
                case 'mes':
                    return `${obtenerNombreMesAbreviado(fecha.getMonth())}-${fecha.getFullYear()}`; // ene-2024
                case 'anio':
                    return fecha.getFullYear().toString(); // 2024
                default:
                    return fechaStr;
            }
        };

        // Agrupar por período y género
        const datosPorPeriodo = {};
        const periodosUnicos = new Set();
        const todosLosGeneros = generos.map(g => g.genero);
        
        // Inicializar estructura
        participantes.forEach(participante => {
            if (participante.fecha_visita && participante.genero) {
                const periodo = formatearEtiqueta(participante.fecha_visita);
                const genero = participante.genero.genero;
                
                periodosUnicos.add(periodo);
                
                if (!datosPorPeriodo[periodo]) {
                    datosPorPeriodo[periodo] = {};
                    todosLosGeneros.forEach(g => {
                        datosPorPeriodo[periodo][g] = 0;
                    });
                }
                
                if (datosPorPeriodo[periodo][genero] !== undefined) {
                    datosPorPeriodo[periodo][genero]++;
                }
            }
        });

        // Ordenar períodos cronológicamente
        const periodosOrdenados = Array.from(periodosUnicos).sort((a, b) => {
            // Convertir a fecha para ordenar correctamente
            const getDateFromPeriod = (periodo) => {
                if (tipoPeriodo === 'anio') {
                    return new Date(periodo, 0, 1);
                } else if (tipoPeriodo === 'mes') {
                    const [mes, año] = periodo.split('-');
                    const mesNum = obtenerNumeroMes(mes);
                    return new Date(año, mesNum, 1);
                } else {
                    // Para fecha, usar el primer día del mes
                    const partes = periodo.split('-');
                    if (partes.length === 2) {
                        const dia = parseInt(partes[0]);
                        const mes = obtenerNumeroMes(partes[1]);
                        return new Date(new Date().getFullYear(), mes, dia);
                    }
                    return new Date();
                }
            };
            return getDateFromPeriod(a) - getDateFromPeriod(b);
        });

        // Crear datasets para cada género
        const datasets = todosLosGeneros.map(genero => {
            const color = coloresPorGenero[genero] || '#95a5a6';
            return {
                label: genero,
                data: periodosOrdenados.map(periodo => datosPorPeriodo[periodo]?.[genero] || 0),
                backgroundColor: color,
                borderColor: darkenColor(color, 0.3),
                borderWidth: 2,
                borderRadius: 6,
                barThickness: tipoPeriodo === 'anio' ? 25 : 20,
                barPercentage: 0.8,
                categoryPercentage: 0.9
            };
        });

        // Filtrar si es género específico
        let datasetsFinales = datasets;
        if (generoSeleccionado !== 'todos') {
            const generoDataset = datasets.find(d => d.label === generoSeleccionado);
            datasetsFinales = generoDataset ? [{
                ...generoDataset,
                label: formatearGenero(generoSeleccionado),
                backgroundColor: coloresPorGenero[generoSeleccionado] || '#3498db'
            }] : datasets;
        }

        // Calcular totales
        const totalPorPeriodo = periodosOrdenados.map(periodo => 
            todosLosGeneros.reduce((sum, genero) => sum + (datosPorPeriodo[periodo]?.[genero] || 0), 0)
        );
        
        const totalGeneral = totalPorPeriodo.reduce((a, b) => a + b, 0);

        return {
            type: 'grouped',
            labels: periodosOrdenados,
            datasets: datasetsFinales,
            totalPorPeriodo: totalPorPeriodo,
            totalGeneral: totalGeneral,
            generos: todosLosGeneros,
            generoFiltrado: generoSeleccionado !== 'todos' ? generoSeleccionado : null
        };

    } catch (error) {
        console.error(`💥 Error procesando ${tipoPeriodo}:`, error);
        throw error;
    }
}

// Función auxiliar para obtener número de mes
function obtenerNumeroMes(mesAbrev) {
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 
                   'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return meses.indexOf(mesAbrev.toLowerCase());
}


// Función para obtener etiqueta descriptiva
function obtenerEtiquetaDescriptiva(tipo) {
    const etiquetas = {
        genero: 'Género',
        fecha: 'Fecha de Visita',
        dia: 'Día de la Semana',
        mes: 'Mes del Año',
        anio: 'Año',
        intereses: 'Interés Principal'
    };
    return etiquetas[tipo] || 'Categoría';
}

// Función para obtener título descriptivo
function obtenerTituloDescriptivo(tipo) {
    const titulos = {
        genero: 'Visitantes por Género',
        fecha: 'Visitantes por Fecha',
        dia: 'Visitantes por Día',
        mes: 'Visitantes por Mes',
        anio: 'Visitantes por Año',
        intereses: 'Visitantes por Interés en Heliconias'
    };
    return titulos[tipo] || 'Distribución de Visitantes';
}

// Función para obtener clase CSS por género
function obtenerClaseGenero(genero) {
    const g = genero.trim().toLowerCase();
    const clases = {
        'masculino': 'masculino',
        'femenino': 'femenino',
        'otro': 'otro',
        'prefiero no decirlo': 'prefiero-no-decirlo',
        'prefiero no decir': 'prefiero-no-decirlo', // <-- agrega esta variante
    };
    return clases[g] || 'prefiero-no-decirlo'; // fallback seguro
}

// Función para obtener clase CSS por interés
function obtenerClaseInteres(interes) {
    const clases = {
        'Observación': 'observacion',
        'Fotografía': 'fotografia',
        'Investigación': 'investigacion',
        'Educación': 'educacion',
        'Recreación': 'recreacion'
    };
    return clases[interes] || 'observacion';
}

// Función para formatear texto de género
function formatearGenero(genero) {
    const formatos = {
        'masculino': 'Masculino',
        'femenino': 'Femenino',
        'otro': 'Otro',
        'prefiero no decirlo': 'Prefiero no decirlo'
    };
    return formatos[genero.toLowerCase()] || genero;
}

// Función para formatear fecha
function formatearFecha(fechaStr) {
    if (!fechaStr) return 'Fecha inválida';
    
    try {
        const fecha = new Date(fechaStr);
        
        if (isNaN(fecha.getTime())) {
            console.warn('Fecha inválida:', fechaStr);
            return 'Fecha inválida';
        }
        
        return fecha.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric'
        });
    } catch (error) {
        console.error('Error formateando fecha:', fechaStr, error);
        return 'Fecha inválida';
    }
}

// Función para formatear fecha corta (como en la imagen: 20-ene)
function formatearFechaCorta(fechaStr) {
    if (!fechaStr) return 'Fecha inválida';
    
    try {
        // Si ya está en formato "23-ene", devolverlo tal cual
        if (typeof fechaStr === 'string' && /^\d{1,2}-\w{3}$/.test(fechaStr)) {
            return fechaStr;
        }
        
        // Si es una fecha ISO completa
        const fecha = new Date(fechaStr);
        
        if (isNaN(fecha.getTime())) {
            console.warn('Fecha inválida:', fechaStr);
            return 'Fecha inválida';
        }
        
        const dia = fecha.getDate();
        const mes = fecha.toLocaleDateString('es-ES', { month: 'short' });
        return `${dia}-${mes}`;
    } catch (error) {
        console.error('Error formateando fecha corta:', fechaStr, error);
        return 'Fecha inválida';
    }
}

// También mejora formatearFecha() para mayor robustez:
function formatearFecha(fechaStr) {
    if (!fechaStr) return 'Fecha inválida';
    
    try {
        // Si ya está en formato "23-ene", convertirlo a fecha completa
        if (typeof fechaStr === 'string' && /^\d{1,2}-\w{3}$/.test(fechaStr)) {
            const [dia, mesAbrev] = fechaStr.split('-');
            const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 
                          'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
            const mesNum = meses.indexOf(mesAbrev.toLowerCase());
            
            if (mesNum === -1) return fechaStr;
            
            // Asumir año actual
            const ahora = new Date();
            const fecha = new Date(ahora.getFullYear(), mesNum, parseInt(dia));
            
            return fecha.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric'
            });
        }
        
        // Si es una fecha ISO
        const fecha = new Date(fechaStr);
        
        if (isNaN(fecha.getTime())) {
            console.warn('Fecha inválida:', fechaStr);
            return 'Fecha inválida';
        }
        
        return fecha.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric'
        });
    } catch (error) {
        console.error('Error formateando fecha:', fechaStr, error);
        return 'Fecha inválida';
    }
}

// Función para obtener nombre del mes
function obtenerNombreMes(mes) {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return meses[mes] || 'Mes desconocido';
}

// Función para obtener nombre del mes abreviado
function obtenerNombreMesAbreviado(mes) {
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 
                'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return meses[mes] || 'mes';
}

// Función para obtener nombre del mes desde string de fecha
function obtenerNombreMesDesdeFecha(fechaStr) {
    try {
        const fecha = new Date(fechaStr);
        if (isNaN(fecha.getTime())) return 'Mes desconocido';
        return obtenerNombreMes(fecha.getMonth());
    } catch (error) {
        return 'Mes desconocido';
    }
}

// Función para obtener año desde string de fecha
function obtenerAnioDesdeFecha(fechaStr) {
    try {
        const fecha = new Date(fechaStr);
        if (isNaN(fecha.getTime())) return 'Año desconocido';
        return fecha.getFullYear().toString();
    } catch (error) {
        return 'Año desconocido';
    }
}

// Función para obtener mes y año desde string de fecha
function obtenerMesYAnioDesdeFecha(fechaStr) {
    try {
        const fecha = new Date(fechaStr);
        if (isNaN(fecha.getTime())) return 'Fecha inválida';
        const mes = obtenerNombreMes(fecha.getMonth());
        const año = fecha.getFullYear();
        return { mes, año };
    } catch (error) {
        return { mes: 'Mes desconocido', año: 'Año desconocido' };
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
// data-functions.js - Versión con mejor validación
async function cargarDatosGeneros() {
    try {
        console.log('=== INICIANDO CARGA DE DATOS ===');
        
        // Intentar obtener el cliente de diferentes maneras
        let supabaseClient = null;
        
        // Opción 1: window.supabaseClient
        if (window.supabaseClient && typeof window.supabaseClient.from === 'function') {
            supabaseClient = window.supabaseClient;
            console.log('✅ Usando window.supabaseClient');
        }
        // Opción 2: window.supabase
        else if (window.supabase && typeof window.supabase.from === 'function') {
            supabaseClient = window.supabase;
            console.log('✅ Usando window.supabase');
        }
        // Opción 3: crear nuevo cliente
        else {
            console.warn('⚠️ Cliente Supabase no encontrado, creando uno nuevo...');
            const SUPABASE_URL = 'https://umncnddwzmjxgmvisvqz.supabase.co';
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtbmNuZGR3em1qeGdtdmlzdnF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NDIyNzksImV4cCI6MjA3ODExODI3OX0.ODvus28cTCTD8gGewQ2sAZ8PcXbEe4CIy_zv6bip8J0';
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            window.supabaseClient = supabaseClient;
            window.supabase = supabaseClient;
        }
        
        // Verificación final
        if (!supabaseClient || typeof supabaseClient.from !== 'function') {
            throw new Error('Supabase no está inicializado correctamente. from no es una función.');
        }
        
        console.log('✅ Cliente Supabase verificado, procediendo a cargar datos...');
        
        // Obtener datos de género
        const { data: generos, error: generosError } = await supabaseClient
            .from('genero')
            .select('*');
        
        if (generosError) {
            throw new Error('Error cargando géneros: ' + generosError.message);
        }
        
        console.log('✅ Géneros cargados:', generos);
        
        // Obtener participantes
        const { data: participantes, error: participantesError } = await supabaseClient
            .from('participantes_reserva')
            .select('id_genero')
            .not('id_genero', 'is', null);
        
        if (participantesError) {
            throw new Error('Error cargando participantes: ' + participantesError.message);
        }
        
        console.log('✅ Participantes cargados:', participantes.length);
        
        // Procesar datos
        const conteoGeneros = {};
        participantes.forEach(p => {
            if (p.id_genero) {
                conteoGeneros[p.id_genero] = (conteoGeneros[p.id_genero] || 0) + 1;
            }
        });
        
        console.log('📊 Conteo por género:', conteoGeneros);
        
        // Crear mapeo de nombres
        const nombresGenero = {};
        if (generos && generos.length > 0) {
            generos.forEach(g => {
                nombresGenero[g.id_genero] = g.nombre_genero || `Género ${g.id_genero}`;
            });
        } else {
            // Mapeo por defecto si no hay datos en tabla genero
            nombresGenero[1] = 'Masculino';
            nombresGenero[2] = 'Femenino';
            nombresGenero[3] = 'No binario';
            nombresGenero[4] = 'Prefiero no decir';
            nombresGenero[5] = 'Otro';
        }
        
        // Mostrar resultados
        mostrarResultadosGenero(conteoGeneros, nombresGenero);
        
    } catch (error) {
        console.error('❌ Error cargando géneros:', error);
        mostrarError('Error al cargar datos: ' + error.message);
    }
}

// Función para mostrar resultados (sin cambios, pero añadimos verificación)
function mostrarResultadosGenero(conteoGeneros, nombresGenero) {
    const total = Object.values(conteoGeneros).reduce((a, b) => a + b, 0);
    const dataContainer = document.getElementById('data-container');
    
    if (!dataContainer) {
        console.error('❌ data-container no encontrado');
        return;
    }
    
    console.log('📊 Mostrando resultados, total:', total);
    
    // Actualizar tarjetas
    const totalVisitantesSpan = document.getElementById('total-visitantes');
    const distribucionGenero = document.getElementById('distribucion-genero');
    const totalGeneros = document.getElementById('total-generos');
    
    if (totalVisitantesSpan) totalVisitantesSpan.textContent = total;
    if (totalGeneros) totalGeneros.textContent = Object.keys(conteoGeneros).length;
    
    // Crear gráfico
    const labels = [];
    const values = [];
    
    Object.keys(conteoGeneros).forEach(id => {
        labels.push(nombresGenero[id] || `Género ${id}`);
        values.push(conteoGeneros[id]);
    });
    
    // Mostrar distribución porcentual
    if (distribucionGenero && values.length > 0) {
        const maxValue = Math.max(...values);
        const maxIndex = values.indexOf(maxValue);
        const porcentaje = ((maxValue / total) * 100).toFixed(1);
        distribucionGenero.textContent = `${porcentaje}% (${labels[maxIndex]})`;
    }
    
    // Crear gráfico de torta
    const ctx = document.createElement('canvas');
    dataContainer.innerHTML = '';
    ctx.id = 'genderChart';
    ctx.style.maxWidth = '400px';
    ctx.style.margin = '20px auto';
    dataContainer.appendChild(ctx);
    
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const porcentaje = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${porcentaje}%)`;
                        }
                    }
                }
            }
        }
    });
    
    console.log('✅ Gráfico creado correctamente');
}

// Función para mostrar errores
function mostrarError(mensaje) {
    console.error('❌', mensaje);
    const dataContainer = document.getElementById('data-container');
    if (dataContainer) {
        dataContainer.innerHTML = `<div style="color: red; padding: 20px; text-align: center;">
            <i class="fas fa-exclamation-triangle"></i><br>
            ${mensaje}
        </div>`;
    }
}

// Función para cargar datos desde participantes_reserva
async function cargarDatosDesdeParticipantes(generos) {
    try {
        console.log('=== DIAGNÓSTICO: Consultando participantes_reserva ===');
        
        // PRIMERO: Consulta directa a participantes_reserva con fecha_visita
        const { data: participantes, error } = await supabase
            .from('participantes_reserva')
            .select('id_genero, fecha_visita')
            .not('id_genero', 'is', null);

        if (error) {
            console.error('❌ Error en consulta simple:', error);
            throw error;
        }

        console.log('✅ Participantes encontrados:', participantes);
        console.log('Total de participantes con género:', participantes.length);

        // Contar participantes por género y procesar fechas
        const conteoPorGenero = {};
        const fechasVisitas = [];
        
        participantes.forEach(participante => {
            if (participante.id_genero) {
                const generoId = participante.id_genero;
                conteoPorGenero[generoId] = (conteoPorGenero[generoId] || 0) + 1;
                
                // Obtener la fecha de visita directamente de participantes_reserva
                if (participante.fecha_visita) {
                    fechasVisitas.push({
                        fecha: participante.fecha_visita,
                        generoId: participante.id_genero
                    });
                }
            }
        });

        console.log('📊 Conteo REAL por género:', conteoPorGenero);
        console.log('📅 Fechas REALES de visita:', fechasVisitas);

        // Combinar datos de géneros con conteos REALES
        const datosCombinados = generos.map(genero => {
            return {
                genero: genero.genero,
                count: conteoPorGenero[genero.id_genero] || 0
            };
        });

        console.log('🎯 Datos combinados REALES:', datosCombinados);
        
        // Verificar si hay datos
        const totalVisitantes = datosCombinados.reduce((sum, item) => sum + item.count, 0);
        console.log('👥 Total de visitantes con género:', totalVisitantes);

        if (totalVisitantes === 0) {
            console.warn('⚠️  No se encontraron participantes con género en la base de datos');
            throw new Error('No hay datos reales');
        } else {
            procesarDatosGeneros(datosCombinados);
            
            // Procesar datos adicionales con las fechas reales
            if (fechasVisitas.length === 0) {
                console.warn('⚠️  No se encontraron fechas de visita');
                // Usar solo datos de género sin fechas
                await cargarDatosAdicionalesReales([], generos);
            } else {
                await cargarDatosAdicionalesReales(fechasVisitas, generos);
            }
        }

    } catch (error) {
        console.error('💥 Error crítico cargando datos desde participantes:', error);
        throw error;
    }
}

// Función para procesar datos de géneros
function procesarDatosGeneros(datosGenero) {
    console.log('Procesando datos de géneros...', datosGenero);
    
    // Extraer labels y valores directamente de los datos combinados
    const labelsGenero = [];
    const valuesGenero = [];
    let totalConGenero = 0;

    datosGenero.forEach(item => {
        if (item.genero) {
            labelsGenero.push(item.genero);
            valuesGenero.push(item.count);
            totalConGenero += item.count;
        }
    });

    console.log('Datos procesados de géneros:', { labelsGenero, valuesGenero });

    const totalGeneros = labelsGenero.length;
    const maxGenero = Math.max(...valuesGenero);
    const distribucion = totalConGenero > 0 ? Math.round((maxGenero / totalConGenero) * 100) : 0;

    // Actualizar estadísticas
    document.getElementById('total-visitantes').textContent = totalConGenero.toLocaleString();
    document.getElementById('distribucion-genero').textContent = distribucion + '%';
    document.getElementById('total-generos').textContent = totalGeneros;

    // Preparar datos para gráficas
    datosSimulados.genero = {
        labels: labelsGenero,
        values: valuesGenero
    };

    console.log('Datos finales para gráficas:', datosSimulados.genero);
}

// Función para cargar datos adicionales REALES
async function cargarDatosAdicionalesReales(fechasVisitas, generos) {
    try {
        console.log('Procesando datos REALES adicionales...');
        
        // Procesar datos por tiempo desde las fechas REALES
        const datosTiempo = procesarDatosPorTiempoDesdeFechasReales(fechasVisitas, generos);
        
        // Cargar intereses REALES desde participantes_reserva
        const datosIntereses = await cargarDatosInteresesReales();

        datosSimulados.fecha = datosTiempo.fecha;
        datosSimulados.genero = datosTiempo.genero;
        datosSimulados.dia = datosTiempo.dia;
        datosSimulados.mes = datosTiempo.mes;
        datosSimulados.anio = datosTiempo.anio;
        datosSimulados.intereses = datosIntereses;

        datosOriginales = JSON.parse(JSON.stringify(datosSimulados));
        
        console.log('Datos REALES cargados exitosamente:', datosSimulados);
        
    } catch (error) {
        console.error('Error cargando datos adicionales REALES:', error);
        // Si hay error, usar datos básicos de género
        datosSimulados.fecha = datosSimulados.genero;
        datosSimulados.dia = { labels: [], values: [] };
        datosSimulados.mes = { labels: [], values: [] };
        datosSimulados.anio = { labels: [], values: [] };
        datosSimulados.intereses = { labels: [], values: [] };
    }
}

// Función para procesar datos por tiempo desde fechas reales
function procesarDatosPorTiempoDesdeFechasReales(fechasVisitas, generos) {
    console.log('Procesando fechas REALES:', fechasVisitas);
    
    // Mapeo de IDs de género a nombres
    const mapaGeneros = {};
    generos.forEach(genero => {
        mapaGeneros[genero.id_genero] = genero.genero;
    });

    // Contar por género (usando todas las fechas disponibles)
    const conteoPorGenero = {};
    const visitasPorFecha = {};
    const visitasPorDia = {
        'Lunes': 0, 'Martes': 0, 'Miércoles': 0, 'Jueves': 0, 
        'Viernes': 0, 'Sábado': 0, 'Domingo': 0
    };
    const visitasPorMes = {};
    const visitasPorAnio = {};

    fechasVisitas.forEach(item => {
        const generoNombre = mapaGeneros[item.generoId];
        
        if (generoNombre) {
            conteoPorGenero[generoNombre] = (conteoPorGenero[generoNombre] || 0) + 1;
            
            // Procesar por fecha si existe
            if (item.fecha) {
                const fecha = new Date(item.fecha);
                
            if (!isNaN(fecha.getTime())) {
                // Por fecha específica (formato como en la imagen: 20-ene)
                const fechaCorta = formatearFechaCorta(item.fecha);
                visitasPorFecha[fechaCorta] = (visitasPorFecha[fechaCorta] || 0) + 1;
                
                // Por día de la semana
                const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                const dia = diasSemana[fecha.getDay()];
                visitasPorDia[dia] = (visitasPorDia[dia] || 0) + 1;
                
                // Por mes (formato como en la imagen)
                const mesAbreviado = obtenerNombreMesAbreviado(fecha.getMonth());
                const anio = fecha.getFullYear();
                const mesKey = `${anio}-${mesAbreviado}`;
                visitasPorMes[mesKey] = (visitasPorMes[mesKey] || 0) + 1;
                
                // Por año
                visitasPorAnio[anio] = (visitasPorAnio[anio] || 0) + 1;
            } else {
                    console.warn('Fecha inválida en item:', item.fecha);
            }
          }
        }  
    });

    console.log('Conteo REAL por género:', conteoPorGenero);
    console.log('Visitas por fecha:', visitasPorFecha);
    console.log('Visitas por mes:', visitasPorMes);

    // Crear datos por género - SIEMPRE los 4 géneros
    const datosPorGenero = generos.map(genero => ({
        genero: genero.genero,
        count: conteoPorGenero[genero.genero] || 0
    }));

    console.log('Datos por género para fecha:', datosPorGenero);

    return {
        // "Por Fecha" muestra FECHAS específicas (como en la imagen)
        fecha: {
            labels: Object.keys(visitasPorFecha),
            values: Object.values(visitasPorFecha)
        },
        // "Por Género" muestra géneros
        genero: {
            labels: datosPorGenero.map(item => item.genero),
            values: datosPorGenero.map(item => item.count)
        },
        // Datos para otros gráficos basados en fechas reales
        dia: {
            labels: Object.keys(visitasPorDia),
            values: Object.values(visitasPorDia)
        },
        mes: {
            labels: Object.keys(visitasPorMes),
            values: Object.values(visitasPorMes)
        },
        anio: {
            labels: Object.keys(visitasPorAnio).sort(),
            values: Object.keys(visitasPorAnio).sort().map(anio => visitasPorAnio[anio])
        }
    };
}


// funcion auxiliar
// Función para ordenar fechas en formato "23-ene"
function ordenarFechasCortas(fechasArray) {
    if (!fechasArray || fechasArray.length === 0) return [];
    
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 
                   'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    
    return fechasArray.sort((a, b) => {
        try {
            const [diaA, mesA] = a.split('-');
            const [diaB, mesB] = b.split('-');
            
            const mesIndexA = meses.indexOf(mesA.toLowerCase());
            const mesIndexB = meses.indexOf(mesB.toLowerCase());
            
            // Primero comparar por mes
            if (mesIndexA !== mesIndexB) {
                return mesIndexA - mesIndexB;
            }
            
            // Si mismo mes, comparar por día
            return parseInt(diaA) - parseInt(diaB);
        } catch (error) {
            return 0;
        }
    });
}
// cierra funcion auxiliar


// Función para cargar intereses REALES
async function cargarDatosInteresesReales() {
    try {
        // Como el campo intereses_heliconias no existe, retornamos datos vacíos
        console.log('⚠️ Campo intereses_heliconias no existe en participantes_reserva');
        
        const intereses = ['Observación', 'Fotografía', 'Investigación', 'Educación', 'Recreación'];
        
        console.log('✅ Datos de intereses vacíos (campo no existe):', intereses);

        return {
            labels: intereses,
            values: intereses.map(() => 0)
        };
    } catch (error) {
        console.error('Error cargando intereses REALES:', error);
        return {
            labels: ['Observación', 'Fotografía', 'Investigación', 'Educación', 'Recreación'],
            values: [0, 0, 0, 0, 0]
        };
    }
}

// Función para mostrar sin datos
function mostrarSinDatos() {
    const container = document.getElementById('data-container');
    container.innerHTML = `
        <div class="no-data">
            <i class="fas fa-database"></i>
            <h3>No hay datos disponibles</h3>
            <p>No se encontraron registros en la base de datos para mostrar estadísticas.</p>
            <button class="btn btn-primary" onclick="cargarDatosGeneros()" style="margin-top: 15px;">
                <i class="fas fa-redo"></i> Reintentar
            </button>
        </div>
    `;
}

// ====================================================================
// FUNCIONES DE FILTROS MEJORADAS - COMPARACIÓN POR MES Y AÑO
// ====================================================================

// Función para aplicar filtro de género
function aplicarFiltroGenero() {
    try {
        const filtro = document.getElementById('filtroGenero').value;
        
        console.log('🎯 Aplicando filtro de género:', filtro);
        
        if (filtro === 'todos') {
            // Restaurar datos originales (todos los géneros)
            datosSimulados.genero = JSON.parse(JSON.stringify(datosOriginales.genero));
            console.log('✅ Mostrando todos los géneros');
            actualizarGraficaModal(document.querySelector('.modal-chart-container').getAttribute('data-tipo-grafica'));
            return;
        }

        const { labels, values } = datosOriginales.genero;
        
        // MAPEO COMPLETO DE GÉNEROS
        const mapeoGeneros = {
            'Masculino': ['Masculino', 'masculino', 'MASCULINO'],
            'Femenino': ['Femenino', 'femenino', 'FEMENINO'],
            'Otro': ['Otro', 'otro', 'OTRO', 'Otros'],
            'Prefiero no decirlo': ['Prefiero no decirlo', 'Prefiero no decir', 'prefiero no decirlo', 'No especificar']
        };
        
        let generoEncontrado = null;
        let indexEncontrado = -1;
        
        // Buscar en todas las variantes posibles
        for (const [key, variantes] of Object.entries(mapeoGeneros)) {
            if (variantes.includes(filtro)) {
                // Buscar cada variante en los labels
                for (const variante of variantes) {
                    const index = labels.indexOf(variante);
                    if (index !== -1) {
                        generoEncontrado = variante;
                        indexEncontrado = index;
                        break;
                    }
                }
                if (indexEncontrado !== -1) break;
            }
        }
        
        // Si no se encontró con el mapeo, buscar directamente
        if (indexEncontrado === -1) {
            indexEncontrado = labels.indexOf(filtro);
            if (indexEncontrado !== -1) {
                generoEncontrado = filtro;
            }
        }
        
        console.log('🔍 Resultado búsqueda:', {
            filtroSeleccionado: filtro,
            generoEncontrado: generoEncontrado,
            indexEncontrado: indexEncontrado,
            labelsDisponibles: labels
        });
        
        if (indexEncontrado !== -1) {
            const datosFiltrados = {
                labels: [labels[indexEncontrado]],
                values: [values[indexEncontrado]]
            };
            
            console.log('✅ Género encontrado, datos filtrados:', datosFiltrados);
            
            // Actualizar datos temporales
            datosSimulados.genero = datosFiltrados;
            actualizarGraficaConFiltro(datosFiltrados, `Visitantes - ${formatearGenero(filtro)}`);
            
        } else {
            console.error('❌ Género no encontrado:', filtro);
            mostrarMensajeSinDatos(`No se encontraron datos para el género: "${filtro}"`);
            
            // Restaurar vista de todos los géneros
            setTimeout(() => {
                document.getElementById('filtroGenero').value = 'todos';
                datosSimulados.genero = JSON.parse(JSON.stringify(datosOriginales.genero));
                actualizarGraficaModal(document.querySelector('.modal-chart-container').getAttribute('data-tipo-grafica'));
            }, 2000);
        }
        
    } catch (error) {
        console.error('💥 Error en aplicarFiltroGenero:', error);
        mostrarMensajeSinDatos('Error al aplicar el filtro de género');
    }
}

// Función para cargar datos de fecha específicos (como en la imagen)
async function cargarDatosFechasEspecificas() {
    try {
        mostrarLoading('Cargando datos por fecha...');

        // Consultar todas las fechas disponibles
        const { data: participantes, error } = await supabase
            .from('participantes_reserva')
            .select('fecha_visita')
            .not('fecha_visita', 'is', null);

        if (error) {
            console.error('Error cargando fechas:', error);
            throw error;
        }

        // Procesar fechas en formato como la imagen (20-ene, 22-feb, 1-mar)
        const fechasUnicas = {};
        participantes.forEach(p => {
            if (p.fecha_visita) {
                const fechaCorta = formatearFechaCorta(p.fecha_visita);
                fechasUnicas[fechaCorta] = (fechasUnicas[fechaCorta] || 0) + 1;
            }
        });

        // Ordenar fechas cronológicamente
        const fechasOrdenadas = Object.keys(fechasUnicas).sort((a, b) => {
            return new Date(a) - new Date(b);
        });

        const datosFechas = {
            labels: fechasOrdenadas,
            values: fechasOrdenadas.map(fecha => fechasUnicas[fecha])
        };

        cerrarLoading();
        return datosFechas;

    } catch (error) {
        console.error('Error cargando datos de fechas:', error);
        cerrarLoading();
        throw error;
    }
}

// Función para aplicar filtro de rango de fechas - VERSIÓN MEJORADA
async function aplicarFiltroRangoFechas() {
    const fechaInicial = document.getElementById('filtroFechaInicial').value;
    const fechaFinal = document.getElementById('filtroFechaFinal').value;
    
    console.log('🎯 Aplicando filtro FECHAS con parámetros:', {
        fechaInicial, 
        fechaFinal
    });
    
    // Validaciones
    if (!fechaInicial || !fechaFinal) {
        mostrarMensajeSinDatos('Por favor selecciona ambas fechas');
        return;
    }
    
    if (fechaInicial > fechaFinal) {
        mostrarMensajeSinDatos('La fecha inicial no puede ser mayor que la fecha final');
        return;
    }

    try {
        mostrarLoading('Cargando datos por fecha...');

        console.log('🔍 Aplicando filtro FECHAS para rango:', fechaInicial, 'a', fechaFinal);
        
        // Cargar datos del rango seleccionado
        const datosFiltrados = await cargarDatosPorRangoFechas(fechaInicial, fechaFinal);

        console.log('✅ Datos fechas obtenidos:', datosFiltrados);

        // Verificar si hay datos
        const totalVisitantes = datosFiltrados.values.reduce((a, b) => a + b, 0);
        console.log('👥 Total de visitantes encontrados:', totalVisitantes);
        
        if (totalVisitantes === 0) {
            mostrarMensajeSinDatos('No hay datos disponibles para el rango de fechas seleccionado');
            return;
        }

        // Crear título descriptivo
        const titulo = `Visitantes por Fecha (${formatearFecha(fechaInicial)} - ${formatearFecha(fechaFinal)})`;

        cerrarLoading();

        console.log('🎯 Datos finales para mostrar:', datosFiltrados);
        
        // Actualizar datos y gráfica
        datosSimulados.fecha = datosFiltrados;
        
        // Actualizar la gráfica del modal
        const modal = document.getElementById("chartModal");
        if (modal && modal.classList.contains('show')) {
            console.log('🔄 Actualizando gráfica FECHAS en modal...');
            
            // Actualizar título del modal
            const modalTitle = document.getElementById("modalTitle");
            if (modalTitle) {
                modalTitle.innerHTML = `<i class="fas fa-calendar"></i> ${titulo}`;
            }
            
            // FORZAR la actualización de la gráfica con los nuevos datos
            const tipoGraficaActual = document.querySelector('.modal-chart-container').getAttribute('data-tipo-grafica');
            actualizarGraficaFechas(tipoGraficaActual, datosFiltrados, titulo);
        }

        // Mostrar resumen
        mostrarExito(`Se encontraron ${totalVisitantes} visitantes en ${datosFiltrados.labels.length} fechas diferentes`);

    } catch (error) {
        console.error('💥 Error aplicando filtro de rango de fechas:', error);
        cerrarLoading();
        mostrarMensajeSinDatos('Error al cargar los datos: ' + error.message);
    }
}

// Función para cargar datos por rango de fechas - VERSIÓN CORREGIDA
async function cargarDatosPorRangoFechas(fechaInicial, fechaFinal) {
    try {
        console.log('🔍 Cargando datos por rango de fechas AGRUPADOS:', fechaInicial, 'a', fechaFinal);

        // CONSULTA MEJORADA: Traer datos agrupados por fecha y género
        const { data: participantes, error } = await supabase
            .from('participantes_reserva')
            .select(`
                fecha_visita,
                genero!inner(id_genero, genero)
            `)
            .not('fecha_visita', 'is', null)
            .not('id_genero', 'is', null)
            .gte('fecha_visita', fechaInicial)
            .lte('fecha_visita', fechaFinal)
            .order('fecha_visita', { ascending: true });

        if (error) {
            console.error('Error en consulta de fechas:', error);
            throw error;
        }

        console.log('👥 Participantes encontrados en rango:', participantes);

        if (!participantes || participantes.length === 0) {
            return {
                labels: [],
                values: [],
                datasets: []
            };
        }

        // Obtener todos los géneros disponibles
        const { data: generos } = await supabase
            .from('genero')
            .select('id_genero, genero')
            .order('id_genero');

        console.log('🎭 Géneros disponibles:', generos);

        // Procesar datos AGRUPADOS por fecha y género
        return procesarDatosAgrupadosPorFechaYGenero(participantes, generos);

    } catch (error) {
        console.error('💥 Error cargando datos por rango de fechas:', error);
        throw error;
    }
}



// Función auxiliar para obtener número de mes desde abreviatura
function obtenerNumeroMes(mesAbrev) {
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 
                   'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const mes = mesAbrev.toLowerCase();
    const index = meses.indexOf(mes);
    return index !== -1 ? index : 0;
}

// ====================================================================
// FUNCIONES SIMPLIFICADAS DE FILTRADO - REEMPLAZAR EN data-functions.js
// ====================================================================

// Función SIMPLIFICADA para aplicar filtro por género y fecha
async function aplicarFiltroPorGeneroYFecha() {
    const fechaInicial = document.getElementById('filtroFechaInicial').value;
    const fechaFinal = document.getElementById('filtroFechaFinal').value;
    const generoSeleccionado = document.getElementById('filtroGeneroFecha').value;
    
    console.log('🎯 Aplicando filtro por FECHA:', { fechaInicial, fechaFinal, generoSeleccionado });
    
    // Validaciones básicas
    if (!fechaInicial || !fechaFinal) {
        mostrarMensajeSinDatos('Por favor selecciona ambas fechas');
        return;
    }
    
    if (fechaInicial > fechaFinal) {
        mostrarMensajeSinDatos('La fecha inicial no puede ser mayor que la fecha final');
        return;
    }

    try {
        mostrarLoading('Cargando datos por fecha...');
        
        // Usar la función genérica para procesar fechas
        const datosProcesados = await procesarDatosPorPeriodo('fecha', fechaInicial, fechaFinal, generoSeleccionado);
        
        cerrarLoading();
        
        // Verificar si hay datos
        if (datosProcesados.totalGeneral === 0) {
            mostrarMensajeSinDatos('No hay datos disponibles para el rango de fechas seleccionado');
            return;
        }
        
        // Actualizar datos
        datosSimulados.fecha = datosProcesados;
        tipoActual = 'fecha'; // IMPORTANTE: Actualizar el tipo actual
        
        // Crear título
        let titulo;
        if (generoSeleccionado !== 'todos') {
            titulo = `${formatearGenero(generoSeleccionado)} por Fecha - ${formatearFecha(fechaInicial)} a ${formatearFecha(fechaFinal)}`;
        } else {
            titulo = `Visitantes por Fecha y Género - ${formatearFecha(fechaInicial)} a ${formatearFecha(fechaFinal)}`;
        }
        
        // Actualizar gráfica en el modal
        const modal = document.getElementById("chartModal");
        if (modal && modal.classList.contains('show')) {
            const modalTitle = document.getElementById("modalTitle");
            if (modalTitle) {
                modalTitle.innerHTML = `<i class="fas fa-calendar"></i> ${titulo}`;
            }
            
            const tipoGraficaActual = document.querySelector('.modal-chart-container').getAttribute('data-tipo-grafica');
            actualizarGraficaModal(tipoGraficaActual, titulo);
        }
        
        mostrarExito(`Se encontraron ${datosProcesados.totalGeneral} visitantes en ${datosProcesados.labels.length} fechas`);

    } catch (error) {
        console.error('❌ Error aplicando filtro de fecha:', error);
        cerrarLoading();
        mostrarMensajeSinDatos('Error al cargar los datos: ' + error.message);
    }
}

// Función SIMPLIFICADA para aplicar filtro por mes
// Función SIMPLIFICADA para aplicar filtro por mes
async function aplicarFiltroRangoMeses() {
    const fechaInicial = document.getElementById('filtroFechaInicialMes').value;
    const fechaFinal = document.getElementById('filtroFechaFinalMes').value;
    const generoSeleccionado = document.getElementById('filtroGeneroMes').value;
    
    console.log('🎯 Aplicando filtro por MES:', { fechaInicial, fechaFinal, generoSeleccionado });
    
    // Validaciones básicas
    if (!fechaInicial || !fechaFinal) {
        mostrarMensajeSinDatos('Por favor selecciona ambas fechas');
        return;
    }
    
    if (fechaInicial > fechaFinal) {
        mostrarMensajeSinDatos('La fecha inicial no puede ser mayor que la fecha final');
        return;
    }

    try {
        mostrarLoading('Cargando datos por mes...');
        
        // Usar la función genérica para procesar meses
        const datosProcesados = await procesarDatosPorPeriodo('mes', fechaInicial, fechaFinal, generoSeleccionado);
        
        cerrarLoading();
        
        // Verificar si hay datos
        if (datosProcesados.totalGeneral === 0) {
            mostrarMensajeSinDatos('No hay datos disponibles para el rango de meses seleccionado');
            return;
        }
        
        // Actualizar datos
        datosSimulados.mes = datosProcesados;
        tipoActual = 'mes'; // IMPORTANTE: Actualizar el tipo actual
        
        // Crear título
        let titulo;
        const mesInicial = obtenerNombreMesDesdeFecha(fechaInicial);
        const mesFinal = obtenerNombreMesDesdeFecha(fechaFinal);
        const añoInicial = obtenerAnioDesdeFecha(fechaInicial);
        const añoFinal = obtenerAnioDesdeFecha(fechaFinal);
        
        if (generoSeleccionado !== 'todos') {
            titulo = `${formatearGenero(generoSeleccionado)} por Mes - ${mesInicial} ${añoInicial} a ${mesFinal} ${añoFinal}`;
        } else {
            titulo = `Visitantes por Mes y Género - ${mesInicial} ${añoInicial} a ${mesFinal} ${añoFinal}`;
        }
        
        // Actualizar gráfica en el modal
        const modal = document.getElementById("chartModal");
        if (modal && modal.classList.contains('show')) {
            const modalTitle = document.getElementById("modalTitle");
            if (modalTitle) {
                modalTitle.innerHTML = `<i class="fas fa-calendar-week"></i> ${titulo}`;
            }
            
            const tipoGraficaActual = document.querySelector('.modal-chart-container').getAttribute('data-tipo-grafica');
            actualizarGraficaModalConDatosAgrupados(tipoGraficaActual, datosProcesados, titulo);
        }
        
        mostrarExito(`Se encontraron ${datosProcesados.totalGeneral} visitantes en ${datosProcesados.labels.length} meses`);

    } catch (error) {
        console.error('❌ Error aplicando filtro de mes:', error);
        cerrarLoading();
        mostrarMensajeSinDatos('Error al cargar los datos: ' + error.message);
    }
}
// Función SIMPLIFICADA para aplicar filtro por año
async function aplicarFiltroRangoAnios() {
    const fechaInicial = document.getElementById('filtroFechaInicialAnio').value;
    const fechaFinal = document.getElementById('filtroFechaFinalAnio').value;
    const generoSeleccionado = document.getElementById('filtroGeneroAnio').value;
    
    console.log('🎯 Aplicando filtro por AÑO:', { fechaInicial, fechaFinal, generoSeleccionado });
    
    // Validaciones básicas
    if (!fechaInicial || !fechaFinal) {
        mostrarMensajeSinDatos('Por favor selecciona ambas fechas');
        return;
    }
    
    if (fechaInicial > fechaFinal) {
        mostrarMensajeSinDatos('La fecha inicial no puede ser mayor que la fecha final');
        return;
    }

    try {
        mostrarLoading('Cargando datos por año...');
        
        // Usar la función genérica para procesar años
        const datosProcesados = await procesarDatosPorPeriodo('anio', fechaInicial, fechaFinal, generoSeleccionado);
        
        cerrarLoading();
        
        // Verificar si hay datos
        if (datosProcesados.totalGeneral === 0) {
            mostrarMensajeSinDatos('No hay datos disponibles para el rango de años seleccionado');
            return;
        }
        
        // Actualizar datos
        datosSimulados.anio = datosProcesados;
        tipoActual = 'anio'; // IMPORTANTE: Actualizar el tipo actual
        
        // Crear título
        let titulo;
        const añoInicial = obtenerAnioDesdeFecha(fechaInicial);
        const añoFinal = obtenerAnioDesdeFecha(fechaFinal);
        
        if (generoSeleccionado !== 'todos') {
            titulo = `${formatearGenero(generoSeleccionado)} por Año - ${añoInicial} a ${añoFinal}`;
        } else {
            titulo = `Visitantes por Año y Género - ${añoInicial} a ${añoFinal}`;
        }
        
        // Actualizar gráfica en el modal
        const modal = document.getElementById("chartModal");
        if (modal && modal.classList.contains('show')) {
            const modalTitle = document.getElementById("modalTitle");
            if (modalTitle) {
                modalTitle.innerHTML = `<i class="fas fa-calendar-alt"></i> ${titulo}`;
            }
            
            const tipoGraficaActual = document.querySelector('.modal-chart-container').getAttribute('data-tipo-grafica');
            actualizarGraficaModalConDatosAgrupados(tipoGraficaActual, datosProcesados, titulo);
        }
        
        mostrarExito(`Se encontraron ${datosProcesados.totalGeneral} visitantes en ${datosProcesados.labels.length} años`);

    } catch (error) {
        console.error('❌ Error aplicando filtro de año:', error);
        cerrarLoading();
        mostrarMensajeSinDatos('Error al cargar los datos: ' + error.message);
    }
}








// Función para procesar datos agrupados por fecha y género
function procesarDatosAgrupadosPorFechaYGenero(participantes, generos) {
    console.log('📊 Procesando datos agrupados por fecha y género...');
    
    // Obtener todas las fechas únicas ordenadas
    const fechasUnicas = [...new Set(
        participantes
            .filter(p => p.fecha_visita)
            .map(p => p.fecha_visita.split('T')[0])
    )].sort();
    
    // Obtener todos los géneros disponibles
    const todosLosGeneros = generos.map(g => g.genero);
    
    // Inicializar estructura de datos
    const datosPorFechaYGenero = {};
    
    // Inicializar para todas las fechas
    fechasUnicas.forEach(fecha => {
        datosPorFechaYGenero[fecha] = {};
        todosLosGeneros.forEach(genero => {
            datosPorFechaYGenero[fecha][genero] = 0;
        });
    });
    
    // Contar participantes por fecha y género
    participantes.forEach(participante => {
        if (participante.fecha_visita && participante.genero) {
            const fecha = participante.fecha_visita.split('T')[0];
            const genero = participante.genero.genero;
            
            if (datosPorFechaYGenero[fecha] && datosPorFechaYGenero[fecha][genero] !== undefined) {
                datosPorFechaYGenero[fecha][genero]++;
            }
        }
    });
    
    // Formatear fechas para mostrar (ej: 20-ene)
    const fechasFormateadas = fechasUnicas.map(fecha => formatearFechaCorta(fecha));
    
    // Crear datasets para cada género
    const datasets = todosLosGeneros.map(genero => {
        const color = coloresPorGenero[genero] || '#95a5a6';
        return {
            label: genero,
            data: fechasUnicas.map(fecha => datosPorFechaYGenero[fecha][genero] || 0),
            backgroundColor: color,
            borderColor: darkenColor(color, 0.3),
            borderWidth: 2,
            borderRadius: 6,
            barThickness: 25
        };
    });
    
    // Calcular totales
    const totalPorFecha = fechasUnicas.map(fecha => 
        todosLosGeneros.reduce((sum, genero) => sum + (datosPorFechaYGenero[fecha][genero] || 0), 0)
    );
    
    const totalGeneral = totalPorFecha.reduce((a, b) => a + b, 0);
    
    console.log('✅ Datos agrupados procesados:', {
        fechas: fechasFormateadas,
        datasets: datasets,
        totalPorFecha: totalPorFecha,
        totalGeneral: totalGeneral
    });
    
    return {
        type: 'grouped',
        labels: fechasFormateadas,
        datasets: datasets,
        totalPorFecha: totalPorFecha,
        totalGeneral: totalGeneral,
        fechasOriginales: fechasUnicas,
        generos: todosLosGeneros
    };
}

// Función para actualizar gráfica de fechas - VERSIÓN CON DATOS AGRUPADOS
function actualizarGraficaFechas(tipoGrafica, datosFechas, titulo) {
    const ctx = document.getElementById("chartAmpliado").getContext("2d");
    
    if (chartAmpliado) chartAmpliado.destroy();

    // Verificar si tenemos datos agrupados
    if (datosFechas.type === 'grouped' && datosFechas.datasets) {
        // GRÁFICA AGRUPADA POR GÉNERO
        chartAmpliado = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: datosFechas.labels,
                datasets: datosFechas.datasets
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
                            pointStyle: 'circle',
                            font: { size: 13 }
                        }
                    },
                    title: {
                        display: true,
                        text: titulo + ' - Agrupado por Género',
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
                                return `Fecha: ${tooltipItems[0].label}`;
                            },
                            label: function(context) {
                                const fechaIndex = context.dataIndex;
                                const totalFecha = datosFechas.totalPorFecha[fechaIndex] || 0;
                                const valor = context.parsed.y;
                                const porcentaje = totalFecha > 0 ? Math.round((valor / totalFecha) * 100) : 0;
                                return `${context.dataset.label}: ${valor} visitantes (${porcentaje}%)`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        stacked: false, // BARRAS JUNTAS, NO APILADAS
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
                        stacked: false, // BARRAS JUNTAS
                        grid: { display: false },
                        title: {
                            display: true,
                            text: 'Fechas de Visita',
                            font: { weight: 'bold', size: 14 }
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 0,
                            font: {
                                size: 11
                            }
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            },
        });

        // Actualizar tabla con datos agrupados
        actualizarTablaFechasAgrupadas(datosFechas);
        
    } else {
        // GRÁFICA SIMPLE (fallback)
        const colors = generarColores('fecha', datosFechas.labels);

        chartAmpliado = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: datosFechas.labels,
                datasets: [
                    {
                        label: "Total de Visitantes por Fecha",
                        data: datosFechas.values,
                        backgroundColor: colors,
                        borderColor: colors.map(color => darkenColor(color, 0.3)),
                        borderWidth: 2,
                        borderRadius: 6,
                        barThickness: 25,
                        hoverBackgroundColor: colors.map(color => lightenColor(color, 0.1)),
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false,
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
                                const value = context.parsed.y;
                                return `${label}: ${value.toLocaleString()} visitantes`;
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
                            font: { weight: 'bold', size: 14 }
                        }
                    },
                    x: {
                        grid: { 
                            display: false 
                        },
                        title: {
                            display: true,
                            text: 'Fechas de Visita',
                            font: { weight: 'bold', size: 14 }
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 0,
                            font: {
                                size: 12
                            }
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            },
        });

        // Actualizar tabla simple
        actualizarTablaFechas(datosFechas);
    }
}


// Función para actualizar tabla con datos agrupados por fecha y género
function actualizarTablaFechasAgrupadas(datosFechas) {
    const tbody = document.querySelector("#tablaDatos tbody");
    if (!tbody) return;
    
    let tablaHTML = '';
    
    // Para cada fecha
    datosFechas.labels.forEach((fecha, fechaIndex) => {
        const totalFecha = datosFechas.totalPorFecha[fechaIndex] || 0;
        
        if (totalFecha > 0) {
            // Encabezado de fecha
            tablaHTML += `
                <tr style="background: linear-gradient(135deg, #f8f9fa, #e9ecef);">
                    <td colspan="3" style="font-weight: bold; color: #2c3e50; padding: 12px; border-bottom: 2px solid #dee2e6;">
                        <i class="fas fa-calendar-day"></i> ${fecha} - Total: ${totalFecha} visitantes
                    </td>
                </tr>
            `;
            
            // Detalle por género para esta fecha
            datosFechas.datasets.forEach(dataset => {
                const valor = dataset.data[fechaIndex] || 0;
                if (valor > 0) {
                    const porcentaje = totalFecha > 0 ? ((valor / totalFecha) * 100).toFixed(1) : 0;
                    const claseGenero = obtenerClaseGenero(dataset.label.toLowerCase());
                    
                    tablaHTML += `
                        <tr>
                            <td style="padding-left: 30px;">
                                <span class="gender-badge ${claseGenero}">
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
    if (datosFechas.totalGeneral > 0) {
        tablaHTML += `
            <tr style="background: linear-gradient(135deg, #a8e6cf, #dcedc1); font-weight: bold;">
                <td colspan="2" style="padding: 12px; border-top: 2px solid #2ecc71;">
                    <i class="fas fa-chart-bar"></i> TOTAL GENERAL
                </td>
                <td style="text-align: center; border-top: 2px solid #2ecc71;">${datosFechas.totalGeneral.toLocaleString()}</td>
            </tr>
        `;
    }
    
    tbody.innerHTML = tablaHTML;
}

// Función para actualizar tabla de fechas
function actualizarTablaFechas(datosFechas) {
    const tbody = document.querySelector("#tablaDatos tbody");
    const total = datosFechas.values.reduce((a, b) => a + b, 0);
    
    tbody.innerHTML = datosFechas.labels
        .map((fecha, index) => {
            const valor = datosFechas.values[index];
            const porcentaje = total > 0 ? ((valor / total) * 100).toFixed(1) : 0;
            
            // Destacar la fecha con más visitas
            const maxValor = Math.max(...datosFechas.values);
            const esMaximo = valor === maxValor && valor > 0;
            const estiloFila = esMaximo ? 'background: linear-gradient(135deg, #ffeaa7, #fab1a0); font-weight: bold;' : '';
            
            return `
                <tr style="${estiloFila}">
                    <td style="padding: 12px; font-weight: bold;">
                        <i class="fas fa-calendar-day"></i> ${fecha}
                        ${esMaximo ? '<i class="fas fa-crown" style="margin-left: 5px; color: #f39c12;"></i>' : ''}
                    </td>
                    <td style="text-align: center; font-weight: bold; font-size: 16px;">
                        ${valor.toLocaleString()}
                    </td>
                    <td style="text-align: center; color: #2c3e50; font-weight: bold; font-size: 16px;">
                        ${porcentaje}%
                    </td>
                </tr>
            `;
        })
        .join("");
    
    // Agregar fila de total
    if (total > 0) {
        tbody.innerHTML += `
            <tr style="background: linear-gradient(135deg, #a8e6cf, #dcedc1); font-weight: bold;">
                <td style="padding: 12px;">
                    <i class="fas fa-calendar-alt"></i> TOTAL PERÍODO
                </td>
                <td style="text-align: center; font-size: 16px;">${total.toLocaleString()}</td>
                <td style="text-align: center; font-size: 16px;">100%</td>
            </tr>
        `;
    }
}

// Función para cargar datos de meses específicos (como en la imagen)
async function cargarDatosMesesEspecificos() {
    try {
        mostrarLoading('Cargando datos por mes...');

        // Consultar todas las fechas disponibles
        const { data: participantes, error } = await supabase
            .from('participantes_reserva')
            .select('fecha_visita')
            .not('fecha_visita', 'is', null);

        if (error) {
            console.error('Error cargando meses:', error);
            throw error;
        }

        // Procesar meses en formato como la imagen (feb, mar)
        const mesesUnicos = {};
        participantes.forEach(p => {
            if (p.fecha_visita) {
                const fecha = new Date(p.fecha_visita);
                const mesAbreviado = obtenerNombreMesAbreviado(fecha.getMonth());
                const año = fecha.getFullYear();
                const mesKey = `${año}-${mesAbreviado}`;
                
                mesesUnicos[mesKey] = (mesesUnicos[mesKey] || 0) + 1;
            }
        });

        // Ordenar meses cronológicamente
        const mesesOrdenados = Object.keys(mesesUnicos).sort((a, b) => {
            return new Date(a) - new Date(b);
        });

        const datosMeses = {
            labels: mesesOrdenados,
            values: mesesOrdenados.map(mes => mesesUnicos[mes])
        };

        cerrarLoading();
        return datosMeses;

    } catch (error) {
        console.error('Error cargando datos de meses:', error);
        cerrarLoading();
        throw error;
    }
}

// Función para cargar el mes actual - VERSIÓN CORREGIDA
async function cargarMesActual() {
    try {
        mostrarLoading('Cargando datos del mes actual...');

        const ahora = new Date();
        const añoActual = ahora.getFullYear();
        const mesActual = ahora.getMonth();
        
        // Primer y último día del mes actual
        const fechaInicial = new Date(añoActual, mesActual, 1);
        const fechaFinal = new Date(añoActual, mesActual + 1, 0);
        
        console.log('📅 Cargando mes actual:', fechaInicial.toISOString().split('T')[0], 'a', fechaFinal.toISOString().split('T')[0]);

        // Consultar participantes del mes actual
        const { data: participantes, error } = await supabase
            .from('participantes_reserva')
            .select(`
                fecha_visita,
                genero!inner(id_genero, genero)
            `)
            .not('fecha_visita', 'is', null)
            .not('id_genero', 'is', null)
            .gte('fecha_visita', fechaInicial.toISOString().split('T')[0])
            .lte('fecha_visita', fechaFinal.toISOString().split('T')[0])
            .order('fecha_visita', { ascending: true });

        if (error) {
            console.error('❌ Error consultando mes actual:', error);
            throw error;
        }

        console.log(`👥 Participantes encontrados en mes actual: ${participantes?.length || 0}`);

        if (!participantes || participantes.length === 0) {
            mostrarMensajeSinDatos('No hay datos disponibles para el mes actual');
            cerrarLoading();
            return;
        }

        // Obtener todos los géneros
        const { data: generos } = await supabase
            .from('genero')
            .select('id_genero, genero')
            .order('id_genero');

        // Procesar datos AGRUPADOS (todos los géneros)
        const datosProcesados = await procesarDatosAgrupadosPorGenero(
            participantes, 
            generos, 
            fechaInicial.toISOString().split('T')[0], 
            fechaFinal.toISOString().split('T')[0]
        );

        // Actualizar los inputs de fecha
        document.getElementById('filtroFechaInicial').value = fechaInicial.toISOString().split('T')[0];
        document.getElementById('filtroFechaFinal').value = fechaFinal.toISOString().split('T')[0];
        document.getElementById('filtroGeneroFecha').value = 'todos';

        // Actualizar datos
        datosSimulados.fecha = datosProcesados;
        
        cerrarLoading();

        // Actualizar la gráfica del modal
        const modal = document.getElementById("chartModal");
        if (modal && modal.classList.contains('show')) {
            const modalTitle = document.getElementById("modalTitle");
            const mesNombre = obtenerNombreMes(mesActual);
            const titulo = `Visitantes por Género - ${mesNombre} ${añoActual}`;
            
            if (modalTitle) {
                modalTitle.innerHTML = `<i class="fas fa-chart-bar"></i> ${titulo}`;
            }
            
            const tipoGraficaActual = document.querySelector('.modal-chart-container').getAttribute('data-tipo-grafica');
            actualizarGraficaModalConDatosAgrupados(tipoGraficaActual, datosProcesados, titulo);
        }

        // Mostrar resumen
        const totalVisitantes = datosProcesados.total || 0;
        const resumen = `Mes ${obtenerNombreMes(mesActual)}: ${totalVisitantes} visitantes totales`;
        mostrarExito(resumen);

    } catch (error) {
        console.error('❌ Error cargando mes actual:', error);
        cerrarLoading();
        mostrarMensajeSinDatos('Error al cargar los datos del mes actual');
    }
}

// Función para aplicar filtro de rango de fechas con gráficas agrupadas - VERSIÓN CORREGIDA
async function aplicarFiltroRangoFechasComparativo() {
    const fechaInicial = document.getElementById('filtroFechaInicial').value;
    const fechaFinal = document.getElementById('filtroFechaFinal').value;
    const generoSeleccionado = document.getElementById('filtroGeneroFecha').value;
    
    console.log('🎯 Aplicando filtro COMPARATIVO con parámetros:', {
        fechaInicial, 
        fechaFinal, 
        generoSeleccionado
    });
    
    // Validaciones
    if (!fechaInicial || !fechaFinal) {
        mostrarMensajeSinDatos('Por favor selecciona ambas fechas');
        return;
    }
    
    if (fechaInicial > fechaFinal) {
        mostrarMensajeSinDatos('La fecha inicial no puede ser mayor que la fecha final');
        return;
    }

    try {
        mostrarLoading('Cargando datos comparativos...');

        console.log('🔍 Aplicando filtro COMPARATIVO para rango:', fechaInicial, 'a', fechaFinal);
        
        // CONSULTA PARA OBTENER DATOS AGRUPADOS POR FECHA Y GÉNERO
        let query = supabase
            .from('participantes_reserva')
            .select(`
                fecha_visita,
                genero!inner(id_genero, genero)
            `)
            .not('fecha_visita', 'is', null)
            .not('id_genero', 'is', null)
            .gte('fecha_visita', fechaInicial)
            .lte('fecha_visita', fechaFinal)
            .order('fecha_visita', { ascending: true });

        const { data: participantes, error } = await query;

        if (error) {
            console.error('❌ Error en consulta de participantes:', error);
            throw error;
        }

        console.log('👥 Participantes encontrados en rango:', participantes);

        if (!participantes || participantes.length === 0) {
            mostrarMensajeSinDatos('No hay datos disponibles para el rango de fechas seleccionado');
            cerrarLoading();
            return;
        }

        // Obtener todos los géneros disponibles
        const { data: generos } = await supabase
            .from('genero')
            .select('id_genero, genero')
            .order('id_genero');

        console.log('🎭 Géneros disponibles:', generos);

        // Procesar datos según el tipo de filtro
        let datosProcesados;
        let titulo;
        
        if (generoSeleccionado !== 'todos') {
            // CASO 1: GÉNERO ESPECÍFICO - Barras por fecha para un solo género
            datosProcesados = await procesarDatosGeneroEspecifico(
                participantes, 
                generos, 
                generoSeleccionado, 
                fechaInicial, 
                fechaFinal
            );
            titulo = `${formatearGenero(generoSeleccionado)} - ${formatearFecha(fechaInicial)} a ${formatearFecha(fechaFinal)}`;
        } else {
            // CASO 2: TODOS LOS GÉNEROS - Barras agrupadas por fecha
            datosProcesados = await procesarDatosAgrupadosPorGenero(
                participantes, 
                generos, 
                fechaInicial, 
                fechaFinal
            );
            titulo = `Visitantes por Género y Fecha - ${formatearFecha(fechaInicial)} a ${formatearFecha(fechaFinal)}`;
        }

        cerrarLoading();

        // Verificar si hay datos
        const totalVisitantes = datosProcesados.total || 
            (datosProcesados.values ? datosProcesados.values.reduce((a, b) => a + b, 0) : 0);
        
        if (totalVisitantes === 0) {
            mostrarMensajeSinDatos('No hay datos disponibles para el rango de fechas seleccionado');
            return;
        }

        console.log('🎯 Datos procesados para mostrar:', datosProcesados);
        
        // Actualizar datos
        datosSimulados.fecha = datosProcesados;
        
        // SIEMPRE actualizar la gráfica del modal
        const modal = document.getElementById("chartModal");
        if (modal && modal.classList.contains('show')) {
            console.log('🔄 Actualizando gráfica en modal...');
            
            // Actualizar título del modal
            const modalTitle = document.getElementById("modalTitle");
            if (modalTitle) {
                modalTitle.innerHTML = `<i class="fas fa-chart-bar"></i> ${titulo}`;
            }
            
            // FORZAR la actualización de la gráfica con los nuevos datos
            const tipoGraficaActual = document.querySelector('.modal-chart-container').getAttribute('data-tipo-grafica');
            actualizarGraficaModalConDatosAgrupados(tipoGraficaActual, datosProcesados, titulo);
        }

        // Mostrar resumen
        mostrarExito(`Se encontraron ${totalVisitantes} visitantes en el rango seleccionado`);

    } catch (error) {
        console.error('💥 Error aplicando filtro de rango de fechas:', error);
        cerrarLoading();
        mostrarMensajeSinDatos('Error al cargar los datos: ' + error.message);
    }
}

// Función para procesar datos de un género específico (barras por fecha)
async function procesarDatosGeneroEspecifico(participantes, generos, generoSeleccionado, fechaInicial, fechaFinal) {
    console.log(`📊 Procesando datos para género específico: ${generoSeleccionado}`);
    
    // Filtrar participantes por el género seleccionado
    const participantesFiltrados = participantes.filter(p => {
        const generoParticipante = p.genero?.genero?.trim().toLowerCase();
        const generoSeleccionadoClean = generoSeleccionado.trim().toLowerCase();
        
        return generoSeleccionadoClean === 'todos' || generoParticipante === generoSeleccionadoClean;
    });
    
    console.log(`👥 Participantes del género ${generoSeleccionado}:`, participantesFiltrados.length);
    
    // Agrupar por fecha
    const visitasPorFecha = {};
    
    participantesFiltrados.forEach(participante => {
        if (participante.fecha_visita) {
            // Formatear fecha en formato corto (como en la imagen: 20-ene)
            const fechaCorta = formatearFechaCorta(participante.fecha_visita);
            visitasPorFecha[fechaCorta] = (visitasPorFecha[fechaCorta] || 0) + 1;
        }
    });
    
    // Ordenar fechas cronológicamente
    const fechasOrdenadas = Object.keys(visitasPorFecha).sort((a, b) => {
        return new Date(a) - new Date(b);
    });
    
    return {
        type: 'genero_especifico',
        genero: generoSeleccionado,
        labels: fechasOrdenadas,
        values: fechasOrdenadas.map(fecha => visitasPorFecha[fecha]),
        total: participantesFiltrados.length,
        fechaInicial: fechaInicial,
        fechaFinal: fechaFinal
    };
}

// Función para procesar datos agrupados por género (barras juntas por fecha)
async function procesarDatosAgrupadosPorGenero(participantes, generos, fechaInicial, fechaFinal) {
    console.log('📊 Procesando datos agrupados por género');
    
    // Obtener fechas únicas dentro del rango
    const fechasUnicas = {};
    const generosNombres = Array.from(new Set([
        ...generos.map(g => g.genero),  // géneros de la tabla
        ...participantes.map(p => p.genero?.genero).filter(Boolean) // géneros de participantes
    ]));
    
    // Inicializar estructura de datos
    participantes.forEach(participante => {
        if (participante.fecha_visita) {
            const fechaCorta = formatearFechaCorta(participante.fecha_visita);
            if (!fechasUnicas[fechaCorta]) {
                fechasUnicas[fechaCorta] = {};
                generosNombres.forEach(genero => {
                    fechasUnicas[fechaCorta][genero] = 0;
                });
            }
            
            if (participante.genero && participante.genero.genero) {
                const generoNombre = participante.genero.genero;
                fechasUnicas[fechaCorta][generoNombre] = 
                    (fechasUnicas[fechaCorta][generoNombre] || 0) + 1;
            }
        }
    });
    
    // Ordenar fechas cronológicamente
    const fechasOrdenadas = Object.keys(fechasUnicas).sort((a, b) => {
        return new Date(a) - new Date(b);
    });
    
    // Crear datasets para cada género
    const datasets = generosNombres.map(genero => ({
        label: genero,
        data: fechasOrdenadas.map(fecha => fechasUnicas[fecha][genero] || 0),
        backgroundColor: coloresPorGenero[genero] || '#95a5a6',
        borderColor: darkenColor(coloresPorGenero[genero] || '#95a5a6', 0.3),
        borderWidth: 2,
        borderRadius: 6,
        barThickness: 25,
    }));
    
    // Calcular total general
    const totalGeneral = datasets.reduce((total, dataset) => {
        return total + dataset.data.reduce((sum, val) => sum + val, 0);
    }, 0);
    
    return {
        type: 'grouped',
        labels: fechasOrdenadas,
        datasets: datasets,
        total: totalGeneral,
        fechaInicial: fechaInicial,
        fechaFinal: fechaFinal,
        generos: generosNombres
    };
}


// Función para actualizar gráfica modal con datos agrupados
function actualizarGraficaModalConDatosAgrupados(tipoGrafica, datosProcesados, titulo) {
    const ctx = document.getElementById("chartAmpliado").getContext("2d");
    
    if (chartAmpliado) chartAmpliado.destroy();

    // DETECTAR QUÉ TIPO DE DATOS TENEMOS
    if (datosProcesados.type === 'grouped') {
        // DATOS AGRUPADOS (con datasets múltiples)
        
        if (tipoActual === 'anio') {
            // CASO ESPECIAL: GRÁFICA DE AÑOS AGRUPADOS
            actualizarGraficaAniosAgrupados(tipoGrafica, datosProcesados, titulo);
        } else if (tipoActual === 'mes') {
            // CASO ESPECIAL: GRÁFICA DE MESES AGRUPADOS
            actualizarGraficaMesesAgrupados(tipoGrafica, datosProcesados, titulo);
        } else {
            // CASO GENERAL: GRÁFICA AGRUPADA (fechas, días, etc.)
            chartAmpliado = new Chart(ctx, {
                type: tipoGrafica === "bar" ? "bar" : "doughnut",
                data: {
                    labels: datosProcesados.labels,
                    datasets: datosProcesados.datasets
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
                                    let labelText = '';
                                    if (tipoActual === 'fecha') {
                                        labelText = `Fecha: ${tooltipItems[0].label}`;
                                    } else if (tipoActual === 'mes') {
                                        labelText = `Mes: ${tooltipItems[0].label}`;
                                    } else if (tipoActual === 'anio') {
                                        labelText = `Año: ${tooltipItems[0].label}`;
                                    } else {
                                        labelText = tooltipItems[0].label;
                                    }
                                    return labelText;
                                },
                                label: function(context) {
                                    let totalPeriodo = 0;
                                    
                                    if (tipoActual === 'fecha' && datosProcesados.totalPorFecha) {
                                        totalPeriodo = datosProcesados.totalPorFecha[context.dataIndex] || 0;
                                    } else if (tipoActual === 'mes' && datosProcesados.totalPorMes) {
                                        totalPeriodo = datosProcesados.totalPorMes[context.dataIndex] || 0;
                                    } else if (tipoActual === 'anio' && datosProcesados.totalPorAño) {
                                        totalPeriodo = datosProcesados.totalPorAño[context.dataIndex] || 0;
                                    }
                                    
                                    const valor = context.parsed.y;
                                    const porcentaje = totalPeriodo > 0 ? 
                                        Math.round((valor / totalPeriodo) * 100) : 0;
                                    return `${context.dataset.label}: ${valor} visitantes (${porcentaje}%)`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            stacked: false, // BARRAS JUNTAS, NO APILADAS
                            grid: { 
                                color: 'rgba(0,0,0,0.1)',
                                drawBorder: false
                            },
                            title: {
                                display: true,
                                text: 'Cantidad de Visitantes',
                                font: { weight: 'bold', size: 14 }
                            },
                            ticks: {
                                precision: 0
                            }
                        },
                        x: {
                            stacked: false, // BARRAS JUNTAS
                            grid: { display: false },
                            title: {
                                display: true,
                                text: obtenerEtiquetaDescriptiva(tipoActual),
                                font: { weight: 'bold', size: 14 }
                            },
                            ticks: {
                                maxRotation: 45,
                                minRotation: 0,
                                font: { size: 12 }
                            }
                        }
                    },
                    animation: {
                        duration: 1000,
                        easing: 'easeOutQuart'
                    }
                }
            });
            
            // Actualizar tabla según el tipo
            if (tipoActual === 'fecha') {
                actualizarTablaFechasAgrupadas(datosProcesados);
            } else if (tipoActual === 'mes') {
                actualizarTablaMesesAgrupados(datosProcesados);
            } else if (tipoActual === 'anio') {
                actualizarTablaAñosAgrupados(datosProcesados);
            } else {
                actualizarTablaDatosAgrupados(datosProcesados);
            }
        }
        
    } else if (datosProcesados.type === 'genero_especifico') {
        // GRÁFICA SIMPLE (género específico)
        const colors = generarColores(tipoActual, datosProcesados.labels);
        
        chartAmpliado = new Chart(ctx, {
            type: tipoGrafica === "bar" ? "bar" : "doughnut", 
            data: {
                labels: datosProcesados.labels,
                datasets: [{
                    label: `Visitantes ${formatearGenero(datosProcesados.genero)}`,
                    data: datosProcesados.values,
                    backgroundColor: colors,
                    borderColor: colors.map(color => darkenColor(color, 0.3)),
                    borderWidth: 2,
                    borderRadius: 6,
                    barThickness: 25,
                    hoverBackgroundColor: colors.map(color => lightenColor(color, 0.1)),
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            padding: 15,
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
                                return `${context.dataset.label}: ${context.parsed.y} visitantes`;
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
                            font: { weight: 'bold', size: 14 }
                        }
                    },
                    x: {
                        grid: { display: false },
                        title: {
                            display: true,
                            text: obtenerEtiquetaDescriptiva(tipoActual),
                            font: { weight: 'bold', size: 14 }
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
            }
        });
        
        actualizarTablaDatosSimples(datosProcesados);
    }
}
function actualizarTablaMesesAgrupados(datosProcesados) {
    const tbody = document.querySelector("#tablaDatos tbody");
    if (!tbody) return;
    
    let tablaHTML = '';
    
    // Para cada mes
    datosProcesados.labels.forEach((mes, mesIndex) => {
        const totalMes = datosProcesados.totalPorPeriodo[mesIndex] || 0;
        
        if (totalMes > 0) {
            // Encabezado de mes
            tablaHTML += `
                <tr style="background: linear-gradient(135deg, #f8f9fa, #e9ecef);">
                    <td colspan="3" style="font-weight: bold; color: #2c3e50; padding: 12px; border-bottom: 2px solid #dee2e6;">
                        <i class="fas fa-calendar-week"></i> ${mes} - Total: ${totalMes} visitantes
                    </td>
                </tr>
            `;
            
            // Detalle por género para este mes
            datosProcesados.datasets.forEach(dataset => {
                const valor = dataset.data[mesIndex] || 0;
                if (valor > 0) {
                    const porcentaje = totalMes > 0 ? ((valor / totalMes) * 100).toFixed(1) : 0;
                    const claseGenero = obtenerClaseGenero(dataset.label.toLowerCase());
                    
                    tablaHTML += `
                        <tr>
                            <td style="padding-left: 30px;">
                                <span class="gender-badge ${claseGenero}">
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
    if (datosProcesados.totalGeneral > 0) {
        tablaHTML += `
            <tr style="background: linear-gradient(135deg, #a8e6cf, #dcedc1); font-weight: bold;">
                <td colspan="2" style="padding: 12px; border-top: 2px solid #2ecc71;">
                    <i class="fas fa-chart-bar"></i> TOTAL GENERAL
                </td>
                <td style="text-align: center; border-top: 2px solid #2ecc71;">${datosProcesados.totalGeneral.toLocaleString()}</td>
            </tr>
        `;
    }
    
    tbody.innerHTML = tablaHTML;
}
// Función para actualizar tabla comparativa
function actualizarTablaComparativa(datosComparativa) {
    const tbody = document.querySelector("#tablaDatos tbody");
    const total = datosComparativa.values.reduce((a, b) => a + b, 0);
    
    tbody.innerHTML = datosComparativa.labels
        .map((genero, index) => {
            const valor = datosComparativa.values[index];
            const porcentaje = total > 0 ? ((valor / total) * 100).toFixed(1) : 0;
            const generoFormateado = formatearGenero(genero);
            const claseGenero = obtenerClaseGenero(genero);
            
            // Destacar el valor máximo (solo si hay valores > 0)
            const valoresPositivos = datosComparativa.values.filter(v => v > 0);
            const esMaximo = valoresPositivos.length > 0 && valor === Math.max(...valoresPositivos) && valor > 0;
            const estiloFila = esMaximo ? 'background: linear-gradient(135deg, #ffeaa7, #fab1a0); font-weight: bold;' : '';
            
            return `
                <tr style="${estiloFila}">
                    <td>
                        <span class="gender-badge-3d ${claseGenero}">
                            <i class="fas ${genero === 'Masculino' ? 'fa-mars' : genero === 'Femenino' ? 'fa-venus' : 'fa-genderless'}"></i>
                            ${generoFormateado}
                            ${esMaximo ? '<i class="fas fa-crown" style="margin-left: 5px; color: #f39c12;"></i>' : ''}
                        </span>
                    </td>
                    <td style="text-align: center; font-weight: bold; font-size: 16px;">
                        ${valor.toLocaleString()}
                    </td>
                    <td style="text-align: center; color: #2c3e50; font-weight: bold; font-size: 16px;">
                        ${porcentaje}%
                    </td>
                </tr>
            `;
        })
        .join("");
    
    // Agregar fila de total solo si hay datos
    if (total > 0) {
        tbody.innerHTML += `
            <tr style="background: linear-gradient(135deg, #a8e6cf, #dcedc1); font-weight: bold;">
                <td style="padding: 12px;">
                    <i class="fas fa-users"></i> TOTAL
                </td>
                <td style="text-align: center; font-size: 16px;">${total.toLocaleString()}</td>
                <td style="text-align: center; font-size: 16px;">100%</td>
            </tr>
        `;
    }
}

// Función para generar resumen comparativo
function generarResumenComparativo(datosComparativa) {
    const total = datosComparativa.values.reduce((a, b) => a + b, 0);
    
    if (datosComparativa.labels.length === 1) {
        return `Género ${datosComparativa.labels[0]}: ${total} visitantes`;
    }
    
    // Para comparativa de múltiples géneros
    const valoresPositivos = datosComparativa.values.filter(v => v > 0);
    
    if (valoresPositivos.length === 0) {
        return 'No se encontraron visitantes en el período seleccionado';
    }
    
    const maxValue = Math.max(...valoresPositivos);
    const maxIndex = datosComparativa.values.indexOf(maxValue);
    const generoMaximo = datosComparativa.labels[maxIndex];
    const porcentajeMaximo = ((maxValue / total) * 100).toFixed(1);
    
    let resumen = `Comparativa completada: ${total} visitantes totales. `;
    
    if (valoresPositivos.length > 1) {
        resumen += `Género predominante: ${generoMaximo} (${porcentajeMaximo}%)`;
    } else {
        resumen += `Único género con datos: ${generoMaximo}`;
    }
    
    return resumen;
}

// Función para cargar datos de género por tiempo
async function cargarDatosGeneroPorTiempo(tipo, parametros = {}) {
    try {
        console.log('🔍 Iniciando carga de datos por tiempo:', tipo, parametros);

        // CONSULTA DIRECTA a participantes_reserva - SOLO campos existentes
        let query = supabase
            .from('participantes_reserva')
            .select('id_genero, fecha_visita')
            .not('id_genero', 'is', null);

        // Aplicar filtro de rango de fechas si está disponible
        if (parametros.fechaInicial && parametros.fechaFinal) {
            console.log('📅 Aplicando filtro de fechas:', parametros.fechaInicial, 'a', parametros.fechaFinal);
            query = query
                .gte('fecha_visita', parametros.fechaInicial)
                .lte('fecha_visita', parametros.fechaFinal);
        }

        const { data: participantes, error } = await query;

        if (error) {
            console.error('❌ Error en consulta de participantes_reserva:', error);
            throw error;
        }

        console.log('👥 Participantes encontrados:', participantes);

        if (!participantes || participantes.length === 0) {
            console.log('⚠️ No hay participantes en el rango de fechas');
            return await obtenerEstructuraGenerosVacia();
        }

        // Obtener TODOS los géneros
        const { data: generos } = await supabase
            .from('genero')
            .select('id_genero, genero');

        if (!generos || generos.length === 0) {
            console.error('❌ No se encontraron géneros en la base de datos');
            throw new Error('No hay géneros configurados en el sistema');
        }

        console.log('🎭 Géneros disponibles:', generos);

        // Contar participantes por género
        const conteoPorGenero = {};
        participantes.forEach(participante => {
            if (participante.id_genero) {
                const generoId = participante.id_genero;
                conteoPorGenero[generoId] = (conteoPorGenero[generoId] || 0) + 1;
            }
        });

        console.log('📊 Conteo por género ID:', conteoPorGenero);

        // Combinar con nombres de géneros
        const datosCombinados = generos.map(genero => ({
            genero: genero.genero,
            count: conteoPorGenero[genero.id_genero] || 0
        }));

        console.log('✅ Datos combinados finales:', datosCombinados);

        return {
            labels: datosCombinados.map(item => item.genero),
            values: datosCombinados.map(item => item.count)
        };

    } catch (error) {
        console.error(`💥 Error cargando datos de género por ${tipo}:`, error);
        return await obtenerEstructuraGenerosVacia();
    }
}

// Función auxiliar para obtener estructura de géneros vacía
async function obtenerEstructuraGenerosVacia() {
    try {
        const { data: generos } = await supabase
            .from('genero')
            .select('id_genero, genero');

        if (generos && generos.length > 0) {
            return {
                labels: generos.map(g => g.genero),
                values: generos.map(() => 0)
            };
        } else {
            // Fallback por si no hay géneros en la base de datos
            return {
                labels: ['Masculino', 'Femenino', 'Otro', 'Prefiero no decirlo'],
                values: [0, 0, 0, 0]
            };
        }
    } catch (error) {
        console.error('Error obteniendo estructura de géneros:', error);
        return {
            labels: ['Masculino', 'Femenino', 'Otro', 'Prefiero no decirlo'],
            values: [0, 0, 0, 0]
        };
    }
}

// Función SIMPLIFICADA para aplicar filtro por mes
async function aplicarFiltroRangoMeses() {
    const fechaInicial = document.getElementById('filtroFechaInicialMes').value;
    const fechaFinal = document.getElementById('filtroFechaFinalMes').value;
    const generoSeleccionado = document.getElementById('filtroGeneroMes').value;
    
    console.log('🎯 Aplicando filtro por MES:', { fechaInicial, fechaFinal, generoSeleccionado });
    
    // Validaciones básicas
    if (!fechaInicial || !fechaFinal) {
        mostrarMensajeSinDatos('Por favor selecciona ambas fechas');
        return;
    }
    
    if (fechaInicial > fechaFinal) {
        mostrarMensajeSinDatos('La fecha inicial no puede ser mayor que la fecha final');
        return;
    }

    try {
        mostrarLoading('Cargando datos por mes...');
        
        // Usar la función genérica para procesar meses
        const datosProcesados = await procesarDatosPorPeriodo('mes', fechaInicial, fechaFinal, generoSeleccionado);
        
        cerrarLoading();
        
        // Verificar si hay datos
        if (datosProcesados.totalGeneral === 0) {
            mostrarMensajeSinDatos('No hay datos disponibles para el rango de meses seleccionado');
            return;
        }
        
        // Actualizar datos
        datosSimulados.mes = datosProcesados;
        tipoActual = 'mes'; // IMPORTANTE: Actualizar el tipo actual
        
        // Crear título
        let titulo;
        const mesInicial = obtenerNombreMesDesdeFecha(fechaInicial);
        const mesFinal = obtenerNombreMesDesdeFecha(fechaFinal);
        const añoInicial = obtenerAnioDesdeFecha(fechaInicial);
        const añoFinal = obtenerAnioDesdeFecha(fechaFinal);
        
        if (generoSeleccionado !== 'todos') {
            titulo = `${formatearGenero(generoSeleccionado)} por Mes - ${mesInicial} ${añoInicial} a ${mesFinal} ${añoFinal}`;
        } else {
            titulo = `Visitantes por Mes y Género - ${mesInicial} ${añoInicial} a ${mesFinal} ${añoFinal}`;
        }
        
        // Actualizar gráfica en el modal
        const modal = document.getElementById("chartModal");
        if (modal && modal.classList.contains('show')) {
            const modalTitle = document.getElementById("modalTitle");
            if (modalTitle) {
                modalTitle.innerHTML = `<i class="fas fa-calendar-week"></i> ${titulo}`;
            }
            
            const tipoGraficaActual = document.querySelector('.modal-chart-container').getAttribute('data-tipo-grafica');
            actualizarGraficaModal(tipoGraficaActual, titulo);
        }
        
        mostrarExito(`Se encontraron ${datosProcesados.totalGeneral} visitantes en ${datosProcesados.labels.length} meses`);

    } catch (error) {
        console.error('❌ Error aplicando filtro de mes:', error);
        cerrarLoading();
        mostrarMensajeSinDatos('Error al cargar los datos: ' + error.message);
    }
}

// Función para actualizar gráfica comparativa mensual (barras juntas por género)
function actualizarGraficaComparativaMensual(tipoGrafica, datosComparativa, titulo) {
    const ctx = document.getElementById("chartAmpliado").getContext("2d");
    
    if (chartAmpliado) chartAmpliado.destroy();

    const colors = generarColores('genero', datosComparativa.labels);
    const etiquetaDescriptiva = 'Géneros';

    // Configuración especial para gráfica comparativa mensual
    chartAmpliado = new Chart(ctx, {
        type: tipoGrafica === "bar" ? "bar" : "bar", // Forzar barras para comparación
        data: {
            labels: datosComparativa.labels.map(formatearGenero),
            datasets: [
                {
                    label: "Total de Visitantes",
                    data: datosComparativa.values,
                    backgroundColor: colors,
                    borderColor: colors.map(color => darkenColor(color, 0.3)),
                    borderWidth: 2,
                    borderRadius: 8,
                    barThickness: 35,
                    hoverBackgroundColor: colors.map(color => lightenColor(color, 0.1)),
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false, // Ocultar leyenda ya que los colores están en las barras
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
                            const value = context.parsed.y;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value.toLocaleString()} visitantes (${percentage}%)`;
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
                        font: { weight: 'bold', size: 14 }
                    },
                    // Mostrar siempre un valor mínimo para que se vean las barras pequeñas
                    suggestedMin: 0,
                    suggestedMax: function() {
                        const maxValue = Math.max(...datosComparativa.values);
                        return maxValue === 0 ? 10 : Math.ceil(maxValue * 1.2);
                    }
                },
                x: {
                    grid: { 
                        display: false 
                    },
                    title: {
                        display: true,
                        text: etiquetaDescriptiva,
                        font: { weight: 'bold', size: 14 }
                    },
                    ticks: {
                        font: {
                            size: 13,
                            weight: 'bold'
                        }
                    }
                }
            },
            // Animaciones para gráfica comparativa
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        },
    });

    // Actualizar tabla con datos comparativos mensuales
    actualizarTablaComparativaMensual(datosComparativa);
}

// Función para actualizar tabla comparativa mensual
function actualizarTablaComparativaMensual(datosComparativa) {
    const tbody = document.querySelector("#tablaDatos tbody");
    const total = datosComparativa.values.reduce((a, b) => a + b, 0);
    
    tbody.innerHTML = datosComparativa.labels
        .map((genero, index) => {
            const valor = datosComparativa.values[index];
            const porcentaje = total > 0 ? ((valor / total) * 100).toFixed(1) : 0;
            const generoFormateado = formatearGenero(genero);
            const claseGenero = obtenerClaseGenero(genero);
            
            // Destacar el valor máximo (solo si hay valores > 0)
            const valoresPositivos = datosComparativa.values.filter(v => v > 0);
            const esMaximo = valoresPositivos.length > 0 && valor === Math.max(...valoresPositivos) && valor > 0;
            const estiloFila = esMaximo ? 'background: linear-gradient(135deg, #ffeaa7, #fab1a0); font-weight: bold;' : '';
            
            return `
                <tr style="${estiloFila}">
                    <td>
                        <span class="gender-badge-3d ${claseGenero}">
                            <i class="fas ${
                                generoLower === 'masculino' ? 'fa-mars' : 
                                generoLower === 'femenino' ? 'fa-venus' : 
                                'fa-genderless'
                            }"></i>
                            ${generoFormateado}
                            ${esMaximo ? '<i class="fas fa-crown" style="margin-left: 5px; color: #f39c12;"></i>' : ''}
                        </span>
                    </td>
                    <td style="text-align: center; font-weight: bold; font-size: 16px;">
                        ${valor.toLocaleString()}
                    </td>
                    <td style="text-align: center; color: #2c3e50; font-weight: bold; font-size: 16px;">
                        ${porcentaje}%
                    </td>
                </tr>
            `;
        })
        .join("");
    
    // Agregar fila de total solo si hay datos
    if (total > 0) {
        tbody.innerHTML += `
            <tr style="background: linear-gradient(135deg, #a8e6cf, #dcedc1); font-weight: bold;">
                <td style="padding: 12px;">
                    <i class="fas fa-users"></i> TOTAL ${datosComparativa.mes} ${datosComparativa.año}
                </td>
                <td style="text-align: center; font-size: 16px;">${total.toLocaleString()}</td>
                <td style="text-align: center; font-size: 16px;">100%</td>
            </tr>
        `;
    }
}

// AGREGAR ESTA FUNCIÓN NUEVA (antes de que se llame)
function actualizarGraficaComparativa(tipoGrafica, datosComparativa, titulo) {
    console.log('🎨 Actualizando gráfica comparativa:', { tipoGrafica, datosComparativa, titulo });
    
    const ctx = document.getElementById("chartAmpliado").getContext("2d");
    
    if (chartAmpliado) chartAmpliado.destroy();

    const colors = generarColores(tipoActual, datosComparativa.labels);

    chartAmpliado = new Chart(ctx, {
        type: tipoGrafica === "bar" ? "bar" : "doughnut", // ← RESPETAR EL TIPO
        data: {
            labels: datosComparativa.labels.map(label => 
                tipoActual === 'genero' ? formatearGenero(label) : label
            ),
            datasets: [{
                label: "Total de Visitantes",
                data: datosComparativa.values,
                backgroundColor: colors,
                borderColor: colors.map(color => darkenColor(color, 0.3)),
                borderWidth: 2,
                borderRadius: tipoGrafica === "bar" ? 6 : 0,
                barThickness: tipoGrafica === "bar" ? 30 : undefined,
                hoverBackgroundColor: colors.map(color => lightenColor(color, 0.1)),
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: tipoGrafica === "bar" ? 'top' : 'right',
                    labels: {
                        padding: 15,
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
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${label}: ${value} visitantes (${percentage}%)`;
                        }
                    }
                }
            },
            scales: tipoGrafica === "bar" ? {
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
                        text: obtenerEtiquetaDescriptiva(tipoActual),
                        font: { weight: 'bold', size: 14 }
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 0
                    }
                }
            } : {},
            cutout: tipoGrafica === "bar" ? '0%' : '40%'
        }
    });

    // Actualizar tabla
    actualizarTablaComparativa(datosComparativa);
}

// Función SIMPLIFICADA para aplicar filtro por año
async function aplicarFiltroRangoAnios() {
    const fechaInicial = document.getElementById('filtroFechaInicialAnio').value;
    const fechaFinal = document.getElementById('filtroFechaFinalAnio').value;
    const generoSeleccionado = document.getElementById('filtroGeneroAnio').value;
    
    console.log('🎯 Aplicando filtro por AÑO:', { fechaInicial, fechaFinal, generoSeleccionado });
    
    // Validaciones básicas
    if (!fechaInicial || !fechaFinal) {
        mostrarMensajeSinDatos('Por favor selecciona ambas fechas');
        return;
    }
    
    if (fechaInicial > fechaFinal) {
        mostrarMensajeSinDatos('La fecha inicial no puede ser mayor que la fecha final');
        return;
    }

    try {
        mostrarLoading('Cargando datos por año...');
        
        // Usar la función genérica para procesar años
        const datosProcesados = await procesarDatosPorPeriodo('anio', fechaInicial, fechaFinal, generoSeleccionado);
        
        cerrarLoading();
        
        // Verificar si hay datos
        if (datosProcesados.totalGeneral === 0) {
            mostrarMensajeSinDatos('No hay datos disponibles para el rango de años seleccionado');
            return;
        }
        
        // Actualizar datos
        datosSimulados.anio = datosProcesados;
        tipoActual = 'anio'; // IMPORTANTE: Actualizar el tipo actual
        
        // Crear título
        let titulo;
        const añoInicial = obtenerAnioDesdeFecha(fechaInicial);
        const añoFinal = obtenerAnioDesdeFecha(fechaFinal);
        
        if (generoSeleccionado !== 'todos') {
            titulo = `${formatearGenero(generoSeleccionado)} por Año - ${añoInicial} a ${añoFinal}`;
        } else {
            titulo = `Visitantes por Año y Género - ${añoInicial} a ${añoFinal}`;
        }
        
        // Actualizar gráfica en el modal
        const modal = document.getElementById("chartModal");
        if (modal && modal.classList.contains('show')) {
            const modalTitle = document.getElementById("modalTitle");
            if (modalTitle) {
                modalTitle.innerHTML = `<i class="fas fa-calendar-alt"></i> ${titulo}`;
            }
            
            const tipoGraficaActual = document.querySelector('.modal-chart-container').getAttribute('data-tipo-grafica');
            actualizarGraficaModal(tipoGraficaActual, titulo);
        }
        
        mostrarExito(`Se encontraron ${datosProcesados.totalGeneral} visitantes en ${datosProcesados.labels.length} años`);

    } catch (error) {
        console.error('❌ Error aplicando filtro de año:', error);
        cerrarLoading();
        mostrarMensajeSinDatos('Error al cargar los datos: ' + error.message);
    }
}

// AGREGAR esta función nueva para procesar datos por año
function procesarDatosAgrupadosPorAnioYGenero(participantes, generos) {
    console.log('📊 Procesando datos agrupados por año y género...');
    
    // Obtener todos los años únicos
    const añosUnicos = [...new Set(
        participantes
            .filter(p => p.fecha_visita)
            .map(p => new Date(p.fecha_visita).getFullYear())
    )].sort((a, b) => a - b);
    
    // Obtener todos los géneros disponibles
    const todosLosGeneros = generos.map(g => g.genero);
    
    // Inicializar estructura de datos
    const datosPorAñoYGenero = {};
    
    // Inicializar para todos los años
    añosUnicos.forEach(año => {
        datosPorAñoYGenero[año] = {};
        todosLosGeneros.forEach(genero => {
            datosPorAñoYGenero[año][genero] = 0;
        });
    });
    
    // Contar participantes por año y género
    participantes.forEach(participante => {
        if (participante.fecha_visita && participante.genero) {
            const año = new Date(participante.fecha_visita).getFullYear();
            const genero = participante.genero.genero;
            
            if (datosPorAñoYGenero[año] && datosPorAñoYGenero[año][genero] !== undefined) {
                datosPorAñoYGenero[año][genero]++;
            }
        }
    });
    
    // Crear datasets para cada género
    const datasets = todosLosGeneros.map(genero => {
        const color = coloresPorGenero[genero] || '#95a5a6';
        return {
            label: genero,
            data: añosUnicos.map(año => datosPorAñoYGenero[año][genero] || 0),
            backgroundColor: color,
            borderColor: darkenColor(color, 0.3),
            borderWidth: 2,
            borderRadius: 6,
            barThickness: 25,
            barPercentage: 0.8,
            categoryPercentage: 0.9
        };
    });
    
    // Calcular totales
    const totalPorAño = añosUnicos.map(año => 
        todosLosGeneros.reduce((sum, genero) => sum + (datosPorAñoYGenero[año][genero] || 0), 0)
    );
    
    const totalGeneral = totalPorAño.reduce((a, b) => a + b, 0);
    
    console.log('✅ Datos agrupados por año procesados:', {
        años: añosUnicos,
        datasets: datasets,
        totalPorAño: totalPorAño,
        totalGeneral: totalGeneral
    });
    
    return {
        type: 'grouped',
        labels: añosUnicos.map(año => año.toString()),
        datasets: datasets,
        totalPorAño: totalPorAño,
        totalGeneral: totalGeneral,
        añosOriginales: añosUnicos,
        generos: todosLosGeneros
    };
}

// MODIFICAR la función actualizarGraficaAniosAgrupados() para barras JUNTAS
function actualizarGraficaAniosAgrupados(tipoGrafica, datosProcesados, titulo) {
    const ctx = document.getElementById("chartAmpliado").getContext("2d");
    
    if (chartAmpliado) chartAmpliado.destroy();

    // Configurar gráfica de barras agrupadas (BARRAS JUNTAS)
    chartAmpliado = new Chart(ctx, {
        type: 'bar', // SIEMPRE barras para esta vista
        data: {
            labels: datosProcesados.labels,
            datasets: datosProcesados.datasets
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
                            return `Año: ${tooltipItems[0].label}`;
                        },
                        label: function(context) {
                            const añoIndex = context.dataIndex;
                            const totalAño = datosProcesados.totalPorAño[añoIndex] || 0;
                            const valor = context.parsed.y;
                            const porcentaje = totalAño > 0 ? Math.round((valor / totalAño) * 100) : 0;
                            return `${context.dataset.label}: ${valor} visitantes (${porcentaje}%)`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    stacked: false, // IMPORTANTE: BARRAS JUNTAS, NO APILADAS
                    grid: { 
                        color: 'rgba(0,0,0,0.1)',
                        drawBorder: false
                    },
                    title: {
                        display: true,
                        text: 'Cantidad de Visitantes',
                        font: { weight: 'bold', size: 14 }
                    },
                    ticks: {
                        precision: 0
                    }
                },
                x: {
                    stacked: false, // IMPORTANTE: BARRAS JUNTAS
                    grid: { display: false },
                    title: {
                        display: true,
                        text: 'Años',
                        font: { weight: 'bold', size: 14 }
                    },
                    ticks: {
                        font: { size: 12 }
                    }
                }
            },
            // Configuración para barras juntas
            interaction: {
                intersect: false,
                mode: 'index'
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });

    // Actualizar tabla
    actualizarTablaAñosAgrupados(datosProcesados);
}

// // AGREGAR función para actualizar gráfica de años agrupados
// function actualizarGraficaAniosAgrupados(tipoGrafica, datosProcesados, titulo) {
//     const ctx = document.getElementById("chartAmpliado").getContext("2d");
    
//     if (chartAmpliado) chartAmpliado.destroy();

//     // Configurar gráfica de barras agrupadas
//     chartAmpliado = new Chart(ctx, {
//         type: tipoGrafica === "bar" ? "bar" : "doughnut",
//         data: {
//             labels: datosProcesados.labels,
//             datasets: datosProcesados.datasets
//         },
//         options: {
//             responsive: true,
//             maintainAspectRatio: false,
//             plugins: {
//                 legend: {
//                     position: 'top',
//                     labels: {
//                         padding: 15,
//                         usePointStyle: true,
//                         pointStyle: 'circle',
//                         font: { size: 13 }
//                     }
//                 },
//                 title: {
//                     display: true,
//                     text: titulo,
//                     font: { size: 18, weight: 'bold' },
//                     padding: 25
//                 },
//                 tooltip: {
//                     backgroundColor: 'rgba(0,0,0,0.8)',
//                     titleFont: { size: 14 },
//                     bodyFont: { size: 14 },
//                     padding: 12,
//                     cornerRadius: 8,
//                     callbacks: {
//                         title: function(tooltipItems) {
//                             return `Año: ${tooltipItems[0].label}`;
//                         },
//                         label: function(context) {
//                             const añoIndex = context.dataIndex;
//                             const totalAño = datosProcesados.totalPorAño[añoIndex] || 0;
//                             const valor = context.parsed.y;
//                             const porcentaje = totalAño > 0 ? Math.round((valor / totalAño) * 100) : 0;
//                             return `${context.dataset.label}: ${valor} visitantes (${porcentaje}%)`;
//                         }
//                     }
//                 }
//             },
//             scales: {
//                 y: {
//                     beginAtZero: true,
//                     stacked: false, // BARRAS JUNTAS, NO APILADAS
//                     grid: { 
//                         color: 'rgba(0,0,0,0.1)',
//                         drawBorder: false
//                     },
//                     title: {
//                         display: true,
//                         text: 'Cantidad de Visitantes',
//                         font: { weight: 'bold', size: 14 }
//                     }
//                 },
//                 x: {
//                     stacked: false, // BARRAS JUNTAS
//                     grid: { display: false },
//                     title: {
//                         display: true,
//                         text: 'Años',
//                         font: { weight: 'bold', size: 14 }
//                     },
//                     ticks: {
//                         font: { size: 12 }
//                     }
//                 }
//             },
//             animation: {
//                 duration: 1000,
//                 easing: 'easeOutQuart'
//             }
//         }
//     });

//     // Actualizar tabla
//     actualizarTablaAñosAgrupados(datosProcesados);
// }

// AGREGAR función para actualizar tabla de años agrupados
function actualizarTablaAñosAgrupados(datosProcesados) {
    const tbody = document.querySelector("#tablaDatos tbody");
    if (!tbody) return;
    
    let tablaHTML = '';
    
    // Para cada año
    datosProcesados.labels.forEach((año, añoIndex) => {
        const totalAño = datosProcesados.totalPorAño[añoIndex] || 0;
        
        if (totalAño > 0) {
            // Encabezado de año
            tablaHTML += `
                <tr style="background: linear-gradient(135deg, #f8f9fa, #e9ecef);">
                    <td colspan="3" style="font-weight: bold; color: #2c3e50; padding: 12px; border-bottom: 2px solid #dee2e6;">
                        <i class="fas fa-calendar-alt"></i> Año ${año} - Total: ${totalAño} visitantes
                    </td>
                </tr>
            `;
            
            // Detalle por género para este año
            datosProcesados.datasets.forEach(dataset => {
                const valor = dataset.data[añoIndex] || 0;
                if (valor > 0) {
                    const porcentaje = totalAño > 0 ? ((valor / totalAño) * 100).toFixed(1) : 0;
                    const claseGenero = obtenerClaseGenero(dataset.label.toLowerCase());
                    
                    tablaHTML += `
                        <tr>
                            <td style="padding-left: 30px;">
                                <span class="gender-badge ${claseGenero}">
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
    if (datosProcesados.totalGeneral > 0) {
        tablaHTML += `
            <tr style="background: linear-gradient(135deg, #a8e6cf, #dcedc1); font-weight: bold;">
                <td colspan="2" style="padding: 12px; border-top: 2px solid #2ecc71;">
                    <i class="fas fa-chart-bar"></i> TOTAL GENERAL
                </td>
                <td style="text-align: center; border-top: 2px solid #2ecc71;">${datosProcesados.totalGeneral.toLocaleString()}</td>
            </tr>
        `;
    }
    
    tbody.innerHTML = tablaHTML;
}

// Función para aplicar filtro de día específico
async function aplicarFiltroDiaEspecifico() {
    const diaSeleccionado = document.getElementById('filtroDiaEspecifico').value;
    
    if (diaSeleccionado === 'todos') {
        // Restaurar datos originales
        datosSimulados.dia = JSON.parse(JSON.stringify(datosOriginales.dia));
        actualizarGraficaModal(document.querySelector('.modal-chart-container').getAttribute('data-tipo-grafica'));
        return;
    }

    try {
        mostrarLoading('Aplicando filtro...');

        const ahora = new Date();
        const añoActual = ahora.getFullYear();
        const mesActual = ahora.getMonth();
        const diaNumero = parseInt(diaSeleccionado);
        
        // Crear fecha específica para el día seleccionado
        const fechaEspecifica = new Date(añoActual, mesActual, diaNumero);
        const fechaStr = fechaEspecifica.toISOString().split('T')[0];
        
        console.log('Consultando datos para fecha:', fechaStr);

        // Consultar participantes para esa fecha específica
        const { data: participantes, error } = await supabase
            .from('participantes_reserva')
            .select('id_genero, fecha_visita')
            .not('id_genero', 'is', null)
            .eq('fecha_visita', fechaStr);

        if (error) {
            console.error('Error en consulta de día específico:', error);
            throw error;
        }

        console.log('Participantes encontrados para el día:', participantes);

        // Obtener TODOS los géneros
        const { data: generos } = await supabase
            .from('genero')
            .select('id_genero, genero');

        // Contar participantes por género
        const conteoPorGenero = {};
        participantes.forEach(participante => {
            if (participante.id_genero) {
                const generoId = participante.id_genero;
                conteoPorGenero[generoId] = (conteoPorGenero[generoId] || 0) + 1;
            }
        });

        console.log('Conteo por género para el día:', conteoPorGenero);

        // Combinar datos de géneros con conteos - SIEMPRE incluir los 4 géneros
        const datosCombinados = generos.map(genero => ({
            genero: genero.genero,
            count: conteoPorGenero[genero.id_genero] || 0
        }));

        const datosFiltrados = {
            labels: datosCombinados.map(item => item.genero),
            values: datosCombinados.map(item => item.count)
        };

        cerrarLoading();

        // Verificar si hay datos
        const totalVisitantes = datosFiltrados.values.reduce((a, b) => a + b, 0);
        if (totalVisitantes === 0) {
            const nombreDia = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][fechaEspecifica.getDay()];
            mostrarMensajeSinDatos(`No hay datos disponibles para el ${nombreDia} ${diaNumero}`);
            return;
        }

        // Crear título descriptivo
        const nombreDia = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][fechaEspecifica.getDay()];
        const mesNombre = obtenerNombreMes(mesActual);
        const titulo = `Visitantes - ${nombreDia} ${diaNumero} de ${mesNombre} ${añoActual}`;
        
        // Actualizar datos y gráfica
        datosSimulados.dia = datosFiltrados;
        actualizarGraficaConFiltro(datosFiltrados, titulo);

    } catch (error) {
        console.error('Error aplicando filtro de día específico:', error);
        cerrarLoading();
        mostrarMensajeSinDatos('Error al cargar los datos para el día seleccionado');
    }
}

// Función para actualizar tabla con datos agrupados
function actualizarTablaDatosAgrupados(datosProcesados) {
    const tbody = document.querySelector("#tablaDatos tbody");
    if (!tbody) return;
    
    let tablaHTML = '';
    const totalGeneral = datosProcesados.total || 0;
    
    // Para cada fecha
    datosProcesados.labels.forEach((fecha, fechaIndex) => {
        let totalFecha = 0;
        
        // Calcular total por fecha
        datosProcesados.datasets.forEach(dataset => {
            totalFecha += dataset.data[fechaIndex] || 0;
        });
        
        if (totalFecha > 0) {
            // Encabezado de fecha
            tablaHTML += `
                <tr style="background: linear-gradient(135deg, #f8f9fa, #e9ecef);">
                    <td colspan="3" style="font-weight: bold; color: #2c3e50; padding: 12px; border-bottom: 2px solid #dee2e6;">
                        <i class="fas fa-calendar-day"></i> ${fecha} - Total: ${totalFecha} visitantes
                    </td>
                </tr>
            `;
            
            // Detalle por género para esta fecha
            datosProcesados.datasets.forEach(dataset => {
                const valor = dataset.data[fechaIndex] || 0;
                if (valor > 0) {
                    const porcentaje = totalFecha > 0 ? ((valor / totalFecha) * 100).toFixed(1) : 0;
                    const claseGenero = obtenerClaseGenero(dataset.label.trim().toLowerCase());
                    
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
                    <i class="fas fa-chart-bar"></i> TOTAL GENERAL (${formatearFecha(datosProcesados.fechaInicial)} - ${formatearFecha(datosProcesados.fechaFinal)})
                </td>
                <td style="text-align: center; border-top: 2px solid #2ecc71;">${totalGeneral.toLocaleString()}</td>
            </tr>
        `;
    }
    
    tbody.innerHTML = tablaHTML;
}

// Función para actualizar tabla con datos simples (género específico)
function actualizarTablaDatosSimples(datosProcesados) {
    const tbody = document.querySelector("#tablaDatos tbody");
    if (!tbody) return;
    
    const total = datosProcesados.total || datosProcesados.values.reduce((a, b) => a + b, 0);
    
    let tablaHTML = datosProcesados.labels.map((fecha, index) => {
        const valor = datosProcesados.values[index];
        const porcentaje = total > 0 ? ((valor / total) * 100).toFixed(1) : 0;
        
        return `
            <tr>
                <td style="padding: 10px; font-weight: bold;">
                    <i class="fas fa-calendar-day"></i> ${fecha}
                </td>
                <td style="text-align: center; font-weight: bold">${valor.toLocaleString()}</td>
                <td style="text-align: center; color: #2c3e50; font-weight: bold">${porcentaje}%</td>
            </tr>
        `;
    }).join('');
    
    // Fila de total
    if (total > 0) {
        tablaHTML += `
            <tr style="background: linear-gradient(135deg, #a8e6cf, #dcedc1); font-weight: bold;">
                <td style="padding: 12px;">
                    <i class="fas fa-users"></i> TOTAL ${formatearGenero(datosProcesados.genero)}
                </td>
                <td style="text-align: center;">${total.toLocaleString()}</td>
                <td style="text-align: center;">100%</td>
            </tr>
        `;
    }
    
    tbody.innerHTML = tablaHTML;
}

// Función para aplicar filtro de intereses
async function aplicarFiltroIntereses() {
    // Obtener elementos del DOM con verificación
    const fechaInicialElement = document.getElementById('filtroFechaInicialIntereses');
    const fechaFinalElement = document.getElementById('filtroFechaFinalIntereses');
    const interesElement = document.getElementById('filtroInteresEspecifico');
    
    // Verificar que los elementos existan
    if (!fechaInicialElement || !fechaFinalElement || !interesElement) {
        console.error('❌ No se encontraron los elementos del filtro de intereses');
        mostrarMensajeSinDatos('Error: No se pudieron cargar los filtros');
        return;
    }
    
    const fechaInicial = fechaInicialElement.value;
    const fechaFinal = fechaFinalElement.value;
    const interesSeleccionado = interesElement.value;
    
    console.log('🎯 Aplicando filtro INTERESES con parámetros:', {
        fechaInicial, 
        fechaFinal, 
        interesSeleccionado
    });
    
    // Validaciones
    if (!fechaInicial || !fechaFinal) {
        mostrarMensajeSinDatos('Por favor selecciona ambas fechas');
        return;
    }
    
    if (fechaInicial > fechaFinal) {
        mostrarMensajeSinDatos('La fecha inicial no puede ser mayor que la fecha final');
        return;
    }

    try {
        mostrarLoading('Aplicando filtro...');

        // Cargar datos de intereses
        const datosFiltrados = await cargarDatosInteresesPorTiempo(fechaInicial, fechaFinal, interesSeleccionado);

        console.log('✅ Datos INTERESES filtrados obtenidos:', datosFiltrados);

        cerrarLoading();

        // Verificar si hay datos
        const totalVisitantes = datosFiltrados.values.reduce((a, b) => a + b, 0);
        console.log('👥 Total de visitantes encontrados:', totalVisitantes);
        
        if (totalVisitantes === 0) {
            mostrarMensajeSinDatos('No hay datos disponibles para los criterios seleccionados');
            return;
        }

        // Crear título descriptivo según el tipo de datos
        let titulo;
        if (datosFiltrados.type === 'genero') {
            // Muestra géneros para un interés específico
            titulo = `Distribución por Género - Interés: ${datosFiltrados.interes}`;
            if (fechaInicial && fechaFinal) {
                titulo += ` (${formatearFecha(fechaInicial)} - ${formatearFecha(fechaFinal)})`;
            }
        } else {
            // Muestra todos los intereses
            titulo = 'Visitantes por Interés en Heliconias';
            if (fechaInicial && fechaFinal) {
                titulo += ` (${formatearFecha(fechaInicial)} - ${formatearFecha(fechaFinal)})`;
            }
        }

        console.log('🎯 Datos finales para mostrar:', datosFiltrados);
        
        // Actualizar datos y gráfica
        datosSimulados.intereses = datosFiltrados;
        
        // Actualizar la gráfica del modal
        const modal = document.getElementById("chartModal");
        if (modal && modal.classList.contains('show')) {
            console.log('🔄 Actualizando gráfica en modal...');
            
            // Actualizar título del modal
            const modalTitle = document.getElementById("modalTitle");
            if (modalTitle) {
                modalTitle.innerHTML = `<i class="fas fa-expand"></i> ${titulo}`;
            }
            
            // Actualizar la gráfica
            const tipoGraficaActual = document.querySelector('.modal-chart-container').getAttribute('data-tipo-grafica');
            actualizarGraficaModal(tipoGraficaActual, titulo);
        }

        // Mostrar resumen
        mostrarExito(`Se encontraron ${totalVisitantes} visitantes en el rango seleccionado`);

    } catch (error) {
        console.error('💥 Error aplicando filtro de intereses:', error);
        cerrarLoading();
        mostrarMensajeSinDatos('Error al cargar los datos: ' + error.message);
    }
}

// Función placeholder para cargar datos de intereses por tiempo
async function cargarDatosInteresesPorTiempo(fechaInicial, fechaFinal, interes) {
    console.log('Función cargarDatosInteresesPorTiempo - por implementar');
    // Por ahora retornamos datos vacíos
    return {
        labels: ['Observación', 'Fotografía', 'Investigación', 'Educación', 'Recreación'],
        values: [0, 0, 0, 0, 0],
        type: 'interes'
    };
}

// Función para procesar datos de género específico por fecha - VERSIÓN CORREGIDA
function procesarDatosGeneroEspecificoPorFecha(participantes, generoSeleccionado) {
    console.log(`📊 Procesando datos para género específico: ${generoSeleccionado}`);
    
    // Agrupar por fecha
    const visitasPorFecha = {};
    
    participantes.forEach(participante => {
        if (participante.fecha_visita) {
            const fechaCorta = formatearFechaCorta(participante.fecha_visita);
            visitasPorFecha[fechaCorta] = (visitasPorFecha[fechaCorta] || 0) + 1;
        }
    });
    
    // Ordenar fechas cronológicamente
    const fechasOrdenadas = Object.keys(visitasPorFecha).sort((a, b) => {
        return new Date(a) - new Date(b);
    });
    
    return {
        type: 'genero_especifico',
        genero: generoSeleccionado,
        labels: fechasOrdenadas,
        values: fechasOrdenadas.map(fecha => visitasPorFecha[fecha] || 0),
        total: Object.values(visitasPorFecha).reduce((a, b) => a + b, 0)
    };
}

// Función para actualizar gráfica de género específico - VERSIÓN CORREGIDA
function actualizarGraficaGeneroEspecifico(datosProcesados, titulo) {
    const ctx = document.getElementById("chartAmpliado").getContext("2d");
    
    if (chartAmpliado) chartAmpliado.destroy();

    const colors = generarColores('fecha', datosProcesados.labels);
    
    chartAmpliado = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: datosProcesados.labels,
            datasets: [{
                label: `Visitantes ${formatearGenero(datosProcesados.genero)}`,
                data: datosProcesados.values,
                backgroundColor: colors,
                borderColor: colors.map(color => darkenColor(color, 0.3)),
                borderWidth: 2,
                borderRadius: 6,
                barThickness: 25,
                hoverBackgroundColor: colors.map(color => lightenColor(color, 0.1)),
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        padding: 15,
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
                            return `${context.dataset.label}: ${context.parsed.y} visitantes`;
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
                        font: { weight: 'bold', size: 14 }
                    }
                },
                x: {
                    grid: { display: false },
                    title: {
                        display: true,
                        text: 'Fechas de Visita',
                        font: { weight: 'bold', size: 14 }
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
        }
    });
    
    // Actualizar tabla
    actualizarTablaDatosSimples(datosProcesados);
}

// Función SIMPLIFICADA para aplicar filtro por género y fecha
async function aplicarFiltroPorGeneroYFecha() {
    const fechaInicial = document.getElementById('filtroFechaInicial').value;
    const fechaFinal = document.getElementById('filtroFechaFinal').value;
    const generoSeleccionado = document.getElementById('filtroGeneroFecha').value;
    
    console.log('🎯 Aplicando filtro por FECHA:', { fechaInicial, fechaFinal, generoSeleccionado});
    
    // Validaciones básicas
    if (!fechaInicial || !fechaFinal) {
        mostrarMensajeSinDatos('Por favor selecciona ambas fechas');
        return;
    }
    
    if (fechaInicial > fechaFinal) {
        mostrarMensajeSinDatos('La fecha inicial no puede ser mayor que la fecha final');
        return;
    }

    try {
        mostrarLoading('Cargando datos por fecha...');
        
        // Usar la función genérica para procesar fechas
        const datosProcesados = await procesarDatosPorPeriodo('fecha', fechaInicial, fechaFinal, generoSeleccionado);
        
        cerrarLoading();
        
        // Verificar si hay datos
        if (datosProcesados.totalGeneral === 0) {
            mostrarMensajeSinDatos('No hay datos disponibles para el rango de fechas seleccionado');
            return;
        }
        
        // Actualizar datos
        datosSimulados.fecha = datosProcesados;
        tipoActual = 'fecha'; // IMPORTANTE: Actualizar el tipo actual
        
        // Crear título
        let titulo;
        if (generoSeleccionado !== 'todos') {
            titulo = `${formatearGenero(generoSeleccionado)} por Fecha - ${formatearFecha(fechaInicial)} a ${formatearFecha(fechaFinal)}`;
        } else {
            titulo = `Visitantes por Fecha y Género - ${formatearFecha(fechaInicial)} a ${formatearFecha(fechaFinal)}`;
        }
        
        // Actualizar gráfica en el modal
        const modal = document.getElementById("chartModal");
        if (modal && modal.classList.contains('show')) {
            const modalTitle = document.getElementById("modalTitle");
            if (modalTitle) {
                modalTitle.innerHTML = `<i class="fas fa-calendar"></i> ${titulo}`;
            }
            
            const tipoGraficaActual = document.querySelector('.modal-chart-container').getAttribute('data-tipo-grafica');
            actualizarGraficaModal(tipoGraficaActual, titulo);
        }
        
        mostrarExito(`Se encontraron ${datosProcesados.totalGeneral} visitantes en ${datosProcesados.labels.length} fechas`);

    } catch (error) {
        console.error('❌ Error aplicando filtro de fecha:', error);
        cerrarLoading();
        mostrarMensajeSinDatos('Error al cargar los datos: ' + error.message);
    }
}
// ====================================================================
// FUNCIONES NUEVAS QUE FALTAN - AÑADIR ANTES DE actualizarGraficaModalConDatosAgrupados
// ====================================================================

// Función para actualizar gráfica de meses agrupados (BARRAS JUNTAS)
function actualizarGraficaMesesAgrupados(tipoGrafica, datosProcesados, titulo) {
    const ctx = document.getElementById("chartAmpliado").getContext("2d");
    
    if (chartAmpliado) chartAmpliado.destroy();

    // Configurar gráfica de barras agrupadas (BARRAS JUNTAS)
    chartAmpliado = new Chart(ctx, {
        type: 'bar', // SIEMPRE barras para esta vista
        data: {
            labels: datosProcesados.labels,
            datasets: datosProcesados.datasets
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
                            return `Mes: ${tooltipItems[0].label}`;
                        },
                        label: function(context) {
                            const mesIndex = context.dataIndex;
                            const totalMes = datosProcesados.totalPorPeriodo[mesIndex] || 0;
                            const valor = context.parsed.y;
                            const porcentaje = totalMes > 0 ? Math.round((valor / totalMes) * 100) : 0;
                            return `${context.dataset.label}: ${valor} visitantes (${porcentaje}%)`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    stacked: false, // IMPORTANTE: BARRAS JUNTAS, NO APILADAS
                    grid: { 
                        color: 'rgba(0,0,0,0.1)',
                        drawBorder: false
                    },
                    title: {
                        display: true,
                        text: 'Cantidad de Visitantes',
                        font: { weight: 'bold', size: 14 }
                    },
                    ticks: {
                        precision: 0
                    }
                },
                x: {
                    stacked: false, // IMPORTANTE: BARRAS JUNTAS
                    grid: { display: false },
                    title: {
                        display: true,
                        text: 'Meses',
                        font: { weight: 'bold', size: 14 }
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 0,
                        font: { size: 12 }
                    }
                }
            },
            // Configuración para barras juntas
            interaction: {
                intersect: false,
                mode: 'index'
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });

    // Actualizar tabla
    actualizarTablaMesesAgrupados(datosProcesados);
}

// Función para actualizar gráfica de años agrupados (BARRAS JUNTAS)
function actualizarGraficaAniosAgrupados(tipoGrafica, datosProcesados, titulo) {
    const ctx = document.getElementById("chartAmpliado").getContext("2d");
    
    if (chartAmpliado) chartAmpliado.destroy();

    // Configurar gráfica de barras agrupadas (BARRAS JUNTAS)
    chartAmpliado = new Chart(ctx, {
        type: 'bar', // SIEMPRE barras para esta vista
        data: {
            labels: datosProcesados.labels,
            datasets: datosProcesados.datasets
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
                            return `Año: ${tooltipItems[0].label}`;
                        },
                        label: function(context) {
                            const añoIndex = context.dataIndex;
                            const totalAño = datosProcesados.totalPorAño[añoIndex] || 0;
                            const valor = context.parsed.y;
                            const porcentaje = totalAño > 0 ? Math.round((valor / totalAño) * 100) : 0;
                            return `${context.dataset.label}: ${valor} visitantes (${porcentaje}%)`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    stacked: false, // IMPORTANTE: BARRAS JUNTAS, NO APILADAS
                    grid: { 
                        color: 'rgba(0,0,0,0.1)',
                        drawBorder: false
                    },
                    title: {
                        display: true,
                        text: 'Cantidad de Visitantes',
                        font: { weight: 'bold', size: 14 }
                    },
                    ticks: {
                        precision: 0
                    }
                },
                x: {
                    stacked: false, // IMPORTANTE: BARRAS JUNTAS
                    grid: { display: false },
                    title: {
                        display: true,
                        text: 'Años',
                        font: { weight: 'bold', size: 14 }
                    },
                    ticks: {
                        font: { size: 12 }
                    }
                }
            },
            // Configuración para barras juntas
            interaction: {
                intersect: false,
                mode: 'index'
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });

    // Actualizar tabla
    actualizarTablaAñosAgrupados(datosProcesados);
}

// Función para actualizar tabla de meses agrupados - VERSIÓN COMPLETA
function actualizarTablaMesesAgrupados(datosProcesados) {
    const tbody = document.querySelector("#tablaDatos tbody");
    if (!tbody) return;
    
    let tablaHTML = '';
    
    // Para cada mes
    datosProcesados.labels.forEach((mes, mesIndex) => {
        const totalMes = datosProcesados.totalPorPeriodo[mesIndex] || 0;
        
        if (totalMes > 0) {
            // Encabezado de mes
            tablaHTML += `
                <tr style="background: linear-gradient(135deg, #f8f9fa, #e9ecef);">
                    <td colspan="3" style="font-weight: bold; color: #2c3e50; padding: 12px; border-bottom: 2px solid #dee2e6;">
                        <i class="fas fa-calendar-week"></i> ${mes} - Total: ${totalMes} visitantes
                    </td>
                </tr>
            `;
            
            // Detalle por género para este mes
            datosProcesados.datasets.forEach(dataset => {
                const valor = dataset.data[mesIndex] || 0;
                if (valor > 0) {
                    const porcentaje = totalMes > 0 ? ((valor / totalMes) * 100).toFixed(1) : 0;
                    const claseGenero = obtenerClaseGenero(dataset.label.trim().toLowerCase());
                    
                    tablaHTML += `
                        <tr>
                            <td style="padding-left: 30px;">
                                <span class="gender-badge ${claseGenero}">
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
    if (datosProcesados.totalGeneral > 0) {
        tablaHTML += `
            <tr style="background: linear-gradient(135deg, #a8e6cf, #dcedc1); font-weight: bold;">
                <td colspan="2" style="padding: 12px; border-top: 2px solid #2ecc71;">
                    <i class="fas fa-chart-bar"></i> TOTAL GENERAL
                </td>
                <td style="text-align: center; border-top: 2px solid #2ecc71;">${datosProcesados.totalGeneral.toLocaleString()}</td>
            </tr>
        `;
    }
    
    tbody.innerHTML = tablaHTML;
}

// ====================================================================
// FIN DE FUNCIONES NUEVAS
// ====================================================================


// Función para actualizar gráfica con datos filtrados
function actualizarGraficaConFiltro(datosFiltrados, tituloPersonalizado) {
    const ctx = document.getElementById("chartAmpliado").getContext("2d");
    const tipoGrafica = document.querySelector('.modal-chart-container').getAttribute('data-tipo-grafica');

    if (chartAmpliado) chartAmpliado.destroy();

    // Actualizar título del modal
    const modalTitle = document.getElementById("modalTitle");
    modalTitle.innerHTML = `<i class="fas fa-expand"></i> ${tituloPersonalizado}`;

    const colors = generarColores(tipoActual, datosFiltrados.labels);

    const labelsParaGrafica = tipoActual === 'genero' ? datosFiltrados.labels.map(formatearGenero) : 
                            tipoActual === 'fecha' ? datosFiltrados.labels.map(formatearGenero) :
                            datosFiltrados.labels;

    chartAmpliado = new Chart(ctx, {
        type: tipoGrafica === "bar" ? "bar" : "doughnut",
        data: {
            labels: labelsParaGrafica,
            datasets: [
                {
                    label: "Total de Visitantes",
                    data: datosFiltrados.values,
                    backgroundColor: colors,
                    borderRadius: tipoGrafica === "bar" ? 6 : 0,
                    borderWidth: tipoGrafica === "bar" ? 0 : 2,
                    borderColor: tipoGrafica === "bar" ? 'transparent' : '#fff',
                    barThickness: tipoGrafica === "bar" ? 18 : undefined,
                },
            ],
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
                        font: { size: 13 }
                    }
                },
                title: {
                    display: true,
                    text: tituloPersonalizado,
                    font: { size: 18, weight: 'bold' },
                    padding: 25
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    titleFont: { size: 14 },
                    bodyFont: { size: 14 },
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed.y || context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value.toLocaleString()} visitantes (${percentage}%)`;
                        }
                    }
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
                        text: obtenerEtiquetaDescriptiva(tipoActual),
                        font: { weight: 'bold', size: 14 }
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 0
                    }
                }
            } : {},
            cutout: tipoGrafica === "bar" ? '0%' : '40%'
        },
    });

    // Actualizar tabla con datos filtrados normales
    const tbody = document.querySelector("#tablaDatos tbody");
    const total = datosFiltrados.values.reduce((a, b) => a + b, 0);
    
    tbody.innerHTML = datosFiltrados.labels
        .map((l, i) => {
            const porcentaje = total > 0 ? ((datosFiltrados.values[i] / total) * 100).toFixed(1) : 0;
            
            const labelFormateado = tipoActual === 'genero' ? formatearGenero(l) : 
                                tipoActual === 'fecha' ? formatearGenero(l) :
                                l;
            
            if (tipoActual === 'genero' || tipoActual === 'fecha') {
                const claseGenero = obtenerClaseGenero(l);
                return `<tr>
                    <td>
                        <span class="gender-badge ${claseGenero}">
                            <i class="fas ${l === 'masculino' ? 'fa-mars' : l === 'femenino' ? 'fa-venus' : 'fa-genderless'}"></i>
                            ${labelFormateado}
                        </span>
                    </td>
                    <td style="text-align: center;"><strong>${datosFiltrados.values[i].toLocaleString()}</strong></td>
                    <td style="text-align: center; color: #2c3e50; font-weight: bold">${porcentaje}%</td>
                </tr>`;
            } else {
                return `<tr>
                    <td><strong>${labelFormateado}</strong></td>
                    <td style="text-align: center;"><strong>${datosFiltrados.values[i].toLocaleString()}</strong></td>
                    <td style="text-align: center; color: #2c3e50; font-weight: bold">${porcentaje}%</td>
                </tr>`;
            }
        })
        .join("");
}

// Agrega esto en data-functions.js para debug
async function debugFechasBD() {
    console.log('🔍 DEBUG: Consultando fechas en la BD...');
    
    const { data, error } = await supabase
        .from('participantes_reserva')
        .select('fecha_visita, id_genero')
        .limit(10);
        
    if (error) {
        console.error('❌ Error:', error);
    } else {
        console.log('📅 Fechas en BD:', data);
        console.log('📅 Formato de fechas:');
        data.forEach((item, i) => {
            console.log(`${i + 1}. ${item.fecha_visita} (genero: ${item.id_genero})`);
        });
    }
}

// Ejecutar en consola: debugFechasBD()

// Función placeholder para insertar datos de prueba
function insertarDatosDePrueba() {
    console.log('Función insertarDatosDePrueba - por implementar');
    mostrarMensajeSinDatos('Función en desarrollo');
}

// Funciones de utilidad (deben estar definidas en tu código)
function mostrarLoading(mensaje) {
    // Implementación de mostrar loading
    console.log('Loading:', mensaje);
}

function cerrarLoading() {
    // Implementación de cerrar loading
    console.log('Cerrando loading');
}

function mostrarError(mensaje) {
    // Implementación de mostrar error
    console.error('Error:', mensaje);
}

function mostrarExito(mensaje) {
    // Implementación de mostrar éxito
    console.log('Éxito:', mensaje);
}

function mostrarMensajeSinDatos(mensaje) {
    // Implementación de mostrar mensaje sin datos
    console.warn('Sin datos:', mensaje);
}

function mostrarDatos() {
    // Implementación de mostrar datos
    console.log('Mostrando datos');
}

function actualizarGraficaModal(tipoGrafica, titulo) {
    // Implementación de actualizar gráfica modal
    console.log('Actualizando gráfica modal:', tipoGrafica, titulo);
}