import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DB } from '../services/database'
import { formatNumber, numberToWords } from '../utils/formatters'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export default function PreviewInvoicePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState(null)
  const [settings] = useState(DB.getSettings())
  const [isFullscreen, setIsFullscreen] = useState(false)
  const invoiceRef = useRef(null)

  useEffect(() => {
    const data = DB.getInvoiceById(id)
    if (!data) {
      alert('❌ Facture introuvable')
      navigate('/')
    } else {
      setInvoice(data)
    }
  }, [id, navigate])

  const handlePrint = () => {
    window.print()
  }

  const handleExportPNG = async () => {
    if (!invoiceRef.current) return
    
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        backgroundColor: '#ffffff'
      })
      
      const link = document.createElement('a')
      link.download = `facture-${invoice.number}.png`
      link.href = canvas.toDataURL()
      link.click()
    } catch (error) {
      alert('❌ Erreur lors de l\'export PNG')
      console.error(error)
    }
  }

  const handleExportPDF = async () => {
    if (!invoiceRef.current) return
    
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        backgroundColor: '#ffffff'
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`facture-${invoice.number}.pdf`)
    } catch (error) {
      alert('❌ Erreur lors de l\'export PDF')
      console.error(error)
    }
  }

  if (!invoice) {
    return (
      <div className="container">
        <p>Chargement...</p>
      </div>
    )
  }

  return (
   <div>
    {/* === AJOUTE CES LIGNES === */}
    <style>{`
      ${isFullscreen ? `
        nav.navbar {
          display: none !important;
        }
        body {
          overflow: hidden;
        }
      ` : ''}
    `}</style>
      {/* Barre d'actions */}
      <div className="no-print" style={{ 
        background: isFullscreen ? 'rgba(26,26,26,0.95)' : 'var(--bg-secondary)', 
        padding: '15px', 
        borderBottom: '2px solid var(--accent)',
        position: isFullscreen ? 'fixed' : 'relative',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000
      }}>
        <div className="container" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={handlePrint}>
            🖨️ Imprimer
          </button>
          <button className="btn btn-primary" onClick={handleExportPDF}>
            📄 Export PDF
          </button>
          <button className="btn btn-primary" onClick={handleExportPNG}>
            🖼️ Export PNG
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? '📱 Mode normal' : '🖥️ Plein écran'}
          </button>
          <button className="btn btn-secondary" onClick={() => navigate(`/create?id=${id}`)}>
            ✏️ Modifier
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            ← Retour
          </button>
        </div>
      </div>

      {/* Conteneur facture */}
      <div style={{
        padding: isFullscreen ? '0' : '40px 20px',
        background: isFullscreen ? '#ffffff' : 'var(--bg-primary)',
        minHeight: isFullscreen ? '100vh' : 'auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: isFullscreen ? 'center' : 'flex-start',
        paddingTop: isFullscreen ? '80px' : '40px'
      }}>
        <div 
          ref={invoiceRef}
          style={{
            width: '210mm',
            height: '297mm',
            background: '#ffffff',
            padding: '10mm',
            boxShadow: isFullscreen ? 'none' : '0 4px 8px rgba(0,0,0,0.1)',
            fontSize: '9pt',
            lineHeight: '1.4',
            color: '#000000',
            fontFamily: 'Arial, sans-serif',
            display: 'flex',
            flexDirection: 'column',
            justifyContente: 'space-bettween'
          }}
        >
          {/* EN-TÊTE : Gauche (Entreprise) / Droite (Facture & Client) */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '15mm',
            marginBottom: '8mm',
            paddingBottom: '5mm',
            borderBottom: '2px solid #000'
          }}>
            {/* GAUCHE : Informations Entreprise */}
            <div>
              <h1 style={{ 
                fontSize: '14pt', 
                margin: '0 0 3mm 0', 
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}>
                {settings.companyName || 'ENTREPRISE'}
              </h1>
              <div style={{ fontSize: '8pt', lineHeight: '1.6' }}>
                {settings.companyActivity && <div>{settings.companyActivity}</div>}
                {settings.companyAddress && <div>{settings.companyAddress}</div>}
                <div style={{ marginTop: '2mm' }}>
                  {settings.companyStat && <div>STAT: {settings.companyStat}</div>}
                  {settings.companyNif && <div>NIF: {settings.companyNif}</div>}
                </div>
                {settings.companyPhone && <div style={{ marginTop: '2mm' }}>Tél: {settings.companyPhone}</div>}
                {settings.responsibleNumber && <div>Responsable: {settings.responsibleNumber}</div>}
              </div>
            </div>

            {/* DROITE : Facture & Client */}
            <div>
              <div style={{ 
                background: '#f5f5f5', 
                padding: '4mm', 
                marginBottom: '4mm',
                border: '1px solid #000'
              }}>
                <div style={{ fontWeight: 'bold', fontSize: '12pt', marginBottom: '2mm' }}>
                  {invoice.type === 'proforma' && 'FACTURE PROFORMA'}
                  {invoice.type === 'credit_note' && 'FACTURE D\'AVOIR'}
                  {(!invoice.type || invoice.type === 'standard') && 'FACTURE'}
                </div>
                <div style={{ fontSize: '8pt' }}>
                  <div><strong>N°:</strong> {invoice.number}</div>
                  <div><strong>Date:</strong> {new Date(invoice.date).toLocaleDateString('fr-FR')}</div>
                </div>
              </div>

              <div style={{ 
                background: '#f5f5f5', 
                padding: '4mm',
                border: '1px solid #000'
              }}>
                <div style={{ fontWeight: 'bold', fontSize: '9pt', marginBottom: '2mm' }}>
                  CLIENT
                </div>
                <div style={{ fontSize: '8pt' }}>
                  <div>{invoice.client.name}</div>
                  {invoice.client.phone && <div>Tél: {invoice.client.phone}</div>}
                  {invoice.client.address && <div>{invoice.client.address}</div>}
                </div>
              </div>
            </div>
          </div>

          {/* TABLEAU ARTICLES : DÉTAILS | DÉSIGNATION | QTÉ | P.U | MT */}
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            marginBottom: '5mm',
            fontSize: '8pt'
          }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
               <th style={{ 
  border: '1px solid #000', 
  padding: '2mm', 
  textAlign: 'left',
  fontWeight: 'bold',
  fontSize: '9pt',           // ← Plus gros
  color: '#000',             // ← Noir intense
  textTransform: 'uppercase', // ← MAJUSCULES
  width: '25%'
}}>
                  DÉTAILS
                </th>
               <th style={{ 
  border: '1px solid #000', 
  padding: '2mm', 
  textAlign: 'left',
  fontWeight: 'bold',
  fontSize: '9pt',           // ← Plus gros
  color: '#000',             // ← Noir intense
  textTransform: 'uppercase', // ← MAJUSCULES
  width: '30%'
}}>
                  DÉSIGNATION
                </th>
               <th style={{ 
  border: '1px solid #000', 
  padding: '2mm', 
  textAlign: 'left',
  fontWeight: 'bold',
  fontSize: '9pt',           // ← Plus gros
  color: '#000',             // ← Noir intense
  textTransform: 'uppercase', // ← MAJUSCULES
  width: '15%'
}}>
                  QTÉ
                </th>
               <th style={{ 
  border: '1px solid #000', 
  padding: '2mm', 
  textAlign: 'left',
  fontWeight: 'bold',
  fontSize: '9pt',           // ← Plus gros
  color: '#000',             // ← Noir intense
  textTransform: 'uppercase', // ← MAJUSCULES
  width: '14%'
}}>
                  P.U (Ar)
                </th>
               <th style={{ 
  border: '1px solid #000', 
  padding: '2mm', 
  textAlign: 'left',
  fontWeight: 'bold',
  fontSize: '9pt',           // ← Plus gros
  color: '#000',             // ← Noir intense
  textTransform: 'uppercase', // ← MAJUSCULE
  width: '16%'
}}>
                  MT (Ar)
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index}>
                  <td style={{ 
                    border: '1px solid #000', 
                    padding: '2mm',
                    verticalAlign: 'top',
                    fontSize: '7pt',
                    lineHeight: '1.5',
                    background: '#fafafa'
                  }}>
                    {item.detailLines && item.detailLines.length > 0 ? (
                      <div>
                        {item.detailLines.map((line, idx) => (
                          <div key={idx}>• {line.display}</div>
                        ))}
                      </div>
                    ) : (
                      <div>-</div>
                    )}
                  </td>
                  <td style={{ 
                    border: '1px solid #000', 
                    padding: '2mm',
                    verticalAlign: 'top',
                    fontWeight: 'bold',
                    background: '#fafafa'
                  }}>
                    {item.description}
                    {item.reference && (
                      <div style={{ fontSize: '7pt', fontWeight: 'normal', color: '#666', marginTop: '1mm' }}>
                        Réf: {item.reference}
                      </div>
                    )}
                  </td>
                  <td style={{ 
                    border: '1px solid #000', 
                    padding: '2mm', 
                    textAlign: 'right',
                    verticalAlign: 'top',
                    background: '#fafafa'
                  }}>
                    {item.quantity} {item.unit}
                  </td>
                  <td style={{ 
                    border: '1px solid #000', 
                    padding: '2mm', 
                    textAlign: 'right',
                    verticalAlign: 'top',
                    background: '#fafafa'
                  }}>
                    {formatNumber(item.unitPrice)}
                  </td>
                  <td style={{ 
                    border: '1px solid #000', 
                    padding: '2mm', 
                    textAlign: 'right',
                    verticalAlign: 'top',
                    fontWeight: 'bold',
                    background: '#fafafa'
                  }}>
                    {formatNumber(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="4" style={{ 
                  border: '1px solid #000', 
                  padding: '3mm', 
                  textAlign: 'right',
                  fontWeight: 'bold',
                  fontSize: '10pt',
                  background: '#f5f5f5'
                }}>
                  TOTAL
                </td>
                <td style={{ 
                  border: '1px solid #000', 
                  padding: '3mm', 
                  textAlign: 'right',
                  fontWeight: 'bold',
                  fontSize: '11pt',
                  background: '#e0e0e0'
                }}>
                  {formatNumber(invoice.total)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* MONTANT EN LETTRES */}
          <div style={{ 
            background: '#f5f5f5', 
            padding: '3mm', 
            marginBottom: '5mm',
            border: '1px solid #ccc',
            fontSize: '8pt'
          }}>
            <strong>Arrêté la présente facture à la somme de :</strong>
            <div style={{ fontStyle: 'italic', marginTop: '1mm' }}>
              {numberToWords(invoice.total)}
            </div>
          </div>

          {/* NOTES */}
          {invoice.notes && (
            <div style={{ marginBottom: '5mm', fontSize: '8pt' }}>
              <strong>Notes :</strong>
              <div style={{ whiteSpace: 'pre-wrap', marginTop: '1mm' }}>
                {invoice.notes}
              </div>
            </div>
          )}

          {/* SIGNATURES */}
          <div>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '15mm',
            marginTop: '10mm'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '15mm' }}>
                Le Client
              </div>
              <div style={{ borderTop: '1px solid #000', paddingTop: '2mm' }}>
                Signature
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '15mm' }}>
                Le Fournisseur
              </div>
              <div style={{ borderTop: '1px solid #000', paddingTop: '2mm' }}>
                Signature et cachet
              </div>
            </div>
          </div>
</div>
          {/* FOOTER */}
          <div style={{ 
            marginTop: '10mm',
            paddingTop: '3mm',
            borderTop: '1px solid #ccc',
            fontSize: '7pt',
            textAlign: 'center',
            color: '#666'
          }}>
            Facture générée le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
          </div>
        </div>
      </div>

      {/* Styles pour l'impression */}
      <style>{`
        @media print {
          body {
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </div>
  )
}
