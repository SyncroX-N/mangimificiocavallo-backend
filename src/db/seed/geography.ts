import { eq } from "drizzle-orm";
import database from "..";
import { area } from "../schema/location/area";
import { city } from "../schema/location/city";
import { country } from "../schema/location/country";
import { CONFIG, LONDON_AREAS } from "./config";
import { slugify } from "./utils";

export async function seedCountryAndCity() {
  console.log("\n🌍 Seeding country and city...");

  // Create UK country
  const [existingCountry] = await database
    .select()
    .from(country)
    .where(eq(country.code, "GB"))
    .limit(1);

  let uk = existingCountry;
  if (uk) {
    console.log("   ⚠️  Country United Kingdom already exists");
  } else {
    const [newCountry] = await database
      .insert(country)
      .values({
        code: "GB",
        name: "United Kingdom",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    uk = newCountry;
    console.log("   ✅ Created country: United Kingdom");
  }

  // Create London city
  const [existingCity] = await database
    .select()
    .from(city)
    .where(eq(city.slug, "london"))
    .limit(1);

  let london = existingCity;
  if (london) {
    console.log("   ⚠️  City London already exists");
  } else {
    const [newCity] = await database
      .insert(city)
      .values({
        name: "London",
        slug: "london",
        countryId: uk.id,
        latitude: 51.5074,
        longitude: -0.1278,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    london = newCity;
    console.log("   ✅ Created city: London");
  }

  return { country: uk, city: london };
}

export async function seedAreas(cityId: string) {
  console.log("\n📍 Seeding areas...");

  const areas: (typeof area.$inferSelect)[] = [];

  for (const areaName of LONDON_AREAS.slice(0, CONFIG.counts.areas)) {
    const slug = slugify(areaName);

    const [existingArea] = await database
      .select()
      .from(area)
      .where(eq(area.slug, slug))
      .limit(1);

    if (existingArea) {
      areas.push(existingArea);
      console.log(`   ⚠️  Area ${areaName} already exists`);
    } else {
      const [newArea] = await database
        .insert(area)
        .values({
          name: areaName,
          slug,
          cityId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      areas.push(newArea);
      console.log(`   ✅ Created area: ${areaName}`);
    }
  }

  return areas;
}
