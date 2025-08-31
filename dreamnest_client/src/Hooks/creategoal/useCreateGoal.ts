import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import createGoal from "../../Services/createGoal/createGoalService";

export default function useCreateGoal() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fd = new FormData(e.currentTarget);

      const payload = {
        title: String(fd.get("title") || "").trim(),
        description: String(fd.get("description") || "").trim(),
        helpText: (String(fd.get("helpText") || "").trim() || undefined) as string | undefined,
        visionBoardBase64: (String(fd.get("visionBoardBase64") || "") || undefined) as string | undefined,
      };

      if (!payload.title || !payload.description) {
        throw new Error("Title and description are required.");
      }

      await createGoal(payload as any);

      toast.success("Goal created successfully!");
      e.currentTarget.reset();
      setTimeout(() => navigate("/userGoals"), 100);
    } catch (err: unknown) {
      const anyErr = err as any;
      const msg =
        anyErr?.response?.data?.message ||
        anyErr?.message ||
        "Failed to create goal. Please check inputs.";
      toast.error(msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return { loading, handleSubmit };
}
