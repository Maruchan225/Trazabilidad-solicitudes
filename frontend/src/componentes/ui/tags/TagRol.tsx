import { Tag } from 'antd';
import type { RolUsuario } from '@/tipos/comun';

type TagRolProps = {
  rol?: RolUsuario;
  fallback?: string;
};

export function TagRol({ rol, fallback = 'Sin sesion' }: TagRolProps) {
  return <Tag color="#6b7280">{rol ?? fallback}</Tag>;
}
