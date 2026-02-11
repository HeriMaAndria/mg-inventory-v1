import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DB } from '../services/database'
import { formatNumber } from '../utils/formatters'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ monthTotal: 0, totalInvoices: 0, lastClient: '-' })
  const [invoices, setInvoices] = useState([])
  const [clients, setClients] = useState([])
  const [stock, setStock] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setStats(DB.getStats())
    setInvoices(DB.getInvoices())
    setClients(DB.getClients())
    setStock(DB.getStock())
  }

  const deleteInvoice = (id) => {
    if (confirm('Supprimer cette facture ?')) {
      DB.deleteInvoice(id)
      loadData()
      alert('✅ Facture supprimée')
    }
  }

  return (
    <div style={{ padding: '30px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
      <header className="u-mb-xl">
        <h1 className="u-text-xl u-text-accent u-mb-sm">📊 Tableau de Bord</h1>
        <p className="u-text-secondary">Aperçu général de votre activité</p>
      </header>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }} className="u-mb-xl">
        <div className="card">
          <div style={{ fontSize: '2.5em', marginBottom: '10px' }}>💰</div>
          <div className="u-text-secondary u-text-sm u-mb-sm">Total du mois</div>
          <div className="u-text-xl u-text-accent u-text-bold">
            {formatNumber(stats.monthTotal)} Ar
          </div>
        </div>
        
        <div className="card">
          <div style={{ fontSize: '2.5em', marginBottom: '10px' }}>📄</div>
          <div className="u-text-secondary u-text-sm u-mb-sm">Factures créées</div>
          <div className="u-text-xl u-text-accent u-text-bold">
            {stats.totalInvoices}
          </div>
        </div>
        
        <div className="card">
          <div style={{ fontSize: '2.5em', marginBottom: '10px' }}>👤</div>
          <div className="u-text-secondary u-text-sm u-mb-sm">Total clients</div>
          <div className="u-text-xl u-text-accent u-text-bold">
            {clients.length}
          </div>
        </div>
        
        <div className="card">
          <div style={{ fontSize: '2.5em', marginBottom: '10px' }}>📦</div>
          <div className="u-text-secondary u-text-sm u-mb-sm">Articles en stock</div>
          <div className="u-text-xl u-text-accent u-text-bold">
            {stock.length}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="u-flex u-gap-md u-mb-lg">
        <button className="btn btn--primary" onClick={() => navigate('/create')}>
          ➕ Nouvelle Facture
        </button>
        <button className="btn btn--secondary" onClick={loadData}>
          🔄 Actualiser
        </button>
      </div>

      {/* Invoices table */}
      <div className="card">
        <div className="card__header">
          <h2 className="card__title">📋 Toutes les factures</h2>
        </div>
        
        {invoices.length === 0 ? (
          <div className="u-text-center u-p-xl u-text-secondary">
            <p>Aucune facture. Créez votre première facture !</p>
            <button className="btn btn--primary u-mt-md" onClick={() => navigate('/create')}>
              ➕ Créer une facture
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead className="table__head">
                <tr>
                  <th className="table__th">N° Facture</th>
                  <th className="table__th">Type</th>
                  <th className="table__th">Date</th>
                  <th className="table__th">Client</th>
                  <th className="table__th">Statut</th>
                  <th className="table__th table__th--right">Montant</th>
                  <th className="table__th table__th--center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(invoice => {
                  const getStatusBadge = (status) => {
                    const badges = {
                      'draft': { label: 'Brouillon', color: '#ff9800' },
                      'confirmed': { label: 'Confirmée', color: '#4caf50' },
                      'cancelled': { label: 'Annulée', color: '#f44336' }
                    }
                    const badge = badges[status] || badges['draft']
                    return (
                      <span style={{ 
                        background: badge.color, 
                        color: 'white', 
                        padding: '3px 8px', 
                        borderRadius: '3px',
                        fontSize: '0.85em',
                        fontWeight: 'bold'
                      }}>
                        {badge.label}
                      </span>
                    )
                  }

                  const getTypeLabel = (type) => {
                    const types = {
                      'standard': 'Facture',
                      'proforma': 'Proforma',
                      'credit_note': 'Avoir'
                    }
                    return types[type] || 'Facture'
                  }

                  return (
                  <tr key={invoice.id} className="table__row">
                    <td className="table__td u-text-bold">{invoice.number}</td>
                    <td className="table__td">{getTypeLabel(invoice.type)}</td>
                    <td className="table__td">{new Date(invoice.date).toLocaleDateString('fr-FR')}</td>
                    <td className="table__td">{invoice.client.name}</td>
                    <td className="table__td">{getStatusBadge(invoice.status)}</td>
                    <td className="table__td table__td--right u-text-bold u-text-accent">
                      {formatNumber(invoice.total)} Ar
                    </td>
                    <td className="table__td table__td--center">
                      <div className="u-flex u-gap-sm u-flex-center">
                        <button 
                          className="btn btn--info btn--sm btn--icon" 
                          onClick={() => navigate(`/preview/${invoice.id}`)}
                          title="Voir"
                        >
                          👁️
                        </button>
                        <button 
                          className="btn btn--warning btn--sm btn--icon" 
                          onClick={() => navigate(`/create?id=${invoice.id}`)}
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn btn--danger btn--sm btn--icon" 
                          onClick={() => deleteInvoice(invoice.id)}
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
          </div>
        )}
      </div>
    </div>
  )
}
