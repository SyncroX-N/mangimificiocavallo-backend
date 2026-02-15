import { CONFIG } from "./config";
import { seedOrganization, seedOrganizationOwner } from "./users";

async function main() {
  console.log("🌱 Starting database seed...\n");
  printConfig();

  try {
    const org = await seedOrganization();
    await seedOrganizationOwner(org);

    printSummary();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Seed failed:", error);
    process.exit(1);
  }
}

function printConfig() {
  console.log("Configuration:");
  console.log(`   Organization: ${CONFIG.organization.name}`);
  console.log(
    `   Owner: ${CONFIG.owner.firstName} ${CONFIG.owner.lastName} (${CONFIG.owner.email})`
  );
}

function printSummary() {
  console.log(`\n${"=".repeat(60)}`);
  console.log("🎉 Seed completed successfully!");
  console.log(`${"=".repeat(60)}`);
  console.log("\n📋 Summary:");
  console.log(`   ✅ 1 Organization (${CONFIG.organization.name})`);
  console.log(
    `   ✅ 1 Owner (${CONFIG.owner.firstName} ${CONFIG.owner.lastName} - ${CONFIG.owner.email})`
  );
  console.log("\n🔑 Login Credentials:");
  console.log(`   Password for all users: ${CONFIG.password}`);
}

main();
