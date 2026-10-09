import Link from 'next/link'
import Image from 'next/image'

export default function FloatingLogo() {
  return (
    <Link href="/" className="dmt-logo-flotante" aria-label="Dimedetiambos - ir al inicio">
      <Image
        src="/logo-flotante.png"
        alt="Dimedetiambos"
        width={72}
        height={72}
        priority
      />
    </Link>
  )
}