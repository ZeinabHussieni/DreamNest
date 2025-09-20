import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line,
  ComposedChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";
import { MonthCounts, mergeMonthSeries, toBarSeries } from "../../Utils/series";
import "./dashboard.css";

type Props = {
  postsPerMonth: MonthCounts;
  goalsPerMonth: MonthCounts;
};

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="card chart-card">
    <div className="chart-title">{title}</div>
    {children}
  </div>
);

const DashboardCharts: React.FC<Props> = ({ postsPerMonth, goalsPerMonth }) => {
  const postsSeries   = useMemo(() => toBarSeries(postsPerMonth),   [postsPerMonth]);
  const goalsSeries   = useMemo(() => toBarSeries(goalsPerMonth),   [goalsPerMonth]);
  const compareSeries = useMemo(() => mergeMonthSeries(goalsPerMonth, postsPerMonth), [goalsPerMonth, postsPerMonth]);

  const donutData   = postsSeries.map(d => ({ name: d.month, value: d.value }));
  const donutColors = ["var(--accent-2)", "var(--accent)", "var(--accent-3)"];
  

  return (
    <>
   
      <div className="chart-grid">
        <ChartCard title="Posts Created per Month">
          <div className="donut-wrap">
            <div className="donut-legend">
              {donutData.slice(-3).map((d, i) => (
                <div className="legend-item" key={d.name}>
                  <span className="legend-bullet" style={{ background: donutColors[i % donutColors.length] }} />
                  <span>{d.name} — <strong>{d.value}</strong></span>
                </div>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={donutData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {donutData.map((_, i) => (
                  <Cell key={i} fill="var(--button-bg)" /> 
                   ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Goals Created per Month">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={goalsSeries} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} strokeOpacity={0.15} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="value" name="Goals"  stroke="var(--button-bg)" strokeWidth={2} dot={{ r: 3, fill: "var(--button-bg)" }} 
              activeDot={{ r: 5, fill: "var(--button-bg)" }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

 
      <ChartCard title="Goals vs Posts per Month">
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={compareSeries} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} strokeOpacity={0.15} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
         
            <Bar dataKey="a" stackId="x" name="Goals" fill="var(--button-bg)" />
            <Bar dataKey="b" stackId="x" name="Posts" fill="var(--purple-1)" />

          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>
    </>
  );
};

export default DashboardCharts;
