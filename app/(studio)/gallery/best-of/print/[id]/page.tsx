import { notFound } from "next/navigation";
import { cartoonCollection } from "@/lib/cartoon-collection";
import CartoonPrintStudio from "./CartoonPrintStudio";
import "./print.css";
type Props = { params: Promise<{ id: string }> };
export function generateStaticParams() { return cartoonCollection.map(c => ({ id: c.id })); }
export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return { title: `Print ${cartoonCollection.find(c => c.id === id)?.title || "cartoon"}` };
}
export default async function CartoonPrintPage({ params }: Props) {
  const { id } = await params;
  const cartoon = cartoonCollection.find(c => c.id === id);
  if (!cartoon) notFound();
  return <CartoonPrintStudio cartoon={{ id: cartoon.id, title: cartoon.title, src: cartoon.src, width: cartoon.width, height: cartoon.height, sha256: cartoon.sha256, cityLabel: cartoon.cityLabel }} />;
}
