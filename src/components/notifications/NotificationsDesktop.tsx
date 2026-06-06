"use client"

interface NotifDesktopProps {
  notifications?: any[]
}

export function NotificationsDesktop({ notifications = [] }: NotifDesktopProps) {
  return (
    <div className="space-y-8 max-w-4xl">
      <h1 className="text-3xl font-bold [font-family:var(--font-display)] text-[var(--fg-1)]">
        🔔 Notifications
      </h1>

      <div className="bg-[var(--bg-2)] rounded-lg border border-[var(--border-light)] p-6">
        <h2 className="text-lg font-bold text-[var(--fg-1)] mb-4">📬 Historique</h2>

        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[var(--fg-3)]">Aucune notification pour l'instant</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif: any, idx: number) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-[var(--bg-1)] rounded-lg border border-[var(--border-light)]">
                <div className="w-2 h-2 rounded-full bg-[var(--emerald-500)] mt-2 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-[var(--fg-1)]">{notif.title}</p>
                  <p className="text-sm text-[var(--fg-3)]">{notif.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-[var(--bg-2)] rounded-lg border border-[var(--border-light)] p-6">
        <h2 className="text-lg font-bold text-[var(--fg-1)] mb-4">⚙️ Préférences</h2>
        <p className="text-sm text-[var(--fg-3)]">Gérez vos préférences de notifications dans les paramètres de profil</p>
      </div>
    </div>
  )
}
