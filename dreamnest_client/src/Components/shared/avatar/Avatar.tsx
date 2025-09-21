import React, { useEffect, useRef, useState } from "react";
import getUserProfile from "../../../Services/auth/getUserProfile";
import profiledef from "../../../Assets/Images/profiledef.jpg";

type Props = {
  filename?: string | null;     
  className?: string;
  alt?: string;
  size?: number;                
};

const Avatar: React.FC<Props> = ({ filename, className, alt = "User avatar", size }) => {
  const [src, setSrc] = useState<string>(profiledef); 
  const urlRef = useRef<string | null>(null);         

  useEffect(() => {
    let cancelled = false;

  
    const revoke = () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };

    
    if (!filename || filename === "null" || filename === "undefined" || filename.trim() === "") {
      revoke();
      setSrc(profiledef);
      return;
    }

    (async () => {
      try {
        const blob = await getUserProfile(filename); 
        if (cancelled) return;
        revoke();
        const objectUrl = URL.createObjectURL(blob);
        urlRef.current = objectUrl;
        setSrc(objectUrl);
      } catch {
        revoke();
        setSrc(profiledef);
      }
    })();

    return () => {
      cancelled = true;
      revoke();
    };
  }, [filename]);

  const style = size
    ? ({ width: size, height: size, objectFit: "cover", borderRadius: "50%" } as React.CSSProperties)
    : undefined;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => {
        if (src !== profiledef) {
          if (urlRef.current) {
            URL.revokeObjectURL(urlRef.current);
            urlRef.current = null;
          }
          setSrc(profiledef);
        }
      }}
    />
  );
};

export default Avatar;
