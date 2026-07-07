import { useEffect, useRef } from "react";

type AccusationFormProps = {
  generation: string;
  member: string;
  onGenerationChange: (value: string) => void;
  onMemberChange: (value: string) => void;
  onSubmit: () => void;
};

const onlyOneDigit = (value: string) => value.replace(/\D/g, "").slice(0, 1);

export function AccusationForm({
  generation,
  member,
  onGenerationChange,
  onMemberChange,
  onSubmit,
}: AccusationFormProps) {
  const memberInputRef = useRef<HTMLInputElement>(null);
  const submittedKeyRef = useRef("");

  useEffect(() => {
    if (!generation || !member) {
      submittedKeyRef.current = "";
      return;
    }

    const key = generation + "-" + member;
    if (submittedKeyRef.current === key) {
      return;
    }

    submittedKeyRef.current = key;
    onSubmit();
  }, [generation, member, onSubmit]);

  return (
    <form
      className="accusationOverlay"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <input
        className="accusationDigit generationDigit"
        value={generation}
        onChange={(event) => {
          const nextValue = onlyOneDigit(event.target.value);
          onGenerationChange(nextValue);
          if (nextValue) {
            memberInputRef.current?.focus();
          }
        }}
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={1}
        autoComplete="off"
        aria-label="Generation number"
      />
      <input
        ref={memberInputRef}
        className="accusationDigit memberDigit"
        value={member}
        onChange={(event) => onMemberChange(onlyOneDigit(event.target.value))}
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={1}
        autoComplete="off"
        aria-label="Member number"
      />
      <button className="accusationSubmit" type="submit" aria-label="Submit accusation" />
    </form>
  );
}
