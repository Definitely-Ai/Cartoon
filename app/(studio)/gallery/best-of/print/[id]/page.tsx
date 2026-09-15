import { notFound } from "next/navigation";
import { cartoonCollection } from "@/lib/cartoon-collection";
import CartoonPrintStudio from "./CartoonPrintStudio";
import "./print.css";
import {visibleGallery} from '@/lib/gallery-visibility-server';
export const dynamic='force-dynamic';
type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return { title: `Print ${cartoonCollection.find(c => c.id === id)?.title || "cartoon"}` };
}
export default async function CartoonPrintPage({ params }: Props) {
  const { id } = await params;
  const cartoon = (await visibleGallery()).find(c => c.id === id);
  if (!cartoon) notFound();
  return <CartoonPrintStudio cartoon={{ id: cartoon.id, title: cartoon.title, src: cartoon.src, width: cartoon.width, height: cartoon.height, sha256: cartoon.sha256, cityLabel: cartoon.cityLabel }} />;
}
