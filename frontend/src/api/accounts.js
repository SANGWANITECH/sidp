import client from './client'

export const getMyAccounts = () =>
  client.get('/accounts/')

export const createAccount = (institution_code) =>
  client.post('/accounts/', { institution_code })

export const getInstitutions = () =>
  client.get('/institutions/')