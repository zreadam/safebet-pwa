"use client"

import Link from "next/link"

export default function LegalPage() {
  const documents = [
    {
      title: "📋 Mentions Légales",
      description: "Informations légales, responsable du service, propriété intellectuelle",
      href: "/legal/mentions-legales.html",
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "📜 Conditions d'Utilisation",
      description: "Termes de service, règles d'utilisation, limitations de responsabilité",
      href: "/legal/conditions-utilisation.html",
      color: "from-emerald-500 to-emerald-600",
    },
    {
      title: "🔒 Politique de Confidentialité",
      description: "RGPD, traitement des données, droits de l'utilisateur, sécurité",
      href: "/legal/politique-confidentialite.html",
      color: "from-purple-500 to-purple-600",
    },
  ]

  return (
    <div className="min-h-screen bg-[var(--bg-0)] pt-20 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-[40px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)] mb-4">
            Documents Légaux
          </h1>
          <p className="text-[var(--fg-3)] text-[16px] max-w-2xl mx-auto">
            SafeBet est une plateforme de simulation de paris sportifs utilisant de l'argent fictif.
            Consultez nos documents légaux pour comprendre vos droits et obligations.
          </p>
        </div>

        {/* Warning Banner */}
        <div className="bg-[#FEF3C7] border border-[#F59E0B] rounded-lg p-6 mb-12">
          <div className="flex gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold text-[#78350F] mb-1">Service de Simulation</p>
              <p className="text-[14px] text-[#92400E]">
                SafeBet n'est PAS une plateforme de paris avec argent réel. La monnaie "Bluff" n'a aucune valeur réelle.
                Aucun argent réel ne peut être déposé ou retiré via les paris.
              </p>
            </div>
          </div>
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {documents.map((doc) => (
            <a
              key={doc.href}
              href={doc.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`bg-gradient-to-br ${doc.color} rounded-lg p-8 text-white hover:shadow-lg transition-all duration-300 cursor-pointer group`}
            >
              <div className="flex flex-col h-full">
                <h2 className="text-[20px] font-bold mb-3 group-hover:translate-x-1 transition-transform">
                  {doc.title}
                </h2>
                <p className="text-[14px] opacity-90 flex-grow">
                  {doc.description}
                </p>
                <div className="mt-4 flex items-center text-[12px] font-semibold opacity-75 group-hover:opacity-100 transition-opacity">
                  Lire le document →
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Info Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Contact */}
          <div className="bg-[var(--bg-1)] rounded-lg border border-[var(--border-light)] p-8">
            <h3 className="text-[18px] font-bold text-[var(--fg-1)] mb-4">📧 Nous Contacter</h3>
            <p className="text-[14px] text-[var(--fg-3)] mb-4">
              Des questions sur nos politiques ou vos données?
            </p>
            <div className="space-y-2 text-[14px]">
              <p>
                <strong>Email:</strong> privacy@safebet.local
              </p>
              <p>
                <strong>Support:</strong> support@safebet.local
              </p>
              <p className="text-[12px] text-[var(--fg-4)]">
                Réponse dans 48-72 heures
              </p>
            </div>
          </div>

          {/* RGPD Rights */}
          <div className="bg-[var(--bg-1)] rounded-lg border border-[var(--border-light)] p-8">
            <h3 className="text-[18px] font-bold text-[var(--fg-1)] mb-4">🔐 Vos Droits RGPD</h3>
            <ul className="text-[14px] text-[var(--fg-3)] space-y-2">
              <li>✅ Accès à vos données</li>
              <li>✅ Rectification / Suppression</li>
              <li>✅ Portabilité des données</li>
              <li>✅ Opposition au traitement</li>
            </ul>
            <p className="text-[12px] text-[var(--fg-4)] mt-4">
              Exercez vos droits via paramètres ou email
            </p>
          </div>

          {/* What is SafeBet */}
          <div className="bg-[var(--bg-1)] rounded-lg border border-[var(--border-light)] p-8">
            <h3 className="text-[18px] font-bold text-[var(--fg-1)] mb-4">🎮 Qu'est-ce que SafeBet?</h3>
            <p className="text-[14px] text-[var(--fg-3)] mb-3">
              SafeBet est une plateforme de <strong>simulation</strong> de paris sportifs utilisant une monnaie fictive appelée "Bluff".
            </p>
            <ul className="text-[13px] text-[var(--fg-3)] space-y-1">
              <li>• Pas d'argent réel impliqué</li>
              <li>• Impossible de déposer/retirer de l'argent</li>
              <li>• Pour apprentissage et divertissement</li>
            </ul>
          </div>

          {/* Premium Info */}
          <div className="bg-[var(--bg-1)] rounded-lg border border-[var(--border-light)] p-8">
            <h3 className="text-[18px] font-bold text-[var(--fg-1)] mb-4">💳 Abonnement Premium</h3>
            <p className="text-[14px] text-[var(--fg-3)] mb-3">
              Premium est un abonnement optionnel à <strong>4,99€/mois</strong> pour débloquer des features.
            </p>
            <ul className="text-[13px] text-[var(--fg-3)] space-y-1">
              <li>• Paiement via Stripe (sécurisé)</li>
              <li>• Annulable à tout moment</li>
              <li>• Droit de rétractation: 14 jours</li>
            </ul>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-[var(--bg-1)] rounded-lg border border-[var(--border-light)] p-8">
          <h3 className="text-[20px] font-bold text-[var(--fg-1)] mb-6">❓ Questions Fréquentes</h3>

          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-[var(--fg-1)] mb-2">Puis-je convertir Bluff en argent réel?</h4>
              <p className="text-[14px] text-[var(--fg-3)]">
                Non. Bluff n'a aucune valeur réelle et ne peut pas être converti, vendu ou transféré.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-[var(--fg-1)] mb-2">Quel est l'âge minimum?</h4>
              <p className="text-[14px] text-[var(--fg-3)]">
                SafeBet est accessible dès 13 ans. Premium (paiement) nécessite 18 ans minimum.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-[var(--fg-1)] mb-2">Où sont stockées mes données?</h4>
              <p className="text-[14px] text-[var(--fg-3)]">
                Vos données sont stockées chez Supabase (Dublin, UE) avec chiffrement intégral et RGPD compliant.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-[var(--fg-1)] mb-2">Comment supprimer mon compte?</h4>
              <p className="text-[14px] text-[var(--fg-3)]">
                Paramètres → Supprimer mon compte → Confirmation. Vos données seront effacées après 30 jours.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-[var(--fg-1)] mb-2">Avez-vous une licence de paris?</h4>
              <p className="text-[14px] text-[var(--fg-3)]">
                Non. SafeBet n'est pas un service de paris réels et ne nécessite pas de licence. C'est une simulation.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-12 pt-8 border-t border-[var(--border-light)] text-center">
          <p className="text-[12px] text-[var(--fg-4)]">
            Dernière mise à jour: 8 Juin 2026
            <br />
            SafeBet © 2026 - Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  )
}
