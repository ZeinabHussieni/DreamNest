import React from "react";
import useDashboard from "../../Hooks/dashboard/useDashboard";
import DashboardStatCards from "../../Components/dashboard/DashboardCards";
import DashboardCharts from "../../Components/dashboard/DashboardCharts";
import DashboardGoals from "../../Components/dashboard/DashboardGoals";
import LeaderboardCard from "../../Components/dashboard/LeaderboardCard"; 
import "./dashboard.css";

const DashboardPage: React.FC = () => {
  const { data, loading } = useDashboard();

  if (loading || !data) {
    return (
      <div className="dash">
        <div className="card center">Loading dashboard…</div>
      </div>
    );
  }

  return (
    <div className="dash">
      <div><p className="title">Dashboard</p></div>

      <DashboardStatCards
        total={data.totalGoals}
        completed={data.completedGoals}
        inProgress={data.inProgressGoals}
      />


      <div className="chart-grid with-leaderboard">
        <div className="chart-stack">
          <DashboardGoals />
        </div>
        <aside className="chart-sidebar">
          <LeaderboardCard limit={3} />
        </aside>
      </div>

      <DashboardCharts
            postsPerMonth={data.postsPerMonth}
            goalsPerMonth={data.goalsPerMonth}
          />
    </div>
  );
};

export default DashboardPage;
