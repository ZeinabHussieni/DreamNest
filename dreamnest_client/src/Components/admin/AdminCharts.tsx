import React, { useMemo } from "react";
import {
  ResponsiveContainer, ComposedChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell
} from "recharts";
import { MonthCounts, mergeMonthSeries, toBarSeries, stack3 } from "../../Utils/series";
import "../dashboard/dashboard.css";

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="card chart-card">
    <div className="chart-title">{title}</div>
    {children}
  </div>
);

type Props = {
  postsPerMonth: MonthCounts;
  goalsPerMonth: MonthCounts;
  badTextPerMonth: MonthCounts;
  badVoicePerMonth: MonthCounts;
  badImagePerMonth: MonthCounts;
  byType: { text: number; voice: number; image: number };
};

const AdminCharts: React.FC<Props> = ({
  postsPerMonth, goalsPerMonth,
  badTextPerMonth, badVoicePerMonth, badImagePerMonth,
  byType
}) => {
  const compareSeries = useMemo(() => mergeMonthSeries(goalsPerMonth, postsPerMonth), [goalsPerMonth, postsPerMonth]);
  const badStack = useMemo(() => stack3(badTextPerMonth, badVoicePerMonth, badImagePerMonth),
    [badTextPerMonth, badVoicePerMonth, badImagePerMonth]);

  const donutData = useMemo(() => ([
    { name: "Text", value: byType.text },
    { name: "Voice", value: byType.voice },
    { name: "Image", value: byType.image },
  ]), [byType]);

  return (
    <>
      <div className="chart-grid">
        <ChartCard title="Goals vs Posts per Month">
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={compareSeries} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} strokeOpacity={0.15} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="a" name="Goals" fill="var(--button-bg)" />
              <Bar dataKey="b" name="Posts" fill="var(--purple-1)" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Moderation Incidents per Month (stacked)">
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={badStack} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} strokeOpacity={0.15} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="a" stackId="m" name="Text" fill="var(--purple-1)" />
              <Bar dataKey="b" stackId="m" name="Voice" fill="var(--purple-2)" />
              <Bar dataKey="c" stackId="m" name="Image" fill="var(--button-bg)" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Infractions by Type (total)">
        <div className="donut-wrap">
          <div className="donut-legend">
            {donutData.map((d, i) => (
              <div key={d.name} className="legend-item">
                <span className="legend-bullet" style={{ background: i===0 ? "var(--purple-1)" : i===1 ? "var(--accent)" : "var(--accent-3)" }} />
                <span>{d.name} — <strong>{d.value}</strong></span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={100} paddingAngle={2}>
                <Cell fill="var(--purple-1)" />
                <Cell fill="var(--purple-2)" />
                <Cell fill="var(--button-bg)" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </>
  );
};

export default AdminCharts;
