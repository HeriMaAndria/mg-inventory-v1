import { useState, useEffect } from 'react'
import { DB } from '../services/database'
import { formatNumber } from '../utils/formatters'

export default function StockPage() {
  const [stock, setStock] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showAddQuantityModal, setShowAddQuantityModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [addingQuantityItem, setAddingQuantityItem] = useState(null)
  const [quantityToAdd, setQuantityToAdd] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    category: 'AUTRE',
    name: '',
    reference: '',
    purchasePrice: '',
    purchaseUnit: 'mètre',
    unitPrice: '',
    quantityAvailable: '',
    minQuantity: '',
    notes: ''
  })

  useEffect(() => {
    loadStock()
  }, [])

  const loadStock = () => {
    const data = DB.getStock()
    setStock(data.sort((a, b) => a.name.localeCompare(b.name)))
  }

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        category: item.category || 'AUTRE',
        name: item.name,
        reference: item.reference || '',
        purchasePrice: item.purchasePrice || item.unitPrice || '',
        purchaseUnit: item.purchaseUnit || item.unit || 'mètre',
        unitPrice: item.unitPrice || '',
        quantityAvailable: item.quantityAvailable || item.quantity || '',
        minQuantity: item.minQuantity || '',
        notes: item.notes || ''
      })
    } else {
      setEditingItem(null)
      setFormData({
        category: 'AUTRE',
        name: '',
        reference: '',
        purchasePrice: '',
        purchaseUnit: 'mètre',
        unitPrice: '',
        quantityAvailable: '',
        minQuantity: '',
        notes: ''
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingItem(null)
  }

  const openAddQuantityModal = (item) => {
    setAddingQuantityItem(item)
    setQuantityToAdd('')
    setShowAddQuantityModal(true)
  }

  const closeAddQuantityModal = () => {
    setShowAddQuantityModal(false)
    setAddingQuantityItem(null)
    setQuantityToAdd('')
  }

  const handleAddQuantity = () => {
    if (!quantityToAdd || parseFloat(quantityToAdd) <= 0) {
      alert('❌ Veuillez saisir une quantité valide')
      return
    }

    const success = DB.addQuantityToStock(addingQuantityItem.id, parseFloat(quantityToAdd))
    if (success) {
      alert(`✅ ${quantityToAdd} ${addingQuantityItem.purchaseUnit || addingQuantityItem.unit} ajouté(s) à ${addingQuantityItem.name}`)
      loadStock()
      closeAddQuantityModal()
    } else {
      alert('❌ Erreur lors de l\'ajout de quantité')
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('❌ Le nom de l\'article est obligatoire')
      return
    }

    const itemData = {
      ...formData,
      purchasePrice: parseFloat(formData.purchasePrice) || 0,
      unitPrice: parseFloat(formData.unitPrice) || parseFloat(formData.purchasePrice) || 0,
      quantityAvailable: parseFloat(formData.quantityAvailable) || 0,
      quantity: parseFloat(formData.quantityAvailable) || 0, // Compatibilité
      minQuantity: parseFloat(formData.minQuantity) || 0,
      unit: formData.purchaseUnit // Compatibilité
    }

    if (editingItem) {
      DB.updateStockItem(editingItem.id, itemData)
      alert('✅ Article modifié avec succès')
    } else {
      DB.addStockItem(itemData)
      alert('✅ Article ajouté au stock')
    }
    loadStock()
    closeModal()
  }

  const deleteItem = (id, name) => {
    if (confirm(`Supprimer l'article "${name}" du stock ?`)) {
      DB.deleteStockItem(id)
      loadStock()
      alert('✅ Article supprimé')
    }
  }

  const filteredStock = stock.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.reference && item.reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.purchaseUnit && item.purchaseUnit.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const lowStockItems = stock.filter(item => {
    const qty = item.quantityAvailable || item.quantity || 0
    const min = item.minQuantity || 0
    return min > 0 && qty <= min
  })

  const totalValue = stock.reduce((sum, item) => {
    const price = item.purchasePrice || item.unitPrice || 0
    const qty = item.quantityAvailable || item.quantity || 0
    return sum + (qty * price)
  }, 0)

  const getCategoryBadge = (category) => {
    const badges = {
      'TÔLE': { icon: '🏗️', color: '#2196F3' },
      'PANNE': { icon: '📐', color: '#FF9800' },
      'ACCESSOIRE': { icon: '🔩', color: '#4CAF50' },
      'AUTRE': { icon: '📦', color: '#9E9E9E' }
    }
    const badge = badges[category] || badges['AUTRE']
    return (
      <span style={{ 
        background: badge.color, 
        color: 'white', 
        padding: '2px 8px', 
        borderRadius: '3px',
        fontSize: '0.85em',
        fontWeight: 'bold'
      }}>
        {badge.icon} {category}
      </span>
    )
  }

  return (
    <div className="container">
      <h1>📦 Gestion du Stock</h1>

      {lowStockItems.length > 0 && (
        <div className="card" style={{ background: '#3a1a1a', borderColor: '#c62828', marginBottom: '20px' }}>
          <h3 style={{ color: '#ff5252' }}>⚠️ Alerte Stock Bas ({lowStockItems.length})</h3>
          <div style={{ marginTop: '10px' }}>
            {lowStockItems.map(item => {
              const qty = item.quantityAvailable || item.quantity || 0
              const min = item.minQuantity || 0
              return (
                <div key={item.id} style={{ padding: '5px 0', borderBottom: '1px solid #444', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    <strong>{item.name}</strong> : {qty} {item.purchaseUnit || item.unit} (minimum : {min})
                  </span>
                  <button 
                    className="btn btn-primary"
                    style={{ padding: '4px 10px', fontSize: '0.85em' }}
                    onClick={() => openAddQuantityModal(item)}
                  >
                    + Ajouter
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px' }}>
        <div className="card" style={{ padding: '15px' }}>
          <div style={{ fontSize: '1.5em' }}>📦</div>
          <div style={{ fontSize: '0.9em', color: '#999' }}>Articles en stock</div>
          <div style={{ fontSize: '1.8em', color: 'var(--accent)', fontWeight: 'bold' }}>
            {stock.length}
          </div>
        </div>
        <div className="card" style={{ padding: '15px' }}>
          <div style={{ fontSize: '1.5em' }}>💰</div>
          <div style={{ fontSize: '0.9em', color: '#999' }}>Valeur totale (achat)</div>
          <div style={{ fontSize: '1.8em', color: 'var(--accent)', fontWeight: 'bold' }}>
            {formatNumber(totalValue)} Ar
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => openModal()}>
          ➕ Nouvel Article
        </button>
        <input
          type="text"
          placeholder="🔍 Rechercher un article..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: '1', minWidth: '250px' }}
        />
      </div>

      <div className="card">
        <h2>📋 Catalogue de référence ({filteredStock.length})</h2>
        {filteredStock.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            {searchTerm ? 'Aucun article trouvé' : 'Aucun article en stock. Ajoutez votre premier article !'}
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Article</th>
                <th>Catégorie</th>
                <th>Prix d'achat</th>
                <th>Disponible</th>
                <th>Statut</th>
                <th style={{ width: '200px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStock.map(item => {
                const qty = item.quantityAvailable || item.quantity || 0
                const min = item.minQuantity || 0
                const isLowStock = min > 0 && qty <= min
                const price = item.purchasePrice || item.unitPrice || 0
                const unit = item.purchaseUnit || item.unit || 'pièce'
                
                return (
                  <tr key={item.id} style={isLowStock ? { background: '#2a1a1a' } : {}}>
                    <td>
                      <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                      {item.reference && (
                        <div style={{ fontSize: '0.85em', color: '#999' }}>
                          Réf: {item.reference}
                        </div>
                      )}
                      {item.notes && (
                        <div style={{ fontSize: '0.85em', color: '#999', marginTop: '3px' }}>
                          {item.notes}
                        </div>
                      )}
                    </td>
                    <td>{getCategoryBadge(item.category || 'AUTRE')}</td>
                    <td>{formatNumber(price)} Ar/{unit}</td>
                    <td>
                      <strong style={{ color: isLowStock ? '#ff5252' : 'inherit' }}>
                        {qty} {unit}
                      </strong>
                      {min > 0 && (
                        <span style={{ fontSize: '0.85em', color: '#999', marginLeft: '5px' }}>
                          (min: {min})
                        </span>
                      )}
                    </td>
                    <td>
                      {isLowStock ? (
                        <span style={{ color: '#ff5252', fontWeight: 'bold' }}>⚠️ Bas</span>
                      ) : (
                        <span style={{ color: '#4caf50' }}>✓ OK</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '6px 12px', fontSize: '0.85em' }}
                          onClick={() => openAddQuantityModal(item)}
                          title="Ajouter de la quantité"
                        >
                          + Qté
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '6px 12px' }}
                          onClick={() => openModal(item)}
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn btn-danger" 
                          style={{ padding: '6px 12px' }}
                          onClick={() => deleteItem(item.id, item.name)}
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal d'ajout/modification d'article */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          overflow: 'auto',
          padding: '20px'
        }}>
          <div className="card" style={{ width: '90%', maxWidth: '600px', margin: '20px auto', maxHeight: '90vh', overflow: 'auto' }}>
            <h2>{editingItem ? '✏️ Modifier l\'article' : '➕ Nouvel article'}</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                  Catégorie
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="TÔLE">🏗️ Tôle</option>
                  <option value="PANNE">📐 Panne</option>
                  <option value="ACCESSOIRE">🔩 Accessoire</option>
                  <option value="AUTRE">📦 Autre</option>
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                  Nom de l'article <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Rouleau Pré-laqué 0.30, Panne 60×40×2mm, etc."
                  required
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                  Référence (optionnel)
                </label>
                <input
                  type="text"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  placeholder="Code ou référence interne"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                    Prix d'achat (Ar)
                  </label>
                  <input
                    type="number"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    placeholder="0"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                    Unité
                  </label>
                  <select
                    value={formData.purchaseUnit}
                    onChange={(e) => setFormData({ ...formData, purchaseUnit: e.target.value })}
                  >
                    <option value="mètre">mètre (m)</option>
                    <option value="pièce">pièce</option>
                    <option value="kg">kilogramme (kg)</option>
                    <option value="m²">mètre carré (m²)</option>
                    <option value="m³">mètre cube (m³)</option>
                    <option value="litre">litre</option>
                    <option value="sac">sac</option>
                    <option value="paquet">paquet</option>
                    <option value="sachet">sachet</option>
                    <option value="boîte">boîte</option>
                    <option value="carton">carton</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                  Prix de vente suggéré (optionnel)
                </label>
                <input
                  type="number"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                  placeholder="Prix par défaut lors des ventes"
                  step="0.01"
                  min="0"
                />
                <small style={{ color: '#999', fontSize: '0.85em' }}>
                  Peut être modifié lors de la création de facture
                </small>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                    Quantité disponible
                  </label>
                  <input
                    type="number"
                    value={formData.quantityAvailable}
                    onChange={(e) => setFormData({ ...formData, quantityAvailable: e.target.value })}
                    placeholder="0"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                    Quantité minimale (alerte)
                  </label>
                  <input
                    type="number"
                    value={formData.minQuantity}
                    onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
                    placeholder="0"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                  Notes (optionnel)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Fournisseur, qualité, remarques..."
                  rows="3"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingItem ? '💾 Modifier' : '➕ Ajouter'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={closeModal}
                  style={{ flex: 1 }}
                >
                  ❌ Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal d'ajout de quantité rapide */}
      {showAddQuantityModal && addingQuantityItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
          padding: '20px'
        }}>
          <div className="card" style={{ width: '90%', maxWidth: '400px' }}>
            <h2>➕ Ajouter de la quantité</h2>
            <div style={{ marginBottom: '15px' }}>
              <p style={{ color: '#999', marginBottom: '10px' }}>
                Article: <strong>{addingQuantityItem.name}</strong>
              </p>
              <p style={{ color: '#999', marginBottom: '15px' }}>
                Stock actuel: <strong>{addingQuantityItem.quantityAvailable || addingQuantityItem.quantity || 0} {addingQuantityItem.purchaseUnit || addingQuantityItem.unit}</strong>
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                Quantité à ajouter <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="number"
                value={quantityToAdd}
                onChange={(e) => setQuantityToAdd(e.target.value)}
                placeholder={`Nombre de ${addingQuantityItem.purchaseUnit || addingQuantityItem.unit}`}
                step="0.01"
                min="0.01"
                autoFocus
              />
            </div>

            {quantityToAdd && parseFloat(quantityToAdd) > 0 && (
              <div style={{ 
                padding: '10px',
                background: '#2a4a2a',
                borderRadius: '5px',
                marginBottom: '15px',
                color: '#4caf50'
              }}>
                Nouveau stock: <strong>
                  {(parseFloat(addingQuantityItem.quantityAvailable || addingQuantityItem.quantity || 0) + parseFloat(quantityToAdd)).toFixed(2)} {addingQuantityItem.purchaseUnit || addingQuantityItem.unit}
                </strong>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="btn btn-primary" 
                onClick={handleAddQuantity}
                style={{ flex: 1 }}
              >
                ✅ Confirmer
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={closeAddQuantityModal}
                style={{ flex: 1 }}
              >
                ❌ Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
