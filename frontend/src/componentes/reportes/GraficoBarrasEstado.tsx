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

interface BarData {
  estado: string;
  cantidad: number;
}

interface GraficoBarrasEstadoProps {
  datos: BarData[];
}

const COLORES_SEMAFORO: Record<string, string> = {
  Vencida: '#ef4444', // Rojo
  'Pendiente Información': '#ef4444', // Rojo (Requiere atención)
  'En Proceso': '#f59e0b', // Amarillo
  Ingresada: '#f59e0b', // Amarillo
  Derivada: '#f59e0b', // Amarillo
  Finalizada: '#10b981', // Verde
  Cerrada: '#10b981', // Verde
};

const COLOR_POR_DEFECTO = '#64748b'; // Slate para otros

export function GraficoBarrasEstado({ datos }: GraficoBarrasEstadoProps) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={datos}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
          barGap={10}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
          <XAxis type="number" hide />
          <YAxis
            dataKey="estado"
            type="category"
            tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 500 }}
            width={100}
            axisLine={false}
            tickLine={false}
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
            radius={[0, 10, 10, 0]}
            barSize={18}
            background={{ fill: '#f3f4f6', radius: 10 }}
            animationDuration={1500}
          >
            {datos.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORES_SEMAFORO[entry.estado] || COLOR_POR_DEFECTO}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
