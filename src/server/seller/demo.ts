import type { QueryResultRow } from "pg";
import { getPool } from "@/lib/db";

export type DemoCheckRow = QueryResultRow & {
  token: string;
  status: "created" | "sent" | "answered" | "expired";
  created_at: Date;
  shop_name: string;
  product_title: string;
};

export async function listDemoChecks(limit = 12): Promise<DemoCheckRow[]> {
  const safeLimit = Math.max(1, Math.min(limit, 30));
  const result = await getPool().query<DemoCheckRow>(
    `select c.token, c.status, c.created_at,
            s.name as shop_name, p.title_fa as product_title
     from seller_checks c
     join shops s on s.id = c.shop_id
     left join offers o on o.id = c.offer_id
     left join products p on p.id = o.product_id
     where c.token like 'sim\\_%'
     order by c.created_at desc
     limit $1`,
    [safeLimit],
  );
  return result.rows;
}
