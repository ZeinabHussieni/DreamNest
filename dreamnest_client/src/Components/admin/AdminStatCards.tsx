import React from "react";
import "../dashboard/dashboard.css"; 
import "../../Assets/Images/goal.png"
type Props = {
  usersTotal: number;
  postsTotal: number;
  goalsTotal: number;
  inProgressGoals: number;
  completedGoals: number;
  avgGoalProgress: number;
  totalInfractions: number;
  chatBlockedCount: number;
  siteBlockedCount: number;
};

const Card: React.FC<{ title: string; value: string; badge?: string }> = ({ title, value, badge }) => (
  <div className="card metric-card">
    <div className="metric-icon"><span /></div>
    <div className="metric-body">
      <div className="metric-top">

        <div className="metric-title">{title}</div>
        {badge ? <span className="metric-badgee">{badge}</span> : null}
      </div>
      <div className="metric-sub">{value}</div>
    </div>
  </div>
);

const AdminStatCards: React.FC<Props> = (p) => {
  return (
    <div className="metric-grid">
      <Card title="Users" value={`${p.usersTotal}`} />
      <Card title="Posts" value={`${p.postsTotal}`} />
      <Card title="Goals" value={`${p.goalsTotal}`} />
      <Card title="Active Goals" value={`${p.inProgressGoals}`} badge={`${Math.round((p.inProgressGoals / Math.max(1,p.goalsTotal))*100)}%`} />
      <Card title="Completed Goals" value={`${p.completedGoals}`} badge={`${Math.round((p.completedGoals / Math.max(1,p.goalsTotal))*100)}%`} />
      <Card title="Avg Goal Progress" value={`${p.avgGoalProgress.toFixed(1)}%`} />
      <Card title="Infractions (all time)" value={`${p.totalInfractions}`} />
      <Card title="Chat-blocked Users" value={`${p.chatBlockedCount}`} />
      <Card title="Site-blocked Users" value={`${p.siteBlockedCount}`} />
    </div>
  );
};

export default AdminStatCards;
