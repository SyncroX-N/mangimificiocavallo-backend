import { CONFIG } from "./config";
import { seedEvents } from "./events";
import { seedAreas, seedCountryAndCity } from "./geography";
import { seedLocations } from "./locations";
import { seedRequests } from "./requests";
import { seedTagCategories, seedTags } from "./tags";
import { seedOrganization, seedOrganizationUsers } from "./users";

async function main() {
  console.log("🌱 Starting comprehensive database seed...\n");
  printConfig();

  try {
    // 1. Seed organization
    const org = await seedOrganization();

    // 2. Seed organization users (owner, admins, members)
    await seedOrganizationUsers(org);

    // 3. Seed normal users (no organization)
    // await seedNormalUsers();

    // 4. Seed location dependencies (country, city, areas)
    const { city: london } = await seedCountryAndCity();
    const areas = await seedAreas(london.id);

    // 5. Seed tag categories and tags
    const categories = await seedTagCategories();
    const tags = await seedTags(categories);

    // 6. Seed locations
    const locations = await seedLocations(london.id, areas, tags);

    // 7. Seed events
    await seedEvents(locations);

    // 8. Seed requests with items and options
    await seedRequests();

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
  console.log(`   Owners: ${CONFIG.counts.owners}`);
  console.log(`   Admins: ${CONFIG.counts.admins}`);
  console.log(`   Members: ${CONFIG.counts.members}`);
  console.log(`   Normal Users: ${CONFIG.counts.normalUsers}`);
  console.log(`   Locations: ${CONFIG.counts.locations}`);
  console.log(`   Events: ${CONFIG.counts.events}`);
  console.log(`   Tags: ${CONFIG.counts.tags}`);
}

function printSummary() {
  console.log(`\n${"=".repeat(60)}`);
  console.log("🎉 Seed completed successfully!");
  console.log(`${"=".repeat(60)}`);
  console.log("\n📋 Summary:");
  console.log(`   ✅ 1 Organization (${CONFIG.organization.name})`);
  console.log(`   ✅ ${CONFIG.counts.owners} Owner`);
  console.log(`   ✅ ${CONFIG.counts.admins} Admins`);
  console.log(`   ✅ ${CONFIG.counts.members} Members`);
  console.log(`   ✅ ${CONFIG.counts.normalUsers} Normal Users`);
  console.log(`   ✅ ${CONFIG.counts.areas} Areas`);
  console.log(`   ✅ ${CONFIG.counts.tagCategories} Tag Categories`);
  console.log(`   ✅ ${CONFIG.counts.tags} Tags`);
  console.log(`   ✅ ${CONFIG.counts.locations} Locations`);
  console.log(`   ✅ ${CONFIG.counts.events} Events`);
  console.log("   ✅ 10 Requests with items and options");

  console.log("\n🔑 Login Credentials:");
  console.log(`   Password for all users: ${CONFIG.password}`);
  console.log("\n   Organization Users:");
  console.log("   Email format: firstname.lastname@bflexion.com");
  console.log("   Check database for generated emails");
}

main();
