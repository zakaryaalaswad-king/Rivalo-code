import COMPANY from "../config/company";
import { FileText } from "lucide-react";

export default function Terms() {
  return (
    <div className="max-w-3xl mx-auto px-6 md:px-10 py-16">
      <div className="flex items-center gap-3"><FileText className="text-[#22C55E]" size={28} /><h1 className="font-display text-4xl">Terms of Service</h1></div>
      <div className="text-muted text-sm mt-3">Last updated: {COMPANY.lastUpdated}</div>

      <div className="mt-10 space-y-7 text-slate-300 leading-relaxed text-[15px]">
        <Section title="1. Acceptance">
          These Terms of Service (the “Terms”) form a binding agreement between you and {COMPANY.legalName} (“{COMPANY.brandName}”).
          By creating an account, accessing, or using the Service you agree to these Terms and to our <a href="/privacy" className="underline">Privacy Policy</a>. If you do not agree, do not use the Service.
        </Section>

        <Section title="2. Eligibility">
          You must be at least 16 years old and have legal capacity to enter binding contracts in your jurisdiction. By using the
          Service, you represent that you are not barred from using {COMPANY.brandName} under the laws of any applicable jurisdiction.
        </Section>

        <Section title="3. User accounts">
          You are responsible for maintaining the confidentiality of your account credentials and for all activity under your
          account. You must provide accurate information and keep it current. We may suspend or terminate accounts that violate
          these Terms, abuse the Service, or attempt to defraud users.
        </Section>

        <Section title="4. Acceptable use">
          You agree to use the Service lawfully and respectfully. You will not engage in illegal activity, harassment, hate
          speech, sexual content involving minors, doxxing, threats, or attempts to disrupt the Service.
        </Section>

        <Section title="5. Prohibited conduct">
          <ul className="list-disc ml-6 space-y-1">
            <li>No off-platform payments to circumvent fees, escrow, or platform protections.</li>
            <li>No impersonation, plagiarism, ghost-writing, or AI-generated submissions you cannot license to the client.</li>
            <li>No fake portfolios, screenshots, reviews, ratings, or accounts.</li>
            <li>No scraping, brute force, automated mass applications, or attempts to reverse-engineer the Service.</li>
            <li>No use of the Service for illegal goods, regulated services without licence, or activities prohibited by Stripe's Acceptable Use Policy.</li>
          </ul>
        </Section>

        <Section title="6. AI disclaimer">
          Rivalo Coach and other AI features are provided "as is." Outputs may be inaccurate, biased, or out of date. You remain
          fully responsible for verifying outputs and for your own work product. We explicitly instruct our AI not to write final
          deliverables for competitors or to reveal another user's submission.
        </Section>

        <Section title="7. Intellectual property">
          The {COMPANY.brandName} name, logo, marks, and platform code are owned by {COMPANY.legalName}. We grant you a limited,
          non-exclusive, non-transferable, revocable licence to use the Service for its intended purposes. You retain ownership
          of content you upload, subject to the IP-transfer rule for winning submissions in Section 9.
        </Section>

        <Section title="8. Subscriptions, billing, auto-renewal, cancellation">
          {COMPANY.brandName} offers monthly and annual subscription plans (Basic, Pro, Business). Subscriptions are billed in
          advance through <b>Stripe</b>. Monthly plans renew monthly, annual plans renew annually, unless cancelled before the renewal
          date. You authorise us (through Stripe) to charge your stored payment method on each renewal. You may cancel at any time
          in <i>Account → Subscription</i>; cancellation takes effect at the end of the current paid period. Refunds are governed by
          our <a href="/refund-policy" className="underline">Refund Policy</a>.
        </Section>

        <Section title="9. Project bounties &amp; IP transfer">
          Clients post briefs and fund a bounty in Stripe escrow. Until a winner is crowned, no submission becomes the client's
          property; copyright remains with the seller. Upon the client crowning a winning submission and the bounty being
          released, ownership of the winning deliverable (excluding pre-existing third-party assets clearly identified by the
          seller) transfers to the client. Non-winning submissions remain the property of their creators.
        </Section>

        <Section title="10. Stripe payment processing">
          Payments and payouts are processed by Stripe, Inc. By using the Service you also agree to the <a className="underline" href="https://stripe.com/connect-account/legal" target="_blank" rel="noreferrer">Stripe Connected Account Agreement</a> and the <a className="underline" href="https://stripe.com/legal" target="_blank" rel="noreferrer">Stripe Services Agreement</a>. You authorise {COMPANY.brandName} and Stripe to obtain, verify, and store information about you as required by law and Stripe.
        </Section>

        <Section title="11. Suspension &amp; termination">
          We may suspend or terminate your access for any violation of these Terms, suspected fraud, plagiarism, ratings
          manipulation, abuse, security risk, legal requirement, or non-payment. You may terminate at any time by closing your
          account. Sections relating to IP, payment obligations, disclaimers, indemnification, limitation of liability, and
          dispute resolution survive termination.
        </Section>

        <Section title="12. Warranty disclaimer">
          THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. TO THE FULLEST
          EXTENT PERMITTED BY LAW, {COMPANY.legalName.toUpperCase()} DISCLAIMS ALL WARRANTIES INCLUDING MERCHANTABILITY, FITNESS FOR
          A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND ANY WARRANTY ARISING FROM COURSE OF DEALING OR USAGE OF TRADE.
        </Section>

        <Section title="13. Limitation of liability">
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT WILL {COMPANY.legalName.toUpperCase()} BE LIABLE FOR INDIRECT,
          INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, DATA, OR GOODWILL, EVEN IF
          ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. OUR AGGREGATE LIABILITY FOR ALL CLAIMS RELATING TO THE SERVICE WILL NOT
          EXCEED THE GREATER OF (A) USD $100, OR (B) THE FEES YOU PAID TO {COMPANY.brandName.toUpperCase()} IN THE 6 MONTHS PRECEDING THE
          CLAIM.
        </Section>

        <Section title="14. Indemnification">
          You agree to defend, indemnify, and hold harmless {COMPANY.legalName}, its officers, directors, employees, and agents from
          and against any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising
          from your use of the Service, your content, or your violation of these Terms.
        </Section>

        <Section title="15. Force majeure">
          {COMPANY.brandName} is not liable for any failure or delay caused by events beyond our reasonable control, including but
          not limited to acts of God, natural disasters, war, terrorism, civil unrest, labour disputes, government action, internet
          or telecommunications failure, or third-party service provider outages.
        </Section>

        <Section title="16. Governing law &amp; arbitration">
          These Terms are governed by the laws of {COMPANY.jurisdiction}, without regard to its conflict-of-laws rules. Any
          dispute, claim, or controversy arising out of or relating to these Terms or the Service will be resolved by binding,
          individual arbitration administered by {COMPANY.arbitrationVenue} under its applicable rules. The arbitrator's decision
          is final and may be entered as a judgment in any court of competent jurisdiction. Notwithstanding the foregoing, either
          party may seek injunctive relief in a court of competent jurisdiction to protect intellectual property rights.
        </Section>

        <Section title="17. Class-action waiver">
          You and {COMPANY.brandName} agree that any dispute will be brought in an <b>individual capacity only</b>, and not as a
          plaintiff or class member in any purported class, consolidated, or representative proceeding. The arbitrator may not
          consolidate more than one person's claims and may not preside over any form of representative or class proceeding.
        </Section>

        <Section title="18. Changes">
          We may update these Terms. We will post the new version here with an updated effective date and notify you of material
          changes via in-product banner or email. Continued use of the Service after changes constitutes acceptance.
        </Section>

        <Section title="19. Entire agreement">
          These Terms, together with our Privacy Policy and Refund Policy, constitute the entire agreement between you and
          {COMPANY.brandName} regarding the Service and supersede any prior agreements.
        </Section>

        <Section title="20. Contact">
          Legal: <a className="text-[#3B82F6] hover:underline" href={`mailto:${COMPANY.emails.legal}`}>{COMPANY.emails.legal}</a><br/>
          {COMPANY.legalName} · {COMPANY.businessAddress}
        </Section>

        <div className="text-xs text-muted pt-6 border-t border-white/5">
          This document is provided for the {COMPANY.brandName} platform and is intended to comply with US law, FTC guidelines,
          and SaaS industry standards. It is not legal advice. Have a qualified attorney review and tailor these Terms to your
          jurisdiction and business model before commercial launch.
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (<section><h2 className="font-display text-2xl mb-3">{title}</h2><div>{children}</div></section>);
}
