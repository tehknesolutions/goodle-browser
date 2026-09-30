import { useState } from "react";
import { GoodleButton } from "./Button";

export interface GoodleCommandBarProps {
  placeholder?: string;
  onSubmit?: (value: string) => void;
}

export function GoodleCommandBar({ placeholder = "Crie qualquer coisa...", onSubmit }: GoodleCommandBarProps) {
  const [value, setValue] = useState("");

  function submit() {
    const command = value.trim();
    if (!command) return;
    onSubmit?.(command);
  }

  return (
    <div className="goodle-commandbar" role="search">
      <span className="goodle-commandbar__mark" aria-hidden="true">✦</span>
      <input
        aria-label="Intenção"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") submit();
        }}
        placeholder={placeholder}
      />
      <GoodleButton variant="primary" type="button" onClick={submit}>Criar</GoodleButton>
    </div>
  );
}
