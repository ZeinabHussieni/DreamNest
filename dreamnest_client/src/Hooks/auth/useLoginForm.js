import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import loginService from "../../Services/auth/loginService";
import { useAuth } from "../../Context/AuthContext";

const useLogin = (initialForm = {
  identifier: "",
  password: ""
 }) => {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [message, setMessage] = useState({ type: "", text: "" });
  const timeoutRef = useRef(null);
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await loginService(form);
      login(token);
      toast.success("Login successful!")

      timeoutRef.current = setTimeout(() => {
        setMessage({ type: "", text: "" });
        navigate("/homePage");
      }, 700);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to login");
      console.error("Login error:", error);
      timeoutRef.current = setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => setForm(initialForm);

  return {
    form,
    handleChange,
    handleSubmit,
    loading,
    resetForm
  };
};


export default useLogin;
