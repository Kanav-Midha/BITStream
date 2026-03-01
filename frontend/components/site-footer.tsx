export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-black/20 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold text-foreground">BITStream</p>
          <p>Student uploads stay private until an admin approves them.</p>
        </div>
        <div className="flex flex-wrap gap-3 sm:gap-4">
          <a href="/" className="transition-colors hover:text-primary">
            Discover
          </a>
          <a href="/upload" className="transition-colors hover:text-primary">
            Upload
          </a>
          <a href="/admin" className="transition-colors hover:text-primary">
            Review
          </a>
        </div>
      </div>
    </footer>
  );
}
