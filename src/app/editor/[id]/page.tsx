import { notFound } from "next/navigation";
import { getCv, getProfile } from "@/lib/actions/cvs";
import { CvEditor } from "@/components/editor/cv-editor";
import type { Cv, Plan } from "@/lib/types";

export const metadata = { title: "Editor" };

export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [cv, profile] = await Promise.all([getCv(id), getProfile()]);
  if (!cv) notFound();

  const plan = (profile?.is_admin ? "admin" : profile?.plan || "free") as Plan;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <CvEditor
      cv={cv as Cv}
      plan={plan}
      appUrl={appUrl}
    />
  );
}
