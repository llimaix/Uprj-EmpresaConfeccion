import { query } from './src/db.js'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config()

async function testDatabase() {
  console.log('🔍 Probando conexión a la base de datos...')
  
  try {
    // Prueba 1: Consulta básica de conteo
    console.log('\n1. Consulta de conteo básica:')
    const countResult = await query(`
      SELECT 
        COUNT(DISTINCT tipo) as tipos_unicos,
        COUNT(*) as total_productos
      FROM producto
    `)
    console.log('Resultado:', countResult.rows[0])

    // Prueba 2: Todos los productos
    console.log('\n2. Todos los productos en la tabla:')
    const allProducts = await query(`SELECT id_producto, nombre, tipo FROM producto ORDER BY id_producto`)
    console.log(`Total productos encontrados: ${allProducts.rows.length}`)
    allProducts.rows.forEach((row, index) => {
      console.log(`${index + 1}. ID: ${row.ID_PRODUCTO}, Nombre: ${row.NOMBRE}, Tipo: ${row.TIPO}`)
    })

    // Prueba 3: Productos agrupados por tipo
    console.log('\n3. Productos agrupados por tipo:')
    const typeCount = await query(`
      SELECT tipo, COUNT(*) as cantidad
      FROM producto 
      GROUP BY tipo 
      ORDER BY tipo
    `)
    typeCount.rows.forEach(row => {
      console.log(`Tipo: ${row.TIPO} - Cantidad: ${row.CANTIDAD}`)
    })

    // Prueba 4: Verificar si hay registros nulos o vacíos
    console.log('\n4. Verificar registros con valores nulos:')
    const nullCheck = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN nombre IS NULL OR nombre = '' THEN 1 END) as nombres_nulos,
        COUNT(CASE WHEN tipo IS NULL OR tipo = '' THEN 1 END) as tipos_nulos
      FROM producto
    `)
    console.log('Registros nulos:', nullCheck.rows[0])

  } catch (error) {
    console.error('❌ Error al probar la base de datos:', error)
  }
}

testDatabase()