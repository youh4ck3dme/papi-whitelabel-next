import { AppTopBar } from "./AppTopBar";

export function PageShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="app-shell">
      <AppTopBar />
      <main className="page">{children}</main>
    </div>
  );
}
