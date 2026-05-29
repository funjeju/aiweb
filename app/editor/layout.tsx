import { AuthGuard } from "@/components/AuthGuard";

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
