import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { DB } from '../services/database'
import { formatNumber } from '../utils/formatters'

export default function CreateInvoicePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('id')

  const [clients, setClients] = useState([])
  const [stock, setStock] = useState([])
  
  const [formData, setFormData] = useState({
    number: '',
    date: new Date().toISOString().split('T')[0],
    status: 'draft', // 'draft', 'confirmed', 'cancelled'
    type: 'standard', // 'standard', 'proforma', 'credit_note'
    client: {
      name: '',
      phone: '',
      address: ''
    },
    items: [],
    notes: ''
  })

  const [currentItem, setCurrentItem] = useState({
    stockReferenceId: '',
    reference: '', // Référence de l'article
    purchasePrice: null,
    description: '',
    detailLines: [{ quantity: '', quantityUnit: 'feuilles', length: '', lengthUnit: 'm' }],
    totalQuantity: '',
    unit: 'm',
    unitPrice: ''
  })

  useEffect(() => {
    loadData()
    if (editId) {
      loadInvoice(editId)
    } else {
      setFormData(prev => ({ ...prev, number: DB.getNextInvoiceNumber() }))
    }
  }, [editId])

  const loadData = () => {
    setClients(DB.getClients())
    setStock(DB.getStock())
  }

  const loadInvoice = (id) => {
    const invoice = DB.getInvoiceById(id)
    if (invoice) {
      setFormData({
        number: invoice.number,
        date: invoice.date,
        status: invoice.status || 'draft',
        type: invoice.type || 'standard',
        client: invoice.client,
        items: invoice.items,
        notes: invoice.notes || ''
      })
    }
  }

  const selectClient = (clientId) => {
    const client = clients.find(c => c.id === clientId)
    if (client) {
      setFormData({
        ...formData,
        client: {
          name: client.name,
          phone: client.phone || '',
          address: client.address || ''
        }
      })
    }
  }

  const selectStockItem = (stockId) => {
    const item = stock.find(s => s.id === stockId)
    if (item) {
      setCurrentItem({
        ...currentItem,
        stockReferenceId: stockId,
        reference: item.reference || '',
        purchasePrice: item.purchasePrice || null,
        description: item.name,
        unit: item.purchaseUnit || 'pièce',
        unitPrice: item.unitPrice?.toString() || ''
      })
    } else {
      // Réinitialiser si aucun article sélectionné
      setCurrentItem({
        ...currentItem,
        stockReferenceId: '',
        reference: '',
        purchasePrice: null
      })
    }
  }

  const addDetailLine = () => {
    setCurrentItem({
      ...currentItem,
      detailLines: [...currentItem.detailLines, { quantity: '', quantityUnit: 'feuilles', length: '', lengthUnit: 'm' }]
    })
  }

  const removeDetailLine = (index) => {
    const newLines = currentItem.detailLines.filter((_, i) => i !== index)
    setCurrentItem({
      ...currentItem,
      detailLines: newLines.length > 0 ? newLines : [{ quantity: '', quantityUnit: 'feuilles', length: '', lengthUnit: 'm' }]
    })
  }

  const updateDetailLine = (index, field, value) => {
    const newLines = [...currentItem.detailLines]
    newLines[index] = { ...newLines[index], [field]: value }
    setCurrentItem({
      ...currentItem,
      detailLines: newLines
    })
  }

  const calculateLineTotal = (line) => {
    const qty = parseFloat(line.quantity) || 1
    const len = parseFloat(line.length) || 0
    return len > 0 ? qty * len : qty
  }

  const calculateTotalFromLines = () => {
    if (currentItem.detailLines.length === 0) return 0
    return currentItem.detailLines.reduce((sum, line) => {
      // Si au moins un champ est rempli
      if (line.quantity) {
        return sum + calculateLineTotal(line)
      }
      return sum
    }, 0)
  }

  const calculateMargin = () => {
    if (!currentItem.purchasePrice || !currentItem.unitPrice) {
      return null
    }

    const totalFromLines = calculateTotalFromLines()
    const quantity = totalFromLines > 0 ? totalFromLines : parseFloat(currentItem.totalQuantity) || 0

    if (quantity === 0) return null

    const unitPrice = parseFloat(currentItem.unitPrice)
    const purchasePrice = parseFloat(currentItem.purchasePrice)

    const purchaseCost = quantity * purchasePrice
    const saleTotal = quantity * unitPrice
    const margin = saleTotal - purchaseCost
    const marginPercent = (margin / purchaseCost) * 100

    return {
      purchaseCost,
      saleTotal,
      margin,
      marginPercent
    }
  }

  const addItem = () => {
    if (!currentItem.description.trim()) {
      alert('❌ Veuillez saisir une désignation')
      return
    }

    // Vérifier si une référence est nécessaire
    if (!currentItem.stockReferenceId && !currentItem.reference.trim()) {
      const shouldContinue = confirm('⚠️ Aucune référence n\'est mentionnée. Voulez-vous continuer ?')
      if (!shouldContinue) return
    }

    // Calculer la quantité totale depuis les lignes de détails
    const totalFromLines = calculateTotalFromLines()
    const finalQuantity = totalFromLines > 0 ? totalFromLines : parseFloat(currentItem.totalQuantity) || 0

    if (finalQuantity === 0) {
      alert('❌ Veuillez saisir la quantité totale ou au moins une ligne de détails')
      return
    }

    if (!currentItem.unitPrice) {
      alert('❌ Veuillez saisir le prix unitaire')
      return
    }

    const unitPrice = parseFloat(currentItem.unitPrice)

    // Formater les lignes de détails pour l'affichage
    const formattedLines = currentItem.detailLines
      .filter(line => line.quantity) // Garder seulement les lignes avec quantité
      .map(line => {
        const qty = parseFloat(line.quantity) || 1
        const len = parseFloat(line.length) || 0
        const total = len > 0 ? qty * len : qty
        
        let display = `${qty} ${line.quantityUnit || 'pièce'}`
        if (len > 0) {
          display += ` × ${len}${line.lengthUnit || 'm'} = ${total}${line.lengthUnit || 'm'}`
        }
        
        return {
          quantity: qty,
          quantityUnit: line.quantityUnit || 'pièce',
          length: len,
          lengthUnit: line.lengthUnit || 'm',
          total: total,
          display: display
        }
      })

    const newItem = {
      id: Date.now(),
      stockReferenceId: currentItem.stockReferenceId || null,
      reference: currentItem.reference || '',
      purchasePrice: currentItem.purchasePrice,
      description: currentItem.description,
      detailLines: formattedLines,
      quantity: finalQuantity,
      unit: currentItem.unit,
      unitPrice,
      total: finalQuantity * unitPrice
    }

    // Calculer la marge si applicable
    if (currentItem.purchasePrice) {
      const marginData = calculateMargin()
      if (marginData) {
        newItem.purchaseCost = finalQuantity * currentItem.purchasePrice
        newItem.margin = newItem.total - newItem.purchaseCost
        newItem.marginPercent = (newItem.margin / newItem.purchaseCost) * 100
      }
    }

    setFormData({
      ...formData,
      items: [...formData.items, newItem]
    })

    // Réinitialiser le formulaire
    setCurrentItem({
      stockReferenceId: '',
      reference: '',
      purchasePrice: null,
      description: '',
      detailLines: [{ quantity: '', quantityUnit: 'feuilles', length: '', lengthUnit: 'm' }],
      totalQuantity: '',
      unit: 'm',
      unitPrice: ''
    })
  }

  const removeItem = (id) => {
    setFormData({
      ...formData,
      items: formData.items.filter(item => item.id !== id)
    })
  }

  const total = formData.items.reduce((sum, item) => sum + item.total, 0)
  const marginInfo = calculateMargin()

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.client.name.trim()) {
      alert('❌ Veuillez saisir le nom du client')
      return
    }

    if (formData.items.length === 0) {
      alert('❌ Veuillez ajouter au moins un article')
      return
    }

    const invoiceData = {
      ...formData,
      total,
      status: formData.status,
      type: formData.type
    }

    try {
      if (editId) {
        DB.updateInvoice(editId, invoiceData)
        alert('✅ Facture modifiée avec succès')
      } else {
        DB.addInvoice(invoiceData)
        alert('✅ Facture créée avec succès')
      }
      navigate('/')
    } catch (error) {
      alert('❌ Erreur lors de l\'enregistrement')
      console.error(error)
    }
  }

  const getInvoiceTypeLabel = (type) => {
    const types = {
      'standard': 'Facture',
      'proforma': 'Facture Proforma',
      'credit_note': 'Facture d\'Avoir'
    }
    return types[type] || 'Facture'
  }

  const getStatusLabel = (status) => {
    const statuses = {
      'draft': 'Brouillon',
      'confirmed': 'Confirmée',
      'cancelled': 'Annulée'
    }
    return statuses[status] || 'Brouillon'
  }

  const getStatusColor = (status) => {
    const colors = {
      'draft': '#ff9800',
      'confirmed': '#4caf50',
      'cancelled': '#f44336'
    }
    return colors[status] || '#999'
  }

  return (
    <div className="container">
      <h1>{editId ? '✏️ Modifier la facture' : '➕ Nouvelle facture'}</h1>

      <form onSubmit={handleSubmit}>
        {/* En-tête facture */}
        <div className="card">
          <h2>📋 Informations de la facture</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                N° de facture <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                placeholder="FACT-2026-001"
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                Date <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                Type de facture
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="standard">Facture</option>
                <option value="proforma">Facture Proforma</option>
                <option value="credit_note">Facture d'Avoir</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                Statut
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={{ background: getStatusColor(formData.status), color: 'white', fontWeight: 'bold' }}
              >
                <option value="draft">📝 Brouillon</option>
                <option value="confirmed">✅ Confirmée</option>
                <option value="cancelled">❌ Annulée</option>
              </select>
            </div>
          </div>

          {formData.status === 'confirmed' && (
            <div style={{ 
              marginTop: '15px', 
              padding: '12px', 
              background: '#d4edda',
              border: '1px solid #28a745',
              color: '#155724',
              borderRadius: '5px'
            }}>
              <strong>✅ Facture confirmée</strong> - Le stock sera automatiquement mis à jour lors de l'enregistrement
            </div>
          )}
        </div>

        {/* Informations client */}
        <div className="card">
          <h2>👤 Client</h2>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
              Sélectionner un client existant
            </label>
            <select onChange={(e) => selectClient(e.target.value)} defaultValue="">
              <option value="">-- Nouveau client --</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name} {client.phone && `(${client.phone})`}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                Nom <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.client.name}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  client: { ...formData.client, name: e.target.value }
                })}
                placeholder="Nom du client"
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                Téléphone
              </label>
              <input
                type="tel"
                value={formData.client.phone}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  client: { ...formData.client, phone: e.target.value }
                })}
                placeholder="0345476294"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
              Adresse
            </label>
            <input
              type="text"
              value={formData.client.address}
              onChange={(e) => setFormData({ 
                ...formData, 
                client: { ...formData.client, address: e.target.value }
              })}
              placeholder="Adresse du client"
            />
          </div>
        </div>

        {/* Ajouter un article */}
        <div className="card" style={{ background: '#2a2a2a' }}>
          <h2>➕ Ajouter un article</h2>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
              Sélectionner depuis le stock (optionnel)
            </label>
            <select 
              onChange={(e) => selectStockItem(e.target.value)}
              value={currentItem.stockReferenceId}
              defaultValue=""
            >
              <option value="">-- Nouvel article --</option>
              {stock.map(item => {
                const qty = item.quantityAvailable || item.quantity || 0
                const isLow = item.minQuantity > 0 && qty <= item.minQuantity
                return (
                  <option key={item.id} value={item.id}>
                    {item.name} {item.reference && `(Réf: ${item.reference})`} - Stock: {qty} {item.purchaseUnit || item.unit}
                    {isLow && ' ⚠️ Stock bas'}
                  </option>
                )
              })}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                Désignation <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                value={currentItem.description}
                onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })}
                placeholder="Description de l'article"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                Référence
              </label>
              <input
                type="text"
                value={currentItem.reference}
                onChange={(e) => setCurrentItem({ ...currentItem, reference: e.target.value })}
                placeholder="Réf. article"
              />
            </div>
          </div>

          {/* Lignes de détails */}
          <div style={{ background: '#1a1a1a', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
            <h3 style={{ marginBottom: '15px', fontSize: '1em' }}>📐 Détails (optionnel)</h3>
            
            <div>
              {currentItem.detailLines.map((line, index) => {
                const hasQuantity = line.quantity !== ''
                const hasLength = line.length !== ''
                const lineTotal = calculateLineTotal(line)
                
                return (
                  <div 
                    key={index} 
                    style={{ 
                      marginBottom: '15px', 
                      paddingBottom: '15px',
                      borderBottom: index < currentItem.detailLines.length - 1 ? '1px solid #333' : 'none'
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em' }}>
                          Nombre
                        </label>
                        <input
                          type="number"
                          value={line.quantity}
                          onChange={(e) => updateDetailLine(index, 'quantity', e.target.value)}
                          placeholder="1"
                          step="0.01"
                          min="0"
                          style={{ fontSize: '0.9em' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em' }}>
                          Unité
                        </label>
                        <select
                          value={line.quantityUnit}
                          onChange={(e) => updateDetailLine(index, 'quantityUnit', e.target.value)}
                          style={{ fontSize: '0.9em' }}
                        >
                          <option value="feuilles">feuilles</option>
                          <option value="pièces">pièces</option>
                          <option value="sacs">sacs</option>
                          <option value="paquets">paquets</option>
                          <option value="sachets">sachets</option>
                          <option value="cartons">cartons</option>
                          <option value="unités">unités</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em' }}>
                          Taille (optionnel)
                        </label>
                        <input
                          type="number"
                          value={line.length}
                          onChange={(e) => updateDetailLine(index, 'length', e.target.value)}
                          placeholder="0"
                          step="0.01"
                          min="0"
                          style={{ fontSize: '0.9em' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em' }}>
                          Unité taille
                        </label>
                        <select
                          value={line.lengthUnit}
                          onChange={(e) => updateDetailLine(index, 'lengthUnit', e.target.value)}
                          style={{ fontSize: '0.9em' }}
                          disabled={!line.length}
                        >
                          <option value="m">m</option>
                          <option value="cm">cm</option>
                          <option value="mm">mm</option>
                          <option value="kg">kg</option>
                          <option value="g">g</option>
                          <option value="L">L</option>
                          <option value="mL">mL</option>
                        </select>
                      </div>

                      <div style={{ paddingTop: '20px' }}>
                        {currentItem.detailLines.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => removeDetailLine(index)}
                            style={{ padding: '8px 15px' }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {hasQuantity && (
                      <div style={{ 
                        marginTop: '8px', 
                        padding: '8px', 
                        background: '#1a1a1a',
                        borderRadius: '3px',
                        fontSize: '0.9em',
                        color: '#4caf50'
                      }}>
                        Aperçu: {parseFloat(line.quantity) || 1} {line.quantityUnit}
                        {hasLength && ` × ${parseFloat(line.length)}${line.lengthUnit} = ${lineTotal}${line.lengthUnit}`}
                      </div>
                    )}
                  </div>
                )
              })}
              
              <button
                type="button"
                className="btn btn-secondary"
                onClick={addDetailLine}
                style={{ padding: '8px 15px', fontSize: '0.9em', marginTop: '10px' }}
              >
                + Ajouter une ligne
              </button>

              {calculateTotalFromLines() > 0 && (
                <div style={{ 
                  marginTop: '15px', 
                  padding: '12px', 
                  background: '#2a4a2a',
                  borderRadius: '5px',
                  fontWeight: 'bold',
                  color: '#4caf50'
                }}>
                  Total calculé depuis les lignes: {calculateTotalFromLines()} {currentItem.unit}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                Quantité totale {calculateTotalFromLines() === 0 && <span style={{ color: 'red' }}>*</span>}
              </label>
              <input
                type="number"
                value={currentItem.totalQuantity}
                onChange={(e) => setCurrentItem({ ...currentItem, totalQuantity: e.target.value })}
                placeholder={calculateTotalFromLines() > 0 ? `Auto: ${calculateTotalFromLines()}` : "0"}
                step="0.01"
                min="0"
                disabled={calculateTotalFromLines() > 0}
                style={{ 
                  background: calculateTotalFromLines() > 0 ? '#2a2a2a' : '#1a1a1a',
                  cursor: calculateTotalFromLines() > 0 ? 'not-allowed' : 'text'
                }}
              />
              <small style={{ color: '#999', fontSize: '0.85em' }}>
                {calculateTotalFromLines() > 0 
                  ? 'Calculé automatiquement depuis les lignes' 
                  : 'Ou remplir les lignes de détails ci-dessus'
                }
              </small>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Unité</label>
              <select
                value={currentItem.unit}
                onChange={(e) => setCurrentItem({ ...currentItem, unit: e.target.value })}
              >
                <option value="m">m</option>
                <option value="pièce">pièce</option>
                <option value="kg">kg</option>
                <option value="m²">m²</option>
                <option value="m³">m³</option>
                <option value="litre">litre</option>
                <option value="sac">sac</option>
                <option value="paquet">paquet</option>
                <option value="sachet">sachet</option>
                <option value="forfait">forfait</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                Prix unitaire (Ar) <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="number"
                value={currentItem.unitPrice}
                onChange={(e) => setCurrentItem({ ...currentItem, unitPrice: e.target.value })}
                placeholder="0"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          {marginInfo && (
            <div style={{ 
              background: marginInfo.marginPercent >= 20 ? '#d4edda' : marginInfo.marginPercent >= 10 ? '#fff3cd' : '#f8d7da',
              border: `1px solid ${marginInfo.marginPercent >= 20 ? '#28a745' : marginInfo.marginPercent >= 10 ? '#ffc107' : '#dc3545'}`,
              color: marginInfo.marginPercent >= 20 ? '#155724' : marginInfo.marginPercent >= 10 ? '#856404' : '#721c24',
              padding: '12px 15px',
              borderRadius: '5px',
              marginBottom: '15px',
              fontSize: '0.95em'
            }}>
              <strong>📊 Calcul de marge :</strong>
              <div style={{ marginTop: '5px' }}>
                Coût d'achat: {formatNumber(marginInfo.purchaseCost)} Ar | 
                Prix de vente: {formatNumber(marginInfo.saleTotal)} Ar | 
                Marge: {formatNumber(marginInfo.margin)} Ar ({marginInfo.marginPercent.toFixed(1)}%)
                {marginInfo.marginPercent < 10 && ' ⚠️ Marge faible'}
                {marginInfo.marginPercent >= 20 && ' ✅ Bonne marge'}
              </div>
            </div>
          )}

          <button
            type="button"
            className="btn btn-primary"
            onClick={addItem}
            style={{ width: '100%', padding: '12px' }}
          >
            ✅ Ajouter à la facture
          </button>
        </div>

        {formData.items.length > 0 && (
          <div className="card">
            <h2>📋 Articles ajoutés ({formData.items.length})</h2>
            <table>
              <thead>
                <tr>
                  <th>Désignation</th>
                  <th style={{ width: '100px' }}>Quantité</th>
                  <th style={{ width: '120px' }}>P.U</th>
                  <th style={{ width: '140px' }}>Total</th>
                  <th style={{ width: '80px' }}></th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 'bold' }}>{item.description}</div>
                      {item.reference && (
                        <div style={{ fontSize: '0.85em', color: '#4caf50', marginTop: '3px' }}>
                          Réf: {item.reference}
                        </div>
                      )}
                      {item.detailLines && item.detailLines.length > 0 && (
                        <div style={{ fontSize: '0.9em', color: '#999', marginTop: '5px' }}>
                          {item.detailLines.map((line, idx) => (
                            <div key={idx}>• {line.display}</div>
                          ))}
                        </div>
                      )}
                      {item.marginPercent !== undefined && (
                        <div style={{ 
                          fontSize: '0.85em', 
                          marginTop: '5px',
                          color: item.marginPercent >= 20 ? '#4caf50' : item.marginPercent >= 10 ? '#ff9800' : '#f44336'
                        }}>
                          Marge: {item.marginPercent.toFixed(1)}%
                        </div>
                      )}
                    </td>
                    <td>{item.quantity} {item.unit}</td>
                    <td>{formatNumber(item.unitPrice)} Ar</td>
                    <td><strong>{formatNumber(item.total)} Ar</strong></td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => removeItem(item.id)}
                        style={{ padding: '6px 12px' }}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
                <tr style={{ background: '#3a3a3a', fontWeight: 'bold' }}>
                  <td colSpan="3" style={{ textAlign: 'right' }}>TOTAL</td>
                  <td colSpan="2" style={{ color: 'var(--accent)', fontSize: '1.2em' }}>
                    {formatNumber(total)} Ar
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <div className="card">
          <h2>📝 Notes</h2>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Notes additionnelles (optionnel)"
            rows="3"
          />
        </div>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
          <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
            {editId ? '💾 Modifier la facture' : '✅ Créer la facture'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/')}
            style={{ flex: 1 }}
          >
            ❌ Annuler
          </button>
        </div>
      </form>
    </div>
  )
}
