import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md animate-fade-in">
        <div className="text-6xl font-bold text-primary">404</div>
        <h1 className="text-3xl font-bold text-foreground">
          Page Not Found
        </h1>
        <p className="text-foreground/70">
          The page you&apos;re looking for doesn&apos;t exist. Let&apos;s get you back on track.
        </p>
        <Link href="/">
          <button className="px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
            Go Back Home
          </button>
        </Link>
      </div>
    </main>
  );
}
