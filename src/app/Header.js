import Link from 'next/link'

export default function Header() {
  return (
    <header
      style={{
        padding: '14px 40px',
        borderBottom: '1px solid #eee',
        backgroundColor: '#fff',
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
          style={{ height: '64px', width: 'auto', objectFit: 'contain' }}
        />
        <span
          style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#333',
            letterSpacing: '0.3px',
          }}
        >
          Tienda
        </span>
      </Link>
    </header>
  )
}