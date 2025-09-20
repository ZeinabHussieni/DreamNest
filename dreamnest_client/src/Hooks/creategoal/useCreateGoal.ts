import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import createGoal from "../../Services/createGoal/createGoalService";

export default function useCreateGoal() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
 
    const form = e.currentTarget; 
    setLoading(true);

    try {
      const fd = new FormData(form);

      const payload = {
        title: String(fd.get("title") || "").trim(),
        description: String(fd.get("description") || "").trim(),
        helpText: ((String(fd.get("helpText") || "").trim()) || undefined) as string | undefined,
        visionBoardBase64: ((String(fd.get("visionBoardBase64") || "")) || undefined) as string | undefined,
      };

      if (!payload.title || !payload.description) {
        throw new Error("Title and description are required.");
      }

      await createGoal(payload as any);

      toast.success("Goal created successfully!");

      if (form && typeof form.reset === "function") form.reset();
      navigate("/userGoals");

    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create goal. Please check inputs.";
      toast.error(msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return { loading, handleSubmit };
}
