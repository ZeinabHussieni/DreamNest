import { useActionState } from "react";
import Swal from "sweetalert2";
import { deleteGoal } from "../../Services/goalDetails/goalDetailsService";
import type { Goal } from "../goalDetails/useGoalDetails";

type State = { lastDeletedId: number | null; error: string | null };

type Props = {
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  reload?: () => void | Promise<void>;
};

const initial: State = { lastDeletedId: null, error: null };

export default function useDeleteGoal({ setGoals, reload }: Props) {
  const action = async (prev: State, formData: FormData): Promise<State> => {
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
        width:400
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
    } catch (e: any) {
    
      await reload?.();
      await Swal.fire({
        title: "Failed",
        text: e?.response?.data?.message || "Failed to delete goal",
        icon: "error",
      });
      return { ...prev, error: e?.message || "Failed to delete goal" };
    }
  };

  const [state, submit, pending] = useActionState<State, FormData>(action, initial);
  return { state, deleteAction: submit, deleting: pending };
}
