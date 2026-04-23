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

const PALETA_COLORES = [
  '#0d9488', // Teal
  '#4f46e5', // Indigo
  '#d97706', // Amber
  '#e11d48', // Rose
  '#7c3aed', // Violet
  '#10b981', // Emerald
  '#0ea5e9', // Sky
  '#475569', // Slate
];

export function GraficoBarrasSimple({ datos }: GraficoBarrasSimpleProps) {
  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={datos}
          margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          <XAxis 
            dataKey="nombre" 
            tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            tick={{ fontSize: 10, fill: '#9ca3af' }}
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
            radius={[10, 10, 0, 0]}
            barSize={32}
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
