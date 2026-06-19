export default function Header() {
  return (
    <header className="mx-auto w-full max-w-6xl px-4 pb-6 pt-8 lg:px-8 lg:pt-12">
      <div className="flex items-center gap-3">
        <OrbitMark />
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-ink lg:text-3xl">
          Orbita
        </h1>
      </div>
      <p className="mt-3 max-w-2xl font-body text-base leading-relaxed text-ink/70">
        Decompose an image contour into a Fourier series. Each rotating vector is one frequency
        component; summed tip-to-tail, they retrace the outline. Upload a high-contrast image or
        explore the preset.
      </p>
    </header>
  );
}

function OrbitMark() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="9" fill="none" stroke="#e8e6dc" strokeWidth="2" />
      <line x1="16" y1="16" x2="25" y2="16" stroke="#d97757" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="2.5" fill="#2d2a26" />
      <circle cx="25" cy="16" r="3" fill="#d97757" />
    </svg>
  );
}
