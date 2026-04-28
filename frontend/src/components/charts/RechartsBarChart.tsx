import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type ChartItem = {
  label: string;
  value: number;
  color?: string;
};

const colors = ['#10b981', '#f59e0b', '#ef4444'];

export function RechartsBarChart({ data, vertical = false }: { data: ChartItem[]; vertical?: boolean }) {
  return (
    <div className="chart-height">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout={vertical ? 'vertical' : 'horizontal'} margin={{ top: 12, right: 24, left: vertical ? 34 : 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          {vertical ? (
            <>
              <XAxis type="number" hide />
              <YAxis dataKey="label" type="category" width={108} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 500 }} />
            </>
          ) : (
            <>
              <XAxis dataKey="label" axisLine={false} tickLine={false} interval={0} tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 500 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
            </>
          )}
          <Tooltip cursor={{ fill: '#f9fafb', opacity: 0.4 }} contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', padding: 12 }} />
          <Bar dataKey="value" radius={vertical ? [0, 10, 10, 0] : [10, 10, 0, 0]} barSize={vertical ? 18 : 32} background={vertical ? { fill: '#f3f4f6', radius: 10 } : undefined} animationDuration={1500}>
            {data.map((item, index) => (
              <Cell key={item.label} fill={item.color ?? colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
