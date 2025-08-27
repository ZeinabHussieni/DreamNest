import React, { FormEvent, ChangeEvent } from "react";
import Button from "../../shared/button/Button";
import Input from "../../shared/authInput/AuthInput";
import useLogin from "../../../Hooks/auth/useLoginForm";


const Login: React.FC = () => {
  const { form, handleChange, handleSubmit,loading } = useLogin();


  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(e);
  };

  return (
    <form className="login-form" onSubmit={onSubmit}>
      <h2 className="form-title-login">Login</h2>

      <div className="Second">

        <Input
          name="identifier"
          hint="UserName or Email"
          placeholder="john@example.com"
          value={form.identifier}
          onChange={handleChange}
        />

        <Input
          type="password"
          name="password"
          hint="Password"
          placeholder="Enter your password"
          value={form.password}
          onChange={handleChange}
        />
      </div>

      <div className="button-login">
        <Button
          text={loading ? "Login..." : "Login"}
          onClick={() => {}}
        />
      </div>
    </form>
  );
};

export default Login;
