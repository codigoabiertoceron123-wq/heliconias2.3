// ============================================
// SISTEMA DE REPORTES - HELICONIAS (ACTUALIZADO - SIN REDECLARACIONES)
// ============================================

// Variables globales
let currentUser = null;
let currentReportTab = 'all';
let reports = [];
let currentEditingReportId = null;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Inicializar el sistema
        await initializeSystem();
        console.log('✅ Sistema de reportes inicializado');
    } catch (error) {
        console.error('❌ Error inicializando sistema:', error);
        showAlert('error', 'Error de inicialización', 
            'No se pudo inicializar el sistema correctamente');
    }
});

// Función principal de inicialización
async function initializeSystem() {
    try {
        // 1. Actualizar fecha y hora
        updateDateTime();
        setInterval(updateDateTime, 1000);
        
        // 2. Verificar autenticación (si supabase existe y tiene auth)
        if (window.supabase && window.supabase.auth) {
            try {
                const { data: { user } } = await window.supabase.auth.getUser();
                currentUser = user;
                
                if (currentUser) {
                    console.log('👤 Usuario autenticado:', currentUser.email);
                } else {
                    console.log('👤 No hay usuario autenticado');
                }
            } catch (authError) {
                console.warn('⚠️ Error verificando autenticación:', authError);
            }
        } else {
            console.warn('⚠️ Supabase o Supabase.auth no está disponible');
        }
        
        // 3. Configurar event listeners
        setupEventListeners();
        
        // 4. Cargar reportes iniciales
        await loadReports();
        
    } catch (error) {
        console.error('❌ Error inicializando sistema:', error);
        throw error;
    }
}

// ============================================
// FUNCIONES DE UTILIDAD GENERAL
// ============================================

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
    
    const dateTimeElement = document.getElementById("current-date-time");
    if (dateTimeElement) {
        dateTimeElement.textContent = dateTimeString;
    }
}

function showAlert(icon, title, text, timer = null) {
    const config = {
        title,
        text,
        icon,
        confirmButtonColor: '#27ae60',
        showConfirmButton: !timer
    };
    
    if (timer) config.timer = timer;
    
    Swal.fire(config);
}

// ============================================
// CONFIGURACIÓN DE EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Botón escribir informe
    const writeReportBtn = document.getElementById('write-report-btn');
    if (writeReportBtn) {
        writeReportBtn.addEventListener('click', function() {
            currentEditingReportId = null;
            document.getElementById('main-panel').style.display = 'none';
            document.getElementById('editor-panel').style.display = 'block';
            // Verificar si initializeEditor existe
            if (typeof initializeEditor === 'function') {
                initializeEditor(null); // Nuevo reporte
            } else {
                showAlert('error', 'Error', 'El editor no está disponible');
                console.error('initializeEditor no está definido');
            }
        });
    }
    
    // Botón consultar informe
    const consultReportBtn = document.getElementById('consult-report-btn');
    if (consultReportBtn) {
        consultReportBtn.addEventListener('click', function() {
            toggleHistorySidebar();
            loadReports();
        });
    }
    
    // Botón ayuda principal
    const helpMainBtn = document.getElementById('help-main-btn');
    if (helpMainBtn) {
        helpMainBtn.addEventListener('click', showMainHelp);
    }
    
    // Botón logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Botón toggle historial
    const historyToggle = document.getElementById('history-toggle');
    if (historyToggle) {
        historyToggle.addEventListener('click', toggleHistorySidebar);
    }
    
    // Tabs del historial
    document.querySelectorAll('.history-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.history-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentReportTab = this.dataset.tab;
            renderReports();
        });
    });
}

// ============================================
// FUNCIONES DE AUTENTICACIÓN
// ============================================

async function handleLogout() {
    const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: "¿Quieres cerrar sesión?",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#27ae60',
        cancelButtonColor: '#e74c3c',
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            // Cerrar sesión en Supabase si existe
            if (window.supabase && window.supabase.auth) {
                await window.supabase.auth.signOut();
                console.log('✅ Sesión cerrada en Supabase');
            } else {
                console.warn('⚠️ Supabase.auth no disponible para cerrar sesión');
            }
            
            Swal.fire({
                title: 'Saliendo...',
                text: "Cerrando sesión",
                icon: 'info',
                showConfirmButton: false,
                timer: 1500,
                timerProgressBar: true,
                didOpen: () => {
                    Swal.showLoading();
                }
            }).then(() => {
                window.location.href = 'index.html';
            });
        } catch (error) {
            console.error('Error cerrando sesión:', error);
            showAlert('error', 'Error', 'No se pudo cerrar sesión correctamente');
        }
    }
}

// ============================================
// FUNCIONES DE AYUDA
// ============================================

function showMainHelp() {
    Swal.fire({
        title: '<div style="display: flex; align-items: center; gap: 10px; color: #2c3e50;"><i class="fas fa-file-alt" style="color: #27ae60; font-size: 1.5rem;"></i><span>Sistema de Reportes - Heliconias</span></div>',
        html: `
            <div style="text-align: left;">
                <div style="background: linear-gradient(135deg, #27ae60, #2ecc71); color: white; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                    <h4 style="margin: 0; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-lightbulb"></i>
                        ¿Qué puedes hacer aquí?
                    </h4>
                </div>
                
                <div style="display: grid; gap: 15px; margin-bottom: 20px;">
                    <div style="display: flex; align-items: start; gap: 12px; padding: 12px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #27ae60;">
                        <i class="fas fa-file-signature" style="color: #27ae60; font-size: 1.2rem; margin-top: 2px;"></i>
                        <div>
                            <strong style="color: #2c3e50;">Crear Nuevos Reportes</strong>
                            <p style="margin: 5px 0 0 0; color: #7f8c8d; font-size: 0.9rem;">Inicia reportes desde cero con páginas predefinidas</p>
                        </div>
                    </div>
                    
                    <div style="display: flex; align-items: start; gap: 12px; padding: 12px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #3498db;">
                        <i class="fas fa-edit" style="color: #3498db; font-size: 1.2rem; margin-top: 2px;"></i>
                        <div>
                            <strong style="color: #2c3e50;">Editar Reportes Existentes</strong>
                            <p style="margin: 5px 0 0 0; color: #7f8c8d; font-size: 0.9rem;">Modifica reportes guardados, agrega páginas, imágenes y más</p>
                        </div>
                    </div>
                </div>
                
                <div style="background: #fff3cd; color: #856404; padding: 12px; border-radius: 6px; border-left: 4px solid #ffc107;">
                    <p style="margin: 0; font-size: 0.9rem;">
                        <i class="fas fa-database"></i>
                        <strong>Datos guardados:</strong> Todos tus reportes se guardan automáticamente en la base de datos.
                    </p>
                </div>
            </div>
        `,
        icon: 'info',
        showCloseButton: true,
        confirmButtonColor: '#27ae60',
        confirmButtonText: '<i class="fas fa-check-circle"></i> ¡Entendido!',
        width: 700
    });
}

// ============================================
// FUNCIONES DEL SIDEBAR DE HISTORIAL
// ============================================

function toggleHistorySidebar() {
    const sidebar = document.getElementById('history-sidebar');
    if (!sidebar) return;
    
    sidebar.classList.toggle('open');
    
    const toggleBtn = document.getElementById('history-toggle');
    if (toggleBtn) {
        if (sidebar.classList.contains('open')) {
            toggleBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
            toggleBtn.title = 'Ocultar historial';
        } else {
            toggleBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
            toggleBtn.title = 'Mostrar historial';
        }
    }
}

// ============================================
// FUNCIONES DE GESTIÓN DE REPORTES (CRUD)
// ============================================

async function loadReports() {
    try {
        console.log('📂 Cargando reportes...');
        
        const reportsList = document.getElementById('reports-list');
        if (reportsList) {
            reportsList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando reportes...</div>';
        }
        
        let data = [];
        let error = null;
        
        // Usar Supabase si está disponible
        if (window.supabase && window.supabase.from) {
            console.log('🔗 Usando Supabase para cargar reportes');
            const result = await window.supabase
                .from('reportes')
                .select('*')
                .order('fecha_modificacion', { ascending: false });

            data = result.data || [];
            error = result.error;
            
            if (error) {
                console.error('❌ Error de Supabase:', error);
                throw error;
            }
        } else {
            // Fallback a localStorage
            console.warn('⚠️ Supabase no disponible, usando localStorage');
            const storedReports = localStorage.getItem('heliconias_reports');
            data = storedReports ? JSON.parse(storedReports) : [];
        }
        
        reports = data;
        console.log(`✅ ${reports.length} reportes cargados`);
        
        renderReports();
        return reports;
        
    } catch (error) {
        console.error('❌ Error cargando reportes:', error);
        
        const reportsList = document.getElementById('reports-list');
        if (reportsList) {
            reportsList.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error al cargar reportes</p>
                    <button class="btn-small" onclick="loadReports()">
                        <i class="fas fa-redo"></i> Reintentar
                    </button>
                </div>
            `;
        }
        
        showAlert('error', 'Error', 'No se pudieron cargar los reportes');
        return [];
    }
}

function renderReports() {
    const reportsList = document.getElementById('reports-list');
    if (!reportsList) return;

    // Filtrar reportes según la pestaña activa
    const filteredReports = reports.filter(report => {
        if (currentReportTab === 'all') return true;
        return report.estado === currentReportTab;
    });

    if (filteredReports.length === 0) {
        reportsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-alt"></i>
                <h4>No hay reportes</h4>
                <p>${currentReportTab === 'all' ? 'No hay reportes registrados' : 
                   currentReportTab === 'borrador' ? 'No hay borradores' : 
                   'No hay reportes finalizados'}</p>
                <button class="btn-small" id="create-first-report-btn">
                    <i class="fas fa-plus"></i> Crear primer reporte
                </button>
            </div>
        `;
        
        // Event listener para el botón de crear primer reporte
        document.getElementById('create-first-report-btn')?.addEventListener('click', () => {
            currentEditingReportId = null;
            document.getElementById('main-panel').style.display = 'none';
            document.getElementById('editor-panel').style.display = 'block';
            if (typeof initializeEditor === 'function') {
                initializeEditor(null);
            }
            toggleHistorySidebar();
        });
        
        return;
    }

    reportsList.innerHTML = filteredReports.map(report => `
        <div class="report-item" data-id="${report.id_reporte}">
            <div class="report-item-header">
                <div class="report-title" onclick="viewReport(${report.id_reporte})">
                    <h4>${escapeHtml(report.titulo || 'Sin título')}</h4>
                    <span class="report-status ${report.estado}">${report.estado}</span>
                </div>
                <div class="report-dates">
                    <small><i class="fas fa-calendar-plus"></i> ${formatDate(report.fecha_creacion)}</small>
                    <small><i class="fas fa-edit"></i> ${formatDate(report.fecha_modificacion)}</small>
                </div>
            </div>
            <div class="report-item-body">
                <div class="report-preview" onclick="viewReport(${report.id_reporte})">
                    ${getReportPreview(report)}
                </div>
                <div class="report-actions">
                    <button class="btn-action edit-report" onclick="editExistingReport(${report.id_reporte})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn-action view-report" onclick="viewReport(${report.id_reporte})">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                    <button class="btn-action delete-report" onclick="deleteReport(${report.id_reporte})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function formatDate(dateString) {
    if (!dateString) return 'Sin fecha';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (error) {
        return 'Fecha inválida';
    }
}

function getReportPreview(report) {
    try {
        if (report.contenido) {
            const content = JSON.parse(report.contenido);
            if (Array.isArray(content) && content.length > 0 && content[0]?.content) {
                // Limpiar HTML y obtener texto
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = content[0].content;
                const text = tempDiv.textContent || tempDiv.innerText || '';
                return text.substring(0, 150) + (text.length > 150 ? '...' : '');
            }
        }
        return 'Sin contenido disponible';
    } catch (error) {
        console.warn('Error obteniendo preview:', error);
        return 'Contenido no disponible';
    }
}

// ============================================
// FUNCIONES GLOBALES PARA MANEJO DE REPORTES
// ============================================

// Función para ver reporte (global)
window.viewReport = async function(reportId) {
    try {
        console.log('👁️ Viendo reporte ID:', reportId);
        
        // Mostrar carga
        Swal.fire({
            title: 'Cargando...',
            text: 'Buscando reporte en la base de datos',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        const report = await fetchReportById(reportId);
        
        if (!report) {
            throw new Error('Reporte no encontrado');
        }
        
        Swal.close();
        showReportModal(report);
        
    } catch (error) {
        console.error('❌ Error cargando reporte:', error);
        Swal.close();
        showAlert('error', 'Error', 'No se pudo cargar el reporte');
    }
};

// Función para editar reporte existente (global)
window.editExistingReport = async function(reportId) {
    try {
        console.log('✏️ Editando reporte existente ID:', reportId);
        
        // Mostrar mensaje de carga
        Swal.fire({
            title: 'Cargando...',
            text: 'Preparando editor con el reporte existente',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        const report = await fetchReportById(reportId);
        
        if (!report) {
            throw new Error('Reporte no encontrado');
        }
        
        // Guardar el ID del reporte que estamos editando
        currentEditingReportId = reportId;
        
        // Ocultar el panel principal y mostrar el editor
        document.getElementById('main-panel').style.display = 'none';
        document.getElementById('editor-panel').style.display = 'block';
        
        // Inicializar el editor con el reporte cargado
        if (typeof initializeEditor === 'function') {
            initializeEditor(report);
        } else {
            throw new Error('El editor no está disponible');
        }
        
        // Cerrar el sidebar de historial si está abierto
        const sidebar = document.getElementById('history-sidebar');
        if (sidebar && sidebar.classList.contains('open')) {
            toggleHistorySidebar();
        }
        
        Swal.close();
        
    } catch (error) {
        console.error('❌ Error editando reporte existente:', error);
        Swal.close();
        showAlert('error', 'Error', 'No se pudo cargar el reporte para editar');
    }
};

// Función para eliminar reporte (global)
window.deleteReport = async function(reportId) {
    const result = await Swal.fire({
        title: '¿Eliminar Reporte?',
        html: `
            <div style="text-align: left;">
                <p>Esta acción no se puede deshacer.</p>
                <div style="background: #fff3cd; color: #856404; padding: 12px; border-radius: 6px; border-left: 4px solid #ffc107; margin: 10px 0;">
                    <p style="margin: 0; font-size: 0.9rem;">
                        <i class="fas fa-exclamation-triangle"></i>
                        <strong>Advertencia:</strong> Se eliminará el reporte permanentemente.
                    </p>
                </div>
                <p>¿Deseas continuar?</p>
            </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e74c3c',
        cancelButtonColor: '#27ae60',
        confirmButtonText: '<i class="fas fa-trash"></i> Sí, eliminar',
        cancelButtonText: '<i class="fas fa-times"></i> Cancelar',
        reverseButtons: true,
        width: 500
    });

    if (result.isConfirmed) {
        try {
            console.log('🗑️ Eliminando reporte ID:', reportId);
            
            let success = false;
            
            // Usar window.supabase en lugar de supabase
            if (window.supabase && window.supabase.from) {
                // Eliminar de Supabase
                const { error } = await window.supabase
                    .from('reportes')
                    .delete()
                    .eq('id_reporte', reportId);

                if (error) {
                    console.error('❌ Error de Supabase al eliminar:', error);
                    throw error;
                }
                success = true;
            } else {
                // Eliminar de localStorage
                const storedReports = JSON.parse(localStorage.getItem('heliconias_reports') || '[]');
                const updatedReports = storedReports.filter(r => r.id_reporte !== reportId);
                localStorage.setItem('heliconias_reports', JSON.stringify(updatedReports));
                success = true;
            }
            
            if (success) {
                Swal.fire({
                    title: '¡Eliminado!',
                    text: 'El reporte ha sido eliminado',
                    icon: 'success',
                    confirmButtonColor: '#27ae60',
                    timer: 1500,
                    showConfirmButton: false
                });

                // Recargar la lista
                await loadReports();
            }
            
        } catch (error) {
            console.error('❌ Error eliminando reporte:', error);
            showAlert('error', 'Error', 'No se pudo eliminar el reporte: ' + (error.message || 'Error desconocido'));
        }
    }
};

// ============================================
// FUNCIONES AUXILIARES
// ============================================

async function fetchReportById(reportId) {
    try {
        console.log('🔍 Buscando reporte ID:', reportId);
        
        let data = null;
        
        // Usar window.supabase en lugar de supabase
        if (window.supabase && window.supabase.from) {
            // Buscar en Supabase
            const { data: result, error } = await window.supabase
                .from('reportes')
                .select('*')
                .eq('id_reporte', reportId)
                .single();

            if (error) {
                console.error('❌ Error de Supabase:', error);
                throw error;
            }
            
            data = result;
        } else {
            // Buscar en localStorage
            const storedReports = JSON.parse(localStorage.getItem('heliconias_reports') || '[]');
            data = storedReports.find(r => r.id_reporte == reportId);
        }
        
        if (!data) {
            console.warn('⚠️ Reporte no encontrado');
            return null;
        }
        
        console.log('✅ Reporte encontrado:', data.titulo);
        return data;
        
    } catch (error) {
        console.error('❌ Error buscando reporte:', error);
        throw error;
    }
}

// Función para mostrar reporte en modal
function showReportModal(report) {
    try {
        let pages = [];
        try {
            pages = JSON.parse(report.contenido || '[]');
        } catch (e) {
            console.warn('No se pudo parsear el contenido:', e);
        }
        
        let modalContent = `
            <div style="text-align: left; max-height: 70vh; overflow-y: auto; padding-right: 10px;">
                <div style="background: linear-gradient(135deg, #27ae60, #2ecc71); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                    <h2 style="margin: 0 0 10px 0;">${escapeHtml(report.titulo || 'Sin título')}</h2>
                    <div style="display: flex; flex-wrap: wrap; gap: 15px; font-size: 0.9rem;">
                        <span><i class="fas fa-calendar-plus"></i> Creado: ${formatDate(report.fecha_creacion)}</span>
                        <span><i class="fas fa-edit"></i> Modificado: ${formatDate(report.fecha_modificacion)}</span>
                        <span><i class="fas fa-user"></i> Usuario: ${report.id_usuario ? 'ID ' + report.id_usuario.substring(0, 8) + '...' : 'Desconocido'}</span>
                        <span class="report-status status-${report.estado}" style="background: ${report.estado === 'finalizado' ? '#27ae60' : '#f39c12'}; padding: 2px 10px; border-radius: 20px;">${report.estado}</span>
                    </div>
                </div>
        `;

        if (pages.length > 0) {
            pages.forEach((page, index) => {
                let cleanContent = page.content || '';
                modalContent += `
                    <div style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                        <div style="border-bottom: 2px solid #27ae60; padding-bottom: 10px; margin-bottom: 15px;">
                            <h3 style="margin: 0; color: #27ae60; font-size: 1.2rem;">${escapeHtml(page.title || `Página ${index + 1}`)}</h3>
                            ${page.type ? `<small style="color: #7f8c8d;">Tipo: ${page.type}</small>` : ''}
                        </div>
                        <div style="min-height: 50px; line-height: 1.6; color: #2c3e50;">
                            ${cleanContent || '<p style="color: #7f8c8d; font-style: italic;">Sin contenido</p>'}
                        </div>
                        <div style="text-align: right; margin-top: 15px; color: #7f8c8d; font-size: 0.8rem;">
                            <i class="fas fa-file-alt"></i> Página ${page.number || index + 1}
                        </div>
                    </div>
                `;
            });
        } else {
            modalContent += `
                <div style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 40px 20px; text-align: center;">
                    <i class="fas fa-file-alt" style="font-size: 3rem; color: #bdc3c7; margin-bottom: 15px;"></i>
                    <p style="color: #7f8c8d; font-size: 1.1rem;">Este reporte no tiene contenido disponible</p>
                </div>
            `;
        }

        modalContent += `
            </div>
            <div style="margin-top: 20px; text-align: center;">
                <button class="btn btn-primary" onclick="editExistingReport(${report.id_reporte})" style="margin-right: 10px;">
                    <i class="fas fa-edit"></i> Editar este reporte
                </button>
            </div>
        `;

        Swal.fire({
            title: 'Visualizando Reporte',
            html: modalContent,
            width: 900,
            padding: '20px',
            showCloseButton: true,
            showConfirmButton: false,
            customClass: {
                popup: 'report-modal'
            }
        });
    } catch (error) {
        console.error('❌ Error mostrando reporte:', error);
        showAlert('error', 'Error', 'No se pudo mostrar el reporte');
    }
}

// Función auxiliar para escapar HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// FUNCIONES PARA EL EDITOR
// ============================================

// Función para cerrar el editor
function closeEditor() {
    document.getElementById('editor-panel').style.display = 'none';
    document.getElementById('main-panel').style.display = 'block';
    
    // Recargar reportes para actualizar el historial
    loadReports();
}

// ============================================
// INICIALIZACIÓN GLOBAL
// ============================================

// Exportar funciones globales
window.editExistingReport = window.editExistingReport || editExistingReport;
window.viewReport = window.viewReport || viewReport;
window.deleteReport = window.deleteReport || deleteReport;
window.closeEditor = closeEditor;
window.loadReports = loadReports;

console.log('🚀 Sistema de Reportes Heliconias cargado');