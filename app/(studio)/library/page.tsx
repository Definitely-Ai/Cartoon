import { readStudioLibrary } from "@/lib/studio-library";
import LibraryClient from "./LibraryClient";
import "./library.css";

export const metadata = {
  title: "Image library",
  description: "The studio's image archive: editions, drafts, scene parts, references and studies in one place.",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ image?: string }> }) {
  const { image } = await searchParams;
  return <LibraryClient manifest={readStudioLibrary()} initialImageId={image} />;
}
