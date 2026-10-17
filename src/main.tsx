import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import '@fontsource/ibm-plex-mono/600.css'
import './styles.css'
import { Shell } from './components/Shell'
import { Impact } from './screens/Impact'
import { Method } from './screens/Method'
import { MorningList } from './screens/MorningList'
import { Walks } from './screens/Walks'
import { AppProvider } from './state'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<MorningList />} />
            <Route path="walks" element={<Walks />} />
            <Route path="method" element={<Method />} />
            <Route path="impact" element={<Impact />} />
            <Route path="*" element={<MorningList />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  </StrictMode>,
)
