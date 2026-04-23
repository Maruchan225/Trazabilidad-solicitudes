import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface PieData {
  nombre: string;
  cantidad: number;
}

interface GraficoTortaSimpleProps {
  datos: PieData[];
}

const COLORES = [
  '#4f46e5', // Indigo
  '#0d9488', // Teal
  '#d97706', // Amber
  '#e11d48', // Rose
  '#7c3aed', // Violet
];

export function GraficoTortaSimple({ datos }: GraficoTortaSimpleProps) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={datos}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="cantidad"
            nameKey="nombre"
          >
            {datos.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORES[index % COLORES.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: '12px',
              border: 'none',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            }}
          />
          <Legend
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            wrapperStyle={{ paddingTop: '20px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
