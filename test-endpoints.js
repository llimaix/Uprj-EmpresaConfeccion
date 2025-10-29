import fetch from 'node-fetch';

async function testEndpoints() {
  const baseUrl = 'http://localhost:3001';
  
  console.log('🧪 Probando endpoints...');
  
  const endpoints = [
    '/health',
    '/personas',
    '/personas/debug',
    '/productos',
    '/empleados',
    '/instalaciones',
    '/finanzas'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Probando ${endpoint}:`);
      const response = await fetch(`${baseUrl}${endpoint}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Status: ${response.status}`);
        
        if (endpoint === '/personas/debug') {
          console.log('📊 Debug info:', data);
        } else if (endpoint === '/personas') {
          console.log(`📋 Personas encontradas: ${data.personas?.length || 0}`);
          if (data.personas?.length > 0) {
            console.log('🔍 Primera persona:', data.personas[0]);
          }
        } else if (endpoint === '/productos') {
          console.log(`📋 Productos encontrados: ${data.rows?.length || 0}`);
          if (data.rows?.length > 0) {
            console.log('🔍 Primer producto:', data.rows[0]);
          }
        } else if (data.message || data.status) {
          console.log(`📄 Respuesta: ${data.message || data.status}`);
        } else {
          console.log(`📊 Datos recibidos: ${JSON.stringify(data).substring(0, 200)}...`);
        }
      } else {
        console.log(`❌ Error ${response.status}: ${response.statusText}`);
        const errorText = await response.text();
        console.log(`🔍 Detalle: ${errorText.substring(0, 200)}...`);
      }
    } catch (error) {
      console.log(`💥 Error de conexión: ${error.message}`);
    }
  }
}

// Solo ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testEndpoints();
}