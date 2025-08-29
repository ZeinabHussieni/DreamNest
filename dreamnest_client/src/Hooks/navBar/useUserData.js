import { useEffect, useState } from "react";
import getUserService from "../../Services/auth/getUserService";
import getUserProfile from "../../Services/auth/getUserProfile";

const useUserData = (isAuthenticated) => {
  const [userData, setUserData] = useState(null);
  const [profilePicUrl, setProfilePicUrl] = useState(null);
  const [coins, setCoins] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    let objectUrl;

    (async () => {
      try {
        const user = await getUserService();
        if (cancelled || !user) return;

        setUserData(user);
        setCoins(Number(user.coins) || 0); 

        if (user.profilePicture) {
          const blob = await getUserProfile(user.profilePicture);
          if (cancelled) return;
          objectUrl = URL.createObjectURL(blob);
          setProfilePicUrl(objectUrl);
        } else {
          setProfilePicUrl(null);
        }
      } catch (err) {
        console.error("Error fetching user/profile:", err);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [isAuthenticated]);

  return { userData, coins, profilePicUrl };
};

export default useUserData;
