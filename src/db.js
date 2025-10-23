import oracledb from 'oracledb'

// Usar Thin mode por defecto en Lambda Node 18+ (no requiere initOracleClient)
let pool

export async function getPool(){
  if (pool) return pool
  const {
    ORACLE_HOST, ORACLE_PORT, ORACLE_SERVICE,
    ORACLE_USER, ORACLE_PASSWORD,
    ORACLE_POOL_MIN='1', ORACLE_POOL_MAX='4'
  } = process.env

  const connectString = `${ORACLE_HOST}:${ORACLE_PORT}/${ORACLE_SERVICE}`

  pool = await oracledb.createPool({
    user: ORACLE_USER,
    password: ORACLE_PASSWORD,
    connectString,
    poolMin: Number(ORACLE_POOL_MIN),
    poolMax: Number(ORACLE_POOL_MAX),
    poolIncrement: 1
  })
  return pool
}

export async function query(sql, binds = {}, opts = {}){
  const p = await getPool()
  const conn = await p.getConnection()
  try{
    const res = await conn.execute(sql, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: false, ...opts })
    return res
  } finally {
    await conn.close()
  }
}

export async function exec(sql, binds = {}, opts = {}){
  const p = await getPool()
  const conn = await p.getConnection()
  try{
    const res = await conn.execute(sql, binds, { autoCommit: true, ...opts })
    return res
  } finally {
    await conn.close()
  }
}
