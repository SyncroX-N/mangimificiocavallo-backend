import { faker } from "@faker-js/faker";
import database from "..";
import {
  contentStatusEnum,
  eventTypeEnum,
  visibilityEnum,
} from "../schema/enums";
import { event } from "../schema/event/event";
import type { location } from "../schema/location/location";
import { CONFIG } from "./config";
import { pickRandom, slugify } from "./utils";

export async function seedEvents(locations: (typeof location.$inferSelect)[]) {
  console.log("\n🎉 Seeding events...");

  const events: (typeof event.$inferSelect)[] = [];
  const eventNames = new Set<string>();

  for (let i = 0; i < CONFIG.counts.events; i += 1) {
    const name = generateUniqueEventName(eventNames);
    eventNames.add(name);

    const slug = `${slugify(name)}-${i + 1}`;
    const { startDate, endDate } = generateEventDates();
    const selectedLocation = pickRandom(locations);

    const [newEvent] = await database
      .insert(event)
      .values({
        name,
        slug,
        type: pickRandom(eventTypeEnum.enumValues),
        status: pickWeightedStatus(),
        visibility: pickWeightedVisibility(),
        startDate,
        endDate,
        shortDescription: faker.lorem.sentence({ min: 8, max: 15 }),
        detailedDescription: faker.lorem.paragraphs({ min: 2, max: 4 }),
        isWheelchairAccessible: faker.datatype.boolean({ probability: 0.6 }),
        locationId: selectedLocation.id,
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: new Date(),
      })
      .returning();

    events.push(newEvent);
    console.log(`   ✅ Created event: ${name}`);
  }

  console.log(`   🎉 Created ${events.length} events`);
  return events;
}

function generateUniqueEventName(existingNames: Set<string>): string {
  let name: string;
  do {
    const eventType = pickRandom(eventTypeEnum.enumValues);
    const adjective = faker.helpers.arrayElement([
      "Annual",
      "Grand",
      "Ultimate",
      "Classic",
      "Live",
      "Special",
      "Exclusive",
      "",
    ]);
    const noun = faker.helpers.arrayElement([
      `${eventType.charAt(0).toUpperCase()}${eventType.slice(1)}`,
      "Night",
      "Show",
      "Festival",
      "Experience",
      "Session",
      "Showcase",
    ]);
    const suffix = faker.helpers.arrayElement([
      faker.date.month(),
      faker.number.int({ min: 2020, max: 2025 }).toString(),
      faker.location.city(),
      "",
    ]);
    name = [adjective, noun, suffix].filter(Boolean).join(" ");
  } while (existingNames.has(name));
  return name;
}

function generateEventDates() {
  const startDate = faker.date.soon({ days: 180 });
  const durationHours = faker.number.int({ min: 2, max: 8 });
  const endDate = new Date(
    startDate.getTime() + durationHours * 60 * 60 * 1000
  );
  return { startDate, endDate };
}

function pickWeightedStatus() {
  return faker.helpers.weightedArrayElement([
    { weight: 70, value: contentStatusEnum.enumValues[1] }, // published
    { weight: 20, value: contentStatusEnum.enumValues[0] }, // draft
    { weight: 10, value: contentStatusEnum.enumValues[2] }, // archived
  ]);
}

function pickWeightedVisibility() {
  return faker.helpers.weightedArrayElement([
    { weight: 85, value: visibilityEnum.enumValues[0] }, // public
    { weight: 15, value: visibilityEnum.enumValues[1] }, // private
  ]);
}
