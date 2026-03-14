import type { Express, Request, Response, NextFunction } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { randomUUID } from "crypto";
import Stripe from "stripe";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { RtcTokenBuilder, RtcRole } from "agora-token";

let stripe: Stripe | null = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia" as any,
    });
  }
} catch (e) {
  console.log("Stripe not initialized - running without payment processing");
}

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || "dev-2x1dti3irhuz62jc.us.auth0.com";
const AUTH0_AUDIENCE = process.env.AUTH0_IDENTIFIER || `https://${AUTH0_DOMAIN}/api/v2/`;
const AUTH0_ISSUER = `https://${AUTH0_DOMAIN}/`;
const JWKS = createRemoteJWKSet(
  new URL(`https://${AUTH0_DOMAIN}/.well-known/jwks.json`)
);

interface AuthRequest extends Request {
  auth?: {
    sub: string;
    email?: string;
    [key: string]: any;
  };
}

async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid Authorization header" });
  }

  const token = authHeader.slice(7);

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      audience: AUTH0_AUDIENCE,
      issuer: AUTH0_ISSUER,
    });
    req.auth = payload as AuthRequest["auth"];
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { email, displayName, auth0Id } = req.body;
    if (!email || !displayName) {
      return res.status(400).json({ message: "email and displayName are required" });
    }

    let user = auth0Id ? await storage.getUserByAuth0Id(auth0Id) : undefined;
    if (!user) {
      user = await storage.getUserByEmail(email);
    }
    if (!user) {
      user = await storage.createUser({ email, displayName, auth0Id, role: "client" });
    } else if (auth0Id && !user.auth0Id) {
      user = await storage.updateUser(user.id, { auth0Id });
    }
    res.json(user);
  });

  app.get("/api/auth/user/:id", async (req: Request, res: Response) => {
    const user = await storage.getUser(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  });

  if (process.env.NODE_ENV !== "production") {
    app.post("/api/auth/demo-login", async (req: Request, res: Response) => {
      const { role } = req.body;
      if (role === "admin") {
        const allUsers = await storage.getAllUsers();
        const admin = allUsers.find((u) => u.role === "admin");
        if (!admin) return res.status(404).json({ message: "Admin not found" });
        return res.json(admin);
      }
      if (role === "reader") {
        const allUsers = await storage.getAllUsers();
        const reader = allUsers.find((u) => u.role === "reader");
        if (!reader) return res.status(404).json({ message: "Reader not found" });
        return res.json(reader);
      }
      let client = await storage.getUserByEmail("demo@soulseer.app");
      if (!client) {
        client = await storage.createUser({
          email: "demo@soulseer.app",
          displayName: "Demo Client",
          role: "client",
          balance: "50.00",
        });
      }
      res.json(client);
    });
  }

  // Users
  app.get("/api/users", async (_req: Request, res: Response) => {
    const allUsers = await storage.getAllUsers();
    res.json(allUsers);
  });

  app.patch("/api/users/:id", async (req: Request, res: Response) => {
    const user = await storage.updateUser(req.params.id, req.body);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  });

  // Readers
  app.get("/api/readers", async (_req: Request, res: Response) => {
    const profiles = await storage.getAllReaderProfiles();
    const result = [];
    for (const p of profiles) {
      const user = await storage.getUser(p.userId);
      if (user) result.push({ ...p, user });
    }
    res.json(result);
  });

  app.get("/api/readers/online", async (_req: Request, res: Response) => {
    const readers = await storage.getOnlineReaders();
    res.json(readers);
  });

  app.get("/api/readers/:id", async (req: Request, res: Response) => {
    const profile = await storage.getReaderProfile(req.params.id);
    if (!profile) return res.status(404).json({ message: "Reader not found" });
    const user = await storage.getUser(profile.userId);
    const readerReviews = await storage.getReviewsByReader(profile.userId);
    res.json({ ...profile, user, reviews: readerReviews });
  });

  app.get("/api/readers/user/:userId", async (req: Request, res: Response) => {
    const profile = await storage.getReaderProfileByUserId(req.params.userId);
    if (!profile) return res.status(404).json({ message: "Reader profile not found" });
    res.json(profile);
  });

  app.post("/api/readers", async (req: Request, res: Response) => {
    const { email, displayName, bio, specialties, chatRate, phoneRate, videoRate } = req.body;
    const user = await storage.createUser({ email, displayName, role: "reader" });
    const profile = await storage.createReaderProfile({
      userId: user.id, bio, specialties, chatRate, phoneRate, videoRate,
    });
    res.status(201).json({ user, profile });
  });

  app.patch("/api/readers/:id", async (req: Request, res: Response) => {
    const profile = await storage.updateReaderProfile(req.params.id, req.body);
    if (!profile) return res.status(404).json({ message: "Reader not found" });
    res.json(profile);
  });

  app.patch("/api/readers/:id/status", async (req: Request, res: Response) => {
    const { status } = req.body;
    const profile = await storage.updateReaderProfile(req.params.id, { status });
    if (!profile) return res.status(404).json({ message: "Reader not found" });
    res.json(profile);
  });

  // Sessions
  app.post("/api/sessions", async (req: Request, res: Response) => {
    const { clientId, readerId, readerProfileId, type, ratePerMinute } = req.body;
    const client = await storage.getUser(clientId);
    if (!client || parseFloat(client.balance || "0") < parseFloat(ratePerMinute)) {
      return res.status(400).json({ message: "Insufficient balance" });
    }
    const channelName = `ss-${randomUUID().slice(0, 8)}`;
    const session = await storage.createSession({
      clientId, readerId, readerProfileId, type, ratePerMinute,
      status: "active", agoraChannelName: channelName, startedAt: new Date(),
    });
    res.status(201).json(session);
  });

  app.get("/api/sessions/client/:clientId", async (req: Request, res: Response) => {
    const sessions = await storage.getSessionsByClient(req.params.clientId);
    res.json(sessions);
  });

  app.get("/api/sessions/reader/:readerId", async (req: Request, res: Response) => {
    const sessions = await storage.getSessionsByReader(req.params.readerId);
    res.json(sessions);
  });

  app.patch("/api/sessions/:id/end", async (req: Request, res: Response) => {
    const session = await storage.getSession(req.params.id);
    if (!session) return res.status(404).json({ message: "Session not found" });
    const { durationMinutes } = req.body;
    const totalCost = (parseFloat(session.ratePerMinute) * durationMinutes).toFixed(2);
    const readerEarnings = (parseFloat(totalCost) * 0.7).toFixed(2);

    const updated = await storage.updateSession(session.id, {
      status: "completed", durationMinutes, totalCost, endedAt: new Date(),
    });

    const client = await storage.getUser(session.clientId);
    if (client) {
      const newBalance = (parseFloat(client.balance || "0") - parseFloat(totalCost)).toFixed(2);
      await storage.updateUser(client.id, { balance: newBalance });
      await storage.createTransaction({
        userId: client.id, type: "reading_charge", amount: `-${totalCost}`,
        description: `Reading session - ${session.type}`, sessionId: session.id,
      });
    }

    const readerProfile = await storage.getReaderProfile(session.readerProfileId);
    if (readerProfile) {
      const newPending = (parseFloat(readerProfile.pendingPayout || "0") + parseFloat(readerEarnings)).toFixed(2);
      const newTotal = (parseFloat(readerProfile.totalEarnings || "0") + parseFloat(readerEarnings)).toFixed(2);
      await storage.updateReaderProfile(readerProfile.id, {
        pendingPayout: newPending, totalEarnings: newTotal,
        totalReadings: readerProfile.totalReadings + 1,
      });
      await storage.createTransaction({
        userId: session.readerId, type: "reader_payout", amount: readerEarnings,
        description: `Earnings from ${session.type} reading`, sessionId: session.id,
      });
    }

    res.json(updated);
  });

  // Payments - add funds (demo/direct)
  app.post("/api/payments/add-funds", async (req: Request, res: Response) => {
    const { userId, amount } = req.body;
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const newBalance = (parseFloat(user.balance || "0") + parseFloat(amount)).toFixed(2);
    await storage.updateUser(userId, { balance: newBalance });
    await storage.createTransaction({ userId, type: "deposit", amount, description: "Added funds to balance" });
    res.json({ balance: newBalance });
  });

  // Stripe payment intent creation
  app.post("/api/payments/create-intent", async (req: Request, res: Response) => {
    if (!stripe) {
      return res.status(503).json({ message: "Payment processing is not configured" });
    }

    const { amount, userId } = req.body;
    if (!amount || !userId) {
      return res.status(400).json({ message: "amount and userId are required" });
    }

    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    try {
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({ email: user.email, name: user.displayName });
        customerId = customer.id;
        await storage.updateUser(userId, { stripeCustomerId: customerId });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(parseFloat(amount) * 100),
        currency: "usd",
        customer: customerId,
        metadata: { userId, type: "add_funds" },
      });

      res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
    } catch (err: any) {
      console.error("Stripe create-intent error:", err.message);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  // Stripe webhook
  app.post("/api/payments/webhook", async (req: Request, res: Response) => {
    if (!stripe) {
      return res.status(503).json({ message: "Payment processing is not configured" });
    }

    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SIGNING_SECRET;

    if (!sig || !webhookSecret) {
      return res.status(400).json({ message: "Missing signature or webhook secret" });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.rawBody as Buffer, sig, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).json({ message: "Webhook signature verification failed" });
    }

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const userId = paymentIntent.metadata.userId;
      const amountInDollars = (paymentIntent.amount / 100).toFixed(2);

      if (userId) {
        const user = await storage.getUser(userId);
        if (user) {
          const newBalance = (parseFloat(user.balance || "0") + parseFloat(amountInDollars)).toFixed(2);
          await storage.updateUser(userId, { balance: newBalance });
          await storage.createTransaction({
            userId,
            type: "deposit",
            amount: amountInDollars,
            description: "Added funds via Stripe",
            stripePaymentId: paymentIntent.id,
          });
        }
      }
    }

    res.json({ received: true });
  });

  app.get("/api/transactions/:userId", async (req: Request, res: Response) => {
    const txs = await storage.getTransactionsByUser(req.params.userId);
    res.json(txs);
  });

  app.get("/api/transactions", async (_req: Request, res: Response) => {
    const txs = await storage.getAllTransactions();
    res.json(txs);
  });

  // Reviews
  app.post("/api/reviews", async (req: Request, res: Response) => {
    const review = await storage.createReview(req.body);
    const readerReviews = await storage.getReviewsByReader(review.readerId);
    const avgRating = readerReviews.length > 0
      ? (readerReviews.reduce((sum, r) => sum + r.rating, 0) / readerReviews.length).toFixed(2)
      : "0.00";
    const profile = await storage.getReaderProfileByUserId(review.readerId);
    if (profile) await storage.updateReaderProfile(profile.id, { rating: avgRating });
    res.status(201).json(review);
  });

  app.get("/api/reviews/reader/:readerId", async (req: Request, res: Response) => {
    const readerReviews = await storage.getReviewsByReader(req.params.readerId);
    res.json(readerReviews);
  });

  // Messages
  app.post("/api/messages", async (req: Request, res: Response) => {
    const msg = await storage.createMessage(req.body);
    res.status(201).json(msg);
  });

  app.get("/api/messages/:userId1/:userId2", async (req: Request, res: Response) => {
    const msgs = await storage.getMessagesBetween(req.params.userId1, req.params.userId2);
    res.json(msgs);
  });

  app.get("/api/messages/conversations/:userId", async (req: Request, res: Response) => {
    const convos = await storage.getConversations(req.params.userId);
    res.json(convos);
  });

  app.patch("/api/messages/:id/read", async (req: Request, res: Response) => {
    await storage.markMessageRead(req.params.id);
    res.json({ success: true });
  });

  // Forum
  app.get("/api/forum/categories", async (_req: Request, res: Response) => {
    const cats = await storage.getForumCategories();
    res.json(cats);
  });

  app.get("/api/forum/posts", async (req: Request, res: Response) => {
    const categoryId = req.query.categoryId as string | undefined;
    const posts = await storage.getForumPosts(categoryId);
    res.json(posts);
  });

  app.get("/api/forum/posts/:id", async (req: Request, res: Response) => {
    const post = await storage.getForumPost(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    const author = await storage.getUser(post.authorId);
    const replies = await storage.getForumReplies(post.id);
    res.json({ ...post, author, replies });
  });

  app.post("/api/forum/posts", async (req: Request, res: Response) => {
    const post = await storage.createForumPost(req.body);
    res.status(201).json(post);
  });

  app.post("/api/forum/replies", async (req: Request, res: Response) => {
    const reply = await storage.createForumReply(req.body);
    res.status(201).json(reply);
  });

  app.post("/api/forum/flag", async (req: Request, res: Response) => {
    const { type, id } = req.body;
    await storage.flagForumContent(type, id);
    res.json({ success: true });
  });

  // Favorites
  app.post("/api/favorites", async (req: Request, res: Response) => {
    const fav = await storage.addFavorite(req.body);
    res.status(201).json(fav);
  });

  app.delete("/api/favorites/:clientId/:readerId", async (req: Request, res: Response) => {
    await storage.removeFavorite(req.params.clientId, req.params.readerId);
    res.json({ success: true });
  });

  app.get("/api/favorites/:clientId", async (req: Request, res: Response) => {
    const favs = await storage.getFavorites(req.params.clientId);
    res.json(favs);
  });

  // Newsletter
  app.post("/api/newsletter", async (req: Request, res: Response) => {
    const { email } = req.body;
    await storage.addNewsletterSubscription(email);
    res.json({ success: true });
  });

  // Agora token generation
  app.post("/api/agora/token", async (req: Request, res: Response) => {
    const { channelName, uid } = req.body;
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_SECURITY_CERTIFICATE;

    if (!appId || !appCertificate) {
      return res.status(503).json({ message: "Agora credentials not configured" });
    }

    if (!channelName) {
      return res.status(400).json({ message: "channelName is required" });
    }

    const uidNum = uid ? Number(uid) : 0;
    const tokenExpire = 3600;
    const privilegeExpire = 3600;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uidNum,
      RtcRole.PUBLISHER,
      tokenExpire,
      privilegeExpire
    );

    res.json({ appId, channel: channelName, uid: uidNum, token });
  });

  return httpServer;
}
