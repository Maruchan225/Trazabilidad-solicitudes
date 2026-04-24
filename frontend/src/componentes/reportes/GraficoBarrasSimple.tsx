import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface DataItem {
  nombre: string;
  cantidad: number;
}

interface GraficoBarrasSimpleProps {
  datos: DataItem[];
  color?: string;
}

const COLORES_SEMAFORO = [
  '#10b981', // Verde
  '#f59e0b', // Amarillo
  '#ef4444', // Rojo
];

export function GraficoBarrasSimple({ datos }: GraficoBarrasSimpleProps) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={datos}
          layout="horizontal"
          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          <XAxis
            dataKey="nombre"
            axisLine={false}
            tickLine={false}
            interval={0}
            tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 500 }}
            tickFormatter={(valor: string) =>
              valor === 'Atencion al Publico' ? 'Atencion' : valor
            }
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
          />
          <Tooltip
            cursor={{ fill: '#f9fafb', opacity: 0.4 }}
            contentStyle={{
              borderRadius: '16px',
              border: 'none',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              padding: '12px',
            }}
          />
          <Bar
            dataKey="cantidad"
            radius={[10, 10, 0, 0]}
            barSize={32}
            animationDuration={1500}
          >
            {datos.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORES_SEMAFORO[index % COLORES_SEMAFORO.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
