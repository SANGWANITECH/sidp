import client from './client'

export const registerDevice = (public_key_jwk, device_label) =>
  client.post('/devices/register', { public_key_jwk, device_label })

export const getMyDevices = () =>
  client.get('/devices/')

export const revokeDevice = (device_id) =>
  client.delete(`/devices/${device_id}`)