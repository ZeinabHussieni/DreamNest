import React from "react";
import useAdminDashboard from "../../Hooks/dashboard/useAdminDashboard";
import AdminStatCards from "../../Components/admin/AdminStatCards";
import AdminCharts from "../../Components/admin/AdminCharts";
import { AdminOffendersCard, AdminRecentBadCard } from "../../Components/admin/AdminModerationLists";
import "../dashboard/dashboard.css";

const AdminDashboardPage: React.FC = () => {
  const { data, loading, error } = useAdminDashboard();

  if (loading || !data) {
    return <div className="dash"><div className="card center">{error || "Loading admin dashboard…"}</div></div>;
  }

  const { totals, moderation, offenders, recentBadMessages, trends } = data;

  return (
    <div className="dash">
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <p className="title">Admin Dashboard</p>
      </div>

      <AdminStatCards
        usersTotal={totals.usersTotal}
        postsTotal={totals.postsTotal}
        goalsTotal={totals.goalsTotal}
        inProgressGoals={totals.inProgressGoals}
        completedGoals={totals.completedGoals}
        avgGoalProgress={totals.avgGoalProgress}
        totalInfractions={moderation.totalInfractions}
        chatBlockedCount={moderation.chatBlockedCount}
        siteBlockedCount={moderation.siteBlockedCount}
      />

      <AdminCharts
        postsPerMonth={trends.postsPerMonth}
        goalsPerMonth={trends.goalsPerMonth}
        badTextPerMonth={trends.badTextPerMonth}
        badVoicePerMonth={trends.badVoicePerMonth}
        badImagePerMonth={trends.badImagePerMonth}
        byType={moderation.byType}
      />

      <div className="chart-grid">
        <AdminOffendersCard items={offenders} />
        <AdminRecentBadCard items={recentBadMessages} />
      </div>
    </div>
  );
};

export default AdminDashboardPage;
