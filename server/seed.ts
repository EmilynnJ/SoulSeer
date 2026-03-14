import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as schema from "../shared/schema";

const neonSql = neon(process.env.DATABASE_URL!);
const db = drizzle(neonSql, { schema });

async function seed() {
  console.log("Starting seed...");

  const existingAdmin = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, "admin@soulseer.app"))
    .limit(1);

  if (existingAdmin.length > 0) {
    console.log("Seed data already exists, skipping.");
    return;
  }

  const [admin] = await db
    .insert(schema.users)
    .values({
      email: "admin@soulseer.app",
      displayName: "SoulSeer Admin",
      role: "admin",
    })
    .returning();
  console.log("Admin created:", admin.id);

  const readerData = [
    {
      name: "Luna Starweaver",
      email: "luna@soulseer.app",
      bio: "Intuitive tarot reader with 15 years of experience. Specializing in love, career, and spiritual growth readings.",
      specialties: ["Tarot", "Love", "Career"],
      chatRate: "3.99",
      phoneRate: "5.99",
      videoRate: "7.99",
      status: "online" as const,
      rating: "4.85",
      totalReadings: 1247,
    },
    {
      name: "Mystic Raven",
      email: "raven@soulseer.app",
      bio: "Clairvoyant medium connecting you with spiritual guidance. Past life readings and energy healing specialist.",
      specialties: ["Mediumship", "Past Lives", "Energy Healing"],
      chatRate: "4.99",
      phoneRate: "6.99",
      videoRate: "8.99",
      status: "online" as const,
      rating: "4.92",
      totalReadings: 982,
    },
    {
      name: "Celeste Moon",
      email: "celeste@soulseer.app",
      bio: "Astrology and numerology expert. Let the stars guide your path to clarity and purpose.",
      specialties: ["Astrology", "Numerology", "Life Path"],
      chatRate: "3.49",
      phoneRate: "4.99",
      videoRate: "6.99",
      status: "offline" as const,
      rating: "4.78",
      totalReadings: 756,
    },
    {
      name: "Phoenix Sage",
      email: "phoenix@soulseer.app",
      bio: "Crystal healing and chakra balancing practitioner. Empathic readings for emotional clarity and healing.",
      specialties: ["Crystal Healing", "Chakra", "Empathic"],
      chatRate: "4.49",
      phoneRate: "5.49",
      videoRate: "7.49",
      status: "online" as const,
      rating: "4.90",
      totalReadings: 1103,
    },
    {
      name: "Aurora Whisper",
      email: "aurora@soulseer.app",
      bio: "Dream interpretation and angel card specialist. Messages from your guides delivered with compassion.",
      specialties: ["Dream Interpretation", "Angel Cards", "Guides"],
      chatRate: "3.99",
      phoneRate: "5.99",
      videoRate: "7.99",
      status: "busy" as const,
      rating: "4.88",
      totalReadings: 892,
    },
  ];

  for (const r of readerData) {
    const [user] = await db
      .insert(schema.users)
      .values({
        email: r.email,
        displayName: r.name,
        role: "reader",
      })
      .returning();

    await db.insert(schema.readerProfiles).values({
      userId: user.id,
      bio: r.bio,
      specialties: r.specialties,
      chatRate: r.chatRate,
      phoneRate: r.phoneRate,
      videoRate: r.videoRate,
      status: r.status,
      rating: r.rating,
      totalReadings: r.totalReadings,
      weeklyAvailability: {
        monday: { start: "09:00", end: "17:00" },
        tuesday: { start: "09:00", end: "17:00" },
        wednesday: { start: "09:00", end: "17:00" },
        thursday: { start: "09:00", end: "17:00" },
        friday: { start: "09:00", end: "17:00" },
        saturday: { start: "10:00", end: "14:00" },
        sunday: null,
      },
    });

    console.log("Reader created:", r.name, user.id);
  }

  const categoryData = [
    { name: "General Discussion", description: "Open discussion about all things spiritual", sortOrder: 0 },
    { name: "Tarot & Oracle", description: "Discuss tarot spreads, decks, and readings", sortOrder: 1 },
    { name: "Astrology", description: "Star signs, charts, and celestial events", sortOrder: 2 },
    { name: "Meditation & Healing", description: "Share techniques and experiences", sortOrder: 3 },
    { name: "Reader Insights", description: "Content from our gifted readers", sortOrder: 4 },
  ];

  const insertedCategories = await db
    .insert(schema.forumCategories)
    .values(categoryData)
    .returning();
  console.log("Forum categories created:", insertedCategories.length);

  const allReaders = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.role, "reader"));

  const postData = [
    {
      categoryId: insertedCategories[0].id,
      authorId: allReaders[0].id,
      title: "Welcome to the SoulSeer Community!",
      content:
        "We are so excited to have you here. This is a safe space for all seekers on their spiritual journey. Share, learn, and grow with us.",
      isPinned: true,
    },
    {
      categoryId: insertedCategories[1].id,
      authorId: allReaders[1].id,
      title: "Full Moon Tarot Spread for March",
      content:
        "The full moon in Virgo brings clarity and healing energy. Try this 5-card spread to channel its energy: 1. What needs releasing, 2. What to embrace, 3. Hidden truth, 4. Guidance from spirit, 5. Outcome if followed.",
      isPinned: false,
    },
    {
      categoryId: insertedCategories[2].id,
      authorId: allReaders[2].id,
      title: "Mercury Retrograde Survival Guide",
      content:
        "Mercury retrograde is upon us again. Here are my top tips for navigating this tricky transit with grace and minimal tech failures.",
      isPinned: false,
    },
  ];

  const insertedPosts = await db
    .insert(schema.forumPosts)
    .values(postData)
    .returning();
  console.log("Forum posts created:", insertedPosts.length);

  console.log("Seed completed successfully.");
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
