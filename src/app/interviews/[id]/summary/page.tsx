import { Summary } from "@/components/summary/Summary";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Summary id={id} />;
}
