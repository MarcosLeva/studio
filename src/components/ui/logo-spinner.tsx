
import { cn } from "@/lib/utils";

export const LogoSpinner = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)} {...props}>
      <div className="animate-logo-spin">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          stroke="none"
        >
          <rect className="animate-logo-pulse-1 fill-primary" width="7" height="7" x="3" y="3" rx="1" />
          <rect className="animate-logo-pulse-2 fill-accent" width="7" height="7" x="14" y="3" rx="1" />
          <rect className="animate-logo-pulse-3 fill-accent" width="7" height="7" x="3" y="14" rx="1" />
          <rect className="animate-logo-pulse-4 fill-primary" width="7" height="7" x="14" y="14" rx="1" />
        </svg>
      </div>
      <p className="text-sm font-medium text-muted-foreground">Filtrando...</p>
    </div>
  );
};
