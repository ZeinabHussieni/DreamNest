import React from "react";
import { useNavigate } from "react-router-dom";
import useGoalsList from "../../Hooks/userGoals/useGoalsList";
import useDeleteGoal from "../../Hooks/userGoals/useDeleteGoal";
import UserGoalCard from "./UserGoalCard";
import "./userGoals.css";
import image  from "../../Assets/Images/empty2.png";

const UserGoals: React.FC = () => {
  const nav = useNavigate();


  const [tab, setTab] = React.useState<"overview"|"in_progress"|"completed">("overview");
  const status =
    tab === "completed"   ? "completed" :
    tab === "in_progress" ? "in-progress" :
    undefined;


  const { goals, setGoals, loading, error, reload } = useGoalsList(status);
  const { deleteAction } = useDeleteGoal({ setGoals, reload });

  return (
    <section className="goals-section">
      {/* mini navbar */}
      <header className="ug-header">
        <div className="ug-tabs" role="tablist">
          <button
            type="button"
            className={`ug-tab ${tab === "overview" ? "active" : ""}`}
            onClick={() => setTab("overview")}
          >Overview</button>
          <button
            type="button"
            className={`ug-tab ${tab === "in_progress" ? "active" : ""}`}
            onClick={() => setTab("in_progress")}
          >In Progress</button>
          <button
            type="button"
            className={`ug-tab ${tab === "completed" ? "active" : ""}`}
            onClick={() => setTab("completed")}
          >Completed</button>
        </div>

        <button className="ug-create" onClick={() => nav("/createGoalPage")}>
          Create Goal
        </button>
      </header>
      

     {loading && <p>Loading goals…</p>}
     {error && <p className="error">{error}</p>}

     {!loading && !error && (
     <div className="goals-container">
       {goals.length === 0 ? (
      <div className="no-posts goal-post">
        <img src={image} alt="Welcome" />
        <p className="muted">No goals yet. Create your first goal</p>
      </div>
       ) : (
        goals.map((goal: any) => (
        <UserGoalCard key={goal.id} goal={goal} deleteAction={deleteAction} />
      ))
     )}
    </div>
    )}

  </section>
  );
};

export default UserGoals;
