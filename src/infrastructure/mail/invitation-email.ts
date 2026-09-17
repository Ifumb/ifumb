import 'server-only'

export type InvitationEmailContent = {
  readonly inviterName: string
  readonly treeName: string
  readonly acceptUrl: string
}

/**
 * HTML body of the invitation email.
 * reason: `inviterName` and `treeName` are free text someone typed into the app; the legacy app
 * interpolated them unescaped into this same email (module 2.8, same bug family as module 2.6's
 * pending-change alert).
 */
export function renderInvitationEmail(content: InvitationEmailContent): string {
  const inviter = escapeHtml(content.inviterName)
  const tree = escapeHtml(content.treeName)
  return [
    '<div style="font-family:sans-serif;max-width:480px;margin:0 auto">',
    '<h1 style="font-size:20px">Invitation à collaborer</h1>',
    `<p><strong>${inviter}</strong> vous invite à rejoindre l'arbre généalogique`,
    ` <strong>&laquo; ${tree} &raquo;</strong> sur IFUMB.</p>`,
    "<p>Ce lien expire dans <strong>7 jours</strong>.</p>",
    `<p><a href="${content.acceptUrl}" style="display:inline-block;padding:12px 24px;`,
    'background:#8b2e06;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600">',
    "Voir l'invitation</a></p>",
    '</div>',
  ].join('')
}

const HTML_ESCAPES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character] ?? character)
}
