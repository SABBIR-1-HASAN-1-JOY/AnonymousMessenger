/*
 Navicat Premium Dump SQL

 Source Server         : Project Anon
 Source Server Type    : PostgreSQL
 Source Server Version : 170005 (170005)
 Source Host           : ep-old-paper-adpe1kzh-pooler.c-2.us-east-1.aws.neon.tech:5432
 Source Catalog        : neondb
 Source Schema         : public

 Target Server Type    : PostgreSQL
 Target Server Version : 170005 (170005)
 File Encoding         : 65001

 Date: 22/08/2025 20:03:35
*/


-- ----------------------------
-- Sequence structure for group_messages_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."group_messages_id_seq";
CREATE SEQUENCE "public"."group_messages_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for groups_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."groups_id_seq";
CREATE SEQUENCE "public"."groups_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for p2p_connections_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."p2p_connections_id_seq";
CREATE SEQUENCE "public"."p2p_connections_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for p2p_messages_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."p2p_messages_id_seq";
CREATE SEQUENCE "public"."p2p_messages_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Table structure for group_messages
-- ----------------------------
DROP TABLE IF EXISTS "public"."group_messages";
CREATE TABLE "public"."group_messages" (
  "id" int4 NOT NULL DEFAULT nextval('group_messages_id_seq'::regclass),
  "group_id" int4 NOT NULL,
  "message" text COLLATE "pg_catalog"."default" NOT NULL,
  "sent_at" timestamp(6) NOT NULL DEFAULT now(),
  "expires_at" timestamp(6) NOT NULL DEFAULT (now() + '00:05:00'::interval)
)
;

-- ----------------------------
-- Table structure for groups
-- ----------------------------
DROP TABLE IF EXISTS "public"."groups";
CREATE TABLE "public"."groups" (
  "id" int4 NOT NULL DEFAULT nextval('groups_id_seq'::regclass),
  "topic" varchar COLLATE "pg_catalog"."default" NOT NULL,
  "created_at" timestamp(6) NOT NULL DEFAULT now(),
  "expires_at" timestamp(6) NOT NULL
)
;

-- ----------------------------
-- Table structure for login_codes
-- ----------------------------
DROP TABLE IF EXISTS "public"."login_codes";
CREATE TABLE "public"."login_codes" (
  "code" varchar COLLATE "pg_catalog"."default" NOT NULL,
  "created_at" timestamp(6) NOT NULL DEFAULT now(),
  "expires_at" timestamp(6) NOT NULL
)
;

-- ----------------------------
-- Table structure for p2p_connections
-- ----------------------------
DROP TABLE IF EXISTS "public"."p2p_connections";
CREATE TABLE "public"."p2p_connections" (
  "id" int4 NOT NULL DEFAULT nextval('p2p_connections_id_seq'::regclass),
  "user1" varchar COLLATE "pg_catalog"."default" NOT NULL,
  "user2" varchar COLLATE "pg_catalog"."default" NOT NULL,
  "started_at" timestamp(6) NOT NULL DEFAULT now(),
  "expires_at" timestamp(6) NOT NULL,
  "status" varchar(20) COLLATE "pg_catalog"."default" NOT NULL
)
;

-- ----------------------------
-- Table structure for p2p_messages
-- ----------------------------
DROP TABLE IF EXISTS "public"."p2p_messages";
CREATE TABLE "public"."p2p_messages" (
  "id" int4 NOT NULL DEFAULT nextval('p2p_messages_id_seq'::regclass),
  "connection_id" int4 NOT NULL,
  "sender" varchar COLLATE "pg_catalog"."default" NOT NULL,
  "message" text COLLATE "pg_catalog"."default" NOT NULL,
  "sent_at" timestamp(6) NOT NULL DEFAULT now(),
  "expires_at" timestamp(6) NOT NULL DEFAULT (now() + '00:05:00'::interval)
)
;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS "public"."users";
CREATE TABLE "public"."users" (
  "username" varchar COLLATE "pg_catalog"."default" NOT NULL,
  "created_at" timestamp(6) NOT NULL DEFAULT now(),
  "last_active" timestamp(6) NOT NULL DEFAULT now()
)
;

-- ----------------------------
-- Function structure for cleanup_expired_groups
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."cleanup_expired_groups"();
CREATE FUNCTION "public"."cleanup_expired_groups"()
  RETURNS "pg_catalog"."trigger" AS $BODY$
BEGIN
  DELETE FROM groups WHERE expires_at < now();
  RETURN NEW;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;

-- ----------------------------
-- Function structure for cleanup_expired_messages
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."cleanup_expired_messages"();
CREATE FUNCTION "public"."cleanup_expired_messages"()
  RETURNS "pg_catalog"."trigger" AS $BODY$
BEGIN
  DELETE FROM p2p_messages WHERE expires_at < now();
  DELETE FROM group_messages WHERE expires_at < now();
  RETURN NEW;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;

-- ----------------------------
-- Function structure for cleanup_expired_p2p
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."cleanup_expired_p2p"();
CREATE FUNCTION "public"."cleanup_expired_p2p"()
  RETURNS "pg_catalog"."trigger" AS $BODY$
BEGIN
  DELETE FROM p2p_connections WHERE expires_at < now();
  RETURN NEW;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."group_messages_id_seq"
OWNED BY "public"."group_messages"."id";
SELECT setval('"public"."group_messages_id_seq"', 1, false);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."groups_id_seq"
OWNED BY "public"."groups"."id";
SELECT setval('"public"."groups_id_seq"', 1, false);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."p2p_connections_id_seq"
OWNED BY "public"."p2p_connections"."id";
SELECT setval('"public"."p2p_connections_id_seq"', 1, false);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."p2p_messages_id_seq"
OWNED BY "public"."p2p_messages"."id";
SELECT setval('"public"."p2p_messages_id_seq"', 1, false);

-- ----------------------------
-- Triggers structure for table group_messages
-- ----------------------------
CREATE TRIGGER "trg_cleanup_groups" BEFORE INSERT ON "public"."group_messages"
FOR EACH ROW
EXECUTE PROCEDURE "public"."cleanup_expired_groups"();
CREATE TRIGGER "trg_cleanup_messages_group" BEFORE INSERT ON "public"."group_messages"
FOR EACH ROW
EXECUTE PROCEDURE "public"."cleanup_expired_messages"();

-- ----------------------------
-- Primary Key structure for table group_messages
-- ----------------------------
ALTER TABLE "public"."group_messages" ADD CONSTRAINT "group_messages_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table groups
-- ----------------------------
ALTER TABLE "public"."groups" ADD CONSTRAINT "groups_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table login_codes
-- ----------------------------
ALTER TABLE "public"."login_codes" ADD CONSTRAINT "login_codes_pkey" PRIMARY KEY ("code");

-- ----------------------------
-- Checks structure for table p2p_connections
-- ----------------------------
ALTER TABLE "public"."p2p_connections" ADD CONSTRAINT "p2p_connections_status_check" CHECK (status::text = ANY (ARRAY['waiting'::character varying, 'active'::character varying, 'ended'::character varying]::text[]));

-- ----------------------------
-- Primary Key structure for table p2p_connections
-- ----------------------------
ALTER TABLE "public"."p2p_connections" ADD CONSTRAINT "p2p_connections_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Triggers structure for table p2p_messages
-- ----------------------------
CREATE TRIGGER "trg_cleanup_messages_p2p" BEFORE INSERT ON "public"."p2p_messages"
FOR EACH ROW
EXECUTE PROCEDURE "public"."cleanup_expired_messages"();
CREATE TRIGGER "trg_cleanup_p2p" BEFORE INSERT ON "public"."p2p_messages"
FOR EACH ROW
EXECUTE PROCEDURE "public"."cleanup_expired_p2p"();

-- ----------------------------
-- Primary Key structure for table p2p_messages
-- ----------------------------
ALTER TABLE "public"."p2p_messages" ADD CONSTRAINT "p2p_messages_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table users
-- ----------------------------
ALTER TABLE "public"."users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("username");

-- ----------------------------
-- Foreign Keys structure for table group_messages
-- ----------------------------
ALTER TABLE "public"."group_messages" ADD CONSTRAINT "group_messages_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table p2p_connections
-- ----------------------------
ALTER TABLE "public"."p2p_connections" ADD CONSTRAINT "p2p_connections_user1_fkey" FOREIGN KEY ("user1") REFERENCES "public"."users" ("username") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "public"."p2p_connections" ADD CONSTRAINT "p2p_connections_user2_fkey" FOREIGN KEY ("user2") REFERENCES "public"."users" ("username") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table p2p_messages
-- ----------------------------
ALTER TABLE "public"."p2p_messages" ADD CONSTRAINT "p2p_messages_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "public"."p2p_connections" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "public"."p2p_messages" ADD CONSTRAINT "p2p_messages_sender_fkey" FOREIGN KEY ("sender") REFERENCES "public"."users" ("username") ON DELETE NO ACTION ON UPDATE NO ACTION;
