import PlatformInstallWizard from "./PlatformInstallWizard";
import { cn } from "../../lib/utils";

/**
 * Install block with platform dropdown (Cursor, Claude, Codex, …).
 * Shared by hero and CTA so they stay identical.
 */
export default function InstallCard({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "onDark";
}) {
  return <PlatformInstallWizard className={cn(className)} variant={variant} />;
}
