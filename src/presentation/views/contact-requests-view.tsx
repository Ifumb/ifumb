import {
  respondToContactRequestAction,
  withdrawContactRequestAction,
} from '@/app/actions/contact-request-actions'
import { RespondContactRequestForm } from '@/presentation/components/forms/respond-contact-request-form'
import { WithdrawContactRequestForm } from '@/presentation/components/forms/withdraw-contact-request-form'
import { LocalDateTime } from '@/presentation/components/ui/local-date-time'
import type {
  ContactRequestsViewModel,
  ReceivedRequestViewModel,
  SentRequestViewModel,
} from '@/presentation/mappers/contact-request-view-models'

type ContactRequestsProps = Readonly<{ list: ContactRequestsViewModel }>

export function ContactRequestsView({ list }: ContactRequestsProps) {
  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-bold">Demandes de contact</h1>
      <ReceivedSection items={list.received} />
      <SentSection items={list.sent} />
    </div>
  )
}

function ReceivedSection({ items }: Readonly<{ items: readonly ReceivedRequestViewModel[] }>) {
  return (
    <section aria-labelledby="received-title" className="space-y-4">
      <h2 id="received-title" className="text-2xl font-bold">
        Reçues
      </h2>
      {items.length === 0 ? (
        <p>Vous n’avez reçu aucune demande de contact.</p>
      ) : (
        <ol className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="space-y-2 rounded-lg border border-earth-sand bg-white p-4">
              <p>
                <strong>{item.requesterName}</strong> souhaite être mis(e) en contact au sujet de{' '}
                {item.memberDescription}.
              </p>
              {item.message && <p className="text-sm italic">« {item.message} »</p>}
              <p className="text-sm text-earth-bark">
                {item.statusLabel} · <LocalDateTime iso={item.createdAtIso} />
              </p>
              {item.requesterEmail && (
                <p className="text-sm">
                  Email : <a href={`mailto:${item.requesterEmail}`}>{item.requesterEmail}</a>
                </p>
              )}
              {item.canRespond && (
                <div className="flex flex-wrap gap-3">
                  <RespondContactRequestForm
                    action={respondToContactRequestAction.bind(null, item.id, 'ACCEPTED')}
                    label="Accepter"
                    pendingLabel="Traitement…"
                    variant="primary"
                  />
                  <RespondContactRequestForm
                    action={respondToContactRequestAction.bind(null, item.id, 'REFUSED')}
                    label="Refuser"
                    pendingLabel="Traitement…"
                    variant="secondary"
                  />
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

function SentSection({ items }: Readonly<{ items: readonly SentRequestViewModel[] }>) {
  return (
    <section aria-labelledby="sent-title" className="space-y-4">
      <h2 id="sent-title" className="text-2xl font-bold">
        Envoyées
      </h2>
      {items.length === 0 ? (
        <p>Vous n’avez envoyé aucune demande de contact.</p>
      ) : (
        <ol className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="space-y-2 rounded-lg border border-earth-sand bg-white p-4">
              <p>
                Demande à <strong>{item.ownerName}</strong> ({item.treeName}) au sujet de{' '}
                {item.memberDescription}.
              </p>
              {item.message && <p className="text-sm italic">« {item.message} »</p>}
              <p className="text-sm text-earth-bark">
                {item.statusLabel} · <LocalDateTime iso={item.createdAtIso} />
              </p>
              {item.ownerEmail && (
                <p className="text-sm">
                  Email : <a href={`mailto:${item.ownerEmail}`}>{item.ownerEmail}</a>
                </p>
              )}
              {item.canWithdraw && (
                <WithdrawContactRequestForm
                  action={withdrawContactRequestAction.bind(null, item.id)}
                />
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
