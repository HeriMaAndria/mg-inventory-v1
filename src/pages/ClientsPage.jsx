import { useState, useEffect } from 'react'
import { DB } from '../services/database'
import { formatNumber } from '../utils/formatters'

export default function ClientsPage() {
  const [clients, setClients] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  })

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = () => {
    const data = DB.getClients()
    setClients(data.sort((a, b) => new Date(b.lastPurchaseDate || 0) - new Date(a.lastPurchaseDate || 0)))
  }

  const openModal = (client = null) => {
    if (client) {
      setEditingClient(client)
      setFormData({
        name: client.name,
        phone: client.phone || '',
        address: client.address || ''
      })
    } else {
      setEditingClient(null)
      setFormData({ name: '', phone: '', address: '' })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingClient(null)
    setFormData({ name: '', phone: '', address: '' })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert('❌ Le nom du client est obligatoire')
      return
    }

    if (editingClient) {
      DB.updateClient(editingClient.id, formData)
      alert('✅ Client modifié avec succès')
    } else {
      DB.addClient(formData)
      alert('✅ Client ajouté avec succès')
    }
    loadClients()
    closeModal()
  }

  const deleteClient = (id, name) => {
    if (confirm(`Supprimer le client "${name}" ?\n\n⚠️ Attention : Les factures liées à ce client ne seront pas supprimées.`)) {
      DB.deleteClient(id)
      loadClients()
      alert('✅ Client supprimé')
    }
  }

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.phone && client.phone.includes(searchTerm)) ||
    (client.address && client.address.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="container">
      <h1>👥 Gestion des Clients</h1>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => openModal()}>
          ➕ Nouveau Client
        </button>
        <input
          type="text"
          placeholder="🔍 Rechercher un client..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: '1', minWidth: '250px' }}
        />
      </div>

      <div className="card">
        <h2>📋 Liste des clients ({filteredClients.length})</h2>
        {filteredClients.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            {searchTerm ? 'Aucun client trouvé' : 'Aucun client. Ajoutez votre premier client !'}
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Téléphone</th>
                <th>Adresse</th>
                <th>Achats</th>
                <th>Dernier achat</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map(client => (
                <tr key={client.id}>
                  <td><strong>{client.name}</strong></td>
                  <td>{client.phone || '-'}</td>
                  <td>{client.address || '-'}</td>
                  <td><strong>{client.totalPurchases || 0}</strong></td>
                  <td>
                    {client.lastPurchaseDate 
                      ? new Date(client.lastPurchaseDate).toLocaleDateString('fr-FR')
                      : '-'
                    }
                  </td>
                  <td>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '6px 12px', marginRight: '5px' }}
                      onClick={() => openModal(client)}
                    >
                      ✏️
                    </button>
                    <button 
                      className="btn btn-danger" 
                      style={{ padding: '6px 12px' }}
                      onClick={() => deleteClient(client.id, client.name)}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '90%', maxWidth: '500px', margin: '20px' }}>
            <h2>{editingClient ? '✏️ Modifier le client' : '➕ Nouveau client'}</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                  Nom <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nom du client"
                  required
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0XX XX XXX XX"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                  Adresse
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Adresse du client"
                  rows="3"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingClient ? '💾 Modifier' : '➕ Ajouter'}
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
    </div>
  )
}
