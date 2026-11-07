import Image from 'next/image'
import { Icon } from '@/presentation/components/ui/icon'

// reason: la figure et sa légende forment un aperçu statique unique, sans faux contrôles interactifs.
export function LandingPreviewView() {
  return (
    <figure className="landing-preview">
      <div className="landing-preview-heading">
        <div className="flex items-center gap-3">
          <span className="landing-preview-icon">
            <Icon name="branch" size={21} />
          </span>
          <div>
            <p className="font-semibold">Une famille, des liens</p>
            <p className="text-xs text-landing-muted">De génération en génération</p>
          </div>
        </div>
        <span className="landing-private-label">
          <Icon name="lock" size={12} /> Privé
        </span>
      </div>
      <div className="landing-preview-canvas">
        <span className="landing-preview-label">Aperçu d’un arbre</span>
        <Image
          src="/landing/graph-preview.png"
          alt="Arbre généalogique IFUMB : Ivala et Mintsa, puis Serge, Pascal et Ghislaine, et enfin Nadège. Les unions relient trois générations et les identités Myéné, Fang et Nzébi sont affichées."
          width={480}
          height={550}
          sizes="(max-width: 639px) 85vw, 400px"
          preload
          className="landing-preview-image"
        />
      </div>
      <figcaption className="landing-preview-caption">
        <span className="landing-preview-icon">
          <Icon name="heart" size={20} />
        </span>
        <span>
          <strong>Bien plus que des noms.</strong>
          <br />
          Les liens qui racontent votre famille.
        </span>
      </figcaption>
    </figure>
  )
}
