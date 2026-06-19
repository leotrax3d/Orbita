export default function Header() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 lg:px-8">
      <div className="flex items-center gap-2.5">
        <OrbitMark />
        <h1 className="font-heading text-xl font-semibold tracking-tight text-ink">Orbita</h1>
      </div>
      <p className="hidden font-body text-sm text-ink/55 sm:block">
        Fourier epicycles, computed in your browser
      </p>
    </header>
  );
}

function OrbitMark() {
  return (
    <svg className="h-7 w-7" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="9" fill="none" stroke="#e8e6dc" strokeWidth="2" />
      <line x1="16" y1="16" x2="25" y2="16" stroke="#d97757" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="2.5" fill="#2d2a26" />
      <circle cx="25" cy="16" r="3" fill="#d97757" />
    </svg>
  );
}
