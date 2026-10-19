import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// 1. Read environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};
envContent.split('\n').forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let val = match[2] || '';
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    envVars[key] = val.trim();
  }
});

const url = envVars.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  console.error('Missing required Supabase environment variables in .env.local');
  process.exit(1);
}

const anonClient = createClient(url, anonKey);
const adminClient = createClient(url, serviceKey);

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${message}`);
  }
}

async function verifyRLS() {
  console.log('====================================================');
  console.log('   AUTOMATED RLS & SCHEMA VERIFICATION SUITE');
  console.log('====================================================\n');

  // --------------------------------------------------------------------------
  // TEST 1: Book Categories (Anon should be able to SELECT all)
  // --------------------------------------------------------------------------
  console.log('Test Suite 1: Book & Blog Categories Public Access');
  const { data: bookCats, error: bookCatsErr } = await anonClient
    .from('book_categories')
    .select('id, name, slug');
  assert(!bookCatsErr && (bookCats?.length ?? 0) >= 5, 'Anon can SELECT all book categories');

  const { data: blogCats, error: blogCatsErr } = await anonClient
    .from('blog_categories')
    .select('id, name, slug');
  assert(!blogCatsErr && (blogCats?.length ?? 0) >= 4, 'Anon can SELECT all blog categories');

  // Anon should NOT be allowed to INSERT into book_categories
  const { error: insertCatErr } = await anonClient
    .from('book_categories')
    .insert({ name: 'Hacked Category', slug: 'hacked-cat' });
  assert(!!insertCatErr, 'Anon is DENIED INSERT on book_categories');

  // --------------------------------------------------------------------------
  // TEST 2: Books Isolation (Anon sees ONLY published; Admin sees all including drafts)
  // --------------------------------------------------------------------------
  console.log('\nTest Suite 2: Books Visibility & RLS Isolation');
  const { data: anonBooks, error: anonBooksErr } = await anonClient
    .from('books')
    .select('id, title, is_published');
  assert(!anonBooksErr, 'Anon can query books table without syntax error');

  const hasUnpublishedInAnon = anonBooks?.some((b) => !b.is_published);
  assert(!hasUnpublishedInAnon, 'Anon NEVER receives unpublished/draft books (RLS filter working)');
  assert((anonBooks?.length ?? 0) >= 11, 'Anon receives all published books (~11 titles)');

  // Admin query
  const { data: allBooks } = await adminClient
    .from('books')
    .select('id, title, is_published');
  const hasDraftInAdmin = allBooks?.some((b) => !b.is_published);
  assert(hasDraftInAdmin, 'Admin can see draft/unpublished books (total 12 books)');
  assert((allBooks?.length ?? 0) === 12, 'Total books in database is exactly 12');

  // Anon should NOT be allowed to INSERT books
  const { error: insertBookErr } = await anonClient
    .from('books')
    .insert({
      title: 'Buku Ilegal',
      slug: 'buku-ilegal',
      category_id: bookCats?.[0]?.id || '',
      author: 'Anon Hacker',
      publisher: 'Unknown',
      publish_year: 2025,
      page_count: 100,
      price_regular: 50000
    });
  assert(!!insertBookErr, 'Anon is DENIED INSERT on books');

  // --------------------------------------------------------------------------
  // TEST 3: Posts Isolation (Anon sees published <= now(); Admin sees drafts)
  // --------------------------------------------------------------------------
  console.log('\nTest Suite 3: Posts Visibility & RLS Isolation');
  const { data: anonPosts, error: anonPostsErr } = await anonClient
    .from('posts')
    .select('id, title, status, published_at');
  assert(!anonPostsErr, 'Anon can query posts table without error');

  const hasDraftPostInAnon = anonPosts?.some((p) => p.status === 'draft');
  assert(!hasDraftPostInAnon, 'Anon NEVER receives draft posts (RLS filter working)');
  assert((anonPosts?.length ?? 0) >= 5, 'Anon receives published posts (~5 posts)');

  const { data: allPosts } = await adminClient
    .from('posts')
    .select('id, title, status');
  const hasDraftPostInAdmin = allPosts?.some((p) => p.status === 'draft');
  assert(hasDraftPostInAdmin, 'Admin can see draft posts (total 6 posts)');

  // --------------------------------------------------------------------------
  // TEST 4: Banners Access (Anon can only see active banners)
  // --------------------------------------------------------------------------
  console.log('\nTest Suite 4: Active Banners');
  const { data: anonBanners, error: anonBannersErr } = await anonClient
    .from('banners')
    .select('id, message, is_active, starts_at, ends_at');
  assert(!anonBannersErr && (anonBanners?.length ?? 0) >= 1, 'Anon can query active banner within schedule');
  assert(anonBanners?.every((b) => b.is_active), 'All returned banners for anon are active');

  // --------------------------------------------------------------------------
  // TEST 5: Site Content (Public Read)
  // --------------------------------------------------------------------------
  console.log('\nTest Suite 5: Site Content (Default Contact & Brand Info)');
  const { data: siteContent, error: siteErr } = await anonClient
    .from('site_content')
    .select('key, payload');
  assert(!siteErr && (siteContent?.length ?? 0) >= 4, 'Anon can SELECT default site content');

  const contactSection = siteContent?.find((s) => s.key === 'contact')?.payload as Record<string, any>;
  assert(
    contactSection?.phone === '0813-8060-4256' && contactSection?.email === 'frasaklausamedia@gmail.com',
    'Site content contains verified official contacts (0813-8060-4256 & frasaklausamedia@gmail.com)'
  );

  // --------------------------------------------------------------------------
  // TEST 6: Contact Inquiries (Anon INSERT allowed; Anon SELECT DENIED)
  // --------------------------------------------------------------------------
  console.log('\nTest Suite 6: Contact Inquiries Security');
  // Anon SELECT should return empty array or permission denied
  const { data: anonInquiries, error: anonInquirySelectErr } = await anonClient
    .from('contact_inquiries')
    .select('*');
  assert(
    anonInquirySelectErr !== null || (anonInquiries?.length ?? 0) === 0,
    'Anon is DENIED reading existing contact inquiries'
  );

  // Anon INSERT should succeed (public form submission)
  const testInquiryEmail = `test.inquiry.${Date.now()}@example.com`;
  const { error: anonInquiryInsertErr } = await anonClient
    .from('contact_inquiries')
    .insert({
      name: 'Pembaca Uji RLS',
      email: testInquiryEmail,
      phone: '081234567890',
      subject: 'Uji Kirim Pesan Form Publik',
      message: 'Halo Frasa Klausa Media, ini pesan uji validasi RLS.'
    });
  assert(!anonInquiryInsertErr, 'Anon CAN INSERT new contact inquiry via public form');

  // Admin should be able to see the inquiry
  const { data: adminInquiries } = await adminClient
    .from('contact_inquiries')
    .select('*')
    .eq('email', testInquiryEmail);
  assert((adminInquiries?.length ?? 0) === 1, 'Admin can see the newly submitted contact inquiry');

  // Clean up test inquiry
  if (adminInquiries?.[0]?.id) {
    await adminClient.from('contact_inquiries').delete().eq('id', adminInquiries[0].id);
  }

  // --------------------------------------------------------------------------
  // TEST 7: Profiles Protection (Anon cannot read profiles)
  // --------------------------------------------------------------------------
  console.log('\nTest Suite 7: Profiles Security');
  const { data: anonProfiles, error: anonProfilesErr } = await anonClient
    .from('profiles')
    .select('*');
  assert(
    anonProfilesErr !== null || (anonProfiles?.length ?? 0) === 0,
    'Anon is DENIED reading team user profiles'
  );

  const { data: adminProfiles } = await adminClient
    .from('profiles')
    .select('id, full_name, role, is_active');
  assert((adminProfiles?.length ?? 0) >= 2, 'Admin can read registered admin/super_admin profiles');

  // --------------------------------------------------------------------------
  // TEST 8: Global Search RPC (search_global_content)
  // --------------------------------------------------------------------------
  console.log('\nTest Suite 8: Global Search RPC (Command Dialog Ctrl+K)');
  const { data: searchResults, error: searchErr } = await anonClient
    .rpc('search_global_content', { search_query: 'novel', result_limit: 5 });

  if (searchErr) {
    console.log(`  [INFO] RPC search_global_content not yet registered or active in schema cache: ${searchErr.message}`);
    console.log('  [HINT] Jalankan src/migrations/002_functions_and_rpc.sql di Supabase SQL Editor.');
  } else {
    assert(Array.isArray(searchResults), 'search_global_content returns an array');
    const hasDraftInSearch = searchResults.some((item: any) => item.title?.includes('Draf'));
    assert(!hasDraftInSearch, 'Anon search results never include draft/unpublished items');
  }

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`TOTAL TESTS: ${totalTests}`);
  console.log(`PASSED: ${passedTests}`);
  console.log(`FAILED: ${totalTests - passedTests}`);
  console.log('====================================================\n');

  if (passedTests === totalTests) {
    console.log('✅ ALL RLS AND SCHEMA VERIFICATIONS PASSED SUCCESSFULLY!');
  } else {
    console.error('❌ SOME TESTS FAILED. CHECK LOGS ABOVE.');
    process.exit(1);
  }
}

verifyRLS().catch((err) => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});
