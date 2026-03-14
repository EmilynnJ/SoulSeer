import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, Clock, Star, MessageCircle, Phone, Video, TrendingUp, Users, Settings, Plus, Eye, ToggleLeft, Wallet, CreditCard, Heart, History, BarChart3, Flag, UserPlus, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import type { ReadingSession, Transaction, ReaderProfile, User } from "@shared/schema";

type ReaderWithUser = ReaderProfile & { user: User };

function ClientDashboard() {
  const { user, updateBalance } = useAuth();
  const { toast } = useToast();
  const [addAmount, setAddAmount] = useState("25.00");

  const { data: sessions = [] } = useQuery<ReadingSession[]>({
    queryKey: ["/api/sessions/client", user?.id],
    enabled: !!user,
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions", user?.id],
    enabled: !!user,
  });

  const addFunds = async () => {
    if (!user) return;
    try {
      const res = await apiRequest("POST", "/api/payments/add-funds", { userId: user.id, amount: addAmount });
      const data = await res.json();
      updateBalance(data.balance);
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({ title: "Funds added", description: `$${addAmount} has been added to your balance.` });
    } catch {
      toast({ title: "Error", description: "Could not add funds.", variant: "destructive" });
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Client Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-4 bg-card/60 border-border/50" data-testid="card-client-balance">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Wallet className="w-4 h-4" /> Balance</div>
          <div className="text-2xl font-semibold text-soulseer-gold">${parseFloat(user?.balance || "0").toFixed(2)}</div>
        </Card>
        <Card className="p-4 bg-card/60 border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><History className="w-4 h-4" /> Sessions</div>
          <div className="text-2xl font-semibold">{sessions.length}</div>
        </Card>
        <Card className="p-4 bg-card/60 border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><DollarSign className="w-4 h-4" /> Total Spent</div>
          <div className="text-2xl font-semibold">${sessions.reduce((s, ss) => s + parseFloat(ss.totalCost || "0"), 0).toFixed(2)}</div>
        </Card>
      </div>

      {/* Add Funds */}
      <Card className="p-4 bg-card/60 border-border/50 mb-6" data-testid="card-add-funds">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4 text-soulseer-pink" /> Add Funds</h3>
        <div className="flex gap-2 flex-wrap mb-3">
          {["10.00", "25.00", "50.00", "100.00"].map(amt => (
            <Button key={amt} variant={addAmount === amt ? "default" : "outline"} size="sm"
              onClick={() => setAddAmount(amt)}
              className={addAmount === amt ? "bg-pink-500 hover:bg-pink-600 text-white" : ""}
              data-testid={`button-amount-${amt}`}
            >${amt}</Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input value={addAmount} onChange={e => setAddAmount(e.target.value)} className="w-32 bg-background" data-testid="input-custom-amount" />
          <Button onClick={addFunds} className="bg-pink-500 hover:bg-pink-600 text-white" data-testid="button-add-funds">Add Funds</Button>
        </div>
      </Card>

      {/* Transaction History */}
      <Card className="p-4 bg-card/60 border-border/50">
        <h3 className="text-sm font-semibold mb-3">Transaction History</h3>
        <div className="space-y-2">
          {transactions.slice(0, 10).map(tx => (
            <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
              <div>
                <div className="text-sm">{tx.description}</div>
                <div className="text-xs text-muted-foreground">{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : ""}</div>
              </div>
              <div className={`text-sm font-semibold ${parseFloat(tx.amount) > 0 ? "text-green-400" : "text-red-400"}`}>
                {parseFloat(tx.amount) > 0 ? "+" : ""}${tx.amount}
              </div>
            </div>
          ))}
          {transactions.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No transactions yet.</p>}
        </div>
      </Card>
    </div>
  );
}

function ReaderDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: profile } = useQuery<ReaderProfile>({
    queryKey: ["/api/readers/user", user?.id],
    enabled: !!user,
  });

  const { data: sessions = [] } = useQuery<ReadingSession[]>({
    queryKey: ["/api/sessions/reader", user?.id],
    enabled: !!user,
  });

  const toggleStatus = async (newStatus: "online" | "offline") => {
    if (!profile) return;
    await apiRequest("PATCH", `/api/readers/${profile.id}/status`, { status: newStatus });
    queryClient.invalidateQueries({ queryKey: ["/api/readers/user"] });
    toast({ title: `Status: ${newStatus}` });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Reader Dashboard</h2>
        {profile && (
          <div className="flex gap-2">
            <Button size="sm" variant={profile.status === "online" ? "default" : "outline"}
              onClick={() => toggleStatus("online")}
              className={profile.status === "online" ? "bg-green-600 hover:bg-green-700 text-white" : ""}
              data-testid="button-go-online"
            >Online</Button>
            <Button size="sm" variant={profile.status === "offline" ? "default" : "outline"}
              onClick={() => toggleStatus("offline")}
              data-testid="button-go-offline"
            >Offline</Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 bg-card/60 border-border/50">
          <div className="text-xs text-muted-foreground mb-1">Status</div>
          <Badge className={profile?.status === "online" ? "bg-green-500/20 text-green-400" : profile?.status === "busy" ? "bg-yellow-500/20 text-yellow-400" : ""}>
            {profile?.status || "offline"}
          </Badge>
        </Card>
        <Card className="p-4 bg-card/60 border-border/50" data-testid="card-reader-earnings">
          <div className="text-xs text-muted-foreground mb-1">Total Earnings</div>
          <div className="text-xl font-semibold text-soulseer-gold">${profile?.totalEarnings || "0.00"}</div>
        </Card>
        <Card className="p-4 bg-card/60 border-border/50">
          <div className="text-xs text-muted-foreground mb-1">Pending Payout</div>
          <div className="text-xl font-semibold text-green-400">${profile?.pendingPayout || "0.00"}</div>
        </Card>
        <Card className="p-4 bg-card/60 border-border/50">
          <div className="text-xs text-muted-foreground mb-1">Total Readings</div>
          <div className="text-xl font-semibold">{profile?.totalReadings || 0}</div>
        </Card>
      </div>

      {/* Rates */}
      <Card className="p-4 bg-card/60 border-border/50 mb-6">
        <h3 className="text-sm font-semibold mb-3">Your Rates</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-pink-500/10 border border-pink-500/20">
            <MessageCircle className="w-5 h-5 mx-auto text-pink-400 mb-1" />
            <div className="text-xs text-muted-foreground">Chat</div>
            <div className="text-sm font-semibold">${profile?.chatRate}/min</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <Phone className="w-5 h-5 mx-auto text-purple-400 mb-1" />
            <div className="text-xs text-muted-foreground">Phone</div>
            <div className="text-sm font-semibold">${profile?.phoneRate}/min</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Video className="w-5 h-5 mx-auto text-blue-400 mb-1" />
            <div className="text-xs text-muted-foreground">Video</div>
            <div className="text-sm font-semibold">${profile?.videoRate}/min</div>
          </div>
        </div>
      </Card>

      {/* Session History */}
      <Card className="p-4 bg-card/60 border-border/50">
        <h3 className="text-sm font-semibold mb-3">Recent Sessions</h3>
        <div className="space-y-2">
          {sessions.slice(0, 10).map(s => (
            <div key={s.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">{s.type}</Badge>
                <span className="text-sm">{s.durationMinutes} min</span>
              </div>
              <div className="text-sm font-semibold text-soulseer-gold">${s.totalCost}</div>
            </div>
          ))}
          {sessions.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No sessions yet.</p>}
        </div>
      </Card>
    </div>
  );
}

function AdminDashboard() {
  const { toast } = useToast();
  const [newReaderEmail, setNewReaderEmail] = useState("");
  const [newReaderName, setNewReaderName] = useState("");

  const { data: users = [] } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const { data: readers = [] } = useQuery<ReaderWithUser[]>({ queryKey: ["/api/readers"] });
  const { data: transactions = [] } = useQuery<Transaction[]>({ queryKey: ["/api/transactions"] });

  const createReader = async () => {
    if (!newReaderEmail || !newReaderName) return;
    await apiRequest("POST", "/api/readers", { email: newReaderEmail, displayName: newReaderName, bio: "New reader", specialties: ["General"] });
    queryClient.invalidateQueries({ queryKey: ["/api/readers"] });
    queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    setNewReaderEmail("");
    setNewReaderName("");
    toast({ title: "Reader created" });
  };

  const totalRevenue = transactions.filter(t => t.type === "reading_charge").reduce((s, t) => s + Math.abs(parseFloat(t.amount)), 0);
  const platformRevenue = totalRevenue * 0.3;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Admin Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 bg-card/60 border-border/50">
          <div className="text-xs text-muted-foreground mb-1">Total Users</div>
          <div className="text-xl font-semibold">{users.length}</div>
        </Card>
        <Card className="p-4 bg-card/60 border-border/50">
          <div className="text-xs text-muted-foreground mb-1">Active Readers</div>
          <div className="text-xl font-semibold">{readers.length}</div>
        </Card>
        <Card className="p-4 bg-card/60 border-border/50">
          <div className="text-xs text-muted-foreground mb-1">Total Revenue</div>
          <div className="text-xl font-semibold text-soulseer-gold">${totalRevenue.toFixed(2)}</div>
        </Card>
        <Card className="p-4 bg-card/60 border-border/50">
          <div className="text-xs text-muted-foreground mb-1">Platform Revenue (30%)</div>
          <div className="text-xl font-semibold text-green-400">${platformRevenue.toFixed(2)}</div>
        </Card>
      </div>

      <Tabs defaultValue="readers" className="space-y-4">
        <TabsList className="bg-card/60">
          <TabsTrigger value="readers" data-testid="tab-admin-readers">Readers</TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-admin-users">Users</TabsTrigger>
          <TabsTrigger value="transactions" data-testid="tab-admin-transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="readers">
          <Card className="p-4 bg-card/60 border-border/50 mb-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><UserPlus className="w-4 h-4 text-soulseer-pink" /> Create Reader</h3>
            <div className="flex gap-2 flex-wrap">
              <Input placeholder="Name" value={newReaderName} onChange={e => setNewReaderName(e.target.value)} className="w-40 bg-background" data-testid="input-new-reader-name" />
              <Input placeholder="Email" value={newReaderEmail} onChange={e => setNewReaderEmail(e.target.value)} className="w-48 bg-background" data-testid="input-new-reader-email" />
              <Button onClick={createReader} className="bg-pink-500 hover:bg-pink-600 text-white" data-testid="button-create-reader">Create</Button>
            </div>
          </Card>
          <div className="space-y-2">
            {readers.map(r => (
              <Card key={r.id} className="p-3 bg-card/60 border-border/50 flex items-center justify-between" data-testid={`card-admin-reader-${r.id}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center text-soulseer-pink text-sm font-semibold">
                    {r.user.displayName.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{r.user.displayName}</div>
                    <div className="text-xs text-muted-foreground">{r.user.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={r.status === "online" ? "bg-green-500/20 text-green-400" : ""}>{r.status}</Badge>
                  <span className="text-xs text-soulseer-gold">{r.totalReadings} readings</span>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users">
          <div className="space-y-2">
            {users.map(u => (
              <Card key={u.id} className="p-3 bg-card/60 border-border/50 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">{u.displayName}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </div>
                <Badge variant="secondary">{u.role}</Badge>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <div className="space-y-2">
            {transactions.slice(0, 20).map(tx => (
              <Card key={tx.id} className="p-3 bg-card/60 border-border/50 flex items-center justify-between">
                <div>
                  <div className="text-sm">{tx.description}</div>
                  <div className="text-xs text-muted-foreground">{tx.type} - {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : ""}</div>
                </div>
                <div className={`text-sm font-semibold ${parseFloat(tx.amount) > 0 ? "text-green-400" : "text-red-400"}`}>
                  ${tx.amount}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h1 className="font-alex text-soulseer-pink text-4xl mb-4">Dashboard</h1>
        <p className="text-muted-foreground mb-4">Please sign in to access your dashboard.</p>
        <Link href="/"><Button className="bg-pink-500 hover:bg-pink-600 text-white">Go Home</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {user?.role === "admin" && <AdminDashboard />}
      {user?.role === "reader" && <ReaderDashboard />}
      {user?.role === "client" && <ClientDashboard />}
    </div>
  );
}
