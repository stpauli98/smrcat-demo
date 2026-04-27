"use client";

import { useMemo } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { EmailList } from "@/components/inbox/EmailList";
import { EmailPreview } from "@/components/inbox/EmailPreview";
import { InboxFilters } from "@/components/inbox/InboxFilters";
import { SearchBar } from "@/components/inbox/SearchBar";

export default function InboxPage() {
  const emailovi = useAppStore((s) => s.emailovi);
  const selectedEmailId = useAppStore((s) => s.selectedEmailId);
  const setSelectedEmail = useAppStore((s) => s.setSelectedEmail);
  const filters = useAppStore((s) => s.inboxFilters);
  const updateFilters = useAppStore((s) => s.updateInboxFilters);
  const markEmailAsRead = useAppStore((s) => s.markEmailAsRead);

  const sortedEmails = useMemo(
    () =>
      [...emailovi].sort(
        (a, b) => new Date(b.vrijeme).getTime() - new Date(a.vrijeme).getTime(),
      ),
    [emailovi],
  );

  const counts = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const e of sortedEmails) acc[e.kategorija] = (acc[e.kategorija] ?? 0) + 1;
    return acc;
  }, [sortedEmails]);

  const filteredEmails = useMemo(() => {
    return sortedEmails.filter((e) => {
      if (filters.kategorija !== "SVE" && e.kategorija !== filters.kategorija) return false;
      if (filters.jezik !== "SVE" && e.jezik !== filters.jezik) return false;
      if (filters.prioritet !== "SVE" && e.prioritet !== filters.prioritet) return false;
      return true;
    });
  }, [sortedEmails, filters]);

  const selectedEmail = sortedEmails.find((e) => e.id === selectedEmailId) ?? null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-medium">Inbox</h1>
          <p className="text-sm text-muted-foreground">
            {sortedEmails.length} emailova · AI klasifikacija aktivna
          </p>
        </div>
        <SearchBar />
      </div>
      <div
        className="grid grid-cols-12 border border-border rounded-lg overflow-hidden bg-card"
        style={{ minHeight: "calc(100vh - 16rem)" }}
      >
        <section className="col-span-12 md:col-span-7 border-r border-border flex flex-col">
          <InboxFilters
            active={filters.kategorija}
            counts={counts}
            onChange={(k) => updateFilters({ kategorija: k })}
          />
          <div className="overflow-auto flex-1">
            <EmailList
              emails={filteredEmails}
              selectedId={selectedEmailId}
              onSelect={(id) => {
                setSelectedEmail(id);
                markEmailAsRead(id);
              }}
            />
          </div>
        </section>
        <section className="col-span-12 md:col-span-5 bg-card">
          <EmailPreview email={selectedEmail} onMarkRead={markEmailAsRead} />
        </section>
      </div>
    </div>
  );
}
