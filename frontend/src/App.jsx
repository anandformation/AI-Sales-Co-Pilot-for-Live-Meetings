import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import Dashboard from './pages/Dashboard.jsx'
import MeetingSetup from './pages/MeetingSetup.jsx'
import MeetingView from './pages/MeetingView.jsx'
import History from './pages/History.jsx'

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/new" element={<MeetingSetup />} />
            <Route path="/meeting/:id" element={<MeetingView />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
