import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AsgardeoProvider } from '@asgardeo/react'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AsgardeoProvider
      clientId="d3cxDQENREgsNGvzs66sWICc8VIa"
      baseUrl="https://api.asgardeo.io/t/katherinegallardo"
      scopes="openid profile"
    >
      <App />
    </AsgardeoProvider>
  </StrictMode>
)