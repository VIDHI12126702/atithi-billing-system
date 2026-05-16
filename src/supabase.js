import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  "https://iuwwcvlgnmyionpaowja.supabase.co";

const supabaseKey =
  "sb_publishable_BVwdTOCCsajN3L5uWpgJrQ_lWg6rhBl";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);