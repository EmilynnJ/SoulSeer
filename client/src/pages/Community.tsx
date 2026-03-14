import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { MessageSquare, Plus, Pin, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import type { ForumCategory, ForumPost, User } from "@shared/schema";

type PostWithAuthor = ForumPost & { author: User; replyCount: number };

export default function Community() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  const { data: categories = [] } = useQuery<ForumCategory[]>({
    queryKey: ["/api/forum/categories"],
  });

  const { data: posts = [] } = useQuery<PostWithAuthor[]>({
    queryKey: ["/api/forum/posts", selectedCategory ? `?categoryId=${selectedCategory}` : ""],
  });

  const createPost = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/forum/posts", {
        categoryId: selectedCategory || categories[0]?.id,
        authorId: user?.id,
        title: newTitle,
        content: newContent,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forum/posts"] });
      setNewPostOpen(false);
      setNewTitle("");
      setNewContent("");
      toast({ title: "Post created" });
    },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-alex text-soulseer-pink text-4xl mb-2" data-testid="text-community-title">Community</h1>
          <p className="text-white/50 text-sm font-playfair">Connect with fellow seekers and our gifted readers</p>
        </div>
        {user && (
          <Dialog open={newPostOpen} onOpenChange={setNewPostOpen}>
            <DialogTrigger asChild>
              <Button className="bg-pink-500 hover:bg-pink-600 text-white font-playfair" data-testid="button-new-post">
                <Plus className="w-4 h-4 mr-1" /> New Post
              </Button>
            </DialogTrigger>
            <DialogContent style={{ backgroundColor: '#13111A' }} className="border-border">
              <DialogHeader>
                <DialogTitle className="font-alex text-soulseer-pink text-xl">Create New Post</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <Input
                  placeholder="Post title"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="font-playfair"
                  style={{ backgroundColor: '#0A0A0F' }}
                  data-testid="input-post-title"
                />
                <Textarea
                  placeholder="Write your post..."
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  rows={4}
                  className="font-playfair"
                  style={{ backgroundColor: '#0A0A0F' }}
                  data-testid="input-post-content"
                />
                <Button onClick={() => createPost.mutate()} disabled={!newTitle || !newContent} className="w-full bg-pink-500 hover:bg-pink-600 text-white font-playfair" data-testid="button-submit-post">
                  Post
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <a href="https://discord.gg/soulseer" target="_blank" rel="noopener noreferrer">
          <Card className="p-5 bg-purple-500/10 border-purple-500/20 hover:border-purple-400/40 transition-all cursor-pointer" data-testid="card-discord">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-lg font-playfair">D</div>
              <div>
                <h3 className="font-semibold text-sm text-white font-playfair">SoulSeer Discord</h3>
                <p className="text-xs text-white/40 font-playfair">Join our live chat community</p>
              </div>
              <ChevronRight className="w-4 h-4 ml-auto text-white/30" />
            </div>
          </Card>
        </a>
        <a href="https://facebook.com/groups/soulseer" target="_blank" rel="noopener noreferrer">
          <Card className="p-5 bg-blue-500/10 border-blue-500/20 hover:border-blue-400/40 transition-all cursor-pointer" data-testid="card-facebook">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-lg font-playfair">f</div>
              <div>
                <h3 className="font-semibold text-sm text-white font-playfair">SoulSeer Facebook Group</h3>
                <p className="text-xs text-white/40 font-playfair">Connect and share with our community</p>
              </div>
              <ChevronRight className="w-4 h-4 ml-auto text-white/30" />
            </div>
          </Card>
        </a>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-56 shrink-0">
          <h3 className="text-sm font-semibold mb-3 text-soulseer-gold font-playfair">Categories</h3>
          <div className="space-y-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-playfair transition-all ${!selectedCategory ? "text-soulseer-pink bg-pink-500/10" : "text-white/40 hover:text-white hover:bg-white/5"}`}
              data-testid="button-category-all"
            >
              All Topics
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-playfair transition-all ${selectedCategory === cat.id ? "text-soulseer-pink bg-pink-500/10" : "text-white/40 hover:text-white hover:bg-white/5"}`}
                data-testid={`button-category-${cat.id}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 space-y-3">
          {posts.map(post => (
            <Card key={post.id} className="p-4 border-border/50 hover:border-soulseer-pink/20 transition-all" style={{ backgroundColor: '#13111A' }} data-testid={`card-post-${post.id}`}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center text-soulseer-pink text-sm font-semibold shrink-0 font-playfair">
                  {post.author?.displayName?.charAt(0) || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {post.isPinned && <Pin className="w-3 h-3 text-soulseer-gold" />}
                    <h3 className="font-semibold text-sm truncate text-white font-playfair">{post.title}</h3>
                  </div>
                  <p className="text-xs text-white/50 mt-1 line-clamp-2 font-playfair">{post.content}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-white/40 font-playfair">
                    <span>{post.author?.displayName}</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> {post.replyCount} replies
                    </span>
                    {post.author?.role === "reader" && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 text-soulseer-pink font-playfair">Reader</Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {posts.length === 0 && (
            <div className="text-center py-12 text-white/40">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-playfair">No posts yet. Be the first to start a discussion.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
