import Header from "../components/Header";

export default function ServiceSelector({ onSelect }) {
  return (
    <div className="min-h-screen bg-ledger flex flex-col">
      <Header sousTitre="Agent IA — Archive" onSelectService={onSelect} />

      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-5xl text-parchment">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <section>
              <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-parchment/40 mb-4">
                Présentation
              </p>

              <h1 className="font-display text-4xl md:text-5xl mb-6 text-parchment">
                Archive — ton assistant de classement et de recherche
              </h1>

              <p className="font-body text-lg text-parchment/85 mb-6">
                Notre agent lit tes documents PDF, les transforme en fiches consultables et te permet
                de retrouver rapidement les meilleurs candidats ou informations grâce à la recherche
                par critères et une interface conversationnelle.
              </p>

              <ul className="space-y-3 mb-8">
                <li className="flex gap-3 items-start">
                  <span className="font-mono text-sm text-brass">•</span>
                  <div>
                    <div className="font-mono text-sm uppercase tracking-widest text-parchment/60">Indexation</div>
                    <div className="font-body text-sm text-parchment/80">Extraction automatique des sections et compétences.</div>
                  </div>
                </li>

                <li className="flex gap-3 items-start">
                  <span className="font-mono text-sm text-brass">•</span>
                  <div>
                    <div className="font-mono text-sm uppercase tracking-widest text-parchment/60">Recherche & filtre</div>
                    <div className="font-body text-sm text-parchment/80">Trouve des candidats par critère (compétence, expérience, mots-clés).</div>
                  </div>
                </li>

                <li className="flex gap-3 items-start">
                  <span className="font-mono text-sm text-brass">•</span>
                  <div>
                    <div className="font-mono text-sm uppercase tracking-widest text-parchment/60">Conversation</div>
                    <div className="font-body text-sm text-parchment/80">Interroge l'agent en langage naturel pour comparer et synthétiser.</div>
                  </div>
                </li>
              </ul>

              <div className="flex gap-4">
                <button
                  onClick={() => onSelect && onSelect("cv")}
                  className="bg-brass text-ink px-6 py-3 rounded-full font-mono text-sm uppercase tracking-widest hover:brightness-95 transition"
                >
                  Commencer — CV
                </button>

                <button
                  className="bg-transparent border border-parchmentline text-parchment px-5 py-3 rounded-full font-mono text-sm uppercase tracking-widest opacity-70 cursor-not-allowed"
                >
                  Module Factures (bientôt)
                </button>
              </div>
            </section>

            <aside className="flex items-center justify-center">
              <div className="w-full max-w-md bg-parchment border border-parchmentline rounded-2xl p-8 shadow-xl shadow-black/30 -rotate-3">
                <div className="font-mono text-[10px] uppercase tracking-wider text-moss mb-2">Exemple de fiche</div>
                <h3 className="font-display text-2xl text-ink mb-3">Jean Dupont — Développeur</h3>
                <p className="font-body text-sm text-ink/70 mb-4">Expérience: 5 ans • Python, Docker • Télétravail possible</p>

                <div className="bg-ledgerline/10 p-3 rounded-md border border-parchmentline">
                  <div className="font-mono text-xs uppercase tracking-wider text-moss mb-2">Résumé</div>
                  <div className="font-mono text-sm text-ink">Candidat pertinent pour postes backend.</div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}