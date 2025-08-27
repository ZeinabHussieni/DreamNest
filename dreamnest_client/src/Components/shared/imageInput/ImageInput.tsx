import React, { ChangeEvent, useState } from "react";
import camera from "../../../Assets/Icons/camera.svg";
import "./imageInput.css";

type ImageInputProps = {
  name: string;
  hint: string;
};

const ImageInput: React.FC<ImageInputProps> = ({ name, hint }) => {
  const [fileName, setFileName] = useState<string>("");

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setFileName(file.name);

      const reader = new FileReader();
      reader.onloadend = () => {
        const hiddenInput = document.getElementById(
          `${name}-hidden`
        ) as HTMLInputElement;
        if (hiddenInput) {
          hiddenInput.value = reader.result as string;
        }
      };
      reader.readAsDataURL(file);
    } else {
      setFileName("");
    }
  };

  return (
    <div className="input-group-auth imageauth">
      <label className="auth-label authLabel" htmlFor={name}>
        {hint}
      </label>

      <label htmlFor={name} className="primary-input-auth image-input-label">
        <img src={camera} className="camera" />
        {fileName ? fileName : "Select Image"}
      </label>

      <input
        id={name}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      <input id={`${name}-hidden`} type="hidden" name={name} />
    </div>
  );
};

export default ImageInput;
