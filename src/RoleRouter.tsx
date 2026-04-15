import React, { useEffect, useState } from "react";
import { useSession } from "./auth/useSession";
import RestaurantPortal from "./portals/restaurant/RestaurantPortal";
import ServiceDeskPortal from "./portals/restaurant/ServiceDeskPortal";
import UserShell from "./portals/user/UserShell";
import PublicSite from "./public/PublicSite";

export default function RoleRouter() {
  const s = useSession();
  const [view, setView] = useState<"loading"|"public"|"user"|"restaurant"|"staff">("loading");

  useEffect(() => {
    if (!s) { setView("public"); return; }
    if (s.user.role === "restaurant_owner") setView("restaurant");
    else if (s.user.role === "staff") setView("staff");
    else setView("user");
  }, [s]);

  if (view === "loading") return <div className="p-6">Loadingâ ¦</div>;
  if (view === "public") return <PublicSite />;
  if (view === "restaurant") return <RestaurantPortal />;
  if (view === "staff") return <ServiceDeskPortal />;
  return <UserShell />;
}
