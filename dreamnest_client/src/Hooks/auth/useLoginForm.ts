import { useActionState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import loginService from "../../Services/auth/loginService";
import { useAuth } from "../../Context/AuthContext";

type User = {
  id?: number;
  email?: string;
  username?: string;

  [k: string]: unknown;
};

type LoginState = {
  success: boolean;
  error: string | null;
};

type LoginResponse = {
  data: {
    accessToken: string;
    user: User;
  };
};

export default function useLogin() {
  const navigate = useNavigate();


  const { login } = useAuth() as { login: (token: string, user: User) => void };

  const loginAction = async (
    _prevState: LoginState,
    formData: FormData
  ): Promise<LoginState> => {
    try {
      const form = {
        identifier: String(formData.get("identifier") ?? ""),
        password: String(formData.get("password") ?? ""),
      };

      const response = (await loginService(form)) as LoginResponse;
      const { accessToken, user } = response.data;

      login(accessToken, user);
      toast.success("Login successful!");
      navigate("/");

      return { success: true, error: null };
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        (error as Error).message ||
        "Failed to login";

      toast.error(message);
      console.error("Login error:", error);

      return { success: false, error: message };
    }
  };

  const [state, action, isPending] = useActionState<LoginState, FormData>(
    loginAction,
    { success: false, error: null }
  );

  return {
    action,         
    state,         
    loading: isPending,
  };
}
