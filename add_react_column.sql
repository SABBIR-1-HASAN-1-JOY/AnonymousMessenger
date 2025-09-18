-- Add react column to both message tables for emoji reactions

-- Add react column to p2p_messages table
ALTER TABLE "p2p_messages" 
ADD COLUMN IF NOT EXISTS "react" TEXT;

-- Add react column to group_messages table  
ALTER TABLE "group_messages" 
ADD COLUMN IF NOT EXISTS "react" TEXT;

-- Add comments for documentation
COMMENT ON COLUMN "p2p_messages"."react" IS 'Emoji reaction to the message (e.g., ❤️, 😂, 👍)';
COMMENT ON COLUMN "group_messages"."react" IS 'Emoji reaction to the message (e.g., ❤️, 😂, 👍)';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name IN ('p2p_messages', 'group_messages') 
AND column_name = 'react';