import Link from "next/link";
import { ChevronLeft, MapPin } from "lucide-react";

type Props = {
  title: string;
  subtitle?: string;
  backHref?: string;
  action?: React.ReactNode;
};

export function AppHeader({ title, subtitle, backHref, action }: Props) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-3.5">
        {backHref ? (
          <Link
            href={backHref}
            className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-primary"
            aria-label="戻る"
          >
            <ChevronLeft className="size-5" />
          </Link>
        ) : (
          <span className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-primary">
            <MapPin className="size-5" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-extrabold leading-tight">{title}</h1>
          {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  );
}
