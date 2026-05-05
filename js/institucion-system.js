// js/institucion-system.js - SISTEMA DE INSTITUCIÓN COMPLETO CON FILTROS EN MODAL
(function() {
    'use strict';
    
    // =============================================
    // VARIABLES PRIVADAS
    // =============================================
    let chartBarInstitucion, chartPieInstitucion, chartAmpliadoInstitucion;
    let chartFechaBar, chartFechaPie, chartMesBar, chartMesPie, chartAnioBar, chartAnioPie;
    let tipoActual = "institucion";
    let datosInstituciones = {};
    let datosOriginales = {};
    let datosFecha = {};
    let datosMes = {};
    let datosAnio = {};
    let institucionesFiltradas = [];
    let todasLasInstituciones = [];

    // Paletas de colores
    const coloresInstituciones = [
        '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
        '#1abc9c', '#d35400', '#34495e', '#16a085', '#27ae60'
    ];

    const coloresPorTiempo = {
        fecha: ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'],
        mes: ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c', '#d35400', '#27ae60'],
        anio: ['#3498db', '#e67e22', '#2ecc71', '#9b59b6', '#f1c40f']
    };

    // =============================================
    // FUNCIONES DE UTILIDAD
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

    function mostrarError(mensaje) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: mensaje,
                confirmButtonColor: '#e74c3c'
            });
        }
        const container = document.getElementById('data-container');
        if (container) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error al cargar datos</h3>
                    <p>${mensaje}</p>
                    <button class="btn btn-primary" onclick="window.InstitucionManager.inicializar()">
                        <i class="fas fa-redo"></i> Reintentar
                    </button>
                </div>
            `;
        }
    }

    function mostrarExito(mensaje) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: mensaje,
                timer: 2500, // 2.5 segundos
                timerProgressBar: true,
                showConfirmButton: false,
                position: 'top-end',
                toast: true, // Hace que aparezca como notificación pequeña
                background: '#f8f9fa',
                color: '#2e7d32',
                iconColor: '#2e7d32'
            });
        }
    }

    function mostrarSinDatos() {
        const container = document.getElementById('data-container');
        if (container) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-school"></i>
                    <h3>No hay datos disponibles</h3>
                    <p>No se encontraron datos en la base de datos.</p>
                    <button class="btn btn-primary" onclick="window.InstitucionManager.inicializar()">
                        <i class="fas fa-redo"></i> Reintentar
                    </button>
                </div>
            `;
        }
    }

    function mostrarSinDatosTiempo(tipo) {
        const container = document.getElementById('data-container');
        if (container) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-calendar-times"></i>
                    <h3>No hay datos de ${tipo} disponibles</h3>
                    <p>No se encontraron visitantes con fechas de visita registradas.</p>
                    <button class="btn btn-primary" onclick="window.InstitucionManager.cambiarTipoReporte('${tipo}')">
                        <i class="fas fa-redo"></i> Reintentar
                    </button>
                </div>
            `;
        }
    }

    function mostrarSinDatosFiltrados() {
        const container = document.getElementById('data-container');
        if (container) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-search"></i>
                    <h3>No hay datos con los filtros aplicados</h3>
                    <p>Intenta con otros criterios de búsqueda o limpia los filtros.</p>
                    <button class="btn btn-primary" onclick="window.InstitucionManager.limpiarFiltrosCombinados()">
                        <i class="fas fa-times"></i> Limpiar Filtros
                    </button>
                </div>
            `;
        }
    }

    // =============================================
    // FUNCIONES PRINCIPALES
    // =============================================

    // Función para cargar datos completos
    async function cargarDatosCompletos() {
        try {
            mostrarLoading('Cargando datos completos...');
            
            // Primero asegurar que las instituciones estén cargadas
            if (!Array.isArray(todasLasInstituciones) || todasLasInstituciones.length === 0) {
                await cargarInstitucionesBase();
            }
            
            // Cargar datos de instituciones
            await cargarDatosInstitucion();
            
            // Cargar datos de tiempo si es necesario
            if (tipoActual !== 'institucion') {
                await cargarDatosTiempo(tipoActual);
            }
            
            cerrarLoading();
            
        } catch (error) {
            console.error('Error cargando datos completos:', error);
            cerrarLoading();
            mostrarError('Error al cargar los datos: ' + error.message);
        }
    }
       
        // Función para cargar datos de instituciones - VERSIÓN CORREGIDA
        async function cargarDatosInstitucion() {
            try {
                console.log('=== CARGANDO DATOS DE INSTITUCIÓN ===');
                
                // 1. Cargar instituciones primero
                if (!Array.isArray(todasLasInstituciones) || todasLasInstituciones.length === 0) {
                    await cargarInstitucionesBase();
                }
                
                // 2. Obtener todos los participantes
                const { data: participantes, error: errorParticipantes } = await supabase
                    .from('participantes_reserva')
                    .select('id_institucion, fecha_visita')
                    .not('id_institucion', 'is', null);

                if (errorParticipantes) throw errorParticipantes;

                if (!participantes || participantes.length === 0) {
                    mostrarSinDatos();
                    return;
                }

                // 3. Contar participantes por institución
                const conteoInstituciones = {};
                const institucionesEncontradas = new Set();
                
                participantes.forEach(participante => {
                    const institucion = todasLasInstituciones.find(i => i.id_institucion === participante.id_institucion);
                    if (institucion && institucion.nombre_institucion) {
                        const nombreInstitucion = institucion.nombre_institucion.trim();
                        conteoInstituciones[nombreInstitucion] = (conteoInstituciones[nombreInstitucion] || 0) + 1;
                        institucionesEncontradas.add(nombreInstitucion);
                    }
                });

                console.log(`📊 Encontradas ${Object.keys(conteoInstituciones).length} instituciones con visitantes`);

                // 4. Agrupar instituciones
                const resultado = agruparInstituciones(conteoInstituciones);
                
                // 5. Procesar datos para la interfaz
                procesarDatosInstitucion(
                    resultado.institucionesPrincipales,
                    resultado.otrasInstituciones,
                    resultado.todasLasInstituciones,
                    resultado.institucionesArray
                );

                console.log('✅ Datos de institución cargados exitosamente');

            } catch (error) {
                console.error('Error en cargarDatosInstitucion:', error);
                throw error;
            }
        }

    //depronto quitar
    // Función para inicializar el sistema de manera segura
    async function inicializarSistemaSeguro() {
        try {
            // Primero cargar las instituciones
            await cargarInstitucionesBase();
            // Luego cargar los datos completos
            await cargarDatosCompletos();
        } catch (error) {
            console.error('Error inicializando sistema:', error);
            mostrarError('Error al inicializar el sistema: ' + error.message);
        }
    }

    // Función para cargar solo las instituciones
    async function cargarInstitucionesBase() {
        try {
            const { data: instituciones, error } = await supabase
                .from('instituciones')
                .select('id_institucion, nombre_institucion')
                .order('nombre_institucion');

            if (error) throw error;
            
            // Asegurar que es un array
            todasLasInstituciones = Array.isArray(instituciones) ? instituciones : [];
            
            console.log(`✅ Cargadas ${todasLasInstituciones.length} instituciones`);
            
        } catch (error) {
            console.error('Error cargando instituciones base:', error);
            todasLasInstituciones = []; // Asegurar que sea array vacío
            throw error;
        }
    }
    //finnn
    // Función para obtener el color de una institución específica - VERSIÓN MEJORADA
    function obtenerColorInstitucion(nombreInstitucion) {
        if (!nombreInstitucion) return '#3498db'; // Color por defecto
        
        // 1. Buscar en datosInstituciones actuales
        if (datosInstituciones.colors && datosInstituciones.labels) {
            const index = datosInstituciones.labels.indexOf(nombreInstitucion);
            if (index !== -1 && datosInstituciones.colors[index]) {
                return datosInstituciones.colors[index];
            }
        }
        
        // 2. Buscar en datosOriginales
        if (datosOriginales.colors && datosOriginales.labels) {
            const index = datosOriginales.labels.indexOf(nombreInstitucion);
            if (index !== -1 && datosOriginales.colors[index]) {
                return datosOriginales.colors[index];
            }
        }
        
        // 3. Si no se encuentra, generar color consistente basado en el nombre
        const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', 
                        '#1abc9c', '#d35400', '#34495e', '#16a085', '#27ae60'];
        
        // Generar índice estable basado en el nombre (hash)
        let hash = 0;
        for (let i = 0; i < nombreInstitucion.length; i++) {
            hash = nombreInstitucion.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % colors.length;
        return colors[index];
    }

    // Agrupar instituciones - OPCIÓN 4 RECOMENDADA
    function agruparInstituciones(conteoInstituciones) {
        console.log('🔄 Procesando', Object.keys(conteoInstituciones).length, 'instituciones...');
        
        // Convertir a array y ordenar por cantidad descendente
        let institucionesArray = Object.entries(conteoInstituciones)
            .map(([nombre, cantidad]) => ({ nombre, cantidad }))
            .sort((a, b) => b.cantidad - a.cantidad);
        
        // Para el gráfico principal, mostrar máximo 25 instituciones
        const maxParaGrafico = 25;
        
        // Separar las que van al gráfico y las que no
        const institucionesParaGrafico = {};
        const institucionesRestantes = {};
        
        institucionesArray.forEach((inst, index) => {
            if (index < maxParaGrafico) {
                institucionesParaGrafico[inst.nombre] = inst.cantidad;
            } else {
                institucionesRestantes[inst.nombre] = inst.cantidad;
            }
        });
        
        // Sumar las instituciones restantes para "Otras"
        const otrasCount = Object.values(institucionesRestantes).reduce((a, b) => a + b, 0);
        
        // Solo agregar "Otras" si hay instituciones restantes
        if (otrasCount > 0 && Object.keys(institucionesRestantes).length > 0) {
            institucionesParaGrafico['Otras Instituciones'] = otrasCount;
        }
        
        // Para los filtros, necesitamos TODAS las instituciones
        const todasLasInstituciones = {};
        institucionesArray.forEach(inst => {
            todasLasInstituciones[inst.nombre] = inst.cantidad;
        });
        
        console.log('✅ Gráfico:', Object.keys(institucionesParaGrafico).length, 'instituciones');
        console.log('✅ Filtros:', Object.keys(todasLasInstituciones).length, 'instituciones disponibles');
        
        return {
            institucionesPrincipales: institucionesParaGrafico,
            otrasInstituciones: institucionesRestantes,
            todasLasInstituciones: todasLasInstituciones,
            institucionesArray: institucionesArray
        };
    }

    // Procesar datos para la interfaz - VERSIÓN CON 4 PARÁMETROS
    function procesarDatosInstitucion(institucionesPrincipales, otrasInstituciones, todasLasInstituciones, institucionesArray) {
    // Convertir a arrays para el gráfico
        const labels = Object.keys(institucionesPrincipales);
        const values = Object.values(institucionesPrincipales);
        const totalVisitantes = values.reduce((a, b) => a + b, 0);

        // Calcular estadísticas REALES
        const totalInstitucionesUnicas = Object.keys(todasLasInstituciones).length;
        
        // Actualizar estadísticas en la UI
        actualizarEstadisticas(totalVisitantes, totalInstitucionesUnicas);

        // Generar colores únicos y guardarlos
        const colors = generarColoresInstitucion(labels.length);
        
        // Guardar datos COMPLETOS con colores
        datosInstituciones = {
            labels: labels,
            values: values,
            colors: colors, // ¡IMPORTANTE! Guardar los colores
            total: totalVisitantes,
            datosCompletos: todasLasInstituciones,
            todasLasInstitucionesArray: institucionesArray,
            totalInstitucionesUnicas: totalInstitucionesUnicas,
            institucionesEnGrafico: labels.length,
            institucionesFueraDeGrafico: Object.keys(otrasInstituciones).length
        };

        // Guardar copia original CON COLORES
        datosOriginales = {
            labels: [...labels],
            values: [...values],
            colors: [...colors], // Guardar también en originales
            total: totalVisitantes,
            datosCompletos: {...todasLasInstituciones}
        };

        institucionesFiltradas = [...labels];

        // Actualizar filtros
        actualizarFiltrosInstituciones();

        // Mostrar interfaz si estamos en modo institución
        if (tipoActual === 'institucion') {
            mostrarInterfazInstitucion();
        }
        
        console.log(`✅ Procesadas ${totalInstitucionesUnicas} instituciones únicas`);
    }

    // Función para cargar datos por tiempo (fecha, mes, año)
    async function cargarDatosTiempo(tipo) {
        try {
            mostrarLoading(`Cargando datos por ${tipo}...`);

            const { data: participantes, error } = await supabase
                .from('participantes_reserva')
                .select('fecha_visita, id_institucion')
                .not('fecha_visita', 'is', null);

            if (error) throw error;

            if (participantes && participantes.length > 0) {
                procesarDatosTiempo(participantes, tipo);
                mostrarInterfazTiempo(tipo);
            } else {
                mostrarSinDatosTiempo(tipo);
            }

            cerrarLoading();
            
        } catch (error) {
            console.error(`Error cargando datos de ${tipo}:`, error);
            cerrarLoading();
            mostrarError(`Error al cargar datos de ${tipo}: ` + error.message);
        }
    }

    // Procesar datos por tiempo
    // Reemplaza la función procesarDatosTiempo actual por esta nueva versión
    function procesarDatosTiempo(participantes, tipo) {
        // Verificar si todasLasInstituciones es un array
        if (!Array.isArray(todasLasInstituciones)) {
            console.error('todasLasInstituciones no es un array:', todasLasInstituciones);
            return { labels: [], datasets: [], instituciones: [], fechas: [] };
        }
        
        const datosPorInstitucion = {};
        const institucionesSet = new Set();
        const fechasSet = new Set();
        
        // Primero, procesar todos los participantes para obtener instituciones y fechas
        participantes.forEach(participante => {
            if (participante.fecha_visita && participante.id_institucion) {
                const fecha = new Date(participante.fecha_visita);
                let claveFecha = '';
                
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
                
                // Encontrar el nombre de la institución
                let nombreInstitucion = 'Sin institución';
                if (Array.isArray(todasLasInstituciones)) {
                    const institucionEncontrada = todasLasInstituciones.find(
                        i => i.id_institucion === participante.id_institucion
                    );
                    if (institucionEncontrada && institucionEncontrada.nombre_institucion) {
                        nombreInstitucion = institucionEncontrada.nombre_institucion;
                    }
                }
                
                fechasSet.add(claveFecha);
                institucionesSet.add(nombreInstitucion);
                
                // Inicializar estructura si no existe
                if (!datosPorInstitucion[nombreInstitucion]) {
                    datosPorInstitucion[nombreInstitucion] = {};
                }
                
                // Contar por fecha
                datosPorInstitucion[nombreInstitucion][claveFecha] = 
                    (datosPorInstitucion[nombreInstitucion][claveFecha] || 0) + 1;
            }
        });
        
        // Ordenar fechas
        const fechasOrdenadas = Array.from(fechasSet).sort();
        const institucionesLista = Array.from(institucionesSet);
        
        // Preparar datasets para Chart.js
        const datasets = institucionesLista.map((institucion, index) => {
        const datosInstitucion = datosPorInstitucion[institucion] || {};
        const data = fechasOrdenadas.map(fecha => {
            const valor = datosInstitucion[fecha];
            // Asegurar que siempre devuelva un número
            return (typeof valor === 'number' && !isNaN(valor)) ? valor : 0;
        });
        
        return {
            label: institucion,
            data: data,
            backgroundColor: coloresInstituciones[index % coloresInstituciones.length],
            borderColor: darkenColor(coloresInstituciones[index % coloresInstituciones.length], 0.2),
            borderWidth: 1,
            borderRadius: 6,
            barThickness: 20
        };
    });
        
        // Guardar datos
        const datosTiempo = {
            labels: fechasOrdenadas,
            datasets: datasets,
            instituciones: institucionesLista,
            fechas: fechasOrdenadas
        };
        
        switch(tipo) {
            case 'fecha': datosFecha = datosTiempo; break;
            case 'mes': datosMes = datosTiempo; break;
            case 'anio': datosAnio = datosTiempo; break;
        }
        
        return datosTiempo;
    }

    // =============================================
    // FUNCIONES AUXILIARES
    // =============================================
    // Actualizar estadísticas - VERSIÓN MEJORADA
    function actualizarEstadisticas(total, institucionesUnicas) {
        if (document.getElementById('total-visitantes')) {
            document.getElementById('total-visitantes').textContent = total.toLocaleString();
        }
        if (document.getElementById('visitantes-con-institucion')) {
            document.getElementById('visitantes-con-institucion').textContent = total.toLocaleString();
        }
        if (document.getElementById('total-instituciones')) {
            document.getElementById('total-instituciones').textContent = institucionesUnicas.toLocaleString();
        }
    }

    // Actualizar filtros de instituciones - VERSIÓN CORREGIDA
    function actualizarFiltrosInstituciones() {
        const select = document.getElementById('filtro-institucion-comb');
        const selectModal = document.getElementById('modalInstitucion');
        
        // Función para llenar un select
        function llenarSelect(selectElement) {
            if (!selectElement) return;
            
            // Guardar selección actual si existe
            const seleccionActual = selectElement.value;
            
            // Limpiar todas las opciones
            selectElement.innerHTML = '';
            
            // Crear opción "Todas las instituciones"
            const opcionTodas = document.createElement('option');
            opcionTodas.value = 'todas';
            opcionTodas.textContent = 'Todas las instituciones';
            opcionTodas.selected = true;
            selectElement.appendChild(opcionTodas);
            
            // Crear un Set para evitar duplicados
            const institucionesUnicas = new Set();
            
            // 1. Agregar TODAS las instituciones de la base de datos
            if (Array.isArray(todasLasInstituciones)) {
                todasLasInstituciones.forEach(inst => {
                    if (inst.nombre_institucion && inst.nombre_institucion.trim()) {
                        institucionesUnicas.add(inst.nombre_institucion.trim());
                    }
                });
            }
            
            // 2. También agregar instituciones de datosCompletos (por si hay nuevas)
            if (datosInstituciones.datosCompletos) {
                Object.keys(datosInstituciones.datosCompletos).forEach(institucion => {
                    if (institucion && institucion.trim()) {
                        institucionesUnicas.add(institucion.trim());
                    }
                });
            }
            
            // Convertir a array y ordenar alfabéticamente
            const institucionesOrdenadas = Array.from(institucionesUnicas)
                .filter(inst => inst && inst.trim() !== '')
                .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
            
            // Agregar opciones al select
            institucionesOrdenadas.forEach(institucion => {
                const option = document.createElement('option');
                option.value = institucion;
                option.textContent = institucion;
                selectElement.appendChild(option);
            });
            
            // Restaurar selección anterior si existe
            if (seleccionActual && (seleccionActual === 'todas' || institucionesOrdenadas.includes(seleccionActual))) {
                selectElement.value = seleccionActual;
            }
            
            console.log(`✅ Filtro actualizado: ${institucionesOrdenadas.length} instituciones disponibles`);
            
            // Hacer el select más usable si hay muchas opciones
            if (institucionesOrdenadas.length > 10) {
                selectElement.size = Math.min(8, institucionesOrdenadas.length);
                selectElement.style.height = 'auto';
                selectElement.style.minHeight = '120px';
            }
        }
        
        // Llenar ambos selects
        llenarSelect(select);
        llenarSelect(selectModal);
    }

    // Funciones auxiliares para tiempo
    function getDatosTiempo(tipo) {
        let datos;
        switch(tipo) {
            case 'fecha': datos = datosFecha; break;
            case 'mes': datos = datosMes; break;
            case 'anio': datos = datosAnio; break;
            default: datos = { labels: [], datasets: [], instituciones: [], fechas: [] };
        }
        
        // Si los datos no tienen estructura de barras agrupadas, convertirlos
        if (datos && (!datos.datasets || datos.datasets.length === 0)) {
            // Convertir datos antiguos a nuevo formato
            datos = convertirDatosAntiguos(tipo, datos);
        }
        
        return datos;
    }

    // Función auxiliar para convertir datos antiguos al nuevo formato
    function convertirDatosAntiguos(tipo, datosAntiguos) {
        if (!datosAntiguos.labels || datosAntiguos.labels.length === 0) {
            return { labels: [], datasets: [], instituciones: [], fechas: [] };
        }
        
        // Crear un dataset único con los datos antiguos
        const dataset = {
            label: 'Total Visitantes',
            data: datosAntiguos.values || [],
            backgroundColor: '#3498db'
        };
        
        return {
            labels: datosAntiguos.labels || [],
            datasets: [dataset],
            instituciones: ['Total Visitantes'],
            fechas: datosAntiguos.labels || []
        };
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

    function ordenarMeses(mesA, mesB) {
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        
        const [nombreA, añoA] = mesA.split(' ');
        const [nombreB, añoB] = mesB.split(' ');
        
        if (añoA !== añoB) return parseInt(añoA) - parseInt(añoB);
        return meses.indexOf(nombreA) - meses.indexOf(nombreB);
    }

    function generarColoresInstitucion(cantidad) {
        const colors = [];
        for(let i = 0; i < cantidad; i++) {
            colors.push(coloresInstituciones[i % coloresInstituciones.length]);
        }
        return colors;
    }

    function generarColoresTiempo(tipo, cantidad) {
        const palette = coloresPorTiempo[tipo] || coloresPorTiempo.fecha;
        const colors = [];
        for(let i = 0; i < cantidad; i++) {
            colors.push(palette[i % palette.length]);
        }
        return colors;
    }

    function obtenerTipoInstitucion(nombre) {
        const nombreLower = nombre.toLowerCase();
        if (nombreLower.includes('universidad')) return 'Universidad';
        if (nombreLower.includes('colegio') || nombreLower.includes('institución')) return 'Colegio';
        if (nombreLower.includes('escuela')) return 'Escuela';
        return 'Institución Educativa';
    }

    function getDescripcionTiempo(tipo, label) {
        switch(tipo) {
            case 'fecha':
                const fecha = new Date(label);
                return fecha.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            case 'mes':
                return 'Mes completo de visitas';
            case 'anio':
                return 'Año completo de visitas';
            default:
                return 'Período de tiempo';
        }
    }

    // Función auxiliar para oscurecer colores
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

    // =============================================
    // INTERFACES DE USUARIO
    // =============================================

    // Mostrar interfaz de instituciones
    function mostrarInterfazInstitucion() {
        const container = document.getElementById('data-container');
        const { labels, values, total } = datosInstituciones;
        
        container.innerHTML = `
            <div class="charts-grid">
                <div class="chart-card" onclick="window.InstitucionManager.abrirModal('bar')">
                    <div class="chart-card-header">
                        <div class="chart-card-title">
                            <i class="fas fa-chart-bar"></i> Distribución por Institución - Barras
                        </div>
                        <div class="chart-card-badge">Haz clic para ampliar</div>
                    </div>
                    <div class="chart-canvas-wrap">
                        <canvas id="chartBarInstitucion"></canvas>
                    </div>
                </div>

                <div class="chart-card" onclick="window.InstitucionManager.abrirModal('pie')">
                    <div class="chart-card-header">
                        <div class="chart-card-title">
                            <i class="fas fa-chart-pie"></i> Distribución por Institución - Circular
                        </div>
                        <div class="chart-card-badge">Haz clic para ampliar</div>
                    </div>
                    <div class="chart-canvas-wrap">
                        <canvas id="chartPieInstitucion"></canvas>
                    </div>
                </div>
            </div>

            <div class="data-table">
                <div class="chart-header">
                    <h3 style="margin: 0; display: flex; align-items: center; gap: 6px">
                        <i class="fas fa-table"></i> Detalle por Institución
                    </h3>
                    <button class="download-btn" onclick="window.InstitucionManager.descargarExcel()">
                        <i class="fas fa-file-excel"></i> Exportar Excel
                    </button>
                </div>
                <div style="overflow-x: auto;">
                    <table class="table" style="min-width: 600px;">
                        <thead>
                            <tr>
                                <th style="width: 50px;">#</th>
                                <th style="min-width: 200px;">Institución</th>
                                <th style="width: 150px;">Total Visitantes</th>
                                <th style="width: 100px;">Porcentaje</th>
                                <th style="min-width: 150px;">Tipo</th>
                            </tr>
                        </thead>
                        <tbody id="tabla-institucion-body">
                            ${generarFilasTablaInstitucion()}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        mostrarGraficasInstitucion();
    }

    // Generar filas de tabla para instituciones
    function generarFilasTablaInstitucion() {
        const { labels, values, total } = datosInstituciones;
        
        return labels.map((institucion, index) => {
            const cantidad = values[index];
            const porcentaje = total > 0 ? ((cantidad / total) * 100).toFixed(1) : 0;
            const tipo = obtenerTipoInstitucion(institucion);
            
            return `
                <tr>
                    <td style="font-weight: bold; text-align: center;">${index + 1}</td>
                    <td>
                        <span class="institution-badge">
                            <i class="fas fa-university"></i>
                            ${institucion}
                        </span>
                    </td>
                    <td style="text-align: center; font-weight: bold">${cantidad.toLocaleString()}</td>
                    <td style="text-align: center; font-weight: bold; color: #2e7d32">${porcentaje}%</td>
                    <td style="color: #7f8c8d; font-size: 0.9rem">${tipo}</td>
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

    // Mostrar interfaz para tiempo (fecha, mes, año)
    function mostrarInterfazTiempo(tipo) {
        const container = document.getElementById('data-container');
        const datos = getDatosTiempo(tipo);
        const titulo = getTituloTiempo(tipo);
        const icono = getIconoTiempo(tipo);

        container.innerHTML = `
            <div class="charts-grid">
                <div class="chart-card" onclick="window.InstitucionManager.abrirModalTiempo('${tipo}', 'bar')">
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

                <div class="chart-card" onclick="window.InstitucionManager.abrirModalTiempo('${tipo}', 'pie')">
                    <div class="chart-card-header">
                        <div class="chart-card-title">
                            <i class="fas fa-chart-pie"></i> ${titulo} - Circular
                        </div>
                        <div class="chart-card-badge">Haz clic para ampliar</div>
                    </div>
                    <div class="chart-canvas-wrap">
                        <canvas id="chart${tipo.charAt(0).toUpperCase() + tipo.slice(1)}Pie"></canvas>
                    </div>
                </div>
            </div>

            <div class="data-table">
                <div class="chart-header">
                    <h3 style="margin: 0; display: flex; align-items: center; gap: 6px">
                        <i class="fas fa-table"></i> Detalle por ${titulo.split(' ')[1]}
                    </h3>
                    <button class="download-btn" onclick="window.InstitucionManager.descargarExcelTiempo('${tipo}')">
                        <i class="fas fa-file-excel"></i> Exportar Excel
                    </button>
                </div>
                <div style="overflow-x: auto;">
                    <table class="table" style="min-width: 600px;">
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

    // Generar filas de tabla para tiempo
    // Actualiza la función generarFilasTablaTiempo:
    function generarFilasTablaTiempo(datos, tipo) {
        let html = '';
        const totalGeneral = datos.total || 0;
        
        // Para cada fecha
        datos.labels.forEach((fecha, fechaIndex) => {
            html += `
                <tr style="background-color: #f8f9fa;">
                    <td colspan="5" style="font-weight: bold; color: #2c3e50;">
                        <i class="fas fa-calendar-day"></i> ${fecha}
                    </td>
                </tr>
            `;
            
            // Para cada institución en esa fecha
            let totalFecha = 0;
            datos.instituciones.forEach((institucion, instIndex) => {
                const valor = datos.datasets[instIndex]?.data[fechaIndex] || 0;
                totalFecha += valor;
                
                if (valor > 0) {
                    html += `
                        <tr>
                            <td style="padding-left: 30px;">
                                <span class="institution-badge">
                                    <i class="fas fa-university"></i>
                                    ${institucion}
                                </span>
                            </td>
                            <td>${getDescripcionTiempo(tipo, fecha)}</td>
                            <td style="text-align: center; font-weight: bold">${valor.toLocaleString()}</td>
                            <td style="text-align: center; color: #2e7d32; font-weight: bold">
                                ${totalGeneral > 0 ? ((valor / totalGeneral) * 100).toFixed(1) : 0}%
                            </td>
                            <td style="text-align: center;">
                                <span style="color: #95a5a6;">-</span>
                            </td>
                        </tr>
                    `;
                }
            });
            
            // Total de la fecha
            html += `
                <tr style="background-color: #e8f5e8;">
                    <td colspan="2" style="padding-left: 30px; font-weight: bold;">
                        <i class="fas fa-plus-circle"></i> Total ${fecha}
                    </td>
                    <td style="text-align: center; font-weight: bold">${totalFecha.toLocaleString()}</td>
                    <td style="text-align: center; font-weight: bold">
                        ${totalGeneral > 0 ? ((totalFecha / totalGeneral) * 100).toFixed(1) : 0}%
                    </td>
                    <td style="text-align: center;">-</td>
                </tr>
            `;
        });
        
        // Total general
        html += `
            <tr style="background: #2e7d32; color: white; font-weight: bold;">
                <td colspan="2">TOTAL GENERAL</td>
                <td style="text-align: center">${totalGeneral.toLocaleString()}</td>
                <td style="text-align: center">100%</td>
                <td style="text-align: center;">-</td>
            </tr>
        `;
        
        return html;
    }

    // =============================================
    // FUNCIONES DE GRÁFICAS
    // =============================================

    // Mostrar gráficas de instituciones - VERSIÓN QUE GUARDA COLORES
    function mostrarGraficasInstitucion() {
        const { labels, values } = datosInstituciones;
        const colors = generarColoresInstitucion(labels.length);
        
        // Guardar los colores en datosInstituciones para referencia futura
        datosInstituciones.colors = colors;
        
        // Gráfica de barras
        const ctxBar = document.getElementById("chartBarInstitucion");
        if (chartBarInstitucion) chartBarInstitucion.destroy();
        
        chartBarInstitucion = new Chart(ctxBar, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: "Cantidad de Visitantes",
                    data: values,
                    backgroundColor: colors,
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
                        text: 'Distribución por Institución',
                        font: { size: 16, weight: 'bold' }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed.y;
                                const total = values.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${value} visitantes (${percentage}%)`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Cantidad de Visitantes' }
                    },
                    x: {
                        title: { display: true, text: 'Institución' }
                    }
                }
            },
        });

        // Gráfica circular
        const ctxPie = document.getElementById("chartPieInstitucion");
        if (chartPieInstitucion) chartPieInstitucion.destroy();
        
        chartPieInstitucion = new Chart(ctxPie, {
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
                            font: { size: 11 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = values.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${value} visitantes (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '50%'
            },
        });
    }

    // Mostrar gráficas para tiempo
    // Mostrar gráficas para tiempo - VERSIÓN CORREGIDA CON TOOLTIPS
    function mostrarGraficasTiempo(tipo) {
        const datos = getDatosTiempo(tipo);
        
        // Gráfica de barras AGRUPADAS
        const ctxBar = document.getElementById(`chart${tipo.charAt(0).toUpperCase() + tipo.slice(1)}Bar`);
        if (chartFechaBar) chartFechaBar.destroy();
        if (chartMesBar) chartMesBar.destroy();
        if (chartAnioBar) chartAnioBar.destroy();
        
        // Asegurar que los datos estén en el formato correcto
        const datasetsCorregidos = (datos.datasets || []).map((dataset, index) => ({
            ...dataset,
            data: dataset.data.map(val => val || 0), // Convertir undefined/NaN a 0
            backgroundColor: dataset.backgroundColor || coloresInstituciones[index % coloresInstituciones.length],
            borderColor: dataset.borderColor || darkenColor(dataset.backgroundColor || coloresInstituciones[index % coloresInstituciones.length], 0.2),
            borderWidth: 1,
            borderRadius: 6,
            barThickness: 25
        }));
        
        const chartBar = new Chart(ctxBar, {
            type: "bar",
            data: {
                labels: datos.labels || [],
                datasets: datasetsCorregidos
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
                        text: getTituloTiempo(tipo) + ' (Barras Agrupadas)',
                        font: { size: 16, weight: 'bold' }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleFont: { size: 14 },
                        bodyFont: { size: 14 },
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: true,
                        callbacks: {
                            title: function(tooltipItems) {
                                // Mostrar la fecha como título
                                const index = tooltipItems[0].dataIndex;
                                return datos.labels ? datos.labels[index] : 'Fecha no disponible';
                            },
                            label: function(context) {
                                const datasetLabel = context.dataset.label || '';
                                const value = context.parsed.y;
                                
                                if (value === 0) {
                                    return `${datasetLabel}: 0 visitantes`;
                                }
                                
                                // Calcular porcentaje del total para esta fecha
                                const fechaIndex = context.dataIndex;
                                let totalFecha = 0;
                                if (datos.datasets) {
                                    totalFecha = datos.datasets.reduce((sum, ds) => 
                                        sum + (ds.data[fechaIndex] || 0), 0);
                                }
                                
                                const porcentaje = totalFecha > 0 ? Math.round((value / totalFecha) * 100) : 0;
                                return `${datasetLabel}: ${value} visitantes (${porcentaje}% del total de la fecha)`;
                            },
                            filter: function(tooltipItem) {
                                return true; // Mostrar todos los tooltips
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
                        },
                        stacked: false
                    },
                    x: {
                        title: { 
                            display: true, 
                            text: getTituloTiempo(tipo).split(' ')[1],
                            font: { weight: 'bold' }
                        },
                        stacked: false
                    }
                },
                elements: {
                    bar: {
                        backgroundColor: function(context) {
                            const value = context.raw;
                            if (value === 0 || value === null) {
                                return context.dataset.backgroundColor + '40';
                            }
                            return context.dataset.backgroundColor;
                        }
                    }
                }
            }
        });

        // Gráfica circular
        const ctxPie = document.getElementById(`chart${tipo.charAt(0).toUpperCase() + tipo.slice(1)}Pie`);
        if (chartFechaPie) chartFechaPie.destroy();
        if (chartMesPie) chartMesPie.destroy();
        if (chartAnioPie) chartAnioPie.destroy();
        
        // Para el gráfico circular, mostrar distribución por institución general
        const totalPorInstitucion = {};
        datasetsCorregidos.forEach(dataset => {
            const total = dataset.data.reduce((a, b) => a + b, 0);
            totalPorInstitucion[dataset.label] = total;
        });
        
        const chartPie = new Chart(ctxPie, {
            type: "doughnut",
            data: {
                labels: Object.keys(totalPorInstitucion),
                datasets: [{
                    data: Object.values(totalPorInstitucion),
                    backgroundColor: datasetsCorregidos.map(d => d.backgroundColor),
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
                    },
                    title: {
                        display: true,
                        text: 'Distribución por Institución',
                        font: { size: 16, weight: 'bold' }
                    }
                },
                cutout: '60%'
            },
        });

        // Guardar referencias
        switch(tipo) {
            case 'fecha': 
                chartFechaBar = chartBar; 
                chartFechaPie = chartPie;
                break;
            case 'mes': 
                chartMesBar = chartBar; 
                chartMesPie = chartPie;
                break;
            case 'anio': 
                chartAnioBar = chartBar; 
                chartAnioPie = chartPie;
                break;
        }
    }

    // Función para limpiar y normalizar datos antes de crear gráficos
    function normalizarDatosParaGrafico(datos) {
        if (!datos || !datos.datasets) return datos;
        
        return {
            ...datos,
            datasets: datos.datasets.map((dataset, index) => ({
                ...dataset,
                label: dataset.label || `Institución ${index + 1}`,
                data: (dataset.data || []).map(val => {
                    // Convertir cualquier valor no numérico a 0
                    const num = Number(val);
                    return isNaN(num) ? 0 : num;
                }),
                backgroundColor: dataset.backgroundColor || coloresInstituciones[index % coloresInstituciones.length],
                borderColor: dataset.borderColor || darkenColor(dataset.backgroundColor || coloresInstituciones[index % coloresInstituciones.length], 0.2)
            }))
        };
    }
    // =============================================
    // FUNCIONES DE FILTRADO COMBINADO
    // =============================================

    // Aplicar filtros combinados - VERSIÓN CORREGIDA (AGREGA ESTA LÍNEA)
    async function aplicarFiltrosCombinados() {
        try {
            const fechaInicial = document.getElementById('filtro-fecha-inicial').value;
            const fechaFinal = document.getElementById('filtro-fecha-final').value;
            const institucion = document.getElementById('filtro-institucion-comb').value;

            // Validar fechas
            if (fechaInicial && fechaFinal) {
                if (fechaInicial > fechaFinal) {
                    mostrarError('La fecha inicial no puede ser mayor que la fecha final');
                    return;
                }
            } else if (fechaInicial || fechaFinal) {
                mostrarError('Por favor selecciona ambas fechas o deja ambas vacías');
                return;
            }

            mostrarLoading('Aplicando filtros...');

            // Construir consulta base
            let query = supabase
                .from('participantes_reserva')
                .select('id_institucion, fecha_visita');

            // Filtrar por fecha si se especificaron
            if (fechaInicial && fechaFinal) {
                query = query.gte('fecha_visita', fechaInicial + 'T00:00:00');
                query = query.lte('fecha_visita', fechaFinal + 'T23:59:59');
            }

            // Filtrar por institución si NO es "todas"
            if (institucion && institucion !== 'todas') {
                const institucionObj = todasLasInstituciones.find(inst => 
                    inst.nombre_institucion && 
                    inst.nombre_institucion.trim() === institucion.trim()
                );
                
                if (!institucionObj) {
                    cerrarLoading();
                    mostrarSinDatosFiltradosEspecifico(institucion);
                    return;
                }
                
                query = query.eq('id_institucion', institucionObj.id_institucion);
            }

            const { data: participantesFiltrados, error } = await query;

            if (error) throw error;

            console.log(`✅ Filtros aplicados: ${participantesFiltrados?.length || 0} registros encontrados`);

            cerrarLoading();

            if (participantesFiltrados && participantesFiltrados.length > 0) {
                if (tipoActual === 'institucion') {
                    procesarDatosInstitucionFiltrados(participantesFiltrados);
                    mostrarExito(`Filtros aplicados: ${participantesFiltrados.length} visitantes encontrados`);
                } else {
                    procesarDatosTiempoFiltrados(participantesFiltrados, tipoActual);
                    mostrarExito(`Filtros aplicados: ${participantesFiltrados.length} visitantes encontrados`);
                }
            } else {
                cerrarLoading();
                if (institucion && institucion !== 'todas') {
                    mostrarSinDatosFiltradosEspecifico(institucion);
                } else {
                    mostrarSinDatosFiltrados();
                }
            }

        } catch (error) {
            console.error('Error aplicando filtros combinados:', error);
            cerrarLoading();
            mostrarError('Error al aplicar los filtros: ' + error.message);
        }
    }

    //BORRARRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
    function verificarDatosInstitucion() {
        console.log('=== VERIFICACIÓN DE DATOS ===');
        console.log('Total instituciones en base:', todasLasInstituciones.length);
        console.log('Primeras 3:', todasLasInstituciones.slice(0, 3));
        
        console.log('DatosInstituciones:');
        console.log('- Labels:', datosInstituciones.labels?.length || 0);
        console.log('- Colors:', datosInstituciones.colors?.length || 0);
        
        console.log('DatosOriginales:');
        console.log('- Labels:', datosOriginales.labels?.length || 0);
        console.log('- Colors:', datosOriginales.colors?.length || 0);
        
        // Mostrar ejemplo de color para una institución específica
        if (datosInstituciones.labels && datosInstituciones.labels.length > 0) {
            const ejemploInst = datosInstituciones.labels[0];
            const color = obtenerColorInstitucion(ejemploInst);
            console.log(`Ejemplo: "${ejemploInst}" tiene color: ${color}`);
        }
    }

    // BORRARRRRRRRRRRRRRRRRRRRRRRR
    

    // Mostrar mensaje cuando no hay datos para una institución específica - VERSIÓN MEJORADA
    function mostrarSinDatosFiltradosEspecifico(institucion) {
        const container = document.getElementById('data-container');
        if (container) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-search" style="font-size: 48px; color: #95a5a6; margin-bottom: 20px;"></i>
                    <h3>No se encontraron visitantes</h3>
                    <p style="margin: 10px 0 20px 0; font-size: 16px; color: #2c3e50;">
                        La institución <strong style="color: #e74c3c;">"${institucion}"</strong> 
                        no tiene visitantes registrados.
                    </p>
                    <p style="color: #7f8c8d; font-size: 14px; margin-bottom: 25px;">
                        ${
                            document.getElementById('filtro-fecha-inicial').value ? 
                            'En el rango de fechas seleccionado.' : 
                            'Verifica si el nombre está escrito correctamente.'
                        }
                    </p>
                    <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                        <button class="btn btn-primary" onclick="window.InstitucionManager.limpiarFiltrosCombinados()" 
                                style="padding: 10px 20px; font-size: 14px;">
                            <i class="fas fa-times"></i> Limpiar Filtros
                        </button>
                        <button class="btn" onclick="window.InstitucionManager.cambiarTipoReporte('institucion')" 
                                style="background: #3498db; color: white; padding: 10px 20px; font-size: 14px;">
                            <i class="fas fa-school"></i> Ver Todas las Instituciones
                        </button>
                    </div>
                </div>
            `;
        }
    }


    // Nueva función para procesar datos de institución filtrados
    function procesarDatosInstitucionFiltrados(participantes) {
        const conteoInstituciones = {};
        
        participantes.forEach(participante => {
            const institucion = todasLasInstituciones.find(i => i.id_institucion === participante.id_institucion);
            if (institucion && institucion.nombre_institucion) {
                const nombreInstitucion = institucion.nombre_institucion;
                conteoInstituciones[nombreInstitucion] = (conteoInstituciones[nombreInstitucion] || 0) + 1;
            }
        });

        const { institucionesPrincipales, otrasInstituciones } = agruparInstituciones(conteoInstituciones);
        procesarDatosInstitucion(institucionesPrincipales, otrasInstituciones);
    }

    // Nueva función para procesar datos de tiempo filtrados
    function procesarDatosTiempoFiltrados(participantes, tipo) {
        // Usar la función procesarDatosTiempo existente
        const datosTiempo = procesarDatosTiempo(participantes, tipo);
        
        // Guardar datos según el tipo
        switch(tipo) {
            case 'fecha': datosFecha = datosTiempo; break;
            case 'mes': datosMes = datosTiempo; break;
            case 'anio': datosAnio = datosTiempo; break;
        }
        
        // Mostrar interfaz
        mostrarInterfazTiempo(tipo);
    }

    // Procesar datos filtrados
    function procesarDatosFiltrados(participantes, tipo) {
        if (tipo === 'institucion') {
            const conteoInstituciones = {};
            
            participantes.forEach(participante => {
                const institucion = todasLasInstituciones.find(i => i.id_institucion === participante.id_institucion);
                if (institucion && institucion.nombre_institucion) {
                    const nombreInstitucion = institucion.nombre_institucion;
                    conteoInstituciones[nombreInstitucion] = (conteoInstituciones[nombreInstitucion] || 0) + 1;
                }
            });

            const { institucionesPrincipales, otrasInstituciones } = agruparInstituciones(conteoInstituciones);
            procesarDatosInstitucion(institucionesPrincipales, otrasInstituciones);
            
        } else {
            procesarDatosTiempo(participantes, tipo);
            mostrarInterfazTiempo(tipo);
        }
    }

    // Limpiar filtros combinados
    function limpiarFiltrosCombinados() {
        document.getElementById('filtro-fecha-inicial').value = '';
        document.getElementById('filtro-fecha-final').value = '';
        document.getElementById('filtro-institucion-comb').value = 'todas';
        
        // Recargar datos sin filtros
        cargarDatosCompletos();
        mostrarExito('Filtros limpiados - Mostrando todos los datos');
    }

    // Cambiar tipo de reporte - VERSIÓN CORREGIDA
    function cambiarTipoReporte(tipo) {
        console.log('🔄 Cambiando a reporte:', tipo);
        
        // Actualizar botones activos
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.chart-btn[data-type="${tipo}"]`).classList.add('active');
        
        // Actualizar variable global
        tipoActual = tipo;
        
        // Mostrar/ocultar filtros combinados
        const filtrosDiv = document.getElementById('filtros-combinados');
        if (filtrosDiv) {
            filtrosDiv.style.display = 'block'; // Siempre mostrar filtros
        }
        
        // Si ya tenemos datos de este tipo, mostrarlos
        let tieneDatos = false;
        
        if (tipo === 'institucion') {
            tieneDatos = datosInstituciones && datosInstituciones.labels && datosInstituciones.labels.length > 0;
        } else {
            const datosTipo = getDatosTiempo(tipo);
            tieneDatos = datosTipo && datosTipo.labels && datosTipo.labels.length > 0;
        }
        
        if (tieneDatos) {
            if (tipo === 'institucion') {
                mostrarInterfazInstitucion();
            } else {
                mostrarInterfazTiempo(tipo);
            }
        } else {
            // Cargar datos si no los tenemos
            if (tipo === 'institucion') {
                if (datosOriginales.labels && datosOriginales.labels.length > 0) {
                    datosInstituciones = JSON.parse(JSON.stringify(datosOriginales));
                    mostrarInterfazInstitucion();
                } else {
                    cargarDatosInstitucion();
                }
            } else {
                cargarDatosTiempo(tipo);
            }
        }
    }

    // =============================================
    // FUNCIONES DE MODAL CON FILTROS INTEGRADOS
    // =============================================

    // Función para crear HTML de filtros para el modal - VERSIÓN ACTUALIZADA
    function crearHTMLFiltrosModal(tipo) {
        // Obtener todas las instituciones disponibles
        const institucionesDisponibles = Array.from(
            new Set([
                ...(Array.isArray(todasLasInstituciones) ? 
                    todasLasInstituciones.map(i => i.nombre_institucion) : []),
                ...Object.keys(datosInstituciones.datosCompletos || {})
            ])
        ).filter(inst => inst && inst.trim() !== '')
        .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

        let html = `
        <div class="modal-filtros-container" style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h4 style="margin: 0; color: #2c3e50;">
                    <i class="fas fa-filter"></i> Filtros Avanzados
                </h4>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-filter-modal" onclick="window.InstitucionManager.aplicarFiltrosModal()" style="background: #2e7d32; color: white;">
                        <i class="fas fa-check"></i> Aplicar
                    </button>
                    <button class="btn-filter-modal" onclick="window.InstitucionManager.limpiarFiltrosModal()" style="background: #95a5a6; color: white;">
                        <i class="fas fa-times"></i> Limpiar
                    </button>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <!-- Tipo de Gráfica -->
                <div class="filter-group">
                    <label><i class="fas fa-chart-bar"></i> Tipo de Gráfica:</label>
                    <select id="modalTipoGrafica" class="filter-select">
                        <option value="bar">Gráfico de Barras</option>
                        <option value="doughnut">Gráfico Circular</option>
                        <option value="pie">Gráfico de Pastel</option>
                    </select>
                </div>
        `;

        // Si no es institución, agregar filtros de fecha
        if (tipo !== 'institucion') {
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

        // Agregar filtro de institución para todos los tipos
        html += `
                <!-- Institución -->
                <div class="filter-group">
                    <label><i class="fas fa-university"></i> Institución:</label>
                    <select id="modalInstitucion" class="filter-select" style="min-height: 120px;">
                        <option value="todas" selected>Todas las instituciones</option>
                        ${institucionesDisponibles.map(inst => 
                            `<option value="${inst}">${inst}</option>`
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
                    </select>
                </div>
            </div>
        </div>
        `;

        return html;
    }

    // Función para abrir modal de institución CON FILTROS DENTRO
    function abrirModalInstitucion(tipoGrafica) {
        const modal = document.getElementById("chartModalInstitucion");
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
        actualizarContenidoModal('institucion', tipoGrafica);
        
        // Crear gráfica ampliada
        setTimeout(() => {
            crearGraficaAmpliadaInstitucion(tipoGrafica);
            llenarTablaModalInstitucion();
        }, 100);
    }

    // Función para abrir modal de tiempo CON FILTROS DENTRO
    function abrirModalTiempo(tipo, tipoGrafica) {
        const modal = document.getElementById("chartModalInstitucion");
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
        actualizarContenidoModal(tipo, tipoGrafica);
        
        // Crear gráfica ampliada
        setTimeout(() => {
            crearGraficaAmpliadaTiempo(tipo, tipoGrafica);
            llenarTablaModalTiempo(tipo);
        }, 100);
    }

    // Función para actualizar contenido del modal con filtros
    function actualizarContenidoModal(tipo, tipoGrafica) {
        const modal = document.getElementById("chartModalInstitucion");
        if (!modal) return;
        
        // Crear contenido completo del modal
        const titulo = tipo === 'institucion' ? 'Distribución por Institución' : getTituloTiempo(tipo);
        const iconoTitulo = tipo === 'institucion' ? 'fa-school' : 
                           tipo === 'fecha' ? 'fa-calendar-day' : 
                           tipo === 'mes' ? 'fa-calendar-week' : 'fa-calendar-alt';
        
        const html = `
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title" id="modalTitleInstitucion">
                        <i class="fas ${iconoTitulo}"></i> ${titulo} - Vista Ampliada
                    </div>
                    <div class="modal-actions">
                        <button class="download-btn-small secondary" onclick="window.InstitucionManager.descargarPNG()">
                            <i class="fas fa-image"></i> PNG
                        </button>
                        <button class="download-btn-small" onclick="window.InstitucionManager.descargarExcelModal()">
                            <i class="fas fa-file-excel"></i> Excel
                        </button>
                        <span class="close" onclick="window.InstitucionManager.cerrarModal()">&times;</span>
                    </div>
                </div>

                <!-- FILTROS DENTRO DEL MODAL -->
                ${crearHTMLFiltrosModal(tipo)}

                <div class="modal-chart-container">
                    <canvas id="chartAmpliadoInstitucion"></canvas>
                </div>

                <div class="data-table">
                    <h4 style="margin: 0 0 12px 0; display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-table"></i> Datos Detallados
                    </h4>
                    <table class="table" id="tablaDatosInstitucion">
                        <thead>
                            <tr>
                                <th>${tipo === 'institucion' ? 'Institución' : 'Período'}</th>
                                <th>${tipo === 'institucion' ? 'Tipo' : 'Descripción'}</th>
                                <th>Total Visitantes</th>
                                <th>Porcentaje</th>
                                ${tipo !== 'institucion' ? '<th>Tendencia</th>' : ''}
                            </tr>
                        </thead>
                        <tbody id="tbodyDatosInstitucion">
                            <!-- Los datos se llenarán dinámicamente -->
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        modal.innerHTML = html;
        
        // Establecer valor inicial del tipo de gráfica
        const selectTipoGrafica = document.getElementById('modalTipoGrafica');
        if (selectTipoGrafica) {
            selectTipoGrafica.value = tipoGrafica || 'bar';
        }

        // En la función actualizarContenidoModal, agrega este evento:
        document.getElementById('modalTipoGrafica').addEventListener('change', function(e) {
            const tipoGrafica = e.target.value;
            cambiarTipoGraficaModal(tipoGrafica);
        });
    }

    // Función para cambiar tipo de gráfica en modal
    function cambiarTipoGraficaModal(tipoGrafica, tipo) {
        tipo = tipo || determinarTipoActual();
        if (tipo === 'institucion') {
            crearGraficaAmpliadaInstitucion(tipoGrafica);
        } else {
            crearGraficaAmpliadaTiempo(tipo, tipoGrafica);
        }
    }

    // Función para determinar el tipo actual del modal
    function determinarTipoActual() {
        const titulo = document.getElementById('modalTitleInstitucion')?.textContent || '';
        if (titulo.includes('Institución')) return 'institucion';
        if (titulo.includes('Fecha')) return 'fecha';
        if (titulo.includes('Mes')) return 'mes';
        if (titulo.includes('Año')) return 'anio';
        return 'institucion';
    }

    // Función para aplicar filtros del modal - VERSIÓN CON VALIDACIÓN
    async function aplicarFiltrosModal() {
        try {
            mostrarLoading('Aplicando filtros...');
            
            const tipoGrafica = document.getElementById('modalTipoGrafica')?.value || 'bar';
            const fechaInicio = document.getElementById('modalFechaInicio')?.value;
            const fechaFin = document.getElementById('modalFechaFin')?.value;
            const institucion = document.getElementById('modalInstitucion')?.value || 'todas';
            const cantidad = parseInt(document.getElementById('modalCantidad')?.value || '10');
            const orden = document.getElementById('modalOrden')?.value || 'desc';
            
            const tipo = determinarTipoActual();
            let datosFiltrados;
            
            if (tipo === 'institucion') {
                // Filtrar datos de instituciones
                datosFiltrados = await filtrarDatosInstitucionModal(institucion, cantidad, orden);
                
                // Validar datos
                if (validarDatosFiltrados(datosFiltrados)) {
                    crearGraficaAmpliadaInstitucionConDatos(datosFiltrados, tipoGrafica);
                    llenarTablaModalInstitucionConDatos(datosFiltrados);
                    mostrarExito(`Filtros aplicados: ${datosFiltrados.total || 0} registros encontrados`);
                } else {
                    mostrarError('No se encontraron datos con los filtros aplicados');
                }
            } else {
                // Filtrar datos de tiempo
                datosFiltrados = await filtrarDatosTiempoModal(tipo, fechaInicio, fechaFin, institucion, cantidad, orden);
                
                // Validar datos
                if (validarDatosFiltrados(datosFiltrados)) {
                    crearGraficaAmpliadaTiempoConDatos(tipo, datosFiltrados, tipoGrafica);
                    llenarTablaModalTiempoConDatos(tipo, datosFiltrados);
                    mostrarExito(`Filtros aplicados: ${datosFiltrados.total || 0} registros encontrados`);
                } else {
                    mostrarError('No se encontraron datos con los filtros aplicados');
                }
            }
            
            cerrarLoading();
            
        } catch (error) {
            console.error('Error aplicando filtros:', error);
            cerrarLoading();
            mostrarError('Error al aplicar los filtros: ' + error.message);
        }
    }

    // Función para filtrar datos de tiempo en modal CON AGRUPACIÓN - VERSIÓN CORREGIDA
    async function filtrarDatosTiempoModal(tipo, fechaInicio, fechaFin, institucion, cantidad, orden) {
        try {
            let query = supabase
                .from('participantes_reserva')
                .select('fecha_visita, id_institucion')
                .not('fecha_visita', 'is', null);
            
            // Aplicar filtros de fecha si existen
            if (fechaInicio) {
                query = query.gte('fecha_visita', fechaInicio + 'T00:00:00');
            }
            if (fechaFin) {
                query = query.lte('fecha_visita', fechaFin + 'T23:59:59');
            }
            
            // Filtrar por institución si no es "todas"
            if (institucion !== 'todas') {
                const institucionObj = todasLasInstituciones.find(inst => inst.nombre_institucion === institucion);
                if (institucionObj) {
                    query = query.eq('id_institucion', institucionObj.id_institucion);
                }
            }
            
            const { data: participantes, error } = await query;
            if (error) throw error;
            
            // Si no hay participantes, devolver estructura vacía
            if (!participantes || participantes.length === 0) {
                return {
                    labels: [],
                    values: [],
                    total: 0,
                    datasets: [],
                    instituciones: [],
                    fechas: []
                };
            }
            
            // Procesar datos con la función de agrupación
            const datosAgrupados = procesarDatosTiempo(participantes, tipo);
            
            // Aplicar límite de cantidad si es necesario
            if (cantidad > 0 && cantidad < datosAgrupados.labels.length) {
                datosAgrupados.labels = datosAgrupados.labels.slice(0, cantidad);
                datosAgrupados.datasets.forEach(dataset => {
                    dataset.data = dataset.data.slice(0, cantidad);
                });
                datosAgrupados.fechas = datosAgrupados.labels;
            }
            
            // Asegurar que tenemos los campos necesarios
            return {
                labels: datosAgrupados.labels || [],
                values: datosAgrupados.datasets?.[0]?.data || [],
                total: datosAgrupados.datasets?.reduce((total, dataset) => 
                    total + dataset.data.reduce((sum, val) => sum + val, 0), 0) || 0,
                datasets: datosAgrupados.datasets || [],
                instituciones: datosAgrupados.instituciones || [],
                fechas: datosAgrupados.fechas || []
            };
            
        } catch (error) {
            console.error('Error filtrando datos de tiempo:', error);
            // Devolver estructura vacía en caso de error
            return {
                labels: [],
                values: [],
                total: 0,
                datasets: [],
                instituciones: [],
                fechas: []
            };
        }
    }

    // Función para filtrar datos de institución en modal - VERSIÓN CON "TODAS"
    async function filtrarDatosInstitucionModal(institucion, cantidad, orden) {
        try {
            // Si se selecciona "todas", devolver datos del gráfico principal
            if (institucion === 'todas') {
                let datos = { ...datosInstituciones };
                
                // Aplicar ordenamiento
                datos = aplicarOrdenamientoInstituciones(datos, orden);
                
                // Aplicar límite de cantidad
                datos = aplicarLimiteCantidadInstituciones(datos, cantidad);
                
                return datos;
            }
            
            // Si se selecciona una institución específica
            const institucionObj = todasLasInstituciones.find(inst => 
                inst.nombre_institucion && 
                inst.nombre_institucion.trim().toLowerCase() === institucion.toLowerCase().trim()
            );
            
            if (!institucionObj) {
                return {
                    labels: [institucion],
                    values: [0],
                    total: 0,
                    datosCompletos: {},
                    mensaje: `Institución "${institucion}" no encontrada en la base de datos`
                };
            }
            
            // Consultar participantes de esta institución
            const { data: participantes, error } = await supabase
                .from('participantes_reserva')
                .select('id, fecha_visita')
                .eq('id_institucion', institucionObj.id_institucion);
            
            if (error) throw error;
            
            // Si no hay participantes
            if (!participantes || participantes.length === 0) {
                return {
                    labels: [institucion],
                    values: [0],
                    total: 0,
                    datosCompletos: {},
                    mensaje: `No se encontraron visitantes para "${institucion}"`
                };
            }
            
            // Procesar datos
            const cantidadEncontrada = participantes.length;
            const datosFiltrados = {
                labels: [institucion],
                values: [cantidadEncontrada],
                total: cantidadEncontrada,
                datosCompletos: { [institucion]: cantidadEncontrada },
                participantes: participantes // Guardar para referencia
            };
            
            return datosFiltrados;
            
        } catch (error) {
            console.error('Error filtrando datos de institución:', error);
            return {
                labels: ['Error'],
                values: [0],
                total: 0,
                datosCompletos: {},
                mensaje: 'Error al cargar los datos: ' + error.message
            };
        }
    }

    // Función auxiliar para aplicar ordenamiento
    function aplicarOrdenamientoInstituciones(datos, orden) {
        if (orden === 'desc') {
            // Orden descendente (mayor a menor)
            const indices = datos.labels
                .map((label, i) => ({ label, value: datos.values[i] }))
                .sort((a, b) => b.value - a.value)
                .map(item => datos.labels.indexOf(item.label));
            
            datos.labels = indices.map(i => datos.labels[i]);
            datos.values = indices.map(i => datos.values[i]);
        } else if (orden === 'asc') {
            // Orden ascendente (menor a mayor)
            const indices = datos.labels
                .map((label, i) => ({ label, value: datos.values[i] }))
                .sort((a, b) => a.value - b.value)
                .map(item => datos.labels.indexOf(item.label));
            
            datos.labels = indices.map(i => datos.labels[i]);
            datos.values = indices.map(i => datos.values[i]);
        } else if (orden === 'alpha') {
            // Orden alfabético
            const indices = datos.labels
                .map((label, i) => ({ label, value: datos.values[i] }))
                .sort((a, b) => a.label.localeCompare(b.label))
                .map(item => datos.labels.indexOf(item.label));
            
            datos.labels = indices.map(i => datos.labels[i]);
            datos.values = indices.map(i => datos.values[i]);
        }
        
        return datos;
    }

    // Función auxiliar para aplicar límite de cantidad
    function aplicarLimiteCantidadInstituciones(datos, cantidad) {
        if (cantidad > 0 && cantidad < datos.labels.length) {
            datos.labels = datos.labels.slice(0, cantidad);
            datos.values = datos.values.slice(0, cantidad);
            datos.total = datos.values.reduce((a, b) => a + b, 0);
        }
        
        return datos;
    }

    // Función para crear gráfica con datos filtrados de institución - VERSIÓN CON COLORES CONSISTENTES
    function crearGraficaAmpliadaInstitucionConDatos(datosFiltrados, tipoGrafica) {
        const ctx = document.getElementById("chartAmpliadoInstitucion");
        if (!ctx) return;

        if (chartAmpliadoInstitucion) {
            chartAmpliadoInstitucion.destroy();
        }

        // Verificar si realmente NO hay datos
        const esCasoSinDatos = datosFiltrados.mensaje && 
                            (datosFiltrados.mensaje.includes('No se encontraron') || 
                            datosFiltrados.mensaje.includes('no encontrada'));
        
        if (esCasoSinDatos || datosFiltrados.total === 0) {
            const mensaje = datosFiltrados?.mensaje || 'No hay datos disponibles';
            
            chartAmpliadoInstitucion = new Chart(ctx, {
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
                            text: mensaje,
                            font: { size: 16, weight: 'bold' }
                        },
                        subtitle: {
                            display: true,
                            text: 'Intenta con otra institución o criterios de búsqueda',
                            font: { size: 12, style: 'italic' },
                            color: '#7f8c8d'
                        }
                    }
                }
            });
            return;
        }

        // Determinar si es una institución individual
        const esInstitucionIndividual = datosFiltrados.labels.length === 1 && 
                                    datosFiltrados.labels[0] !== 'Todas las instituciones';
        
        // Preparar colores
        let colors;
        if (esInstitucionIndividual) {
            // Para una sola institución, usar el color que ya tenía
            colors = [obtenerColorInstitucion(datosFiltrados.labels[0])];
        } else {
            // Para múltiples instituciones, generar colores normales
            colors = generarColoresInstitucion(datosFiltrados.labels.length);
        }

        // GRÁFICOS CIRCULARES
        if (tipoGrafica === 'doughnut' || tipoGrafica === 'pie') {
            chartAmpliadoInstitucion = new Chart(ctx, {
                type: tipoGrafica,
                data: {
                    labels: datosFiltrados.labels,
                    datasets: [{
                        data: datosFiltrados.values,
                        backgroundColor: colors,
                        borderColor: '#fff',
                        borderWidth: 2,
                        hoverOffset: 15
                    }]
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
                            text: esInstitucionIndividual 
                                ? `${datosFiltrados.labels[0]} - ${datosFiltrados.total} visitantes`
                                : 'Distribución por Institución' + 
                                (tipoGrafica === 'doughnut' ? ' (Dona)' : ' (Pastel)'),
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
                                    const value = context.parsed;
                                    const total = datosFiltrados.total;
                                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                    return `${label}: ${value} visitantes (${percentage}%)`;
                                }
                            }
                        }
                    },
                    cutout: tipoGrafica === 'doughnut' ? '50%' : '0%'
                }
            });
        } 
        // GRÁFICO DE BARRAS
        else if (tipoGrafica === 'bar') {
            chartAmpliadoInstitucion = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: datosFiltrados.labels,
                    datasets: [{
                        label: "Cantidad de Visitantes",
                        data: datosFiltrados.values,
                        backgroundColor: colors,
                        borderColor: colors.map(color => darkenColor(color, 0.2)),
                        borderWidth: 1,
                        borderRadius: 8,
                        barThickness: esInstitucionIndividual ? 50 : 35,
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { 
                            display: !esInstitucionIndividual
                        },
                        title: {
                            display: true,
                            text: esInstitucionIndividual 
                                ? `${datosFiltrados.labels[0]} - ${datosFiltrados.total} visitantes`
                                : 'Distribución por Institución - Barras',
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
                                    const value = context.parsed.y;
                                    const percentage = datosFiltrados.total > 0 ? 
                                        Math.round((value / datosFiltrados.total) * 100) : 0;
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
                            }
                        },
                        x: {
                            grid: { display: false },
                            title: {
                                display: true,
                                text: 'Institución',
                                font: { weight: 'bold', size: 14 }
                            },
                            ticks: {
                                maxRotation: esInstitucionIndividual ? 0 : 45,
                                minRotation: 0
                            }
                        }
                    }
                }
            });
        }
    }

    // Función para validar datos antes de usarlos
    function validarDatosFiltrados(datos) {
        return datos && 
            (datos.labels || datos.values || datos.datasets) &&
            ((datos.labels && datos.labels.length > 0) || 
                (datos.values && datos.values.length > 0) || 
                (datos.datasets && datos.datasets.length > 0));
    }

    // Función para crear gráfica con datos filtrados de tiempo - VERSIÓN COMPLETA CON GRÁFICOS CIRCULARES
    function crearGraficaAmpliadaTiempoConDatos(tipo, datosFiltrados, tipoGrafica) {
        const ctx = document.getElementById("chartAmpliadoInstitucion");
        if (!ctx) return;

        if (chartAmpliadoInstitucion) {
            chartAmpliadoInstitucion.destroy();
        }

        // Verificar que tenemos datos
        if (!datosFiltrados || (!datosFiltrados.datasets && !datosFiltrados.values)) {
            // Mostrar gráfica vacía con mensaje
            chartAmpliadoInstitucion = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Sin datos'],
                    datasets: [{
                        label: 'Sin datos',
                        data: [100],
                        backgroundColor: ['#95a5a6']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true },
                        title: {
                            display: true,
                            text: 'No hay datos disponibles con los filtros aplicados',
                            font: { size: 16, weight: 'bold' }
                        }
                    }
                }
            });
            return;
        }

        // ============================================
        // GRÁFICOS CIRCULARES (doughnut o pie)
        // ============================================
        if (tipoGrafica === 'doughnut' || tipoGrafica === 'pie') {
            // Para gráficos circulares, necesitamos mostrar distribución por institución
            let labels = [];
            let data = [];
            let backgroundColor = [];
            let borderColor = [];
            
            if (datosFiltrados.datasets && datosFiltrados.datasets.length > 0) {
                // Calcular total por institución para el gráfico circular
                datosFiltrados.datasets.forEach((dataset, index) => {
                    const totalInstitucion = dataset.data.reduce((sum, val) => sum + (val || 0), 0);
                    if (totalInstitucion > 0) {
                        labels.push(dataset.label || `Institución ${index + 1}`);
                        data.push(totalInstitucion);
                        backgroundColor.push(dataset.backgroundColor || coloresInstituciones[index % coloresInstituciones.length]);
                        borderColor.push(dataset.borderColor || darkenColor(dataset.backgroundColor || coloresInstituciones[index % coloresInstituciones.length], 0.2));
                    }
                });
                
                // Si no hay datos después del filtrado, mostrar mensaje
                if (data.length === 0) {
                    labels = ['Sin datos con los filtros aplicados'];
                    data = [100];
                    backgroundColor = ['#95a5a6'];
                    borderColor = ['#7f8c8d'];
                }
            } else if (datosFiltrados.values && datosFiltrados.values.length > 0) {
                // Formato antiguo - mostrar distribución por fecha
                labels = datosFiltrados.labels || [];
                data = datosFiltrados.values.map(val => val || 0);
                backgroundColor = generarColoresTiempo(tipo, labels.length);
                borderColor = backgroundColor.map(color => darkenColor(color, 0.2));
            }
            
            chartAmpliadoInstitucion = new Chart(ctx, {
                type: tipoGrafica,
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: backgroundColor,
                        borderColor: borderColor,
                        borderWidth: 2,
                        hoverOffset: 15
                    }]
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
                                font: { 
                                    size: 12,
                                    family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                                },
                                // Solo mostrar leyenda para valores mayores a 0
                                filter: function(legendItem, chartData) {
                                    return chartData.datasets[0].data[legendItem.index] > 0;
                                }
                            }
                        },
                        title: {
                            display: true,
                            text: tipoGrafica === 'doughnut' ? 
                                'Distribución por Institución (Dona)' : 
                                'Distribución por Institución (Pastel)',
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
                                    const value = context.parsed;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                    return `${label}: ${value} visitantes (${percentage}%)`;
                                }
                            }
                        }
                    },
                    cutout: tipoGrafica === 'doughnut' ? '50%' : '0%',
                    // Animaciones suaves
                    animation: {
                        animateScale: true,
                        animateRotate: true
                    }
                }
            });
        } 
        // ============================================
        // GRÁFICO DE BARRAS
        // ============================================
        else if (tipoGrafica === 'bar' && datosFiltrados.datasets && datosFiltrados.datasets.length > 0) {
            // BARRAS AGRUPADAS
            chartAmpliadoInstitucion = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: datosFiltrados.labels || [],
                    datasets: datosFiltrados.datasets.map((dataset, index) => ({
                        ...dataset,
                        // Asegurar que los datos sean números válidos
                        data: dataset.data.map(val => val || 0),
                        // Asignar color específico a cada institución
                        backgroundColor: dataset.backgroundColor || coloresInstituciones[index % coloresInstituciones.length],
                        borderColor: dataset.borderColor || darkenColor(dataset.backgroundColor || coloresInstituciones[index % coloresInstituciones.length], 0.2),
                        borderWidth: 1,
                        borderRadius: 6,
                        barThickness: 25,
                        // Nombre específico para cada barra
                        label: dataset.label || `Institución ${index + 1}`
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
                            text: `${getTituloTiempo(tipo)} (Filtrado) - Barras Agrupadas`,
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
                            displayColors: true,
                            callbacks: {
                                title: function(tooltipItems) {
                                    // Mostrar la fecha como título
                                    const index = tooltipItems[0].dataIndex;
                                    return datosFiltrados.labels ? datosFiltrados.labels[index] : 'Fecha no disponible';
                                },
                                label: function(context) {
                                    const datasetLabel = context.dataset.label || '';
                                    const value = context.parsed.y;
                                    
                                    if (value === 0) {
                                        return `${datasetLabel}: 0 visitantes`;
                                    }
                                    
                                    // Calcular porcentaje del total para esta fecha
                                    const fechaIndex = context.dataIndex;
                                    let totalFecha = 0;
                                    if (datosFiltrados.datasets) {
                                        totalFecha = datosFiltrados.datasets.reduce((sum, ds) => 
                                            sum + (ds.data[fechaIndex] || 0), 0);
                                    }
                                    
                                    const porcentaje = totalFecha > 0 ? Math.round((value / totalFecha) * 100) : 0;
                                    return `${datasetLabel}: ${value} visitantes (${porcentaje}% del total de la fecha)`;
                                },
                                filter: function(tooltipItem) {
                                    return true;
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
                            stacked: false
                        },
                        x: {
                            grid: { display: false },
                            title: {
                                display: true,
                                text: getTituloTiempo(tipo).split(' ')[2] || 'Período',
                                font: { weight: 'bold', size: 14 }
                            },
                            stacked: false,
                            ticks: {
                                maxRotation: tipo === 'fecha' ? 45 : 0,
                                minRotation: 0
                            }
                        }
                    }
                }
            });
        }
    }

    // Función para llenar tabla con datos filtrados de institución
    function llenarTablaModalInstitucionConDatos(datosFiltrados) {
        const tbody = document.getElementById("tbodyDatosInstitucion");
        if (!tbody) return;

        tbody.innerHTML = datosFiltrados.labels.map((institucion, index) => {
            const cantidad = datosFiltrados.values[index];
            const porcentaje = datosFiltrados.total > 0 ? ((cantidad / datosFiltrados.total) * 100).toFixed(1) : 0;
            const tipo = obtenerTipoInstitucion(institucion);
            
            return `
                <tr>
                    <td><strong>${institucion}</strong></td>
                    <td>${tipo}</td>
                    <td style="text-align: center; font-weight: bold">${cantidad.toLocaleString()}</td>
                    <td style="text-align: center; color: #2e7d32; font-weight: bold">${porcentaje}%</td>
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

    // Función para llenar tabla con datos filtrados de tiempo - VERSIÓN SEGURA
    function llenarTablaModalTiempoConDatos(tipo, datosFiltrados) {
        const tbody = document.getElementById("tbodyDatosInstitucion");
        if (!tbody) return;

        // Verificar que tenemos datos válidos
        if (!datosFiltrados || (!datosFiltrados.labels && !datosFiltrados.datasets)) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px; color: #7f8c8d;">
                        <i class="fas fa-exclamation-circle"></i> No hay datos disponibles con los filtros aplicados
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        
        // Verificar si tenemos datos en formato de barras agrupadas (con datasets)
        if (datosFiltrados.datasets && datosFiltrados.datasets.length > 0) {
            // FORMATO NUEVO: Barras agrupadas
            // Encabezado para formato de barras agrupadas
            html += `
                <tr style="background: #f8f9fa; font-weight: bold;">
                    <th>Fecha/Período</th>
                    ${datosFiltrados.instituciones.map(inst => `<th>${inst}</th>`).join('')}
                    <th>Total por Fecha</th>
                </tr>
            `;
            
            // Filas de datos para cada fecha
            (datosFiltrados.labels || []).forEach((fecha, fechaIndex) => {
                const totalPorFecha = datosFiltrados.datasets.reduce((sum, dataset) => 
                    sum + (dataset.data[fechaIndex] || 0), 0);
                
                html += `
                    <tr>
                        <td><strong>${fecha}</strong></td>
                        ${datosFiltrados.datasets.map(dataset => 
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
            
            // Fila de totales por institución
            html += `
                <tr style="background: #f0f7ff; font-weight: bold;">
                    <td><strong>Total por Institución</strong></td>
                    ${datosFiltrados.datasets.map(dataset => {
                        const totalInstitucion = dataset.data.reduce((sum, val) => sum + (val || 0), 0);
                        return `<td style="text-align: center; color: #2e7d32;">${totalInstitucion.toLocaleString()}</td>`;
                    }).join('')}
                    <td style="text-align: center; background: #2e7d32; color: white;">
                        ${datosFiltrados.datasets.reduce((total, dataset) => 
                            total + dataset.data.reduce((sum, val) => sum + (val || 0), 0), 0
                        ).toLocaleString()}
                    </td>
                </tr>
            `;
        } else if (datosFiltrados.values && datosFiltrados.values.length > 0) {
            // FORMATO ANTIGUO: Una sola serie de datos
            const total = datosFiltrados.values.reduce((a, b) => a + b, 0);
            
            (datosFiltrados.labels || []).forEach((label, index) => {
                const valor = datosFiltrados.values[index] || 0;
                const porcentaje = total > 0 ? ((valor / total) * 100).toFixed(1) : 0;
                
                // Calcular tendencia
                let tendencia = '';
                if (index > 0) {
                    const valorAnterior = datosFiltrados.values[index - 1] || 0;
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
                
                html += `
                    <tr>
                        <td><strong>${label}</strong></td>
                        <td>${getDescripcionTiempo(tipo, label)}</td>
                        <td style="text-align: center; font-weight: bold">${valor.toLocaleString()}</td>
                        <td style="text-align: center; color: #2e7d32; font-weight: bold">${porcentaje}%</td>
                        <td style="text-align: center;">${tendencia}</td>
                    </tr>
                `;
            });
            
            // Total general
            html += `
                <tr style="background: #f8f9fa; font-weight: bold;">
                    <td colspan="2">TOTAL GENERAL</td>
                    <td style="text-align: center">${total.toLocaleString()}</td>
                    <td style="text-align: center">100%</td>
                    <td style="text-align: center;">-</td>
                </tr>
            `;
        } else {
            // Sin datos
            html = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px; color: #7f8c8d;">
                        <i class="fas fa-exclamation-circle"></i> No hay datos disponibles con los filtros aplicados
                    </td>
                </tr>
            `;
        }
        
        tbody.innerHTML = html;
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
                } else if (element.id === 'modalInstitucion') {
                    element.value = 'todas';
                }
            } else if (element.tagName === 'INPUT') {
                element.value = '';
            }
        });
        
        // Recargar gráfica original
        const tipo = determinarTipoActual();
        const tipoGrafica = document.getElementById('modalTipoGrafica')?.value || 'bar';
        
        if (tipo === 'institucion') {
            crearGraficaAmpliadaInstitucion(tipoGrafica);
            llenarTablaModalInstitucion();
        } else {
            crearGraficaAmpliadaTiempo(tipo, tipoGrafica);
            llenarTablaModalTiempo(tipo);
        }
        
        mostrarExito('Filtros limpiados - Mostrando todos los datos');
    }

    // Función para cerrar modal
    function cerrarModalInstitucion() {
        const modal = document.getElementById("chartModalInstitucion");
        if (modal) {
            modal.classList.remove("show");
        }
    }

    // Crear gráfica ampliada de institución - VERSIÓN CORREGIDA
    function crearGraficaAmpliadaInstitucion(tipoGrafica) {
        const ctx = document.getElementById("chartAmpliadoInstitucion");
        if (!ctx) return;

        // Destruir gráfica anterior si existe
        if (chartAmpliadoInstitucion) {
            chartAmpliadoInstitucion.destroy();
        }

        const { labels, values, total } = datosInstituciones;
        const colors = generarColoresInstitucion(labels.length);
        const tipoChart = tipoGrafica;

        chartAmpliadoInstitucion = new Chart(ctx, {
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
                        text: 'Distribución por Institución - Vista Ampliada',
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
                            text: 'Institución',
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

    // Llenar tabla del modal de institución
    function llenarTablaModalInstitucion() {
        const tbody = document.getElementById("tbodyDatosInstitucion");
        if (!tbody) return;

        const { labels, values, total } = datosInstituciones;

        tbody.innerHTML = labels.map((institucion, index) => {
            const cantidad = values[index];
            const porcentaje = total > 0 ? ((cantidad / total) * 100).toFixed(1) : 0;
            const tipo = obtenerTipoInstitucion(institucion);
            
            return `
                <tr>
                    <td><strong>${institucion}</strong></td>
                    <td>${tipo}</td>
                    <td style="text-align: center; font-weight: bold">${cantidad.toLocaleString()}</td>
                    <td style="text-align: center; color: #2e7d32; font-weight: bold">${porcentaje}%</td>
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

    // Crear gráfica ampliada de tiempo
    function crearGraficaAmpliadaTiempo(tipo, tipoGrafica) {
        const ctx = document.getElementById("chartAmpliadoInstitucion");
        if (!ctx) return;

        // Destruir gráfica anterior si existe
        if (chartAmpliadoInstitucion) {
            chartAmpliadoInstitucion.destroy();
        }

        const datos = getDatosTiempo(tipo);
        
        // GRÁFICOS CIRCULARES
        if (tipoGrafica === 'doughnut' || tipoGrafica === 'pie') {
            // Para gráficos circulares, usar distribución general por institución
            let labels = [];
            let data = [];
            let backgroundColor = [];
            
            if (datos.datasets && datos.datasets.length > 0) {
                // Calcular total por institución
                datos.datasets.forEach((dataset, index) => {
                    const totalInstitucion = dataset.data.reduce((a, b) => a + b, 0);
                    if (totalInstitucion > 0) {
                        labels.push(dataset.label);
                        data.push(totalInstitucion);
                        backgroundColor.push(dataset.backgroundColor || coloresInstituciones[index % coloresInstituciones.length]);
                    }
                });
            }
            
            chartAmpliadoInstitucion = new Chart(ctx, {
                type: tipoGrafica,
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: backgroundColor,
                        borderColor: '#fff',
                        borderWidth: 2,
                        hoverOffset: 15
                    }]
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
                            text: 'Distribución por Institución - Vista Ampliada',
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
                                    const value = context.parsed;
                                    const total = data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                    return `${label}: ${value} visitantes (${percentage}%)`;
                                }
                            }
                        }
                    },
                    cutout: tipoGrafica === 'doughnut' ? '50%' : '0%'
                }
            });
        } 
        // GRÁFICO DE BARRAS
        else if (tipoGrafica === 'bar') {
            chartAmpliadoInstitucion = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: datos.labels,
                    datasets: datos.datasets
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
                            text: `${getTituloTiempo(tipo)} - Vista Ampliada (Barras Agrupadas)`,
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
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    label += context.parsed.y + ' visitantes';
                                    return label;
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
                            stacked: false
                        },
                        x: {
                            grid: { display: false },
                            title: {
                                display: true,
                                text: getTituloTiempo(tipo).split(' ')[2] || 'Período',
                                font: { weight: 'bold', size: 14 }
                            },
                            stacked: false,
                            ticks: {
                                maxRotation: tipo === 'fecha' ? 45 : 0,
                                minRotation: 0
                            }
                        }
                    }
                }
            });
        }
    }

    // Función para cambiar tipo de gráfica en modal - VERSIÓN MEJORADA
    function cambiarTipoGraficaModal(tipoGrafica) {
        const tipo = determinarTipoActual();
        
        // Obtener los datos actuales del modal
        let datosActuales;
        if (tipo === 'institucion') {
            datosActuales = datosInstituciones;
            crearGraficaAmpliadaInstitucionConDatos(datosActuales, tipoGrafica);
            llenarTablaModalInstitucion();
        } else {
            datosActuales = getDatosTiempo(tipo);
            crearGraficaAmpliadaTiempoConDatos(tipo, datosActuales, tipoGrafica);
            llenarTablaModalTiempo(tipo);
        }
    }

    // Llenar tabla del modal de tiempo
    // Llenar tabla del modal de tiempo CON DATOS AGRUPADOS
    function llenarTablaModalTiempo(tipo) {
        const tbody = document.getElementById("tbodyDatosInstitucion");
        if (!tbody) return;

        const datos = getDatosTiempo(tipo);
        
        let html = '';
        
        // Encabezado
        html += `
            <tr style="background: #f8f9fa; font-weight: bold;">
                <th>Fecha/Período</th>
                ${datos.instituciones.map(inst => `<th>${inst}</th>`).join('')}
                <th>Total por Fecha</th>
            </tr>
        `;
        
        // Filas de datos
        datos.labels.forEach((fecha, fechaIndex) => {
            const totalPorFecha = datos.datasets.reduce((sum, dataset) => sum + dataset.data[fechaIndex], 0);
            
            html += `
                <tr>
                    <td><strong>${fecha}</strong></td>
                    ${datos.datasets.map(dataset => 
                        `<td style="text-align: center; font-weight: ${dataset.data[fechaIndex] > 0 ? 'bold' : 'normal'}">
                            ${dataset.data[fechaIndex].toLocaleString()}
                        </td>`
                    ).join('')}
                    <td style="text-align: center; background: #e8f5e9; font-weight: bold;">
                        ${totalPorFecha.toLocaleString()}
                    </td>
                </tr>
            `;
        });
        
        // Fila de totales por institución
        html += `
            <tr style="background: #f0f7ff; font-weight: bold;">
                <td><strong>Total por Institución</strong></td>
                ${datos.datasets.map(dataset => {
                    const totalInstitucion = dataset.data.reduce((sum, val) => sum + val, 0);
                    return `<td style="text-align: center; color: #2e7d32;">${totalInstitucion.toLocaleString()}</td>`;
                }).join('')}
                <td style="text-align: center; background: #2e7d32; color: white;">
                    ${datos.datasets.reduce((total, dataset) => 
                        total + dataset.data.reduce((sum, val) => sum + val, 0), 0
                    ).toLocaleString()}
                </td>
            </tr>
        `;
        
        tbody.innerHTML = html;
    }

    // =============================================
    // FUNCIONES DE DESCARGA
    // =============================================

    function descargarGraficoPrincipal() {
        if (chartBarInstitucion) {
            const link = document.createElement("a");
            link.download = "grafica_instituciones_principal.png";
            link.href = chartBarInstitucion.canvas.toDataURL("image/png");
            link.click();
        }
    }

    function descargarGraficoPrincipalTiempo(tipo) {
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
    }

    function descargarExcel() {
        const { labels, values, total } = datosInstituciones;
        
        const datosExcel = [
            ['Institución', 'Total Visitantes', 'Porcentaje'],
            ...labels.map((label, i) => {
                const porcentaje = total > 0 ? ((values[i] / total) * 100).toFixed(1) : 0;
                return [label, values[i], `${porcentaje}%`];
            }),
            ['TOTAL', total, '100%']
        ];

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(datosExcel);
        XLSX.utils.book_append_sheet(wb, ws, "Datos por Institución");
        XLSX.writeFile(wb, "reporte_instituciones.xlsx");
    }

    function descargarExcelTiempo(tipo) {
        const datos = getDatosTiempo(tipo);
        
        const datosExcel = [
            [getTituloTiempo(tipo).split(' ')[1], 'Total Visitantes', 'Porcentaje'],
            ...datos.labels.map((label, i) => {
                const porcentaje = datos.total > 0 ? ((datos.values[i] / datos.total) * 100).toFixed(1) : 0;
                return [label, datos.values[i], `${porcentaje}%`];
            }),
            ['TOTAL', datos.total, '100%']
        ];

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(datosExcel);
        XLSX.utils.book_append_sheet(wb, ws, `Datos por ${tipo}`);
        XLSX.writeFile(wb, `reporte_${tipo}.xlsx`);
    }

    function exportarDatosFiltrados() {
        Swal.fire({
            icon: 'info',
            title: 'Exportar Datos',
            text: 'Función de exportación de datos filtrados',
            confirmButtonColor: '#3498db'
        });
    }

    // Limpiar filtros combinados - VERSIÓN MEJORADA
    function limpiarFiltrosCombinados() {
        // Limpiar campos
        document.getElementById('filtro-fecha-inicial').value = '';
        document.getElementById('filtro-fecha-final').value = '';
        document.getElementById('filtro-institucion-comb').value = 'todas';
        
        // Recargar datos sin filtros según el tipo actual
        if (tipoActual === 'institucion') {
            // Recargar datos de institución originales
            datosInstituciones = JSON.parse(JSON.stringify(datosOriginales));
            mostrarInterfazInstitucion();
        } else {
            // Recargar datos de tiempo
            cargarDatosTiempo(tipoActual);
        }
        
        mostrarExito('Filtros limpiados - Mostrando todos los datos');
    }

    // =============================================
    // API PÚBLICA COMPLETA
    // =============================================

    // Inicializar el objeto global
    if (!window.InstitucionManager) {
        window.InstitucionManager = {};
    }

    // Función para inicializar la API completa
    function inicializarAPICompleta() {
        // Métodos de modal con filtros
        window.InstitucionManager.abrirModal = (tipo) => abrirModalInstitucion(tipo);
        window.InstitucionManager.abrirModalTiempo = (tipo, tipoGrafica) => abrirModalTiempo(tipo, tipoGrafica);
        window.InstitucionManager.cerrarModal = () => cerrarModalInstitucion();
        window.InstitucionManager.aplicarFiltrosModal = () => aplicarFiltrosModal();
        window.InstitucionManager.limpiarFiltrosModal = () => limpiarFiltrosModal();
        
        // Métodos de descarga
        window.InstitucionManager.descargarPNG = () => {
            const canvas = document.getElementById("chartAmpliadoInstitucion");
            if (canvas) {
                const link = document.createElement("a");
                link.download = "grafica_ampliada.png";
                link.href = canvas.toDataURL("image/png");
                link.click();
            }
        };
        
        window.InstitucionManager.descargarExcelModal = () => {
            const titulo = document.getElementById('modalTitleInstitucion')?.textContent || 'Reporte';
            const tbody = document.getElementById("tbodyDatosInstitucion");
            if (!tbody) return;
            
            const filas = tbody.querySelectorAll('tr');
            const datosExcel = [];
            
            // Obtener encabezados de la tabla
            const thead = document.querySelector('#tablaDatosInstitucion thead');
            const encabezados = [];
            if (thead) {
                const ths = thead.querySelectorAll('th');
                ths.forEach(th => encabezados.push(th.textContent.trim()));
                datosExcel.push(encabezados);
            } else {
                // Encabezados por defecto
                datosExcel.push(['Institución/Período', 'Descripción', 'Total Visitantes', 'Porcentaje', 'Tendencia']);
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
            XLSX.utils.book_append_sheet(wb, ws, "Datos Filtrados");
            XLSX.writeFile(wb, "reporte_filtrado.xlsx");
        };

        // Métodos principales
        window.InstitucionManager.inicializar = () => cargarDatosCompletos();
        window.InstitucionManager.cambiarTipoReporte = (tipo) => cambiarTipoReporte(tipo);
        
        // Métodos de filtrado principal
        window.InstitucionManager.aplicarFiltrosCombinados = () => aplicarFiltrosCombinados();
        window.InstitucionManager.limpiarFiltrosCombinados = () => limpiarFiltrosCombinados();
        window.InstitucionManager.exportarDatosFiltrados = () => exportarDatosFiltrados();
        
        // Métodos para tiempo
        window.InstitucionManager.descargarGraficoPrincipalTiempo = (tipo) => descargarGraficoPrincipalTiempo(tipo);
        window.InstitucionManager.descargarExcelTiempo = (tipo) => descargarExcelTiempo(tipo);

        // Métodos generales
        window.InstitucionManager.descargarGraficoPrincipal = () => descargarGraficoPrincipal();
        window.InstitucionManager.descargarExcel = () => descargarExcel();

        // En la API pública, agrega:
        window.InstitucionManager.recargarInstituciones = () => cargarInstitucionesBase();

        window.InstitucionManager.depurarInstitucion = (nombre) => depurarInstitucionEspecifica(nombre);
    
        window.InstitucionManager.verificarDatos = () => verificarDatosInstitucion();


        // Agrega esto a la API pública para depuración:
         window.InstitucionManager.depurarFiltros = function() {
            console.log('=== DEPURACIÓN DE FILTROS ===');
            console.log('Total instituciones en base de datos:', todasLasInstituciones.length);
            console.log('Primeras 5 instituciones:', todasLasInstituciones.slice(0, 5).map(i => i.nombre_institucion));
            
            console.log('DatosInstituciones.datosCompletos:');
            if (datosInstituciones.datosCompletos) {
                console.log('Número de instituciones:', Object.keys(datosInstituciones.datosCompletos).length);
                console.log('Primeras 5:', Object.keys(datosInstituciones.datosCompletos).slice(0, 5));
            } else {
                console.log('datosCompletos NO está definido!');
            }
            
            console.log('Select de filtros:');
            const select = document.getElementById('filtro-institucion-comb');
            if (select) {
                console.log('Opciones en select:', select.options.length);
                console.log('Primeras 5 opciones:', Array.from(select.options).slice(0, 5).map(o => o.value));
            }
            
            // Mostrar en alert para fácil visualización
            const institucionesSelect = Array.from(document.getElementById('filtro-institucion-comb')?.options || [])
                .map(o => o.value)
                .slice(0, 20)
                .join('\n');
            
            alert(`Instituciones en filtro (primeras 20):\n${institucionesSelect}\n\nTotal: ${document.getElementById('filtro-institucion-comb')?.options.length || 0}`);
        };
    }

    // Inicializar la API completa
    inicializarAPICompleta();

    console.log('✅ Sistema de Institución con filtros en modal cargado correctamente');

    // Auto-inicializar con manejo de errores mejorado
    document.addEventListener('DOMContentLoaded', function() {
        // Primero actualizar la fecha/hora
        updateDateTime();
        setInterval(updateDateTime, 60000);
        
        // Configurar eventos de botones
        document.getElementById('help-btn')?.addEventListener('click', function() {
            // Tu código de ayuda...
        });

        document.getElementById('logout-btn')?.addEventListener('click', function() {
            // Tu código de logout...
        });
        
        // Inicializar sistema con retraso para evitar bloqueos
        setTimeout(() => {
            if (window.InstitucionManager && window.InstitucionManager.inicializar) {
                console.log('🚀 Inicializando sistema de reportes...');
                // Usar un pequeño retraso para evitar conflictos con el bloqueo del navegador
                setTimeout(() => {
                    window.InstitucionManager.inicializar().catch(error => {
                        console.error('Error en inicialización:', error);
                        // Intentar nuevamente después de 2 segundos
                        setTimeout(() => {
                            window.InstitucionManager.inicializar();
                        }, 2000);
                    });
                }, 500);
            }
        }, 1500);
    });

    async function depurarInstitucionEspecifica(nombreInstitucion) {
        try {
            console.log(`🔍 Depurando institución: ${nombreInstitucion}`);
            
            // Buscar en la base de datos
            const institucionObj = todasLasInstituciones.find(inst => 
                inst.nombre_institucion && 
                inst.nombre_institucion.trim().toLowerCase() === nombreInstitucion.toLowerCase().trim()
            );
            
            console.log('Encontrada en base de datos:', institucionObj);
            
            // Buscar en participantes
            if (institucionObj) {
                const { data: participantes, error } = await supabase
                    .from('participantes_reserva')
                    .select('id, fecha_visita')
                    .eq('id_institucion', institucionObj.id_institucion);
                
                console.log('Participantes encontrados:', participantes?.length || 0);
                console.log('Primeros 3 participantes:', participantes?.slice(0, 3));
            }
            
            // Buscar en datosInstituciones
            const enLabelsIndex = datosInstituciones.labels?.indexOf(nombreInstitucion);
            console.log('En datosInstituciones.labels:', enLabelsIndex !== -1 ? `índice ${enLabelsIndex}` : 'NO encontrada');
            
            // Buscar en datosOriginales
            const enOriginalesIndex = datosOriginales.labels?.indexOf(nombreInstitucion);
            console.log('En datosOriginales.labels:', enOriginalesIndex !== -1 ? `índice ${enOriginalesIndex}` : 'NO encontrada');
            
        } catch (error) {
            console.error('Error en depuración:', error);
        }
    }


})();