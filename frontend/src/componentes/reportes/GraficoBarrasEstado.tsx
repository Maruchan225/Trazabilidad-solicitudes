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

const PALETA_COLORES = [
  '#4f46e5', // Indigo
  '#0d9488', // Teal
  '#d97706', // Amber
  '#e11d48', // Rose
  '#7c3aed', // Violet
  '#10b981', // Emerald
  '#0ea5e9', // Sky
  '#475569', // Slate
];

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
            tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }}
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
            {datos.map((_, index) => (
              <Cell key={`cell-${index}`} fill={PALETA_COLORES[index % PALETA_COLORES.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
