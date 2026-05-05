// Función auxiliar para mostrar mensaje sin datos
function mostrarMensajeSinDatos(mensaje) {
    console.warn('⚠️', mensaje);
    // Si tienes SweetAlert2 configurado:
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'warning',
            title: 'Información',
            text: mensaje,
            timer: 3000,
            showConfirmButton: false
        });
    } else {
        alert(mensaje);
    }
}

// Función auxiliar para mostrar éxito
function mostrarExito(mensaje) {
    console.log('✅', mensaje);
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: mensaje,
            timer: 2000,
            showConfirmButton: false
        });
    }
}

function mostrarGraficas(tipo) {
    console.log(`📊 [UI] Mostrando gráficas para: ${tipo}`);
    
    // Actualizar tipo actual
    tipoActual = tipo;
    
    // Verificar si crearGraficas existe (de chart-functions.js)
    if (typeof crearGraficas === 'function') {
        console.log('✅ Usando crearGraficas de chart-functions.js');
        crearGraficas(tipo);
    } else {
        console.error('❌ crearGraficas no encontrada, cargando dinámicamente...');
        
        // Mostrar mensaje temporal
        const container = document.getElementById('data-container');
        const originalHTML = container.innerHTML;
        
        container.innerHTML = `
            <div style="padding: 40px; text-align: center; color: #666;">
                <i class="fas fa-spinner fa-spin fa-3x"></i>
                <p style="margin-top: 20px;">Inicializando gráficas 3D...</p>
            </div>
        `;
        
        // Intentar cargar chart-functions.js dinámicamente
        const script = document.createElement('script');
        script.src = 'js/chart-functions.js';
        script.async = true;
        
        script.onload = function() {
            console.log('✅ chart-functions.js cargado dinámicamente');
            if (typeof crearGraficas === 'function') {
                container.innerHTML = originalHTML;
                crearGraficas(tipo);
            } else {
                mostrarGraficasDeEmergencia(tipo);
            }
        };
        
        script.onerror = function() {
            console.error('❌ No se pudo cargar chart-functions.js');
            container.innerHTML = originalHTML;
            mostrarGraficasDeEmergencia(tipo);
        };
        
        document.head.appendChild(script);
    }
}

// Función de emergencia si chart-functions.js no carga
function mostrarGraficasDeEmergencia(tipo) {
    console.warn('⚠️ Usando gráficas de emergencia para:', tipo);
    
    const datos = datosSimulados[tipo] || datosSimulados.genero;
    
    // Gráfica de barras
    const ctxBar = document.getElementById("chartBar").getContext("2d");
    if (window.chartBar) window.chartBar.destroy();
    
    window.chartBar = new Chart(ctxBar, {
        type: "bar",
        data: {
            labels: datos.labels || ['Masculino', 'Femenino', 'Otro', 'Prefiero no decirlo'],
            datasets: [{
                label: "Visitantes",
                data: datos.values || [0, 0, 0, 0],
                backgroundColor: ['#3498db', '#e74c3c', '#2ecc71', '#f39c12'],
                borderWidth: 1,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: obtenerTituloDescriptivo(tipo) + ' (Emergencia)'
                }
            }
        }
    });
    
    // Gráfica circular
    const ctxPie = document.getElementById("chartPie").getContext("2d");
    if (window.chartPie) window.chartPie.destroy();
    
    window.chartPie = new Chart(ctxPie, {
        type: "doughnut",
        data: {
            labels: datos.labels || ['Masculino', 'Femenino', 'Otro', 'Prefiero no decirlo'],
            datasets: [{
                data: datos.values || [0, 0, 0, 0],
                backgroundColor: ['#3498db', '#e74c3c', '#2ecc71', '#f39c12']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: obtenerTituloDescriptivo(tipo) + ' (Emergencia)'
                }
            }
        }
    });
    
    mostrarMensajeSinDatos('Usando modo de emergencia - Recarga la página para gráficas 3D completas');
}


// Función para actualizar fecha y hora
function updateDateTime() {
    const now = new Date();
    const dateTimeString = now.toLocaleString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    });

    document.getElementById("current-date-time").textContent = dateTimeString;
}

// Función para mostrar datos
function mostrarDatos() {
    const container = document.getElementById('data-container');
    
    const totalVisitantes = datosSimulados.genero.values.reduce((a, b) => a + b, 0);
    const tieneDatosReales = totalVisitantes > 0;

    container.innerHTML = `
        <div class="chart-controls">
            <div class="chart-header">
                <h3 style="margin: 0; display: flex; align-items: center; gap: 6px">
                    <i class="fas fa-chart-bar"></i> Estadísticas por Género
                    ${tieneDatosReales ? 
                        '<span style="background: #27ae60; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; margin-left: 10px;">DATOS REALES</span>' : 
                        '<span style="background: #e74c3c; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; margin-left: 10px;">DATOS DE EJEMPLO</span>'
                    }
                </h3>
                <div style="display: flex; gap: 10px;">
                    <button class="download-btn" id="downloadChartBtn">
                        <i class="fas fa-download"></i> Descargar Gráfico
                    </button>
                    ${!tieneDatosReales ? `
                        <button class="download-btn" onclick="insertarDatosDePrueba()" style="background: linear-gradient(135deg, #e67e22, #f39c12);">
                            <i class="fas fa-database"></i> Insertar Datos de Prueba
                        </button>
                    ` : ''}
                </div>
            </div>

            <div class="chart-type-buttons btn-group" style="margin-top: 12px">
                <button class="chart-btn active" data-type="genero">
                    <i class="fas fa-venus-mars"></i> Por Género
                </button>
                <button class="chart-btn" data-type="fecha">
                    <i class="fas fa-calendar-day"></i> Por Fecha
                </button>
                
                <button class="chart-btn" data-type="mes">
                    <i class="fas fa-calendar-week"></i> Por Mes
                </button>
                <button class="chart-btn" data-type="anio">
                    <i class="fas fa-calendar-alt"></i> Por Año
                </button>
                
            </div>
        </div>

        ${tieneDatosReales ? `
            <div style="background: linear-gradient(135deg, #a8e6cf, #dcedc1); padding: 15px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #27ae60;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-check-circle" style="color: #27ae60; font-size: 20px;"></i>
                    <div>
                        <h4 style="margin: 0; color: #2d3436;">✅ Mostrando datos reales</h4>
                        <p style="margin: 5px 0 0 0; color: #2d3436;">
                            Se encontraron <strong>${totalVisitantes} participantes</strong> en la base de datos. 
                            Las estadísticas reflejan información real del sistema.
                        </p>
                    </div>
                </div>
            </div>
        ` : `
            <div style="background: linear-gradient(135deg, #ffeaa7, #fab1a0); padding: 15px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #e17055;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-info-circle" style="color: #d63031; font-size: 20px;"></i>
                    <div>
                        <h4 style="margin: 0; color: #2d3436;">Mostrando datos de ejemplo</h4>
                        <p style="margin: 5px 0 0 0; color: #2d3436;">
                            No se encontraron datos reales en la base de datos. 
                            <button onclick="insertarDatosDePrueba()" style="background: none; border: none; color: #0984e3; text-decoration: underline; cursor: pointer; font-weight: bold;">
                                Haz clic aquí para insertar datos de prueba reales
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        `}

        <div class="charts-grid">
            <div class="chart-card" onclick="abrirModal('bar')">
                <div class="chart-card-header">
                    <div class="chart-card-title">
                        <i class="fas fa-chart-bar"></i> Gráfica de Barras
                    </div>
                    <div class="chart-card-badge">Haz clic para ampliar</div>
                </div>
                <div class="chart-canvas-wrap">
                    <canvas id="chartBar"></canvas>
                </div>
            </div>

            <div class="chart-card" onclick="abrirModal('pie')">
                <div class="chart-card-header">
                    <div class="chart-card-title">
                        <i class="fas fa-chart-pie"></i> Gráfica Circular
                    </div>
                    <div class="chart-card-badge">Haz clic para ampliar</div>
                </div>
                <div class="chart-canvas-wrap pie-chart-container">
                    <canvas id="chartPie"></canvas>
                </div>
            </div>
        </div>

        <div class="table-section active" id="tablaGenero" style="margin-top: 20px">
            <div class="data-table">
                <div class="chart-header">
                    <h3 style="margin: 0; display: flex; align-items: center; gap: 6px">
                        <i class="fas fa-venus-mars"></i> Distribución por Género
                        ${tieneDatosReales ? 
                            '<span style="color: #27ae60; font-size: 12px; margin-left: 10px;">(Datos reales)</span>' : 
                            '<span style="color: #e74c3c; font-size: 12px; margin-left: 10px;">(Datos de ejemplo)</span>'
                        }
                    </h3>
                    <button class="download-btn" onclick="descargarExcelTabla('genero')">
                        <i class="fas fa-file-excel"></i> Descargar Excel
                    </button>
                </div>
                <div style="overflow-x: auto;">
                    <table class="table" id="tabla-genero-contenido" style="margin-top: 12px; min-width: 600px;">
                        <thead>
                            <tr>
                                <th style="width: 50px;">#</th>
                                <th style="min-width: 150px;">Género</th>
                                <th style="width: 120px;">Total Visitantes</th>
                                <th style="width: 100px;">Porcentaje</th>
                            </tr>
                        </thead>
                        <tbody id="tabla-genero-body">
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    llenarTablaGenero();
    configurarEventos();

    setTimeout(() => {
        console.log('🔄 Inicializando gráficas después de renderizado del DOM...');
        console.log('Elemento chartBar:', document.getElementById('chartBar'));
        console.log('Elemento chartPie:', document.getElementById('chartPie'));
        
        // Llamar a mostrarGraficas (ahora definida arriba)
        mostrarGraficas("genero");
    }, 100);
}

// Función para configurar eventos
function configurarEventos() {
    console.log('⚙️ Configurando eventos...');
    
    const chartButtons = document.querySelectorAll('.chart-btn');
    console.log('Botones encontrados:', chartButtons.length);
    
    chartButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const tipo = this.getAttribute('data-type');
            console.log(`Cambiando a gráfica: ${tipo}`);
            mostrarGraficas(tipo);
        });
    });

    const downloadBtn = document.getElementById('downloadChartBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', descargarGraficoPrincipal);
        console.log('✅ Botón de descarga configurado');
    } else {
        console.log('❌ Botón de descarga no encontrado');
    }
}

// Llenar tabla de géneros
function llenarTablaGenero() {
    const tbody = document.getElementById('tabla-genero-body');
    const totalVisitantes = datosSimulados.genero.values.reduce((a, b) => a + b, 0);
    
    tbody.innerHTML = datosSimulados.genero.labels.map((genero, index) => {
        const cantidad = datosSimulados.genero.values[index];
        const porcentaje = totalVisitantes > 0 ? ((cantidad / totalVisitantes) * 100).toFixed(1) : 0;
        const claseGenero = obtenerClaseGenero(genero);
        const generoFormateado = formatearGenero(genero);
        
        return `
            <tr>
                <td style="font-weight: bold; color: #000; width: 50px;">${index + 1}</td>
                <td style="min-width: 150px;">
                    <span class="gender-badge ${claseGenero}">
                        <i class="fas ${genero === 'masculino' ? 'fa-mars' : genero === 'femenino' ? 'fa-venus' : 'fa-genderless'}"></i>
                        ${generoFormateado}
                    </span>
                </td>
                <td style="width: 120px; text-align: center;"><strong>${cantidad.toLocaleString()}</strong></td>
                <td style="width: 100px; text-align: center; color: #000; font-weight: bold">${porcentaje}%</td>
            </tr>
        `;
    }).join('');
}

// Función para crear filtros en el modal
function crearFiltrosModal() {
    const modalHeader = document.querySelector('.modal-header');
    
    // Eliminar filtros anteriores si existen
    const filtrosAnteriores = document.getElementById('filtrosModal');
    if (filtrosAnteriores) {
        filtrosAnteriores.remove();
    }

    let filtrosHTML = '';
    const ahora = new Date();
    const añoActual = ahora.getFullYear();
    const mesActual = ahora.getMonth();

    switch(tipoActual) {
        case 'genero':
            filtrosHTML = `
                <div class="filtro-grupo">
                    <label for="filtroGenero"><i class="fas fa-venus-mars"></i> Género:</label>
                    <select id="filtroGenero" onchange="aplicarFiltroGenero()">
                        <option value="todos">Todos los géneros</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                        <option value="Otro">Otro</option>
                        <option value="Prefiero no decirlo">Prefiero no decirlo</option>
                    </select>
                </div>
            `;
            break;
        
        case 'fecha':
            // FECHAS POR DEFECTO: MES ACTUAL
            const fechaInicialDefault = new Date(añoActual, mesActual, 1);
            const fechaFinalDefault = new Date(añoActual, mesActual + 1, 0);
            
            filtrosHTML = `
                <div class="filtro-grupo">
                    <label for="filtroFechaInicial"><i class="fas fa-calendar-alt"></i> Fecha Inicial:</label>
                    <input type="date" id="filtroFechaInicial" value="${fechaInicialDefault.toISOString().split('T')[0]}">
                </div>
                <div class="filtro-grupo">
                    <label for="filtroFechaFinal"><i class="fas fa-calendar-alt"></i> Fecha Final:</label>
                    <input type="date" id="filtroFechaFinal" value="${fechaFinalDefault.toISOString().split('T')[0]}">
                </div>
                <div class="filtro-grupo">
                    <label for="filtroGeneroFecha"><i class="fas fa-venus-mars"></i> Género:</label>
                    <select id="filtroGeneroFecha" onchange="aplicarFiltroPorGeneroYFecha()">
                        <option value="todos">Todos los géneros</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                        <option value="Otro">Otro</option>
                        <option value="Prefiero no decirlo">Prefiero no decirlo</option>
                    </select>
                </div>
                <div class="filtro-grupo">
                    <button class="btn-aplicar-filtro" onclick="aplicarFiltroPorGeneroYFecha()">
                        <i class="fas fa-filter"></i> Aplicar Filtro
                    </button>
                    <button class="btn-mes-actual" onclick="cargarMesActual()" style="
                        background: #27ae60;
                        color: white;
                        border: none;
                        padding: 8px 12px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 0.85rem;
                        margin-left: 10px;
                    ">
                        <i class="fas fa-calendar"></i> Mes Actual
                    </button>
                </div>
            `;
            break;
                    
        // case 'dia':
        //     // Para día específico del mes actual - usar datos reales
        //     const diasConDatos = obtenerDiasConDatosDelMesActual();
            
        //     filtrosHTML = `
        //         <div class="filtro-grupo">
        //             <label for="filtroDiaEspecifico"><i class="fas fa-calendar-day"></i> Día específico:</label>
        //             <select id="filtroDiaEspecifico" onchange="aplicarFiltroDiaEspecifico()">
        //                 <option value="todos">Todos los días</option>
        //                 ${diasConDatos.map(diaInfo => 
        //                     `<option value="${diaInfo.diaNumero}">${diaInfo.diaNumero} ${diaInfo.mesNombre} (${diaInfo.diaSemana})</option>`
        //                 ).join('')}
        //             </select>
        //         </div>
        //     `;
            
        //     // Si no hay días con datos, mostrar mensaje
        //     if (diasConDatos.length === 0) {
        //         filtrosHTML += `
        //             <div style="color: #e74c3c; font-size: 0.85rem; margin-top: 5px;">
        //                 <i class="fas fa-info-circle"></i> No hay datos para el mes actual
        //             </div>
        //         `;
        //     }
        //     break;
        
        case 'mes':
            // PARA MES: Usar el mismo formato que fecha pero para meses
            const fechaInicialMes = new Date(añoActual, mesActual, 1);
            const fechaFinalMes = new Date(añoActual, mesActual + 1, 0);
            
            filtrosHTML = `
                <div class="filtro-grupo">
                    <label for="filtroFechaInicialMes"><i class="fas fa-calendar-alt"></i> Fecha Inicial:</label>
                    <input type="date" id="filtroFechaInicialMes" value="${fechaInicialMes.toISOString().split('T')[0]}">
                </div>
                <div class="filtro-grupo">
                    <label for="filtroFechaFinalMes"><i class="fas fa-calendar-alt"></i> Fecha Final:</label>
                    <input type="date" id="filtroFechaFinalMes" value="${fechaFinalMes.toISOString().split('T')[0]}">
                </div>
                <div class="filtro-grupo">
                    <label for="filtroGeneroMes"><i class="fas fa-venus-mars"></i> Género:</label>
                    <select id="filtroGeneroMes">
                        <option value="todos">Todos los géneros</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                        <option value="Otro">Otro</option>
                        <option value="Prefiero no decirlo">Prefiero no decirlo</option>
                    </select>
                </div>
                <div class="filtro-grupo">
                    <button class="btn-aplicar-filtro" onclick="aplicarFiltroRangoMeses()">
                        <i class="fas fa-filter"></i> Aplicar Filtro
                    </button>
                </div>
            `;
            break;
                        
        case 'anio':
            // PARA AÑO: Usar el mismo formato que fecha pero para años
            const fechaInicialAnio = new Date(añoActual, 0, 1);
            const fechaFinalAnio = new Date(añoActual, 11, 31);
            
            filtrosHTML = `
                <div class="filtro-grupo">
                    <label for="filtroFechaInicialAnio"><i class="fas fa-calendar-alt"></i> Fecha Inicial:</label>
                    <input type="date" id="filtroFechaInicialAnio" value="${fechaInicialAnio.toISOString().split('T')[0]}">
                </div>
                <div class="filtro-grupo">
                    <label for="filtroFechaFinalAnio"><i class="fas fa-calendar-alt"></i> Fecha Final:</label>
                    <input type="date" id="filtroFechaFinalAnio" value="${fechaFinalAnio.toISOString().split('T')[0]}">
                </div>
                <div class="filtro-grupo">
                    <label for="filtroGeneroAnio"><i class="fas fa-venus-mars"></i> Género:</label>
                    <select id="filtroGeneroAnio">
                        <option value="todos">Todos los géneros</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                        <option value="Otro">Otro</option>
                        <option value="Prefiero no decirlo">Prefiero no decirlo</option>
                    </select>
                </div>
                <div class="filtro-grupo">

                    <button class="btn-aplicar-filtro" onclick="aplicarFiltroRangoAnios()">
                        <i class="fas fa-filter"></i> Aplicar Filtro
                    </button>
                </div>
            `;
            break;
        
        // case 'intereses':
        //     // PARA INTERESES: Usar el mismo formato que fecha pero para intereses
        //     const fechaInicialIntereses = new Date();
        //     fechaInicialIntereses.setDate(fechaInicialIntereses.getDate() - 30);
        //     const fechaFinalIntereses = new Date();
            
        //     filtrosHTML = `
        //         <div class="filtro-grupo">
        //             <label for="filtroFechaInicialIntereses"><i class="fas fa-calendar-alt"></i> Fecha Inicial:</label>
        //             <input type="date" id="filtroFechaInicialIntereses" value="${fechaInicialIntereses.toISOString().split('T')[0]}">
        //         </div>
        //         <div class="filtro-grupo">
        //             <label for="filtroFechaFinalIntereses"><i class="fas fa-calendar-alt"></i> Fecha Final:</label>
        //             <input type="date" id="filtroFechaFinalIntereses" value="${fechaFinalIntereses.toISOString().split('T')[0]}">
        //         </div>
        //         <div class="filtro-grupo">
        //             <label for="filtroInteresEspecifico"><i class="fas fa-heart"></i> Interés:</label>
        //             <select id="filtroInteresEspecifico">
        //                 <option value="todos">Todos los intereses</option>
        //                 <option value="Observación">Observación</option>
        //                 <option value="Fotografía">Fotografía</option>
        //                 <option value="Investigación">Investigación</option>
        //                 <option value="Educación">Educación</option>
        //                 <option value="Recreación">Recreación</option>
        //             </select>
        //         </div>
        //         <div class="filtro-grupo">
        //             <button class="btn-aplicar-filtro" onclick="aplicarFiltroIntereses()">
        //                 <i class="fas fa-filter"></i> Aplicar Filtro
        //             </button>
        //         </div>
        //     `;
        //     break;
    }

    const filtrosContainer = document.createElement('div');
    filtrosContainer.id = 'filtrosModal';
    filtrosContainer.style.cssText = `
        margin-bottom: 20px;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 8px;
        border: 1px solid #e9ecef;
    `;
    filtrosContainer.innerHTML = `
        <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
            ${filtrosHTML}
            <button class="btn-limpiar-filtro" onclick="limpiarFiltro()" style="
                background: #95a5a6;
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.85rem;
            ">
                <i class="fas fa-times"></i> Limpiar Filtro
            </button>
        </div>
    `;

    // Insertar después del modal-header
    modalHeader.parentNode.insertBefore(filtrosContainer, modalHeader.nextSibling);
}

// Función auxiliar para obtener días con datos del mes actual
// function obtenerDiasConDatosDelMesActual() {
//     const ahora = new Date();
//     const añoActual = ahora.getFullYear();
//     const mesActual = ahora.getMonth();
    
//     const diasConDatos = [];
//     const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
//     const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
//     // Por simplicidad, generamos días del 1 al actual del mes
//     const diaActual = ahora.getDate();
    
//     for (let dia = 1; dia <= diaActual; dia++) {
//         const fecha = new Date(añoActual, mesActual, dia);
//         const diaSemana = diasSemana[fecha.getDay()];
//         const mesNombre = meses[mesActual];
        
//         diasConDatos.push({
//             diaNumero: dia,
//             diaSemana: diaSemana,
//             mesNombre: mesNombre,
//             tieneDatos: true
//         });
//     }
    
//     return diasConDatos.sort((a, b) => a.diaNumero - b.diaNumero);
// }


// Función para limpiar filtros
function limpiarFiltro() {
    // if (tipoActual === 'intereses') {
    //     // Recargar datos de intereses (últimos 30 días)
    //     const fechaInicial = new Date();
    //     fechaInicial.setDate(fechaInicial.getDate() - 30);
    //     const fechaFinal = new Date();
        
    //     cargarDatosInteresesPorTiempo(
    //         fechaInicial.toISOString().split('T')[0],
    //         fechaFinal.toISOString().split('T')[0],
    //         'todos'
    //     ).then(datosActuales => {
    //         datosSimulados.intereses = datosActuales;
    //         datosOriginales.intereses = JSON.parse(JSON.stringify(datosActuales));
    //         actualizarGraficaModal(document.querySelector('.modal-chart-container').getAttribute('data-tipo-grafica'));
    //     }).catch(error => {
    //         console.error('Error recargando datos de intereses:', error);
    //         actualizarGraficaModal(document.querySelector('.modal-chart-container').getAttribute('data-tipo-grafica'));
    //     });
    // } else {
        // Para otros tipos, restaurar datos originales
        Object.keys(datosOriginales).forEach(key => {
            if (datosOriginales[key]) {
                datosSimulados[key] = JSON.parse(JSON.stringify(datosOriginales[key]));
            }
        });
        // Recargar gráfica inmediatamente para otros tipos
        actualizarGraficaModal(document.querySelector('.modal-chart-container').getAttribute('data-tipo-grafica'));
    
    
    // Restablecer todos los selects a valores por defecto
    const selects = [
        'filtroGenero', 'filtroFechaInicial', 'filtroFechaFinal', 'filtroGeneroFecha',
        'filtroFechaInicialMes', 'filtroFechaFinalMes', 'filtroGeneroMes',
        'filtroFechaInicialAnio', 'filtroFechaFinalAnio', 'filtroGeneroAnio',
        'filtroFechaInicialIntereses', 'filtroFechaFinalIntereses', 'filtroInteresEspecifico',
        'filtroDiaEspecifico', 'filtroAnioMes', 'filtroMesEspecifico', 
        'filtroAnioEspecifico', 'filtroAnioIntereses', 
        'filtroMesIntereses', 'filtroInteres'
    ];
    
    const ahora = new Date();
    selects.forEach(selectId => {
        const elemento = document.getElementById(selectId);
        if (elemento) {
            if (elemento.type === 'date') {
                // Para inputs de fecha, restaurar valores por defecto según el tipo
                if (selectId.includes('Mes')) {
                    // Para mes: primer y último día del mes actual
                    const fechaInicialMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
                    const fechaFinalMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0);
                    if (selectId.includes('Inicial')) {
                        elemento.value = fechaInicialMes.toISOString().split('T')[0];
                    } else {
                        elemento.value = fechaFinalMes.toISOString().split('T')[0];
                    }
                } else if (selectId.includes('Anio')) {
                    // Para año: primer y último día del año actual
                    const fechaInicialAnio = new Date(ahora.getFullYear(), 0, 1);
                    const fechaFinalAnio = new Date(ahora.getFullYear(), 11, 31);
                    if (selectId.includes('Inicial')) {
                        elemento.value = fechaInicialAnio.toISOString().split('T')[0];
                    } else {
                        elemento.value = fechaFinalAnio.toISOString().split('T')[0];
                    }
                } else if (selectId.includes('Intereses')) {
                    // Para intereses: últimos 30 días
                    if (selectId.includes('Inicial')) {
                        const fechaPorDefectoInicial = new Date();
                        fechaPorDefectoInicial.setDate(fechaPorDefectoInicial.getDate() - 30);
                        elemento.value = fechaPorDefectoInicial.toISOString().split('T')[0];
                    } else {
                        elemento.value = new Date().toISOString().split('T')[0];
                    }
                } else {
                    // Para fecha general: últimos 30 días
                    if (selectId.includes('Inicial')) {
                        const fechaPorDefectoInicial = new Date();
                        fechaPorDefectoInicial.setDate(fechaPorDefectoInicial.getDate() - 30);
                        elemento.value = fechaPorDefectoInicial.toISOString().split('T')[0];
                    } else {
                        elemento.value = new Date().toISOString().split('T')[0];
                    }
                }
            } else {
                // Para selects normales, poner en "todos"
                elemento.value = 'todos';
            }
        }
    });
    
    // Mostrar mensaje de confirmación
    mostrarExito(tipoActual === 'intereses' ? 'Datos restablecidos a intereses (últimos 30 días)' : 'Todos los filtros han sido restablecidos');
}