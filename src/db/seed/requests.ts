import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import database from "..";
import { member } from "../schema/auth/member";
import { organization } from "../schema/auth/organization";
import { user } from "../schema/auth/user";
import {
  requestItemTypeEnum,
  type requestOptionStatusEnum,
  type requestStatusEnum,
} from "../schema/enums";
import { location } from "../schema/location/location";
import { request } from "../schema/request/request";
import { requestItem } from "../schema/request/request-item";
import { requestOption } from "../schema/request/request-option";
import { CONFIG } from "./config";
import { pickRandom } from "./utils";

/* -------------------------------------------------------------------------- */
/*                                    DATA                                    */
/* -------------------------------------------------------------------------- */

const REQUEST_COUNT = 20;

const REQUEST_TITLES = [
  "Dinner reservation for client meeting",
  "Team celebration dinner",
  "Executive lunch booking",
  "Business dinner with partners",
  "Birthday celebration venue",
  "Anniversary dinner reservation",
  "Post-conference team drinks",
  "Investor dinner meeting",
  "Product launch celebration",
  "Quarterly review dinner",
] as const;

const REQUEST_DESCRIPTIONS = [
  "Need a private dining room for 8 people, preferably with good wine selection.",
  "Looking for a trendy spot with great atmosphere for team bonding.",
  "Quiet restaurant suitable for business discussions, within walking distance of the office.",
  "Upscale venue with excellent service for important client meeting.",
  "Fun and celebratory atmosphere, can accommodate dietary restrictions.",
  "Romantic setting with exceptional food quality.",
  "Casual bar with good cocktails and light bites for the team.",
  "High-end restaurant that impresses, with private space if possible.",
  "Vibrant venue that can host 20+ people with standing room.",
  "Classic restaurant with reliable quality for regular business dinners.",
] as const;

const ITEM_TITLES = [
  "Main venue reservation",
  "Backup option",
  "Premium selection",
  "Budget-friendly option",
] as const;

const STATUSES_WITH_OPTIONS = [
  "in_progress",
  "pending_approval",
  "approved",
  "confirmed",
  "cancelled",
] as const;

interface OrgMember {
  user: typeof user.$inferSelect;
}

/* -------------------------------------------------------------------------- */
/*                             OPTION CREATION                                 */
/* -------------------------------------------------------------------------- */

async function createRequestOptions(
  itemId: string,
  requestStatus: (typeof requestStatusEnum.enumValues)[number],
  optionCount: number,
  locationIds: string[]
) {
  for (let k = 0; k < optionCount; k += 1) {
    const locationId = pickRandom(locationIds);
    const optionStatus = getOptionStatusFromRequestStatus(requestStatus, k);

    const startsAt = faker.date.future({ years: 1 });
    const endsAt = new Date(startsAt.getTime() + 2 * 60 * 60 * 1000);

    await database.insert(requestOption).values({
      requestItemId: itemId,
      locationId,
      title: `Option ${k + 1} – ${faker.company.name()}`,
      description: faker.lorem.sentences(2),
      status: optionStatus,
      startsAt,
      endsAt,
      externalUrl: faker.datatype.boolean({ probability: 0.5 })
        ? faker.internet.url()
        : null,
      metadata: {
        priceRange: pickRandom(["$", "$$", "$$$", "$$$$"]),
        cuisine: faker.helpers.arrayElement([
          "Italian",
          "French",
          "Japanese",
          "Modern European",
          "British",
        ]),
        rating: faker.number.float({ min: 4.0, max: 5.0, fractionDigits: 1 }),
      },
      createdAt: faker.date.recent({ days: 7 }),
      selectedAt:
        optionStatus === "selected" ? faker.date.recent({ days: 3 }) : null,
      bookedAt:
        optionStatus === "selected" && requestStatus === "confirmed"
          ? faker.date.recent({ days: 1 })
          : null,
    });
  }
}

/* -------------------------------------------------------------------------- */
/*                              ITEM CREATION                                  */
/* -------------------------------------------------------------------------- */

async function createRequestItems(
  requestId: string,
  requestStatus: (typeof requestStatusEnum.enumValues)[number],
  hasOptions: boolean,
  locationIds: string[]
) {
  const itemCount = faker.number.int({ min: 1, max: 3 });

  for (let j = 0; j < itemCount; j += 1) {
    const [newItem] = await database
      .insert(requestItem)
      .values({
        requestId,
        type: pickRandom(requestItemTypeEnum.enumValues),
        title: ITEM_TITLES[j % ITEM_TITLES.length],
        description: faker.lorem.sentence(),
        required: j === 0,
        sortOrder: j,
        constraints: {
          date: faker.date.future({ years: 1 }).toISOString().split("T")[0],
          partySize: faker.number.int({ min: 2, max: 12 }),
          timePreference: pickRandom(["lunch", "dinner", "late_night"]),
        },
        createdAt: faker.date.recent({ days: 14 }),
        updatedAt: new Date(),
      })
      .returning();

    if (hasOptions) {
      const optionCount = faker.number.int({ min: 2, max: 4 });
      await createRequestOptions(
        newItem.id,
        requestStatus,
        optionCount,
        locationIds
      );
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                            REQUEST CREATION                                 */
/* -------------------------------------------------------------------------- */

async function createSingleRequest(
  index: number,
  orgId: string,
  orgMembers: OrgMember[],
  locationIds: string[]
) {
  const creator = pickRandom(orgMembers).user;
  const requestedFor = faker.datatype.boolean({ probability: 0.7 })
    ? pickRandom(orgMembers).user
    : null;
  const handler = faker.datatype.boolean({ probability: 0.5 })
    ? pickRandom(orgMembers).user
    : null;

  const status = pickWeightedRequestStatus();
  const hasOptions = STATUSES_WITH_OPTIONS.includes(status);

  const [newRequest] = await database
    .insert(request)
    .values({
      organizationId: orgId,
      createdByUserId: creator.id,
      requestedForUserId: requestedFor?.id,
      handledByUserId: handler?.id,
      type: pickRandom(requestItemTypeEnum.enumValues),
      status,
      title: REQUEST_TITLES[index % REQUEST_TITLES.length],
      description: REQUEST_DESCRIPTIONS[index % REQUEST_DESCRIPTIONS.length],
      sentForApprovalAt: hasOptions ? faker.date.recent({ days: 7 }) : null,
      decidedAt:
        status === "approved" || status === "confirmed"
          ? faker.date.recent({ days: 3 })
          : null,
      createdAt: faker.date.recent({ days: 14 }),
      updatedAt: new Date(),
    })
    .returning();

  await createRequestItems(newRequest.id, status, hasOptions, locationIds);
}

/* -------------------------------------------------------------------------- */
/*                                   SEED                                     */
/* -------------------------------------------------------------------------- */

export async function seedRequests() {
  console.log("\n📋 Seeding requests...");

  const [org] = await database
    .select()
    .from(organization)
    .where(eq(organization.slug, CONFIG.organization.slug))
    .limit(1);

  if (!org) {
    return;
  }

  const orgMembers = await database
    .select({ user })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(eq(member.organizationId, org.id));

  if (!orgMembers.length) {
    return;
  }

  const locations = await database
    .select({ id: location.id })
    .from(location)
    .limit(20);

  const locationIds = locations.map((l) => l.id);

  for (let i = 0; i < REQUEST_COUNT; i += 1) {
    await createSingleRequest(i, org.id, orgMembers, locationIds);
  }

  console.log(`✅ Created ${REQUEST_COUNT} requests`);
}

/* -------------------------------------------------------------------------- */
/*                                HELPERS                                     */
/* -------------------------------------------------------------------------- */

function pickWeightedRequestStatus(): (typeof requestStatusEnum.enumValues)[number] {
  return faker.helpers.weightedArrayElement([
    { weight: 30, value: "in_progress" },
    { weight: 25, value: "pending_approval" },
    { weight: 20, value: "approved" },
    { weight: 15, value: "confirmed" },
    { weight: 10, value: "cancelled" },
  ]);
}

function getOptionStatusFromRequestStatus(
  requestStatus: (typeof requestStatusEnum.enumValues)[number],
  index: number
): (typeof requestOptionStatusEnum.enumValues)[number] {
  if (requestStatus === "approved" || requestStatus === "confirmed") {
    return index === 0 ? "selected" : "rejected";
  }
  return "pending";
}
