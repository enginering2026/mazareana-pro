import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

interface NumericFieldProps {
  id?: string;
  name?: string;
  value: number | null | undefined;
  onChangeNumber: (value: number) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

// A mobile-friendly numeric input that lets users type freely (supports , and .)
// Updates the parent with a valid number as the user types (when parsable),
// and commits a normalized number on blur. Prevents the common mobile "." issue.
export default function NumericField({
  id,
  name,
  value,
  onChangeNumber,
  placeholder,
  className,
  required,
}: NumericFieldProps) {
  const valueToText = (v: number | null | undefined) => {
    if (v === null || v === undefined || Number.isNaN(v)) return "";
    return String(v);
  };

  const [text, setText] = useState<string>(valueToText(value));

  useEffect(() => {
    setText(valueToText(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const decimalPattern = /^\d*(?:[\.,]\d*)?$/; // allows "", "123", "123.", "123,45"

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "" || decimalPattern.test(raw)) {
      setText(raw);
      const normalized = raw.replace(",", ".");
      // Emit only when it's a valid number (not empty or just a dot/comma)
      if (normalized !== "" && normalized !== ".") {
        const num = Number(normalized);
        if (!Number.isNaN(num)) {
          onChangeNumber(num);
        }
      }
    }
  };

  const handleBlur = () => {
    const normalized = text.replace(",", ".");
    const num = normalized === "" || normalized === "." ? 0 : Number(normalized);
    onChangeNumber(Number.isNaN(num) ? 0 : num);
    setText(String(Number.isNaN(num) ? 0 : num));
  };

  return (
    <Input
      id={id}
      name={name}
      inputMode="decimal"
      placeholder={placeholder}
      className={className}
      value={text}
      onChange={handleChange}
      onBlur={handleBlur}
      required={required}
    />
  );
}
