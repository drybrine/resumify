import { notFound } from "next/navigation";
import { getCv, getProfile } from "@/lib/actions/cvs";
import { CvEditor } from "@/components/editor/cv-editor";
import type { Cv, Plan, TemplateId } from "@/lib/types";
import { ALL_TEMPLATES } from "@/lib/types";

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
  const template = (ALL_TEMPLATES as readonly string[]).includes(cv.template)
    ? (cv.template as TemplateId)
    : "jake";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <CvEditor
      cv={{ ...(cv as Cv), template }}
      plan={plan}
      appUrl={appUrl}
    />
  );
}
