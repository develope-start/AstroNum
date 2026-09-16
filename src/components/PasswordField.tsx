"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export default function PasswordField({ className = "", ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input {...props} type={visible ? "text" : "password"} className={`${className} pr-12`} />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        title="დააჭირეთ რომ დაინახოთ"
        aria-label={visible ? "პაროლის დამალვა" : "დააჭირეთ რომ დაინახოთ პაროლი"}
        className="absolute inset-y-0 right-2 flex w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-amber-300 focus-visible:text-amber-300"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
