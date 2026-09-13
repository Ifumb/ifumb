import 'server-only'

/**
 * HTML body of the password reset email.
 * reason: colours and sizes are literal values, not design tokens — email clients do not support
 * CSS custom properties, so the brand values (brand-dark #8b2e06, ivory text) are inlined.
 */
export function renderPasswordResetEmail(resetUrl: string): string {
  return [
    '<div style="font-family:sans-serif;max-width:480px;margin:0 auto">',
    '<h1 style="font-size:20px">Réinitialisation de mot de passe</h1>',
    '<p>Vous avez demandé à réinitialiser votre mot de passe IFUMB.',
    ' Ce lien est valable une heure.</p>',
    `<p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#8b2e06;`,
    'color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600">',
    'Réinitialiser mon mot de passe</a></p>',
    "<p>Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>",
    '</div>',
  ].join('')
}
