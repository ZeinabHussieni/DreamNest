import React, { useEffect, useState } from "react";
import getUserProfile from "../../../Services/auth/getUserProfile";

type Props = {
  filename?: string | null;
  className?: string;
  alt?: string;
  size?: number;
};

const Avatar: React.FC<Props> = ({ filename, className, alt = "", size }) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | undefined;

    (async () => {
      if (!filename) {
        setUrl(null);
        return;
      }
      try {
        const blob = await getUserProfile(filename); 
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      } catch {
    
        setUrl(null);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [filename]);

  const style = size ? { width: size, height: size, objectFit: "cover", borderRadius: "50%" } : undefined;

  return url ? (
    <img
  src={url}
  className={className}
  style={
    size
      ? ({ width: size, height: size, objectFit: "cover", borderRadius: "50%" } as React.CSSProperties)
      : undefined
  }
  alt={alt}
/>

  ) : (
 
    <img
      src="https://via.placeholder.com/64?text=%20"
      className={className}
       style={
    size
      ? ({ width: size, height: size, objectFit: "cover", borderRadius: "50%" } as React.CSSProperties)
      : undefined
  }
      alt={alt}
    />
  );
};

export default Avatar;
