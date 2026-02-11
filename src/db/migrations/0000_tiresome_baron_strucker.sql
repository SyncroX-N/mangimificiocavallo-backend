CREATE TYPE "public"."age_restriction" AS ENUM('none', '18_plus', '21_plus');--> statement-breakpoint
CREATE TYPE "public"."best_for" AS ENUM('date_night', 'special_occasion', 'business_meal', 'team_drinks', 'solo_work', 'casual_meal', 'group_dinner', 'family_friendly');--> statement-breakpoint
CREATE TYPE "public"."content_status" AS ENUM('draft', 'published', 'archived', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."conversation_status" AS ENUM('open', 'archived', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."dress_code" AS ENUM('casual', 'smart_casual', 'business', 'elegant', 'black_tie');--> statement-breakpoint
CREATE TYPE "public"."embedding_entity" AS ENUM('location', 'event');--> statement-breakpoint
CREATE TYPE "public"."embedding_source" AS ENUM('crawl', 'manual');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('concert', 'theatre', 'sports', 'other', 'party', 'dance', 'music', 'art', 'film', 'comedy');--> statement-breakpoint
CREATE TYPE "public"."location_type" AS ENUM('restaurant', 'bar', 'cafe', 'bakery', 'pub', 'lounge', 'food_hall', 'hotel', 'club', 'other');--> statement-breakpoint
CREATE TYPE "public"."meal_service" AS ENUM('breakfast', 'brunch', 'lunch', 'dinner', 'late_night');--> statement-breakpoint
CREATE TYPE "public"."noise_level" AS ENUM('very_quiet', 'quiet', 'moderate', 'loud', 'very_loud');--> statement-breakpoint
CREATE TYPE "public"."participant_role" AS ENUM('user', 'member');--> statement-breakpoint
CREATE TYPE "public"."price_level" AS ENUM('$', '$$', '$$$', '$$$$');--> statement-breakpoint
CREATE TYPE "public"."request_item_type" AS ENUM('flight', 'hotel', 'restaurant', 'transfer', 'activity', 'tickets', 'other');--> statement-breakpoint
CREATE TYPE "public"."request_option_status" AS ENUM('pending', 'selected', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('in_progress', 'pending_approval', 'approved', 'confirmed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."request_type" AS ENUM('restaurant', 'flight', 'hotel', 'transfer', 'activity', 'tickets', 'other');--> statement-breakpoint
CREATE TYPE "public"."reservation_policy" AS ENUM('walk_ins', 'recommended', 'required');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('super-admin', 'admin');--> statement-breakpoint
CREATE TYPE "public"."visibility" AS ENUM('public', 'private');--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TABLE "account" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_embedding" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" "embedding_entity" NOT NULL,
	"entity_id" uuid NOT NULL,
	"model" varchar(255) NOT NULL,
	"dim" varchar(10) NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"source" "embedding_source" DEFAULT 'crawl' NOT NULL,
	"checksum" varchar(128),
	"chunk_id" varchar(64),
	"status" varchar(32),
	"error" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "area" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"city_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "area_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "calendar_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"request_id" uuid,
	"request_item_id" uuid,
	"request_option_id" uuid,
	"location_id" uuid,
	"location_text" text,
	"title" text NOT NULL,
	"description" text,
	"color" text DEFAULT 'blue' NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "city" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"country_id" uuid NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "city_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "conversation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"last_message_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_assignment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" text DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_participant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "participant_role" DEFAULT 'user' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "country" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" char(2) NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"type" "event_type" NOT NULL,
	"status" "content_status" DEFAULT 'published' NOT NULL,
	"visibility" "visibility" DEFAULT 'public' NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"short_description" text,
	"detailed_description" text,
	"is_wheelchair_accessible" boolean DEFAULT false,
	"location_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "event_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	"inviter_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "location" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"type" "location_type" NOT NULL,
	"status" "content_status" DEFAULT 'published' NOT NULL,
	"visibility" "visibility" DEFAULT 'public' NOT NULL,
	"brand_name" text,
	"address_line_1" text,
	"address_line_2" text,
	"neighborhood" text,
	"city_id" uuid NOT NULL,
	"area_id" uuid,
	"postal_code" text,
	"latitude" double precision,
	"longitude" double precision,
	"phone_number" text,
	"email" text,
	"website_url" text,
	"booking_url" text,
	"instagram_handle" text,
	"google_place_id" text,
	"short_description" text,
	"detailed_description" text,
	"is_wheelchair_accessible" boolean DEFAULT false,
	"is_dog_friendly" boolean DEFAULT false,
	"price_level" "price_level",
	"average_spend_per_person" numeric(10, 2),
	"currency" char(3),
	"meal_services" "meal_service"[] DEFAULT ARRAY[]::meal_service[],
	"opening_hours" jsonb,
	"is_temporarily_closed" boolean DEFAULT false,
	"noise_level" "noise_level",
	"dress_code" "dress_code",
	"age_restriction" "age_restriction" DEFAULT 'none',
	"reservation_policy" "reservation_policy" DEFAULT 'walk_ins',
	"average_rating" numeric(2, 1),
	"review_count" integer DEFAULT 0,
	"popularity_score" numeric(10, 4),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "location_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "location_tag" (
	"location_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"role" "participant_role" DEFAULT 'user' NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"created_at" timestamp NOT NULL,
	"metadata" text,
	CONSTRAINT "organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"requested_for_user_id" uuid,
	"handled_by_user_id" uuid,
	"type" "request_type" DEFAULT 'other' NOT NULL,
	"status" "request_status" DEFAULT 'in_progress' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"sent_for_approval_at" timestamp with time zone,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"cancelled_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "request_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"type" "request_item_type" DEFAULT 'other' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"required" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"constraints" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "request_option" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_item_id" uuid NOT NULL,
	"location_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"status" "request_option_status" DEFAULT 'pending' NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"external_url" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"selected_at" timestamp with time zone,
	"booked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL,
	"impersonated_by" text,
	"active_organization_id" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "tag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"category_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tag_category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tag_category_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text,
	"company_role" text,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "area" ADD CONSTRAINT "area_city_id_city_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."city"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_request_id_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."request"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_request_item_id_request_item_id_fk" FOREIGN KEY ("request_item_id") REFERENCES "public"."request_item"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_request_option_id_request_option_id_fk" FOREIGN KEY ("request_option_id") REFERENCES "public"."request_option"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_location_id_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "city" ADD CONSTRAINT "city_country_id_country_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."country"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_assignment" ADD CONSTRAINT "conversation_assignment_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_assignment" ADD CONSTRAINT "conversation_assignment_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_participant" ADD CONSTRAINT "conversation_participant_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_participant" ADD CONSTRAINT "conversation_participant_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_location_id_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location" ADD CONSTRAINT "location_city_id_city_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."city"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location" ADD CONSTRAINT "location_area_id_area_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."area"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_tag" ADD CONSTRAINT "location_tag_location_id_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_tag" ADD CONSTRAINT "location_tag_tag_id_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request" ADD CONSTRAINT "request_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request" ADD CONSTRAINT "request_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request" ADD CONSTRAINT "request_requested_for_user_id_user_id_fk" FOREIGN KEY ("requested_for_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request" ADD CONSTRAINT "request_handled_by_user_id_user_id_fk" FOREIGN KEY ("handled_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_item" ADD CONSTRAINT "request_item_request_id_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_option" ADD CONSTRAINT "request_option_request_item_id_request_item_id_fk" FOREIGN KEY ("request_item_id") REFERENCES "public"."request_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_option" ADD CONSTRAINT "request_option_location_id_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag" ADD CONSTRAINT "tag_category_id_tag_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."tag_category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_embedding_entity_idx" ON "ai_embedding" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "ai_embedding_model_idx" ON "ai_embedding" USING btree ("model");--> statement-breakpoint
CREATE INDEX "ai_embedding_checksum_idx" ON "ai_embedding" USING btree ("checksum");--> statement-breakpoint
CREATE UNIQUE INDEX "area_city_name_uidx" ON "area" USING btree ("city_id","name");--> statement-breakpoint
CREATE INDEX "area_city_idx" ON "area" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "calendar_event_user_idx" ON "calendar_event" USING btree ("user_id","start_date");--> statement-breakpoint
CREATE INDEX "calendar_event_org_idx" ON "calendar_event" USING btree ("organization_id","start_date");--> statement-breakpoint
CREATE INDEX "calendar_event_request_idx" ON "calendar_event" USING btree ("request_id","start_date");--> statement-breakpoint
CREATE UNIQUE INDEX "city_country_name_uidx" ON "city" USING btree ("country_id","name");--> statement-breakpoint
CREATE INDEX "city_country_idx" ON "city" USING btree ("country_id");--> statement-breakpoint
CREATE INDEX "conversations_user_idx" ON "conversation" USING btree ("user_id","last_message_at");--> statement-breakpoint
CREATE INDEX "conversation_participant_conversation_user_idx" ON "conversation_participant" USING btree ("conversation_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "country_code_uidx" ON "country" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "country_name_uidx" ON "country" USING btree ("name");--> statement-breakpoint
CREATE INDEX "event_slug_idx" ON "event" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "event_location_idx" ON "event" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "event_status_idx" ON "event" USING btree ("status");--> statement-breakpoint
CREATE INDEX "event_visibility_idx" ON "event" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "invitation_organizationId_idx" ON "invitation" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "invitation" USING btree ("email");--> statement-breakpoint
CREATE INDEX "location_city_type_idx" ON "location" USING btree ("city_id","type");--> statement-breakpoint
CREATE INDEX "location_area_type_idx" ON "location" USING btree ("area_id","type");--> statement-breakpoint
CREATE INDEX "location_price_idx" ON "location" USING btree ("price_level");--> statement-breakpoint
CREATE INDEX "location_rating_idx" ON "location" USING btree ("average_rating");--> statement-breakpoint
CREATE INDEX "location_popularity_idx" ON "location" USING btree ("popularity_score");--> statement-breakpoint
CREATE INDEX "location_lat_lng_idx" ON "location" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE UNIQUE INDEX "location_tag_uidx" ON "location_tag" USING btree ("location_id","tag_id");--> statement-breakpoint
CREATE INDEX "location_tag_location_idx" ON "location_tag" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "location_tag_tag_idx" ON "location_tag" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "member_organizationId_idx" ON "member" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "member_userId_idx" ON "member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "messages_conversation_idx" ON "message" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "request_org_idx" ON "request" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "request_created_by_idx" ON "request" USING btree ("created_by_user_id","created_at");--> statement-breakpoint
CREATE INDEX "request_handled_by_idx" ON "request" USING btree ("handled_by_user_id","created_at");--> statement-breakpoint
CREATE INDEX "request_status_idx" ON "request" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "request_item_request_idx" ON "request_item" USING btree ("request_id","sort_order");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tag_slug_category_uidx" ON "tag" USING btree ("slug","category_id");--> statement-breakpoint
CREATE INDEX "tag_slug_idx" ON "tag" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "tag_category_slug_idx" ON "tag_category" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");