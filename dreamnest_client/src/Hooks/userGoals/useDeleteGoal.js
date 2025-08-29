import { useActionState } from "react";
import Swal from "sweetalert2";
import { deleteGoal } from "../../Services/goalDetails/goalDetailsService";

const initial = { lastDeletedId: null, error: null };

export default function useDeleteGoalAction({ setGoals, reload }) {
  const action = async (prev, formData) => {
    try {
      const id = Number(formData.get("id"));
      if (!id) return prev;

      const { isConfirmed } = await Swal.fire({
        title: "Delete this goal?",
        text: "This action cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Delete",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#e0524c",
        cancelButtonColor: "#6f56c5",
        reverseButtons: true,
        focusCancel: true,
      });
      if (!isConfirmed) return prev;

    
      setGoals(prevGoals => prevGoals.filter(g => g.id !== id));

      await deleteGoal(id);

      await Swal.fire({
        title: "Deleted",
        text: "Goal removed successfully.",
        icon: "success",
        timer: 1200,
        showConfirmButton: false,
      });

      return { lastDeletedId: id, error: null };
    } catch (e) {
 
      reload?.();
      await Swal.fire({
        title: "Failed",
        text: e?.response?.data?.message || "Failed to delete goal",
        icon: "error",
      });
      return { ...prev, error: e?.message || "Failed to delete goal" };
    }
  };

  const [state, submit, pending] = useActionState(action, initial);
  return { state, deleteAction: submit, deleting: pending };
}
