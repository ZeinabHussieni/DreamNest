import React from "react";
import "../dashboard/dashboard.css"; 
import goalPng from "../../Assets/Images/goal.png";
import block from "../../Assets/Icons/block-visitor-svgrepo-com.svg";
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

const Card: React.FC<{ title: string; value: string; icon?:string;badge?: string }> = ({ title, value,icon, badge }) => (
  <div className="card metric-card">
     <div className="metric-icon">
       {icon && <img className="metric-img" src={icon} alt="" />}
    </div>
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
      
      <Card title="Users" icon={goalPng} value={`${p.usersTotal}`} />
      <Card title="Posts" icon={goalPng} value={`${p.postsTotal}`} />
      <Card title="Goals" icon={goalPng} value={`${p.goalsTotal}`} />
      <Card title="Active Goals" icon={goalPng}  value={`${p.inProgressGoals}`} badge={`${Math.round((p.inProgressGoals / Math.max(1,p.goalsTotal))*100)}%`} />
      <Card title="Completed Goals" icon={goalPng}  value={`${p.completedGoals}`} badge={`${Math.round((p.completedGoals / Math.max(1,p.goalsTotal))*100)}%`} />
      <Card title="Avg Goal Progress" icon={goalPng}  value={`${p.avgGoalProgress.toFixed(1)}%`} />
      <Card title="Infractions (all time)" icon={block} value={`${p.totalInfractions}`} />
      <Card title="Chat-blocked Users" icon={block}  value={`${p.chatBlockedCount}`} />
      <Card title="Site-blocked Users" icon={block} value={`${p.siteBlockedCount}`} />
    </div>
  );
};

export default AdminStatCards;
