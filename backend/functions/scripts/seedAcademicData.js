/**
 * Seed academic data into Firestore
 * Run: node scripts/seedAcademicData.js
 */

const admin = require("firebase-admin");

// Use Firestore emulator if running locally
if (process.env.FIRESTORE_EMULATOR_HOST === undefined) {
  console.log(
    "⚠️  FIRESTORE_EMULATOR_HOST not set. Connecting to emulator at localhost:8080",
  );
  process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
}

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "demiguard-3b4e8", // Your project ID from .firebaserc
  });
}

const db = admin.firestore();

async function seedDeadlines() {
  console.log("Seeding deadlines...");

  const deadlines = [
    {
      type: "assignment",
      title: "Mobile App Project Submission",
      module: "CS301",
      dueDate: new Date("2026-03-15T23:59:00Z"),
      description: "Submit final app with documentation",
    },
    {
      type: "assignment",
      title: "AI Assignment - Neural Networks",
      module: "CS302",
      dueDate: new Date("2026-03-20T23:59:00Z"),
      description: "Build and train a CNN model",
    },
    {
      type: "payment",
      title: "Semester Fee Payment Deadline",
      dueDate: new Date("2026-02-28T23:59:00Z"),
      amount: 250000,
      description: "Pay semester fees to avoid late penalties",
    },
    {
      type: "module_registration",
      title: "Module Registration (Normal)",
      startDate: new Date("2026-01-20T00:00:00Z"),
      endDate: new Date("2026-02-10T23:59:00Z"),
      description: "Register for modules for Semester 1",
    },
    {
      type: "module_registration",
      title: "Prorata Module Registration",
      startDate: new Date("2026-02-11T00:00:00Z"),
      endDate: new Date("2026-02-25T23:59:00Z"),
      description: "Late registration with additional fee",
      prorata_fee: 5000,
    },
    {
      type: "group_registration",
      title: "Final Year Project Group Formation",
      module: "CS401",
      dueDate: new Date("2026-02-25T23:59:00Z"),
      minGroupSize: 2,
      maxGroupSize: 3,
      description: "Form groups for final year project",
    },
    {
      type: "assignment",
      title: "Database Design Project",
      module: "CS303",
      dueDate: new Date("2026-03-10T23:59:00Z"),
      description: "Submit ER diagram and SQL implementation",
    },
  ];

  for (const deadline of deadlines) {
    await db.collection("deadlines").add(deadline);
    console.log(`  ✓ Added: ${deadline.title}`);
  }

  console.log("✓ Deadlines seeded successfully!\n");
}

async function seedModules() {
  console.log("Seeding modules...");

  const modules = [
    {
      code: "CS301",
      name: "Mobile Development",
      credits: 3,
      semester: 1,
      year: 3,
      lic: {
        name: "Dr. Alan Silva",
        email: "alan.silva@university.edu",
        phone: "+94-11-2877000",
        office: "Room 405, Tech Building",
        availability: "Monday-Wednesday 2:00 PM - 4:00 PM",
      },
      description: "Introduction to Android and iOS development",
    },
    {
      code: "CS302",
      name: "Artificial Intelligence & Machine Learning",
      credits: 4,
      semester: 1,
      year: 3,
      lic: {
        name: "Prof. Nirmala Fernando",
        email: "nirmala.fernando@university.edu",
        phone: "+94-11-2877010",
        office: "Room 301, AI Lab",
        availability: "Tuesday-Thursday 10:00 AM - 12:00 PM",
      },
      description: "Deep learning, neural networks, and ML algorithms",
    },
    {
      code: "CS303",
      name: "Database Systems",
      credits: 3,
      semester: 1,
      year: 3,
      lic: {
        name: "Mr. Kasun Perera",
        email: "kasun.perera@university.edu",
        phone: "+94-11-2877020",
        office: "Room 210, Computing Building",
        availability: "Monday-Friday 9:00 AM - 11:00 AM",
      },
      description: "Relational databases, SQL, and NoSQL systems",
    },
    {
      code: "CS401",
      name: "Final Year Project",
      credits: 6,
      semester: 1,
      year: 4,
      lic: {
        name: "Dr. Chaminda Wijesinghe",
        email: "chaminda.w@university.edu",
        phone: "+94-11-2877030",
        office: "Room 500, Project Supervision Wing",
        availability: "By appointment only",
      },
      description: "Individual/group research and development project",
    },
    {
      code: "CS304",
      name: "Software Engineering",
      credits: 3,
      semester: 1,
      year: 3,
      lic: {
        name: "Ms. Dilini Rajapaksha",
        email: "dilini.r@university.edu",
        phone: "+94-11-2877040",
        office: "Room 305, Engineering Wing",
        availability: "Wednesday-Friday 1:00 PM - 3:00 PM",
      },
      description:
        "Agile methodologies, design patterns, and project management",
    },
  ];

  for (const module of modules) {
    await db.collection("modules").doc(module.code).set(module);
    console.log(`  ✓ Added: ${module.code} - ${module.name}`);
  }

  console.log("✓ Modules seeded successfully!\n");
}

async function seedGroupRegistration() {
  console.log("Seeding group registration periods...");

  const groupRegistrations = [
    {
      title: "Final Year Project Group Registration",
      module: "CS401",
      registrationStart: new Date("2026-02-01T00:00:00Z"),
      registrationEnd: new Date("2026-02-25T23:59:00Z"),
      maxGroupSize: 3,
      minGroupSize: 2,
      description: "Form groups for final year project (CS401)",
    },
    {
      title: "Database Project Group Registration",
      module: "CS303",
      registrationStart: new Date("2026-02-05T00:00:00Z"),
      registrationEnd: new Date("2026-02-20T23:59:00Z"),
      maxGroupSize: 4,
      minGroupSize: 2,
      description: "Groups for database design project",
    },
  ];

  for (const registration of groupRegistrations) {
    await db.collection("groupRegistration").add(registration);
    console.log(`  ✓ Added: ${registration.title}`);
  }

  console.log("✓ Group registrations seeded successfully!\n");
}

async function main() {
  try {
    console.log("\n🌱 Starting Firestore seeding...\n");

    await seedDeadlines();
    await seedModules();
    await seedGroupRegistration();

    console.log("✅ All data seeded successfully!");
    console.log("\nYou can now:");
    console.log("  1. Check Firebase Console to verify the data");
    console.log("  2. Test the chatbot with questions like:");
    console.log("     - 'When is the payment deadline?'");
    console.log("     - 'Who is the lecturer for CS301?'");
    console.log("     - 'What is the email of Dr. Alan Silva?'");
    console.log("     - 'When is module registration?'\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  }
}

main();
