import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const COULEURS = ["#C9A227", "#B23A2E", "#5C7188", "#1C3F5E", "#8A6D3B"];

export default function GraphiqueFacture({ graphique }) {
  if (!graphique || !graphique.donnees?.length) return null;

  const { type, titre, donnees } = graphique;

  return (
    <div className="bg-white/60 border border-parchmentline rounded-xl p-4 mt-2">
      {titre && (
        <p className="font-mono text-[11px] uppercase tracking-widest text-moss mb-3">{titre}</p>
      )}
      <ResponsiveContainer width="100%" height={220}>
        {type === "line" ? (
          <LineChart data={donnees}>
            <XAxis dataKey="categorie" stroke="#5C7188" fontSize={11} />
            <YAxis stroke="#5C7188" fontSize={11} />
            <Tooltip />
            <Line type="monotone" dataKey="valeur" stroke="#B23A2E" strokeWidth={2} />
          </LineChart>
        ) : type === "pie" ? (
          <PieChart>
            <Pie data={donnees} dataKey="valeur" nameKey="categorie" outerRadius={80} label>
              {donnees.map((_, i) => (
                <Cell key={i} fill={COULEURS[i % COULEURS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        ) : (
          <BarChart data={donnees}>
            <XAxis dataKey="categorie" stroke="#5C7188" fontSize={11} />
            <YAxis stroke="#5C7188" fontSize={11} />
            <Tooltip />
            <Bar dataKey="valeur" fill="#C9A227" radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}