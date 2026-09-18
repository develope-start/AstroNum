"use client";

import WideDateInput from "./WideDateInput";

export default function DateSelect({
  value,
  onChange,
  onDraftChange,
}: {
  value: string;
  onChange: (isoDate: string) => void;
  onDraftChange?: (value: string) => void;
}) {
  return <WideDateInput value={value} onChange={onChange} onDraftChange={onDraftChange} label="დაბადების თარიღი" hideHeader />;
}
