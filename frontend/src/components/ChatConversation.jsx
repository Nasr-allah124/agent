import { useState, useEffect, useRef } from "react";
import {
  creerConversation,
  listerConversations,
  obtenirConversation,
  supprimerConversation,
  envoyerMessage,
} from "../api/conversationsApi";
import ReactMarkdown from "react-markdown";
import GraphiqueFacture from "./GraphiqueFacture";

export default function ChatConversation({ service }) {
  const cleStockage = `conversation_active_${service}`;

  const [conversations, setConversations] = useState([]);
  const [conversationActive, setConversationActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputChat, setInputChat] = useState("");
  const [chargementChat, setChargementChat] = useState(false);
  const [chargementConversation, setChargementConversation] = useState(false);

  const finDesMessagesRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    initialiser();
  }, []);

  useEffect(() => {
    finDesMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chargementChat]);

  async function initialiser() {
    const liste = await listerConversations(service);
    setConversations(liste);

    const idSauvegarde = localStorage.getItem(cleStockage);
    const conversationExiste = idSauvegarde && liste.some((c) => String(c.id) === idSauvegarde);

    if (conversationExiste) {
      await ouvrirConversation(Number(idSauvegarde));
    } else if (liste.length > 0) {
      await ouvrirConversation(liste[0].id);
    } else {
      await nouvelleConversation();
    }
  }

  async function nouvelleConversation() {
    const conv = await creerConversation(service);
    setConversations((prev) => [{ id: conv.id, titre: conv.titre, updated_at: conv.updated_at }, ...prev]);
    setConversationActive(conv.id);
    setMessages([]);
    localStorage.setItem(cleStockage, String(conv.id));
  }

  async function ouvrirConversation(id) {
    setChargementConversation(true);
    try {
      const conv = await obtenirConversation(id);
      setConversationActive(id);
      setMessages(conv.messages.map((m) => ({ role: m.role, texte: m.contenu, graphique: m.graphique })));
      localStorage.setItem(cleStockage, String(id));
    } catch (e) {
      console.error(e);
    }
    setChargementConversation(false);
  }

  async function handleSupprimerConversation(id, e) {
    e.stopPropagation();
    await supprimerConversation(id);
    const nouvellesConversations = conversations.filter((c) => c.id !== id);
    setConversations(nouvellesConversations);
    if (conversationActive === id) {
      if (nouvellesConversations.length > 0) {
        ouvrirConversation(nouvellesConversations[0].id);
      } else {
        nouvelleConversation();
      }
    }
  }

  async function handleEnvoyerChat() {
    if (!inputChat.trim() || chargementChat || !conversationActive) return;
    const questionEnvoyee = inputChat;
    setMessages((prev) => [...prev, { role: "user", texte: questionEnvoyee }]);
    setInputChat("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setChargementChat(true);
    try {
      const resultat = await envoyerMessage(conversationActive, questionEnvoyee);
      setMessages((prev) => [...prev, { role: "assistant", texte: resultat.reponse, graphique: resultat.graphique }]);
      const liste = await listerConversations(service);
      setConversations(liste);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", texte: `Erreur : ${e.message}` }]);
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

  return (
    <div className="flex h-[32rem] gap-4">
      <div className="w-56 shrink-0 border-r border-parchmentline pr-3 flex flex-col">
        <button
          onClick={nouvelleConversation}
          className="mb-3 bg-ink text-parchment px-3 py-2 rounded-full font-mono text-[11px] uppercase tracking-widest hover:bg-stamp transition-colors"
        >
          + Nouvelle conversation
        </button>
        <div className="flex-1 overflow-y-auto space-y-1.5">
          {conversations.map((c) => (
            <div
              key={c.id}
              onClick={() => ouvrirConversation(c.id)}
              className={`group relative cursor-pointer rounded-lg px-3 py-2 pr-7 text-xs font-body truncate transition-colors ${
                c.id === conversationActive ? "bg-ink text-parchment" : "text-ink/70 hover:bg-ledger/5"
              }`}
              title={c.titre}
            >
              {c.titre}
              <button
                onClick={(e) => handleSupprimerConversation(c.id, e)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 hover:bg-stamp hover:text-parchment transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {chargementConversation ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-moss/60 italic font-body text-sm">Chargement…</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-moss/60 italic font-body text-sm">Pose ta première question.</p>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 font-body text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-ink text-parchment rounded-br-sm"
                      : "bg-white/60 text-ink border border-parchmentline rounded-bl-sm"
                  }`}
                >
                  <p className="font-mono text-[9px] uppercase tracking-widest mb-1 opacity-50">
                    {m.role === "user" ? "Vous" : "Agent"}
                  </p>
                  <ReactMarkdown>{m.texte}</ReactMarkdown>
                  {m.graphique && <GraphiqueFacture graphique={m.graphique} />}
                </div>
              </div>
            ))
          )}

          {chargementChat && (
            <div className="flex justify-start">
              <div className="bg-white/60 border border-parchmentline rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-moss motion-safe:animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-moss motion-safe:animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-moss motion-safe:animate-bounce" />
              </div>
            </div>
          )}
          <div ref={finDesMessagesRef} />
        </div>

        <div className="mt-4 flex items-end gap-2 bg-white/50 border border-parchmentline rounded-2xl px-3 py-2">
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder="Pose ta question… (Entrée pour envoyer, Maj+Entrée pour un saut de ligne)"
            value={inputChat}
            onChange={handleInputChat}
            onKeyDown={handleKeyDownChat}
            className="flex-1 resize-none bg-transparent font-body text-sm text-ink placeholder:text-moss/60 focus:outline-none py-1.5 max-h-36"
          />
          <button
            onClick={handleEnvoyerChat}
            disabled={!inputChat.trim() || chargementChat}
            className="shrink-0 bg-ink text-parchment px-4 py-2 rounded-full font-mono text-xs uppercase tracking-widest hover:bg-stamp transition-colors disabled:opacity-30"
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}