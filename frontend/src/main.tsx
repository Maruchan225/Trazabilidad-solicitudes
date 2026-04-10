import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, theme } from 'antd';
import esES from 'antd/locale/es_ES';
import { RouterProvider } from 'react-router-dom';
import { router } from './aplicacion/router';
import { AutenticacionProvider } from './proveedores/AutenticacionProvider';
import './estilos/index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ConfigProvider
      locale={esES}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#4b5563',
          colorInfo: '#4b5563',
          colorSuccess: '#6b7280',
          colorWarning: '#9ca3af',
          colorText: '#111827',
          colorTextHeading: '#111827',
          colorTextLabel: '#111827',
          colorTextDescription: '#374151',
          colorBgBase: '#f5f5f5',
          colorBorder: '#d1d5db',
          colorBorderSecondary: '#e5e7eb',
          borderRadius: 14,
          fontFamily:
            "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        },
      }}
    >
      <AutenticacionProvider>
        <RouterProvider router={router} />
      </AutenticacionProvider>
    </ConfigProvider>
  </React.StrictMode>,
);
