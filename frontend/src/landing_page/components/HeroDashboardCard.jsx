import { useTranslation } from 'react-i18next';
import { Star, Sparkles, Upload, MessageCircle } from 'lucide-react';

const documents = [
  { id: 'cv', code: 'CV', percent: 96 },
  { id: 'invoice', code: 'INV', percent: 98 },
  { id: 'excel', code: 'XLS', percent: 91 },
  { id: 'word', code: 'DOC', percent: 88 },
];

export default function HeroDashboardCard() {
  const { t } = useTranslation();

  return (
    <div className="relative w-full max-w-lg">
      {/* Card principale */}
      <div className="glass border border-border rounded-3xl p-6 shadow-glow-purple">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-semibold text-foreground">{t('dashboard.uploadedDocs')}</h3>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground">{t('dashboard.live')}</span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {doc.code}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {t(`dashboard.docs.${doc.id}.name`)}
                </p>
                <p className="text-xs text-muted-foreground">{t(`dashboard.docs.${doc.id}.type`)}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-16 h-1.5 rounded-full bg-purple-soft overflow-hidden">
                  <div
                    className="h-full gradient-bg rounded-full"
                    style={{ width: `${doc.percent}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground w-8">{doc.percent}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Badge flottant : AI Accuracy */}
      <div className="absolute -top-6 -left-6 glass border border-border rounded-2xl px-4 py-3 shadow-glow-purple flex items-center gap-2">
        <Star size={18} className="text-yellow-400 fill-yellow-400" />
        <div>
          <p className="text-xs text-muted-foreground">{t('dashboard.aiAccuracy')}</p>
          <p className="text-sm font-bold keyword-gradient">{t('dashboard.reliable')}</p>
        </div>
      </div>

      {/* Badge flottant : Docs Uploaded */}
      <div className="absolute top-1/2 -right-8 glass border border-border rounded-2xl px-4 py-3 shadow-glow-purple flex items-center gap-2">
        <Upload size={18} className="text-primary" />
        <div>
          <p className="text-sm font-bold text-foreground">{t('dashboard.docsCount')}</p>
          <p className="text-xs text-muted-foreground">{t('dashboard.uploaded')}</p>
        </div>
      </div>

      {/* Card flottante : AI Processing */}
      <div className="absolute -bottom-8 left-4 glass border border-border rounded-2xl p-4 shadow-glow-purple w-56">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-primary" />
          <span className="text-sm font-semibold text-foreground">{t('dashboard.aiProcessing')}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 rounded-lg bg-purple-soft text-xs text-primary font-medium">
            {t('dashboard.parsing')}
          </span>
          <span className="px-2 py-1 rounded-lg bg-purple-soft text-xs text-muted-foreground font-medium">
            {t('dashboard.analyzing')}
          </span>
          <span className="px-2 py-1 rounded-lg bg-purple-soft text-xs text-muted-foreground font-medium">
            {t('dashboard.insights')}
          </span>
        </div>
      </div>

      {/* Card flottante : AI Assistant chat */}
      <div className="absolute -bottom-16 -right-4 glass border border-border rounded-2xl p-4 shadow-glow-purple w-64">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle size={16} className="text-primary" />
          <span className="text-sm font-semibold text-foreground">{t('dashboard.aiAssistant')}</span>
        </div>
        <div className="flex flex-col gap-2">
          <div className="self-end gradient-bg text-white text-xs rounded-xl rounded-br-sm px-3 py-2 max-w-[85%]">
            {t('dashboard.question')}
          </div>
          <div className="self-start bg-purple-soft text-foreground text-xs rounded-xl rounded-bl-sm px-3 py-2 max-w-[85%]">
            {t('dashboard.answer')}
          </div>
        </div>
      </div>
    </div>
  );
}