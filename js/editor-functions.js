// ============================================
// EDITOR DE INFORMES - FUNCIONES CORE (COMPLETO Y FUNCIONAL)
// ============================================

// Variables globales del editor (usando window para evitar redeclaraciones)
if (typeof window.pages === 'undefined') window.pages = [];
if (typeof window.currentZoom === 'undefined') window.currentZoom = 1;
if (typeof window.currentOrientation === 'undefined') window.currentOrientation = 'vertical';
if (typeof window.selectedElement === 'undefined') window.selectedElement = null;

// Variables para sistema de modos
if (typeof window.isDraggingMode === 'undefined') window.isDraggingMode = false;
if (typeof window.draggedElement === 'undefined') window.draggedElement = null;
if (typeof window.dragOffset === 'undefined') window.dragOffset = { x: 0, y: 0 };
if (typeof window.isDragging === 'undefined') window.isDragging = false;
if (typeof window.currentDragPage === 'undefined') window.currentDragPage = null;
if (typeof window.currentEditingReportId === 'undefined') window.currentEditingReportId = null;

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

// Inicializar editor (nuevo o edición existente)
function initializeEditor(existingReport = null) {
    const editorPanel = document.getElementById('editor-panel');
    if (!editorPanel) return;

    const isEditing = existingReport !== null;
    const reportTitle = isEditing ? existingReport.titulo : 'Nuevo Reporte';
    
    editorPanel.innerHTML = `
        <div class="editor-header">
            <h2>${isEditing ? 'Editando: ' + reportTitle : 'Editor de Informes'}</h2>
            <div style="display: flex; gap: 10px; align-items: center;">
                <button class="btn-close-editor" id="close-editor-btn" title="Cerrar editor">
                    <i class="fas fa-times"></i> Cerrar
                </button>
                <div class="orientation-controls">
                    <button class="orientation-btn active" id="orientation-vertical" title="Vertical">
                        <i class="fas fa-portrait"></i>
                    </button>
                    <button class="orientation-btn" id="orientation-horizontal" title="Horizontal">
                        <i class="fas fa-landscape"></i>
                    </button>
                </div>
                <div class="zoom-controls">
                    <button class="zoom-btn" id="zoom-out-btn" title="Alejar">
                        <i class="fas fa-search-minus"></i>
                    </button>
                    <span id="zoom-level" style="font-size: 0.9rem;">100%</span>
                    <button class="zoom-btn" id="zoom-in-btn" title="Acercar">
                        <i class="fas fa-search-plus"></i>
                    </button>
                </div>
                <button class="btn-primary-large" id="save-report-btn">
                    <i class="fas fa-save"></i> ${isEditing ? 'Guardar Cambios' : 'Guardar'}
                </button>
            </div>
        </div>

        <div class="editor-tools">
            <div class="tool-group">
                <button class="tool-btn" id="add-page-btn" title="Nueva Hoja">
                    <i class="fas fa-plus"></i> Hoja
                </button>
                <button class="tool-btn" id="add-table-btn" title="Insertar Tabla">
                    <i class="fas fa-table"></i> Tabla
                </button>
                <button class="tool-btn" id="add-image-btn" title="Insertar Imagen">
                    <i class="fas fa-image"></i> Imagen
                </button>
                <button class="tool-btn" id="add-chart-btn" title="Insertar Gráfico">
                    <i class="fas fa-chart-bar"></i> Gráfico
                </button>
            </div>
            <div class="tool-group">
                <select class="tool-btn" id="font-family-select" title="Fuente">
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Courier New">Courier New</option>
                </select>
                <select class="tool-btn" id="font-size-select" title="Tamaño">
                    <option value="1">Pequeño</option>
                    <option value="3" selected>Normal</option>
                    <option value="5">Grande</option>
                    <option value="7">Muy Grande</option>
                </select>
                <button class="tool-btn" id="format-bold-btn" title="Negrita">
                    <i class="fas fa-bold"></i>
                </button>
                <button class="tool-btn" id="format-italic-btn" title="Cursiva">
                    <i class="fas fa-italic"></i>
                </button>
                <button class="tool-btn" id="format-underline-btn" title="Subrayado">
                    <i class="fas fa-underline"></i>
                </button>
            </div>
        </div>

        <div class="pages-container" id="pages-container">
            <!-- Las páginas se generan dinámicamente -->
        </div>
    `;

    // Inicializar páginas
    const pagesContainer = document.getElementById('pages-container');
    if (pagesContainer) {
        pagesContainer.innerHTML = '';
    }
    window.pages = [];

    if (isEditing && existingReport.contenido) {
        loadExistingPages(existingReport);
        window.currentEditingReportId = existingReport.id || existingReport.reporte_id || existingReport.id_reporte;
    } else {
        createDefaultPages();
        window.currentEditingReportId = null;
    }

    // Configurar event listeners del editor
    setupEditorEventListeners();
    
    // Configurar sistema de modos y arrastre
    setupDragAndDropSystem();
    
    // Iniciar en modo escritura
    switchToWritingMode();
}

// ============================================
// SISTEMA DE MODOS (ESCRITURA vs ARRASTRE)
// ============================================

function switchToWritingMode() {
    window.isDraggingMode = false;
    document.body.classList.remove('dragging-mode');
    document.body.classList.add('writing-mode');
    
    // Habilitar edición en todas las páginas
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('dragging-mode');
        page.classList.add('writing-mode');
    });
    
    // Habilitar contentEditable
    document.querySelectorAll('.page-content, .page-header h3').forEach(element => {
        element.contentEditable = true;
        element.style.cursor = 'text';
    });
    
    // Restaurar cursor normal en elementos
    document.querySelectorAll('.element-container, .image-element-container, .chart-container').forEach(element => {
        element.style.cursor = 'default';
    });
}

function switchToDraggingMode() {
    window.isDraggingMode = true;
    document.body.classList.remove('writing-mode');
    document.body.classList.add('dragging-mode');
    
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('writing-mode');
        page.classList.add('dragging-mode');
    });
    
    // Deshabilitar edición temporalmente
    document.querySelectorAll('.page-content, .page-header h3').forEach(element => {
        element.contentEditable = false;
        element.style.cursor = 'default';
    });
    
    // Cambiar cursor en elementos
    document.querySelectorAll('.element-container, .image-element-container, .chart-container').forEach(element => {
        element.style.cursor = 'move';
    });
}

// ============================================
// SISTEMA DE ARRASTRE PARA ELEMENTOS
// ============================================

function setupDragAndDropSystem() {
    // Limpiar listeners anteriores
    document.removeEventListener('mousedown', startDrag);
    document.removeEventListener('mousemove', dragElement);
    document.removeEventListener('mouseup', stopDrag);
    
    // Agregar nuevos listeners
    document.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', dragElement);
    document.addEventListener('mouseup', stopDrag);
}

function startDrag(e) {
    // Solo arrastrar en modo arrastre
    if (!window.isDraggingMode) return;
    
    // Buscar el elemento arrastrable más cercano
    let element = e.target.closest('.element-container') || 
                  e.target.closest('.image-element-container') || 
                  e.target.closest('.chart-container') ||
                  e.target.closest('.custom-table')?.closest('div');
    
    if (!element) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    window.draggedElement = element;
    window.currentDragPage = element.closest('.page');
    
    // Calcular offset relativo al elemento
    const rect = element.getBoundingClientRect();
    const pageRect = window.currentDragPage ? window.currentDragPage.getBoundingClientRect() : { left: 0, top: 0 };
    
    window.dragOffset.x = e.clientX - rect.left;
    window.dragOffset.y = e.clientY - rect.top;
    
    // Añadir clase de arrastre
    element.classList.add('dragging');
    window.isDragging = true;
    
    // Asegurar que esté sobre otros elementos
    element.style.zIndex = '1000';
    element.style.position = 'relative';
}

function dragElement(e) {
    if (!window.isDragging || !window.draggedElement || !window.currentDragPage) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Obtener límites de la página
    const pageContent = window.currentDragPage.querySelector('.page-content');
    if (!pageContent) return;
    
    const contentRect = pageContent.getBoundingClientRect();
    
    // Calcular nueva posición relativa al contenido de la página
    let newX = e.clientX - window.dragOffset.x - contentRect.left + window.currentDragPage.scrollLeft;
    let newY = e.clientY - window.dragOffset.y - contentRect.top + window.currentDragPage.scrollTop;
    
    // Aplicar límites para que no se salga del área de contenido
    const maxX = contentRect.width - window.draggedElement.offsetWidth;
    const maxY = contentRect.height - window.draggedElement.offsetHeight;
    
    newX = Math.max(0, Math.min(maxX, newX));
    newY = Math.max(0, Math.min(maxY, newY));
    
    // Aplicar nueva posición
    window.draggedElement.style.left = newX + 'px';
    window.draggedElement.style.top = newY + 'px';
    window.draggedElement.style.margin = '0';
}

function stopDrag() {
    if (!window.isDragging || !window.draggedElement) return;
    
    window.draggedElement.classList.remove('dragging');
    window.draggedElement.style.zIndex = '10';
    
    // Resetear variables
    window.draggedElement = null;
    window.dragOffset = { x: 0, y: 0 };
    window.isDragging = false;
    window.currentDragPage = null;
    
    // Volver a modo escritura automáticamente después de soltar
    setTimeout(() => {
        switchToWritingMode();
    }, 100);
}

// ============================================
// FUNCIONES CORE DEL EDITOR (PÁGINAS)
// ============================================

function loadExistingPages(report) {
    try {
        const pagesContainer = document.getElementById('pages-container');
        const pagesData = JSON.parse(report.contenido || '[]');
        
        if (pagesData.length > 0) {
            pagesData.forEach((pageData, index) => {
                addPage(
                    pageData.type || 'normal',
                    pageData.title || `Página ${index + 1}`,
                    pageData.content || '',
                    index
                );
            });
        } else {
            createDefaultPages();
        }
    } catch (error) {
        console.error('Error cargando páginas:', error);
        createDefaultPages();
    }
}

function createDefaultPages() {
    const pageTypes = [
        { type: 'portada', title: 'PORTADA' },
        { type: 'contraportada', title: 'CONTRAPORTADA' },
        { type: 'indice', title: 'ÍNDICE' },
        { type: 'resumen', title: 'RESUMEN EJECUTIVO' },
        { type: 'desarrollo', title: 'DESARROLLO' }
    ];

    pageTypes.forEach((pageType, index) => {
        addPage(pageType.type, pageType.title, getDefaultContent(pageType.type), index);
    });
}

function getDefaultContent(pageType) {
    switch (pageType) {
        case 'portada':
            return '<p style="text-align: center; font-size: 18px; margin-top: 80px;">Escribe el título del informe aquí...</p>';
        case 'contraportada':
            return '<p style="text-align: center; margin-top: 120px;">Informe generado por Heliconias Reports</p>';
        case 'indice':
            return '<ul><li>Introducción</li><li>Desarrollo</li><li>Conclusiones</li><li>Recomendaciones</li></ul>';
        case 'resumen':
            return '<p>Resumen ejecutivo del informe...</p>';
        case 'desarrollo':
            return '<h4>Introducción</h4><p>Introducción del informe...</p>';
        default:
            return '<p>Escribe el contenido de esta página aquí...</p>';
    }
}

function addPage(type = 'normal', title = 'NUEVA PÁGINA', content = '', index = null) {
    const pagesContainer = document.getElementById('pages-container');
    if (!pagesContainer) return;
    
    const pageNumber = index !== null ? index : window.pages.length + 1;
    
    const page = document.createElement('div');
    page.className = `page ${type} ${window.currentOrientation}`;
    page.innerHTML = `
        <div class="page-header">
            <h3 contenteditable="true">${title}</h3>
        </div>
        <div class="page-content" contenteditable="true">
            ${content || getDefaultContent(type)}
        </div>
        <div class="page-number">Página ${pageNumber}</div>
        <button class="delete-page-btn" onclick="deletePage(this)" title="Eliminar página">
            <i class="fas fa-trash"></i>
        </button>
    `;

    if (index !== null) {
        pagesContainer.insertBefore(page, pagesContainer.children[index]);
        window.pages.splice(index, 0, page);
    } else {
        pagesContainer.appendChild(page);
        window.pages.push(page);
    }

    updatePageNumbers();
    switchToWritingMode();
    
    // Hacer scroll a la nueva página
    setTimeout(() => {
        page.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
    
    return page;
}

function deletePage(button) {
    const page = button.closest('.page');
    if (window.pages.length <= 1) {
        showAlert('warning', 'No se puede eliminar', 'Debe haber al menos una página en el informe');
        return;
    }
    
    showConfirmDialog(
        '¿Eliminar página?',
        'Esta acción no se puede deshacer',
        'warning',
        () => {
            const pageIndex = Array.from(page.parentNode.children).indexOf(page);
            page.remove();
            window.pages.splice(pageIndex, 1);
            updatePageNumbers();
            
            showAlert('success', 'Página eliminada', 'La página ha sido eliminada correctamente', 1500);
        }
    );
}

function changeOrientation(orientation) {
    window.currentOrientation = orientation;
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('vertical', 'horizontal');
        page.classList.add(orientation);
    });
    
    updateActiveButton('orientation', orientation);
}

function changeZoom(delta) {
    window.currentZoom = Math.max(0.5, Math.min(2, window.currentZoom + delta));
    const pagesContainer = document.getElementById('pages-container');
    if (pagesContainer) {
        pagesContainer.style.transform = `scale(${window.currentZoom})`;
    }
    updateZoomDisplay();
}

function updatePageNumbers() {
    const pageNumbers = document.querySelectorAll('.page-number');
    pageNumbers.forEach((number, index) => {
        number.textContent = `Página ${index + 1}`;
    });
}

// ============================================
// FUNCIONES DE FORMATO DE TEXTO
// ============================================

function formatText(command) {
    executeOnActiveContent(() => {
        document.execCommand(command, false, null);
    });
}

function changeFontFamily(font) {
    executeOnActiveContent(() => {
        document.execCommand('fontName', false, font);
    });
}

function changeFontSize(size) {
    executeOnActiveContent(() => {
        document.execCommand('fontSize', false, size);
    });
}

function executeOnActiveContent(callback) {
    const activeContent = document.querySelector('.page-content[contenteditable="true"]:focus');
    if (activeContent) {
        callback();
    } else {
        const firstContent = document.querySelector('.page-content[contenteditable="true"]');
        if (firstContent) {
            firstContent.focus();
            callback();
        }
    }
}

// ============================================
// CONFIGURACIÓN DE EVENT LISTENERS
// ============================================

function setupEditorEventListeners() {
    // Botones básicos
    setupButtonListeners({
        'close-editor-btn': closeEditor,
        'save-report-btn': handleSaveReport,
        'orientation-vertical': () => changeOrientation('vertical'),
        'orientation-horizontal': () => changeOrientation('horizontal'),
        'zoom-out-btn': () => changeZoom(-0.1),
        'zoom-in-btn': () => changeZoom(0.1),
        'add-page-btn': () => addPage(),
        'format-bold-btn': () => formatText('bold'),
        'format-italic-btn': () => formatText('italic'),
        'format-underline-btn': () => formatText('underline')
    });

    // Selectores
    const fontFamilySelect = document.getElementById('font-family-select');
    const fontSizeSelect = document.getElementById('font-size-select');
    
    if (fontFamilySelect) {
        fontFamilySelect.addEventListener('change', (e) => changeFontFamily(e.target.value));
    }
    
    if (fontSizeSelect) {
        fontSizeSelect.addEventListener('change', (e) => changeFontSize(e.target.value));
    }

    // Botones de elementos - CORREGIDO: Usar window para verificar funciones
    const addTableBtn = document.getElementById('add-table-btn');
    const addImageBtn = document.getElementById('add-image-btn');
    const addChartBtn = document.getElementById('add-chart-btn');
    
    if (addTableBtn) {
        addTableBtn.addEventListener('click', showTableModal);
    }
    
    if (addImageBtn) {
        addImageBtn.addEventListener('click', () => {
            // Verificar si existe showImageModal en window
            if (window.showImageModal && typeof window.showImageModal === 'function') {
                window.showImageModal();
            } else {
                showSimpleImageModal();
            }
        });
    }
    
    if (addChartBtn) {
        addChartBtn.addEventListener('click', showChartModal);
    }
}

function setupButtonListeners(buttonMap) {
    Object.entries(buttonMap).forEach(([id, handler]) => {
        const button = document.getElementById(id);
        if (button) button.addEventListener('click', handler);
    });
}

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

function updateActiveButton(type, value) {
    document.querySelectorAll(`.${type}-btn`).forEach(btn => {
        btn.classList.remove('active');
    });
    
    const button = document.getElementById(`${type}-${value}`);
    if (button) button.classList.add('active');
}

function updateZoomDisplay() {
    const zoomLevel = document.getElementById('zoom-level');
    if (zoomLevel) {
        zoomLevel.textContent = `${Math.round(window.currentZoom * 100)}%`;
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

function showConfirmDialog(title, text, icon, confirmCallback, denyCallback = null) {
    const config = {
        title,
        text,
        icon,
        showCancelButton: true,
        confirmButtonColor: '#27ae60',
        cancelButtonColor: '#e74c3c',
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true
    };
    
    if (denyCallback) {
        config.showDenyButton = true;
        config.denyButtonText = 'No';
        config.denyButtonColor = '#95a5a6';
    }
    
    Swal.fire(config).then((result) => {
        if (result.isConfirmed) {
            confirmCallback();
        } else if (result.isDenied && denyCallback) {
            denyCallback();
        }
    });
}

// ============================================
// FUNCIONES DE GUARDADO Y CIERRE
// ============================================

function closeEditor() {
    if (checkEditorContent()) {
        showExitWarning();
    } else {
        closeEditorWithoutPrompt();
    }
}

function closeEditorWithoutPrompt() {
    const editorPanel = document.getElementById('editor-panel');
    const mainPanel = document.getElementById('main-panel');
    
    if (editorPanel) editorPanel.style.display = 'none';
    if (mainPanel) mainPanel.style.display = 'flex';
    
    const pagesContainer = document.getElementById('pages-container');
    if (pagesContainer) pagesContainer.innerHTML = '';
    
    window.currentEditingReportId = null;
    
    showAlert('info', 'Editor cerrado', 'Has salido del editor de informes', 1500);
}

function checkEditorContent() {
    const pages = document.querySelectorAll('.page');
    
    for (const page of pages) {
        const pageContent = page.querySelector('.page-content');
        const pageTitle = page.querySelector('.page-header h3');
        
        const textContent = pageContent?.textContent?.trim() || '';
        const originalTitle = pageTitle?.textContent?.trim() || '';
        
        const defaultTitles = ['PORTADA', 'CONTRAPORTADA', 'ÍNDICE', 'RESUMEN EJECUTIVO', 'DESARROLLO', 'NUEVA PÁGINA'];
        const defaultContents = [
            'Escribe el título del informe aquí...',
            'Informe generado por Heliconias Reports',
            'Introducción',
            'Desarrollo',
            'Conclusiones',
            'Recomendaciones'
        ];
        
        if (textContent.length > 0 && !defaultContents.some(content => textContent.includes(content))) {
            return true;
        }
        
        if (originalTitle && !defaultTitles.includes(originalTitle.toUpperCase())) {
            return true;
        }
    }
    
    return false;
}

function showExitWarning() {
    Swal.fire({
        title: '¿Salir del editor?',
        html: getExitWarningHTML(),
        icon: 'warning',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: '<i class="fas fa-save"></i> Guardar y salir',
        denyButtonText: '<i class="fas fa-times"></i> Salir sin guardar',
        cancelButtonText: '<i class="fas fa-arrow-left"></i> Seguir editando',
        confirmButtonColor: '#27ae60',
        denyButtonColor: '#e74c3c',
        cancelButtonColor: '#3498db',
        reverseButtons: true,
        width: 500
    }).then(async (result) => {
        if (result.isConfirmed) {
            await handleSaveAndExit();
        } else if (result.isDenied) {
            showExitConfirmation();
        }
    });
}

function getExitWarningHTML() {
    return `
        <div style="text-align: left;">
            <p>Tienes contenido sin guardar en el editor.</p>
            <div style="background: #fff3cd; color: #856404; padding: 12px; border-radius: 6px; border-left: 4px solid #ffc107; margin: 10px 0;">
                <p style="margin: 0; font-size: 0.9rem;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <strong>Advertencia:</strong> Si sales sin guardar, perderás todo el trabajo no guardado.
                </p>
            </div>
            <p>¿Qué deseas hacer?</p>
        </div>
    `;
}

async function handleSaveAndExit() {
    try {
        await handleSaveReport();
        closeEditorWithoutPrompt();
    } catch (error) {
        console.error('Error al guardar:', error);
        
        Swal.fire({
            title: 'Error al guardar',
            text: 'No se pudo guardar el reporte. ¿Quieres salir sin guardar?',
            icon: 'error',
            showCancelButton: true,
            confirmButtonText: 'Sí, salir sin guardar',
            cancelButtonText: 'Quedarme',
            confirmButtonColor: '#e74c3c'
        }).then((result) => {
            if (result.isConfirmed) {
                closeEditorWithoutPrompt();
            }
        });
    }
}

function showExitConfirmation() {
    Swal.fire({
        title: '¿Estás seguro?',
        text: 'Perderás todo el trabajo no guardado',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, salir sin guardar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#e74c3c',
        reverseButtons: true
    }).then((result) => {
        if (result.isConfirmed) {
            closeEditorWithoutPrompt();
        }
    });
}

// ============================================
// FUNCIONES DE GUARDADO (REALES)
// ============================================

// En editor-functions.js, actualiza handleSaveReport:

async function handleSaveReport() {
    try {
        const reportData = collectReportData();
        
        if (validateReportData(reportData)) {
            // Mostrar indicador de carga
            Swal.fire({
                title: 'Guardando...',
                text: 'Por favor espera',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            
            console.log('Datos del reporte a guardar:', reportData);
            
            const result = await saveReport(reportData);
            
            Swal.close();
            
            if (result.success) {
                showAlert('success', '¡Guardado exitoso!', result.message || 'El informe ha sido guardado correctamente', 2000);
                
                // Actualizar el ID con el que devolvió la base de datos
                if (result.id) {
                    window.currentEditingReportId = result.id;
                    console.log('ID del reporte actualizado:', result.id);
                }
                
                return true;
            } else {
                showAlert('error', 'Error al guardar', result.message || 'No se pudo guardar el informe');
                return false;
            }
        }
    } catch (error) {
        console.error('Error al guardar:', error);
        Swal.close();
        showAlert('error', 'Error al guardar', 'No se pudo guardar el informe. Intenta nuevamente.');
        return false;
    }
}
function collectReportData() {
    const pages = document.querySelectorAll('.page');
    const pagesData = [];
    
    pages.forEach((page, index) => {
        const pageTitle = page.querySelector('.page-header h3')?.textContent || '';
        const pageContent = page.querySelector('.page-content')?.innerHTML || '';
        
        pagesData.push({
            number: index + 1,
            title: pageTitle,
            content: pageContent,
            type: page.classList.contains('portada') ? 'portada' : 
                  page.classList.contains('contraportada') ? 'contraportada' :
                  page.classList.contains('indice') ? 'indice' : 
                  page.classList.contains('resumen') ? 'resumen' : 'normal'
        });
    });
    
    return {
        id: window.currentEditingReportId || generateReportId(),
        title: document.querySelector('.page.portada .page-header h3')?.textContent || 'Nuevo Reporte',
        orientation: window.currentOrientation,
        pages: pagesData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

function validateReportData(reportData) {
    if (!reportData.title || reportData.title.trim() === '' || reportData.title === 'PORTADA') {
        showAlert('warning', 'Título requerido', 'Por favor, añade un título al informe en la portada.');
        return false;
    }
    
    if (reportData.pages.length === 0) {
        showAlert('warning', 'Contenido requerido', 'El informe debe contener al menos una página.');
        return false;
    }
    
    return true;
}

function generateReportId() {
    return 'report-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// Función de guardado REAL que usa Supabase
async function saveReport(reportData) {
    // Verificar si existe la función de guardado real
    if (window.saveReportToDB && typeof window.saveReportToDB === 'function') {
        return await window.saveReportToDB(reportData);
    }
    
    // Fallback: Simulación de guardado
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log('Reporte a guardar (simulación):', reportData);
            
            // Intentar guardar en localStorage como respaldo
            try {
                const reports = JSON.parse(localStorage.getItem('heliconias_reports') || '[]');
                const existingIndex = reports.findIndex(r => r.id === reportData.id);
                
                if (existingIndex >= 0) {
                    reports[existingIndex] = reportData;
                } else {
                    reports.push(reportData);
                }
                
                localStorage.setItem('heliconias_reports', JSON.stringify(reports));
                console.log('Reporte guardado en localStorage');
            } catch (error) {
                console.error('Error al guardar en localStorage:', error);
            }
            
            resolve({ 
                success: true, 
                id: reportData.id,
                message: 'Reporte guardado exitosamente (modo simulación)' 
            });
        }, 1000);
    });
}

// ============================================
// FUNCIONES PARA ELEMENTOS
// ============================================

function showTableModal() {
    Swal.fire({
        title: 'Insertar Tabla',
        html: `
            <div style="text-align: left;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">Número de filas:</label>
                <input type="number" id="table-rows" value="3" min="1" max="20" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 15px;">
                
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">Número de columnas:</label>
                <input type="number" id="table-cols" value="3" min="1" max="10" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 15px;">
                
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">Estilo de la tabla:</label>
                <select id="table-style" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="basic">Básica</option>
                    <option value="striped">Con bandas</option>
                    <option value="bordered">Con bordes</option>
                </select>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Insertar Tabla',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#27ae60',
        preConfirm: () => {
            const rows = parseInt(document.getElementById('table-rows').value);
            const cols = parseInt(document.getElementById('table-cols').value);
            const style = document.getElementById('table-style').value;
            
            if (rows > 0 && cols > 0) {
                insertTable(rows, cols, style);
                return true;
            } else {
                Swal.showValidationMessage('Por favor ingresa valores válidos');
                return false;
            }
        }
    });
}

function insertTable(rows, cols, style = 'basic') {
    const tableId = 'table-' + Date.now();
    
    let tableHTML = '<table class="custom-table element-container"';
    if (style === 'striped') tableHTML += ' style="border-collapse: collapse; width: 100%;"';
    if (style === 'bordered') tableHTML += ' style="border: 1px solid #ddd; border-collapse: collapse; width: 100%;"';
    tableHTML += '><thead><tr>';
    
    // Crear encabezados
    for (let i = 0; i < cols; i++) {
        tableHTML += `<th contenteditable="true" style="${style === 'bordered' ? 'border: 1px solid #ddd; padding: 8px;' : 'padding: 8px;'}">Columna ${i + 1}</th>`;
    }
    
    tableHTML += '</tr></thead><tbody>';
    
    // Crear filas
    for (let i = 0; i < rows; i++) {
        tableHTML += '<tr>';
        for (let j = 0; j < cols; j++) {
            const cellStyle = style === 'bordered' ? 'border: 1px solid #ddd; padding: 8px;' : 'padding: 8px;';
            if (style === 'striped' && i % 2 === 0) {
                tableHTML += `<td contenteditable="true" style="${cellStyle} background-color: #f8f9fa;">Celda ${i + 1}-${j + 1}</td>`;
            } else {
                tableHTML += `<td contenteditable="true" style="${cellStyle}">Celda ${i + 1}-${j + 1}</td>`;
            }
        }
        tableHTML += '</tr>';
    }
    
    tableHTML += '</tbody></table>';
    
    executeOnActiveContent(() => {
        document.execCommand('insertHTML', false, tableHTML);
    });
}

function showSimpleImageModal() {
    Swal.fire({
        title: 'Insertar Imagen',
        html: `
            <div style="text-align: left;">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600;">Subir imagen:</label>
                    <input type="file" id="image-upload" accept="image/*" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <p style="font-size: 0.9rem; color: #7f8c8d; margin-bottom: 8px;">O ingresa una URL de imagen:</p>
                    <input type="url" id="image-url" placeholder="https://ejemplo.com/imagen.jpg" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600;">Tamaño de la imagen:</label>
                    <select id="image-size" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="small">Pequeña (200px)</option>
                        <option value="medium" selected>Mediana (400px)</option>
                        <option value="large">Grande (600px)</option>
                        <option value="full">Ancho completo</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600;">Alineación:</label>
                    <select id="image-align" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="center" selected>Centrado</option>
                        <option value="left">Izquierda</option>
                        <option value="right">Derecha</option>
                    </select>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Insertar Imagen',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#27ae60',
        width: 500,
        preConfirm: async () => {
            const fileInput = document.getElementById('image-upload');
            const urlInput = document.getElementById('image-url');
            const size = document.getElementById('image-size').value;
            const align = document.getElementById('image-align').value;
            
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                const reader = new FileReader();
                return new Promise((resolve) => {
                    reader.onload = function(e) {
                        resolve({ 
                            src: e.target.result, 
                            size: size,
                            align: align
                        });
                    };
                    reader.readAsDataURL(file);
                });
            } else if (urlInput.value) {
                return { 
                    src: urlInput.value, 
                    size: size,
                    align: align
                };
            } else {
                Swal.showValidationMessage('Por favor selecciona una imagen o ingresa una URL');
                return false;
            }
        }
    }).then((result) => {
        if (result.isConfirmed && result.value) {
            insertImageSimple(result.value.src, result.value.size, result.value.align);
        }
    });
}

function insertImageSimple(src, size = 'medium', align = 'center') {
    const imageId = 'image-' + Date.now();
    
    let width = '';
    let alignStyle = '';
    
    switch (size) {
        case 'small': width = '200px'; break;
        case 'medium': width = '400px'; break;
        case 'large': width = '600px'; break;
        case 'full': width = '100%'; break;
        default: width = '400px';
    }
    
    switch (align) {
        case 'left': 
            alignStyle = 'float: left; margin-right: 20px; margin-bottom: 10px;';
            break;
        case 'right': 
            alignStyle = 'float: right; margin-left: 20px; margin-bottom: 10px;';
            break;
        default: 
            alignStyle = 'display: block; margin: 0 auto;';
    }
    
    const imgHTML = `
        <div class="image-element-container element-container" id="${imageId}" 
             style="position: relative; margin: 20px 0; ${align === 'center' ? 'text-align: center;' : ''}">
            <img src="${src}" 
                 style="${width !== '100%' ? 'width: ' + width + ';' : ''} max-width: 100%; height: auto; border-radius: 5px; ${alignStyle}"
                 alt="Imagen insertada" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"400\" height=\"300\" viewBox=\"0 0 400 300\"><rect width=\"400\" height=\"300\" fill=\"%23f0f0f0\"/><text x=\"200\" y=\"150\" text-anchor=\"middle\" font-family=\"Arial\" font-size=\"14\" fill=\"%23999\">Imagen no disponible</text></svg>';">
        </div>
    `;
    
    executeOnActiveContent(() => {
        document.execCommand('insertHTML', false, imgHTML);
    });
}

function showChartModal() {
    Swal.fire({
        title: 'Insertar Gráfico',
        html: `
            <div style="text-align: left;">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600;">Tipo de Gráfico:</label>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                        <button type="button" class="chart-type-btn active" data-type="bar" style="padding: 10px; border: 1px solid #ddd; border-radius: 5px; background: #f8f9fa; cursor: pointer;">
                            <i class="fas fa-chart-bar" style="display: block; font-size: 1.5rem; margin-bottom: 5px;"></i>
                            Barras
                        </button>
                        <button type="button" class="chart-type-btn" data-type="pie" style="padding: 10px; border: 1px solid #ddd; border-radius: 5px; background: #f8f9fa; cursor: pointer;">
                            <i class="fas fa-chart-pie" style="display: block; font-size: 1.5rem; margin-bottom: 5px;"></i>
                            Circular
                        </button>
                        <button type="button" class="chart-type-btn" data-type="line" style="padding: 10px; border: 1px solid #ddd; border-radius: 5px; background: #f8f9fa; cursor: pointer;">
                            <i class="fas fa-chart-line" style="display: block; font-size: 1.5rem; margin-bottom: 5px;"></i>
                            Líneas
                        </button>
                    </div>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600;">Datos del gráfico (separados por comas):</label>
                    <input type="text" id="chart-data" value="30,50,70,40,60" placeholder="30,50,70,40,60" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600;">Etiquetas (separadas por comas):</label>
                    <input type="text" id="chart-labels" value="Ene,Feb,Mar,Abr,May" placeholder="Ene,Feb,Mar,Abr,May" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600;">Título del gráfico:</label>
                    <input type="text" id="chart-title" value="Ventas Mensuales" placeholder="Título del gráfico" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Insertar Gráfico',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#27ae60',
        didOpen: () => {
            const buttons = document.querySelectorAll('.chart-type-btn');
            buttons.forEach(btn => {
                btn.addEventListener('click', function() {
                    buttons.forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                });
            });
        },
        preConfirm: () => {
            const activeBtn = document.querySelector('.chart-type-btn.active');
            const chartType = activeBtn.dataset.type;
            const data = document.getElementById('chart-data').value;
            const labels = document.getElementById('chart-labels').value;
            const title = document.getElementById('chart-title').value;
            
            if (!data.trim() || !labels.trim()) {
                Swal.showValidationMessage('Por favor ingresa datos y etiquetas válidos');
                return false;
            }
            
            return {
                type: chartType,
                data: data.split(',').map(d => parseFloat(d.trim()) || 0),
                labels: labels.split(',').map(l => l.trim()),
                title: title.trim()
            };
        }
    }).then((result) => {
        if (result.isConfirmed && result.value) {
            insertChart(result.value.type, result.value.data, result.value.labels, result.value.title);
        }
    });
}

function insertChart(type, data, labels, title) {
    const chartId = 'chart-' + Date.now();
    const colors = ['#27ae60', '#3498db', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c'];
    
    let chartHTML = `
        <div class="chart-container element-container" id="${chartId}" 
             style="position: relative; margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e0e0e0;">
            <div style="margin-bottom: 15px; font-weight: 600; color: #2c3e50; font-size: 1.1rem;">${title || 'Gráfico'}</div>
            <div style="display: flex; align-items: flex-end; justify-content: center; height: 200px; gap: 20px;">
    `;
    
    const maxValue = Math.max(...data);
    
    if (type === 'bar') {
        data.forEach((value, index) => {
            const height = (value / maxValue) * 160;
            chartHTML += `
                <div style="display: flex; flex-direction: column; align-items: center;">
                    <div style="width: 40px; height: ${height}px; background: ${colors[index % colors.length]}; border-radius: 4px 4px 0 0;"></div>
                    <div style="margin-top: 5px; font-size: 0.8rem; color: #7f8c8d; text-align: center; max-width: 60px;">${labels[index] || ''}</div>
                    <div style="font-size: 0.7rem; color: #2c3e50; margin-top: 2px;">${value}</div>
                </div>
            `;
        });
        chartHTML += `</div>`;
    } else if (type === 'pie') {
        chartHTML = `
            <div class="chart-container element-container" id="${chartId}" style="position: relative; margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e0e0e0;">
                <div style="margin-bottom: 15px; font-weight: 600; color: #2c3e50; font-size: 1.1rem;">${title || 'Gráfico Circular'}</div>
                <div style="display: flex; justify-content: center; align-items: center; gap: 30px;">
                    <div style="width: 150px; height: 150px; border-radius: 50%; background: conic-gradient(
        `;
        
        const total = data.reduce((a, b) => a + b, 0);
        let currentAngle = 0;
        
        data.forEach((value, index) => {
            const percentage = (value / total) * 100;
            const angle = (percentage / 100) * 360;
            chartHTML += `${colors[index % colors.length]} ${currentAngle}deg ${currentAngle + angle}deg`;
            if (index < data.length - 1) chartHTML += ', ';
            currentAngle += angle;
        });
        
        chartHTML += `);"></div>
                    <div style="min-width: 150px;">
        `;
        
        data.forEach((value, index) => {
            chartHTML += `
                <div style="display: flex; align-items: center; margin-bottom: 8px; font-size: 0.85rem;">
                    <div style="width: 12px; height: 12px; background: ${colors[index % colors.length]}; margin-right: 8px; border-radius: 2px;"></div>
                    <span style="color: #2c3e50;">${labels[index] || ''}:</span>
                    <span style="margin-left: auto; font-weight: 600; color: #27ae60;">${value}</span>
                </div>
            `;
        });
        
        chartHTML += `</div></div>`;
    } else {
        chartHTML = `
            <div class="chart-container element-container" id="${chartId}" style="position: relative; margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e0e0e0;">
                <div style="margin-bottom: 15px; font-weight: 600; color: #2c3e50; font-size: 1.1rem;">${title || 'Gráfico de Líneas'}</div>
                <div style="position: relative; height: 200px; border-left: 1px solid #ddd; border-bottom: 1px solid #ddd; padding-left: 30px; padding-bottom: 20px;">
        `;
        
        // Eje Y
        for (let i = 0; i <= 5; i++) {
            const value = (maxValue / 5) * i;
            chartHTML += `
                <div style="position: absolute; left: 0; bottom: ${(i / 5) * 100}%; transform: translateY(50%); font-size: 0.7rem; color: #7f8c8d;">
                    ${Math.round(value)}
                </div>
            `;
        }
        
        // Línea del gráfico
        chartHTML += `<div style="position: relative; height: 100%;">`;
        
        data.forEach((value, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = (value / maxValue) * 100;
            
            // Punto
            chartHTML += `
                <div style="position: absolute; left: ${x}%; bottom: ${y}%; transform: translate(-50%, 50%); 
                         width: 10px; height: 10px; background: #27ae60; border-radius: 50%; border: 2px solid white;"></div>
            `;
            
            // Etiqueta del punto
            chartHTML += `
                <div style="position: absolute; left: ${x}%; bottom: ${y}%; transform: translate(-50%, -25px); 
                         font-size: 0.7rem; color: #2c3e50; text-align: center; min-width: 40px;">
                    ${labels[index] || ''}<br>
                    <strong>${value}</strong>
                </div>
            `;
            
            // Línea entre puntos
            if (index > 0) {
                const prevX = ((index - 1) / (data.length - 1)) * 100;
                const prevY = (data[index - 1] / maxValue) * 100;
                chartHTML += `
                    <div style="position: absolute; left: ${prevX}%; bottom: ${prevY}%; 
                             width: ${Math.sqrt(Math.pow(x - prevX, 2) + Math.pow(y - prevY, 2))}%; 
                             height: 2px; background: #27ae60; 
                             transform-origin: 0 0; 
                             transform: rotate(${Math.atan2(y - prevY, x - prevX)}rad);"></div>
                `;
            }
        });
        
        chartHTML += `</div></div>`;
    }
    
    chartHTML += `</div>`;
    
    executeOnActiveContent(() => {
        document.execCommand('insertHTML', false, chartHTML);
    });
}

// ============================================
// FUNCIÓN PARA ELIMINAR ELEMENTOS
// ============================================

window.deleteElement = function(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.remove();
    }
};

// ============================================
// EXPORTAR FUNCIONES GLOBALES
// ============================================

window.initializeEditor = initializeEditor;
window.changeOrientation = changeOrientation;
window.changeZoom = changeZoom;
window.addPage = addPage;
window.deletePage = deletePage;
window.formatText = formatText;
window.changeFontFamily = changeFontFamily;
window.changeFontSize = changeFontSize;
window.showTableModal = showTableModal;
window.showSimpleImageModal = showSimpleImageModal;
window.showChartModal = showChartModal;
window.switchToWritingMode = switchToWritingMode;
window.switchToDraggingMode = switchToDraggingMode;
window.handleSaveReport = handleSaveReport;
window.saveReport = saveReport;
window.insertImageSimple = insertImageSimple;
window.insertTable = insertTable;
window.insertChart = insertChart;