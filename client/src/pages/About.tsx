import { Heart, Shield, Users, Star, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import heroImage from "@assets/hero.jpg";
import founderImage from "@assets/founder.jpg";

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="text-center mb-12">
        <h1 className="font-alex text-soulseer-pink text-5xl mb-4" data-testid="text-about-title">About SoulSeer</h1>
        <p className="text-white/50 max-w-2xl mx-auto font-playfair">
          A Community of Gifted Psychics united by our life's calling: to guide, heal, and empower those who seek clarity on their journey.
        </p>
      </div>

      <div className="relative rounded-xl overflow-hidden mb-12">
        <img src={heroImage} alt="SoulSeer" className="w-full h-64 sm:h-80 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] via-transparent to-transparent" />
      </div>

      <Card className="p-6 sm:p-8 border-border/50 mb-8" style={{ backgroundColor: '#13111A' }} data-testid="card-mission">
        <h2 className="font-alex text-soulseer-pink text-2xl mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5" /> Our Mission
        </h2>
        <p className="text-white/60 text-sm leading-relaxed font-playfair">
          At SoulSeer, we are dedicated to providing ethical, compassionate, and judgment-free spiritual guidance. Our mission is twofold: to offer clients genuine, heart-centered readings and to uphold fair, ethical standards for our readers.
        </p>
        <p className="text-white/60 text-sm leading-relaxed mt-3 font-playfair">
          Founded by psychic medium Emilynn, SoulSeer was created as a response to the corporate greed that dominates many psychic platforms. Unlike other apps, our readers keep the majority of what they earn and play an active role in shaping the platform.
        </p>
        <p className="text-white/60 text-sm leading-relaxed mt-3 font-playfair">
          SoulSeer is more than just an app — it's a soul tribe. A community of gifted psychics united by our life's calling: to guide, heal, and empower those who seek clarity on their journey.
        </p>
      </Card>

      <Card className="p-6 sm:p-8 border-border/50 mb-8" style={{ backgroundColor: '#13111A' }} data-testid="card-founder">
        <div className="flex flex-col sm:flex-row gap-6 items-center">
          <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-soulseer-pink/30 shrink-0">
            <img src={founderImage} alt="Emilynn - Founder" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="font-alex text-soulseer-pink text-2xl mb-1">Meet Emilynn</h2>
            <p className="text-xs text-soulseer-gold mb-2 font-playfair">Founder & Psychic Medium</p>
            <p className="text-white/60 text-sm leading-relaxed font-playfair">
              As a psychic medium, Emilynn understands both sides of the spiritual reading experience. Her vision for SoulSeer stems from a deep desire to create a platform where readers are valued, clients are protected, and the sacred art of spiritual guidance is honored and respected.
            </p>
          </div>
        </div>
      </Card>

      <h2 className="font-alex text-soulseer-pink text-2xl text-center mb-6">Our Values</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        <Card className="p-5 border-border/50" style={{ backgroundColor: '#13111A' }}>
          <Heart className="w-6 h-6 text-soulseer-pink mb-3" />
          <h3 className="font-semibold text-sm mb-1 text-white font-playfair">Compassion First</h3>
          <p className="text-xs text-white/50 font-playfair">Every reading is delivered with empathy, care, and genuine concern for the client's well-being.</p>
        </Card>
        <Card className="p-5 border-border/50" style={{ backgroundColor: '#13111A' }}>
          <Shield className="w-6 h-6 text-soulseer-gold mb-3" />
          <h3 className="font-semibold text-sm mb-1 text-white font-playfair">Ethical Standards</h3>
          <p className="text-xs text-white/50 font-playfair">We uphold the highest ethical standards in the industry, protecting both readers and clients.</p>
        </Card>
        <Card className="p-5 border-border/50" style={{ backgroundColor: '#13111A' }}>
          <Users className="w-6 h-6 text-purple-400 mb-3" />
          <h3 className="font-semibold text-sm mb-1 text-white font-playfair">Community Driven</h3>
          <p className="text-xs text-white/50 font-playfair">Our readers shape the platform. We believe in collaboration, not corporate control.</p>
        </Card>
        <Card className="p-5 border-border/50" style={{ backgroundColor: '#13111A' }}>
          <Star className="w-6 h-6 text-green-400 mb-3" />
          <h3 className="font-semibold text-sm mb-1 text-white font-playfair">Fair Compensation</h3>
          <p className="text-xs text-white/50 font-playfair">Readers keep 70% of their earnings. We believe gifted people deserve fair pay for their gifts.</p>
        </Card>
      </div>
    </div>
  );
}
