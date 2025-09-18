-- Add reply_id columns to both message tables
-- These columns will reference the ID of the message being replied to

-- Add reply_id column to p2p_messages table
ALTER TABLE "p2p_messages" 
ADD COLUMN "reply_id" INTEGER REFERENCES "p2p_messages"("id") ON DELETE SET NULL;

-- Add reply_id column to group_messages table  
ALTER TABLE "group_messages" 
ADD COLUMN "reply_id" INTEGER REFERENCES "group_messages"("id") ON DELETE SET NULL;

-- Add indexes for better performance on reply queries
CREATE INDEX idx_p2p_messages_reply_id ON "p2p_messages"("reply_id");
CREATE INDEX idx_group_messages_reply_id ON "group_messages"("reply_id");

-- Update the server's database migration section
-- The following comment explains the reply feature:
-- reply_id: NULL for normal messages, or the ID of the message being replied to
-- When reply_id is not NULL, it indicates this message is a reply to the message with id = reply_id