"use client";

import { EmailListItem } from "./EmailListItem";
import type { Email } from "@/types";

interface Props {
  emails: Email[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function EmailList({ emails, selectedId, onSelect }: Props) {
  if (emails.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        Nema emailova koji odgovaraju filteru.
      </div>
    );
  }
  return (
    <ul role="list" data-test="email-list" className="divide-y divide-border">
      {emails.map((email) => (
        <li key={email.id}>
          <EmailListItem
            email={email}
            selected={email.id === selectedId}
            onSelect={onSelect}
          />
        </li>
      ))}
    </ul>
  );
}
