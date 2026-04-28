import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

type ChartItem = {
  label: string;
  value: number;
  color?: string;
};

const colors = ['#10b981', '#f59e0b', '#ef4444'];

export function RechartsDonutChart({ data }: { data: ChartItem[] }) {
  return (
    <div className="chart-height">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="45%" innerRadius={60} outerRadius={80} paddingAngle={5} animationDuration={1500}>
            {data.map((item, index) => (
              <Cell key={item.label} fill={item.color ?? colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', padding: 12 }} />
          <Legend iconType="circle" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: 20, fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
