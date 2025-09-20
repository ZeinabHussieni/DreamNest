import React, { ChangeEvent, useState } from "react";
import camera from "../../../Assets/Icons/camera.svg";
import "./imageInput.css";
type ImageInputProps = {
  name: string;
  hint: string;
  className?: string;
  triggerClassName?: string;
  buttonClassName?: string;
  labelClassName?: string;
  unstyledLabel?: boolean;        
  triggerClassNamee?:string;
};


const ImageInput: React.FC<ImageInputProps> = ({
  name, hint, triggerClassNamee, triggerClassName, buttonClassName, labelClassName, unstyledLabel
}) => {
  const [fileName, setFileName] = useState("");
 const labelClasses = unstyledLabel
    ? (labelClassName ?? "")
    : `auth-label authLabel ${labelClassName ?? ""}`;
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return setFileName("");

    setFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      const hidden = document.getElementById(`${name}-hidden`) as HTMLInputElement | null;
      if (hidden) hidden.value = String(reader.result ?? "");
    };
    reader.readAsDataURL(file);
  };

  const triggerCls = `primary-input-auth image-input-label ${triggerClassName || buttonClassName || ""}`.trim();

  return (
    <div className={`input-group-auth imageauth ${triggerClassNamee ?? ""}`}>
     <label className={labelClasses} htmlFor={name}>{hint}</label>

      <label htmlFor={name} className={triggerCls}>
        <img src={camera} className="camera" alt="" />
        {fileName || "Select Image"}
      </label>

      <input id={name} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
      <input id={`${name}-hidden`} type="hidden" name={name} />
    </div>
  );
};

export default ImageInput;
