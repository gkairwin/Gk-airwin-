import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Plane } from "@/components/aviator/Plane";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms and Conditions — GK Airwin Aviator" },
      {
        name: "description",
        content:
          "The rules for playing GK Airwin Aviator: accounts, deposits, minimum bet, withdrawals and fair play.",
      },
      { property: "og:title", content: "Terms and Conditions — GK Airwin Aviator" },
      {
        property: "og:description",
        content: "How GK Airwin Aviator accounts, deposits, bets and withdrawals work.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TermsPage,
});

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1. Who may play",
    body: [
      "GK Airwin Aviator is for adults aged 18 and over. By registering you confirm you are old enough to play where you live.",
      "One account per phone number. Creating extra accounts to claim an advantage is not allowed.",
    ],
  },
  {
    title: "2. Your account",
    body: [
      "You register with your phone number and a password of 4 to 6 characters. Keep your password private — anything done from your account is treated as done by you.",
      "Tell us quickly through the in-app chat if you believe someone else used your account.",
    ],
  },
  {
    title: "3. Deposits",
    body: [
      "Kenyan players deposit with M-Pesa and the money reaches the balance once the payment is confirmed.",
      "Players outside Kenya choose crypto (paid through our payment provider) or a bank transfer to I&M Bank of Kenya, account 05506274696150. Bank deposits are added after the admin confirms the payment code you sent.",
      "Only payments that actually arrive are credited. Deposits are never a promise of a win.",
    ],
  },
  {
    title: "4. Betting",
    body: [
      "The minimum bet is 100 KES.",
      "A bet tapped while a round is already flying is held for the next round instead of being refused.",
      "You win by cashing out before the plane flies away. Once it flies away, bets still open on that round lose.",
    ],
  },
  {
    title: "5. Withdrawals",
    body: [
      "The minimum withdrawal is 15,000 KES and a withdrawal fee of 1,000 KES applies.",
      "Withdrawal payments are sent manually by the admin after your request. Give us a working number or wallet so the payment can reach you.",
    ],
  },
  {
    title: "6. Balances and money display",
    body: [
      "Balances are held in Kenyan shillings. Outside Kenya the amounts you see are converted into your local currency using current exchange rates, so the figure shown may move slightly with the rate.",
    ],
  },
  {
    title: "7. Fair play and suspensions",
    body: [
      "Bots, automation, tampering with the game or the payment steps, and any attempt to take another player's funds end the account. A suspended account cannot bet, cash out or withdraw.",
      "We may also close an account that is used to receive payments that do not belong to it.",
    ],
  },
  {
    title: "8. Help",
    body: [
      "Use the chat inside the game to reach the admin. Keep your payment references — they are how a deposit or withdrawal is traced.",
    ],
  },
  {
    title: "9. Changes",
    body: [
      "These rules can be updated as the game grows. The version in force is the one published on this page when you play.",
    ],
  },
];

function TermsPage() {
  const navigate = useNavigate();
  return (
    <main className="min-h-screen bg-air-page px-5 py-8 text-air-text">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="mb-1 flex items-center gap-1 text-[28px] font-extrabold italic tracking-tight text-air-brand">
          GK Airwin
          <Plane className="mb-1 h-4 w-8" />
        </h1>
        <p className="mb-6 text-[12px] uppercase tracking-[0.18em] text-air-text/40">
          Terms and Conditions · One World. One Game.
        </p>

        <div className="space-y-4">
          {SECTIONS.map((section) => (
            <section key={section.title} className="rounded-2xl bg-air-surface p-5 ring-1 ring-air-line">
              <h2 className="mb-2 text-[15px] font-bold text-air-text">{section.title}</h2>
              {section.body.map((line) => (
                <p key={line} className="mb-2 text-[13px] leading-relaxed text-air-muted last:mb-0">
                  {line}
                </p>
              ))}
            </section>
          ))}
        </div>

        <p className="mt-6 text-center text-[11px] text-air-text/40">
          Playing means you accept these rules. Please play responsibly.
        </p>

        <Button
          variant="ghost"
          type="button"
          onClick={() => void navigate({ to: "/auth" })}
          className="mt-4 w-full rounded-lg bg-air-field py-3 h-auto whitespace-normal text-[13px] font-bold text-air-text/70 ring-1 ring-air-line"
        >
          Back to sign in
        </Button>
      </div>
    </main>
  );
}
