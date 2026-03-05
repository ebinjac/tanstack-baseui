export function PageFooter() {
  return (
    <footer className="relative z-10 border-border/20 border-t bg-background py-12">
      <div className="container mx-auto flex max-w-7xl flex-col items-center justify-between px-4 opacity-60 transition-opacity hover:opacity-100 md:flex-row">
        <p className="w-full text-center text-muted-foreground text-xs md:w-auto md:text-left">
          &copy; {new Date().getFullYear()} American Express. <br />
          Built for internal excellence. Use responsibly.
        </p>
        <div className="mt-4 flex gap-6 md:mt-0">
          <span className="cursor-pointer font-medium text-xs hover:text-primary">
            Policy
          </span>
          <span className="cursor-pointer font-medium text-xs hover:text-primary">
            Support
          </span>
          <span className="cursor-pointer font-medium text-xs hover:text-primary">
            Status
          </span>
        </div>
      </div>
    </footer>
  );
}
