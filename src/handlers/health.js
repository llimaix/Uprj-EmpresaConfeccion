import { ok } from '../util.js'
export const handler = async () => ok({ status: 'ok', ts: new Date().toISOString() })
