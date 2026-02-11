import { faker } from "@faker-js/faker";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickRandomMultiple<T>(
  arr: readonly T[],
  min: number,
  max: number
): T[] {
  const count = faker.number.int({ min, max });
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function generateOpeningHours() {
  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  const hours: Record<string, null | { opensAt: string; closesAt: string }> =
    {};

  for (const day of days) {
    if (faker.datatype.boolean({ probability: 0.85 })) {
      const opensHour = faker.number.int({ min: 6, max: 12 });
      const closesHour = faker.number.int({ min: 18, max: 23 });
      hours[day] = {
        opensAt: `${String(opensHour).padStart(2, "0")}:00`,
        closesAt: `${String(closesHour).padStart(2, "0")}:00`,
      };
    } else {
      hours[day] = null;
    }
  }

  return hours;
}
