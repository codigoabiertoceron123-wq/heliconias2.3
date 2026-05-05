// Módulo para gestión de interfaz - VERSIÓN CON DISEÑO VERDE MEJORADO
class UIManager {
    constructor() {
        this.dataLoader = null;
        this.chartManager = null;
        this.dataProcessor = null;
        this.app = null;
    }

    // MÉTODO PARA INICIALIZAR MÓDULOS
    inicializarModulos(dataLoader, chartManager, dataProcessor) {
        this.dataLoader = dataLoader;
        this.chartManager = chartManager;
        this.dataProcessor = dataProcessor;
        console.log('✅ Módulos inicializados en UIManager:', {
            dataLoader: !!dataLoader,
            chartManager: !!chartManager,
            dataProcessor: !!dataProcessor
        });
    }

    setApp(app) {
        this.app = app;
    }

    mostrarDatos() {
        console.log('🎨 Mostrando interfaz de datos...');
        console.log('📊 ChartManager disponible:', !!this.chartManager);
        console.log('📊 ChartManager global:', typeof chartManager !== 'undefined');

        const container = document.getElementById('data-container');
        if (!container) {
            console.error('Contenedor data-container no encontrado');
            return;
        }
        
        container.innerHTML = `
            <div class="chart-controls">
                <div class="chart-header">
                    <h3 style="margin: 0; display: flex; align-items: center; gap: 6px">
                        <i class="fas fa-chart-bar"></i> Selecciona la Categoría de Análisis
                    </h3>
                    <button class="download-btn" id="downloadChartBtn">
                        <i class="fas fa-download"></i> Descargar Gráfico (PNG)
                    </button>
                </div>

                <div class="chart-type-buttons btn-group" style="margin-top: 12px">
                    <button class="chart-btn active" data-type="tipo_reserva">
                        <i class="fas fa-ticket-alt"></i> Tipo Reserva
                    </button>
                    <button class="chart-btn" data-type="fecha">
                        <i class="fas fa-calendar-day"></i> Fecha
                    </button>
                    <button class="chart-btn" data-type="mes">
                        <i class="fas fa-calendar"></i> Mes
                    </button>
                    <button class="chart-btn" data-type="anio">
                        <i class="fas fa-calendar-alt"></i> Año
                    </button>
                </div>
            </div>

            <!-- Estado de carga -->
            <div id="loading-state" style="text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-spinner fa-spin fa-2x"></i>
                <p style="margin-top: 15px;">Cargando gráficas...</p>
            </div>

            <!-- Gráficas principales lado a lado -->
            <div class="charts-grid" id="charts-container" style="display: none;">
                <div class="chart-card" id="chart-card-barras">
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

                <div class="chart-card" id="chart-card-circular">
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

            <!-- Modal con diseño moderno verde (se insertará dinámicamente) -->
            <div id="chartModal" class="modal">
                <div class="modal-content modern-modal">
                    <div class="modern-modal-header">
                        <div class="modern-modal-title">
                            <i class="fas fa-chart-line"></i>
                            <span id="modalTitle">Análisis Detallado</span>
                        </div>
                        <span class="close">&times;</span>
                    </div>
                    <div class="modern-modal-filters" id="modalFiltersContainer">
                        <!-- Los filtros se insertarán aquí -->
                    </div>
                    <div class="modern-modal-body">
                        <div class="modern-modal-scrollable">
                            <div class="modern-chart-section">
                                <div class="modern-chart-container">
                                    <canvas id="chartAmpliado"></canvas>
                                </div>
                            </div>
                            <div class="modern-table-section">
                                <div class="modern-table-header">
                                    <i class="fas fa-table"></i>
                                    <span>Datos Detallados</span>
                                </div>
                                <div class="modern-table-container">
                                    <table class="modern-table">
                                        <thead>
                                            <tr id="tablaHeader"></tr>
                                        </thead>
                                        <tbody id="tablaDatos"></tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Agregar estilos CSS para el modal moderno verde
        this.agregarEstilosModalVerde();

        // Configurar eventos del modal
        this.configurarEventosModal();

        // Intentar cargar gráficas después de un breve delay
        setTimeout(() => {
            this.inicializarGraficas();
        }, 100);
    }

    agregarEstilosModalVerde() {
        const style = document.createElement('style');
        style.innerHTML = `
            /* MODAL MODERNO VERDE */
            .modal {
                display: none;
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.7);
                backdrop-filter: blur(3px);
                animation: fadeIn 0.3s ease;
            }

            .modal.show {
                display: block;
            }

            .modern-modal {
                background: white;
                margin: 2% auto;
                padding: 0;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                width: 90%;
                max-width: 1200px;
                max-height: 90vh;
                overflow: hidden;
                animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .modern-modal-header {
                background: linear-gradient(135deg, #2e7d32, #4caf50 100%);
                color: white;
                padding: 20px 30px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }

            .modern-modal-title {
                display: flex;
                align-items: center;
                gap: 12px;
                font-size: 1.5rem;
                font-weight: 600;
            }

            .modern-modal-title i {
                font-size: 1.3rem;
            }

            .modern-modal-header .close {
                color: white;
                font-size: 28px;
                font-weight: bold;
                cursor: pointer;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.3s ease;
                background: rgba(255, 255, 255, 0.2);
            }

            .modern-modal-header .close:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: rotate(90deg);
            }

            .modern-modal-filters {
                padding: 20px 30px;
                background: #f9fafb;
                border-bottom: 1px solid #e5e7eb;
            }

            .modern-modal-body {
                height: calc(90vh - 180px);
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }

            .modern-modal-scrollable {
                flex: 1;
                overflow-y: auto;
                padding: 20px 30px;
                display: flex;
                flex-direction: column;
                gap: 30px;
            }

            .modern-chart-section {
                flex-shrink: 0;
                min-height: 400px;
                background: white;
                border-radius: 12px;
                border: 1px solid #e5e7eb;
                padding: 20px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }

            .modern-chart-container {
                position: relative;
                height: 400px;
                width: 100%;
            }

            .modern-chart-container canvas {
                width: 100% !important;
                height: 100% !important;
            }

            .modern-table-section {
                flex-shrink: 0;
                min-height: 300px;
                background: white;
                border-radius: 12px;
                border: 1px solid #e5e7eb;
                padding: 20px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }

            .modern-table-header {
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 1.1rem;
                font-weight: 600;
                color: #111827;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 2px solid #4caf50;
            }

            .modern-table-header i {
                color: #4caf50;
            }

            .modern-table-container {
                max-height: 400px;
                overflow-y: auto;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
            }

            .modern-table {
                width: 100%;
                border-collapse: collapse;
                min-width: 600px;
            }

            .modern-table thead {
                background: #f3f4f6;
                position: sticky;
                top: 0;
                z-index: 10;
            }

            .modern-table th {
                padding: 15px 20px;
                text-align: left;
                font-weight: 600;
                color: #374151;
                font-size: 0.9rem;
                border-bottom: 2px solid #e5e7eb;
                white-space: nowrap;
                background: linear-gradient(135deg, #2e7d32, #4caf50 100%);
                color: white;
            }

            .modern-table td {
                padding: 12px 20px;
                border-bottom: 1px solid #f3f4f6;
                color: #4b5563;
            }

            .modern-table tbody tr:hover {
                background: #f9fafb;
            }

            .modern-table tbody tr:last-child td {
                border-bottom: none;
            }

            /* Estilos para filtros modernos verdes */
            .modern-filters-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 15px;
                margin-bottom: 20px;
            }

            .modern-filter-group {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .modern-filter-label {
                font-size: 0.9rem;
                font-weight: 500;
                color: #4b5563;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .modern-filter-label i {
                color: #6b7280;
                font-size: 0.8rem;
            }

            .modern-filter-input {
                padding: 10px 14px;
                border: 2px solid #d1d5db;
                border-radius: 8px;
                font-size: 0.9rem;
                transition: all 0.3s ease;
                background: white;
            }

            .modern-filter-input:focus {
                outline: none;
                border-color: #4caf50;
                box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
            }

            .modern-filter-select {
                padding: 10px 14px;
                border: 2px solid #d1d5db;
                border-radius: 8px;
                font-size: 0.9rem;
                transition: all 0.3s ease;
                background: white;
                cursor: pointer;
            }

            .modern-filter-select:focus {
                outline: none;
                border-color: #4caf50;
                box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
            }

            .modern-filters-actions {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                padding-top: 15px;
                border-top: 1px solid #e5e7eb;
            }

            .modern-filter-btn {
                padding: 10px 20px;
                border-radius: 8px;
                font-size: 0.9rem;
                font-weight: 500;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.3s ease;
                border: none;
            }

            .modern-filter-btn-primary {
                background: linear-gradient(135deg, #2e7d32, #4caf50 100%);
                color: white;
            }

            .modern-filter-btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 20px rgba(16, 185, 129, 0.2);
            }

            .modern-filter-btn-secondary {
                background: #f3f4f6;
                color: #4b5563;
            }

            .modern-filter-btn-secondary:hover {
                background: #e5e7eb;
            }

            /* Animaciones */
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(30px) scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            /* Scrollbar personalizado VERDE */
            .modern-modal-scrollable::-webkit-scrollbar {
                width: 8px;
            }

            .modern-modal-scrollable::-webkit-scrollbar-track {
                background: #f1f5f9;
                border-radius: 4px;
            }

            .modern-modal-scrollable::-webkit-scrollbar-thumb {
                background: linear-gradient(135deg, #2e7d32, #4caf50 100%);
                border-radius: 4px;
            }

            .modern-modal-scrollable::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(135deg, #2e7d32, #4caf50 100%);
            }

            .modern-table-container::-webkit-scrollbar {
                width: 6px;
                height: 6px;
            }

            .modern-table-container::-webkit-scrollbar-track {
                background: #f3f4f6;
                border-radius: 3px;
            }

            .modern-table-container::-webkit-scrollbar-thumb {
                background: linear-gradient(135deg, #2e7d32, #4caf50 100%);
                border-radius: 3px;
            }

            .modern-table-container::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(135deg, #2e7d32, #4caf50 100%);
            }

            /* Responsive */
            @media (max-width: 768px) {
                .modern-modal {
                    width: 95%;
                    margin: 5% auto;
                    max-height: 95vh;
                }

                .modern-modal-scrollable {
                    padding: 15px;
                    gap: 20px;
                }

                .modern-chart-section {
                    min-height: 350px;
                    padding: 15px;
                }

                .modern-chart-container {
                    height: 350px;
                }

                .modern-table-section {
                    min-height: 250px;
                    padding: 15px;
                }

                .modern-filters-grid {
                    grid-template-columns: 1fr;
                }

                .modern-filters-actions {
                    flex-direction: column;
                }

                .modern-filter-btn {
                    width: 100%;
                    justify-content: center;
                }

                .modern-table {
                    min-width: unset;
                }
            }

            /* Clases específicas para mejorar visualización en móviles */
            @media (max-width: 480px) {
                .modern-modal-header {
                    padding: 15px 20px;
                }

                .modern-modal-filters {
                    padding: 15px 20px;
                }

                .modern-modal-title {
                    font-size: 1.2rem;
                }

                .modern-chart-container {
                    height: 300px;
                }

                .modern-table th,
                .modern-table td {
                    padding: 10px 12px;
                    font-size: 0.85rem;
                }
            }
        `;
        document.head.appendChild(style);
    }

    configurarEventosModal() {
        const modal = document.getElementById("chartModal");
        const closeBtn = modal.querySelector(".close");
        
        closeBtn.onclick = () => {
            modal.classList.remove("show");
        }

        window.onclick = (event) => {
            if (event.target == modal) {
                modal.classList.remove("show");
            }
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('show')) {
                modal.classList.remove('show');
            }
        });
    }

    // MÉTODO PARA INICIALIZAR GRÁFICAS (EXACTO A TU VERSIÓN ORIGINAL)
    inicializarGraficas() {
        console.log('🔄 Inicializando gráficas...');
        
        const tipoInicial = 'tipo_reserva';
        
        if (this.chartManager && typeof this.chartManager.mostrarGraficas === 'function') {
            console.log('📊 Usando ChartManager interno');
            this.chartManager.mostrarGraficas(tipoInicial);
            
            // Ocultar loading y mostrar gráficas
            setTimeout(() => {
                const loadingState = document.getElementById('loading-state');
                const chartsContainer = document.getElementById('charts-container');
                if (loadingState) loadingState.style.display = 'none';
                if (chartsContainer) chartsContainer.style.display = 'grid';
            }, 500);
            
        } else if (typeof chartManager !== 'undefined' && typeof chartManager.mostrarGraficas === 'function') {
            console.log('📊 Usando ChartManager global');
            chartManager.mostrarGraficas(tipoInicial);
            
            setTimeout(() => {
                const loadingState = document.getElementById('loading-state');
                const chartsContainer = document.getElementById('charts-container');
                if (loadingState) loadingState.style.display = 'none';
                if (chartsContainer) chartsContainer.style.display = 'grid';
            }, 500);
            
        } else {
            console.error('❌ No hay ChartManager disponible');
            
            // Mostrar error
            const loadingState = document.getElementById('loading-state');
            if (loadingState) {
                loadingState.innerHTML = `
                    <div style="color: #e74c3c;">
                        <i class="fas fa-exclamation-triangle fa-2x"></i>
                        <p style="margin-top: 15px;">Error: No se pudo cargar el gestor de gráficas</p>
                        <button onclick="location.reload()" style="margin-top: 10px; padding: 8px 16px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            Reintentar
                        </button>
                    </div>
                `;
            }
        }
        
        // Configurar eventos después de inicializar gráficas
        this.configurarEventos();
    }

    configurarEventos() {
        console.log('🎯 Configurando eventos de UI...');
        
        // Botones de tipo de gráfica
        const chartButtons = document.querySelectorAll('.chart-btn');
        if (chartButtons.length > 0) {
            chartButtons.forEach(btn => {
                // Remover event listeners anteriores para evitar duplicados
                btn.replaceWith(btn.cloneNode(true));
            });

            // Re-seleccionar después del clone
            document.querySelectorAll('.chart-btn').forEach(btn => {
                btn.addEventListener('click', (event) => {
                    event.preventDefault();
                    
                    // Remover clase active de todos los botones
                    chartButtons.forEach(b => b.classList.remove('active'));
                    // Agregar clase active al botón clickeado
                    event.currentTarget.classList.add('active');
                    
                    const tipo = event.currentTarget.getAttribute('data-type');
                    console.log('🎯 Cambiando a categoría:', tipo);

                    if (this.chartManager && typeof this.chartManager.mostrarGraficas === 'function') {
                        console.log('📊 Llamando a chartManager.mostrarGraficas');
                        this.chartManager.mostrarGraficas(tipo);
                    } else if (typeof chartManager !== 'undefined' && typeof chartManager.mostrarGraficas === 'function') {
                        console.log('📊 Llamando a chartManager global');
                        chartManager.mostrarGraficas(tipo);
                    } else {
                        console.error('❌ No hay ChartManager disponible');
                    }
                });
            });
        }

        // Botón de descarga
        const downloadBtn = document.getElementById('downloadChartBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                this.descargarGraficoPrincipal();
            });
        }

        // Cards de gráficas
        const cardBarras = document.getElementById('chart-card-barras');
        const cardCircular = document.getElementById('chart-card-circular');
        
        if (cardBarras) {
            cardBarras.addEventListener('click', () => this.abrirModal('bar'));
        }
        if (cardCircular) {
            cardCircular.addEventListener('click', () => this.abrirModal('pie'));
        }
        
        console.log('✅ Eventos de UI configurados correctamente');
    }

    abrirModal(tipoGrafica) {
        const modal = document.getElementById("chartModal");
        if (!modal) return;
        
        modal.classList.add("show");

        // Guardar tipo de gráfica
        const modalChartContainer = document.querySelector('.modern-chart-container');
        if (modalChartContainer) {
            modalChartContainer.setAttribute('data-tipo-grafica', tipoGrafica);
        }

        // LIMPIEZA COMPLETA: Eliminar cualquier sección de filtros duplicada
        this.limpiarFiltrosDuplicados();

        // Crear filtros del modal según el tipo de categoría
        this.crearFiltrosModal();

        // Crear gráfica inicial
        this.actualizarGraficaModal(tipoGrafica);
    }

    limpiarFiltrosDuplicados() {
        // Eliminar cualquier sección de filtros que no sea la principal
        const seccionesFiltros = document.querySelectorAll('#modalFiltersContainer, .filters-section, [class*="filtro"], [class*="filter"]');
        seccionesFiltros.forEach(seccion => {
            if (seccion.id !== 'modalFiltersContainer' && seccion.closest('.modern-modal')) {
                seccion.remove();
            }
        });
    }

    crearFiltrosModal() {
        const modalFiltersContainer = document.getElementById('modalFiltersContainer');
        if (!modalFiltersContainer) return;
        
        // Eliminar filtros anteriores si existen
        modalFiltersContainer.innerHTML = '';
        
        const tipoActual = this.chartManager ? this.chartManager.tipoActual : 'tipo_reserva';
        
        let filtrosHTML = '';
        
        if (tipoActual === 'tipo_reserva') {
            filtrosHTML = `
                <div class="modern-filters-grid">
                    <div class="modern-filter-group">
                        <label class="modern-filter-label">
                            <i class="far fa-calendar"></i> Fecha Inicial
                        </label>
                        <input type="date" class="modern-filter-input" id="modal-filtro-fecha-inicio">
                    </div>
                    <div class="modern-filter-group">
                        <label class="modern-filter-label">
                            <i class="far fa-calendar-check"></i> Fecha Final
                        </label>
                        <input type="date" class="modern-filter-input" id="modal-filtro-fecha-fin">
                    </div>
                    <div class="modern-filter-group">
                        <label class="modern-filter-label">
                            <i class="fas fa-ticket-alt"></i> Tipo de Reserva
                        </label>
                        <select class="modern-filter-select" id="modal-filtro-tipo-reserva">
                            <option value="">No seleccionado</option>
                            <option value="todas">Todas las reservas</option>
                            <option value="individual">Individual</option>
                            <option value="grupal">Grupal</option>
                        </select>
                    </div>
                    <div class="modern-filter-group">
                        <label class="modern-filter-label">
                            <i class="fas fa-check-circle"></i> Estado de Reserva
                        </label>
                        <select class="modern-filter-select" id="modal-filtro-estado">
                            <option value="">No seleccionado</option>
                            <option value="todas">Todos los estados</option>
                            <option value="confirmada">Confirmadas</option>
                            <option value="pendiente">Pendientes</option>
                            <option value="cancelada">Canceladas</option>
                        </select>
                    </div>
                </div>
            `;
        
        } else if (['fecha', 'mes', 'anio'].includes(tipoActual)) {
            filtrosHTML = `
                <div class="modern-filters-grid">
                    <div class="modern-filter-group">
                        <label class="modern-filter-label">
                            <i class="far fa-calendar"></i> Fecha Inicial
                        </label>
                        <input type="date" class="modern-filter-input" id="modal-filtro-fecha-inicio">
                    </div>
                    <div class="modern-filter-group">
                        <label class="modern-filter-label">
                            <i class="far fa-calendar-check"></i> Fecha Final
                        </label>
                        <input type="date" class="modern-filter-input" id="modal-filtro-fecha-fin">
                    </div>
                    <div class="modern-filter-group">
                        <label class="modern-filter-label">
                            <i class="fas fa-ticket-alt"></i> Tipo de Reserva
                        </label>
                        <select class="modern-filter-select" id="modal-filtro-tipo-reserva">
                            <option value="">No seleccionado</option>
                            <option value="todas">Todas las reservas</option>
                            <option value="individual">Individual</option>
                            <option value="grupal">Grupal</option>
                        </select>
                    </div>
                    <div class="modern-filter-group">
                        <label class="modern-filter-label">
                            <i class="fas fa-check-circle"></i> Estado de Reserva
                        </label>
                        <select class="modern-filter-select" id="modal-filtro-estado">
                            <option value="">No seleccionado</option>
                            <option value="todas">Todos los estados</option>
                            <option value="confirmada">Confirmadas</option>
                            <option value="pendiente">Pendientes</option>
                            <option value="cancelada">Canceladas</option>
                        </select>
                    </div>
                </div>
            `;
        } else {
            // Filtros básicos para otras categorías
            filtrosHTML = `
                <div class="modern-filters-grid">
                    <div class="modern-filter-group">
                        <label class="modern-filter-label">
                            <i class="far fa-calendar"></i> Fecha Inicial
                        </label>
                        <input type="date" class="modern-filter-input" id="modal-filtro-fecha-inicio">
                    </div>
                    <div class="modern-filter-group">
                        <label class="modern-filter-label">
                            <i class="far fa-calendar-check"></i> Fecha Final
                        </label>
                        <input type="date" class="modern-filter-input" id="modal-filtro-fecha-fin">
                    </div>
                </div>
            `;
        }

        // Agregar botones de acción
        filtrosHTML += `
            <div class="modern-filters-actions">
                <button class="modern-filter-btn modern-filter-btn-secondary" id="limpiar-filtros-modal-btn">
                    <i class="fas fa-broom"></i> Limpiar Filtros
                </button>
                <button class="modern-filter-btn modern-filter-btn-primary" id="aplicar-filtros-modal-btn">
                    <i class="fas fa-check"></i> Aplicar Filtros
                </button>
            </div>
        `;

        modalFiltersContainer.innerHTML = filtrosHTML;
        
        // Configurar eventos de los botones del modal (MISMA LÓGICA ORIGINAL)
        const btnAplicar = document.getElementById('aplicar-filtros-modal-btn');
        const btnLimpiar = document.getElementById('limpiar-filtros-modal-btn');
        
        if (btnAplicar) {
            btnAplicar.addEventListener('click', () => {
                this.aplicarFiltrosModal();
            });
        }
        
        if (btnLimpiar) {
            btnLimpiar.addEventListener('click', () => {
                this.limpiarFiltrosModal();
            });
        }

        // Configurar eventos para filtros que actualizan automáticamente
        if (tipoActual === 'tipo_reserva' || tipoActual === 'actividad') {
            const estadoSelect = document.getElementById('modal-filtro-estado');
            const actividadSelect = document.getElementById('modal-filtro-actividad');
            
            if (estadoSelect) {
                estadoSelect.addEventListener('change', () => {
                    this.actualizarGraficaModalDesdeFiltros();
                });
            }
            
            if (actividadSelect) {
                actividadSelect.addEventListener('change', () => {
                    this.actualizarGraficaModalDesdeFiltros();
                });
            }
        }

        // Inicializar fechas
        this.inicializarFechasModal();

        // Cargar actividades dinámicamente si es el caso
        if (tipoActual === 'actividad') {
            this.cargarActividadesEnFiltro();
        }
        
        // Cargar instituciones dinámicamente si es el caso
        if (tipoActual === 'institucion') {
            this.cargarInstitucionesEnFiltro();
        }
    }

    inicializarFechasModal() {
        const hoy = new Date();
        const haceUnMes = new Date();
        haceUnMes.setMonth(hoy.getMonth() - 1);
        
        const formatoFecha = (fecha) => fecha.toISOString().split('T')[0];
        
        const fechaInicio = document.getElementById('modal-filtro-fecha-inicio');
        const fechaFin = document.getElementById('modal-filtro-fecha-fin');
        
        if (fechaInicio) fechaInicio.value = formatoFecha(haceUnMes);
        if (fechaFin) fechaFin.value = formatoFecha(hoy);
    }

    // A PARTIR DE AQUÍ, TODO EL RESTO DEL CÓDIGO ES EXACTAMENTE IGUAL A TU VERSIÓN ORIGINAL
    // Solo he mejorado la presentación visual, la funcionalidad es idéntica

    aplicarFiltrosModal() {
        const tipoActual = this.chartManager ? this.chartManager.tipoActual : 'tipo_reserva';
        
        // Obtener valores de filtros
        const fechaInicio = document.getElementById('modal-filtro-fecha-inicio')?.value;
        const fechaFin = document.getElementById('modal-filtro-fecha-fin')?.value;
        const tipoReserva = document.getElementById('modal-filtro-tipo-reserva')?.value;
        const estado = document.getElementById('modal-filtro-estado')?.value;
        
        // Validaciones básicas
        if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Error en fechas',
                    text: 'La fecha inicial no puede ser mayor que la fecha final',
                    confirmButtonColor: '#e74c3c'
                });
            }
            return;
        }
        
        const filtros = {
            fechaInicio: fechaInicio,
            fechaFin: fechaFin,
            tipoReserva: tipoReserva || '',
            estado: estado || ''
        };
        
        // Redirigir según el tipo
        if (tipoActual === 'tipo_reserva') {
            this.aplicarFiltrosTipoReserva(filtros);
        } else if (tipoActual === 'actividad') {
            this.aplicarFiltrosActividad(filtros);
        } else if (['fecha', 'mes', 'anio'].includes(tipoActual)) {
            this.aplicarFiltrosTiempo(tipoActual, filtros);
        } else {
            // Para otras categorías, usar filtros básicos de fecha
            if (this.dataLoader) {
                this.dataLoader.aplicarFiltrosCombinados(
                    filtros.fechaInicio, 
                    filtros.fechaFin,
                    filtros.tipoReserva,
                    filtros.estado
                );
            } else if (typeof dataLoader !== 'undefined') {
                dataLoader.aplicarFiltrosCombinados(
                    filtros.fechaInicio, 
                    filtros.fechaFin,
                    filtros.tipoReserva,
                    filtros.estado
                );
            }
        }
    }

    async aplicarFiltrosTipoReserva(filtros) {
        try {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: 'Aplicando filtros...',
                    text: 'Filtrando datos por criterios seleccionados',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });
            }

            console.log('🎯 Aplicando filtros para tipo_reserva:', filtros);

            let query = supabase
                .from('participantes_reserva')
                .select(`
                    *,
                    reservas(
                        *,
                        actividades(*),
                        instituciones(*)
                    ),
                    intereses(*)
                `);

            // Aplicar filtros de fecha
            if (filtros.fechaInicio && filtros.fechaFin) {
                query = query.gte('reservas.fecha_reserva', filtros.fechaInicio + 'T00:00:00')
                            .lte('reservas.fecha_reserva', filtros.fechaFin + 'T23:59:59');
            }

            // Aplicar filtro de tipo de reserva (solo si no está vacío)
            if (filtros.tipoReserva && filtros.tipoReserva !== '') {
                if (filtros.tipoReserva !== 'todas') {
                    query = query.eq('reservas.tipo_reserva', filtros.tipoReserva);
                }
            }

            // Aplicar filtro de estado (solo si no está vacío)
            if (filtros.estado && filtros.estado !== '') {
                if (filtros.estado !== 'todas') {
                    query = query.eq('reservas.estado', filtros.estado);
                }
            }

            const { data: participantesFiltrados, error } = await query;

            if (error) throw error;

            if (typeof Swal !== 'undefined') {
                Swal.close();
            }

            if (participantesFiltrados && participantesFiltrados.length > 0) {
                // Procesar datos filtrados con información de los filtros aplicados
                if (this.dataProcessor) {
                    console.log("RESULTADO QUERY", participantesFiltrados.map(x => x.reservas.estado))
                    this.dataProcessor.procesarDatosConFiltros(participantesFiltrados, filtros);
                    
                    // Actualizar gráfica en el modal
                    const tipoGrafica = document.querySelector('.modern-chart-container')?.getAttribute('data-tipo-grafica') || 'bar';
                    this.actualizarGraficaModalConFiltros(tipoGrafica, filtros);

                    if (typeof Swal !== 'undefined') {
                        const reservasUnicas = [...new Set(participantesFiltrados.map(p => p.id_reserva))].length;
                        Swal.fire({
                            icon: 'success',
                            title: 'Filtros aplicados',
                            text: `Se encontraron ${reservasUnicas} reservas y ${participantesFiltrados.length} participantes`,
                            timer: 2000,
                            showConfirmButton: false
                        });
                    }
                } else {
                    console.warn('procesarDatosConFiltros no disponible, usando procesamiento normal');
                    if (this.dataProcessor) {
                        this.dataProcessor.procesarDatosCompletos(participantesFiltrados);
                        
                        const tipoGrafica = document.querySelector('.modern-chart-container')?.getAttribute('data-tipo-grafica') || 'bar';
                        this.actualizarGraficaModalConFiltros(tipoGrafica, filtros);
                    }
                }
            } else {
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'info',
                        title: 'Sin resultados',
                        text: 'No se encontraron datos para los filtros aplicados',
                        confirmButtonColor: '#3498db'
                    });
                }
            }

        } catch (error) {
            console.error('Error aplicando filtros:', error);
            if (typeof Swal !== 'undefined') {
                Swal.close();
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudieron aplicar los filtros: ' + error.message,
                    confirmButtonColor: '#e74c3c'
                });
            }
        }
    }

    async aplicarFiltrosTiempo(tipo, filtros) {
        try {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: 'Aplicando filtros...',
                    text: `Filtrando datos por ${tipo}`,
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });
            }

            console.log(`🎯 Aplicando filtros para ${tipo}:`, filtros);

            let query = supabase
                .from('participantes_reserva')
                .select(`
                    *,
                    reservas(
                        *,
                        actividades(*),
                        instituciones(*)
                    ),
                    intereses(*)
                `);

            // Aplicar filtros de fecha
            if (filtros.fechaInicio && filtros.fechaFin) {
                query = query.gte('reservas.fecha_reserva', filtros.fechaInicio + 'T00:00:00')
                            .lte('reservas.fecha_reserva', filtros.fechaFin + 'T23:59:59');
            }

            // Aplicar filtro de tipo de reserva
            if (filtros.tipoReserva && filtros.tipoReserva !== '') {
                if (filtros.tipoReserva !== 'todas') {
                    query = query.eq('reservas.tipo_reserva', filtros.tipoReserva);
                }
            }

            // Aplicar filtro de estado
            if (filtros.estado && filtros.estado !== '') {
                if (filtros.estado !== 'todas') {
                    query = query.eq('reservas.estado', filtros.estado);
                }
            }

            const { data: participantesFiltrados, error } = await query;

            if (error) throw error;

            if (typeof Swal !== 'undefined') {
                Swal.close();
            }

            if (participantesFiltrados && participantesFiltrados.length > 0) {
                // Procesar datos con el timeProcessor - USAR MÉTODOS AGRUPADOS
                let datosProcesados;
                
                switch(tipo) {
                    case 'fecha':
                        datosProcesados = window.timeProcessor.procesarPorFechaAgrupado(participantesFiltrados);
                        break;
                    case 'mes':
                        datosProcesados = window.timeProcessor.procesarPorMesAgrupado(participantesFiltrados);
                        break;
                    case 'anio':
                        datosProcesados = window.timeProcessor.procesarPorAnioAgrupado(participantesFiltrados);
                        break;
                }

                console.log(`✅ Datos ${tipo} procesados:`, datosProcesados);

                // Verificar si los datos son agrupados
                const esGraficaAgrupada = datosProcesados.datasets && datosProcesados.datasets.length > 0;

                // Actualizar datos en el dataProcessor
                if (this.dataProcessor && datosProcesados) {
                    this.dataProcessor.datosSimulados[tipo] = datosProcesados;
                    
                    // NOTIFICAR AL CHART-MANAGER QUE LOS DATOS CAMBIARON
                    if (this.chartManager) {
                        if (esGraficaAgrupada) {
                            this.chartManager.mostrarGraficasAgrupadas(tipo, datosProcesados);
                        } else {
                            this.chartManager.mostrarGraficas(tipo);
                        }
                    }
                    
                    // Actualizar gráfica en el modal
                    const tipoGrafica = document.querySelector('.modern-chart-container')?.getAttribute('data-tipo-grafica') || 'bar';
                    
                    if (esGraficaAgrupada) {
                        this.actualizarGraficaModalTiempoAgrupada(tipo, tipoGrafica, datosProcesados);
                    } else {
                        if (this.actualizarGraficaModalTiempo) {
                            this.actualizarGraficaModalTiempo(tipo, tipoGrafica, datosProcesados);
                        } else {
                            this.actualizarGraficaModal(tipoGrafica);
                        }
                    }

                    if (typeof Swal !== 'undefined') {
                        Swal.fire({
                            icon: 'success',
                            title: 'Filtros aplicados',
                            text: `Se encontraron ${participantesFiltrados.length} participantes`,
                            timer: 2000,
                            showConfirmButton: false
                        });
                    }
                }
            } else {
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'info',
                        title: 'Sin resultados',
                        text: 'No se encontraron datos para los filtros aplicados',
                        confirmButtonColor: '#3498db'
                    });
                }
            }

        } catch (error) {
            console.error(`Error aplicando filtros de ${tipo}:`, error);
            if (typeof Swal !== 'undefined') {
                Swal.close();
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudieron aplicar los filtros: ' + error.message,
                    confirmButtonColor: '#e74c3c'
                });
            }
        }
    }

    async aplicarFiltrosActividad(filtros) {
        try {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: 'Aplicando filtros...',
                    text: 'Filtrando datos de actividades por criterios seleccionados',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });
            }

            console.log('🎯 Aplicando filtros para actividad:', filtros);

            let query = supabase
                .from('participantes_reserva')
                .select(`
                    *,
                    reservas(
                        *,
                        actividades(*),
                        instituciones(*)
                    ),
                    intereses(*)
                `);

            // Aplicar filtros de fecha
            if (filtros.fechaInicio && filtros.fechaFin) {
                query = query.gte('reservas.fecha_reserva', filtros.fechaInicio + 'T00:00:00')
                            .lte('reservas.fecha_reserva', filtros.fechaFin + 'T23:59:59');
            }

            // Aplicar filtro de estado (solo si no está vacío)
            if (filtros.estado && filtros.estado !== '') {
                if (filtros.estado !== 'todas') {
                    query = query.eq('reservas.estado', filtros.estado);
                }
            }

            // Aplicar filtro de actividad específica
            if (filtros.actividad && filtros.actividad !== '') {
                if (filtros.actividad !== 'todas') {
                    query = query.eq('reservas.id_actividad', filtros.actividad);
                }
            }

            const { data: participantesFiltrados, error } = await query;

            if (error) throw error;

            if (typeof Swal !== 'undefined') {
                Swal.close();
            }

            if (participantesFiltrados && participantesFiltrados.length > 0) {
                // Procesar datos filtrados
                if (this.dataProcessor) {
                    this.dataProcessor.procesarDatosCompletos(participantesFiltrados);
                    
                    // Actualizar gráfica en el modal
                    const tipoGrafica = document.querySelector('.modern-chart-container')?.getAttribute('data-tipo-grafica') || 'bar';
                    this.actualizarGraficaModalConFiltros(tipoGrafica, filtros);

                    if (typeof Swal !== 'undefined') {
                        const actividadesUnicas = [...new Set(participantesFiltrados.map(p => p.reservas?.id_actividad))].length;
                        Swal.fire({
                            icon: 'success',
                            title: 'Filtros aplicados',
                            text: `Se encontraron ${actividadesUnicas} actividades y ${participantesFiltrados.length} participantes`,
                            timer: 2000,
                            showConfirmButton: false
                        });
                    }
                }
            } else {
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'info',
                        title: 'Sin resultados',
                        text: 'No se encontraron datos para los filtros aplicados',
                        confirmButtonColor: '#3498db'
                    });
                }
            }

        } catch (error) {
            console.error('Error aplicando filtros de actividad:', error);
            if (typeof Swal !== 'undefined') {
                Swal.close();
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudieron aplicar los filtros: ' + error.message,
                    confirmButtonColor: '#e74c3c'
                });
            }
        }
    }

    // ... (TODO EL RESTO DE TUS MÉTODOS ORIGINALES SE MANTIENEN IGUAL) ...
    // Solo cambia el selector de clases para que apunten a las nuevas clases CSS

    actualizarGraficaModal(tipoGrafica) {
        // Versión simple sin filtros para cuando no hay filtros aplicados
        this.actualizarGraficaModalConFiltros(tipoGrafica, {});
    }

    actualizarGraficaModalConFiltros(tipoGrafica, filtros) {
        const canvas = document.getElementById("chartAmpliado");
        if (!canvas) return;
        
        const ctx = canvas.getContext("2d");
        
        const manager = this.chartManager;
        const processor = this.dataProcessor;
        
        if (!manager || !processor) {
            console.error('❌ Módulos necesarios no disponibles para modal');
            return;
        }
        
        // Obtener datos procesados con filtros
        const datos = processor.datosSimulados[manager.tipoActual];
        
        if (!datos) {
            console.error('❌ No hay datos para:', manager.tipoActual);
            return;
        }

        // Destruir gráfica anterior si existe
        if (manager.chartAmpliado) {
            manager.chartAmpliado.destroy();
        }

        // Generar título descriptivo basado en los filtros aplicados
        const tituloDescriptivo = this.generarTituloConFiltros(manager.tipoActual, filtros);
        const etiquetaDescriptiva = this.generarEtiquetaConFiltros(manager.tipoActual, filtros);

        // Actualizar título del modal
        const modalTitle = document.getElementById("modalTitle");
        if (modalTitle) {
            modalTitle.innerHTML = tituloDescriptivo;
        }

        // Verificar si es una gráfica agrupada
        const esGraficaAgrupada = datos.datasets && datos.type === 'grouped';

        let chartData;
        let chartOptions;

        if (esGraficaAgrupada) {
            // GRÁFICA AGRUPADA - Múltiples datasets
            chartData = {
                labels: datos.labels,
                datasets: datos.datasets.map(dataset => ({
                    ...dataset,
                    borderRadius: tipoGrafica === "bar" ? 6 : 0,
                    borderWidth: tipoGrafica === "bar" ? 0 : 2,
                    borderColor: tipoGrafica === "bar" ? 'transparent' : '#fff',
                    barThickness: tipoGrafica === "bar" ? 18 : undefined,
                    maxBarThickness: tipoGrafica === "bar" ? 30 : undefined,
                    barPercentage: tipoGrafica === "bar" ? 0.6 : undefined
                }))
            };

            chartOptions = this.obtenerOpcionesGraficaAgrupada(tipoGrafica, tituloDescriptivo, etiquetaDescriptiva, filtros);
        } else {
            // GRÁFICA SIMPLE - Un solo dataset
            const labels = datos.labels || [];
            const values = datos.values || [];
            const total = values.reduce((a, b) => a + b, 0);
            const colors = manager.generarColores(manager.tipoActual, labels);

            chartData = {
                labels: labels,
                datasets: [
                    {
                        label: this.generarLabelDataset(filtros),
                        data: values,
                        backgroundColor: colors,
                        borderRadius: tipoGrafica === "bar" ? 6 : 0,
                        borderWidth: tipoGrafica === "bar" ? 0 : 2,
                        borderColor: tipoGrafica === "bar" ? 'transparent' : '#fff',
                        barThickness: tipoGrafica === "bar" ? 18 : undefined,
                        maxBarThickness: tipoGrafica === "bar" ? 30 : undefined,
                        barPercentage: tipoGrafica === "bar" ? 0.6 : undefined
                    },
                ],
            };

            chartOptions = this.obtenerOpcionesGraficaSimple(tipoGrafica, tituloDescriptivo, etiquetaDescriptiva, filtros, total);
        }

        // Crear nueva gráfica
        manager.chartAmpliado = new Chart(ctx, {
            type: tipoGrafica === "bar" ? "bar" : "doughnut",
            data: chartData,
            options: chartOptions
        });

        // Llenar tabla con porcentajes
        this.actualizarTablaConDatos(datos, filtros, esGraficaAgrupada);

        setTimeout(() => {
            if (manager.chartAmpliado) {
                manager.chartAmpliado.resize();
            }
        }, 200);
    }

    actualizarTablaConDatos(datos, filtros, esGraficaAgrupada) {
        const tbody = document.querySelector("#tablaDatos");
        const thead = document.querySelector("#tablaHeader");
        
        if (!tbody || !thead) return;

        let tablaHTML = '';
        let headerHTML = '';

        if (esGraficaAgrupada) {
            // Cabecera para gráfica agrupada
            headerHTML = `
                <th>Categoría</th>
                ${datos.datasets.map(dataset => `<th>${dataset.label}</th>`).join('')}
                <th>Total</th>
                <th>Porcentaje</th>
            `;

            // Calcular totales
            const totales = {};
            datos.datasets.forEach(dataset => {
                dataset.data.forEach((valor, index) => {
                    const label = datos.labels[index];
                    if (!totales[label]) totales[label] = 0;
                    totales[label] += valor;
                });
            });

            const totalGeneral = Object.values(totales).reduce((a, b) => a + b, 0);

            // Filas de datos
            datos.labels.forEach((label, index) => {
                let filaHTML = '';
                let subtotal = 0;

                // Filas para cada dataset
                datos.datasets.forEach(dataset => {
                    const valor = dataset.data[index] || 0;
                    subtotal += valor;
                    const porcentaje = totalGeneral > 0 ? ((valor / totalGeneral) * 100).toFixed(1) : '0.0';
                    
                    filaHTML += `<tr>
                        <td><strong>${label} - ${dataset.label}</strong></td>
                        <td style="text-align: center;">${valor.toLocaleString()}</td>
                        <td style="text-align: center; font-weight: bold">${subtotal.toLocaleString()}</td>
                        <td style="text-align: center; color: #2e7d32; font-weight: bold">${porcentaje}%</td>
                    </tr>`;
                });
                
                tablaHTML += filaHTML;
            });

            // Fila de total general
            const porcentajeTotal = '100%';
            tablaHTML += `<tr style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%);">
                <td><strong>TOTAL GENERAL</strong></td>
                <td style="text-align: center; font-weight: bold" colspan="2">${totalGeneral.toLocaleString()}</td>
                <td style="text-align: center; color: #2e7d32; font-weight: bold">${porcentajeTotal}</td>
            </tr>`;

        } else {
            // Gráfica simple
            const labels = datos.labels || [];
            const values = datos.values || [];
            const total = values.reduce((a, b) => a + b, 0);

            headerHTML = `
                <th>Categoría</th>
                <th>Cantidad</th>
                <th>Porcentaje</th>
            `;

            tablaHTML = labels.map((label, i) => {
                const valor = values[i] || 0;
                const porcentaje = total > 0 ? ((valor / total) * 100).toFixed(1) : '0.0';
                return `<tr>
                    <td><strong>${label}</strong></td>
                    <td style="text-align: center; font-weight: bold">${valor.toLocaleString()}</td>
                    <td style="text-align: center; color: #2e7d32; font-weight: bold">${porcentaje}%</td>
                </tr>`;
            }).join("");

            // Fila de total
            if (total > 0) {
                tablaHTML += `<tr style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%);">
                    <td><strong>TOTAL</strong></td>
                    <td style="text-align: center; font-weight: bold">${total.toLocaleString()}</td>
                    <td style="text-align: center; color: #2e7d32; font-weight: bold">100%</td>
                </tr>`;
            }
        }

        thead.innerHTML = headerHTML;
        tbody.innerHTML = tablaHTML;
    }

    // ... (MANTENER TODOS LOS DEMÁS MÉTODOS EXACTAMENTE IGUAL) ...

    descargarGraficoPrincipal() {
        const canvas = document.getElementById("chartBar");
        if (!canvas) return;
        
        const link = document.createElement("a");
        link.download = "grafica_principal.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
    }

    // Mantener todos los métodos auxiliares exactamente igual
    generarTituloConFiltros(tipo, filtros) {
        let tituloBase = '';
        
        if (tipo === 'tipo_reserva') {
            tituloBase = 'Reservas por Tipo';
        } else if (tipo === 'actividad') {
            tituloBase = 'Reservas por Actividad';
        } else {
            tituloBase = 'Reservas';
        }
        
        const partes = [];
        
        if (tipo === 'tipo_reserva' && filtros.tipoReserva && filtros.tipoReserva !== '') {
            if (filtros.tipoReserva === 'todas') {
                partes.push('Todos los tipos');
            } else {
                partes.push(filtros.tipoReserva === 'individual' ? 'Individuales' : 'Grupales');
            }
        }
        
        if (tipo === 'actividad' && filtros.actividad && filtros.actividad !== '') {
            if (filtros.actividad === 'todas') {
                partes.push('Todas las actividades');
            } else {
                partes.push('Actividad específica');
            }
        }
        
        if (filtros.estado && filtros.estado !== '') {
            if (filtros.estado === 'todas') {
                partes.push('todos los estados');
            } else {
                partes.push(filtros.estado);
            }
        }
        
        if (partes.length > 0) {
            return `${tituloBase} - ${partes.join(' / ')}`;
        }
        
        return tituloBase;
    }

    generarEtiquetaConFiltros(tipo, filtros) {
        if (tipo === 'tipo_reserva') {
            if (filtros.estado && filtros.estado !== '' && filtros.estado !== 'todas') {
                return `Tipo de Reserva (Estado: ${filtros.estado})`;
            }
            return 'Tipo de Reserva';
        } else if (tipo === 'actividad') {
            if (filtros.estado && filtros.estado !== '' && filtros.estado !== 'todas') {
                return `Actividad (Estado: ${filtros.estado})`;
            }
            return 'Actividad';
        }
        return 'Categoría';
    }

    generarLabelDataset(filtros) {
        if (filtros.estado && filtros.estado !== '' && filtros.estado !== 'todas') {
            return `Reservas ${filtros.estado}`;
        }
        return 'Total de Reservas';
    }

    generarTituloEjeY(filtros) {
        if (filtros.estado && filtros.estado !== '' && filtros.estado !== 'todas') {
            return `Cantidad de Reservas ${filtros.estado}`;
        }
        return 'Cantidad de Reservas';
    }

    obtenerOpcionesGraficaAgrupada(tipoGrafica, tituloDescriptivo, etiquetaDescriptiva, filtros) {
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
                    text: tituloDescriptivo,
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
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            return `${label}: ${value.toLocaleString()} reservas`;
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
                        text: 'Cantidad de Reservas',
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
            cutout: tipoGrafica === "bar" ? '0%' : '40%'
        };
    }

    obtenerOpcionesGraficaSimple(tipoGrafica, tituloDescriptivo, etiquetaDescriptiva, filtros, total) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: tipoGrafica === "bar" ? 'top' : 'right',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: { size: 13 }
                    }
                },
                title: {
                    display: true,
                    text: tituloDescriptivo,
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
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${label}: ${value.toLocaleString()} ${filtros.estado && filtros.estado !== 'todas' ? filtros.estado : 'reservas'} (${percentage}%)`;
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
                        text: this.generarTituloEjeY(filtros),
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
            cutout: tipoGrafica === "bar" ? '0%' : '40%'
        };
    }

    // Mantener los demás métodos exactamente igual a tu versión original
    async cargarActividadesEnFiltro() {
        try {
            const actividadSelect = document.getElementById('modal-filtro-actividad');
            if (!actividadSelect) return;

            const { data: actividades, error } = await supabase
                .from('actividades')
                .select('id_actividad, nombre')
                .eq('activo', true)
                .order('nombre');

            if (error) throw error;

            while (actividadSelect.children.length > 2) {
                actividadSelect.removeChild(actividadSelect.lastChild);
            }

            if (actividades && actividades.length > 0) {
                actividades.forEach(actividad => {
                    const option = document.createElement('option');
                    option.value = actividad.id_actividad;
                    option.textContent = actividad.nombre;
                    actividadSelect.appendChild(option);
                });
            }

        } catch (error) {
            console.error('Error cargando actividades:', error);
        }
    }

    async cargarInstitucionesEnFiltro() {
        try {
            const institucionSelect = document.getElementById('modal-filtro-institucion');
            if (!institucionSelect) return;

            const { data: instituciones, error } = await supabase
                .from('instituciones')
                .select('id_institucion, nombre_institucion')
                .order('nombre_institucion');

            if (error) throw error;

            while (institucionSelect.children.length > 1) {
                institucionSelect.removeChild(institucionSelect.lastChild);
            }

            if (instituciones && instituciones.length > 0) {
                instituciones.forEach(institucion => {
                    const option = document.createElement('option');
                    option.value = institucion.id_institucion;
                    option.textContent = institucion.nombre_institucion;
                    institucionSelect.appendChild(option);
                });
            }

        } catch (error) {
            console.error('Error cargando instituciones:', error);
        }
    }

    limpiarFiltrosModal() {
        const tipoActual = this.chartManager ? this.chartManager.tipoActual : 'tipo_reserva';
        
        if (tipoActual === 'institucion') {
            const fechaInicio = document.getElementById('modal-filtro-fecha-inicio');
            const fechaFin = document.getElementById('modal-filtro-fecha-fin');
            const institucionSelect = document.getElementById('modal-filtro-institucion');
            const cantidadSelect = document.getElementById('modal-filtro-cantidad');
            const ordenSelect = document.getElementById('modal-filtro-orden');
            
            const hoy = new Date();
            const hace30Dias = new Date();
            hace30Dias.setDate(hoy.getDate() - 30);
            
            if (fechaInicio) fechaInicio.value = hace30Dias.toISOString().split('T')[0];
            if (fechaFin) fechaFin.value = hoy.toISOString().split('T')[0];
            if (institucionSelect) institucionSelect.value = 'todas';
            if (cantidadSelect) cantidadSelect.value = '10';
            if (ordenSelect) ordenSelect.value = 'desc';
            
            this.recargarDatosInstitucionSinFiltros();
            
        } else if (['fecha', 'mes', 'anio'].includes(tipoActual)) {
            const fechaInicio = document.getElementById('modal-filtro-fecha-inicio');
            const fechaFin = document.getElementById('modal-filtro-fecha-fin');
            const tipoReserva = document.getElementById('modal-filtro-tipo-reserva');
            const estado = document.getElementById('modal-filtro-estado');
            
            if (fechaInicio) fechaInicio.value = '';
            if (fechaFin) fechaFin.value = '';
            if (tipoReserva) tipoReserva.value = '';
            if (estado) estado.value = '';
            
            if (this.dataLoader) {
                this.dataLoader.cargarDatosVisitantes();
            }
        } else {
            const fechaInicio = document.getElementById('modal-filtro-fecha-inicio');
            const fechaFin = document.getElementById('modal-filtro-fecha-fin');
            const tipoReserva = document.getElementById('modal-filtro-tipo-reserva');
            const estado = document.getElementById('modal-filtro-estado');
            const actividad = document.getElementById('modal-filtro-actividad');
            
            if (fechaInicio) fechaInicio.value = '';
            if (fechaFin) fechaFin.value = '';
            if (tipoReserva) tipoReserva.value = '';
            if (estado) estado.value = '';
            if (actividad) actividad.value = '';
            
            if (this.dataLoader) {
                this.dataLoader.limpiarFiltros();
                this.dataLoader.cargarDatosVisitantes();
            }
        }
        
        const tipoGrafica = document.querySelector('.modern-chart-container')?.getAttribute('data-tipo-grafica') || 'bar';
        setTimeout(() => {
            this.actualizarGraficaModal(tipoGrafica);
        }, 500);
        
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'success',
                title: 'Filtros limpiados',
                text: 'Se muestran todos los datos disponibles',
                timer: 2000,
                showConfirmButton: false
            });
        }
    }

    async recargarDatosInstitucionSinFiltros() {
        try {
            if (this.dataLoader) {
                await this.dataLoader.cargarDatosVisitantes();
            }
        } catch (error) {
            console.error('Error recargando datos de institución:', error);
        }
    }

    actualizarGraficaModalDesdeFiltros() {
        const tipoActual = this.chartManager ? this.chartManager.tipoActual : 'tipo_reserva';
        
        if (tipoActual === 'tipo_reserva' || tipoActual === 'actividad') {
            const tipoGrafica = document.querySelector('.modern-chart-container')?.getAttribute('data-tipo-grafica') || 'bar';
            
            const tipoReserva = document.getElementById('modal-filtro-tipo-reserva');
            const estado = document.getElementById('modal-filtro-estado');
            const actividad = document.getElementById('modal-filtro-actividad');
            
            const filtros = {
                tipoReserva: tipoReserva ? tipoReserva.value : '',
                estado: estado ? estado.value : '',
                actividad: actividad ? actividad.value : ''
            };
            
            this.actualizarGraficaModalConFiltros(tipoGrafica, filtros);
        }
    }

    actualizarGraficaModalTiempo(tipo, tipoGrafica, datosProcesados) {
        const canvas = document.getElementById("chartAmpliado");
        if (!canvas) return;
        
        const ctx = canvas.getContext("2d");
        
        if (this.chartManager && this.chartManager.chartAmpliado) {
            this.chartManager.chartAmpliado.destroy();
        }

        const colors = this.chartManager.generarColores(tipo, datosProcesados.labels);
        
        const chartData = {
            labels: datosProcesados.labels,
            datasets: [
                {
                    label: `Visitantes por ${tipo}`,
                    data: datosProcesados.values,
                    backgroundColor: colors,
                    borderRadius: tipoGrafica === "bar" ? 6 : 0,
                    borderWidth: tipoGrafica === "bar" ? 0 : 2,
                    borderColor: tipoGrafica === "bar" ? 'transparent' : '#fff',
                    barThickness: tipoGrafica === "bar" ? 18 : undefined,
                    maxBarThickness: tipoGrafica === "bar" ? 30 : undefined,
                    barPercentage: tipoGrafica === "bar" ? 0.6 : undefined
                },
            ],
        };

        if (this.chartManager) {
            this.chartManager.chartAmpliado = new Chart(ctx, {
                type: tipoGrafica === "bar" ? "bar" : "doughnut",
                data: chartData,
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
                            text: `Visitantes por ${tipo.toUpperCase()} (Filtrado)`,
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
                                    const total = datosProcesados.total;
                                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
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
                                text: tipo === 'fecha' ? 'Fecha' : 
                                    tipo === 'mes' ? 'Mes' : 'Año',
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
        }

        this.actualizarTablaTiempo(tipo, datosProcesados);
    }

    actualizarGraficaModalTiempoAgrupada(tipo, tipoGrafica, datosProcesados) {
        const canvas = document.getElementById("chartAmpliado");
        if (!canvas) return;
        
        const ctx = canvas.getContext("2d");
        
        if (this.chartManager && this.chartManager.chartAmpliado) {
            this.chartManager.chartAmpliado.destroy();
        }

        const esAgrupada = datosProcesados.datasets && datosProcesados.datasets.length > 0;
        
        if (!esAgrupada) {
            this.actualizarGraficaModalTiempo(tipo, tipoGrafica, datosProcesados);
            return;
        }

        let titulo = `Visitantes por ${tipo.toUpperCase()} (Agrupado por Tipo de Reserva)`;
        const fechaInicio = document.getElementById('modal-filtro-fecha-inicio')?.value;
        const fechaFin = document.getElementById('modal-filtro-fecha-fin')?.value;
        
        if (fechaInicio && fechaFin) {
            titulo += ` | Período: ${fechaInicio} - ${fechaFin}`;
        }

        const modalTitle = document.getElementById("modalTitle");
        if (modalTitle) {
            modalTitle.innerHTML = titulo;
        }

        if (this.chartManager) {
            this.chartManager.chartAmpliado = new Chart(ctx, {
                type: tipoGrafica === "bar" ? "bar" : "doughnut",
                data: {
                    labels: datosProcesados.labels,
                    datasets: datosProcesados.datasets.map(dataset => ({
                        ...dataset,
                        borderRadius: tipoGrafica === "bar" ? 6 : 0,
                        borderWidth: tipoGrafica === "bar" ? 0 : 2,
                        borderColor: tipoGrafica === "bar" ? 'transparent' : '#fff',
                        barThickness: tipoGrafica === "bar" ? 18 : undefined,
                        maxBarThickness: tipoGrafica === "bar" ? 30 : undefined,
                        barPercentage: tipoGrafica === "bar" ? 0.6 : undefined
                    }))
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
                            text: titulo,
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
                                    const label = context.dataset.label || '';
                                    const value = context.raw || 0;
                                    return `${label}: ${value.toLocaleString()} reservas`;
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
                                text: tipo === 'fecha' ? 'Fecha' : 
                                    tipo === 'mes' ? 'Mes' : 'Año',
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
        }

        this.actualizarTablaTiempoAgrupada(tipo, datosProcesados);
    }

    actualizarTablaTiempoAgrupada(tipo, datosProcesados) {
        const tbody = document.querySelector("#tablaDatos");
        const thead = document.querySelector("#tablaHeader");
        if (!tbody || !thead) return;

        if (!datosProcesados.datasets || datosProcesados.datasets.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; color: #7f8c8d;">
                        <i class="fas fa-exclamation-circle"></i> No hay datos disponibles
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        const totalGeneral = datosProcesados.total || 0;

        thead.innerHTML = `
            <th>${tipo === 'fecha' ? 'Fecha' : tipo === 'mes' ? 'Mes' : 'Año'}</th>
            ${datosProcesados.datasets.map(dataset => `<th>${dataset.label}</th>`).join('')}
            <th>Total</th>
            <th>Porcentaje</th>
        `;

        datosProcesados.labels.forEach((periodo, periodoIndex) => {
            const totalPeriodo = datosProcesados.datasets.reduce((sum, dataset) => 
                sum + (dataset.data[periodoIndex] || 0), 0);
            const porcentajePeriodo = totalGeneral > 0 ? ((totalPeriodo / totalGeneral) * 100).toFixed(1) : '0.0';
            
            html += `
                <tr>
                    <td><strong>${periodo}</strong></td>
                    ${datosProcesados.datasets.map(dataset => 
                        `<td style="text-align: center; font-weight: ${dataset.data[periodoIndex] > 0 ? 'bold' : 'normal'}">
                            ${(dataset.data[periodoIndex] || 0).toLocaleString()}
                        </td>`
                    ).join('')}
                    <td style="text-align: center; font-weight: bold;">
                        ${totalPeriodo.toLocaleString()}
                    </td>
                    <td style="text-align: center; color: #2e7d32; font-weight: bold;">
                        ${porcentajePeriodo}%
                    </td>
                </tr>
            `;
        });

        html += `
            <tr style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%);">
                <td><strong>Total por Tipo</strong></td>
                ${datosProcesados.datasets.map(dataset => {
                    const totalTipo = dataset.data.reduce((sum, val) => sum + (val || 0), 0);
                    return `<td style="text-align: center; font-weight: bold;">${totalTipo.toLocaleString()}</td>`;
                }).join('')}
                <td style="text-align: center; font-weight: bold;">${totalGeneral.toLocaleString()}</td>
                <td style="text-align: center; color: #2e7d32 font-weight: bold;">100%</td>
            </tr>
        `;

        tbody.innerHTML = html;
    }

    actualizarTablaTiempo(tipo, datosProcesados) {
        const tbody = document.querySelector("#tablaDatos");
        const thead = document.querySelector("#tablaHeader");
        if (!tbody || !thead) return;

        const total = datosProcesados.values.reduce((a, b) => a + b, 0);
        
        thead.innerHTML = `
            <th>${tipo === 'fecha' ? 'Fecha' : tipo === 'mes' ? 'Mes' : 'Año'}</th>
            <th>Cantidad</th>
            <th>Porcentaje</th>
        `;
        
        tbody.innerHTML = datosProcesados.labels.map((label, i) => {
            const valor = datosProcesados.values[i];
            const porcentaje = total > 0 ? ((valor / total) * 100).toFixed(1) : 0;
            
            return `
                <tr>
                    <td><strong>${label}</strong></td>
                    <td style="text-align: center; font-weight: bold">${valor.toLocaleString()}</td>
                    <td style="text-align: center; color: #2e7d32; font-weight: bold">${porcentaje}%</td>
                </tr>
            `;
        }).join("") + (total > 0 ? `
            <tr style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%);">
                <td><strong>TOTAL GENERAL</strong></td>
                <td style="text-align: center; font-weight: bold">${total.toLocaleString()}</td>
                <td style="text-align: center; color: #2e7d32; font-weight: bold">100%</td>
            </tr>
        ` : '');
    }
}   

const uiManager = new UIManager();