"use client";

/**
 * Zeigt Lade- und Fehlerzustand der Datenabfrage an. Ohne Backend-Antwort ist
 * die Tabelle sonst einfach leer und nicht von "keine Daten" zu unterscheiden.
 */
export default function StateBanner({
  loading,
  error,
  onRetry,
}: {
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
}) {
  if (error) {
    return (
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-accent/40 bg-accent/5 px-4 py-3 text-sm">
        <span className="text-accent">{error}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="rounded-md border border-line bg-white px-3 py-1.5 text-xs transition-colors hover:bg-paper-2"
          >
            Erneut versuchen
          </button>
        )}
      </div>
    );
  }
  if (loading) {
    return (
      <div className="mb-4 rounded-md border border-line bg-paper-2 px-4 py-3 text-sm text-mute">
        Daten werden geladen…
      </div>
    );
  }
  return null;
}
