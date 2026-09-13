import 'server-only'
import { Resend } from 'resend'
import type {
  PasswordResetMailer,
  PasswordResetMessage,
} from '@/core/use-cases/ports/password-reset-mailer'

export type ResendMailerConfig = {
  readonly apiKey: string
  readonly from: string
  readonly appUrl: string
}

const RESET_PAGE_PATH = '/reset-password'
const SUBJECT = 'Réinitialisation de votre mot de passe IFUMB'

export class ResendPasswordResetMailer implements PasswordResetMailer {
  constructor(private readonly config: ResendMailerConfig) {}

  async sendResetLink({ to, token }: PasswordResetMessage): Promise<void> {
    const { error } = await new Resend(this.config.apiKey).emails.send({
      from: this.config.from,
      to: to.value,
      subject: SUBJECT,
      html: renderResetEmail(this.resetUrl(token)),
    })
    // reason: logged rather than thrown, as in the legacy API. A delivery failure surfacing to
    // the caller would tell registered addresses apart from unknown ones (account enumeration).
    // The recipient address is deliberately left out of the log.
    if (error) console.error(`Password reset email could not be sent: ${error.message}`)
  }

  private resetUrl(token: string): string {
    const url = new URL(RESET_PAGE_PATH, this.config.appUrl)
    url.searchParams.set('token', token)
    return url.toString()
  }
}

function renderResetEmail(resetUrl: string): string {
  return [
    '<div style="font-family:sans-serif;max-width:480px;margin:0 auto">',
    '<h1 style="font-size:20px">Réinitialisation de mot de passe</h1>',
    '<p>Vous avez demandé à réinitialiser votre mot de passe IFUMB. Ce lien est valable une heure.</p>',
    `<p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#8b2e06;`,
    'color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600">',
    'Réinitialiser mon mot de passe</a></p>',
    "<p>Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>",
    '</div>',
  ].join('')
}
