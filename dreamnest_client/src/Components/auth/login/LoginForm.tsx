import React, { FormEvent, ChangeEvent } from "react";
import Button from "../../shared/button/Button";
import Input from "../../shared/authInput/AuthInput";
import useLogin from "../../../Hooks/auth/useLoginForm";


const Login: React.FC = () => {
  const { action,loading } = useLogin();


  return (
    <form className="login-form" action={action}>
      <h2 className="form-title-login">Login</h2>

      <div className="Second">

        <Input
          name="identifier"
          hint="UserName or Email"
          placeholder="john@example.com"
        />

        <Input
          type="password"
          name="password"
          hint="Password"
          placeholder="Enter your password"
        />
      </div>

      <div className="button-login">
        <Button
          text={loading ? "Login..." : "Login"}
        />
      </div>
    </form>
  );
};

export default Login;
