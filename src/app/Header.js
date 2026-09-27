import Link from 'next/link'

export default function Header() {
  return (
    <header
      style={{
        padding: '14px 40px',
        borderBottom: '1px solid #E4DCCF',
        backgroundImage:
          'linear-gradient(to right, rgba(250,246,240,0.97) 0%, rgba(250,246,240,0.88) 45%, rgba(250,246,240,0.55) 100%), url(/img/fondo-tela.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'right center',
      }}
    >
      <Link
        href="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          textDecoration: 'none',
        }}
      >
        <img
          src="/logo.png"
          alt="dimedetiambos"
          style={{ height: '72px', width: 'auto', objectFit: 'contain' }}
        />
        <span
          style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#2E2A26',
            letterSpacing: '0.3px',
          }}
        >
          Tienda
        </span>
      </Link>
    </header>
  )
}