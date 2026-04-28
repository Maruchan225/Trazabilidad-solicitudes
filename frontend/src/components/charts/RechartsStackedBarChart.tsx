import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type StackKey = {
  key: string;
  label: string;
  color: string;
};

type StackedBarChartProps = {
  data: Array<Record<string, string | number>>;
  stackKeys: StackKey[];
};

export function RechartsStackedBarChart({ data, stackKeys }: StackedBarChartProps) {
  const chartHeight = Math.max(data.length <= 1 ? 220 : 320, data.length * 42 + 88);

  return (
    <div className="stacked-chart-scroll">
      <div style={{ height: chartHeight, minWidth: 640 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 12, right: 24, left: 24, bottom: 12 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <YAxis dataKey="label" type="category" width={180} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 500 }} />
            <Tooltip
              cursor={{ fill: '#f9fafb', opacity: 0.4 }}
              isAnimationActive={false}
              wrapperStyle={{ pointerEvents: 'none', zIndex: 10 }}
              contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', padding: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {stackKeys.map((item) => (
              <Bar key={item.key} dataKey={item.key} name={item.label} stackId="status" fill={item.color} barSize={22} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
