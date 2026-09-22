interface LegalEntityCardProps {
  label?: string;
  intro?: string;
  contactEmail: string;
}

export const LegalEntityCard = ({
  label = "Company Information",
  intro,
  contactEmail,
}: LegalEntityCardProps) => {
  return (
    <div className="rounded-lg border border-[hsl(var(--iq-border))] bg-[hsl(var(--iq-surface))] p-5 mb-8 text-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--iq-muted))] mb-3">
        {label}
      </p>
      <div className="space-y-1.5 leading-relaxed">
        {intro && <p className="text-[hsl(var(--iq-ink-soft))]">{intro}</p>}
        <p className="font-semibold text-[hsl(var(--iq-ink))]">Digital Spider Research Inc.</p>
        <p className="text-[hsl(var(--iq-ink-soft))]">
          2810 N Church St #305968
          <br />
          Wilmington, DE 19802-4447, USA
        </p>
        <p className="text-[hsl(var(--iq-ink-soft))]">
          Contact:{" "}
          <a href={`mailto:${contactEmail}`} className="text-[hsl(var(--iq-cobalt))] hover:underline">
            {contactEmail}
          </a>
        </p>
      </div>
    </div>
  );
};
