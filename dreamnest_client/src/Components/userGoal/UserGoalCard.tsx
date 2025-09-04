import React from "react";
import { Link } from "react-router-dom";
import { useFormStatus } from "react-dom";
import useNextStep from "../../Hooks/userGoals/useNextStep";
import "./userGoals.css";


type Goal = {
  id: number;
  title: string;
  progress: number;
  createdAt: string; // ISO
};

type Props = {
  goal: Goal;
  deleteAction: (formData: FormData) => void | Promise<void>;
};

function DeleteBtn() {
  const { pending } = useFormStatus();
  return (
    <button className="delete-btn" type="submit" disabled={pending}>
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}

const ellipsize = (s: string, n = 40) => (s.length > n ? s.slice(0, n).trim() + "…" : s);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

const UserGoalCard: React.FC<Props> = ({ goal, deleteAction }) => {
  const pct = clamp(goal.progress);
  const { nextTitle, loading: nextLoading } = useNextStep(goal.id);

  return (
    <section className="user-goals">
    <div className="goal-card-pg">
      <div className="goal-date-card">{formatDate(goal.createdAt)}</div>
      <h3 className="goal-title-card">{goal.title}</h3>

      <div className={`next-step ${nextTitle ? "" : "done"}`}>
          <span className="next-step-label">Next:</span>{" "}
          {nextLoading ? "…" : nextTitle ? (
            <span className="next-step-text" title={nextTitle}>{ellipsize(nextTitle, 40)}</span>
          ) : (
            "All steps complete 🎉"
          )}
        </div>

      <div
        className="goal-progress"
        role="progressbar"
      >
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
          <span className="progress-dot" />
        </div>
        <span className="progress-pct">{pct}%</span>
      </div>

      <div className="btns">
        <Link to={`/goals/${goal.id}`} className="learn-more-btn">
          Learn more
        </Link>

   
        <form action={deleteAction} className="inline-form">
          <input type="hidden" name="id" value={goal.id} />
          <DeleteBtn />
        </form>
      </div>
    </div>
    </section>
  );
};

export default UserGoalCard;
