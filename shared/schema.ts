import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  decimal,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["client", "reader", "admin"]);
export const readerStatusEnum = pgEnum("reader_status", [
  "online",
  "offline",
  "busy",
]);
export const sessionTypeEnum = pgEnum("session_type", [
  "chat",
  "phone",
  "video",
]);
export const sessionStatusEnum = pgEnum("session_status", [
  "pending",
  "active",
  "completed",
  "cancelled",
  "disputed",
]);
export const transactionTypeEnum = pgEnum("transaction_type", [
  "deposit",
  "reading_charge",
  "reader_payout",
  "refund",
  "platform_fee",
]);

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  auth0Id: text("auth0_id").unique(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  avatar: text("avatar"),
  role: userRoleEnum("role").notNull().default("client"),
  isActive: boolean("is_active").notNull().default(true),
  balance: decimal("balance", { precision: 10, scale: 2 })
    .notNull()
    .default("0.00"),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const readerProfiles = pgTable("reader_profiles", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  bio: text("bio"),
  specialties: text("specialties").array(),
  profileImage: text("profile_image"),
  chatRate: decimal("chat_rate", { precision: 6, scale: 2 })
    .notNull()
    .default("3.99"),
  phoneRate: decimal("phone_rate", { precision: 6, scale: 2 })
    .notNull()
    .default("5.99"),
  videoRate: decimal("video_rate", { precision: 6, scale: 2 })
    .notNull()
    .default("7.99"),
  status: readerStatusEnum("status").notNull().default("offline"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  totalReadings: integer("total_readings").notNull().default(0),
  totalEarnings: decimal("total_earnings", { precision: 12, scale: 2 })
    .notNull()
    .default("0.00"),
  pendingPayout: decimal("pending_payout", { precision: 10, scale: 2 })
    .notNull()
    .default("0.00"),
  stripeAccountId: text("stripe_account_id"),
  weeklyAvailability: jsonb("weekly_availability"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const readingSessions = pgTable("reading_sessions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  clientId: varchar("client_id")
    .notNull()
    .references(() => users.id),
  readerId: varchar("reader_id")
    .notNull()
    .references(() => users.id),
  readerProfileId: varchar("reader_profile_id")
    .notNull()
    .references(() => readerProfiles.id),
  type: sessionTypeEnum("type").notNull(),
  status: sessionStatusEnum("status").notNull().default("pending"),
  ratePerMinute: decimal("rate_per_minute", {
    precision: 6,
    scale: 2,
  }).notNull(),
  durationMinutes: integer("duration_minutes").default(0),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).default(
    "0.00"
  ),
  agoraChannelName: text("agora_channel_name"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  type: transactionTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  sessionId: varchar("session_id").references(() => readingSessions.id),
  stripePaymentId: text("stripe_payment_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id")
    .notNull()
    .references(() => readingSessions.id),
  clientId: varchar("client_id")
    .notNull()
    .references(() => users.id),
  readerId: varchar("reader_id")
    .notNull()
    .references(() => users.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  readerResponse: text("reader_response"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id")
    .notNull()
    .references(() => users.id),
  receiverId: varchar("receiver_id")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const forumCategories = pgTable("forum_categories", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const forumPosts = pgTable("forum_posts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id")
    .notNull()
    .references(() => forumCategories.id),
  authorId: varchar("author_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isPinned: boolean("is_pinned").notNull().default(false),
  isFlagged: boolean("is_flagged").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const forumReplies = pgTable("forum_replies", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  postId: varchar("post_id")
    .notNull()
    .references(() => forumPosts.id),
  authorId: varchar("author_id")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  isFlagged: boolean("is_flagged").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const favorites = pgTable("favorites", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  clientId: varchar("client_id")
    .notNull()
    .references(() => users.id),
  readerId: varchar("reader_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const newsletterSubscriptions = pgTable("newsletter_subscriptions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});
export const insertReaderProfileSchema = createInsertSchema(
  readerProfiles
).omit({ id: true, createdAt: true });
export const insertSessionSchema = createInsertSchema(readingSessions).omit({
  id: true,
  createdAt: true,
});
export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});
export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});
export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});
export const insertForumPostSchema = createInsertSchema(forumPosts).omit({
  id: true,
  createdAt: true,
});
export const insertForumReplySchema = createInsertSchema(forumReplies).omit({
  id: true,
  createdAt: true,
});
export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});
export const insertNewsletterSchema = createInsertSchema(
  newsletterSubscriptions
).omit({ id: true, createdAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertReaderProfile = z.infer<typeof insertReaderProfileSchema>;
export type ReaderProfile = typeof readerProfiles.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type ReadingSession = typeof readingSessions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertForumPost = z.infer<typeof insertForumPostSchema>;
export type ForumPost = typeof forumPosts.$inferSelect;
export type InsertForumReply = z.infer<typeof insertForumReplySchema>;
export type ForumReply = typeof forumReplies.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;
export type ForumCategory = typeof forumCategories.$inferSelect;
