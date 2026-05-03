import React, { useEffect, useState } from "react";
import { useSession } from "./auth/useSession";
import RestaurantPortal from "./portals/restaurant/RestaurantPortal";
import ServiceDeskPortal from "./portals/restaurant/ServiceDeskPortal";
import HotelPortal from "./portals/hotel/HotelPortal";
import FrontDeskPortal from "./portals/hotel/FrontDeskPortal";
import UserShell from "./portals/user/UserShell";
import PublicSite from "./public/PublicSite";
import AdminPortal from "./portals/admin/AdminPortal";

export default function RoleRouter() {
  const s = useSession();
  const [view, setView] = useState<"loading"|"public"|"user"|"restaurant"|"hotel"|"staff"|"front_desk"|"admin">("loading");
  const [browsingHome, setBrowsingHome] = useState(false);

  useEffect(() => {
    if (!s) { setView("public"); return; }
    if (s.user.role === "restaurant_owner") setView("restaurant");
    else if (s.user.role === "hotel_owner") setView("hotel");
    else if (s.user.role === "staff") setView("staff");
    else if (s.user.role === "front_desk") setView("front_desk");
    else if (s.user.role === "admin") setView("admin");
    else setView("user");
  }, [s]);

  useEffect(() => {
    const goHome = () => setBrowsingHome(true);
    const goBack = () => setBrowsingHome(false);
    window.addEventListener("liora:browse-home", goHome);
    window.addEventListener("liora:return-portal", goBack);
    return () => {
      window.removeEventListener("liora:browse-home", goHome);
      window.removeEventListener("liora:return-portal", goBack);
    };
  }, []);

  if (view === "loading") return <div className="p-6">Loading...</div>;
  if (view === "public") return <PublicSite />;

  // Logged in but wants to visit landing/homepage
  if (browsingHome && (view === "restaurant" || view === "hotel" || view === "staff" || view === "user")) {
    const portalLabel = view === "restaurant" ? "Restaurant Portal" : view === "hotel" ? "Hotel Portal" : view === "staff" ? "Service Desk" : "Dashboard";
    return (
      <div className="relative min-h-screen bg-app">
        <button
          onClick={() => setBrowsingHome(false)}
          className="fixed top-4 left-4 z-[100] flex items-center gap-2 px-4 py-2.5 rounded-full bg-stone-900/95 backdrop-blur-md text-white text-xs font-bold uppercase tracking-widest shadow-2xl hover:bg-stone-800 transition-all border border-white/15"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back to {portalLabel}
        </button>
        <PublicSite />
      </div>
    );
  }

  if (view === "restaurant") return <RestaurantPortal />;
  if (view === "hotel") return <HotelPortal />;
  if (view === "staff") return <ServiceDeskPortal />;
  if (view === "front_desk") return <FrontDeskPortal />;
  if (view === "admin") return <AdminPortal />;
  return <UserShell />;
}
