import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Uygulamanın giriş noktası:
// index.html içindeki <div id="root"> elementini bulup
// React uygulamasını (App) onun içine çizer.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
