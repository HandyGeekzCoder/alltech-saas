import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const { data, error } = await supabase.from('profiles').insert({
        id: '00000000-0000-0000-0000-000000000000',
        company: 'Test Company',
        email: 'test@example.com',
        role: 'client',
        parent_client_id: null,
        permissions: {}
    }).select();
    console.log("Insert Test Data:", data);
    console.log("Insert Test Error:", error);
}

test();
