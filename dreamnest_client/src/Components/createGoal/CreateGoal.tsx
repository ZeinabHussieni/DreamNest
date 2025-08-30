import React, { useState } from "react";
import Button from "../../Components/shared/button/Button";
import FormInput from "../../Components/shared/input/Input";
import ImageInput from "../../Components/shared/imageInput/ImageInput";
import "./createGoal.css";

const CreateGoal: React.FC = () => {
  const [loading, setLoading] = useState(false);

  return (
    <form className="create-form">
      <h2 className="create-title">Create Your Goal</h2>

      <div className="create-first-row">
        <FormInput
          name="title"
          label="Title"
          placeholder="Learn Python"
        />

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
        <Button text={loading ? "Submitting..." : "Submit"} />
      </div>
    </form>
  );
};

export default CreateGoal;
