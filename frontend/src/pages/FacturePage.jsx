import { useState, useEffect, useRef } from "react";
import Header from "../components/Header";
import GraphiqueFacture from "../components/GraphiqueFacture";
import ReactMarkdown from "react-markdown";
import ChatConversation from "../components/ChatConversation";
import {
  uploadFactures,
  listerFactures,
  envoyerMessageChatFacture,
  supprimerFacturesParFichier,
} from "../api/factureApi";
const TABS = [
  { id: "ajouter", label: "Ajouter" },
  { id: "registre", label: "Registre" },
  { id: "chat", label: "Interroger" },
];

export default function FacturePage({ onRetour, onSelectService }) {
  const [ongletActif, setOngletActif] = useState("ajouter");
  const [factures, setFactures] = useState([]);

  const [fichiers, setFichiers] = useState([]);
  const [chargementUpload, setChargementUpload] = useState(false);
  const [messagesUpload, setMessagesUpload] = useState([]);

  const [messagesChat, setMessagesChat] = useState([]);
  const [inputChat, setInputChat] = useState("");
  const [chargementChat, setChargementChat] = useState(false);

  const finDesMessagesRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    rafraichirFactures();
  }, []);

  useEffect(() => {
    finDesMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesChat, chargementChat]);

  async function rafraichirFactures() {
    try {
      const data = await listerFactures();
      setFactures(data);
    } catch (e) {
      console.error(e);
    }
  }
  async function handleSupprimerFichier(nomFichier) {
    try {
      await supprimerFacturesParFichier(nomFichier);
      setFactures((prev) => prev.filter((f) => f.nom_fichier !== nomFichier));
    } catch (e) {
      alert(`Erreur lors de la suppression : ${e.message}`);
    }
  }

  async function handleUpload() {
    setChargementUpload(true);
    setMessagesUpload([]);
    try {
      const resultat = await uploadFactures(fichiers);
      setMessagesUpload((prev) => [
        ...prev,
        {
          type: "success",
          texte: `${resultat.stats.inserees} facture(s) classée(s), ${resultat.stats.doublons} déjà présente(s)`,
        },
      ]);
      if (resultat.erreurs?.length) {
        resultat.erreurs.forEach((e) =>
          setMessagesUpload((prev) => [
            ...prev,
            { type: "error", texte: `${e.fichier} : ${e.erreur}` },
          ]),
        );
      }
    } catch (e) {
      setMessagesUpload((prev) => [
        ...prev,
        { type: "error", texte: e.message },
      ]);
    }
    setChargementUpload(false);
    setFichiers([]);
    rafraichirFactures();
  }

  async function handleEnvoyerChat() {
    if (!inputChat.trim() || chargementChat) return;
    const questionEnvoyee = inputChat;
    setMessagesChat((prev) => [
      ...prev,
      { role: "user", texte: questionEnvoyee },
    ]);
    setInputChat("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setChargementChat(true);
    try {
      const resultat = await envoyerMessageChatFacture(questionEnvoyee);
      setMessagesChat((prev) => [
        ...prev,
        {
          role: "assistant",
          texte: resultat.reponse,
          graphique: resultat.graphique,
        },
      ]);
    } catch (e) {
      setMessagesChat((prev) => [
        ...prev,
        { role: "assistant", texte: `Erreur : ${e.message}` },
      ]);
    }
    setChargementChat(false);
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
  async function handleSupprimer(id) {
    try {
      await supprimerFacture(id);
      setFactures((prev) => prev.filter((f) => f.id !== id));
    } catch (e) {
      alert(`Erreur lors de la suppression : ${e.message}`);
    }
  }

  const totalTTC = factures.reduce((s, f) => s + (f.montant_ttc || 0), 0);

  return (
    <div className="min-h-screen bg-ledger">
      <Header
        onRetour={onRetour}
        onSelectService={onSelectService}
        sousTitre="Agent de facturation"
        droite={
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-parchment/60">
            <span className="w-2 h-2 rounded-full bg-emerald-400 motion-safe:animate-pulse" />
            {factures.length} facture{factures.length !== 1 ? "s" : ""} ·{" "}
            {totalTTC.toFixed(2)} DH
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
            {factures.length === 0 && (
              <p className="text-parchment/30 text-xs italic font-body">
                Aucun fichier archivé
              </p>
            )}
            {Object.entries(
              factures.reduce((acc, f) => {
                const nom = f.nom_fichier || "sans nom";
                acc[nom] = (acc[nom] || 0) + 1;
                return acc;
              }, {}),
            ).map(([nomFichier, count], i) => (
              <div
                key={nomFichier}
                className={`group relative bg-parchment text-ink rounded-t-md pl-3 pr-8 py-2 font-mono text-xs uppercase tracking-wide shadow-sm border border-parchmentline ${
                  i % 2 === 0 ? "-rotate-1" : "rotate-1"
                }`}
              >
                <span className="truncate block">{nomFichier}</span>
                <span className="text-moss normal-case text-[10px]">
                  {count} facture{count > 1 ? "s" : ""}
                </span>
                <button
                  onClick={() => handleSupprimerFichier(nomFichier)}
                  title="Retirer ce fichier de l'archive"
                  className="absolute right-1.5 top-2 w-4 h-4 flex items-center justify-center rounded-full text-moss hover:text-parchment hover:bg-stamp transition-colors"
                >
                  ×
                </button>
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
                  <span className="font-display text-lg text-ink">
                    Déposer des factures
                  </span>
                  <span className="font-mono text-[11px] text-moss uppercase tracking-widest">
                    CSV, Excel ou PDF — ou cliquer pour parcourir
                  </span>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls,.pdf"
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
                  {chargementUpload
                    ? "Classement en cours…"
                    : "Classer au tiroir"}
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

            {/* --- Onglet Registre --- */}
            {ongletActif === "registre" && (
              <div>
                {factures.length === 0 ? (
                  <p className="text-moss/60 italic font-body text-sm">
                    Le registre est vide. Dépose une facture pour commencer.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {factures.map((f, i) => (
                      <div
                        key={f.id}
                        className={`bg-white/50 border border-parchmentline rounded-xl p-5 shadow-sm ${
                          i % 2 === 0 ? "-rotate-[0.3deg]" : "rotate-[0.3deg]"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-display text-lg text-ink">
                              {f.client_nom}
                            </p>
                            <p className="font-mono text-[11px] text-moss uppercase tracking-wide mt-0.5">
                              {f.numero || "sans numéro"} ·{" "}
                              {f.date_facture || "date inconnue"}
                            </p>
                          </div>
                          <p className="font-mono text-sm text-brass">
                            {f.montant_ttc?.toFixed(2)} DH
                          </p>
                        </div>
                        {f.description && (
                          <p className="font-body text-sm text-ink/70 mt-3">
                            {f.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* --- Onglet Chat --- */}
            {ongletActif === "chat" && <ChatConversation service="facture" />}
          </div>
        </main>
      </div>
    </div>
  );
}
