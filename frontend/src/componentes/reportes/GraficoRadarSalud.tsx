import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface RadarData {
  axis: string;
  value: number;
  fullMark: number;
}

interface GraficoRadarSaludProps {
  datos: {
    demanda: number;
    operacion: number;
    bloqueos: number;
    resolucion: number;
    riesgo: number;
  };
}

export function GraficoRadarSalud({ datos }: GraficoRadarSaludProps) {
  const chartData: RadarData[] = [
    { axis: 'Nuevas', value: datos.demanda, fullMark: 100 },
    { axis: 'En Curso', value: datos.operacion, fullMark: 100 },
    { axis: 'Con Pendientes', value: datos.bloqueos, fullMark: 100 },
    { axis: 'Terminadas', value: datos.resolucion, fullMark: 100 },
    { axis: 'Vencidas', value: datos.riesgo, fullMark: 100 },
  ];

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart
          cx="50%"
          cy="50%"
          outerRadius="70%"
          data={chartData}
          margin={{ top: 10, right: 30, bottom: 10, left: 30 }}
        >
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '16px',
              border: 'none',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              padding: '12px',
            }}
          />
          <Radar
            name="Estado"
            dataKey="value"
            stroke="#b5540d"
            fill="#b5540d"
            fillOpacity={0.5}
            animationDuration={1500}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
