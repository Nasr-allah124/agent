import DaisyLogo from "./Logo";

export default function Header({ onRetour, sousTitre, droite, onSelectService }) {
  return (
    <header className="flex items-center justify-between px-6 md:px-10 py-5 border-b border-brass/20">
      <div className="flex items-center gap-4">
        {onRetour && (
          <button
            onClick={onRetour}
            className="font-mono text-xs uppercase tracking-widest text-parchment/60 hover:text-brass transition-colors"
          >
            ← Services
          </button>
        )}

        <div className="flex items-center gap-3">
          <DaisyLogo className="w-10 h-10" />
          <div className="leading-tight">
            <p className="font-display text-xl font-semibold text-parchment tracking-tight">
              Daisy Consulting
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-parchment/40">
              {sousTitre || "Expert Odoo & IA"}
            </p>
          </div>
        </div>

        {/* Services quick-nav next to logo */}
        <nav className="hidden md:flex gap-6 ml-6">
          <button
            onClick={() => onSelectService && onSelectService("cv")}
            className="text-left group"
            aria-label="Ouvrir module CV"
          >
            <div className="font-mono text-xs uppercase tracking-widest text-parchment/60">CV</div>
            <div className="font-body text-[11px] text-parchment/80">Tri & recherche</div>
          </button>

          <button
            onClick={() => onSelectService && onSelectService("facture")}
            className="text-left group"
            aria-label="Ouvrir module Factures"
          >
            <div className="font-mono text-xs uppercase tracking-widest text-parchment/60">Factures</div>
            <div className="font-body text-[11px] text-parchment/80">Extraction & analyse</div>
          </button>
        </nav>
      </div>

      {droite && <div>{droite}</div>}
    </header>
  );
}