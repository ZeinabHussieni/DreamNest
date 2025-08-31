import React from "react";
import { useParams, Link } from "react-router-dom";
import useGoalDetails from "../../Hooks/goalDetails/useGoalDetails";
import "./goalDetails.css";

const fmt = (d?: string | Date | null) => {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const GoalDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const goalId = Number(id);
  const { goal, plans, imageUrl, deadlineLabel, loading, error, onTogglePlan } =
    useGoalDetails(goalId);

  if (!Number.isFinite(goalId)) return <div className="gd-page"><p className="gd-error">Invalid goal id.</p></div>;
  if (loading) return <div className="gd-page"><p>Loading…</p></div>;
  if (error) return <div className="gd-page"><p className="gd-error">{error}</p></div>;
  if (!goal) return <div className="gd-page"><p>Goal not found.</p></div>;

  return (
    <div className="gd-page">
      {imageUrl && (
        <div className="gd-hero">
          <img src={imageUrl} alt={goal.title} />
        </div>
      )}

      <div className="gd-head">
        <h1 className="gd-title">{goal.title}</h1>
        <div className="gd-metrics">
          <span className="gd-metric"><strong>Progress:</strong> {Math.round(goal.progress ?? 0)}%</span>
          <span className="gd-metric"><strong>Deadline:</strong> {deadlineLabel}</span>
        </div>
      </div>

      <div className="gd-timeline">
        <div className="gd-line" aria-hidden />
        <ol className="gd-list">
          {plans.map(p => (
            <li key={p.id} className="gd-item">
              <span className={`gd-dot ${p.completed ? "done" : ""}`} aria-hidden />
              <div className="gd-card">
                <div className="gd-card-row">
                  <h3 className="gd-card-title">{p.title}</h3>
                </div>

                <p className="gd-desc">
                  <span className="gd-desc-label">Description:</span> {p.description}
                </p>

                <div className="gd-card-row">
                  <div className="gd-meta">
                    <span>Due: {fmt(p.due_date) || "—"}</span>
                  </div>
                  <button
                    className={`mark-btn ${p.completed ? "is-done" : ""}`}
                    onClick={() => onTogglePlan(p.id)}
                    aria-pressed={p.completed}
                  >
                    {p.completed ? "Marked as Done" : "Mark as Done"}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="gd-actions">
        <Link to="/userGoals" className="gd-back">Back to goals</Link>
      </div>
    </div>
  );
};

export default GoalDetailsPage;
