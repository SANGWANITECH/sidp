export const formatCurrency = (amount, currency = 'MWK') => {
    return `${currency} ${Number(amount).toLocaleString('en-MW', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }
  
  export const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-MW', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  
  export const formatDateShort = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-MW', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }
  
  export const truncate = (str, length = 20) => {
    if (!str) return ''
    return str.length > length ? str.substring(0, length) + '...' : str
  }
  
  export const getStatusColor = (status) => {
    const colors = {
      completed: '#1A7A4A',
      pending: '#B7490A',
      processing: '#1A6FA8',
      failed: '#B03030',
    }
    return colors[status] || '#5A6E82'
  }