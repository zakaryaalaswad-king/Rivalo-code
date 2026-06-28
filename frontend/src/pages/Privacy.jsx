import COMPANY from "../config/company";
import { Shield } from "lucide-react";

export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto px-6 md:px-10 py-16">
      <div className="flex items-center gap-3"><Shield className="text-[#3B82F6]" size={28} /><h1 className="font-display text-4xl">Privacy Policy</h1></div>
      <div className="text-muted text-sm mt-3">Last updated: {COMPANY.lastUpdated} · Effective for users worldwide</div>

      <div className="mt-10 space-y-7 text-slate-300 leading-relaxed text-[15px]">
        <Section title="1. Who we are">
          {COMPANY.legalName} (“{COMPANY.brandName}”, “we”, “us”, “our”) operates the {COMPANY.brandName} platform at {COMPANY.websiteUrl}.
          We are organised in {COMPANY.state}, {COMPANY.country}. This Privacy Policy describes how we collect, use, store, share,
          and protect your personal information. It applies to all visitors, registered users, freelancers, and clients.
        </Section>

        <Section title="2. Information we collect">
          <ul className="list-disc ml-6 space-y-1">
            <li><b>Account information</b> — name, email, hashed password, registration date.</li>
            <li><b>Profile information</b> — avatar, bio, headline, age, phone number, location, languages, hourly rate, skills, CV, social media URLs, former projects.</li>
            <li><b>Payout information</b> — PayPal email, last four digits of card, bank account / IBAN, Wise email, Payoneer email, Cash App handle, crypto wallet you choose to store.</li>
            <li><b>Payment information</b> — processed securely by <b>Stripe</b>. We never see or store your full card number, CVV, or banking credentials. We receive only tokenised identifiers and transaction metadata.</li>
            <li><b>Project &amp; messaging data</b> — briefs, applications, submissions, notifications, AI Coach chat history.</li>
            <li><b>AI-generated content</b> — recommendations, vetting tasks, winner reasoning, coaching responses generated about or for you.</li>
            <li><b>Technical &amp; device data</b> — IP address, browser type, operating system, device identifiers, log timestamps, referrer URLs.</li>
            <li><b>Cookies &amp; similar technologies</b> — authentication cookie (httpOnly), preference cookies, and limited analytics cookies. You can manage cookies in your browser.</li>
            <li><b>Analytics</b> — aggregated, de-identified usage events to improve the product.</li>
            <li><b>User-generated content</b> — anything you post, upload, or send through the Service.</li>
          </ul>
        </Section>

        <Section title="3. How we use your information">
          We use your information to: (a) provide, maintain, and improve the Service; (b) authenticate you and secure your account;
          (c) deliver transactional emails (OTP verification, approval / rejection / winner / payout notifications); (d) process
          subscription billing and project bounty escrow through Stripe; (e) calculate trust points, search ranking, and AI
          recommendations; (f) detect fraud, abuse, plagiarism, account takeover, and platform manipulation; (g) comply with legal,
          tax, accounting, and law-enforcement obligations; (h) communicate product updates you have opted into.
        </Section>

        <Section title="4. Legal bases (EU/UK · GDPR)">
          We process personal data under: <i>performance of a contract</i> (delivering the Service to you), <i>legitimate interests</i>
          (security, fraud prevention, product improvement, marketing where allowed), <i>consent</i> (optional marketing emails, where
          required by law), and <i>legal obligation</i> (tax, anti-money-laundering, court orders).
        </Section>

        <Section title="5. Sharing of information">
          We share data with: <b>Stripe</b> (payments &amp; payouts, including KYC where applicable); <b>Resend</b> (transactional email
          delivery); our cloud / object-storage providers; AI providers powering Rivalo Coach (chat content is processed under
          their privacy terms); and authorities when legally required. We do <b>not</b> sell your personal data and we do not use
          your private data to train third-party large language models without consent.
        </Section>

        <Section title="6. International data transfers">
          {COMPANY.brandName} operates from {COMPANY.country}. Where we transfer personal data outside your country (including to
          processors in the US, EU, UK), we rely on Standard Contractual Clauses, the UK IDTA, adequacy decisions, or equivalent
          safeguards.
        </Section>

        <Section title="7. Retention">
          Account, project, and payout data are retained for as long as your account is active and for a reasonable period after
          closure to satisfy legal, tax, and dispute-resolution obligations (typically up to 7 years). AI Coach chats are retained
          for up to 12 months for safety review and product quality; you may request deletion sooner under Section 9.
        </Section>

        <Section title="8. Data security">
          We use industry-standard measures: HTTPS everywhere, bcrypt password hashing, encrypted-at-rest storage, JWT auth with
          httpOnly cookies, signed file access tokens, audit logs, and least-privilege access controls. No system is 100% secure;
          please use a strong unique password, enable email verification, and notify us at <a className="text-[#3B82F6] hover:underline" href={`mailto:${COMPANY.emails.abuse}`}>{COMPANY.emails.abuse}</a> if you suspect a breach.
        </Section>

        <Section title="9. Your rights">
          Depending on where you live, you may have the right to: access, rectify, delete, restrict or object to the processing of
          your personal data; data portability; and to withdraw consent. To exercise these rights, email <a className="text-[#3B82F6] hover:underline" href={`mailto:${COMPANY.emails.privacy}`}>{COMPANY.emails.privacy}</a>.
          We will respond within statutory timelines and may require identity verification.
        </Section>

        <Section title="10. California residents — CCPA / CPRA notice">
          California residents have specific rights, including: (a) the right to <b>know</b> the categories and specific pieces of
          personal information we collect, share, and disclose; (b) the right to <b>delete</b> personal information; (c) the right to
          <b> correct</b> inaccurate personal information; (d) the right to <b>opt-out of sale or sharing</b> of personal information for
          cross-context behavioural advertising (we do not sell or share personal information in this sense); (e) the right to
          <b> limit use of sensitive personal information</b>; and (f) the right to non-discrimination for exercising your privacy rights.
          To exercise CCPA/CPRA rights, email <a className="text-[#3B82F6] hover:underline" href={`mailto:${COMPANY.emails.privacy}`}>{COMPANY.emails.privacy}</a> or contact our Privacy Officer at the address below.
        </Section>

        <Section title="11. Children's privacy (COPPA)">
          {COMPANY.brandName} is not directed at children under 16, and we do not knowingly collect personal information from
          children under 13. If we learn we have collected information from a child under 13, we will delete it promptly. Parents
          or guardians can contact <a className="text-[#3B82F6] hover:underline" href={`mailto:${COMPANY.emails.privacy}`}>{COMPANY.emails.privacy}</a>.
        </Section>

        <Section title="12. AI features">
          Rivalo Coach and other AI features may process the content you share with them. We instruct our AI providers not to use
          this content to train their public models. AI outputs may be inaccurate; please verify outputs and never use them to
          replace your own judgement for legal, financial, medical, or safety decisions.
        </Section>

        <Section title="13. Do Not Track">
          We respect Global Privacy Control (GPC) signals where supported. Browser-level DNT signals are inconsistently
          implemented and we do not currently rely on them as a binding preference.
        </Section>

        <Section title="14. Changes to this policy">
          We may update this Policy. We will post the new version here with an updated effective date and announce material
          changes in-product or by email.
        </Section>

        <Section title="15. Contact us">
          <div>{COMPANY.privacyOfficer}<br/>{COMPANY.legalName}<br/>{COMPANY.businessAddress}</div>
          <div className="mt-2">Privacy: <a className="text-[#3B82F6] hover:underline" href={`mailto:${COMPANY.emails.privacy}`}>{COMPANY.emails.privacy}</a> · DPO: <a className="text-[#3B82F6] hover:underline" href={`mailto:${COMPANY.dataProtectionContact}`}>{COMPANY.dataProtectionContact}</a></div>
        </Section>

        <div className="text-xs text-muted pt-6 border-t border-white/5">
          This document is provided in good faith for the {COMPANY.brandName} platform. It is intended to comply with US federal
          law, FTC guidelines, the CCPA, the CPRA, and the GDPR. It is not legal advice. Before commercial launch you should have
          your final version reviewed by qualified counsel licensed in your jurisdiction.
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (<section><h2 className="font-display text-2xl mb-3">{title}</h2><div>{children}</div></section>);
}
