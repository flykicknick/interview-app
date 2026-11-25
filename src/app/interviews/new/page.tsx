import Link from "next/link";
import { SetupForm } from "@/components/setup/SetupForm";

export default function NewInterview() {
  return (
    <main className="mx-auto max-w-xl p-6">
      <Link href="/" className="text-sm text-indigo-600 hover:underline">← All interviews</Link>
      <h1 className="mb-6 mt-2 text-2xl font-semibold">New interview</h1>
      <SetupForm />
    </main>
  );
}
