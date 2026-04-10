import { Card, List } from 'antd';
import { TagCantidad } from '@/componentes/ui/tags/TagCantidad';

type TarjetaListaCantidadProps<T> = {
  titulo: string;
  items: T[];
  emptyText: string;
  obtenerClave: (item: T) => string | number;
  obtenerTitulo: (item: T) => string;
  obtenerCantidad: (item: T) => number;
};

export function TarjetaListaCantidad<T>({
  titulo,
  items,
  emptyText,
  obtenerClave,
  obtenerTitulo,
  obtenerCantidad,
}: TarjetaListaCantidadProps<T>) {
  return (
    <Card title={titulo} className="rounded-3xl h-full">
      <List<T>
        dataSource={items}
        locale={{ emptyText }}
        renderItem={(item) => (
          <List.Item key={obtenerClave(item)}>
            <List.Item.Meta title={obtenerTitulo(item)} />
            <TagCantidad valor={obtenerCantidad(item)} />
          </List.Item>
        )}
      />
    </Card>
  );
}
