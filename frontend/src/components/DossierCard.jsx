export default function DossierCard({ candidat, index }) {
  const { nom, score, correspond_au_critere, justification } = candidat;
  const rotation = index % 2 === 0 ? "-rotate-1" : "rotate-1";

  return (
    <div
      className={`relative bg-parchment border border-parchmentline rounded-lg pl-9 pr-5 py-5 shadow-md ${rotation} hover:rotate-0 transition-transform duration-200`}
    >
      {/* trous de perforation */}
      <span className="absolute left-3 top-5 w-2.5 h-2.5 rounded-full bg-ledger/10 border border-parchmentline" />
      <span className="absolute left-3 bottom-5 w-2.5 h-2.5 rounded-full bg-ledger/10 border border-parchmentline" />

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-moss">
            Dossier N° {String(index + 1).padStart(3, "0")}
          </p>
          <h3 className="font-display text-xl font-semibold text-ink mt-0.5">{nom}</h3>
        </div>

        <div
          className={`shrink-0 -rotate-6 border-2 rounded px-3 py-1 font-mono font-bold uppercase text-sm tracking-wider ${
            correspond_au_critere ? "border-stamp text-stamp" : "border-moss text-moss"
          }`}
        >
          {score}/100
        </div>
      </div>

      <p className="font-body text-sm text-ink/80 italic mt-3 border-t border-dashed border-parchmentline pt-3">
        {justification}
      </p>
    </div>
  );
}