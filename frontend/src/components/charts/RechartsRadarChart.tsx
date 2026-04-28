import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';

export function RechartsRadarChart({
  data,
}: {
  data: {
    demand: number;
    operation: number;
    blocked: number;
    solved: number;
    risk: number;
  };
}) {
  const rows = [
    { axis: 'Nuevas', value: data.demand },
    { axis: 'En curso', value: data.operation },
    { axis: 'Pendientes', value: data.blocked },
    { axis: 'Terminadas', value: data.solved },
    { axis: 'Vencidas', value: data.risk },
  ];

  return (
    <div className="chart-height">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="72%" data={rows} margin={{ top: 10, right: 28, bottom: 10, left: 28 }}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="axis" tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }} />
          <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', padding: 12 }} />
          <Radar name="Estado" dataKey="value" stroke="#b5540d" fill="#b5540d" fillOpacity={0.5} animationDuration={1500} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
