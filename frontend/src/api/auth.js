import client from './client'

export const login = (email, password) =>
  client.post('/auth/login', { email, password })

export const register = (full_name, phone, email, password) =>
  client.post('/auth/register', { full_name, phone, email, password })

export const logoutUser = (refresh_token) =>
  client.post('/auth/logout', { refresh_token })

export const getNonce = () =>
  client.post('/auth/nonce')