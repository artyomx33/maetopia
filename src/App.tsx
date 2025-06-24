import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faHome, 
  faSave, 
  faFolderOpen, 
  faDownload, 
  faQuestionCircle 
} from '@fortawesome/free-solid-svg-icons'

// Placeholder components - will be created in separate files later
const Home = () => (
  <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-blue-600 mb-4">Welcome to Maetopia!</h1>
      <p className="text-xl">A city builder made for Maelyn</p>
      <div className="mt-8 flex justify-center gap-4">
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg text-xl">
          <FontAwesomeIcon icon={faFolderOpen} className="mr-2" />
          Open City
        </button>
        <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg text-xl">
          <FontAwesomeIcon icon={faHome} className="mr-2" />
          New City
        </button>
      </div>
    </div>
  </div>
)

// Main App Component
function App() {
  const [showTooltips, setShowTooltips] = useState(true)

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-blue-100">
        {/* Header */}
        <header className="bg-white shadow-md p-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center">
              <img 
                src="/logo-placeholder.png" 
                alt="Maetopia" 
                className="h-10 w-10 mr-2"
                onError={(e) => {
                  // Fallback if logo image doesn't exist yet
                  e.currentTarget.style.display = 'none'
                }} 
              />
              <h1 className="text-2xl font-bold text-blue-600">Maetopia</h1>
            </div>
            
            {/* Main Navigation */}
            <nav className="flex space-x-2">
              {/* Using group for tooltip positioning */}
              <div className="group relative">
                <Link to="/" className="icon-button">
                  <FontAwesomeIcon icon={faHome} size="lg" />
                </Link>
                {showTooltips && <span className="tooltip">Home</span>}
              </div>
              
              <div className="group relative">
                <Link to="/save" className="icon-button">
                  <FontAwesomeIcon icon={faSave} size="lg" />
                </Link>
                {showTooltips && <span className="tooltip">Save City</span>}
              </div>
              
              <div className="group relative">
                <Link to="/open" className="icon-button">
                  <FontAwesomeIcon icon={faFolderOpen} size="lg" />
                </Link>
                {showTooltips && <span className="tooltip">Open City</span>}
              </div>
              
              <div className="group relative">
                <Link to="/export" className="icon-button">
                  <FontAwesomeIcon icon={faDownload} size="lg" />
                </Link>
                {showTooltips && <span className="tooltip">Export Picture</span>}
              </div>
              
              <div className="group relative">
                <button 
                  className="icon-button"
                  onClick={() => setShowTooltips(!showTooltips)}
                >
                  <FontAwesomeIcon icon={faQuestionCircle} size="lg" />
                </button>
                {showTooltips && <span className="tooltip">Help</span>}
              </div>
            </nav>
          </div>
        </header>
        
        {/* Main Content Area */}
        <main className="flex-grow container mx-auto p-4">
          <Routes>
            <Route path="/" element={<Home />} />
            {/* Additional routes will be added as we create components */}
            <Route path="/save" element={<div>Save City (Coming Soon)</div>} />
            <Route path="/open" element={<div>Open City (Coming Soon)</div>} />
            <Route path="/export" element={<div>Export Picture (Coming Soon)</div>} />
          </Routes>
        </main>
        
        {/* Footer */}
        <footer className="bg-white shadow-inner p-4 text-center text-sm text-gray-500">
          <p>Maetopia - Created for Maelyn with ❤️</p>
        </footer>
      </div>
    </Router>
  )
}

export default App
