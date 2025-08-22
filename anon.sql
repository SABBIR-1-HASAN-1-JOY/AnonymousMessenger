/*
 Navicat Premium Dump SQL

 Source Server         : Project Anon
 Source Server Type    : PostgreSQL
 Source Server Version : 170005 (170005)
 Source Host           : ep-blue-paper-adi2m5dv-pooler.c-2.us-east-1.aws.neon.tech:5432
 Source Catalog        : neondb
 Source Schema         : public

 Target Server Type    : PostgreSQL
 Target Server Version : 170005 (170005)
 File Encoding         : 65001

 Date: 22/08/2025 18:20:02
*/


-- ----------------------------
-- Sequence structure for connection_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."connection_id_seq";
CREATE SEQUENCE "public"."connection_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for messages_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."messages_id_seq";
CREATE SEQUENCE "public"."messages_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for waiting_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."waiting_id_seq";
CREATE SEQUENCE "public"."waiting_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Table structure for code
-- ----------------------------
DROP TABLE IF EXISTS "public"."code";
CREATE TABLE "public"."code" (
  "codeToday" char(1) COLLATE "pg_catalog"."default" NOT NULL
)
;

-- ----------------------------
-- Table structure for connection
-- ----------------------------
DROP TABLE IF EXISTS "public"."connection";
CREATE TABLE "public"."connection" (
  "id" int4 NOT NULL GENERATED ALWAYS AS IDENTITY (
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1
),
  "user1" text COLLATE "pg_catalog"."default" NOT NULL,
  "user2" text COLLATE "pg_catalog"."default" NOT NULL,
  "time" timestamp(6)
)
;

-- ----------------------------
-- Table structure for messages
-- ----------------------------
DROP TABLE IF EXISTS "public"."messages";
CREATE TABLE "public"."messages" (
  "id" int4 NOT NULL GENERATED ALWAYS AS IDENTITY (
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1
),
  "sender" text COLLATE "pg_catalog"."default",
  "reciever" text COLLATE "pg_catalog"."default",
  "time" timestamp(6),
  "message" text COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Table structure for user
-- ----------------------------
DROP TABLE IF EXISTS "public"."user";
CREATE TABLE "public"."user" (
  "username" varchar COLLATE "pg_catalog"."default" NOT NULL,
  "time" timestamp(6)
)
;

-- ----------------------------
-- Table structure for waiting
-- ----------------------------
DROP TABLE IF EXISTS "public"."waiting";
CREATE TABLE "public"."waiting" (
  "id" int4 NOT NULL GENERATED ALWAYS AS IDENTITY (
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1
),
  "username" text COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."connection_id_seq"
OWNED BY "public"."connection"."id";
SELECT setval('"public"."connection_id_seq"', 14, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."messages_id_seq"
OWNED BY "public"."messages"."id";
SELECT setval('"public"."messages_id_seq"', 1, false);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."waiting_id_seq"
OWNED BY "public"."waiting"."id";
SELECT setval('"public"."waiting_id_seq"', 1, false);

-- ----------------------------
-- Primary Key structure for table code
-- ----------------------------
ALTER TABLE "public"."code" ADD CONSTRAINT "Code_pkey" PRIMARY KEY ("codeToday");

-- ----------------------------
-- Primary Key structure for table connection
-- ----------------------------
ALTER TABLE "public"."connection" ADD CONSTRAINT "connection_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table messages
-- ----------------------------
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table user
-- ----------------------------
ALTER TABLE "public"."user" ADD CONSTRAINT "user_pkey" PRIMARY KEY ("username");

-- ----------------------------
-- Primary Key structure for table waiting
-- ----------------------------
ALTER TABLE "public"."waiting" ADD CONSTRAINT "waiting_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Foreign Keys structure for table connection
-- ----------------------------
ALTER TABLE "public"."connection" ADD CONSTRAINT "connected_user" FOREIGN KEY ("user2") REFERENCES "public"."user" ("username") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "public"."connection" ADD CONSTRAINT "connected_user2" FOREIGN KEY ("user1") REFERENCES "public"."user" ("username") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table messages
-- ----------------------------
ALTER TABLE "public"."messages" ADD CONSTRAINT "constraint_1" FOREIGN KEY ("sender") REFERENCES "public"."user" ("username") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "public"."messages" ADD CONSTRAINT "constraint_2" FOREIGN KEY ("reciever") REFERENCES "public"."user" ("username") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table waiting
-- ----------------------------
ALTER TABLE "public"."waiting" ADD CONSTRAINT "wait_constraint" FOREIGN KEY ("username") REFERENCES "public"."user" ("username") ON DELETE NO ACTION ON UPDATE NO ACTION;
