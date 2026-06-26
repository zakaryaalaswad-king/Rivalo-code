import { FileText } from "lucide-react";

export default function Terms() {
  return (
    <div className="max-w-3xl mx-auto px-6 md:px-10 py-16">
      <div className="flex items-center gap-3"><FileText className="text-[#22C55E]" size={28} /><h1 className="font-display text-4xl">Terms of Use</h1></div>
      <div className="text-muted text-sm mt-3">Last updated: February 2026</div>

      <div className="mt-10 space-y-8 text-slate-300 leading-relaxed text-[15px]">
        <Section title="1. Acceptance">
          By accessing or using Rivalo (the “Service”), you agree to these Terms of Use (the “Terms”) and to our
          Privacy Policy. If you do not agree, do not use the Service.
        </Section>

        <Section title="2. The service">
          Rivalo is a competitive freelance marketplace. Clients (“Buyers”) post briefs and fund a bounty in escrow.
          Freelancers (“Sellers”) apply, the Buyer approves a limited number of competitors, the chosen competitors
          submit work within a defined window, and the Buyer crowns one winner who receives the bounty (less applicable
          fees).
        </Section>

        <Section title="3. Eligibility">
          You must be at least 16 years old and capable of forming a binding contract under the laws of your country.
          Some jurisdictions or local laws may impose additional restrictions on freelance work or marketplace participation.
        </Section>

        <Section title="4. Accounts">
          You are responsible for keeping your account credentials secure and for all activity on your account. You agree
          to provide accurate information and to keep it up to date. We may suspend or terminate accounts that violate
          these Terms, abuse the Service, or attempt to defraud other users.
        </Section>

        <Section title="5. Briefs, applications, and submissions">
          <ul className="list-disc ml-6 space-y-1">
            <li>Buyers must own (or have rights to) any reference material they post in a brief.</li>
            <li>Sellers must do their own work. Submissions must not violate third-party rights (copyright, trademark, NDA).</li>
            <li>Until a winner is crowned, no submission becomes the Buyer's property; copyright remains with the Seller.</li>
            <li>Upon a Buyer crowning a winning submission and the bounty being released, ownership of the winning deliverable
              (excluding any third-party assets clearly identified by the Seller) transfers to the Buyer.</li>
          </ul>
        </Section>

        <Section title="6. Payments">
          Buyers fund the bounty upfront via Stripe. The bounty is held in escrow and released to the winning Seller
          (minus platform fees, if any) when a winner is crowned. Sellers are responsible for their own taxes. Sellers may add
          payout details (PayPal, bank/IBAN, Wise, card, or crypto wallet) — actual payouts may require an additional
          on-boarding step (e.g., Stripe Connect) which we will announce in-product.
        </Section>

        <Section title="7. Disputes">
          If a Buyer fails to pick a winner within a reasonable period after the competition window ends, Rivalo may, at
          its discretion, return the bounty to the Buyer, or, where appropriate, distribute it among approved competitors.
          Users agree to attempt good-faith resolution before escalating.
        </Section>

        <Section title="8. Prohibited conduct">
          <ul className="list-disc ml-6 space-y-1">
            <li>No off-platform payments to circumvent fees or escrow.</li>
            <li>No impersonation, plagiarism, ghost-writing, or AI-generated submissions you cannot legally license to the Buyer.</li>
            <li>No harassment, hate speech, sexual content involving minors, or illegal activity.</li>
            <li>No scraping, brute force, automated mass-applications, or attempts to disrupt the Service.</li>
          </ul>
        </Section>

        <Section title="9. Intellectual property">
          The Rivalo name, logo, and platform are our property. We grant you a limited, non-exclusive, non-transferable
          license to use the Service for its intended purposes. You retain ownership of content you upload, subject to the
          transfer rule in Section 5.
        </Section>

        <Section title="10. AI features">
          Our AI Coach and AI Vetting Task generator are provided “as is.” They may produce inaccurate or biased output.
          Users are responsible for verifying outputs and for their own work; we explicitly prompt the AI not to write
          deliverables on a freelancer's behalf.
        </Section>

        <Section title="11. Disclaimers">
          The Service is provided “as is” without warranties of any kind. To the maximum extent permitted by law, we
          disclaim all implied warranties, including merchantability, fitness for a particular purpose, and non-infringement.
        </Section>

        <Section title="12. Limitation of liability">
          To the maximum extent permitted by law, our total liability for any claim relating to the Service will not exceed
          the greater of (a) USD 100, or (b) the fees you paid to Rivalo in the 6 months preceding the claim. We are not
          liable for indirect, incidental, consequential, or punitive damages.
        </Section>

        <Section title="13. Termination">
          You may stop using the Service at any time. We may suspend or terminate access immediately if you violate these
          Terms. Sections relating to ownership, disclaimers, and limitation of liability survive termination.
        </Section>

        <Section title="14. Governing law">
          These Terms are governed by the laws of your country of residence unless mandatory local law provides otherwise.
        </Section>

        <Section title="15. Changes">
          We may update these Terms. We'll post the new version here with an updated “last updated” date. Continued use of
          the Service after changes constitutes acceptance.
        </Section>

        <Section title="16. Contact">
          <a className="text-[#3B82F6] hover:underline" href="mailto:legal@rivalo.example">legal@rivalo.example</a>
        </Section>

        <div className="text-xs text-muted pt-6 border-t border-white/5">
          This document is a template provided for the Rivalo MVP and does not constitute legal advice.
          Before launching commercially, please have it reviewed by qualified counsel in your jurisdiction.
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="font-display text-2xl mb-3">{title}</h2>
      <div>{children}</div>
    </section>
  );
}
