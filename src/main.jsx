import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import './index.css'
import TravelPage from './TravelPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TravelPage />
  </StrictMode>,
)
