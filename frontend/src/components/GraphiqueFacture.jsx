import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const COULEURS = ["#7c3aed", "var(--secondary)", "var(--success)", "var(--warning)", "var(--danger)"];

export default function GraphiqueFacture({ graphique }) {
  if (!graphique || !graphique.donnees?.length) return null;
  const { type, titre, donnees } = graphique;

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      {titre && <p className="text-xs font-700 text-muted-foreground uppercase tracking-wide mb-3">{titre}</p>}
      <ResponsiveContainer width="100%" height={200}>
        {type === "line" ? (
          <LineChart data={donnees}>
            <defs>
              <linearGradient id="ligneDegradee" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <XAxis dataKey="categorie" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
            <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
            <Tooltip
             />
            <Line type="monotone" dataKey="valeur" stroke="url(#ligneDegradee)" strokeWidth={2} />
          </LineChart>
        ) : type === "pie" ? (
          <PieChart>
            <Pie data={donnees} dataKey="valeur" nameKey="categorie" outerRadius={70} label>
              {donnees.map((_, i) => (
                <Cell key={i} fill={COULEURS[i % COULEURS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        ) : (
          <BarChart data={donnees}>
            <defs>
              <linearGradient id="barreDegradee" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <XAxis dataKey="categorie" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
            <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
            <Tooltip />
            <Bar dataKey="valeur" fill="url(#barreDegradee)" radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
