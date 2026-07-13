import { useState, useEffect, useRef } from "react";
import Header from "../components/Header";
import {
  uploadCv,
  listerCandidats,
  rechercherCritere,
  envoyerMessageChat,
  resetChat,
} from "../api/cvApi";
import DossierCard from "../components/DossierCard";
import ReactMarkdown from "react-markdown";
import ChatConversation from "../components/ChatConversation";


const TABS = [
  { id: "ajouter", label: "Ajouter" },
  { id: "rechercher", label: "Rechercher" },
  { id: "chat", label: "Interroger" },
];

export default function CvPage({ onRetour, onSelectService }) {
  const [ongletActif, setOngletActif] = useState("ajouter");
  const [candidats, setCandidats] = useState([]);

  const [fichiers, setFichiers] = useState([]);
  const [chargementUpload, setChargementUpload] = useState(false);
  const [messagesUpload, setMessagesUpload] = useState([]);

  const [question, setQuestion] = useState("");
  const [resultatRecherche, setResultatRecherche] = useState(null);
  const [chargementRecherche, setChargementRecherche] = useState(false);

  const [messagesChat, setMessagesChat] = useState([]);
  const [inputChat, setInputChat] = useState("");
  const [chargementChat, setChargementChat] = useState(false);

  const finDesMessagesRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    rafraichirCandidats();
  }, []);

  useEffect(() => {
    finDesMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesChat, chargementChat]);

  async function rafraichirCandidats() {
    try {
      const data = await listerCandidats();
      setCandidats(data.candidats);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleUpload() {
    setChargementUpload(true);
    setMessagesUpload([]);
    for (const fichier of fichiers) {
      try {
        const resultat = await uploadCv(fichier);
        setMessagesUpload((prev) => [
          ...prev,
          { type: "success", texte: `Dossier classé — ${resultat.candidat} (${resultat.nb_chunks} sections)` },
        ]);
      } catch (e) {
        setMessagesUpload((prev) => [...prev, { type: "error", texte: `${fichier.name} : ${e.message}` }]);
      }
    }
    setChargementUpload(false);
    setFichiers([]);
    rafraichirCandidats();
  }

  async function handleRecherche() {
    setChargementRecherche(true);
    setResultatRecherche(null);
    try {
      const resultat = await rechercherCritere(question);
      setResultatRecherche(resultat);
    } catch (e) {
      alert(e.message);
    }
    setChargementRecherche(false);
  }

  async function handleEnvoyerChat() {
    if (!inputChat.trim() || chargementChat) return;
    const questionEnvoyee = inputChat;
    setMessagesChat((prev) => [...prev, { role: "user", texte: questionEnvoyee }]);
    setInputChat("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setChargementChat(true);
    try {
      const resultat = await envoyerMessageChat(questionEnvoyee);
      setMessagesChat((prev) => [...prev, { role: "assistant", texte: resultat.reponse }]);
    } catch (e) {
      setMessagesChat((prev) => [...prev, { role: "assistant", texte: `Erreur : ${e.message}` }]);
    }
    setChargementChat(false);
  }

  async function handleResetChat() {
    await resetChat();
    setMessagesChat([]);
  }

  function handleKeyDownChat(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEnvoyerChat();
    }
  }

  function handleInputChat(e) {
    setInputChat(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }

  return (
    <div className="min-h-screen bg-ledger">
      {/* Header */}
      <Header
    onRetour={onRetour}
    onSelectService={onSelectService}
    sousTitre="Agent de tri de CV"
    droite={
    <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-parchment/60">
      <span className="w-2 h-2 rounded-full bg-emerald-400 motion-safe:animate-pulse" />
      {candidats.length} dossier{candidats.length !== 1 ? "s" : ""}
    </div>
  }
/>

      <div className="flex flex-col md:flex-row">
        {/* Tiroir (sidebar) */}
        <aside className="md:w-64 shrink-0 p-5 border-b md:border-b-0 md:border-r border-brass/10">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-parchment/40 mb-3">
            Tiroir
          </p>
          <div className="flex flex-wrap md:flex-col gap-2">
            {candidats.length === 0 && (
              <p className="text-parchment/30 text-xs italic font-body">Aucun dossier archivé</p>
            )}
            {candidats.map((nom, i) => (
              <div
                key={nom}
                className={`bg-parchment text-ink rounded-t-md px-3 py-2 font-mono text-xs uppercase tracking-wide shadow-sm border border-parchmentline ${
                  i % 2 === 0 ? "-rotate-1" : "rotate-1"
                }`}
              >
                {nom}
              </div>
            ))}
          </div>
        </aside>

        {/* Contenu principal */}
        <main className="flex-1 p-6 md:p-10">
          {/* Onglets */}
          <div className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setOngletActif(tab.id)}
                className={`px-5 py-2.5 font-mono text-xs uppercase tracking-widest rounded-t-lg border border-b-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass ${
                  ongletActif === tab.id
                    ? "bg-parchment text-ink border-parchmentline"
                    : "bg-ledgerline/40 text-parchment/50 border-transparent hover:text-parchment"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-parchment border border-parchmentline rounded-b-2xl rounded-tr-2xl p-6 md:p-8 shadow-xl shadow-black/30">
            {/* --- Onglet Ajouter --- */}
            {ongletActif === "ajouter" && (
              <div>
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-parchmentline rounded-xl py-12 cursor-pointer hover:border-brass transition-colors">
                  <span className="font-display text-lg text-ink">Déposer des dossiers PDF</span>
                  <span className="font-mono text-[11px] text-moss uppercase tracking-widest">
                    ou cliquer pour parcourir
                  </span>
                  <input
                    type="file"
                    accept=".pdf"
                    multiple
                    className="hidden"
                    onChange={(e) => setFichiers(Array.from(e.target.files))}
                  />
                </label>

                {fichiers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {fichiers.map((f) => (
                      <span
                        key={f.name}
                        className="font-mono text-xs bg-ledger/5 border border-parchmentline rounded px-2 py-1 text-ink/70"
                      >
                        {f.name}
                      </span>
                    ))}
                  </div>
                )}

                <button
                  onClick={handleUpload}
                  disabled={fichiers.length === 0 || chargementUpload}
                  className="mt-5 bg-ink text-parchment px-5 py-2.5 rounded-full font-mono text-xs uppercase tracking-widest hover:bg-stamp transition-colors disabled:opacity-30 disabled:hover:bg-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
                >
                  {chargementUpload ? "Classement en cours…" : "Classer au tiroir"}
                </button>

                <div className="mt-4 space-y-1.5">
                  {messagesUpload.map((m, i) => (
                    <p
                      key={i}
                      className={`font-mono text-xs ${m.type === "error" ? "text-stamp" : "text-emerald-700"}`}
                    >
                      {m.type === "error" ? "✕ " : "✓ "} {m.texte}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* --- Onglet Rechercher --- */}
            {ongletActif === "rechercher" && (
              <div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Ex : Python, a déjà fait un stage, maîtrise Docker…"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRecherche()}
                    className="flex-1 bg-white/50 border border-parchmentline rounded-full px-5 py-2.5 font-body text-sm text-ink placeholder:text-moss/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brass"
                  />
                  <button
                    onClick={handleRecherche}
                    disabled={!question || chargementRecherche}
                    className="bg-ink text-parchment px-5 py-2.5 rounded-full font-mono text-xs uppercase tracking-widest hover:bg-stamp transition-colors disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
                  >
                    {chargementRecherche ? "Consultation…" : "Consulter l'archive"}
                  </button>
                </div>

                {resultatRecherche && (
                  <div className="mt-6">
                    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-moss mb-4">
                      Critère : {resultatRecherche.critere_recherche}
                    </p>
                    <div className="space-y-4">
                      {resultatRecherche.candidats.map((c, i) => (
                        <DossierCard key={c.nom} candidat={c} index={i} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* --- Onglet Chat --- */}
            {ongletActif === "chat" && <ChatConversation service="cv" />}
          </div>
        </main>
      </div>
    </div>
  );
}