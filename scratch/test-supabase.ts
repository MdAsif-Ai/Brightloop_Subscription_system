import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("Checking Supabase connection to:", supabaseUrl);
if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // 1. Check if we can query tables
    const tables = [
      "profiles",
      "customers",
      "products",
      "product_variants",
      "plans",
      "quotation_templates",
      "subscriptions",
      "subscription_items",
      "tax_rules",
      "discount_rules",
      "invoices",
      "invoice_items",
      "payments",
      "billing_runs",
      "audit_events",
    ];

    console.log("\n--- Checking Database Tables ---");
    for (const table of tables) {
      const { data, error, count } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });
      if (error) {
        console.log(`❌ Table [${table}]: ${error.message} (code: ${error.code})`);
      } else {
        console.log(`✅ Table [${table}]: Exists (rows: ${count ?? 0})`);
      }
    }

    // 2. Check Auth
    console.log("\n--- Checking Supabase Auth ---");
    const { data: users, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.log("❌ Auth Error:", authError.message);
    } else {
      console.log(`✅ Auth works! Total users in project: ${users?.users?.length ?? 0}`);
      for (const u of users?.users || []) {
        console.log(`   - User: ${u.email} (ID: ${u.id})`);
      }
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

testConnection();
