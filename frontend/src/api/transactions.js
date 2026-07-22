import client from './client'

export const sendPayment = (data) =>
  client.post('/transactions/', data)

export const getAccountTransactions = (account_number, limit = 20, offset = 0) =>
  client.get(`/transactions/account/${account_number}?limit=${limit}&offset=${offset}`)

export const getTransaction = (transaction_id) =>
  client.get(`/transactions/${transaction_id}`)