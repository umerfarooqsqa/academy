// Realistic fixture data across every model, for local development and manual
// dashboard testing. The operator maintains real AreaZone/Campaign/Tutor/
// ParentRequest data from the dashboard once live (CLAUDE.md Section 7);
// everything here is clearly fictional example data.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ZONES: Array<{ name: string; latitude: number; longitude: number; maxKm?: number }> = [
  { name: "North Nazimabad", latitude: 24.9425, longitude: 67.0384 },
  { name: "Gulshan-e-Iqbal", latitude: 24.9204, longitude: 67.0971 },
  { name: "Clifton", latitude: 24.8138, longitude: 67.0299 },
  { name: "DHA", latitude: 24.7913, longitude: 67.0673 },
  { name: "Malir", latitude: 24.8936, longitude: 67.2075, maxKm: 8 },
  { name: "Nazimabad", latitude: 24.9127, longitude: 67.0281 },
  { name: "PECHS", latitude: 24.8709, longitude: 67.0611 },
];

async function main() {
  console.log("Seeding zones…");
  for (const zone of ZONES) {
    await prisma.areaZone.upsert({ where: { name: zone.name }, update: {}, create: zone });
  }

  console.log("Seeding campaigns…");
  const campA = await prisma.campaign.upsert({
    where: { metaAdId: "META-AD-001" },
    update: { platform: "facebook", subjectGroup: "pre_medical" },
    create: {
      name: "Meta Ads - North Nazimabad - Audience A (exam-prep interest)",
      channel: "meta_ads",
      area: "North Nazimabad",
      audienceNote: "exam-prep interest, ages 30-50",
      platform: "facebook",
      subjectGroup: "pre_medical",
      metaAdId: "META-AD-001",
    },
  });
  const campB = await prisma.campaign.upsert({
    where: { metaAdId: "META-AD-002" },
    update: { platform: "facebook", subjectGroup: "pre_engineering" },
    create: {
      name: "Meta Ads - North Nazimabad - Audience B (parents 30-45)",
      channel: "meta_ads",
      area: "North Nazimabad",
      audienceNote: "broad parents 30-45, no interest targeting",
      platform: "facebook",
      subjectGroup: "pre_engineering",
      metaAdId: "META-AD-002",
    },
  });
  const campReferral = await prisma.campaign.create({
    data: { name: "Tutor referral program", channel: "tutor_referral", audienceNote: "existing tutors referring peers" },
  });
  const campGulshanCS = await prisma.campaign.upsert({
    where: { metaAdId: "META-AD-003" },
    update: { platform: "tiktok", subjectGroup: "computer" },
    create: {
      name: "Meta Ads - Gulshan - Computer Science",
      channel: "meta_ads",
      area: "Gulshan-e-Iqbal",
      audienceNote: "university students, coding bootcamp interest",
      platform: "tiktok",
      subjectGroup: "computer",
      metaAdId: "META-AD-003",
    },
  });

  console.log("Seeding marketing spend…");
  await prisma.marketingSpend.createMany({
    data: [
      { campaignId: campA.id, channel: "meta_ads", area: "North Nazimabad", platform: "facebook", subjectGroup: "pre_medical", amount: 8000, spentOn: daysAgo(20) },
      { campaignId: campA.id, channel: "meta_ads", area: "North Nazimabad", platform: "facebook", subjectGroup: "pre_medical", amount: 6000, spentOn: daysAgo(10) },
      { campaignId: campB.id, channel: "meta_ads", area: "North Nazimabad", platform: "facebook", subjectGroup: "pre_engineering", amount: 5000, spentOn: daysAgo(18) },
      { campaignId: campReferral.id, channel: "tutor_referral", amount: 2000, spentOn: daysAgo(15), notes: "referral bonus payout" },
      { campaignId: null, channel: "organic_post", platform: "facebook", amount: 0, spentOn: daysAgo(5), notes: "Facebook group post — no spend" },
      // Illustrative "supply + spend, no conversions yet" row for the marketing
      // balance sheet (2026-10 planning session) — spend exists, no leads/
      // conversions attributed to it yet, demonstrating that row type on first load.
      { campaignId: campGulshanCS.id, channel: "meta_ads", area: "Gulshan-e-Iqbal", platform: "tiktok", subjectGroup: "computer", amount: 3000, spentOn: daysAgo(3) },
    ],
  });

  console.log("Seeding tutors…");
  const tutorDefs = [
    {
      whatsappId: "923001110001",
      name: "Ayesha Khan",
      qualification: "MBBS student, A-levels (Biology, Chemistry, Physics — A*AA)",
      subjects: ["Biology", "Chemistry"],
      subjectGroup: "pre_medical",
      curriculum: "Cambridge A-levels",
      gradesBySubject: { Biology: "A+", Chemistry: "A" },
      area: "North Nazimabad",
      availability: ["weekday_evening", "weekend_morning"],
      expectedFee: 18000,
      tier: "premium" as const,
      rating: 4.8,
      ratingCount: 12,
    },
    {
      whatsappId: "923001110002",
      name: "Bilal Ahmed",
      qualification: "BE Electrical Engineering",
      subjects: ["Physics", "Mathematics"],
      subjectGroup: "pre_engineering",
      curriculum: "FSc Pre-Engineering",
      gradesBySubject: { Physics: "A", Mathematics: "A+" },
      area: "North Nazimabad",
      availability: ["weekday_evening"],
      expectedFee: 15000,
      tier: "free" as const,
      rating: 4.2,
      ratingCount: 5,
    },
    {
      whatsappId: "923001110003",
      name: "Sara Malik",
      qualification: "BS Computer Science",
      subjects: ["Computer Science", "Mathematics"],
      subjectGroup: "computer",
      curriculum: "BS Computer Science",
      gradesBySubject: { "Computer Science": "A" },
      area: "Gulshan-e-Iqbal",
      availability: ["weekend_afternoon", "weekend_evening"],
      expectedFee: 20000,
      tier: "premium" as const,
      radiusOverrideKm: 15,
      rating: 4.5,
      ratingCount: 8,
    },
    {
      whatsappId: "923001110004",
      name: "Hassan Raza",
      qualification: "A-levels + IELTS trainer",
      subjects: ["English", "Biology"],
      subjectGroup: "pre_medical",
      curriculum: "Cambridge A-levels",
      gradesBySubject: {},
      area: "Clifton",
      availability: ["weekday_afternoon"],
      expectedFee: null,
      tier: "free" as const,
      rating: 0,
      ratingCount: 0,
      status: "pending" as const,
    },
    {
      whatsappId: "923001110005",
      name: "Fatima Sheikh",
      qualification: "Graphic Design diploma",
      subjects: ["Graphic Design", "Adobe Illustrator"],
      subjectGroup: "skills",
      curriculum: "Vocational — Graphic Design",
      gradesBySubject: {},
      area: "DHA",
      availability: ["weekend_morning"],
      expectedFee: 12000,
      tier: "free" as const,
      rating: 4.0,
      ratingCount: 2,
    },
    {
      whatsappId: "923001110006",
      name: "Omar Farooq",
      qualification: "BBA, university tutor",
      subjects: ["Economics", "Accounting"],
      subjectGroup: "university_level",
      curriculum: "BBA coursework",
      gradesBySubject: { Economics: "A-" },
      area: "PECHS",
      availability: ["weekday_evening", "weekend_evening"],
      expectedFee: 25000,
      tier: "free" as const,
      rating: 3.6,
      ratingCount: 3,
    },
    {
      whatsappId: "923001110007",
      name: "Zainab Iqbal",
      qualification: "A-levels, Chemistry specialist",
      subjects: ["Chemistry", "Biology"],
      subjectGroup: "pre_medical",
      curriculum: "Cambridge A-levels",
      gradesBySubject: { Chemistry: "A+", Biology: "A" },
      area: "Malir",
      availability: ["weekday_morning"],
      expectedFee: 14000,
      tier: "free" as const,
      rating: 4.1,
      ratingCount: 6,
    },
  ];

  const tutors = [];
  for (const t of tutorDefs) {
    const { tier, radiusOverrideKm, status, ...rest } = t as typeof t & { radiusOverrideKm?: number; status?: string };
    const tutor = await prisma.tutor.upsert({
      where: { whatsappId: t.whatsappId },
      update: {},
      create: {
        ...rest,
        radiusOverrideKm: radiusOverrideKm ?? null,
        status: status ?? "active",
        campaignId: t.area === "North Nazimabad" ? campA.id : campReferral.id,
        rawMessage: "(seeded fixture data)",
      },
    });
    tutors.push({ tutor, tier });
  }

  console.log("Seeding tutor subscriptions for premium tutors…");
  for (const { tutor, tier } of tutors) {
    if (tier === "premium") {
      await prisma.tutorSubscription.create({
        data: {
          tutorId: tutor.id,
          status: "active",
          amount: 3000,
          paymentMethod: "JazzCash manual transfer",
          periodStart: daysAgo(10),
          periodEnd: daysFromNow(20),
        },
      });
    }
  }
  // One lapsed subscription example — this tutor should show as free-tier live.
  await prisma.tutorSubscription.create({
    data: {
      tutorId: tutors[5].tutor.id, // Omar Farooq
      status: "lapsed",
      amount: 3000,
      paymentMethod: "bank transfer",
      periodStart: daysAgo(90),
      periodEnd: daysAgo(60),
    },
  });

  console.log("Seeding parent requests…");
  const parentDefs = [
    {
      whatsappId: "923009990001",
      studentInfo: "Daughter, O2 student",
      subjects: ["Biology", "Chemistry"],
      subjectGroup: "pre_medical",
      curriculum: "Cambridge A-levels",
      area: "North Nazimabad",
      budget: 18000,
      availability: ["weekday_evening"],
      campaignId: campA.id,
    },
    {
      whatsappId: "923009990002",
      studentInfo: "Son, FSc part 1",
      subjects: ["Physics", "Mathematics"],
      subjectGroup: "pre_engineering",
      curriculum: "FSc Pre-Engineering",
      area: "North Nazimabad",
      budget: null,
      availability: ["weekday_evening"],
      campaignId: campB.id,
      internalNote: "budget not provided — confirm with parent",
    },
    {
      whatsappId: "923009990003",
      studentInfo: "Self, learning to code",
      subjects: ["Computer Science"],
      subjectGroup: "computer",
      curriculum: "BS Computer Science",
      area: "Gulshan-e-Iqbal",
      budget: 22000,
      availability: ["weekend_afternoon"],
      campaignId: null,
    },
    {
      whatsappId: "923009990004",
      studentInfo: "Daughter, matric grade 9",
      subjects: ["Mathematics"],
      subjectGroup: "other",
      curriculum: "Matric",
      area: "Nazimabad",
      budget: 8000,
      availability: [],
      status: "closed" as const,
      internalNote: "declined at intake — out-of-scope curriculum",
    },
  ];

  const parents = [];
  for (const p of parentDefs) {
    const { status, internalNote, ...rest } = p as typeof p & { status?: string; internalNote?: string };
    const parent = await prisma.parentRequest.create({
      data: {
        ...rest,
        status: status ?? "pending",
        internalNote: internalNote ?? null,
        rawMessage: "(seeded fixture data)",
      },
    });
    parents.push(parent);
  }

  console.log("Seeding matches (various statuses through the full pipeline)…");

  // Match 1: awaiting_approval — fresh from the engine.
  await prisma.match.create({
    data: {
      parentRequestId: parents[1].id,
      tutorId: tutors[1].tutor.id, // Bilal Ahmed
      score: 0.74,
      status: "awaiting_approval",
      internalNote: "budget not provided — confirm with parent",
    },
  });

  // Match 2: approved, premium tutor notified, still within the delay window.
  await prisma.match.create({
    data: {
      parentRequestId: parents[0].id,
      tutorId: tutors[0].tutor.id, // Ayesha Khan (premium)
      score: 0.91,
      status: "approved",
      notifyAt: daysFromNow(0.02),
    },
  });

  // Match 3: approved, published to /opportunities (free tutor, past delay window).
  const publishedMatch = await prisma.match.create({
    data: {
      parentRequestId: parents[2].id,
      tutorId: tutors[2].tutor.id, // Sara Malik (premium, but simulate declined -> published)
      score: 0.82,
      status: "approved",
      opportunityCode: "OPP-4821",
      publishedToPageAt: daysAgo(1),
    },
  });

  // Match 4: full pipeline through to a completed, rated deal.
  const completedMatch = await prisma.match.create({
    data: {
      parentRequestId: parents[0].id,
      tutorId: tutors[6].tutor.id, // Zainab Iqbal
      score: 0.68,
      status: "completed",
      demoSlots: ["Fri 4pm", "Sat 11am", "Sun 5pm"],
      demoScheduledAt: daysAgo(35),
    },
  });
  await prisma.approvalLog.create({
    data: {
      matchId: completedMatch.id,
      action: "approved",
      before: { status: "awaiting_approval", score: 0.68 },
      after: { status: "approved", actor: "operator (seed)" },
    },
  });
  const payment = await prisma.payment.create({
    data: {
      matchId: completedMatch.id,
      amount: 14000,
      commission: 7000,
      tutorPayout: 7000,
      status: "paid_out",
      provider: "jazzcash",
      createdAt: daysAgo(33),
      ratingRequestedAt: daysAgo(3),
    },
  });
  await prisma.rating.create({
    data: { matchId: completedMatch.id, tutorId: tutors[6].tutor.id, stars: 5, comment: "Great with exam prep!" },
  });

  // Match 5: rejected example, for /logs.
  const rejectedMatch = await prisma.match.create({
    data: {
      parentRequestId: parents[1].id,
      tutorId: tutors[3].tutor.id, // Hassan Raza (pending status tutor — illustrative only)
      score: 0.4,
      status: "rejected",
    },
  });
  await prisma.approvalLog.create({
    data: {
      matchId: rejectedMatch.id,
      action: "rejected",
      before: { status: "awaiting_approval", score: 0.4 },
      after: { status: "rejected", actor: "operator (seed)", note: "area mismatch on manual check" },
    },
  });

  console.log("Seeded successfully:");
  console.log(`  zones: ${ZONES.length}`);
  console.log(`  campaigns: 3, marketing spend: 5`);
  console.log(`  tutors: ${tutors.length} (2 premium, 1 lapsed-premium-now-free)`);
  console.log(`  parents: ${parents.length}`);
  console.log(`  matches: 5 (awaiting_approval, approved x2, completed+paid+rated, rejected)`);
  console.log(`  published opportunity: ${publishedMatch.opportunityCode}`);
  console.log(`  payment: Rs ${payment.amount} (paid_out)`);
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}
function daysFromNow(n: number): Date {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
