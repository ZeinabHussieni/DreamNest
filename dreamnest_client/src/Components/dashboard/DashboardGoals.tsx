import React from "react";
import { Link, useNavigate } from "react-router-dom";
import useGoalsList from "../../Hooks/userGoals/useGoalsList";
import "./dashboard.css";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

const DashboardGoals: React.FC = () => {
  const { goals, loading, error } = useGoalsList(undefined);
  const nav = useNavigate();

  const items = React.useMemo(
    () => (goals ?? []).slice(0, 4),
    [goals]
  );

  return (
    <div className="card dg-card">
      <div className="dg-head">
        <div>
          <div className="dg-title">Your Goals</div>
          <div className="dg-subtitle">
            Quick look at your goals & progress
          </div>
        </div>

        <div className="dg-actions">
          <button className="dg-btn" onClick={() => nav("/createGoalPage")}>
            + New Goal
          </button>
          <Link to="/usergoals" className="dg-link">View all</Link>
        </div>
      </div>

      {loading && <div className="dg-loading">Loading goals…</div>}
      {error && <div className="dg-error">{error}</div>}

      {!loading && !error && items.length === 0 && (
        <div className="dg-empty">
          <p>No goals yet. Let’s start your first one!</p>
          <button className="dg-btn" onClick={() => nav("/createGoalPage")}>
            Create Goal
          </button>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <ul className="dg-list">
          {items.map((g: any) => {
            const pct = clamp(g.progress ?? 0);
            return (
              <li key={g.id} className="dg-row">
                <div className="dg-main">
                  <div className="dg-title-sm">{g.title}</div>

                  <div
                    className="dg-progress"
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Progress for ${g.title}`}
                    title={`${pct}%`}
                  >
                    <div className="dg-track">
                      <div className="dg-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="dg-pct">{pct}%</span>
                  </div>
                </div>

                <Link to={`/goals/${g.id}`} className="dg-learn">
                  Learn more
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default DashboardGoals;
