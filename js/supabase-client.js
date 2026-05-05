// supabase-client.js - Versión SIMPLE y DIRECTA
const SUPABASE_URL = 'https://umncnddwzmjxgmvisvqz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtbmNuZGR3em1qeGdtdmlzdnF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NDIyNzksImV4cCI6MjA3ODExODI3OX0.ODvus28cTCTD8gGewQ2sAZ8PcXbEe4CIy_zv6bip8J0';

// Crear el cliente si no existe
if (!window.supabaseClient) {
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase client creado');
}

// Alias para compatibilidad
if (!window.supabase) {
    window.supabase = window.supabaseClient;
}

// Verificar que funciona
console.log('🔍 Test: supabase.from es', typeof window.supabase.from);