import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import DashboardPage from './pages/DashboardPage'
import CreateInvoicePage from './pages/CreateInvoicePage'
import PreviewInvoicePage from './pages/PreviewInvoicePage'
import ClientsPage from './pages/ClientsPage'
import StockPage from './pages/StockPage'
import SettingsPage from './pages/SettingsPage'
import './styles/main.css'

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  const mainClasses = `app__main ${
    isSidebarCollapsed ? 'app__main--sidebar-collapsed' : ''
  }`

  return (
    <BrowserRouter>
      <div className="app">
        {/* Sidebar */}
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />

        {/* Main content */}
        <main className={mainClasses}>
          <div className="app__page">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/create" element={<CreateInvoicePage />} />
              <Route path="/preview/:id" element={<PreviewInvoicePage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/stock" element={<StockPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
