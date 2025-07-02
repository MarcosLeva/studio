
import { cn } from "@/lib/utils";

export const LogoSpinner = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)} {...props}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="none"
      >
        <rect className="animate-spinner-pulse-1" width="7" height="7" x="3" y="3" rx="1" />
        <rect className="animate-spinner-pulse-2" width="7" height="7" x="14" y="3" rx="1" />
        <rect className="animate-spinner-pulse-3" width="7" height="7" x="3" y="14" rx="1" />
        <rect className="animate-spinner-pulse-4" width="7" height="7" x="14" y="14" rx="1" />
      </svg>
      <p className="text-sm font-medium text-muted-foreground">Filtrando...</p>
    </div>
  );
};
