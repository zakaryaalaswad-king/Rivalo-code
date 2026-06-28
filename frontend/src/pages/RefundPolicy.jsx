import COMPANY from "../config/company";
import { RefreshCw } from "lucide-react";

export default function RefundPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-6 md:px-10 py-16">
      <div className="flex items-center gap-3"><RefreshCw className="text-[#22C55E]" size={28} /><h1 className="font-display text-4xl">Refund Policy</h1></div>
      <div className="text-muted text-sm mt-3">Last updated: {COMPANY.lastUpdated}</div>

      <div className="mt-10 space-y-8 text-slate-300 leading-relaxed text-[15px]">
        <Section title="1. Overview">
          {COMPANY.legalName} (“{COMPANY.brandName}”) provides a SaaS marketplace for competitive freelance work. This Refund Policy
          explains when subscriptions and platform charges may be refunded. By using the Service you agree to this Policy and to our
          Terms of Service.
        </Section>

        <Section title="2. Subscription plans">
          We offer monthly and annual subscription plans (Basic, Pro, Business). Subscriptions are billed in advance and renew
          automatically unless cancelled. You can cancel at any time inside your <i>Account → Subscription</i> screen. Cancellation
          stops the next renewal — your paid period remains active until its end date.
        </Section>

        <Section title="3. Refund eligibility">
          <ul className="list-disc ml-6 space-y-1">
            <li><b>Monthly plans:</b> refundable within 7 days of the first paid month if you have not used Pro/Business-gated features (Verified badge, unlimited applications, team seats, AI winner recommendation).</li>
            <li><b>Annual plans:</b> refundable within 14 days of the initial purchase, prorated to remove any usage. After 14 days, annual plans are non-refundable for the remainder of the term.</li>
            <li><b>Failed payments:</b> if your account was charged but the subscription failed to activate, we refund within 5 business days.</li>
            <li><b>Duplicate charges:</b> always refunded in full.</li>
            <li><b>Billing errors:</b> always refunded after we verify the error.</li>
          </ul>
        </Section>

        <Section title="4. Non-refundable cases">
          <ul className="list-disc ml-6 space-y-1">
            <li>Project bounties that have already been released to a winner.</li>
            <li>Fees consumed by external services (Stripe processing fees, Wise / Payoneer payout fees).</li>
            <li>Accounts terminated for fraud, plagiarism, abuse, or violations of our Terms of Service.</li>
            <li>Renewal charges where the user failed to cancel before the renewal date and used the Service after renewal.</li>
            <li>Partial-month refunds for monthly plans cancelled after the 7-day window.</li>
          </ul>
        </Section>

        <Section title="5. Project bounty refunds">
          Bounties posted on a brief are held in Stripe escrow. If the client fails to crown a winner within 30 days of the
          competition's deadline, the bounty is automatically refunded to the client (less applicable processing fees), at our
          sole discretion. If approved competitors completed and submitted valid work, {COMPANY.brandName} may, on a case-by-case
          basis, redistribute the bounty proportionally among them rather than refund the client.
        </Section>

        <Section title="6. How to request a refund">
          Email <a className="text-[#3B82F6] hover:underline" href={`mailto:${COMPANY.emails.refunds}`}>{COMPANY.emails.refunds}</a> from
          the address on your {COMPANY.brandName} account, with: your user ID, the Stripe receipt or session ID, and a short
          explanation. We respond within {COMPANY.responseTimeSLA}.
        </Section>

        <Section title="7. Refund processing">
          Approved refunds are issued through Stripe to the original payment method. Funds typically appear within 5–10 business
          days depending on your card issuer or bank. {COMPANY.brandName} cannot refund to a different card, account, or wallet
          than the original payment instrument.
        </Section>

        <Section title="8. Chargebacks">
          Please contact us before initiating a chargeback — we can almost always resolve issues directly and faster. Initiating a
          chargeback for a charge that is consistent with this Refund Policy and our Terms of Service may result in account
          suspension and recovery of disputed amounts plus chargeback fees.
        </Section>

        <Section title="9. Fraud prevention">
          We reserve the right to refuse refunds where the request appears fraudulent, abusive, or part of a pattern of
          chargeback abuse. We may require identity verification before processing certain refunds.
        </Section>

        <Section title="10. Contact">
          Refund questions: <a className="text-[#3B82F6] hover:underline" href={`mailto:${COMPANY.emails.refunds}`}>{COMPANY.emails.refunds}</a><br/>
          Billing & legal: <a className="text-[#3B82F6] hover:underline" href={`mailto:${COMPANY.emails.legal}`}>{COMPANY.emails.legal}</a>
        </Section>

        <div className="text-xs text-muted pt-6 border-t border-white/5">
          This Refund Policy is provided for {COMPANY.brandName} customers and operates alongside our <a href="/terms" className="underline">Terms of Service</a> and <a href="/privacy" className="underline">Privacy Policy</a>. Specific consumer-protection laws in your jurisdiction (e.g. EU/UK statutory rights) may grant additional rights that this Policy does not limit.
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (<section><h2 className="font-display text-2xl mb-3">{title}</h2><div>{children}</div></section>);
}
