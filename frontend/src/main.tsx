import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App as AntApp, ConfigProvider, theme } from 'antd'
import esES from 'antd/locale/es_ES'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider
      locale={esES}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#b5540d',
          colorInfo: '#e06e10',
          colorSuccess: '#10b981',
          colorWarning: '#f59e0b',
          colorError: '#dc2626',
          colorText: '#1f2933',
          colorTextHeading: '#111827',
          colorBgBase: '#fffaf4',
          colorBorder: '#f2d4b7',
          borderRadius: 14,
          fontFamily: 'Montserrat, Inter, system-ui, sans-serif',
        },
        components: {
          Button: {
            primaryShadow: '0 8px 18px rgba(181, 84, 13, 0.22)',
          },
          Card: {
            colorBgContainer: '#ffffff',
          },
        },
      }}
    >
      <AntApp>
        <App />
      </AntApp>
    </ConfigProvider>
  </StrictMode>,
)
