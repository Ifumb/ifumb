import 'server-only'

export type PendingChangeAlertContent = {
  readonly ownerName: string
  readonly editorName: string
  readonly treeName: string
  readonly pendingCount: number
  readonly reviewUrl: string
}

/**
 * HTML body of the pending-change alert email.
 * reason: every name here is free text an editor or the owner typed into the app (a first name, a
 * tree name); the legacy app interpolated them unescaped into this same email (module 2.6, bug 8).
 */
export function renderPendingChangeAlertEmail(content: PendingChangeAlertContent): string {
  const owner = escapeHtml(content.ownerName)
  const editor = escapeHtml(content.editorName)
  const tree = escapeHtml(content.treeName)
  return [
    '<div style="font-family:sans-serif;max-width:480px;margin:0 auto">',
    '<h1 style="font-size:20px">Modifications en attente</h1>',
    `<p>Bonjour ${owner},</p>`,
    `<p><strong>${editor}</strong> a proposé <strong>${content.pendingCount} modification(s)</strong>`,
    ` sur l'arbre <strong>&laquo; ${tree} &raquo;</strong>.</p>`,
    `<p><a href="${content.reviewUrl}" style="display:inline-block;padding:12px 24px;background:#8b2e06;`,
    'color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600">',
    'Réviser les modifications</a></p>',
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
