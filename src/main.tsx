import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import QueryProvider from './providers/QueryProvider.tsx'
import { Bounce, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { PublicClientApplication } from '@azure/msal-browser'
import { msalConfig } from './services/sso.service'
import { MsalProvider } from '@azure/msal-react'
import { ErrorBoundary } from 'react-error-boundary'
import ErrorFallback from './layouts/ErrorFallback.tsx'

const msalInstance = new PublicClientApplication(msalConfig)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MsalProvider instance={msalInstance}>
      <BrowserRouter>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <QueryProvider>
            <ToastContainer
              position="top-center"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
              transition={Bounce}
            />
            <App />
          </QueryProvider>
        </ErrorBoundary>
      </BrowserRouter>
    </MsalProvider>
  </React.StrictMode>,
)
