import { useState, useEffect } from 'react'
import { DB } from '../services/database'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    companyName: '',
    companyActivity: '',
    companyAddress: '',
    companyStat: '',
    companyNif: '',
    companyPhone: '',
    responsibleNumber: ''
  })
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = () => {
    const data = DB.getSettings()
    setSettings({
      companyName: data.companyName || '',
      companyActivity: data.companyActivity || '',
      companyAddress: data.companyAddress || '',
      companyStat: data.companyStat || '',
      companyNif: data.companyNif || '',
      companyPhone: data.companyPhone || '',
      responsibleNumber: data.responsibleNumber || ''
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    DB.saveSettings(settings)
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 3000)
    alert('✅ Paramètres enregistrés avec succès')
  }

  const handleExport = () => {
    const data = DB.exportAllData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `mg-inventory-backup-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result)
        if (confirm('⚠️ Cette action va remplacer toutes vos données actuelles. Continuer ?')) {
          DB.importData(data)
          loadSettings()
          alert('✅ Données importées avec succès')
          window.location.reload()
        }
      } catch (error) {
        alert('❌ Erreur lors de l\'importation du fichier')
        console.error(error)
      }
    }
    reader.readAsText(file)
  }

  const handleReset = () => {
    if (confirm('⚠️ ATTENTION : Cette action va supprimer TOUTES vos données (factures, clients, stock). Cette action est irréversible. Continuer ?')) {
      if (confirm('⚠️ Êtes-vous vraiment sûr ? Toutes les données seront perdues !')) {
        DB.resetAllData()
        alert('✅ Toutes les données ont été supprimées')
        window.location.reload()
      }
    }
  }

  return (
    <div className="container">
      <h1>⚙️ Paramètres</h1>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <h2>🏢 Informations de l'entreprise</h2>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
              Nom de l'entreprise
            </label>
            <input
              type="text"
              value={settings.companyName}
              onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
              placeholder="FOIBENNY TSARA TOLES BY PASS"
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
              Activité
            </label>
            <input
              type="text"
              value={settings.companyActivity}
              onChange={(e) => setSettings({ ...settings, companyActivity: e.target.value })}
              placeholder="VENTES DES MATÉRIAUX DE CONSTRUCTION"
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
              Adresse
            </label>
            <input
              type="text"
              value={settings.companyAddress}
              onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })}
              placeholder="Près Lavage Raitra"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                STAT
              </label>
              <input
                type="text"
                value={settings.companyStat}
                onChange={(e) => setSettings({ ...settings, companyStat: e.target.value })}
                placeholder="47521201201901044"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                NIF
              </label>
              <input
                type="text"
                value={settings.companyNif}
                onChange={(e) => setSettings({ ...settings, companyNif: e.target.value })}
                placeholder="6003278760"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                Téléphone
              </label>
              <input
                type="text"
                value={settings.companyPhone}
                onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })}
                placeholder="0345476294 / 0389015842"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                N° Responsable
              </label>
              <input
                type="text"
                value={settings.responsibleNumber}
                onChange={(e) => setSettings({ ...settings, responsibleNumber: e.target.value })}
                placeholder="Ex: RESP-001"
              />
              <small style={{ color: '#999', fontSize: '0.85em' }}>
                Apparaîtra sur les factures
              </small>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            {isSaved ? '✅ Enregistré !' : '💾 Enregistrer les paramètres'}
          </button>
        </div>
      </form>

      <div className="card">
        <h2>💾 Sauvegarde et restauration</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <p style={{ color: '#999', marginBottom: '15px' }}>
            Exportez vos données pour créer une sauvegarde ou importez une sauvegarde précédente.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={handleExport}
            >
              📥 Exporter les données
            </button>
            
            <label className="btn btn-secondary" style={{ margin: 0, textAlign: 'center', cursor: 'pointer' }}>
              📤 Importer les données
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="card" style={{ borderColor: '#c62828' }}>
        <h2 style={{ color: '#ff5252' }}>⚠️ Zone de danger</h2>
        
        <p style={{ color: '#999', marginBottom: '15px' }}>
          Cette action supprimera toutes vos données de manière permanente.
        </p>
        
        <button 
          type="button" 
          className="btn btn-danger"
          onClick={handleReset}
          style={{ width: '100%' }}
        >
          🗑️ Réinitialiser toutes les données
        </button>
      </div>
    </div>
  )
}
