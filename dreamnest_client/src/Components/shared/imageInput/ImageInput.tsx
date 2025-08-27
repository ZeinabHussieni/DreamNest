import React, { ChangeEvent, useState } from "react";
import camera from "../../../Assets/Icons/camera.svg";
import "./imageInput.css";

type ImageInputProps = {
  name: string;
  hint: string;
  onChange: (file: File | null) => void; 
};

const ImageInput: React.FC<ImageInputProps> = ({ name, hint, onChange }) => {
  const [fileName, setFileName] = useState<string>("");

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFileName(file ? file.name : "");
    onChange(file);
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
    </div>
  );
};


export default ImageInput;
