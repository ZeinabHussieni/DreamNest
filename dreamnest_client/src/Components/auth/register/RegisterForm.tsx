import React from "react";
import Button from "../../shared/button/Button";
import Input from "../../shared/authInput/AuthInput";
import useRegister from "../../../Hooks/auth/useRegisterForm";
import ImageInput from "../../shared/imageInput/ImageInput";

const RegisterForm: React.FC = () => {
  const { action, loading, fieldErrors } = useRegister();

  return (
    <form className="register-form" action={action} noValidate>
      <h2 className="form-title">Create an account</h2>

      <div className="name-row firstlast">
        <Input
          name="firstName"
          hint="First Name"
          placeholder="John"
          error={fieldErrors.firstName}
        />
        <Input
          name="lastName"
          hint="Last Name"
          placeholder="Doe"
          error={fieldErrors.lastName}
        />
      </div>

      <div className="name-row-two firstlast">
        <Input
          name="userName"
          hint="Username"
          placeholder="john.doe"
          error={fieldErrors.userName}
        />

        <ImageInput
          name="profilePictureBase64"
          hint="Upload your profile"

        />
      </div>

      <div className="Second">
        <Input
          name="email"
          hint="Email"
          placeholder="john@example.com"
          error={fieldErrors.email}
        />
        <Input
          type="password"
          name="password"
          hint="Password"
          placeholder="Enter your password"
          error={fieldErrors.password}
        />
      </div>

      <div className="button-register">
        <Button text={loading ? "Registering..." : "Register"} />
      </div>
    </form>
  );
};

export default RegisterForm;
