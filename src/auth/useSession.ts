import { useEffect, useState } from "react";
import { getAuth } from "./index";
import type { Session } from "./types";

export function useSession(){
  const auth = getAuth(); const [s,setS]=useState<Session>(null);
  useEffect(()=>{ auth.getSession().then(setS); return auth.onAuthStateChange(setS); },[]);
  return s;
}
