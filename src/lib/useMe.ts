"use client";
import { useEffect, useState } from "react";

export interface Me {
  userId: string;
  email: string;
  role: "USER" | "ADMIN";
}

export function useMe() {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setMe(d.user))
      .catch(() => setMe(null));
  }, []);
  return me; // undefined = იტვირთება, null = სტუმარი, Me = შესული
}
