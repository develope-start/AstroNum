"use client";

import WideDateInput from "./WideDateInput";

export default function DateSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (isoDate: string) => void;
}) {
  return <WideDateInput value={value} onChange={onChange} label="დაბადების თარიღი" hideHeader />;
}
