import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Star, MessageCircle, Phone, Video, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import type { ReaderProfile, User } from "@shared/schema";

type ReaderWithUser = ReaderProfile & { user: User };

export default function Readers() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "online">("all");

  const { data: readers = [], isLoading } = useQuery<ReaderWithUser[]>({
    queryKey: ["/api/readers"],
  });

  const filtered = readers.filter(r => {
    if (filter === "online" && r.status === "offline") return false;
    if (search) {
      const q = search.toLowerCase();
      return r.user.displayName.toLowerCase().includes(q) ||
        r.specialties?.some(s => s.toLowerCase().includes(q)) ||
        r.bio?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="font-alex text-soulseer-pink text-4xl mb-2" data-testid="text-readers-title">Our Readers</h1>
        <p className="text-white/50 text-sm font-playfair">Browse our gifted psychics and spiritual readers</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            placeholder="Search by name, specialty..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 border-border/50 font-playfair"
            style={{ backgroundColor: '#13111A' }}
            data-testid="input-search-readers"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
            className={`font-playfair ${filter === "all" ? "bg-pink-500 hover:bg-pink-600 text-white" : ""}`}
            data-testid="button-filter-all"
          >
            All Readers
          </Button>
          <Button
            variant={filter === "online" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("online")}
            className={`font-playfair ${filter === "online" ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
            data-testid="button-filter-online"
          >
            <span className="w-2 h-2 rounded-full bg-green-400 mr-1.5" /> Online
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="p-5 border-border/50 animate-pulse" style={{ backgroundColor: '#13111A' }}>
              <div className="flex gap-3">
                <div className="w-14 h-14 rounded-full bg-white/5" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/5 rounded w-2/3" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                  <div className="h-3 bg-white/5 rounded w-full" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(reader => (
            <Link key={reader.id} href={`/readers/${reader.id}`}>
              <Card className="p-5 border-border/50 hover:border-soulseer-pink/30 transition-all cursor-pointer group" style={{ backgroundColor: '#13111A' }} data-testid={`card-reader-${reader.id}`}>
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center text-soulseer-pink font-semibold text-xl shrink-0 font-playfair">
                      {reader.user.displayName.charAt(0)}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#13111A] ${
                      reader.status === "online" ? "bg-green-400" : reader.status === "busy" ? "bg-yellow-400" : "bg-gray-500"
                    }`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate group-hover:text-soulseer-pink transition-colors text-white font-playfair">{reader.user.displayName}</h3>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="w-3 h-3 text-soulseer-gold fill-soulseer-gold" />
                      <span className="text-xs text-soulseer-gold font-medium font-playfair">{reader.rating}</span>
                      <span className="text-xs text-white/40 font-playfair">({reader.totalReadings})</span>
                    </div>
                    <p className="text-xs text-white/50 mt-1.5 line-clamp-2 font-playfair">{reader.bio}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {reader.specialties?.map(s => (
                        <Badge key={s} variant="secondary" className="text-[10px] px-1.5 py-0 font-playfair">{s}</Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 mt-3 text-xs text-white/40 border-t border-border/30 pt-2 font-playfair">
                      <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3 text-pink-400" />${reader.chatRate}/m</span>
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-pink-400" />${reader.phoneRate}/m</span>
                      <span className="flex items-center gap-1"><Video className="w-3 h-3 text-pink-400" />${reader.videoRate}/m</span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full text-center text-white/40 py-12 font-playfair">No readers found matching your criteria.</p>
          )}
        </div>
      )}
    </div>
  );
}
