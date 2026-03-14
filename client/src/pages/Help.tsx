import { useState } from "react";
import { Search, ChevronDown, ChevronUp, MessageCircle, Mail, HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const faqs = [
  { category: "Getting Started", items: [
    { q: "How do I create an account?", a: "Click 'Sign In' and create your account using email or social login (Google or Apple). Once registered, you can browse readers and add funds to start your first reading." },
    { q: "How do I add funds to my account?", a: "Go to your Dashboard and click 'Add Funds'. Choose a preset amount or enter a custom amount. Payments are processed securely through Stripe." },
    { q: "Is my payment information secure?", a: "Absolutely. We use Stripe for all payment processing, which is PCI Level 1 compliant — the highest level of security certification." },
  ]},
  { category: "Readings", items: [
    { q: "How do pay-per-minute readings work?", a: "Add funds to your balance, then choose an online reader. Select chat, phone, or video. You're charged per minute at the reader's rate. Your balance decreases in real-time during the session." },
    { q: "What types of readings are available?", a: "We offer three types: Chat (text-based), Phone (voice-only), and Video (face-to-face). Each reader sets their own per-minute rate for each type." },
    { q: "What happens if I lose connection?", a: "We have disconnection protection with a grace period for reconnection. If the session drops, you won't be charged for the disconnected time." },
    { q: "Can I get a refund?", a: "If you experience technical issues or are unsatisfied with your reading, contact our support team. We review each case individually and offer refunds when appropriate." },
  ]},
  { category: "For Readers", items: [
    { q: "How do I become a reader?", a: "Reader accounts are created by our admin team to ensure quality. Contact us through the Help Center to express your interest and we'll review your application." },
    { q: "What percentage do readers earn?", a: "Readers keep 70% of their earnings. We believe our gifted readers deserve fair compensation for their services." },
    { q: "When do I get paid?", a: "Payouts are processed automatically when your pending balance exceeds $15. Funds are sent directly to your linked bank account via Stripe Connect." },
  ]},
  { category: "Community", items: [
    { q: "How do I join the forum?", a: "Simply sign in and visit the Community page. You can browse topics, create posts, and reply to discussions." },
    { q: "How do I join Discord or Facebook?", a: "Click the Discord or Facebook links on the Home page or Community page. You'll be redirected to our community groups." },
  ]},
];

export default function Help() {
  const [search, setSearch] = useState("");
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (key: string) => {
    const next = new Set(openItems);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setOpenItems(next);
  };

  const filtered = faqs.map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      !search || item.q.toLowerCase().includes(search.toLowerCase()) || item.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(cat => cat.items.length > 0);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="text-center mb-8">
        <h1 className="font-alex text-soulseer-pink text-4xl mb-2" data-testid="text-help-title">Help Center</h1>
        <p className="text-white/50 text-sm font-playfair">Find answers to common questions or contact our support team</p>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <Input
          placeholder="Search FAQs..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 border-border/50 font-playfair"
          style={{ backgroundColor: '#13111A' }}
          data-testid="input-search-faq"
        />
      </div>

      <div className="space-y-6">
        {filtered.map(cat => (
          <div key={cat.category}>
            <h2 className="font-alex text-soulseer-gold text-xl mb-3">{cat.category}</h2>
            <div className="space-y-2">
              {cat.items.map(item => {
                const key = `${cat.category}-${item.q}`;
                const isOpen = openItems.has(key);
                return (
                  <Card key={key} className="border-border/50 overflow-hidden" style={{ backgroundColor: '#13111A' }}>
                    <button
                      onClick={() => toggleItem(key)}
                      className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
                      data-testid={`button-faq-${key.replace(/\s+/g, "-").toLowerCase()}`}
                    >
                      <span className="text-sm font-medium pr-4 text-white font-playfair">{item.q}</span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-white/40 shrink-0" /> : <ChevronDown className="w-4 h-4 text-white/40 shrink-0" />}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-3 text-sm text-white/50 border-t border-border/30 pt-2 font-playfair">
                        {item.a}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Card className="mt-10 p-6 border-border/50 text-center" style={{ backgroundColor: '#13111A' }} data-testid="card-contact-support">
        <HelpCircle className="w-8 h-8 mx-auto text-soulseer-pink mb-3" />
        <h3 className="font-semibold mb-1 text-white font-playfair">Still need help?</h3>
        <p className="text-sm text-white/50 mb-4 font-playfair">Our support team is here for you</p>
        <div className="flex justify-center gap-3">
          <a href="mailto:support@soulseer.app">
            <Card className="p-3 bg-pink-500/10 border-pink-500/20 hover:bg-pink-500/20 transition-colors cursor-pointer">
              <Mail className="w-5 h-5 text-pink-400 mx-auto mb-1" />
              <span className="text-xs text-white font-playfair">Email Us</span>
            </Card>
          </a>
          <Card className="p-3 bg-purple-500/10 border-purple-500/20 cursor-pointer">
            <MessageCircle className="w-5 h-5 text-purple-400 mx-auto mb-1" />
            <span className="text-xs text-white font-playfair">Live Chat</span>
          </Card>
        </div>
      </Card>
    </div>
  );
}
