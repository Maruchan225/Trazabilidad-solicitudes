import { Tag } from 'antd';
import type { RolUsuario } from '@/tipos/comun';

type TagRolProps = {
  rol?: RolUsuario;
  fallback?: string;
};

export function TagRol({ rol, fallback = 'Sin sesion' }: TagRolProps) {
  return (
    <Tag
      color="#733711"
      className="!m-0 !flex !h-8 !items-center !justify-center !rounded-full !px-4 !text-xs !font-semibold !uppercase !tracking-wider !border-none"
    >
      {rol ?? fallback}
    </Tag>
  );
}
