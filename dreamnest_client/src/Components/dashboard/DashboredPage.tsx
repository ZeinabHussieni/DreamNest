import React from "react";
import useDashboard from "../../Hooks/dashboard/useDashboard";
import DashboardStatCards from "../../Components/dashboard/DashboardCards";
import DashboardCharts from "../../Components/dashboard/DashboardCharts";
import "./dashboard.css";

const Header: React.FC<{ completionPct: number; inProgressPct: number; onRefresh: () => void }> = ({
  completionPct,
  inProgressPct,
  onRefresh,
}) => (
  <div className="card dash-header">
    <div className="dash-title">
      <h2>Your Dashboard</h2>
      <p>
        Completion: <strong>{completionPct}%</strong> • In progress:{" "}
        <strong>{inProgressPct}%</strong>
      </p>
    </div>
    <button className="mark-all" onClick={onRefresh}>Refresh</button>
  </div>
);

const DashboardPage: React.FC = () => {
  const { data, loading, completionPct, inProgressPct, refresh } = useDashboard();

  if (loading || !data) {
    return (
      <div className="dash">
        <div className="card center">Loading dashboard…</div>
      </div>
    );
  }

  return (
    <div className="dash">
      <Header
        completionPct={completionPct}
        inProgressPct={inProgressPct}
        onRefresh={refresh}
      />

      <DashboardStatCards
        total={data.totalGoals}
        completed={data.completedGoals}
        inProgress={data.inProgressGoals}
        completionPct={completionPct}
      />

      <DashboardCharts
        postsPerMonth={data.postsPerMonth}
        goalsPerMonth={data.goalsPerMonth}
      />
    </div>
  );
};

export default DashboardPage;
