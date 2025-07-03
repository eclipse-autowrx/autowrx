// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './functional.css'
import { BrowserRouter } from 'react-router-dom'
import QueryProvider from './providers/QueryProvider.tsx'
import { Bounce, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { PublicClientApplication } from '@azure/msal-browser'
import { msalConfig } from './services/sso.service'
import { MsalProvider } from '@azure/msal-react'
import { ErrorBoundary } from 'react-error-boundary'
import ErrorFallback from './layouts/ErrorFallback.tsx'
import DaTestAutomation from './components/molecules/DaTestAutomation.tsx'
import DaAutomationControl from './components/molecules/DaAutomationControl.tsx'


const msalInstance = new PublicClientApplication(msalConfig)
const showTestAutomation = localStorage.getItem('showTestAutomation') == '1'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DaAutomationControl/>
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
