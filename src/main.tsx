import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import '@fontsource/ibm-plex-mono/600.css'
import './styles.css'
import { AuthProvider, RequireAuth } from './auth'
import { Shell } from './components/Shell'
import { Impact } from './screens/Impact'
import { Landing } from './screens/Landing'
import { Login } from './screens/Login'
import { Method } from './screens/Method'
import { MorningList } from './screens/MorningList'
import { Walks } from './screens/Walks'
import { AppProvider } from './state'
import { TourProvider } from './tour/Tour'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppProvider>
          <TourProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/app"
                element={
                  <RequireAuth>
                    <Shell />
                  </RequireAuth>
                }
              >
                <Route index element={<MorningList />} />
                <Route path="walks" element={<Walks />} />
                <Route path="method" element={<Method />} />
                <Route path="impact" element={<Impact />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </TourProvider>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
