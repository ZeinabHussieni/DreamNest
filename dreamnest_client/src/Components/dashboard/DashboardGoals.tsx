import React from "react";
import { useNavigate } from "react-router-dom";
import useGoalsList from "../../Hooks/userGoals/useGoalsList";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { ProgressBar } from "primereact/progressbar";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

const DashboardGoals: React.FC = () => {
  const { goals, loading, error } = useGoalsList(undefined);
  const nav = useNavigate();
  const items = React.useMemo(() => (goals ?? []).slice(0, 4), [goals]);

  return (
    <Card
      title="Your Goals"
      subTitle="Quick look at your goals & progress"
      className="goals-card p-card-shadow"
      footer={
        <div className="footer-actions">
          <Button label="+ New Goal" size="small" className="goal-btn" onClick={() => nav("/createGoalPage")} />
          <Button label="View All" size="small" className="border-btn" outlined onClick={() => nav("/usergoals")} />
        </div>
      }
    >
      {loading && <p className="text-500">Loading goals…</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <div className="empty-state">
          <i className="pi pi-inbox empty-icon" />
          <p className="empty-text">No goals yet. Let’s start your first one!</p>
          <Button label="Create Goal" onClick={() => nav("/createGoalPage")} />
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="goals-list">
          {items.map((g: any) => {
            const pct = clamp(g.progress ?? 0);
            return (
              <div key={g.id} className="goal-item">
                <div className="goal-top">
                  <h4 className="goal-title">{g.title}</h4>
                  <Button
                    label="Learn more"
                    size="small"
                    text
                    icon="pi pi-arrow-right"
                    iconPos="right"
                    className="goal-link-btn"
                    onClick={() => nav(`/goals/${g.id}`)}
                  />
                </div>

                <ProgressBar
                  value={pct}
                  showValue
                  className="goal-progress"
                />
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default DashboardGoals;
