import type { Metadata } from "next";
import { SubmitForm } from "./submit-form";

export const metadata: Metadata = {
  title: "Submit an opportunity",
  description: "Spotted a hackathon, voucher, scholarship, or CFP we missed? Tell us in thirty seconds.",
};

export default function SubmitPage() {
  return (
    <section className="relative max-w-[560px]">
      <SubmitForm />
    </section>
  );
}
