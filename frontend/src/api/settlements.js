import client from './client'

export const runSettlement = (settlement_date = null) =>
  client.post('/settlements/run', { settlement_date })

export const getSettlementHistory = () =>
  client.get('/settlements/history')

export const getSettlementReport = (date) =>
  client.get(`/settlements/report/${date}`)