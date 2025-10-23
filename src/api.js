import axios from 'axios'

// Define tu API base por variable de entorno en el deploy (o edítalo localmente)
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000
})
