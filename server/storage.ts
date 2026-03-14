import {
  type User, type InsertUser,
  type ReaderProfile, type InsertReaderProfile,
  type ReadingSession, type InsertSession,
  type Transaction, type InsertTransaction,
  type Review, type InsertReview,
  type Message, type InsertMessage,
  type ForumPost, type InsertForumPost,
  type ForumReply, type InsertForumReply,
  type Favorite, type InsertFavorite,
  type ForumCategory,
  users, readerProfiles, readingSessions, transactions,
  reviews, messages, forumCategories, forumPosts,
  forumReplies, favorites, newsletterSubscriptions,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc, sql, count } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByAuth0Id(auth0Id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  getReaderProfile(id: string): Promise<ReaderProfile | undefined>;
  getReaderProfileByUserId(userId: string): Promise<ReaderProfile | undefined>;
  getAllReaderProfiles(): Promise<ReaderProfile[]>;
  getOnlineReaders(): Promise<(ReaderProfile & { user: User })[]>;
  createReaderProfile(profile: InsertReaderProfile): Promise<ReaderProfile>;
  updateReaderProfile(id: string, data: Partial<ReaderProfile>): Promise<ReaderProfile | undefined>;

  createSession(session: InsertSession): Promise<ReadingSession>;
  getSession(id: string): Promise<ReadingSession | undefined>;
  updateSession(id: string, data: Partial<ReadingSession>): Promise<ReadingSession | undefined>;
  getSessionsByClient(clientId: string): Promise<ReadingSession[]>;
  getSessionsByReader(readerId: string): Promise<ReadingSession[]>;

  createTransaction(tx: InsertTransaction): Promise<Transaction>;
  getTransactionsByUser(userId: string): Promise<Transaction[]>;
  getAllTransactions(): Promise<Transaction[]>;

  createReview(review: InsertReview): Promise<Review>;
  getReviewsByReader(readerId: string): Promise<Review[]>;
  updateReview(id: string, data: Partial<Review>): Promise<Review | undefined>;

  createMessage(msg: InsertMessage): Promise<Message>;
  getMessagesBetween(userId1: string, userId2: string): Promise<Message[]>;
  getConversations(userId: string): Promise<Message[]>;
  markMessageRead(id: string): Promise<void>;

  getForumCategories(): Promise<ForumCategory[]>;
  createForumCategory(cat: ForumCategory): Promise<ForumCategory>;
  getForumPosts(categoryId?: string): Promise<(ForumPost & { author: User; replyCount: number })[]>;
  getForumPost(id: string): Promise<ForumPost | undefined>;
  createForumPost(post: InsertForumPost): Promise<ForumPost>;
  getForumReplies(postId: string): Promise<(ForumReply & { author: User })[]>;
  createForumReply(reply: InsertForumReply): Promise<ForumReply>;
  flagForumContent(type: "post" | "reply", id: string): Promise<void>;

  addFavorite(fav: InsertFavorite): Promise<Favorite>;
  removeFavorite(clientId: string, readerId: string): Promise<void>;
  getFavorites(clientId: string): Promise<Favorite[]>;

  addNewsletterSubscription(email: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user;
  }

  async getUserByAuth0Id(auth0Id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.auth0Id, auth0Id)).limit(1);
    return user;
  }

  async createUser(data: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const { id: _id, ...updateData } = data;
    const [user] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getReaderProfile(id: string): Promise<ReaderProfile | undefined> {
    const [profile] = await db.select().from(readerProfiles).where(eq(readerProfiles.id, id)).limit(1);
    return profile;
  }

  async getReaderProfileByUserId(userId: string): Promise<ReaderProfile | undefined> {
    const [profile] = await db.select().from(readerProfiles).where(eq(readerProfiles.userId, userId)).limit(1);
    return profile;
  }

  async getAllReaderProfiles(): Promise<ReaderProfile[]> {
    return db.select().from(readerProfiles);
  }

  async getOnlineReaders(): Promise<(ReaderProfile & { user: User })[]> {
    const rows = await db
      .select()
      .from(readerProfiles)
      .innerJoin(users, eq(readerProfiles.userId, users.id))
      .where(or(eq(readerProfiles.status, "online"), eq(readerProfiles.status, "busy")));

    return rows.map((r) => ({
      ...r.reader_profiles,
      user: r.users,
    }));
  }

  async createReaderProfile(data: InsertReaderProfile): Promise<ReaderProfile> {
    const [profile] = await db.insert(readerProfiles).values(data).returning();
    return profile;
  }

  async updateReaderProfile(id: string, data: Partial<ReaderProfile>): Promise<ReaderProfile | undefined> {
    const { id: _id, ...updateData } = data;
    const [profile] = await db.update(readerProfiles).set(updateData).where(eq(readerProfiles.id, id)).returning();
    return profile;
  }

  async createSession(data: InsertSession): Promise<ReadingSession> {
    const [session] = await db.insert(readingSessions).values(data).returning();
    return session;
  }

  async getSession(id: string): Promise<ReadingSession | undefined> {
    const [session] = await db.select().from(readingSessions).where(eq(readingSessions.id, id)).limit(1);
    return session;
  }

  async updateSession(id: string, data: Partial<ReadingSession>): Promise<ReadingSession | undefined> {
    const { id: _id, ...updateData } = data;
    const [session] = await db.update(readingSessions).set(updateData).where(eq(readingSessions.id, id)).returning();
    return session;
  }

  async getSessionsByClient(clientId: string): Promise<ReadingSession[]> {
    return db.select().from(readingSessions)
      .where(eq(readingSessions.clientId, clientId))
      .orderBy(desc(readingSessions.createdAt));
  }

  async getSessionsByReader(readerId: string): Promise<ReadingSession[]> {
    return db.select().from(readingSessions)
      .where(eq(readingSessions.readerId, readerId))
      .orderBy(desc(readingSessions.createdAt));
  }

  async createTransaction(data: InsertTransaction): Promise<Transaction> {
    const [tx] = await db.insert(transactions).values(data).returning();
    return tx;
  }

  async getTransactionsByUser(userId: string): Promise<Transaction[]> {
    return db.select().from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return db.select().from(transactions).orderBy(desc(transactions.createdAt));
  }

  async createReview(data: InsertReview): Promise<Review> {
    const [review] = await db.insert(reviews).values(data).returning();
    return review;
  }

  async getReviewsByReader(readerId: string): Promise<Review[]> {
    return db.select().from(reviews)
      .where(eq(reviews.readerId, readerId))
      .orderBy(desc(reviews.createdAt));
  }

  async updateReview(id: string, data: Partial<Review>): Promise<Review | undefined> {
    const { id: _id, ...updateData } = data;
    const [review] = await db.update(reviews).set(updateData).where(eq(reviews.id, id)).returning();
    return review;
  }

  async createMessage(data: InsertMessage): Promise<Message> {
    const [msg] = await db.insert(messages).values(data).returning();
    return msg;
  }

  async getMessagesBetween(userId1: string, userId2: string): Promise<Message[]> {
    return db.select().from(messages)
      .where(
        or(
          and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
          and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
        )
      )
      .orderBy(asc(messages.createdAt));
  }

  async getConversations(userId: string): Promise<Message[]> {
    const result = await db.execute(sql`
      SELECT DISTINCT ON (partner_id) m.*
      FROM (
        SELECT *,
          CASE WHEN sender_id = ${userId} THEN receiver_id ELSE sender_id END AS partner_id
        FROM messages
        WHERE sender_id = ${userId} OR receiver_id = ${userId}
      ) m
      ORDER BY partner_id, created_at DESC
    `);
    const rows = result.rows as Message[];
    return rows.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }

  async markMessageRead(id: string): Promise<void> {
    await db.update(messages).set({ isRead: true }).where(eq(messages.id, id));
  }

  async getForumCategories(): Promise<ForumCategory[]> {
    return db.select().from(forumCategories).orderBy(asc(forumCategories.sortOrder));
  }

  async createForumCategory(cat: ForumCategory): Promise<ForumCategory> {
    const [category] = await db.insert(forumCategories).values(cat).returning();
    return category;
  }

  async getForumPosts(categoryId?: string): Promise<(ForumPost & { author: User; replyCount: number })[]> {
    const replyCountSub = db
      .select({
        postId: forumReplies.postId,
        replyCount: count().as("reply_count"),
      })
      .from(forumReplies)
      .groupBy(forumReplies.postId)
      .as("reply_counts");

    let query = db
      .select({
        post: forumPosts,
        author: users,
        replyCount: sql<number>`COALESCE(${replyCountSub.replyCount}, 0)`.as("reply_count"),
      })
      .from(forumPosts)
      .innerJoin(users, eq(forumPosts.authorId, users.id))
      .leftJoin(replyCountSub, eq(forumPosts.id, replyCountSub.postId))
      .orderBy(desc(forumPosts.isPinned), desc(forumPosts.createdAt));

    if (categoryId) {
      query = query.where(eq(forumPosts.categoryId, categoryId)) as typeof query;
    }

    const rows = await query;

    return rows.map((r) => ({
      ...r.post,
      author: r.author,
      replyCount: Number(r.replyCount),
    }));
  }

  async getForumPost(id: string): Promise<ForumPost | undefined> {
    const [post] = await db.select().from(forumPosts).where(eq(forumPosts.id, id)).limit(1);
    return post;
  }

  async createForumPost(data: InsertForumPost): Promise<ForumPost> {
    const [post] = await db.insert(forumPosts).values(data).returning();
    return post;
  }

  async getForumReplies(postId: string): Promise<(ForumReply & { author: User })[]> {
    const rows = await db
      .select()
      .from(forumReplies)
      .innerJoin(users, eq(forumReplies.authorId, users.id))
      .where(eq(forumReplies.postId, postId))
      .orderBy(asc(forumReplies.createdAt));

    return rows.map((r) => ({
      ...r.forum_replies,
      author: r.users,
    }));
  }

  async createForumReply(data: InsertForumReply): Promise<ForumReply> {
    const [reply] = await db.insert(forumReplies).values(data).returning();
    return reply;
  }

  async flagForumContent(type: "post" | "reply", id: string): Promise<void> {
    if (type === "post") {
      await db.update(forumPosts).set({ isFlagged: true }).where(eq(forumPosts.id, id));
    } else {
      await db.update(forumReplies).set({ isFlagged: true }).where(eq(forumReplies.id, id));
    }
  }

  async addFavorite(data: InsertFavorite): Promise<Favorite> {
    const [fav] = await db.insert(favorites).values(data).returning();
    return fav;
  }

  async removeFavorite(clientId: string, readerId: string): Promise<void> {
    await db.delete(favorites).where(
      and(eq(favorites.clientId, clientId), eq(favorites.readerId, readerId))
    );
  }

  async getFavorites(clientId: string): Promise<Favorite[]> {
    return db.select().from(favorites).where(eq(favorites.clientId, clientId));
  }

  async addNewsletterSubscription(email: string): Promise<void> {
    await db.insert(newsletterSubscriptions)
      .values({ email })
      .onConflictDoNothing({ target: newsletterSubscriptions.email });
  }
}

export const storage = new DatabaseStorage();
