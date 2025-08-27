import { useEffect, useState } from "react";
import getUserService from "../../Services/auth/getUserService";
import getUserProfile from "../../Services/auth/getUserProfile";

const useUserData = (isAuthenticated) => {
  const [userData, setUserData] = useState(null);
  const [profilePicUrl, setProfilePicUrl] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;

    const fetchUser = async () => {
      try {
        const user = await getUserService();
        if (!isMounted) return;
        setUserData(user);

        if (user.profilePicture) {
          const blob = await getUserProfile(user.profilePicture);
          if (!isMounted) return;

          const url = URL.createObjectURL(blob);
          setProfilePicUrl(url);
        }
      } catch (err) {
        console.error("Error fetching user or profile picture:", err);
      }
    };

    fetchUser();

    return () => {
      isMounted = false;
      if (profilePicUrl) URL.revokeObjectURL(profilePicUrl);
    };
  }, [isAuthenticated]);

  return { userData, profilePicUrl };
};

export default useUserData;
