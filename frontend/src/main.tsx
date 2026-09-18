import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'

import { App } from './app/App'
import './shared/styles/global.css'
import './shared/styles/performance.css'
import { queryClient } from './shared/query/queryClient'

const browser = window.navigator
const isIosWebKit = /iPad|iPhone|iPod/i.test(browser.userAgent)
  || (browser.platform === 'MacIntel' && browser.maxTouchPoints > 1)

if (isIosWebKit) {
  document.documentElement.dataset.iosWebkit = 'true'
}

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {isIosWebKit && <div className="ios-pastel-background" aria-hidden="true" />}
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
