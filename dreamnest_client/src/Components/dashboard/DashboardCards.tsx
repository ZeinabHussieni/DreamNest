import React from "react";
import "./dashboard.css";
import goalPng from "../../Assets/Images/goal.png";

type StatProps = {
  total: number;
  completed: number;
  inProgress: number;
};

type Metric = {
  title: string;
  value: string;
  icon?: string;
  badge?: string;   
  ariaLabel?: string; 
};

const MetricCard: React.FC<Metric> = ({ title, value, icon = goalPng, badge, ariaLabel }) => (
  <div className="card metric-card">
    <div className="metric-icon">
      <img className="metric-img" src={icon} alt="" />
    </div>

    <div className="metric-body">
      <div className="metric-top">
        <div className="metric-title">{title}</div>
        {badge && (
          <span className="metric-badge">
            {badge}
          </span>
        )}
      </div>
      <div className="metric-sub">{value}</div>
    </div>
  </div>
);

const DashboardStatCards: React.FC<StatProps> = ({ total, inProgress, completed }) => {
  const safePct = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 100) : 0);

  const inProgressPct = safePct(inProgress, total); 
  const completionPct = safePct(completed, total);

  const metrics: Metric[] = [
    { title: "Total Goals", value: `${total} goals` },
    {
      title: "Active Goals",
      value: `${inProgress} ongoing`,
      badge: `${inProgressPct}%`,
      ariaLabel: "In-progress goals percentage",
    },
    {
      title: "Completed Goals",
      value: `${completed} done`,
      badge: `${completionPct}%`,
      ariaLabel: "Completed goals percentage",
    },
  ];

  return (
    <div className="metric-grid">
      {metrics.map((m) => (
        <MetricCard key={m.title} {...m} />
      ))}
    </div>
  );
};

export default DashboardStatCards;
