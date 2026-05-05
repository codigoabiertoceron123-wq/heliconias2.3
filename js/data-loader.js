// Módulo para carga de datos - VERSIÓN COMPLETAMENTE CORREGIDA
class DataLoader {
    constructor() {
        this.filtrosActivos = {};
        this.app = null;
        this.dataProcessor = null;
    }

    setApp(app) {
        this.app = app;
        // Obtener referencia al dataProcessor desde la app
        if (app && app.modules && app.modules.dataProcessor) {
            this.dataProcessor = app.modules.dataProcessor;
        }
    }
    
    async cargarDatosVisitantes() {
        try {
            console.log('🔍 Cargando datos para REPORTE DE RESERVAS...');

            if (!window.supabase) {
                console.error('❌ Cliente Supabase no disponible');
                this.cargarDatosDemo();
                return;
            }

            // ✅ CONSULTA CORREGIDA con la estructura REAL
            let query = supabase
                .from('participantes_reserva')
                .select(`
                    *,
                    reservas!inner(
                        id_reserva,
                        tipo_reserva,
                        estado,
                        fecha_reserva,
                        id_actividad,
                        numero_participantes
                    ),
                    actividades!reservas(id_actividad, nombre),
                    intereses!inner(id_interes, nombre),
                    instituciones!inner(id_institucion, nombre_institucion),
                    genero!inner(id_genero, genero)
                `)
                .order('fecha_visita', { ascending: false })
                .limit(500);

            console.log('📡 Ejecutando consulta con estructura real...');
            const { data: participantes, error } = await query;

            if (error) {
                console.error('❌ Error en consulta:', error);
                console.log('🔍 Detalles:', error.message);
                
                // ✅ INTENTO ALTERNATIVO: Consulta más simple
                const alternativaExito = await this.cargarDatosAlternativos();
                if (!alternativaExito) {
                    this.cargarDatosDemo();
                }
                return;
            }

            console.log(`✅ ${participantes?.length || 0} participantes cargados`);

            if (participantes && participantes.length > 0) {
                console.log('📊 Ejemplo de datos cargados:', participantes[0]);
                
                // ✅ Procesar datos exitosamente
                if (this.dataProcessor) {
                    this.dataProcessor.procesarDatosCompletos(participantes);
                } else if (window.dataProcessor) {
                    window.dataProcessor.procesarDatosCompletos(participantes);
                }
                
                // Mostrar éxito
                if (window.Swal) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Datos cargados',
                        text: `Se cargaron ${participantes.length} participantes`,
                        timer: 2000,
                        showConfirmButton: false
                    });
                }
            } else {
                console.log('⚠ No se encontraron participantes');
                this.cargarDatosDemo();
            }
            
        } catch (error) {
            console.error('❌ Error crítico:', error);
            this.cargarDatosDemo();
        }
    }

    // ✅ NUEVO MÉTODO: Carga alternativa si falla la principal
    async cargarDatosAlternativos() {
        try {
            console.log('🔄 Intentando carga alternativa...');
            
            // Consulta más simple pero funcional
            const { data: participantes, error } = await supabase
                .from('participantes_reserva')
                .select(`
                    *,
                    reservas(tipo_reserva, estado, fecha_reserva),
                    intereses(nombre),
                    instituciones(nombre_institucion),
                    genero(genero)
                `)
                .limit(300);

            if (error) throw error;

            if (participantes && participantes.length > 0) {
                console.log(`✅ ${participantes.length} participantes cargados (alternativo)`);
                
                if (this.dataProcessor) {
                    this.dataProcessor.procesarDatosCompletos(participantes);
                } else if (window.dataProcessor) {
                    window.dataProcessor.procesarDatosCompletos(participantes);
                }
                
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ Error en carga alternativa:', error);
            return false;
        }
    }

    mostrarCarga(titulo, texto) {
        if (window.Swal) {
            Swal.fire({
                title: titulo,
                text: texto,
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
        } else {
            console.log(titulo + ': ' + texto);
        }
    }

    ocultarCarga() {
        if (window.Swal) {
            Swal.close();
        }
    }

    cargarDatosDemo() {
        console.log('Cargando datos de demostración...');
        // ✅ CORREGIDO: Solo mostrar datos demo
        if (this.dataProcessor) {
            this.dataProcessor.mostrarDatosDemo();
        } else if (window.dataProcessor) {
            window.dataProcessor.mostrarDatosDemo();
        }
    }

    setFiltros(filtros) {
        this.filtrosActivos = { ...this.filtrosActivos, ...filtros };
        // También actualizar en la app principal
        if (this.app) {
            this.app.setFiltrosActivos(filtros);
        }
    }

    limpiarFiltros() {
        this.filtrosActivos = {};
        if (this.app) {
            this.app.setFiltrosActivos({});
        }
    }

    async aplicarFiltrosCombinados(fechaInicio, fechaFin, tipoReserva, estado) {
        try {
            if (window.Swal) {
                Swal.fire({
                    title: 'Aplicando filtros...',
                    text: 'Filtrando datos por criterios seleccionados',
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading()
                });
            }

            console.log('Aplicando filtros:', { fechaInicio, fechaFin, tipoReserva, estado});

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

            // FILTRO FECHAS
            if (fechaInicio && fechaFin) {
                query = query
                    .gte('reservas.fecha_reserva', fechaInicio + 'T00:00:00')
                    .lte('reservas.fecha_reserva', fechaFin + 'T23:59:59');
            }

            // FILTRO TIPO RESERVA
            if (tipoReserva && tipoReserva !== '' && tipoReserva !== 'todas') {
                query = query.eq('reservas.tipo_reserva', tipoReserva.toLowerCase());
            }

            // 🚨 FILTRO ESTADO DE RESERVA CORREGIDO
            if (estado && estado !== '' && estado !== 'todas') {
                query = query.eq('reservas.estado', estado.toLowerCase());
            }

            const { data: participantesFiltrados, error } = await query;

            if (error) throw error;

            if (participantesFiltrados?.length > 0) {

                // si tienes dataProcessor lo usamos
                if (this.dataProcessor) {
                    this.dataProcessor.procesarDatosCompletos(participantesFiltrados);
                }

                Swal.close();
                Swal.fire({
                    icon: "success",
                    title: "Filtros aplicados",
                    text: `Resultados: ${participantesFiltrados.length} participantes`,
                    timer: 2000,
                    showConfirmButton: false
                });

            } else {
                Swal.close();
                Swal.fire({
                    icon: "info",
                    title: "Sin resultados",
                    text: "No se encontraron datos",
                });
            }

        } catch (error) {
            console.error(error);
            Swal.close();
            Swal.fire({
                icon: "error",
                title: "Error",
                text: error.message
            });
        }
    }
}

const dataLoader = new DataLoader();