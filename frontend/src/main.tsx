import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, theme } from 'antd';
import esES from 'antd/locale/es_ES';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { AutenticacionProvider } from './providers/AutenticacionProvider';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ConfigProvider
      locale={esES}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#406354',
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
