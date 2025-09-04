// src/Pages/dashboard/DashboardPage.tsx
import React from "react";
import useDashboard from "../../Hooks/dashboard/useDashboard";
import DashboardStatCards from "../../Components/dashboard/DashboardCards";
import DashboardCharts from "../../Components/dashboard/DashboardCharts";
import DashboardGoals from "../../Components/dashboard/DashboardGoals";
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

      <DashboardGoals />

      <DashboardCharts
        postsPerMonth={data.postsPerMonth}
        goalsPerMonth={data.goalsPerMonth}
      />
    </div>
  );
};

export default DashboardPage;
