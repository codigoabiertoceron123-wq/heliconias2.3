// ============================================
// FUNCIONES DE BASE DE DATOS - db-functions.js (COMPLETAMENTE CORREGIDO)
// ============================================

// Función para guardar reportes en la base de datos
async function saveReportToDB(reportData) {
    try {
        console.log('Iniciando guardado en BD...', reportData);
        
        // Verificar si Supabase está disponible
        if (!window.supabase) {
            console.error('ERROR: window.supabase no está disponible');
            
            // Verificar si supabase global existe
            if (typeof supabase === 'undefined') {
                console.error('ERROR: supabase tampoco está disponible globalmente');
            } else {
                console.log('INFO: supabase existe globalmente, pero no en window');
            }
            
            return { 
                success: false, 
                message: 'Error: No hay conexión con la base de datos' 
            };
        }
        
        console.log('Supabase disponible:', window.supabase ? 'SÍ' : 'NO');
        
        // Preparar datos EXACTAMENTE como los espera la tabla
        const reportDataForDB = {
            titulo: reportData.title || 'Nuevo Reporte',
            contenido: JSON.stringify(reportData.pages || []),
            estado: 'borrador',
            elementos: JSON.stringify(reportData.elements || []),
            metadata: JSON.stringify({
                orientation: reportData.orientation || 'vertical',
                createdAt: reportData.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                zoom: reportData.zoom || 1
            }),
            fecha_modificacion: new Date().toISOString()
        };
        
        console.log('Datos preparados para BD:', reportDataForDB);
        
        let result;
        
        // Determinar si es un nuevo reporte o una actualización
        const reportId = reportData.id;
        
        if (!reportId || 
            (typeof reportId === 'string' && reportId.startsWith('report-')) ||
            reportId === null ||
            reportId === undefined) {
            
            // NUEVO REPORTE - INSERTAR
            console.log('Creando NUEVO reporte en BD...');
            
            // Asegurar que tenemos el cliente correcto
            const client = window.supabase;
            
            result = await client
                .from('reportes')
                .insert([reportDataForDB])
                .select('id_reporte, titulo, fecha_creacion')
                .single();
                
            console.log('Resultado de INSERT:', result);
            
        } else {
            // REPORTE EXISTENTE - ACTUALIZAR
            console.log('Actualizando reporte existente, ID:', reportId);
            
            // Convertir ID a número si es necesario
            const idNumero = parseInt(reportId);
            if (isNaN(idNumero)) {
                console.error('ERROR: ID de reporte inválido:', reportId);
                return { 
                    success: false, 
                    message: 'Error: ID de reporte inválido' 
                };
            }
            
            result = await window.supabase
                .from('reportes')
                .update(reportDataForDB)
                .eq('id_reporte', idNumero)
                .select('id_reporte, titulo, fecha_modificacion')
                .single();
                
            console.log('Resultado de UPDATE:', result);
        }
        
        if (result.error) {
            console.error('ERROR en operación de BD:', result.error);
            return { 
                success: false, 
                message: `Error de base de datos: ${result.error.message}` 
            };
        }
        
        if (!result.data) {
            console.error('ERROR: No se recibieron datos de la BD');
            return { 
                success: false, 
                message: 'Error: No se pudo guardar el reporte' 
            };
        }
        
        console.log('✅ Reporte guardado exitosamente en BD:', result.data);
        
        return { 
            success: true, 
            id: result.data.id_reporte,
            message: 'Reporte guardado exitosamente en la base de datos',
            data: result.data
        };
        
    } catch (error) {
        console.error('ERROR CRÍTICO en saveReportToDB:', error);
        return { 
            success: false, 
            message: `Error crítico: ${error.message}` 
        };
    }
}

// Función para cargar todos los reportes (para el historial)
async function getAllReports() {
    try {
        console.log('Cargando todos los reportes...');
        
        if (!window.supabase) {
            console.error('ERROR: window.supabase no está disponible');
            return [];
        }
        
        const { data, error } = await window.supabase
            .from('reportes')
            .select('id_reporte, titulo, estado, fecha_creacion, fecha_modificacion')
            .order('fecha_modificacion', { ascending: false });
            
        if (error) {
            console.error('ERROR al cargar reportes:', error);
            return [];
        }
        
        console.log(`✅ ${data.length} reportes cargados`);
        return data.map(report => ({
            id: report.id_reporte,
            titulo: report.titulo,
            estado: report.estado,
            fecha_creacion: report.fecha_creacion,
            fecha_modificacion: report.fecha_modificacion
        }));
        
    } catch (error) {
        console.error('ERROR en getAllReports:', error);
        return [];
    }
}

// Función para cargar un reporte específico
async function loadReportFromDB(reportId) {
    try {
        console.log('Cargando reporte ID:', reportId);
        
        if (!window.supabase) {
            console.error('ERROR: window.supabase no está disponible');
            return null;
        }
        
        const idNumero = parseInt(reportId);
        if (isNaN(idNumero)) {
            console.error('ERROR: ID de reporte inválido:', reportId);
            return null;
        }
        
        const { data, error } = await window.supabase
            .from('reportes')
            .select('*')
            .eq('id_reporte', idNumero)
            .single();
            
        if (error) {
            console.error('ERROR al cargar reporte:', error);
            return null;
        }
        
        console.log('✅ Reporte cargado:', data.titulo);
        
        return {
            id: data.id_reporte,
            titulo: data.titulo,
            contenido: data.contenido,
            estado: data.estado,
            elementos: data.elementos,
            metadata: data.metadata,
            fecha_creacion: data.fecha_creacion,
            fecha_modificacion: data.fecha_modificacion,
            id_usuario: data.id_usuario
        };
        
    } catch (error) {
        console.error('ERROR en loadReportFromDB:', error);
        return null;
    }
}

// Función para eliminar un reporte
async function deleteReportFromDB(reportId) {
    try {
        if (!window.supabase) {
            console.error('ERROR: window.supabase no está disponible');
            return { success: false, message: 'Error de conexión' };
        }
        
        const idNumero = parseInt(reportId);
        if (isNaN(idNumero)) {
            return { success: false, message: 'ID de reporte inválido' };
        }
        
        const { error } = await window.supabase
            .from('reportes')
            .delete()
            .eq('id_reporte', idNumero);
            
        if (error) {
            console.error('ERROR al eliminar reporte:', error);
            return { success: false, message: error.message };
        }
        
        return { success: true, message: 'Reporte eliminado exitosamente' };
        
    } catch (error) {
        console.error('ERROR en deleteReportFromDB:', error);
        return { success: false, message: error.message };
    }
}

// Función para verificar la conexión con Supabase
async function testSupabaseConnection() {
    try {
        if (!window.supabase) {
            return { success: false, message: 'Supabase no está configurado' };
        }
        
        // Hacer una consulta simple para verificar la conexión
        const { data, error } = await window.supabase
            .from('reportes')
            .select('count')
            .limit(1);
            
        if (error) {
            console.error('ERROR en test de conexión:', error);
            return { success: false, message: error.message };
        }
        
        return { success: true, message: 'Conexión exitosa a Supabase' };
        
    } catch (error) {
        console.error('ERROR en testSupabaseConnection:', error);
        return { success: false, message: error.message };
    }
}

// Función auxiliar para debug
function debugSupabase() {
    console.log('=== DEBUG SUPABASE ===');
    console.log('window.supabase:', window.supabase ? 'DEFINIDO' : 'NO DEFINIDO');
    console.log('typeof window.supabase:', typeof window.supabase);
    console.log('supabase global:', typeof supabase !== 'undefined' ? 'DEFINIDO' : 'NO DEFINIDO');
    console.log('window.supabase.from:', window.supabase?.from ? 'FUNCIÓN' : 'NO FUNCIÓN');
    console.log('window.supabase.auth:', window.supabase?.auth ? 'DEFINIDO' : 'NO DEFINIDO');
    console.log('======================');
}

// Ejecutar debug al cargar
setTimeout(() => {
    debugSupabase();
}, 1000);

// Exportar funciones
window.saveReportToDB = saveReportToDB;
window.loadReportFromDB = loadReportFromDB;
window.getAllReports = getAllReports;
window.deleteReportFromDB = deleteReportFromDB;
window.testSupabaseConnection = testSupabaseConnection;
window.debugSupabase = debugSupabase;

console.log('✅ Funciones de BD cargadas correctamente');