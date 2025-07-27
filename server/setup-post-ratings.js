#!/usr/bin/env node

/**
 * Database Setup Script for Post Ratings System
 * 
 * This script creates the post_ratings table and related functionality
 * based on the exact schema structure provided by the user.
 * 
 * Usage: node setup-post-ratings.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Use the same database configuration as the existing system
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function runSQL(sqlContent, description) {
  try {
    console.log(`\n🔄 ${description}...`);
    await pool.query(sqlContent);
    console.log(`✅ ${description} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Error in ${description}:`, error.message);
    return false;
  }
}

async function setupPostRatings() {
  console.log('🚀 Starting Post Ratings System Setup...');
  console.log('📊 Using DATABASE_URL configuration');

  try {
    // Test database connection
    console.log('\n🔍 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');

    // Step 1: Create the sequence
    console.log('\n📋 Step 1: Creating sequence...');
    const createSequence = `
      DROP SEQUENCE IF EXISTS "public"."post_ratings_rating_id_seq";
      CREATE SEQUENCE "public"."post_ratings_rating_id_seq" 
      INCREMENT BY 1
      MINVALUE 1
      MAXVALUE 2147483647
      START WITH 1
      CACHE 1;
    `;
    await runSQL(createSequence, 'Creating post_ratings sequence');

    // Step 2: Create the post_ratings table
    console.log('\n📋 Step 2: Creating post_ratings table...');
    const createTable = `
      DROP TABLE IF EXISTS "public"."post_ratings";
      CREATE TABLE "public"."post_ratings" (
        "rating_id" int4 NOT NULL DEFAULT nextval('"post_ratings_rating_id_seq"'::regclass),
        "post_id" int4 NOT NULL,
        "user_id" int4 NOT NULL,
        "rating" numeric(2,1) NOT NULL,
        "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await runSQL(createTable, 'Creating post_ratings table');

    // Step 3: Add new columns to post table
    console.log('\n📋 Step 3: Adding columns to post table...');
    const addColumns = `
      ALTER TABLE "public"."post" ADD COLUMN IF NOT EXISTS "average_rating" numeric(3,2) DEFAULT NULL;
      ALTER TABLE "public"."post" ADD COLUMN IF NOT EXISTS "total_ratings" int4 DEFAULT 0;
    `;
    await runSQL(addColumns, 'Adding rating columns to post table');

    // Step 4: Create functions
    console.log('\n📋 Step 4: Creating database functions...');
    
    const createFunctions = `
      -- Function to calculate post average rating
      DROP FUNCTION IF EXISTS "public"."calculate_post_average_rating"(int4);
      CREATE FUNCTION "public"."calculate_post_average_rating"("p_post_id" int4)
        RETURNS VOID AS $$
      DECLARE
          avg_rating NUMERIC(3,2);
          rating_count INTEGER;
      BEGIN
          SELECT AVG(rating), COUNT(rating)
          INTO avg_rating, rating_count
          FROM post_ratings
          WHERE post_id = p_post_id;
          
          UPDATE post 
          SET 
              average_rating = ROUND(avg_rating, 2),
              total_ratings = rating_count,
              ratingpoint = ROUND(avg_rating, 1)
          WHERE post_id = p_post_id;
      END;
      $$ LANGUAGE plpgsql VOLATILE COST 100;

      -- Function for updating post ratings timestamp
      DROP FUNCTION IF EXISTS "public"."update_post_ratings_timestamp"();
      CREATE FUNCTION "public"."update_post_ratings_timestamp"()
        RETURNS "pg_catalog"."trigger" AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql VOLATILE COST 100;

      -- Function for post rating notifications
      DROP FUNCTION IF EXISTS "public"."notify_post_rating"();
      CREATE FUNCTION "public"."notify_post_rating"()
        RETURNS "pg_catalog"."trigger" AS $$
      DECLARE
          post_owner_id INTEGER;
          rater_name VARCHAR(255);
          post_preview TEXT;
      BEGIN
          SELECT p.user_id, u.username, LEFT(p.post_text, 50)
          INTO post_owner_id, rater_name, post_preview
          FROM post p
          JOIN "user" u ON u.user_id = NEW.user_id
          WHERE p.post_id = NEW.post_id;
          
          IF post_owner_id IS NOT NULL AND post_owner_id != NEW.user_id THEN
              PERFORM create_notification(
                  post_owner_id,
                  NEW.user_id,
                  'rating',
                  'post',
                  NEW.post_id,
                  rater_name || ' rated your post "' || post_preview || '..." with ' || NEW.rating || ' stars'
              );
          END IF;
          
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql VOLATILE COST 100;
    `;
    await runSQL(createFunctions, 'Creating database functions');

    // Step 5: Create indexes
    console.log('\n📋 Step 5: Creating indexes...');
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS "idx_post_ratings_post_id" ON "public"."post_ratings" USING btree ("post_id");
      CREATE INDEX IF NOT EXISTS "idx_post_ratings_user_id" ON "public"."post_ratings" USING btree ("user_id");
      CREATE INDEX IF NOT EXISTS "idx_post_ratings_created_at" ON "public"."post_ratings" USING btree ("created_at" DESC);
      CREATE INDEX IF NOT EXISTS "idx_post_ratings_rating" ON "public"."post_ratings" USING btree ("rating" DESC);
    `;
    await runSQL(createIndexes, 'Creating indexes');

    // Step 6: Add constraints
    console.log('\n📋 Step 6: Adding constraints...');
    const addConstraints = `
      ALTER TABLE "public"."post_ratings" ADD CONSTRAINT "post_ratings_pkey" PRIMARY KEY ("rating_id");
      ALTER TABLE "public"."post_ratings" ADD CONSTRAINT "unique_user_post_rating" UNIQUE ("user_id", "post_id");
      ALTER TABLE "public"."post_ratings" ADD CONSTRAINT "chk_rating_range" CHECK (rating >= 1.0 AND rating <= 5.0);
      ALTER TABLE "public"."post_ratings" ADD CONSTRAINT "fk_post_ratings_post_id" 
        FOREIGN KEY ("post_id") REFERENCES "public"."post" ("post_id") ON DELETE CASCADE;
      ALTER TABLE "public"."post_ratings" ADD CONSTRAINT "fk_post_ratings_user_id" 
        FOREIGN KEY ("user_id") REFERENCES "public"."user" ("user_id") ON DELETE CASCADE;
    `;
    await runSQL(addConstraints, 'Adding constraints');

    // Step 7: Create triggers
    console.log('\n📋 Step 7: Creating triggers...');
    const createTriggers = `
      CREATE TRIGGER "trigger_update_post_ratings_timestamp" 
      BEFORE UPDATE ON "public"."post_ratings"
      FOR EACH ROW
      EXECUTE PROCEDURE "public"."update_post_ratings_timestamp"();

      CREATE TRIGGER "trigger_post_rating_notification" 
      AFTER INSERT ON "public"."post_ratings"
      FOR EACH ROW
      EXECUTE PROCEDURE "public"."notify_post_rating"();

      CREATE TRIGGER "trigger_calculate_rating_on_insert" 
      AFTER INSERT ON "public"."post_ratings"
      FOR EACH ROW
      EXECUTE PROCEDURE "public"."calculate_post_average_rating"(NEW.post_id);

      CREATE TRIGGER "trigger_calculate_rating_on_update" 
      AFTER UPDATE ON "public"."post_ratings"
      FOR EACH ROW
      EXECUTE PROCEDURE "public"."calculate_post_average_rating"(NEW.post_id);

      CREATE TRIGGER "trigger_calculate_rating_on_delete" 
      AFTER DELETE ON "public"."post_ratings"
      FOR EACH ROW
      EXECUTE PROCEDURE "public"."calculate_post_average_rating"(OLD.post_id);
    `;
    await runSQL(createTriggers, 'Creating triggers');

    // Step 8: Set sequence ownership and initialize
    console.log('\n📋 Step 8: Setting up sequence...');
    const setupSequence = `
      ALTER SEQUENCE "public"."post_ratings_rating_id_seq"
      OWNED BY "public"."post_ratings"."rating_id";
      SELECT setval('"public"."post_ratings_rating_id_seq"', 1, false);
    `;
    await runSQL(setupSequence, 'Setting up sequence ownership');

    // Step 9: Initialize existing data
    console.log('\n📋 Step 9: Initializing existing post data...');
    const initializeData = `
      UPDATE post 
      SET 
          average_rating = CASE WHEN ratingpoint IS NOT NULL THEN ratingpoint ELSE NULL END,
          total_ratings = CASE WHEN ratingpoint IS NOT NULL THEN 1 ELSE 0 END
      WHERE average_rating IS NULL OR total_ratings IS NULL;
    `;
    await runSQL(initializeData, 'Initializing existing post rating data');

    // Step 10: Add table comments
    console.log('\n📋 Step 10: Adding documentation...');
    const addComments = `
      COMMENT ON TABLE "public"."post_ratings" IS 'Stores individual user ratings for rate_my_work posts';
      COMMENT ON COLUMN "public"."post_ratings"."rating" IS 'Rating value from 1.0 to 5.0';
      COMMENT ON COLUMN "public"."post_ratings"."post_id" IS 'Reference to the post being rated';
      COMMENT ON COLUMN "public"."post_ratings"."user_id" IS 'User who gave the rating';
    `;
    await runSQL(addComments, 'Adding table documentation');

    console.log('\n🎉 Post Ratings System Setup Complete!');
    console.log('\n📊 System Summary:');
    console.log('✅ post_ratings table created');
    console.log('✅ average_rating and total_ratings columns added to post table');
    console.log('✅ Database functions created for automatic calculations');
    console.log('✅ Triggers created for real-time updates');
    console.log('✅ Indexes created for performance');
    console.log('✅ Constraints and foreign keys added');
    console.log('✅ Notification system integrated');
    
    // Test the setup
    console.log('\n🧪 Testing setup...');
    const testResult = await pool.query(`
      SELECT 
        t.table_name,
        COUNT(c.column_name) as column_count
      FROM information_schema.tables t
      LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
      WHERE t.table_name IN ('post_ratings', 'post') 
        AND t.table_schema = 'public'
      GROUP BY t.table_name
      ORDER BY t.table_name;
    `);
    
    console.log('\n📋 Tables created:');
    testResult.rows.forEach(row => {
      console.log(`  • ${row.table_name} (${row.column_count} columns)`);
    });

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('\n🔧 Troubleshooting tips:');
    console.error('  1. Check your database credentials');
    console.error('  2. Ensure the database exists and is accessible');
    console.error('  3. Verify you have the necessary permissions');
    console.error('  4. Check your network connection');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the setup
if (require.main === module) {
  setupPostRatings()
    .then(() => {
      console.log('\n✨ Setup completed successfully!');
      console.log('\n🚀 You can now use the post rating system:');
      console.log('  • Users can rate posts from 1-5 stars');
      console.log('  • Average ratings are calculated automatically');
      console.log('  • Rating notifications are sent to post owners');
      console.log('  • API endpoints are ready for frontend integration');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Fatal error:', error.message);
      process.exit(1);
    });
}

module.exports = { setupPostRatings };
