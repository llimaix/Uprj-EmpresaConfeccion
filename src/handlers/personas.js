import { exec } from '../db.js'
import { ok, bad } from '../util.js'

export const crear = async (event) => {
  try{
    const body = JSON.parse(event.body || '{}')
    const { nombre, tipo } = body
    if(!nombre || !tipo) return bad('nombre y tipo son obligatorios', 400)

    // Usando la secuencia del esquema para el PK
    const sql = `
      INSERT INTO Persona (id_persona, nombre, tipo)
      VALUES (seq_persona.NEXTVAL, :nombre, :tipo)
      RETURNING id_persona INTO :id_persona
    `
    const binds = {
      nombre, tipo,
      id_persona: { dir: 3003, type: 2002 } // oracledb.BIND_OUT / NUMBER (evitamos import explícito)
    }

    const res = await exec(sql, binds)
    const id = res.outBinds?.id_persona?.[0]
    return ok({ id, nombre, tipo })
  }catch(e){
    console.error(e)
    return bad(e.message)
  }
}
