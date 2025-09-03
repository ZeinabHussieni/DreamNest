import React from "react";
import "./dashboard.css";
import goalPng from "../../Assets/Images/goal.png";

type StatProps = {
  total: number;
  completed: number;
  inProgress: number;
  completionPct: number;
};

type Metric = { title: string; value: string; icon?: string };

const MetricCard: React.FC<Metric> = ({ title, value, icon = goalPng }) => (
  <div className="card metric-card">
    <div className="metric-icon">
      <img className="metric-img" src={icon} alt="" />
    </div>
    <div>
      <div className="metric-title">{title}</div>
      <div className="metric-sub">{value}</div>
    </div>
  </div>
);

const DashboardStatCards: React.FC<StatProps> = ({ total, inProgress, completed }) => {
  const metrics: Metric[] = [
    { title: "Total Goals",     value: `${total} goals` },
    { title: "Active Goals",    value: `${inProgress} ongoing` },
    { title: "Completed Goals", value: `${completed} done` },
  ];

  return (
    <>
      <div className="metric-grid">
        {metrics.map((m) => (
          <MetricCard key={m.title} {...m} />
        ))}
      </div>
    </>
  );
};

export default DashboardStatCards;
