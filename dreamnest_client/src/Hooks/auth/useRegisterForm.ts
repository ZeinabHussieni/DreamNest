import { useActionState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import registerService from "../../Services/auth/registerService";
import { useAuth } from "../../Context/AuthContext";

type State = { success: boolean; error: string | null };

export default function useRegisterForm() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const registerAction = async (_prev: State, formData: FormData): Promise<State> => {
    try {
      const form = {
        firstName: String(formData.get("firstName") ?? ""),
        lastName: String(formData.get("lastName") ?? ""),
        userName: String(formData.get("userName") ?? ""),
        profilePictureBase64: String(formData.get("profilePictureBase64") ?? "") || undefined,
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
      };

      const response = await registerService(form as any);
      const { accessToken, user } = response.data;
      login(accessToken, user);

      toast.success("Registration successful!");
      navigate("/");

      return { success: true, error: null };
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to register");
      console.error("Register error:", error);
      return { success: false, error: error?.message || "Registration failed" };
    }
  };

  const [state, action, isPending] = useActionState<State, FormData>(registerAction, {
    success: false,
    error: null,
  });

  return { action, state, loading: isPending };
}
