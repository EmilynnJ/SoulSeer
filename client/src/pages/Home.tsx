import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Star, MessageCircle, Phone, Video, ChevronRight, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import type { ReaderProfile, User } from "@shared/schema";
import heroImage from "@assets/hero.jpg";

type ReaderWithUser = ReaderProfile & { user: User };

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");

  const { data: onlineReaders = [] } = useQuery<ReaderWithUser[]>({
    queryKey: ["/api/readers/online"],
  });

  const handleNewsletter = async () => {
    if (!email) return;
    try {
      await apiRequest("POST", "/api/newsletter", { email });
      toast({ title: "Subscribed", description: "Welcome to the SoulSeer newsletter." });
      setEmail("");
    } catch {
      toast({ title: "Error", description: "Could not subscribe.", variant: "destructive" });
    }
  };

  return (
    <div>
      <section className="py-16 sm:py-24 text-center" data-testid="section-hero">
        <h1 className="font-alex text-soulseer-pink text-6xl sm:text-8xl mb-8 animate-float" data-testid="text-main-header">
          SoulSeer
        </h1>

        <div className="flex justify-center mb-8">
          <div className="w-40 h-40 sm:w-52 sm:h-52 rounded-full overflow-hidden border-2 border-soulseer-gold/40 glow-pink">
            <img
              src={heroImage}
              alt="SoulSeer"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <p className="font-playfair text-xl sm:text-2xl text-white/90 mb-4" data-testid="text-tagline">
          A Community of Gifted Psychics
        </p>
        <p className="font-playfair text-white/50 max-w-xl mx-auto mb-10 text-sm sm:text-base px-4">
          Connect with our gifted readers for ethical, compassionate, and judgment-free spiritual guidance through chat, phone, or video.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center px-4">
          <Link href="/readers">
            <Button size="lg" className="bg-pink-500 hover:bg-pink-600 text-white glow-pink font-playfair" data-testid="button-get-reading">
              <Sparkles className="w-4 h-4 mr-2" /> Get a Reading Now
            </Button>
          </Link>
          <Link href="/about">
            <Button size="lg" variant="outline" className="border-soulseer-gold text-soulseer-gold hover:bg-yellow-500/10 font-playfair" data-testid="button-learn-more">
              Learn More
            </Button>
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16" data-testid="section-online-readers">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-alex text-soulseer-pink text-3xl">Readers Online Now</h2>
            <p className="text-sm text-white/50 mt-1 font-playfair">Connect instantly with available readers</p>
          </div>
          <Link href="/readers">
            <span className="text-soulseer-pink text-sm flex items-center gap-1 cursor-pointer hover:underline font-playfair" data-testid="link-view-all-readers">
              View All <ChevronRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {onlineReaders.map(reader => (
            <Link key={reader.id} href={isAuthenticated ? `/readers/${reader.id}` : "/login"}>
              <Card className="p-4 border-border/50 hover:border-soulseer-pink/30 transition-all cursor-pointer group" style={{ backgroundColor: '#13111A' }} data-testid={`card-reader-${reader.id}`}>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center text-soulseer-pink font-semibold text-lg shrink-0 font-playfair">
                    {reader.user.displayName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm truncate text-white font-playfair">{reader.user.displayName}</h3>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${reader.status === "online" ? "bg-green-400" : "bg-yellow-400"}`} />
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="w-3 h-3 text-soulseer-gold fill-soulseer-gold" />
                      <span className="text-xs text-soulseer-gold font-playfair">{reader.rating}</span>
                      <span className="text-xs text-white/40 font-playfair">({reader.totalReadings} readings)</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {reader.specialties?.slice(0, 3).map(s => (
                        <Badge key={s} variant="secondary" className="text-[10px] px-1.5 py-0 font-playfair">{s}</Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 mt-3 text-xs text-white/40 font-playfair">
                      <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />${reader.chatRate}/min</span>
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" />${reader.phoneRate}/min</span>
                      <span className="flex items-center gap-1"><Video className="w-3 h-3" />${reader.videoRate}/min</span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
          {onlineReaders.length === 0 && (
            <p className="text-white/40 text-sm col-span-full text-center py-8 font-playfair">No readers online right now. Check back soon.</p>
          )}
        </div>
      </section>

      <section className="max-w-xl mx-auto px-4 sm:px-6 py-12 text-center" data-testid="section-newsletter">
        <h2 className="font-alex text-soulseer-pink text-2xl mb-2">Stay Connected</h2>
        <p className="text-sm text-white/50 mb-4 font-playfair">Get spiritual insights and updates delivered to your inbox</p>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="border-border/50 font-playfair"
            style={{ backgroundColor: '#13111A' }}
            data-testid="input-newsletter-email"
          />
          <Button onClick={handleNewsletter} className="bg-pink-500 hover:bg-pink-600 text-white shrink-0 font-playfair" data-testid="button-newsletter-subscribe">
            Subscribe
          </Button>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12" data-testid="section-community">
        <h2 className="font-alex text-soulseer-pink text-2xl text-center mb-8">Join Our Spiritual Community</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/community">
            <Card className="p-6 text-center border-border/50 hover:border-soulseer-pink/30 transition-all cursor-pointer" style={{ backgroundColor: '#13111A' }} data-testid="card-forum-link">
              <Users className="w-8 h-8 mx-auto text-soulseer-pink mb-3" />
              <h3 className="font-semibold text-sm text-white font-playfair">Community Forum</h3>
              <p className="text-xs text-white/40 mt-1 font-playfair">Discuss, share, and grow</p>
            </Card>
          </Link>
          <a href="https://discord.gg/soulseer" target="_blank" rel="noopener noreferrer">
            <Card className="p-6 text-center border-border/50 hover:border-purple-400/30 transition-all cursor-pointer" style={{ backgroundColor: '#13111A' }} data-testid="card-discord-link">
              <div className="w-8 h-8 mx-auto mb-3 text-purple-400 flex items-center justify-center font-bold text-xl font-playfair">D</div>
              <h3 className="font-semibold text-sm text-white font-playfair">Discord Server</h3>
              <p className="text-xs text-white/40 mt-1 font-playfair">Real-time chat community</p>
            </Card>
          </a>
          <a href="https://facebook.com/groups/soulseer" target="_blank" rel="noopener noreferrer">
            <Card className="p-6 text-center border-border/50 hover:border-blue-400/30 transition-all cursor-pointer" style={{ backgroundColor: '#13111A' }} data-testid="card-facebook-link">
              <div className="w-8 h-8 mx-auto mb-3 text-blue-400 flex items-center justify-center font-bold text-xl font-playfair">f</div>
              <h3 className="font-semibold text-sm text-white font-playfair">Facebook Group</h3>
              <p className="text-xs text-white/40 mt-1 font-playfair">Connect and share</p>
            </Card>
          </a>
        </div>
      </section>
    </div>
  );
}
