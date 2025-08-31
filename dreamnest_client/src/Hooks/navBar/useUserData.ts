import { useEffect, useState } from "react";
import getUserService from "../../Services/auth/getUserService";
import getUserProfile from "../../Services/auth/getUserProfile";

type User = {
  coins?: number;
  profilePicture?: string | null;
  [k: string]: unknown;
};

type CoinsEventDetail = { value?: number; delta?: number };
const COINS_EVENT = "coins:update";

export default function useUserData(isAuthenticated: boolean) {
  const [userData, setUserData] = useState<User | null>(null);
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  const [coins, setCoins] = useState<number>(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    let objectUrl: string | undefined;

    (async () => {
      try {
        const user = (await getUserService()) as User | null;
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

  useEffect(() => {
    if (!isAuthenticated) return;

    
    const listener = (ev: Event) => {
      const e = ev as CustomEvent<CoinsEventDetail>;
      const value =
        typeof e.detail?.value === "number" ? e.detail.value : undefined;
      const delta =
        typeof e.detail?.delta === "number" ? e.detail.delta : undefined;

      if (value !== undefined) {
        setCoins(value);
        return;
      }
      if (delta !== undefined) {
        setCoins((prev) => prev + delta);
      }
    };

    window.addEventListener(COINS_EVENT, listener);
    return () => window.removeEventListener(COINS_EVENT, listener);
  }, [isAuthenticated]);

  return { userData, coins, profilePicUrl };
}
