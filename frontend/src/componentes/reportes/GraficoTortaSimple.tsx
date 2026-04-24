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

const COLORES_SEMAFORO = [
  '#10b981', // Verde
  '#f59e0b', // Amarillo
  '#ef4444', // Rojo
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
            animationDuration={1500}
          >
            {datos.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORES_SEMAFORO[index % COLORES_SEMAFORO.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: '16px',
              border: 'none',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              padding: '12px',
            }}
          />
          <Legend
            iconType="circle"
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ paddingTop: '20px', fontSize: '11px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
