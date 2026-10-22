import { getPool } from "@/lib/db";

export async function markSellerCheckSeen(token: string): Promise<void> {
  await getPool().query(
    `update seller_checks set viewed_at = coalesce(viewed_at, now())
     where token = $1 and status in ('created', 'sent')`,
    [token],
  );
}
