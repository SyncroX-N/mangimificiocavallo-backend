import { faker } from "@faker-js/faker";
import database from "..";
import {
  ageRestrictionEnum,
  contentStatusEnum,
  dressCodeEnum,
  locationTypeEnum,
  mealServiceEnum,
  noiseLevelEnum,
  priceLevelEnum,
  reservationPolicyEnum,
  visibilityEnum,
} from "../schema/enums";
import type { area } from "../schema/location/area";
import { location } from "../schema/location/location";
import { locationTag, type tag } from "../schema/tag/tag";
import { CONFIG } from "./config";
import {
  generateOpeningHours,
  pickRandom,
  pickRandomMultiple,
  slugify,
} from "./utils";

export async function seedLocations(
  cityId: string,
  areas: (typeof area.$inferSelect)[],
  tags: (typeof tag.$inferSelect)[]
) {
  console.log("\n📍 Seeding locations...");

  const locations: (typeof location.$inferSelect)[] = [];
  const locationNames = new Set<string>();

  for (let i = 0; i < CONFIG.counts.locations; i += 1) {
    const name = generateUniqueName(locationNames);
    locationNames.add(name);

    const slug = `${slugify(name)}-${i + 1}`;
    const selectedArea = pickRandom(areas);
    const { latitude, longitude } = generateLondonCoordinates();

    const [newLocation] = await database
      .insert(location)
      .values({
        name,
        slug,
        type: pickRandom(locationTypeEnum.enumValues),
        status: pickWeightedStatus(),
        visibility: pickWeightedVisibility(),
        brandName: faker.datatype.boolean({ probability: 0.2 })
          ? faker.company.name()
          : null,
        addressLine1: faker.location.streetAddress(),
        addressLine2: faker.datatype.boolean({ probability: 0.3 })
          ? faker.location.secondaryAddress()
          : null,
        neighborhood: selectedArea.name,
        cityId,
        areaId: selectedArea.id,
        postalCode: faker.location.zipCode("?# #??"),
        latitude,
        longitude,
        phoneNumber: faker.phone.number({ style: "national" }),
        email: faker.internet.email({ provider: "restaurant.com" }),
        websiteUrl: faker.internet.url(),
        bookingUrl: faker.datatype.boolean({ probability: 0.6 })
          ? faker.internet.url()
          : null,
        instagramHandle: faker.datatype.boolean({ probability: 0.7 })
          ? `@${slugify(name).replace(/-/g, "_")}`
          : null,
        googlePlaceId: faker.datatype.boolean({ probability: 0.5 })
          ? `ChIJ${faker.string.alphanumeric(22)}`
          : null,
        shortDescription: faker.lorem.sentence({ min: 8, max: 15 }),
        detailedDescription: faker.lorem.paragraphs({ min: 2, max: 4 }),
        isWheelchairAccessible: faker.datatype.boolean({ probability: 0.6 }),
        isDogFriendly: faker.datatype.boolean({ probability: 0.3 }),
        priceLevel: pickRandom(priceLevelEnum.enumValues),
        averageSpendPerPerson: faker.number
          .float({ min: 15, max: 150, fractionDigits: 2 })
          .toString(),
        currency: "GBP",
        mealServices: pickRandomMultiple(mealServiceEnum.enumValues, 1, 4),
        openingHours: generateOpeningHours(),
        isTemporarilyClosed: faker.datatype.boolean({ probability: 0.05 }),
        noiseLevel: pickRandom(noiseLevelEnum.enumValues),
        dressCode: pickRandom(dressCodeEnum.enumValues),
        ageRestriction: pickWeightedAgeRestriction(),
        reservationPolicy: pickRandom(reservationPolicyEnum.enumValues),
        averageRating: faker.number
          .float({ min: 3.0, max: 5.0, fractionDigits: 1 })
          .toString(),
        reviewCount: faker.number.int({ min: 5, max: 500 }),
        popularityScore: faker.number
          .float({ min: 0.1, max: 10.0, fractionDigits: 4 })
          .toString(),
        createdAt: faker.date.past({ years: 2 }),
        updatedAt: new Date(),
      })
      .returning();

    locations.push(newLocation);

    // Add random tags
    const selectedTags = pickRandomMultiple(tags, 2, 6);
    for (const t of selectedTags) {
      await database
        .insert(locationTag)
        .values({
          locationId: newLocation.id,
          tagId: t.id,
          createdAt: new Date(),
        })
        .onConflictDoNothing();
    }

    console.log(`   ✅ Created location: ${name}`);
  }

  console.log(`   📍 Created ${locations.length} locations`);
  return locations;
}

function generateUniqueName(existingNames: Set<string>): string {
  let name: string;
  do {
    const prefix = faker.helpers.arrayElement([
      "The",
      "",
      "Le",
      "La",
      "El",
      "Il",
    ]);
    const noun = faker.helpers.arrayElement([
      faker.animal.type(),
      faker.color.human(),
      faker.word.noun(),
      faker.person.lastName(),
    ]);
    const suffix = faker.helpers.arrayElement([
      "Kitchen",
      "Table",
      "Room",
      "House",
      "Bistro",
      "Grill",
      "Bar",
      "Cafe",
      "Restaurant",
      "",
    ]);
    name = [prefix, `${noun.charAt(0).toUpperCase()}${noun.slice(1)}`, suffix]
      .filter(Boolean)
      .join(" ");
  } while (existingNames.has(name));
  return name;
}

function generateLondonCoordinates() {
  const baseLat = 51.5074;
  const baseLng = -0.1278;
  return {
    latitude: baseLat + faker.number.float({ min: -0.1, max: 0.1 }),
    longitude: baseLng + faker.number.float({ min: -0.15, max: 0.15 }),
  };
}

function pickWeightedStatus() {
  return faker.helpers.weightedArrayElement([
    { weight: 80, value: contentStatusEnum.enumValues[1] }, // published
    { weight: 15, value: contentStatusEnum.enumValues[0] }, // draft
    { weight: 5, value: contentStatusEnum.enumValues[2] }, // archived
  ]);
}

function pickWeightedVisibility() {
  return faker.helpers.weightedArrayElement([
    { weight: 90, value: visibilityEnum.enumValues[0] }, // public
    { weight: 10, value: visibilityEnum.enumValues[1] }, // private
  ]);
}

function pickWeightedAgeRestriction() {
  return faker.helpers.weightedArrayElement([
    { weight: 70, value: ageRestrictionEnum.enumValues[0] }, // none
    { weight: 20, value: ageRestrictionEnum.enumValues[1] }, // 18_plus
    { weight: 10, value: ageRestrictionEnum.enumValues[2] }, // 21_plus
  ]);
}
