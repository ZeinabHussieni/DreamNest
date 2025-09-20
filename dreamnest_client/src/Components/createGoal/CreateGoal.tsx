import React, { useEffect, useState } from "react";
import Button from "../../Components/shared/button/Button";
import FormInput from "../../Components/shared/input/Input";
import ImageInput from "../../Components/shared/imageInput/ImageInput";
import useCreateGoal from "../../Hooks/creategoal/useCreateGoal";
import Loading from "../../Assets/Animations/loading.json";
import Lottie from "lottie-react";
import "./createGoal.css";

const CreateGoal: React.FC = () => {
  const { loading, handleSubmit } = useCreateGoal();

  const lines = [
    "Saving your goal…",
    "Spinning up the plan…",
    "Almost there…",
    "Getting things ready for you…",
  ];
  const [i, setI] = useState(0);


  useEffect(() => {
    document.body.classList.toggle("no-scroll", loading);

    if (!loading) return;
    setI(0);
    const t = setInterval(() => setI((v) => (v + 1) % lines.length), 1400);
    return () => {
      clearInterval(t);
      document.body.classList.remove("no-scroll");
    };
  }, [loading]);

  return (
    <>
      <form className="create-form" onSubmit={handleSubmit}>
        <h2 className="create-title">Create Your Goal</h2>

        <div className="create-first-row">
          <FormInput name="title" label="Title" placeholder="Learn Python" />

          <ImageInput
            name="visionBoardBase64"
            hint="Upload image"
            className="create-grid-item"
            triggerClassName="image-trigger-like"
            triggerClassNamee="dd"
            labelClassName="form-label"
            unstyledLabel
          />

          <FormInput
            name="helpText"
            label="How You Can Help Others (Optional)"
            placeholder="I can help with coding"
          />
        </div>

        <div className="createSecond">
          <label className="Description-label" htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            placeholder="I want to learn Python to build small projects and prepare for a developer job…"
            className="create-big-textarea"
          />
        </div>

        <div className="button-create">
          <Button text={loading ? "Submitting..." : "Submit"} disabled={loading} />
        </div>
      </form>

     {loading && (
        <div className="goal-loading-overlay" role="status" aria-live="polite">
          <div className="goal-loading-card">
            <Lottie animationData={Loading} loop className="goal-lottie" />
            <div className="goal-spinner" aria-hidden="true" />

            <h3 className="goal-loading-title">Creating your goal</h3>
            <p className="goal-loading-text">{lines[i]}</p>
          </div>
        </div>
      )}
    </>
  );
};

export default CreateGoal;
