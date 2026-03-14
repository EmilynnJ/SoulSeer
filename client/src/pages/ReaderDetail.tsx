import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Star, MessageCircle, Phone, Video, ArrowLeft, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ReaderProfile, User, Review } from "@shared/schema";

type ReaderDetailData = ReaderProfile & { user: User; reviews: Review[] };

export default function ReaderDetail() {
  const params = useParams<{ id: string }>();
  const { user: currentUser, login } = useAuth();
  const { toast } = useToast();
  const [startingSession, setStartingSession] = useState(false);

  const { data: reader, isLoading } = useQuery<ReaderDetailData>({
    queryKey: ["/api/readers", params.id],
  });

  const startReading = async (type: "chat" | "phone" | "video") => {
    if (!currentUser) {
      login();
      return;
    }
    if (currentUser.role !== "client") {
      toast({ title: "Client account required", description: "Only clients can start readings.", variant: "destructive" });
      return;
    }
    if (!reader) return;
    const rate = type === "chat" ? reader.chatRate : type === "phone" ? reader.phoneRate : reader.videoRate;
    if (parseFloat(currentUser.balance || "0") < parseFloat(rate || "0")) {
      toast({ title: "Insufficient balance", description: "Please add funds to your account first.", variant: "destructive" });
      return;
    }
    setStartingSession(true);
    try {
      await apiRequest("POST", "/api/sessions", {
        clientId: currentUser.id,
        readerId: reader.userId,
        readerProfileId: reader.id,
        type,
        ratePerMinute: rate,
      });
      toast({ title: "Session started", description: `Your ${type} reading has begun. Enjoy your session.` });
    } catch {
      toast({ title: "Error", description: "Could not start session. Please try again.", variant: "destructive" });
    }
    setStartingSession(false);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/5 rounded w-32" />
          <div className="h-32 bg-white/5 rounded" />
          <div className="h-20 bg-white/5 rounded" />
        </div>
      </div>
    );
  }

  if (!reader) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <p className="text-white/50 font-playfair">Reader not found.</p>
        <Link href="/readers"><Button variant="outline" className="mt-4 font-playfair">Back to Readers</Button></Link>
      </div>
    );
  }

  const availability = reader.weeklyAvailability as Record<string, { start: string; end: string } | null> | null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/readers">
        <span className="inline-flex items-center gap-1 text-sm text-white/50 hover:text-white cursor-pointer mb-6 font-playfair" data-testid="link-back-readers">
          <ArrowLeft className="w-4 h-4" /> Back to Readers
        </span>
      </Link>

      <Card className="p-6 sm:p-8 border-border/50" style={{ backgroundColor: '#13111A' }} data-testid="card-reader-detail">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="relative mx-auto sm:mx-0">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center text-soulseer-pink font-semibold text-3xl shrink-0 font-playfair">
              {reader.user.displayName.charAt(0)}
            </div>
            <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-[#13111A] ${
              reader.status === "online" ? "bg-green-400" : reader.status === "busy" ? "bg-yellow-400" : "bg-gray-500"
            }`} />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <h1 className="font-alex text-soulseer-pink text-3xl" data-testid="text-reader-name">{reader.user.displayName}</h1>
              <Badge variant={reader.status === "online" ? "default" : "secondary"}
                className={`font-playfair ${reader.status === "online" ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}`}>
                {reader.status}
              </Badge>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
              <Star className="w-4 h-4 text-soulseer-gold fill-soulseer-gold" />
              <span className="text-soulseer-gold font-medium font-playfair">{reader.rating}</span>
              <span className="text-sm text-white/40 font-playfair">({reader.totalReadings} readings)</span>
            </div>
            <p className="text-white/60 text-sm mt-3 font-playfair">{reader.bio}</p>
            <div className="flex flex-wrap gap-1.5 mt-3 justify-center sm:justify-start">
              {reader.specialties?.map(s => (
                <Badge key={s} variant="secondary" className="text-xs font-playfair">{s}</Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8">
          <Button
            onClick={() => startReading("chat")}
            disabled={reader.status === "offline" || startingSession}
            className="bg-pink-500/20 text-pink-400 border border-pink-500/30 hover:bg-pink-500/30 h-auto py-3 font-playfair"
            data-testid="button-start-chat"
          >
            <div className="text-center">
              <MessageCircle className="w-5 h-5 mx-auto mb-1" />
              <div className="text-sm font-semibold">Chat Reading</div>
              <div className="text-xs opacity-70">${reader.chatRate}/min</div>
            </div>
          </Button>
          <Button
            onClick={() => startReading("phone")}
            disabled={reader.status === "offline" || startingSession}
            className="bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 h-auto py-3 font-playfair"
            data-testid="button-start-phone"
          >
            <div className="text-center">
              <Phone className="w-5 h-5 mx-auto mb-1" />
              <div className="text-sm font-semibold">Phone Reading</div>
              <div className="text-xs opacity-70">${reader.phoneRate}/min</div>
            </div>
          </Button>
          <Button
            onClick={() => startReading("video")}
            disabled={reader.status === "offline" || startingSession}
            className="bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 h-auto py-3 font-playfair"
            data-testid="button-start-video"
          >
            <div className="text-center">
              <Video className="w-5 h-5 mx-auto mb-1" />
              <div className="text-sm font-semibold">Video Reading</div>
              <div className="text-xs opacity-70">${reader.videoRate}/min</div>
            </div>
          </Button>
        </div>

        {availability && (
          <div className="mt-8 border-t border-border/40 pt-6">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3 text-white font-playfair">
              <Calendar className="w-4 h-4 text-soulseer-gold" /> Weekly Availability
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(availability).map(([day, hours]) => (
                <div key={day} className={`rounded-lg px-3 py-2 text-xs font-playfair ${hours ? "bg-green-500/10 border border-green-500/20" : "bg-white/5"}`}>
                  <div className="font-medium capitalize text-white">{day}</div>
                  <div className="text-white/40">{hours ? `${hours.start} - ${hours.end}` : "Off"}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {reader.reviews && reader.reviews.length > 0 && (
          <div className="mt-8 border-t border-border/40 pt-6">
            <h3 className="text-sm font-semibold mb-3 text-white font-playfair">Recent Reviews</h3>
            <div className="space-y-3">
              {reader.reviews.map(review => (
                <div key={review.id} className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < review.rating ? "text-soulseer-gold fill-soulseer-gold" : "text-white/20"}`} />
                    ))}
                  </div>
                  <p className="text-xs text-white/50 mt-1 font-playfair">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
