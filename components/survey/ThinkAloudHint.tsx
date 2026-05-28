export function ThinkAloudHint({
  children,
  label,
}: {
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <div className="survey-hint" role="note">
      <div className="survey-hint-label">{label ?? "Think aloud"}</div>
      <div>{children}</div>
    </div>
  );
}