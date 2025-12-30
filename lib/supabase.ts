import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hijvrbxgjotmhhnkqsts.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpanZyYnhnam90bWhobmtxc3RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMDQ3NTcsImV4cCI6MjA4MjY4MDc1N30.XnOmNFSJ0t-vsJOQvSYVAtHeSmFUamyv3QDwCZsefvg';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});