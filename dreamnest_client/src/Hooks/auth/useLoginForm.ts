import { useActionState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import loginService from "../../Services/auth/loginService";
import { useAuth } from "../../Context/AuthContext";
import { useState } from "react";
type User = {
  id?: number;
  email?: string;
  username?: string;

  [k: string]: unknown;// to let extra fields through without errors
};
type FieldErrors = Partial<Record<"identifier" | "password", string>>;


type LoginState = {
  success: boolean;
  error: string | null;
};

type LoginResponse = { //what axois should give us 
  data: {
    accessToken: string;
    user: User;
  };
};

export default function useLogin() {
  const navigate = useNavigate();


  const { login } = useAuth() as { login: (token: string, user: User) => void };
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

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
    } catch (e: any) {
     const message: string = e?.message || "Failed to login";
      const errors: FieldErrors = e?.errors || {};
      setFieldErrors(errors);
      toast.error(message);
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
    fieldErrors 
  };
}
