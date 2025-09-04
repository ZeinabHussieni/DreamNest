import { useActionState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import loginService, {
  type LoginPayload,
  type LoginResult,
} from "../../Services/auth/loginService";
import { useAuth } from "../../Context/AuthContext";
import { useState } from "react";

type User = {
  id?: number;
  email?: string;
  username?: string; 
  [k: string]: unknown;
};

type FieldErrors = Partial<Record<"identifier" | "password", string>>;

type LoginState = {
  success: boolean;
  error: string | null;
};

export default function useLogin() {
  const navigate = useNavigate();


  const { login } = useAuth() as {
    login: (token: string, user: User, refreshToken?: string) => void;
  };

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const loginAction = async (
    _prevState: LoginState,
    formData: FormData
  ): Promise<LoginState> => {
    try {
      const form: LoginPayload = {
        identifier: String(formData.get("identifier") ?? ""),
        password: String(formData.get("password") ?? ""),
      };

      const result: LoginResult = await loginService(form);
      const { accessToken, refreshToken, user } = result;

     const mappedUser: User = {
     ...user,
     id: user.id,
     email: user.email,
     username: user.userName ?? "", 
     };


      login(accessToken, mappedUser, refreshToken);
      toast.success("Login successful!");
      navigate("/dashboard");

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
    fieldErrors,
  };
}
