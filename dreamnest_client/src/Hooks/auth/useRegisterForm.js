import { useActionState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import registerService from "../../Services/auth/registerService";
import { useAuth } from "../../Context/AuthContext";

const useRegister = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const registerAction = async (prevState, formData) => {
    try {

      const form = {
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName") ,
        userName: formData.get("userName"),
        profilePictureBase64: formData.get("profilePictureBase64") ,
        email: formData.get("email"),
        password: formData.get("password"),
      };

      const response  = await registerService(form);
      const { accessToken, user } = response.data;
      login(accessToken,user);

      toast.success("Registration successful!");
      navigate("/");

      return { success: true, error: null };
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to register");
      console.error("Register error:", error);
      return { success: false, error: error?.message || "Registration failed" };
    }
  };

  const [state, action, isPending] = useActionState(registerAction, {
    success: false,
    error: null,
  });

  return {
    action,
    state,
    loading: isPending,
  };
};

export default useRegister;
