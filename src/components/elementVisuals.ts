import { Flame, Mountain, Wind, Droplets, type LucideIcon } from "lucide-react";

export const ELEMENT_VISUALS: Array<{
  id: "fire" | "earth" | "air" | "water";
  label: string;
  icon: LucideIcon;
  iconClass: string;
  gradient: string;
}> = [
  { id: "fire", label: "ცეცხლი", icon: Flame, iconClass: "text-rose-300", gradient: "from-rose-400/80 to-red-500/80" },
  { id: "earth", label: "მიწა", icon: Mountain, iconClass: "text-amber-300", gradient: "from-amber-400/80 to-yellow-600/80" },
  { id: "air", label: "ჰაერი", icon: Wind, iconClass: "text-sky-200", gradient: "from-sky-300/80 to-cyan-400/80" },
  { id: "water", label: "წყალი", icon: Droplets, iconClass: "text-blue-300", gradient: "from-blue-400/80 to-indigo-500/80" },
];
