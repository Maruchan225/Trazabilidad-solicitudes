import React from 'react';
import ReactDOM from 'react-dom/client';
import { App, ConfigProvider, theme } from 'antd';
import esES from 'antd/locale/es_ES';
import { RouterProvider } from 'react-router-dom';
import { router } from './aplicacion/router';
import { AutenticacionProvider } from './proveedores/AutenticacionProvider';
import './estilos/index.css';

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ConfigProvider
      locale={esES}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: "#b5540d",
          colorInfo: "#b5540d",
          colorSuccess: "#10b981",
          colorWarning: "#f59e0b",
          colorText: "#0f172a",
          colorTextHeading: "#1e293b",
          colorTextLabel: "#334155",
          colorTextDescription: "#475569",
          colorBgBase: "#ffffff",
          colorBorder: "#e2e8f0",
          colorBorderSecondary: "#f1f5f9",
          borderRadius: 14,
          fontFamily: "'Montserrat', sans-serif",
        },
      }}
    >
      <App>
        <AutenticacionProvider>
          <RouterProvider router={router} />
        </AutenticacionProvider>
      </App>
    </ConfigProvider>
  </React.StrictMode>,
);
