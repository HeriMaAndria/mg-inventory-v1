const KEYS = {
  INVOICES: 'invoices_v2',
  CLIENTS: 'clients_v2',
  STOCK: 'stock_v2',
  SETTINGS: 'settings_v2'
}

export const DB = {
  init() {
    if (!localStorage.getItem(KEYS.INVOICES)) {
      localStorage.setItem(KEYS.INVOICES, JSON.stringify([]))
    }
    if (!localStorage.getItem(KEYS.CLIENTS)) {
      localStorage.setItem(KEYS.CLIENTS, JSON.stringify([]))
    }
    if (!localStorage.getItem(KEYS.STOCK)) {
      localStorage.setItem(KEYS.STOCK, JSON.stringify([]))
    }
    if (!localStorage.getItem(KEYS.SETTINGS)) {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify({
        companyName: 'FOIBENNY TSARA TOLES BY PASS',
        companyActivity: 'VENTES DES MATÉRIAUX DE CONSTRUCTION',
        companyAddress: 'Près Lavage Raitra',
        companyStat: '47521201201901044',
        companyNif: '6003278760',
        companyPhone: '0345476294 / 0389015842',
        responsibleNumber: ''
      }))
    }
  },

  // INVOICES
  getInvoices() {
    const data = localStorage.getItem(KEYS.INVOICES)
    return data ? JSON.parse(data) : []
  },

  saveInvoices(invoices) {
    localStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices))
  },

  addInvoice(invoice) {
    const invoices = this.getInvoices()
    invoice.id = this.generateId()
    invoice.createdAt = new Date().toISOString()
    invoice.updatedAt = new Date().toISOString()
    invoice.status = invoice.status || 'draft' // 'draft', 'confirmed', 'cancelled'
    invoice.type = invoice.type || 'standard' // 'standard', 'proforma', 'credit_note'
    
    // Si la facture est confirmée, mettre à jour le stock
    if (invoice.status === 'confirmed') {
      this.updateStockFromInvoice(invoice)
    }
    
    invoices.push(invoice)
    this.saveInvoices(invoices)
    this.updateOrAddClient(invoice.client)
    return invoice
  },

  updateInvoice(id, updatedInvoice) {
    const invoices = this.getInvoices()
    const index = invoices.findIndex(inv => inv.id === id)
    if (index !== -1) {
      const oldInvoice = invoices[index]
      updatedInvoice.id = id
      updatedInvoice.updatedAt = new Date().toISOString()
      updatedInvoice.createdAt = invoices[index].createdAt
      updatedInvoice.status = updatedInvoice.status || oldInvoice.status || 'draft'
      updatedInvoice.type = updatedInvoice.type || oldInvoice.type || 'standard'
      
      // Si le statut passe de draft/cancelled à confirmed, mettre à jour le stock
      if (updatedInvoice.status === 'confirmed' && oldInvoice.status !== 'confirmed') {
        this.updateStockFromInvoice(updatedInvoice)
      }
      // Si le statut passe de confirmed à draft/cancelled, restaurer le stock
      else if (oldInvoice.status === 'confirmed' && updatedInvoice.status !== 'confirmed') {
        this.restoreStockFromInvoice(oldInvoice)
      }
      
      invoices[index] = updatedInvoice
      this.saveInvoices(invoices)
      this.updateOrAddClient(updatedInvoice.client)
      return true
    }
    return false
  },

  deleteInvoice(id) {
    const invoices = this.getInvoices()
    const filtered = invoices.filter(inv => inv.id !== id)
    this.saveInvoices(filtered)
    return true
  },

  getInvoiceById(id) {
    const invoices = this.getInvoices()
    return invoices.find(inv => inv.id === id)
  },

  getNextInvoiceNumber() {
    const invoices = this.getInvoices()
    const currentYear = new Date().getFullYear()
    const thisYearInvoices = invoices.filter(inv => {
      const invYear = new Date(inv.date).getFullYear()
      return invYear === currentYear
    })
    const nextNumber = thisYearInvoices.length + 1
    return `FACT-${currentYear}-${String(nextNumber).padStart(3, '0')}`
  },

  // CLIENTS
  getClients() {
    const data = localStorage.getItem(KEYS.CLIENTS)
    return data ? JSON.parse(data) : []
  },

  saveClients(clients) {
    localStorage.setItem(KEYS.CLIENTS, JSON.stringify(clients))
  },

  addClient(client) {
    const clients = this.getClients()
    client.id = this.generateId()
    client.createdAt = new Date().toISOString()
    client.totalPurchases = 0
    clients.push(client)
    this.saveClients(clients)
    return client
  },

  updateClient(id, updatedClient) {
    const clients = this.getClients()
    const index = clients.findIndex(c => c.id === id)
    if (index !== -1) {
      updatedClient.id = id
      updatedClient.createdAt = clients[index].createdAt
      updatedClient.totalPurchases = clients[index].totalPurchases
      clients[index] = updatedClient
      this.saveClients(clients)
      return true
    }
    return false
  },

  deleteClient(id) {
    const clients = this.getClients()
    const filtered = clients.filter(c => c.id !== id)
    this.saveClients(filtered)
    return true
  },

  updateOrAddClient(clientData) {
    if (!clientData.name) return
    const clients = this.getClients()
    const existingIndex = clients.findIndex(c => 
      c.name.toLowerCase() === clientData.name.toLowerCase()
    )
    
    const client = {
      name: clientData.name,
      phone: clientData.phone || '',
      address: clientData.address || '',
      lastPurchaseDate: new Date().toISOString()
    }
    
    if (existingIndex !== -1) {
      client.id = clients[existingIndex].id
      client.createdAt = clients[existingIndex].createdAt
      client.totalPurchases = (clients[existingIndex].totalPurchases || 0) + 1
      clients[existingIndex] = client
    } else {
      client.id = this.generateId()
      client.createdAt = new Date().toISOString()
      client.totalPurchases = 1
      clients.push(client)
    }
    this.saveClients(clients)
  },

  // STOCK
  getStock() {
    const data = localStorage.getItem(KEYS.STOCK)
    return data ? JSON.parse(data) : []
  },

  saveStock(stock) {
    localStorage.setItem(KEYS.STOCK, JSON.stringify(stock))
  },

  addStockItem(item) {
    const stock = this.getStock()
    item.id = this.generateId()
    item.createdAt = new Date().toISOString()
    item.lastUpdated = new Date().toISOString()
    
    // Assurer la compatibilité avec le nouveau système
    if (!item.purchaseUnit) {
      item.purchaseUnit = item.unit || 'pièce'
    }
    if (!item.purchasePrice && item.unitPrice) {
      item.purchasePrice = item.unitPrice
    }
    
    stock.push(item)
    this.saveStock(stock)
    return item
  },

  updateStockItem(id, updatedItem) {
    const stock = this.getStock()
    const index = stock.findIndex(s => s.id === id)
    if (index !== -1) {
      updatedItem.id = id
      updatedItem.createdAt = stock[index].createdAt
      updatedItem.lastUpdated = new Date().toISOString()
      stock[index] = updatedItem
      this.saveStock(stock)
      return true
    }
    return false
  },

  deleteStockItem(id) {
    const stock = this.getStock()
    const filtered = stock.filter(s => s.id !== id)
    this.saveStock(filtered)
    return true
  },

  // Méthode pour mettre à jour le stock lors de la confirmation de facture
  updateStockFromInvoice(invoice) {
    const stock = this.getStock()
    let updated = false
    
    invoice.items.forEach(item => {
      if (item.stockReferenceId) {
        const stockIndex = stock.findIndex(s => s.id === item.stockReferenceId)
        if (stockIndex !== -1) {
          const currentQty = stock[stockIndex].quantityAvailable || 0
          stock[stockIndex].quantityAvailable = Math.max(0, currentQty - item.quantity)
          stock[stockIndex].quantity = stock[stockIndex].quantityAvailable
          stock[stockIndex].lastUpdated = new Date().toISOString()
          updated = true
        }
      }
    })
    
    if (updated) {
      this.saveStock(stock)
    }
  },

  // Méthode pour restaurer le stock si la facture est annulée
  restoreStockFromInvoice(invoice) {
    const stock = this.getStock()
    let updated = false
    
    invoice.items.forEach(item => {
      if (item.stockReferenceId) {
        const stockIndex = stock.findIndex(s => s.id === item.stockReferenceId)
        if (stockIndex !== -1) {
          const currentQty = stock[stockIndex].quantityAvailable || 0
          stock[stockIndex].quantityAvailable = currentQty + item.quantity
          stock[stockIndex].quantity = stock[stockIndex].quantityAvailable
          stock[stockIndex].lastUpdated = new Date().toISOString()
          updated = true
        }
      }
    })
    
    if (updated) {
      this.saveStock(stock)
    }
  },

  // Méthode pour ajouter de la quantité à un article existant
  addQuantityToStock(id, quantityToAdd) {
    const stock = this.getStock()
    const index = stock.findIndex(s => s.id === id)
    if (index !== -1) {
      const currentQty = stock[index].quantityAvailable || 0
      stock[index].quantityAvailable = currentQty + parseFloat(quantityToAdd)
      stock[index].quantity = stock[index].quantityAvailable
      stock[index].lastUpdated = new Date().toISOString()
      this.saveStock(stock)
      return true
    }
    return false
  },

  // Méthode pour confirmer une facture
  confirmInvoice(id) {
    const invoices = this.getInvoices()
    const index = invoices.findIndex(inv => inv.id === id)
    if (index !== -1 && invoices[index].status === 'draft') {
      invoices[index].status = 'confirmed'
      invoices[index].confirmedAt = new Date().toISOString()
      invoices[index].updatedAt = new Date().toISOString()
      this.updateStockFromInvoice(invoices[index])
      this.saveInvoices(invoices)
      return true
    }
    return false
  },

  // SETTINGS
  getSettings() {
    const data = localStorage.getItem(KEYS.SETTINGS)
    return data ? JSON.parse(data) : {}
  },

  saveSettings(settings) {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings))
  },

  // STATS
  getStats() {
    const invoices = this.getInvoices()
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    const monthTotal = invoices
      .filter(inv => {
        const invDate = new Date(inv.date)
        return invDate.getMonth() === currentMonth && 
               invDate.getFullYear() === currentYear
      })
      .reduce((sum, inv) => sum + inv.total, 0)
    
    const totalInvoices = invoices.length
    
    const lastInvoice = invoices.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    )[0]
    const lastClient = lastInvoice ? lastInvoice.client.name : '-'
    
    return {
      monthTotal,
      totalInvoices,
      lastClient
    }
  },

  // UTILS
  generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  },

  exportAllData() {
    return {
      invoices: this.getInvoices(),
      clients: this.getClients(),
      stock: this.getStock(),
      settings: this.getSettings(),
      exportDate: new Date().toISOString()
    }
  },

  importData(data) {
    if (data.invoices) this.saveInvoices(data.invoices)
    if (data.clients) this.saveClients(data.clients)
    if (data.stock) this.saveStock(data.stock)
    if (data.settings) this.saveSettings(data.settings)
  },

  resetAllData() {
    localStorage.removeItem(KEYS.INVOICES)
    localStorage.removeItem(KEYS.CLIENTS)
    localStorage.removeItem(KEYS.STOCK)
    localStorage.removeItem(KEYS.SETTINGS)
    this.init()
  }
}

DB.init()
