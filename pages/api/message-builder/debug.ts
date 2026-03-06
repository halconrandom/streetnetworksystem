import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@lib/db';
import { getOrCreateUserByClerkId, hasFlag } from '@lib/clerk-sync';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await getOrCreateUserByClerkId(req);

    // Check DB columns
    const columns = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'sn_messagebuilder_webhook_targets'
      ORDER BY ordinal_position
    `);

    // Check existing rows
    const rows = await query(`SELECT id, name, clerk_id FROM sn_messagebuilder_webhook_targets LIMIT 5`);

    const hasMessageBuilder = user ? await hasFlag(user.id, 'message_builder') : false;

    return res.json({
      user: user ? {
        id: user.id,
        clerk_id: user.clerk_id,
        email: user.email,
      } : null,
      has_message_builder_flag: hasMessageBuilder,
      table_columns: columns,
      sample_rows: rows,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
}
