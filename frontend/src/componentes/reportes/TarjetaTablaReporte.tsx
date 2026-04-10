import { Card, Table } from 'antd';
import type { TableProps } from 'antd';
import { EstadoConsulta } from '@/componentes/ui/EstadoConsulta';

type TarjetaTablaReporteProps<T extends object> = {
  titulo: string;
  consulta: {
    loading: boolean;
    error: string | null;
    data: T[] | null;
  };
  rowKey: TableProps<T>['rowKey'];
  columns: TableProps<T>['columns'];
  emptyDescription: string;
  className?: string;
  pagination?: TableProps<T>['pagination'];
  size?: TableProps<T>['size'];
  locale?: TableProps<T>['locale'];
};

export function TarjetaTablaReporte<T extends object>({
  titulo,
  consulta,
  rowKey,
  columns,
  emptyDescription,
  className = 'rounded-3xl',
  pagination = false,
  size,
  locale,
}: TarjetaTablaReporteProps<T>) {
  const data = consulta.data ?? [];

  return (
    <Card className={className} title={titulo}>
      <EstadoConsulta
        loading={consulta.loading}
        error={consulta.error}
        data={consulta.data}
        empty={data.length === 0}
        emptyDescription={emptyDescription}
      >
        <Table<T>
          rowKey={rowKey}
          dataSource={data}
          columns={columns}
          pagination={pagination}
          size={size}
          locale={locale}
        />
      </EstadoConsulta>
    </Card>
  );
}
