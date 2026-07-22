// src/app/workspace/ResumeWorkspace.jsx
import { Link } from "react-router-dom";
import { useState, useRef, useMemo, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import {
  Brain,
  Upload,
  Download,
  ArrowLeft,
  Send,
  Bot,
  FileText,
  CheckCircle,
  Search,
  Sun,
  Moon,
  Languages,
  GitCompare,
  X,
  History,
  Globe,
  Square,
  CheckSquare,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  TrendingUp,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  uploaderCV,
  listerCandidats,
  listerDocumentsCV,
  rechercherCV,
  supprimerDocumentCV,
} from "../api/cvApi";
import ScrollDownArrow from "../landing_page/components/ui/ScrollDownArrow";
import {
  creerConversation,
  listerConversations,
  obtenirConversation,
  supprimerConversation,
  envoyerMessage,
} from "../api/conversationsApi";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";

const SERVICE = "cv";
const CLE_STOCKAGE_CONVERSATION = "conversation_active_cv";

const SUGGESTED_QUESTIONS = [
  "Who has more than 5 years of experience?",
  "Find candidates with Python and React",
  "Which candidates speak French and English?",
];

// Calcule le numéro de semaine ISO d'une date (pour regrouper les imports par semaine)
function numeroSemaine(date) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const jourSemaine = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - jourSemaine);
  const debutAnnee = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - debutAnnee) / 86400000 + 1) / 7);
}

export default function ResumeWorkspace() {
  // --- Traduction ---
  const { t, i18n } = useTranslation();
  const language = i18n.language;
  const toggleLanguage = () =>
    i18n.changeLanguage(language === "fr" ? "en" : "fr");

  // --- Dark mode ---
  const [darkMode, setDarkMode] = useState(
    typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark"),
  );
  const toggleDark = () => {
    document.documentElement.classList.toggle("dark");
    setDarkMode(document.documentElement.classList.contains("dark"));
  };

  // --- Confirmation & erreurs (composants partagés) ---
  const [confirmation, setConfirmation] = useState(null);
  const [erreur, setErreur] = useState(null);

  // --- Upload ---
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const [fichiersSelectionnes, setFichiersSelectionnes] = useState([]);
  const [chargementUpload, setChargementUpload] = useState(false);
  const [messagesUpload, setMessagesUpload] = useState([]);

  const handleBrowseClick = () => fileInputRef.current.click();

  const handleFileChange = (event) => {
    setFichiersSelectionnes((prev) => [
      ...prev,
      ...Array.from(event.target.files),
    ]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    setFichiersSelectionnes((prev) => [
      ...prev,
      ...Array.from(e.dataTransfer.files),
    ]);
  };

  async function handleUpload() {
    if (fichiersSelectionnes.length === 0) return;
    setChargementUpload(true);
    setMessagesUpload([]);
    for (const fichier of fichiersSelectionnes) {
      try {
        const resultat = await uploaderCV(fichier);
        setMessagesUpload((prev) => [
          ...prev,
          {
            type: "success",
            texte: `${resultat.candidat} — ${resultat.nb_chunks} section(s) analysée(s)`,
          },
        ]);
      } catch (e) {
        setMessagesUpload((prev) => [
          ...prev,
          { type: "error", texte: `${fichier.name} : ${e.message}` },
        ]);
      }
    }
    setChargementUpload(false);
    setFichiersSelectionnes([]);
    rafraichirDocuments();
    rafraichirCandidats();
  }

  // --- Données réelles : documents CV + candidats ---
  const [documents, setDocuments] = useState([]);
  const [chargementDocuments, setChargementDocuments] = useState(true);
  const [candidats, setCandidats] = useState([]);

  useEffect(() => {
    rafraichirDocuments();
    rafraichirCandidats();
  }, []);

  async function rafraichirDocuments() {
    setChargementDocuments(true);
    try {
      const data = await listerDocumentsCV();
      setDocuments(data);
    } catch (e) {
      console.error(e);
    }
    setChargementDocuments(false);
  }

  async function rafraichirCandidats() {
    try {
      const data = await listerCandidats();
      setCandidats(data.candidats || []);
    } catch (e) {
      console.error(e);
    }
  }

  // --- Document Library : regroupement réel par fichier importé ---
  const documentLibrary = useMemo(() => {
    return documents.map((doc) => ({
      id: doc.nom_fichier,
      name: doc.nom_fichier,
      candidat: doc.candidat,
      type: doc.nom_fichier?.includes(".")
        ? doc.nom_fichier.split(".").pop().toUpperCase()
        : "?",
      tailleKo: doc.taille_octets ? Math.round(doc.taille_octets / 1024) : null,
      dateImportRaw: doc.date_import,
      dateImport: doc.date_import
        ? new Date(doc.date_import).toLocaleDateString(language)
        : null,
      nbChunks: doc.nb_chunks,
    }));
  }, [documents, language]);

  // --- Stats réelles ---
  const statsReelles = useMemo(() => {
    const candidatsUniques = new Set(
      documentLibrary.map((d) => d.candidat).filter(Boolean),
    ).size;
    const dernierImport = documentLibrary.reduce((plusRecent, d) => {
      if (!d.dateImportRaw) return plusRecent;
      if (!plusRecent || new Date(d.dateImportRaw) > new Date(plusRecent))
        return d.dateImportRaw;
      return plusRecent;
    }, null);
    return {
      nbDocuments: documentLibrary.length,
      candidatsUniques,
      dernierImport: dernierImport
        ? new Date(dernierImport).toLocaleDateString(language)
        : "—",
    };
  }, [documentLibrary, language]);

  // --- Tendance réelle : nombre de CV importés par semaine ---
  const tendanceCumulative = useMemo(() => {
    const avecDate = documentLibrary
      .filter((d) => d.dateImportRaw)
      .sort((a, b) => new Date(a.dateImportRaw) - new Date(b.dateImportRaw));
    let cumul = 0;
    return avecDate.map((d) => {
      cumul += 1;
      return {
        date: new Date(d.dateImportRaw).toLocaleString(language, {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
        total: cumul,
      };
    });
  }, [documentLibrary, language]);

  // --- Tableau : recherche, tri, sélection ---
  const [librarySearch, setLibrarySearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [selectedIds, setSelectedIds] = useState([]);

  const filteredLibrary = useMemo(() => {
    const q = librarySearch.trim().toLowerCase();
    if (!q) return documentLibrary;
    return documentLibrary.filter(
      (doc) =>
        doc.name.toLowerCase().includes(q) ||
        (doc.candidat && doc.candidat.toLowerCase().includes(q)),
    );
  }, [documentLibrary, librarySearch]);

  const sortedLibrary = useMemo(() => {
    if (!sortConfig.key) return filteredLibrary;
    const sorted = [...filteredLibrary].sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];
      if (typeof valA === "number" && typeof valB === "number") {
        return sortConfig.direction === "asc" ? valA - valB : valB - valA;
      }
      return sortConfig.direction === "asc"
        ? String(valA ?? "").localeCompare(String(valB ?? ""))
        : String(valB ?? "").localeCompare(String(valA ?? ""));
    });
    return sorted;
  }, [filteredLibrary, sortConfig]);

  const toggleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { key: null, direction: "asc" };
    });
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === sortedLibrary.length) setSelectedIds([]);
    else setSelectedIds(sortedLibrary.map((d) => d.id));
  };

  const selectedDocs = useMemo(
    () => documentLibrary.filter((d) => selectedIds.includes(d.id)),
    [documentLibrary, selectedIds],
  );

  const handleCompareSelected = () => {
    if (selectedDocs.length < 2) return;
    const noms = selectedDocs.map((d) => d.candidat || d.name).join(" vs ");
    sendMessage(`Compare ${noms}`);
  };

  const handleExportSelected = () => {
    if (selectedDocs.length === 0) return;
    const entetes = [
      "name",
      "candidat",
      "type",
      "tailleKo",
      "dateImport",
      "nbChunks",
    ];
    const lignesCsv = [
      entetes.join(","),
      ...selectedDocs.map((d) =>
        entetes.map((cle) => JSON.stringify(d[cle] ?? "")).join(","),
      ),
    ].join("\n");
    const blob = new Blob([lignesCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = `export_cv_${Date.now()}.csv`;
    lien.click();
    URL.revokeObjectURL(url);
  };
  const handleSupprimerDocument = (nomFichier) => {
    setConfirmation({
      title: "Supprimer ce CV ?",
      message: `Le CV "${nomFichier}" sera définitivement supprimé de la base.`,
      onConfirm: async () => {
        setConfirmation(null);
        try {
          await supprimerDocumentCV(nomFichier);
          setSelectedIds((prev) => prev.filter((id) => id !== nomFichier));
          rafraichirDocuments();
          rafraichirCandidats();
        } catch (e) {
          setErreur(e.message);
        }
      },
    });
  };

  // --- Chat + historique réel (backend core/conversations.py) ---
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [conversationActive, setConversationActive] = useState(null);
  const [chargementConversation, setChargementConversation] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    initialiserConversations();
  }, []);

  async function initialiserConversations() {
    const liste = await listerConversations(SERVICE);
    setConversations(liste);

    const idSauvegarde = localStorage.getItem(CLE_STOCKAGE_CONVERSATION);
    const existe =
      idSauvegarde && liste.some((c) => String(c.id) === idSauvegarde);

    if (existe) await ouvrirConversation(Number(idSauvegarde));
    else if (liste.length > 0) await ouvrirConversation(liste[0].id);
    else await nouvelleConversation();
  }
  async function nettoyerConversationViDeSiBesoin() {
    if (conversationActive && messages.length === 0) {
      await supprimerConversation(conversationActive);
      setConversations((prev) =>
        prev.filter((c) => c.id !== conversationActive),
      );
    }
  }

  async function nouvelleConversation() {
    await nettoyerConversationViDeSiBesoin();
    const conv = await creerConversation(SERVICE);
    setConversations((prev) => [
      { id: conv.id, titre: conv.titre, updated_at: conv.updated_at },
      ...prev,
    ]);
    setConversationActive(conv.id);
    setMessages([]);
    localStorage.setItem(CLE_STOCKAGE_CONVERSATION, String(conv.id));
    setShowHistory(false);
  }

  async function ouvrirConversation(id) {
    setChargementConversation(true);
    try {
      const conv = await obtenirConversation(id);
      setConversationActive(id);
      setMessages(
        conv.messages.map((m) => ({
          id: `${m.role}-${m.created_at}`,
          role: m.role,
          text: m.contenu,
        })),
      );
      localStorage.setItem(CLE_STOCKAGE_CONVERSATION, String(id));
    } catch (e) {
      console.error(e);
    }
    setChargementConversation(false);
    setShowHistory(false);
  }

  function handleSupprimerConversation(id, e) {
    e.stopPropagation();
    setConfirmation({
      title: "Supprimer la conversation ?",
      message:
        "Cette action est irréversible. Tous les messages seront définitivement perdus.",
      onConfirm: async () => {
        setConfirmation(null);
        await supprimerConversation(id);
        const restantes = conversations.filter((c) => c.id !== id);
        setConversations(restantes);
        if (conversationActive === id) {
          if (restantes.length > 0) ouvrirConversation(restantes[0].id);
          else nouvelleConversation();
        }
      },
    });
  }

  const sendMessage = async (text) => {
    if (!text.trim() || typing || !conversationActive) return;
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", text },
    ]);
    setInput("");
    setTyping(true);
    try {
      const resultat = await envoyerMessage(conversationActive, text);
      setMessages((prev) => [
        ...prev,
        { id: `ai-${Date.now()}`, role: "assistant", text: resultat.reponse },
      ]);
      const liste = await listerConversations(SERVICE);
      setConversations(liste);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: "assistant",
          text: `Erreur : ${e.message}`,
        },
      ]);
    }
    setTyping(false);
  };

  // --- Recherche par compétence (backend /cv/rechercher) ---
  const [showSkillSearch, setShowSkillSearch] = useState(false);
  const [skillQuery, setSkillQuery] = useState("");
  const [skillResults, setSkillResults] = useState(null);
  const [rechercheEnCours, setRechercheEnCours] = useState(false);

  async function searchBySkill() {
    if (!skillQuery.trim()) {
      setSkillResults([]);
      return;
    }
    setRechercheEnCours(true);
    try {
      const resultat = await rechercherCV(skillQuery);
      setSkillResults(resultat.candidats || []);
    } catch (e) {
      setErreur(e.message);
      setSkillResults([]);
    }
    setRechercheEnCours(false);
  }

  const toggleSkillSearch = () => {
    setShowSkillSearch((prev) => !prev);
    setSkillQuery("");
    setSkillResults(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <ConfirmDialog
        open={!!confirmation}
        title={confirmation?.title}
        message={confirmation?.message}
        onConfirm={confirmation?.onConfirm}
        onCancel={() => setConfirmation(null)}
      />
      <Toast message={erreur} onClose={() => setErreur(null)} />

      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border px-6 py-4">
        <div className="max-w-screen-2xl mx-auto flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-600">
              {t("resumeWorkspace.back")}
            </span>
          </Link>
          <div className="w-px h-5 bg-border" />
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-primary flex items-center justify-center">
              <Brain size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-800 text-foreground keyword-gradient">
                {t("resumeWorkspace.headerTitle")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("resumeWorkspace.headerSubtitle")}
              </p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-success/10 rounded-full">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-600 text-success">
                {t("resumeWorkspace.aiActive")}
              </span>
            </div>
            <button
              onClick={toggleLanguage}
              className="
    flex items-center gap-2
    px-3 py-2
    rounded-lg
    bg-card
    border border-border
    hover:bg-muted
    transition-colors
  "
              title={t("common.language")}
            >
              <Globe size={16} className="text-primary" />
              <span className="text-sm font-medium text-foreground">
                {i18n.language.toUpperCase()}
              </span>
              <ChevronDown size={14} className="text-muted-foreground" />
            </button>
            <button
              onClick={toggleDark}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              title={t("common.toggleTheme")}
            >
              {darkMode ? (
                <Sun size={16} className="text-muted-foreground" />
              ) : (
                <Moon size={16} className="text-muted-foreground" />
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
          {/* Left: Upload */}
          <div className="flex flex-col gap-5">
            <div
              className={`glass rounded-2xl border-2 border-dashed p-4 text-center transition-all duration-200 cursor-pointer ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center mx-auto mb-2">
                <Upload size={18} className="text-white" />
              </div>
              <p className="text-xs font-700 text-foreground mb-0.5">
                {t("resumeWorkspace.uploadTitle")}
              </p>
              <p className="text-xs text-muted-foreground mb-2">
                {t("resumeWorkspace.uploadSubtitle")}
              </p>
              <button
                onClick={handleBrowseClick}
                className="px-3 py-1.5 text-xs font-600 text-white gradient-bg rounded-xl hover:opacity-90 transition-opacity"
              >
                {t("resumeWorkspace.browseFiles")}
              </button>
              <input
                type="file"
                multiple
                accept=".pdf,.docx"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </div>

            {fichiersSelectionnes.length > 0 && (
              <div className="glass rounded-2xl border border-white/60 p-4">
                <div className="flex flex-wrap gap-2 mb-3">
                  {fichiersSelectionnes.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-xl border text-xs"
                    >
                      <FileText size={13} className="text-primary" />
                      <span className="max-w-[140px] truncate">{f.name}</span>
                      <button
                        onClick={() =>
                          setFichiersSelectionnes((prev) =>
                            prev.filter((_, idx) => idx !== i),
                          )
                        }
                      >
                        <X
                          size={12}
                          className="text-muted-foreground hover:text-red-500"
                        />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleUpload}
                  disabled={chargementUpload}
                  className="w-full px-3 py-2 text-xs font-600 text-white gradient-bg rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {chargementUpload ? "…" : t("resumeWorkspace.browseFiles")}
                </button>
              </div>
            )}

            {messagesUpload.length > 0 && (
              <div className="glass rounded-2xl border border-white/60 p-4 space-y-1.5">
                {messagesUpload.map((m, i) => (
                  <p
                    key={i}
                    className={`text-xs ${m.type === "error" ? "text-danger" : "text-success"}`}
                  >
                    {m.type === "error" ? "✕ " : "✓ "} {m.texte}
                  </p>
                ))}
              </div>
            )}

            <div className="glass rounded-2xl border border-white/60 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <p className="text-sm font-700 text-foreground">
                  {t("resumeWorkspace.uploadedResumes")}
                </p>
                <span className="text-xs text-primary font-600">
                  {documentLibrary.length} {t("resumeWorkspace.files")}
                </span>
              </div>
              <div className="divide-y divide-border max-h-64 overflow-y-auto scrollbar-hide">
                {chargementDocuments ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Chargement…
                  </p>
                ) : documentLibrary.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Aucun CV importé.
                  </p>
                ) : (
                  documentLibrary.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted/20 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-primary flex items-center justify-center text-white text-xs font-700 flex-shrink-0">
                        {doc.type.slice(0, 3)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-700 text-foreground truncate">
                          {doc.candidat || doc.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {doc.name}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {doc.nbChunks} sec.
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Center: AI Chat */}
          <div className="flex flex-col gap-5">
            <div
              className="glass rounded-3xl border border-white/60 shadow-glow-purple overflow-hidden flex flex-row"
              style={{ minHeight: "500px" }}
            >
              {/* Volet Historique */}
              <div
                className="bg-card flex flex-col flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out"
                style={{
                  width: showHistory ? "240px" : "0px",
                  borderRight: showHistory ? "1px solid var(--border)" : "none",
                }}
              >
                <div className="w-60 flex flex-col h-full">
                  <div className="flex items-center justify-between px-4 py-4 border-b border-border">
                    <p className="text-sm font-700 text-foreground">
                      Historique
                    </p>
                    <button
                      onClick={() => setShowHistory(false)}
                      className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                    >
                      <X size={16} className="text-muted-foreground" />
                    </button>
                  </div>

                  <button
                    onClick={nouvelleConversation}
                    className="mx-4 mt-3 px-3 py-2 text-xs font-600 text-white gradient-bg rounded-xl hover:opacity-90 transition-opacity"
                  >
                    + Nouvelle conversation
                  </button>

                  <div className="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-1 scrollbar-hide">
                    {conversations.map((session) => (
                      <div key={session.id} className="group relative">
                        <button
                          onClick={() => ouvrirConversation(session.id)}
                          className={`w-full text-left px-3 py-2.5 pr-7 rounded-xl transition-colors ${
                            session.id === conversationActive
                              ? "bg-primary/10"
                              : "hover:bg-muted"
                          }`}
                        >
                          <p className="text-xs font-600 text-foreground truncate">
                            {session.titre}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(session.updated_at).toLocaleDateString(
                              language,
                            )}
                          </p>
                        </button>
                        <button
                          onClick={(e) =>
                            handleSupprimerConversation(session.id, e)
                          }
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full opacity-40 hover:opacity-100 hover:bg-danger/20 transition-opacity"
                        >
                          <X
                            size={11}
                            className="text-muted-foreground hover:text-danger"
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contenu du chat */}
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowHistory(true)}
                      className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center hover:opacity-90 transition-opacity"
                      title="Historique des conversations"
                    >
                      <History size={16} className="text-white" />
                    </button>
                    <div>
                      <p className="text-sm font-700 text-foreground">
                        {showSkillSearch
                          ? t("resumeWorkspace.skillSearchTitle")
                          : t("resumeWorkspace.chatTitle")}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-success" />
                        <span className="text-xs text-muted-foreground">
                          {candidats.length} {t("resumeWorkspace.chatSubtitle")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={toggleSkillSearch}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title={
                      showSkillSearch
                        ? "Retour au chat"
                        : t("resumeWorkspace.skillSearchTitle")
                    }
                  >
                    {showSkillSearch ? (
                      <ArrowLeft size={14} className="text-muted-foreground" />
                    ) : (
                      <Search size={14} className="text-muted-foreground" />
                    )}
                  </button>
                </div>

                {showSkillSearch ? (
                  <>
                    <div className="px-6 pt-5 pb-3">
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-2xl border border-border focus-within:border-primary transition-colors">
                        <Search
                          size={14}
                          className="text-muted-foreground flex-shrink-0"
                        />
                        <input
                          value={skillQuery}
                          onChange={(e) => setSkillQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") searchBySkill();
                          }}
                          placeholder={t(
                            "resumeWorkspace.skillSearchPlaceholder",
                          )}
                          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                          autoFocus
                        />
                        {skillQuery && (
                          <button
                            onClick={() => {
                              setSkillQuery("");
                              setSkillResults(null);
                            }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X size={14} />
                          </button>
                        )}
                        <button
                          onClick={searchBySkill}
                          disabled={!skillQuery.trim() || rechercheEnCours}
                          className="w-8 h-8 rounded-xl gradient-bg flex items-center justify-center hover:opacity-90 disabled:opacity-40 active:scale-95 transition-all flex-shrink-0"
                        >
                          <Send size={14} className="text-white" />
                        </button>
                      </div>
                    </div>

                    <div
                      className="flex-1 overflow-y-auto px-6 pb-5 flex flex-col gap-3 scrollbar-hide"
                      style={{ maxHeight: "390px", minHeight: "390px" }}
                    >
                      {rechercheEnCours && (
                        <p className="text-xs text-muted-foreground text-center py-10">
                          Recherche en cours…
                        </p>
                      )}

                      {!rechercheEnCours && skillResults === null && (
                        <div className="h-full flex flex-col items-center justify-center text-center gap-2 py-10">
                          <div className="w-12 h-12 rounded-2xl bg-purple-soft flex items-center justify-center mb-1">
                            <Search size={20} className="text-primary" />
                          </div>
                          <p className="text-sm font-700 text-foreground">
                            {t("resumeWorkspace.skillSearchEmptyTitle")}
                          </p>
                          <p className="text-xs text-muted-foreground max-w-xs">
                            {t("resumeWorkspace.skillSearchEmptySubtitle")}
                          </p>
                        </div>
                      )}

                      {!rechercheEnCours &&
                        skillResults !== null &&
                        skillResults.length === 0 && (
                          <div className="h-full flex flex-col items-center justify-center text-center gap-2 py-10">
                            <p className="text-sm font-700 text-foreground">
                              {t("resumeWorkspace.skillSearchNoResultsTitle")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {t("resumeWorkspace.skillSearchNoResults")} "
                              {skillQuery}".
                            </p>
                          </div>
                        )}

                      {!rechercheEnCours &&
                        skillResults !== null &&
                        skillResults.length > 0 && (
                          <>
                            <p className="text-xs font-600 text-muted-foreground mb-1">
                              {skillResults.length}{" "}
                              {t("resumeWorkspace.skillSearchResultsCount")} "
                              {skillQuery}"
                            </p>
                            {skillResults.map((c, i) => (
                              <div
                                key={i}
                                className="flex gap-3 px-4 py-3 bg-muted rounded-2xl"
                              >
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-primary flex items-center justify-center text-white text-xs font-700 flex-shrink-0">
                                  CV
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-700 text-foreground truncate">
                                      {c.nom}
                                    </p>
                                    <span
                                      className={`text-xs font-700 tabular-nums flex-shrink-0 ${c.score >= 80 ? "text-success" : "text-primary"}`}
                                    >
                                      {c.score}%
                                    </span>
                                  </div>
                                  <span
                                    className={`inline-flex mt-1 px-2 py-0.5 text-xs font-600 rounded-full ${
                                      c.correspond_au_critere
                                        ? "bg-success/10 text-success"
                                        : "bg-danger/10 text-danger"
                                    }`}
                                  >
                                    {c.correspond_au_critere
                                      ? "✓ Correspond"
                                      : "✗ Ne correspond pas"}
                                  </span>
                                  {c.justification && (
                                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                                      {c.justification}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4 scrollbar-hide"
                      style={{ maxHeight: "320px" }}
                    >
                      {chargementConversation ? (
                        <p className="text-xs text-muted-foreground text-center">
                          Chargement…
                        </p>
                      ) : messages.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center">
                          Pose ta première question sur tes candidats.
                        </p>
                      ) : (
                        messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                          >
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${msg.role === "user" ? "gradient-bg" : "bg-muted border border-border"}`}
                            >
                              {msg.role === "user" ? (
                                <span className="text-white text-xs font-700">
                                  U
                                </span>
                              ) : (
                                <Bot size={14} className="text-primary" />
                              )}
                            </div>
                            <div
                              className={`max-w-lg px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === "user" ? "gradient-bg text-white rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm"}`}
                            >
                              <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                                <ReactMarkdown>{msg.text}</ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      {typing && (
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-xl bg-muted border border-border flex items-center justify-center">
                            <Bot size={14} className="text-primary" />
                          </div>
                          <div className="px-4 py-3 bg-muted rounded-2xl flex items-center gap-1.5">
                            {[0, 1, 2].map((i) => (
                              <span
                                key={i}
                                className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce"
                                style={{ animationDelay: `${i * 150}ms` }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="px-6 pb-3">
                      <p className="text-xs font-600 text-muted-foreground mb-2">
                        {t("resumeWorkspace.suggestedQuestions")}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {SUGGESTED_QUESTIONS.map((q) => (
                          <button
                            key={q}
                            onClick={() => sendMessage(q)}
                            className="px-3 py-1.5 text-xs font-500 text-primary bg-purple-soft border border-primary/20 rounded-full hover:bg-primary hover:text-white transition-all duration-200"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="px-6 pb-6">
                      <div className="bg-muted rounded-2xl border border-border p-3">
                        <div className="flex items-center gap-3">
                          <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") sendMessage(input);
                            }}
                            placeholder={t("resumeWorkspace.inputPlaceholder")}
                            className="flex-1 bg-transparent text-sm outline-none"
                          />
                          <button
                            onClick={() => sendMessage(input)}
                            disabled={!input.trim() || typing}
                            className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-all"
                          >
                            <Send size={15} className="text-white" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Analysis Results */}
            <div className="glass rounded-2xl border border-white/60 p-6">
              <h3 className="text-base font-700 text-foreground mb-4">
                {t("resumeWorkspace.analysisResultsTitle")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    label: t("resumeWorkspace.stats.analyzed"),
                    value: statsReelles.nbDocuments,
                    icon: FileText,
                    color: "text-primary bg-primary/10",
                  },
                  {
                    label: "Candidats uniques",
                    value: statsReelles.candidatsUniques,
                    icon: CheckCircle,
                    color: "text-success bg-success/10",
                  },
                  {
                    label: "Dernier import",
                    value: statsReelles.dernierImport,
                    icon: History,
                    color: "text-secondary bg-secondary/10",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-card rounded-xl p-4 border border-border"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg ${stat.color} flex items-center justify-center mb-2`}
                    >
                      <stat.icon size={15} />
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {stat.label}
                    </p>
                    <p className="text-lg font-800 text-foreground">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tendance des imports par semaine */}
            {/* {tendanceCumulative.length > 0 && (
  <div className="glass rounded-2xl border border-white/60 p-6">
    <h3 className="text-base font-700 text-foreground flex items-center gap-2 mb-1">
      <TrendingUp size={16} className="text-primary" />
      Croissance de la base CV
    </h3>
    <p className="text-xs text-muted-foreground mb-4">Nombre total de CV importés au fil du temps</p>
    <div style={{ width: '100%', height: 220 }}>
      <ResponsiveContainer>
        <LineChart data={tendanceCumulative}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} angle={-20} textAnchor="end" height={50} />
          <YAxis tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} allowDecimals={false} />
          <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', fontSize: 12 }} />
          <Line type="monotone" dataKey="total" name="Total CV" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 4, fill: '#7c3aed' }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
)} */}

            {/* Document Library */}
            <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex flex-wrap items-center gap-3">
                <div>
                  <h3 className="text-base font-700 text-foreground">
                    {t("invoiceWorkspace.libraryTitle")}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {sortedLibrary.length} documents
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-auto flex-wrap">
                  <button
                    onClick={handleCompareSelected}
                    disabled={selectedDocs.length < 2}
                    className="px-3 py-2 text-xs font-600 text-secondary bg-blue-soft border border-secondary/20 rounded-xl hover:bg-secondary hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Compare ({selectedDocs.length})
                  </button>
                  <button
                    onClick={handleExportSelected}
                    disabled={selectedDocs.length === 0}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-600 text-foreground border border-border rounded-xl hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Download size={13} /> Export CSV
                  </button>
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-xl border border-border text-sm w-48">
                    <Search
                      size={13}
                      className="text-muted-foreground flex-shrink-0"
                    />
                    <input
                      value={librarySearch}
                      onChange={(e) => setLibrarySearch(e.target.value)}
                      placeholder={t("invoiceWorkspace.searchDocuments")}
                      className="bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground flex-1"
                    />
                  </div>
                </div>
              </div>
              <div className="md:hidden space-y-4 p-4">
                {sortedLibrary.map((doc) => {
                  const isSelected = selectedIds.includes(doc.id);

                  return (
                    <div
                      key={doc.id}
                      className={`rounded-2xl border border-border bg-card p-4 shadow-sm ${
                        isSelected ? "border-primary bg-primary/5" : ""
                      }`}
                    >
                      {/* En-tête */}
                      <div className="flex items-start justify-between">
                        <div className="flex gap-3">
                          <button onClick={() => toggleSelectOne(doc.id)}>
                            {isSelected ? (
                              <CheckSquare size={18} className="text-primary" />
                            ) : (
                              <Square
                                size={18}
                                className="text-muted-foreground"
                              />
                            )}
                          </button>

                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-primary flex items-center justify-center text-white font-bold">
                            {doc.type.slice(0, 3)}
                          </div>

                          <div>
                            <h4 className="font-semibold break-all">
                              {doc.name}
                            </h4>

                            <p className="text-xs text-muted-foreground">
                              {doc.type}
                            </p>
                          </div>
                        </div>

                        {/* Bouton Supprimer */}
                        <button
                          onClick={() => handleSupprimerDocument(doc.name)}
                          className="p-2 rounded-lg hover:bg-danger/10 hover:text-danger text-muted-foreground transition-colors"
                          title={t("resumeWorkspace.deleteCV")}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Informations */}
                      <div className="grid grid-cols-2 gap-4 mt-5">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {t("resumeWorkspace.candidate")}
                          </p>

                          <p className="font-medium">
                            {doc.candidat || t("resumeWorkspace.noCandidate")}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">
                            {t("resumeWorkspace.type")}
                          </p>

                          <p className="font-medium">{doc.type}</p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">
                            {t("resumeWorkspace.size")}
                          </p>

                          <p className="font-medium">
                            {doc.tailleKo
                              ? `${doc.tailleKo} KB`
                              : t("resumeWorkspace.noCandidate")}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">
                            {t("resumeWorkspace.importedOn")}
                          </p>

                          <p className="font-medium">
                            {doc.dateImport || t("resumeWorkspace.noCandidate")}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-4 py-3 text-left w-10">
                        <button
                          onClick={toggleSelectAll}
                          className="flex items-center justify-center"
                        >
                          {selectedIds.length === sortedLibrary.length &&
                          sortedLibrary.length > 0 ? (
                            <CheckSquare size={16} className="text-primary" />
                          ) : (
                            <Square
                              size={16}
                              className="text-muted-foreground"
                            />
                          )}
                        </button>
                      </th>
                      {[
                        { label: t("resumeWorkspace.document"), key: "name" },
                        {
                          label: t("resumeWorkspace.candidate"),
                          key: "candidat",
                        },
                        { label: t("resumeWorkspace.type"), key: "type" },
                        { label: t("resumeWorkspace.size"), key: "tailleKo" },
                        {
                          label: t("resumeWorkspace.importedOn"),
                          key: "dateImport",
                        },
                      ].map((col) => (
                        <th
                          key={col.key}
                          onClick={() => toggleSort(col.key)}
                          className="px-4 py-3 text-left text-xs font-700 text-muted-foreground uppercase tracking-wider cursor-pointer select-none hover:text-foreground transition-colors"
                        >
                          <div className="flex items-center gap-1">
                            {col.label}
                            {sortConfig.key === col.key ? (
                              sortConfig.direction === "asc" ? (
                                <ChevronUp size={12} className="text-primary" />
                              ) : (
                                <ChevronDown
                                  size={12}
                                  className="text-primary"
                                />
                              )
                            ) : (
                              <ChevronsUpDown
                                size={12}
                                className="text-muted-foreground/50"
                              />
                            )}
                          </div>
                        </th>
                      ))}
                      <th className="px-4 py-3 text-right text-xs font-700 text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {chargementDocuments ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-6 text-center text-xs text-muted-foreground"
                        >
                          {t("resumeWorkspace.loading")}
                        </td>
                      </tr>
                    ) : sortedLibrary.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-6 text-center text-xs text-muted-foreground"
                        >
                          {t("resumeWorkspace.noImportedCV")}
                        </td>
                      </tr>
                    ) : (
                      sortedLibrary.map((doc) => {
                        const isSelected = selectedIds.includes(doc.id);
                        return (
                          <tr
                            key={doc.id}
                            className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${isSelected ? "bg-primary/5" : ""}`}
                          >
                            <td className="px-4 py-3.5">
                              <button
                                onClick={() => toggleSelectOne(doc.id)}
                                className="flex items-center justify-center"
                              >
                                {isSelected ? (
                                  <CheckSquare
                                    size={16}
                                    className="text-primary"
                                  />
                                ) : (
                                  <Square
                                    size={16}
                                    className="text-muted-foreground"
                                  />
                                )}
                              </button>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-primary flex items-center justify-center text-white text-xs font-700 flex-shrink-0">
                                  {doc.type.slice(0, 3)}
                                </div>
                                <p className="text-sm font-700 text-foreground whitespace-nowrap">
                                  {doc.name}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-sm text-foreground">
                              {doc.candidat || "—"}
                            </td>
                            <td className="px-4 py-3.5 text-sm text-muted-foreground">
                              {doc.type}
                            </td>
                            <td className="px-4 py-3.5 text-sm text-muted-foreground">
                              {doc.tailleKo ? `${doc.tailleKo} KB` : "—"}
                            </td>
                            <td className="px-4 py-3.5 text-sm text-muted-foreground">
                              {doc.dateImport || "—"}
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <button
                                onClick={() =>
                                  handleSupprimerDocument(doc.name)
                                }
                                className="p-2 rounded-lg hover:bg-danger/10 hover:text-danger text-muted-foreground transition-colors"
                                title="Supprimer ce CV"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ScrollDownArrow></ScrollDownArrow>
    </div>
  );
}
