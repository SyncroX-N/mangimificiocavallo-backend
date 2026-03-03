CREATE TYPE "public"."customer_contact_type" AS ENUM('telephone', 'mobile', 'fax');--> statement-breakpoint
CREATE TABLE "customer_contact" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"type" "customer_contact_type" NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer" ADD COLUMN "fiscal_code" text;--> statement-breakpoint
ALTER TABLE "customer_contact" ADD CONSTRAINT "customer_contact_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "customer_contact_customer_id_idx" ON "customer_contact" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "customer_contact_customer_type_idx" ON "customer_contact" USING btree ("customer_id","type");--> statement-breakpoint
INSERT INTO "customer_contact" ("customer_id", "type", "value")
SELECT "id", 'telephone', "contact_phone_number"
FROM "customer"
WHERE "contact_phone_number" IS NOT NULL AND btrim("contact_phone_number") <> '';
