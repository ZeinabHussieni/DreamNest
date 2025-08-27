import React, { FormEvent, ChangeEvent } from "react";
import Button from "../../shared/button/Button";
import Input from "../../shared/authInput/AuthInput";
import useRegister from "../../../Hooks/auth/useRegisterForm";
import ImageInput from "../../shared/imageInput/ImageInput";

const RegisterForm: React.FC = () => {
  const { form, handleChange, handleSubmit, handleImageChange,loading } = useRegister();


  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(e);
  };

  return (
    <form className="register-form" onSubmit={onSubmit}>
      <h2 className="form-title">Create an account</h2>

      <div className="name-row firstlast">
        <Input
          name="firstName"
          hint="First Name"
          placeholder="John"
          value={form.firstName}
          onChange={handleChange}
        />
        <Input
          name="lastName"
          hint="Last Name"
          placeholder="Doe"
          value={form.lastName}
          onChange={handleChange}
        />
      </div>

      <div className="name-row-two firstlast">
      <Input
          name="userName"
          hint="Username"
          placeholder="john.doe"
          value={form.userName}
          onChange={handleChange}
        />

        <ImageInput
         name="profilePictureBase64"
         hint="Upload your profile"
         onChange={handleImageChange}
        />

        </div>

      <div className="Second">

        <Input
          name="email"
          hint="Email"
          placeholder="john@example.com"
          value={form.email}
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

      <div className="button-register">
        <Button
          text={loading ? "Registering..." : "Register"}
          onClick={() => {}}
        />
      </div>
    </form>
  );
};

export default RegisterForm;
