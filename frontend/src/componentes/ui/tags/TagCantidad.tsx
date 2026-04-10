import { Tag } from 'antd';

type TagCantidadProps = {
  valor: string | number;
  color?: string;
};

export function TagCantidad({
  valor,
  color = 'default',
}: TagCantidadProps) {
  return <Tag color={color}>{valor}</Tag>;
}
