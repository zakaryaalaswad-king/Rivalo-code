import { Shield } from "lucide-react";

export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto px-6 md:px-10 py-16">
      <div className="flex items-center gap-3"><Shield className="text-[#3B82F6]" size={28} /><h1 className="font-display text-4xl">Privacy Policy</h1></div>
      <div className="text-muted text-sm mt-3">Last updated: February 2026</div>

      <div className="mt-10 space-y-8 text-slate-300 leading-relaxed text-[15px]">
        <Section title="1. Who we are">
          Rivalo (“we”, “us”, “our”) operates a competitive freelance marketplace. This Privacy Policy explains how we
          collect, use, store, and share your personal information when you use our website and services.
        </Section>

        <Section title="2. Information we collect">
          <ul className="list-disc ml-6 space-y-1">
            <li><b>Account data</b> — name, email, password (hashed), date of registration.</li>
            <li><b>Profile data</b> — avatar, bio, skills, age, phone number, location, languages, hourly rate, CV, social media URLs, former projects.</li>
            <li><b>Payout data</b> — PayPal email, last 4 digits of card, bank account / IBAN, Wise email, or crypto wallet you choose to store.</li>
            <li><b>Project & messaging data</b> — briefs you post, applications, submissions, notifications, AI Coach chat history.</li>
            <li><b>Payment data</b> — handled by Stripe. We never see or store your full card number.</li>
            <li><b>Technical data</b> — IP address, browser, device, log timestamps, cookies for authentication.</li>
          </ul>
        </Section>

        <Section title="3. How we use your information">
          We use your information to: provide and maintain the service, verify your identity, deliver transactional emails (e.g.
          OTP verification, approval notifications), process payments and payouts, calculate trust points, surface relevant
          briefs and talent, prevent fraud and abuse, comply with legal obligations, and improve the platform.
        </Section>

        <Section title="4. Lawful bases (EU/UK users)">
          We process personal data on the bases of: <i>performance of a contract</i> (delivering the service you signed up for),
          <i> legitimate interests</i> (security, fraud prevention, product improvement), <i>consent</i> (marketing emails, where required),
          and <i>legal obligation</i> (tax, anti-money-laundering, court orders).
        </Section>

        <Section title="5. Sharing of information">
          We share data with: Stripe (payments), Resend (transactional email), our cloud / object-storage providers, AI providers
          powering the AI Coach (the content of your chats is processed by them under their privacy terms), and authorities
          when legally required. We do <b>not</b> sell your personal data.
        </Section>

        <Section title="6. International transfers">
          Your data may be processed in countries other than your own. Where required, we rely on Standard Contractual Clauses
          or equivalent safeguards.
        </Section>

        <Section title="7. Retention">
          Account, project, and payout data are retained for as long as your account is active and for a reasonable period
          afterwards to satisfy legal, tax, accounting, or dispute-resolution obligations.
        </Section>

        <Section title="8. Your rights">
          Depending on where you live you may have the right to: access, rectify, delete, restrict, or object to the processing
          of your personal data; data portability; and to withdraw consent. To exercise these rights, email
          <a className="text-[#3B82F6] hover:underline ml-1" href="mailto:privacy@rivalo.example">privacy@rivalo.example</a>.
        </Section>

        <Section title="9. Security">
          We use industry-standard measures: HTTPS, hashed passwords (bcrypt), encrypted-at-rest storage, JWT auth, scoped
          access tokens for files, and audit logs. No system is 100% secure — please use a strong unique password and enable
          email verification.
        </Section>

        <Section title="10. Children">
          Rivalo is not directed at people under 16. If we learn we've collected data from a child under 16, we will delete it.
        </Section>

        <Section title="11. Changes">
          We may update this policy. We'll post the new version here with an updated “last updated” date. Material changes will
          also be announced in-app.
        </Section>

        <Section title="12. Contact">
          Questions? <a className="text-[#3B82F6] hover:underline" href="mailto:privacy@rivalo.example">privacy@rivalo.example</a>.
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
