// ============================================
// SISTEMA DE ARRASTRE PARA ELEMENTOS
// ============================================

let draggedElement = null;
let offset = { x: 0, y: 0 };
let isDragging = false;
let currentPage = null;

// Configurar arrastre para todos los elementos
function setupDragAndDrop() {
    document.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
    
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
}

function startDrag(e) {
    // Solo arrastrar si se hace clic en el botón de mover o en el contenedor
    if (e.target.classList.contains('btn-move') || 
        e.target.closest('.element-container')) {
        
        const element = e.target.closest('.element-container');
        if (!element) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        draggedElement = element;
        currentPage = element.closest('.page');
        
        // Calcular offset
        const rect = element.getBoundingClientRect();
        const pageRect = currentPage.getBoundingClientRect();
        
        if (e.type === 'mousedown') {
            offset.x = e.clientX - rect.left;
            offset.y = e.clientY - rect.top;
        } else if (e.type === 'touchstart') {
            offset.x = e.touches[0].clientX - rect.left;
            offset.y = e.touches[0].clientY - rect.top;
        }
        
        // Añadir clase de arrastre
        draggedElement.classList.add('dragging');
        isDragging = true;
        
        // Asegurar que esté sobre otros elementos
        draggedElement.style.zIndex = '1000';
        
        // Mostrar límites de arrastre
        showDragBoundaries();
    }
}

function drag(e) {
    if (!isDragging || !draggedElement || !currentPage) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    let clientX, clientY;
    
    if (e.type === 'mousemove') {
        clientX = e.clientX;
        clientY = e.clientY;
    } else if (e.type === 'touchmove') {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    }
    
    // Obtener límites de la página
    const pageRect = currentPage.getBoundingClientRect();
    const elementRect = draggedElement.getBoundingClientRect();
    
    // Calcular nueva posición
    let newX = clientX - offset.x - pageRect.left;
    let newY = clientY - offset.y - pageRect.top;
    
    // Aplicar límites para que no se salga de la página
    const maxX = pageRect.width - elementRect.width;
    const maxY = pageRect.height - elementRect.height;
    
    newX = Math.max(0, Math.min(maxX, newX));
    newY = Math.max(0, Math.min(maxY, newY));
    
    // Aplicar nueva posición
    draggedElement.style.left = newX + 'px';
    draggedElement.style.top = newY + 'px';
    
    // Aplicar restricción de grid (opcional, 10px de grid)
    const gridSize = 10;
    draggedElement.style.left = Math.round(newX / gridSize) * gridSize + 'px';
    draggedElement.style.top = Math.round(newY / gridSize) * gridSize + 'px';
    
    // Actualizar visualmente
    updateDragHelper(newX, newY);
}

function stopDrag() {
    if (!isDragging || !draggedElement) return;
    
    draggedElement.classList.remove('dragging');
    draggedElement.style.zIndex = '10'; // Volver al z-index normal
    
    // Guardar posición final en atributos de datos
    const left = parseInt(draggedElement.style.left) || 0;
    const top = parseInt(draggedElement.style.top) || 0;
    
    draggedElement.dataset.left = left;
    draggedElement.dataset.top = top;
    
    // Ocultar límites de arrastre
    hideDragBoundaries();
    
    // Resetear variables
    draggedElement = null;
    offset = { x: 0, y: 0 };
    isDragging = false;
    currentPage = null;
}

// Funciones para touch
function handleTouchStart(e) {
    if (e.target.classList.contains('btn-move') || 
        e.target.closest('.element-container')) {
        startDrag(e);
    }
}

function handleTouchMove(e) {
    drag(e);
}

function handleTouchEnd() {
    stopDrag();
}

// Mostrar límites de arrastre
function showDragBoundaries() {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        const boundary = document.createElement('div');
        boundary.className = 'drag-boundary';
        boundary.style.border = '2px dashed rgba(46, 125, 50, 0.3)';
        boundary.style.pointerEvents = 'none';
        page.appendChild(boundary);
        
        const helper = document.createElement('div');
        helper.className = 'drag-helper';
        helper.textContent = 'Mueve el elemento con el botón de mover';
        page.appendChild(helper);
    });
}

function hideDragBoundaries() {
    document.querySelectorAll('.drag-boundary, .drag-helper').forEach(el => el.remove());
}

function updateDragHelper(x, y) {
    const helper = currentPage?.querySelector('.drag-helper');
    if (helper) {
        helper.textContent = `Posición: ${Math.round(x)}px, ${Math.round(y)}px`;
        helper.style.top = '10px';
        helper.style.left = '10px';
    }
}

// Hacer elemento arrastrable (versión mejorada)
function makeElementDraggable(element) {
    // Añadir clase y atributos iniciales
    element.classList.add('element-container');
    
    // Posicionar en el centro si no tiene posición
    if (!element.style.left && !element.style.top) {
        const page = element.closest('.page');
        if (page) {
            const pageRect = page.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            
            const centerX = (pageRect.width - elementRect.width) / 2;
            const centerY = (pageRect.height - elementRect.height) / 2;
            
            element.style.left = Math.max(0, centerX) + 'px';
            element.style.top = Math.max(0, centerY) + 'px';
        }
    }
    
    // Configurar botón de mover
    const moveBtn = element.querySelector('.btn-move');
    if (moveBtn) {
        moveBtn.title = 'Arrastrar para mover';
        moveBtn.innerHTML = '<i class="fas fa-arrows-alt"></i>';
    }
    
    // Añadir evento para doble clic para centrar
    element.addEventListener('dblclick', function() {
        const page = this.closest('.page');
        if (page) {
            const pageRect = page.getBoundingClientRect();
            const elementRect = this.getBoundingClientRect();
            
            const centerX = (pageRect.width - elementRect.width) / 2;
            const centerY = (pageRect.height - elementRect.height) / 2;
            
            this.style.left = Math.max(0, centerX) + 'px';
            this.style.top = Math.max(0, centerY) + 'px';
        }
    });
}

// Inicializar sistema de arrastre cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        setupDragAndDrop();
        
        // Aplicar arrastre a elementos existentes
        document.querySelectorAll('.element-container').forEach(element => {
            makeElementDraggable(element);
        });
    }, 1000);
});

// Exportar funciones
window.makeElementDraggable = makeElementDraggable;
window.setupDragAndDrop = setupDragAndDrop;