import { and, eq } from "drizzle-orm";
import database from "..";
import { tag, tagCategory } from "../schema/tag/tag";
import { CONFIG, TAG_CATEGORIES, TAG_DATA } from "./config";
import { slugify } from "./utils";

export async function seedTagCategories() {
  console.log("\n🏷️  Seeding tag categories...");

  const createdCategories: (typeof tagCategory.$inferSelect)[] = [];

  for (const cat of TAG_CATEGORIES) {
    const [existing] = await database
      .select()
      .from(tagCategory)
      .where(eq(tagCategory.slug, cat.slug))
      .limit(1);

    if (existing) {
      createdCategories.push(existing);
      console.log(`   ⚠️  Category ${cat.name} already exists`);
    } else {
      const [newCat] = await database
        .insert(tagCategory)
        .values({
          name: cat.name,
          slug: cat.slug,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      createdCategories.push(newCat);
      console.log(`   ✅ Created category: ${cat.name}`);
    }
  }

  return createdCategories;
}

export async function seedTags(
  categories: (typeof tagCategory.$inferSelect)[]
) {
  console.log("\n🏷️  Seeding tags...");

  const tags: (typeof tag.$inferSelect)[] = [];
  let tagCount = 0;

  for (const cat of categories) {
    const categoryTags = TAG_DATA[cat.slug] || [];

    for (const tagName of categoryTags) {
      if (tagCount >= CONFIG.counts.tags) {
        break;
      }

      const tagSlug = slugify(tagName);

      const [existing] = await database
        .select()
        .from(tag)
        .where(and(eq(tag.slug, tagSlug), eq(tag.categoryId, cat.id)))
        .limit(1);

      if (existing) {
        tags.push(existing);
        console.log(`   ⚠️  Tag ${tagName} already exists`);
      } else {
        const [newTag] = await database
          .insert(tag)
          .values({
            name: tagName,
            slug: tagSlug,
            categoryId: cat.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        tags.push(newTag);
        console.log(`   ✅ Created tag: ${tagName} (${cat.name})`);
      }
      tagCount += 1;
    }

    if (tagCount >= CONFIG.counts.tags) {
      break;
    }
  }

  return tags;
}
