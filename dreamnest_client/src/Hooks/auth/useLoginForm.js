import { useActionState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import loginService from "../../Services/auth/loginService";
import { useAuth } from "../../Context/AuthContext";

const useLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

 
  const loginAction = async (prevState, formData) => {
    try {
      const form = {
        identifier: formData.get("identifier"),
        password: formData.get("password"),
      };

      const response = await loginService(form);
      const { accessToken, user } = response.data;
      login(accessToken, user);

      toast.success("Login successful!");

      navigate("/");
      return { success: true, error: null };

    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to login");
      console.error("Login error:", error);
      return { success: false, error: error?.message || "Login failed" };
    }
  };


  const [state, action, isPending] = useActionState(loginAction, {
    success: false,
    error: null,
  });

  return {
    action,  
    state,  
    loading: isPending,
  };
};

export default useLogin;
