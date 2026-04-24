import type { CSSProperties, ReactNode } from 'react';

type NombreIcono =
  | 'flecha-izquierda'
  | 'mas'
  | 'usuario'
  | 'candado'
  | 'ver'
  | 'descargar'
  | 'salir'
  | 'dashboard'
  | 'solicitudes'
  | 'areas'
  | 'usuarios'
  | 'tipos'
  | 'reportes'
  | 'check';

type IconoProps = {
  nombre: NombreIcono;
  className?: string;
  style?: CSSProperties;
};

function trazo(contenido: ReactNode) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-[1em] w-[1em]"
    >
      {contenido}
    </svg>
  );
}

export function Icono({ nombre, className, style }: IconoProps) {
  const iconos: Record<NombreIcono, ReactNode> = {
    'flecha-izquierda': trazo(
      <>
        <path d="M19 12H5" />
        <path d="m12 19-7-7 7-7" />
      </>,
    ),
    mas: trazo(
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>,
    ),
    usuario: trazo(
      <>
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="8" r="4" />
      </>,
    ),
    candado: trazo(
      <>
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </>,
    ),
    ver: trazo(
      <>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
        <circle cx="12" cy="12" r="3" />
      </>,
    ),
    descargar: trazo(
      <>
        <path d="M12 4v11" />
        <path d="m7 11 5 5 5-5" />
        <path d="M5 20h14" />
      </>,
    ),
    salir: trazo(
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="M16 17l5-5-5-5" />
        <path d="M21 12H9" />
      </>,
    ),
    dashboard: trazo(
      <>
        <rect x="3" y="3" width="8" height="8" rx="1.5" />
        <rect x="13" y="3" width="8" height="5" rx="1.5" />
        <rect x="13" y="10" width="8" height="11" rx="1.5" />
        <rect x="3" y="13" width="8" height="8" rx="1.5" />
      </>,
    ),
    solicitudes: trazo(
      <>
        <path d="M8 6h12" />
        <path d="M8 12h12" />
        <path d="M8 18h12" />
        <path d="M4 6h.01" />
        <path d="M4 12h.01" />
        <path d="M4 18h.01" />
      </>,
    ),
    areas: trazo(
      <>
        <path d="M3 21h18" />
        <path d="M5 21V7l7-4 7 4v14" />
        <path d="M9 9h.01" />
        <path d="M15 9h.01" />
        <path d="M9 13h.01" />
        <path d="M15 13h.01" />
      </>,
    ),
    usuarios: trazo(
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 19a6 6 0 0 1 12 0" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M15 19a4.5 4.5 0 0 1 6 0" />
      </>,
    ),
    tipos: trazo(
      <>
        <path d="M4 7h10" />
        <path d="M4 12h16" />
        <path d="M4 17h8" />
        <circle cx="18" cy="7" r="2" />
        <circle cx="8" cy="17" r="2" />
      </>,
    ),
    reportes: trazo(
      <>
        <path d="M4 19V5" />
        <path d="M20 19H4" />
        <path d="m7 15 3-4 3 2 4-6" />
      </>,
    ),
    check: trazo(
      <>
        <path d="M20 6 9 17l-5-5" />
      </>,
    ),
  };

  return (
    <span className={className} style={style}>
      {iconos[nombre]}
    </span>
  );
}
