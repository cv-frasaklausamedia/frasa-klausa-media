import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

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
const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, serviceKey);

async function runSeed() {
  console.log('Seeding Book Categories...');
  const bookCategories = [
    {
      id: '11111111-1111-4111-8111-111111111101',
      name: 'Sastra & Klasik',
      slug: 'sastra-klasik',
      description: 'Karya sastra pilihan yang menggugah pemikiran, novel klasik, dan narasi mendalam.',
      seo_title: 'Katalog Buku Sastra & Klasik | Frasa Klausa Media',
      seo_description: 'Jelajahi koleksi novel sastra dan karya klasik terbitan Frasa Klausa Media.'
    },
    {
      id: '11111111-1111-4111-8111-111111111102',
      name: 'Fiksi Kontemporer',
      slug: 'fiksi-kontemporer',
      description: 'Cerita fiksi masa kini yang merefleksikan dinamika kehidupan modern dan psikologi manusia.',
      seo_title: 'Katalog Buku Fiksi Kontemporer | Frasa Klausa Media',
      seo_description: 'Koleksi fiksi kontemporer dengan alur memikat dan karakter kaya dimensi.'
    },
    {
      id: '11111111-1111-4111-8111-111111111103',
      name: 'Non-Fiksi & Esai',
      slug: 'non-fiksi-esai',
      description: 'Kumpulan esai reflektif, memoar, kritik budaya, dan literasi kontekstual.',
      seo_title: 'Katalog Non-Fiksi & Esai | Frasa Klausa Media',
      seo_description: 'Temukan buku non-fiksi dan kumpulan esai pemikiran bernas.'
    },
    {
      id: '11111111-1111-4111-8111-111111111104',
      name: 'Puisi & Sajak',
      slug: 'puisi-sajak',
      description: 'Kumpulan bait puisi dan elegi yang merawat keindahan bahasa dan kepekaan rasa.',
      seo_title: 'Koleksi Puisi & Sajak | Frasa Klausa Media',
      seo_description: 'Kumpulan buku puisi pilihan dengan ilustrasi artistik.'
    },
    {
      id: '11111111-1111-4111-8111-111111111105',
      name: 'Antologi Cerpen',
      slug: 'antologi-cerpen',
      description: 'Himpunan cerita pendek dari beragam penulis berbakat Nusantara.',
      seo_title: 'Katalog Antologi Cerpen | Frasa Klausa Media',
      seo_description: 'Antologi cerita pendek terpilih yang memotret realitas sosial.'
    }
  ];

  const { data: catData, error: catError } = await supabase.from('book_categories').upsert(bookCategories);
  if (catError) {
    console.error('Error inserting book categories:', catError);
    return;
  }
  console.log('Book categories seeded successfully!');

  console.log('Seeding Blog Categories...');
  const blogCategories = [
    {
      id: '22222222-2222-4222-8222-222222222201',
      name: 'Kabar Penerbit',
      slug: 'kabar-penerbit',
      description: 'Berita resmi peluncuran buku, agenda pameran buku, dan kegiatan literasi kami.',
      seo_title: 'Kabar Penerbit | Frasa Klausa Media',
      seo_description: 'Informasi terkini kegiatan dan rilis buku Frasa Klausa Media.'
    },
    {
      id: '22222222-2222-4222-8222-222222222202',
      name: 'Resensi & Bedah Buku',
      slug: 'resensi-bedah-buku',
      description: 'Ulasan kritis dan telaah mendalam terhadap karya-karya terbitan Frasa Klausa Media.',
      seo_title: 'Resensi Buku | Frasa Klausa Media',
      seo_description: 'Ulasan dan telaah karya sastra serta non-fiksi.'
    },
    {
      id: '22222222-2222-4222-8222-222222222203',
      name: 'Tips & Proses Menulis',
      slug: 'tips-proses-menulis',
      description: 'Panduan kreatif menyusun naskah, menyunting alur, hingga proses penerbitan mandiri.',
      seo_title: 'Tips Menulis | Frasa Klausa Media',
      seo_description: 'Pelajari kiat-kiat menulis dan mengasah naskah dari editor kami.'
    },
    {
      id: '22222222-2222-4222-8222-222222222204',
      name: 'Opini Literasi',
      slug: 'opini-literasi',
      description: 'Sudut pandang dan pemikiran kritis tentang ekosistem perbukuan dan kebudayaan membaca.',
      seo_title: 'Opini Literasi | Frasa Klausa Media',
      seo_description: 'Esai dan artikel opini seputar budaya baca dan dunia kepenulisan.'
    }
  ];

  const { error: bcatError } = await supabase.from('blog_categories').upsert(blogCategories);
  if (bcatError) {
    console.error('Error inserting blog categories:', bcatError);
    return;
  }
  console.log('Blog categories seeded successfully!');

  console.log('Seeding Books (12 Titles)...');
  const books = [
    {
      id: '33333333-3333-4333-8333-333333333301',
      title: 'Jejak Sunyi di Sudut Kota',
      slug: 'jejak-sunyi-di-sudut-kota',
      description: '<p>Sebuah novel kontemplatif tentang pencarian jati diri seorang pemuda di tengah kebisingan metropolitan. Menghadirkan benturan antara idealisme seni dan kenyataan hidup yang getir.</p><p>Ditulis dengan gaya bahasa yang puitis nan tajam, novel ini mengajak pembaca merenungi kembali arti keberadaan dan harapan yang kerap terlupakan.</p>',
      cover_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop',
      category_id: '11111111-1111-4111-8111-111111111101',
      author: 'Ahmad Farhan',
      editor: 'Dewi Lestari M.',
      publisher: 'Frasa Klausa Media',
      publish_year: 2025,
      isbn: '978-623-90001-0-1',
      page_count: 284,
      price_regular: 88000.00,
      price_promo: 75000.00,
      is_featured: true,
      is_published: true,
      shopee_url: 'https://shopee.co.id/frasaklausamedia',
      tokopedia_url: 'https://tokopedia.com/frasaklausamedia',
      whatsapp_number: '0813-8060-4256',
      whatsapp_message_template: 'Halo Frasa Klausa Media, saya ingin memesan buku "Jejak Sunyi di Sudut Kota" seharga Rp75.000. Apakah stok masih tersedia?',
      seo_title: 'Jejak Sunyi di Sudut Kota - Novel Sastra | Frasa Klausa Media',
      seo_description: 'Buku novel sastra karya Ahmad Farhan tentang pencarian jati diri di tengah hiruk pikuk kota modern.'
    },
    {
      id: '33333333-3333-4333-8333-333333333302',
      title: 'Risalah Hujan dan Kenangan',
      slug: 'risalah-hujan-dan-kenangan',
      description: '<p>Kumpulan puisi yang merangkum percakapan sunyi antara manusia, kehilangan, dan harapan baru. Setiap bait disusun layaknya rintik hujan yang menenangkan luka lama.</p>',
      cover_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800&auto=format&fit=crop',
      category_id: '11111111-1111-4111-8111-111111111104',
      author: 'Siti Nurhaliza A.',
      editor: 'Budi Prakoso',
      publisher: 'Frasa Klausa Media',
      publish_year: 2025,
      isbn: '978-623-90001-1-8',
      page_count: 120,
      price_regular: 65000.00,
      price_promo: null,
      is_featured: true,
      is_published: true,
      shopee_url: 'https://shopee.co.id/frasaklausamedia',
      tokopedia_url: null,
      whatsapp_number: '0813-8060-4256',
      whatsapp_message_template: 'Halo Frasa Klausa Media, saya ingin memesan buku "Risalah Hujan dan Kenangan" seharga Rp65.000. Apakah stok masih tersedia?',
      seo_title: 'Risalah Hujan dan Kenangan - Kumpulan Puisi | Frasa Klausa Media',
      seo_description: 'Buku puisi pilihan menyentuh rasa kehilangan dan ketabahan hati.'
    },
    {
      id: '33333333-3333-4333-8333-333333333303',
      title: 'Menulis dari Nol: Panduan Kreatif Penulis Pemula',
      slug: 'menulis-dari-nol-panduan-kreatif-penulis-pemula',
      description: '<p>Buku pegangan wajib bagi siapa saja yang ingin memulai langkah menjadi penulis buku. Mengulas struktur plot, penokohan berkarakter, penulisan dialog natural, hingga tips menembus penerbit.</p>',
      cover_url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=800&auto=format&fit=crop',
      category_id: '11111111-1111-4111-8111-111111111103',
      author: 'Rendra Mahardika',
      editor: 'Tim Redaksi FKM',
      publisher: 'Frasa Klausa Media',
      publish_year: 2024,
      isbn: '978-623-90001-2-5',
      page_count: 210,
      price_regular: 78000.00,
      price_promo: 68000.00,
      is_featured: true,
      is_published: true,
      shopee_url: 'https://shopee.co.id/frasaklausamedia',
      tokopedia_url: 'https://tokopedia.com/frasaklausamedia',
      whatsapp_number: '0813-8060-4256',
      whatsapp_message_template: 'Halo Frasa Klausa Media, saya ingin memesan buku "Menulis dari Nol" seharga Rp68.000. Apakah stok masih tersedia?',
      seo_title: 'Menulis dari Nol - Panduan Menulis Kreatif | Frasa Klausa Media',
      seo_description: 'Buku panduan menulis naskah dari nol hingga siap terbit.'
    },
    {
      id: '33333333-3333-4333-8333-333333333304',
      title: 'Lembayung di Batas Senja',
      slug: 'lembayung-di-batas-senja',
      description: '<p>Kisah tentang reuni empat sahabat masa kecil di sebuah desa pesisir yang menyimpan rahasia kelam masa lalu. Menegangkan sekaligus mengharukan.</p>',
      cover_url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=800&auto=format&fit=crop',
      category_id: '11111111-1111-4111-8111-111111111102',
      author: 'Citra Anindya',
      editor: 'Ahmad Farhan',
      publisher: 'Frasa Klausa Media',
      publish_year: 2025,
      isbn: '978-623-90001-3-2',
      page_count: 312,
      price_regular: 92000.00,
      price_promo: null,
      is_featured: false,
      is_published: true,
      shopee_url: null,
      tokopedia_url: 'https://tokopedia.com/frasaklausamedia',
      whatsapp_number: '0813-8060-4256',
      whatsapp_message_template: 'Halo Frasa Klausa Media, saya ingin memesan buku "Lembayung di Batas Senja" seharga Rp92.000. Apakah stok masih tersedia?',
      seo_title: 'Lembayung di Batas Senja - Novel Fiksi | Frasa Klausa Media',
      seo_description: 'Novel fiksi drama persahabatan dan misteri pesisir.'
    },
    {
      id: '33333333-3333-4333-8333-333333333305',
      title: 'Fragmen Waktu: Antologi Cerita Pendek',
      slug: 'fragmen-waktu-antologi-cerita-pendek',
      description: '<p>Tiga belas cerita pendek karya penulis-penulis terpilih dari sayembara penulisan Frasa Klausa Media. Menampilkan potret kemanusiaan dan kehangatan relasi keluarga.</p>',
      cover_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=800&auto=format&fit=crop',
      category_id: '11111111-1111-4111-8111-111111111105',
      author: 'Tim Penulis Nusantara',
      editor: 'Rendra Mahardika',
      publisher: 'Frasa Klausa Media',
      publish_year: 2024,
      isbn: '978-623-90001-4-9',
      page_count: 198,
      price_regular: 72000.00,
      price_promo: 60000.00,
      is_featured: false,
      is_published: true,
      shopee_url: 'https://shopee.co.id/frasaklausamedia',
      tokopedia_url: 'https://tokopedia.com/frasaklausamedia',
      whatsapp_number: '0813-8060-4256',
      whatsapp_message_template: 'Halo Frasa Klausa Media, saya ingin memesan buku "Fragmen Waktu" seharga Rp60.000. Apakah stok masih tersedia?',
      seo_title: 'Fragmen Waktu - Antologi Cerpen | Frasa Klausa Media',
      seo_description: 'Kumpulan cerita pendek memikat tentang waktu dan kenangan masa kecil.'
    },
    {
      id: '33333333-3333-4333-8333-333333333306',
      title: 'Dialektika Kata: Esai Sastra dan Kebudayaan',
      slug: 'dialektika-kata-esai-sastra-dan-kebudayaan',
      description: '<p>Telaah kritis terhadap peran sastra dalam transformasi sosial masyarakat Indonesia modern. Menawarkan sudut pandang segar tentang literasi kritis di era algoritma.</p>',
      cover_url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=800&auto=format&fit=crop',
      category_id: '11111111-1111-4111-8111-111111111103',
      author: 'Dr. Hendra Gunawan',
      editor: 'Dewi Lestari M.',
      publisher: 'Frasa Klausa Media',
      publish_year: 2024,
      isbn: '978-623-90001-5-6',
      page_count: 240,
      price_regular: 85000.00,
      price_promo: null,
      is_featured: false,
      is_published: true,
      shopee_url: 'https://shopee.co.id/frasaklausamedia',
      tokopedia_url: null,
      whatsapp_number: '0813-8060-4256',
      whatsapp_message_template: 'Halo Frasa Klausa Media, saya ingin memesan buku "Dialektika Kata" seharga Rp85.000. Apakah stok masih tersedia?',
      seo_title: 'Dialektika Kata - Esai Sastra | Frasa Klausa Media',
      seo_description: 'Kumpulan esai kebudayaan dan sastra kontemporer.'
    },
    {
      id: '33333333-3333-4333-8333-333333333307',
      title: 'Senandika Musim Gugur',
      slug: 'senandika-musim-gugur',
      description: '<p>Buku sajak dwibahasa yang mengeksplorasi kerinduan tanah air di perantauan dingin benua Eropa. Dilengkapi ilustrasi garis tinta yang estetis.</p>',
      cover_url: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?q=80&w=800&auto=format&fit=crop',
      category_id: '11111111-1111-4111-8111-111111111104',
      author: 'Maya Kartika',
      editor: 'Budi Prakoso',
      publisher: 'Frasa Klausa Media',
      publish_year: 2025,
      isbn: '978-623-90001-6-3',
      page_count: 136,
      price_regular: 69000.00,
      price_promo: 59000.00,
      is_featured: true,
      is_published: true,
      shopee_url: 'https://shopee.co.id/frasaklausamedia',
      tokopedia_url: 'https://tokopedia.com/frasaklausamedia',
      whatsapp_number: '0813-8060-4256',
      whatsapp_message_template: 'Halo Frasa Klausa Media, saya ingin memesan buku "Senandika Musim Gugur" seharga Rp59.000. Apakah stok masih tersedia?',
      seo_title: 'Senandika Musim Gugur - Kumpulan Sajak | Frasa Klausa Media',
      seo_description: 'Buku sajak puitis dengan ilustrasi artistik.'
    },
    {
      id: '33333333-3333-4333-8333-333333333308',
      title: 'Bayang-Bayang Sang Pemahat',
      slug: 'bayang-bayang-sang-pemahat',
      description: '<p>Sebuah novel sejarah berlatar kerajaan Majapahit akhir, mengisahkan pertarungan batin seorang pemahat candi antara tradisi spiritual dan pergolakan takhta.</p>',
      cover_url: 'https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?q=80&w=800&auto=format&fit=crop',
      category_id: '11111111-1111-4111-8111-111111111101',
      author: 'Teguh Prasetyo',
      editor: 'Dewi Lestari M.',
      publisher: 'Frasa Klausa Media',
      publish_year: 2025,
      isbn: '978-623-90001-7-0',
      page_count: 360,
      price_regular: 105000.00,
      price_promo: 89000.00,
      is_featured: true,
      is_published: true,
      shopee_url: 'https://shopee.co.id/frasaklausamedia',
      tokopedia_url: 'https://tokopedia.com/frasaklausamedia',
      whatsapp_number: '0813-8060-4256',
      whatsapp_message_template: 'Halo Frasa Klausa Media, saya ingin memesan buku "Bayang-Bayang Sang Pemahat" seharga Rp89.000. Apakah stok masih tersedia?',
      seo_title: 'Bayang-Bayang Sang Pemahat - Novel Sejarah | Frasa Klausa Media',
      seo_description: 'Novel sejarah epik tentang kesetiaan seni dan kejatuhan kerajaan besar.'
    },
    {
      id: '33333333-3333-4333-8333-333333333309',
      title: 'Merawat Ingatan: Catatan Literasi Komunitas',
      slug: 'merawat-ingatan-catatan-literasi-komunitas',
      description: '<p>Kisah inspiratif para pegiat taman bacaan masyarakat dari pelosok Nusantara yang gigih membawa buku bagi anak-anak di daerah terpencil.</p>',
      cover_url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=800&auto=format&fit=crop',
      category_id: '11111111-1111-4111-8111-111111111103',
      author: 'Anisa Rahmawati',
      editor: 'Tim Redaksi FKM',
      publisher: 'Frasa Klausa Media',
      publish_year: 2024,
      isbn: '978-623-90001-8-7',
      page_count: 224,
      price_regular: 76000.00,
      price_promo: null,
      is_featured: false,
      is_published: true,
      shopee_url: null,
      tokopedia_url: null,
      whatsapp_number: '0813-8060-4256',
      whatsapp_message_template: 'Halo Frasa Klausa Media, saya ingin memesan buku "Merawat Ingatan" seharga Rp76.000. Apakah stok masih tersedia?',
      seo_title: 'Merawat Ingatan - Buku Literasi Komunitas | Frasa Klausa Media',
      seo_description: 'Catatan inspiratif perjuangan taman bacaan masyarakat di Indonesia.'
    },
    {
      id: '33333333-3333-4333-8333-333333333310',
      title: 'Peta yang Mengarah Padamu',
      slug: 'peta-yang-mengarah-padamu',
      description: '<p>Novel fiksi romansa perjalanan melintasi pulau Jawa dengan kereta api. Mengisahkan dua orang asing yang tanpa sengaja bertukar buku catatan harian di stasiun.</p>',
      cover_url: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=800&auto=format&fit=crop',
      category_id: '11111111-1111-4111-8111-111111111102',
      author: 'Rian Daniswara',
      editor: 'Citra Anindya',
      publisher: 'Frasa Klausa Media',
      publish_year: 2025,
      isbn: '978-623-90001-9-4',
      page_count: 270,
      price_regular: 86000.00,
      price_promo: 74000.00,
      is_featured: false,
      is_published: true,
      shopee_url: 'https://shopee.co.id/frasaklausamedia',
      tokopedia_url: 'https://tokopedia.com/frasaklausamedia',
      whatsapp_number: '0813-8060-4256',
      whatsapp_message_template: 'Halo Frasa Klausa Media, saya ingin memesan buku "Peta yang Mengarah Padamu" seharga Rp74.000. Apakah stok masih tersedia?',
      seo_title: 'Peta yang Mengarah Padamu - Novel Romansa | Frasa Klausa Media',
      seo_description: 'Novel perjalanan cinta dan pencarian ketenangan hati di atas kereta api.'
    },
    {
      id: '33333333-3333-4333-8333-333333333311',
      title: 'Di Balik Ruang Redaksi',
      slug: 'di-balik-ruang-redaksi',
      description: '<p>Seluk beluk dunia penerbitan buku independen: dari proses membaca naskah masuk, negosiasi royalti, tata letak visual, hingga distribusi toko buku.</p>',
      cover_url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=800&auto=format&fit=crop',
      category_id: '11111111-1111-4111-8111-111111111103',
      author: 'Dewi Lestari M.',
      editor: 'Rendra Mahardika',
      publisher: 'Frasa Klausa Media',
      publish_year: 2025,
      isbn: '978-623-90002-0-0',
      page_count: 230,
      price_regular: 82000.00,
      price_promo: null,
      is_featured: false,
      is_published: true,
      shopee_url: 'https://shopee.co.id/frasaklausamedia',
      tokopedia_url: 'https://tokopedia.com/frasaklausamedia',
      whatsapp_number: '0813-8060-4256',
      whatsapp_message_template: 'Halo Frasa Klausa Media, saya ingin memesan buku "Di Balik Ruang Redaksi" seharga Rp82.000. Apakah stok masih tersedia?',
      seo_title: 'Di Balik Ruang Redaksi | Frasa Klausa Media',
      seo_description: 'Buku wawasan industri penerbitan buku dan proses kurasi naskah.'
    },
    {
      id: '33333333-3333-4333-8333-333333333312',
      title: 'Kronik Negeri Kabut (Draf Segera Terbit)',
      slug: 'kronik-negeri-kabut',
      description: '<p>Kisah fiksi spekulatif dengan nuansa mitologi kepulauan timur Nusantara. Masih dalam proses penyuntingan akhir oleh tim redaksi.</p>',
      cover_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop',
      category_id: '11111111-1111-4111-8111-111111111101',
      author: 'Bima Sakti Yudha',
      editor: 'Dewi Lestari M.',
      publisher: 'Frasa Klausa Media',
      publish_year: 2026,
      isbn: '978-623-90002-1-7',
      page_count: 340,
      price_regular: 95000.00,
      price_promo: null,
      is_featured: false,
      is_published: false, // DRAFT for RLS testing
      shopee_url: null,
      tokopedia_url: null,
      whatsapp_number: '0813-8060-4256',
      whatsapp_message_template: null,
      seo_title: 'Kronik Negeri Kabut | Frasa Klausa Media',
      seo_description: 'Kisah fiksi spekulatif segera terbit dari Frasa Klausa Media.'
    }
  ];

  const { error: booksError } = await supabase.from('books').upsert(books);
  if (booksError) {
    console.error('Error inserting books:', booksError);
    return;
  }
  console.log('12 Books seeded successfully!');

  console.log('Seeding Book Images (Gallery)...');
  const bookImages = [
    {
      book_id: '33333333-3333-4333-8333-333333333301',
      image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800&auto=format&fit=crop',
      sort_order: 1
    },
    {
      book_id: '33333333-3333-4333-8333-333333333301',
      image_url: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=800&auto=format&fit=crop',
      sort_order: 2
    },
    {
      book_id: '33333333-3333-4333-8333-333333333303',
      image_url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop',
      sort_order: 1
    },
    {
      book_id: '33333333-3333-4333-8333-333333333308',
      image_url: 'https://images.unsplash.com/photo-1474932430478-367dbb6832c1?q=80&w=800&auto=format&fit=crop',
      sort_order: 1
    }
  ];
  await supabase.from('book_images').upsert(bookImages);
  console.log('Book images seeded!');

  console.log('Seeding Book Related Pairs...');
  const related = [
    { book_id: '33333333-3333-4333-8333-333333333301', related_id: '33333333-3333-4333-8333-333333333308' },
    { book_id: '33333333-3333-4333-8333-333333333301', related_id: '33333333-3333-4333-8333-333333333302' },
    { book_id: '33333333-3333-4333-8333-333333333303', related_id: '33333333-3333-4333-8333-333333333311' },
    { book_id: '33333333-3333-4333-8333-333333333304', related_id: '33333333-3333-4333-8333-333333333310' }
  ];
  await supabase.from('book_related').upsert(related);
  console.log('Book related pairs seeded!');

  console.log('Seeding Blog Posts (6 Posts)...');
  const posts = [
    {
      title: 'Membaca Ulang Sastra di Era Kecepatan Digital',
      slug: 'membaca-ulang-sastra-di-era-kecepatan-digital',
      excerpt: 'Bagaimana membaca karya sastra yang panjang dapat menjadi sarana melatih konsentrasi dan merawat empati manusia.',
      content: '<h2>Membaca Lambat sebagai Perlawanan</h2><p>Di era di mana informasi disuguhkan dalam hitungan detik melalui video pendek dan utas media sosial, kemampuan kita untuk duduk tenang dan membaca 300 halaman novel sastra sedang diuji. Membaca karya sastra bukan sekadar kegiatan mengonsumsi kata-kata, melainkan sebuah percakapan intim dengan kesadaran manusia lain.</p><p>Ketika kita membaca karya seperti tulisan Pramoedya Ananta Toer atau Mochtar Lubis, kita tidak hanya menyerap plot; kita belajar menyelami kompleksitas emosi, konteks historis, dan pergulatan moral tokoh-tokohnya.</p><h3>Menjaga Kepekaan Rasa</h3><p>Frasa Klausa Media meyakini bahwa sastra adalah salah satu medium terbaik untuk merawat kepekaan jiwa. Mari kembali meluangkan waktu bersama buku favorit Anda setiap pagi atau sebelum terlelap.</p>',
      cover_url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=1000&auto=format&fit=crop',
      author_name: 'Rendra Mahardika',
      category_id: '22222222-2222-4222-8222-222222222204',
      status: 'published',
      published_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      seo_title: 'Membaca Ulang Sastra di Era Digital | Frasa Klausa Media',
      seo_description: 'Refleksi pentingnya membaca karya sastra secara mendalam di era arus informasi serbacepat.',
      tags: ['sastra', 'literasi', 'opini', 'buku']
    },
    {
      title: '5 Kiat Praktis Menyelesaikan Draf Pertama Novel Anda',
      slug: '5-kiat-praktis-menyelesaikan-draf-pertama-novel-anda',
      excerpt: 'Panduan praktis bagi calon penulis untuk mengalahkan writer\'s block dan menuntaskan naskah hingga kata pamungkas.',
      content: '<h2>Kiat Menuntaskan Draf Pertama</h2><p>Hampir setiap penulis pernah mengalami sindrom halaman kosong (blank page syndrome). Namun, rahasia terbesar seorang penulis yang berhasil menerbitkan buku bukanlah bakat magis, melainkan kedisiplinan dan teknik mengelola draf pertama.</p><ol><li><strong>Pisahkan Menulis dari Mengedit:</strong> Jangan mengoreksi kata saat draf pertama masih berjalan. Biarkan imajinasi mengalir.</li><li><strong>Tetapkan Target Kata Harian:</strong> 500 kata sehari jauh lebih realistis daripada memaksakan 5000 kata seminggu sekali.</li><li><strong>Kenali Motif Utama Tokoh Anda:</strong> Cerita yang kuat digerakkan oleh keinginan dan ketakutan terdalam karakternya.</li><li><strong>Ciptakan Ritual Menulis:</strong> Temukan jam paling jernih dalam hari Anda untuk duduk menghadap layar atau buku catatan.</li><li><strong>Bersahabatlah dengan Draf yang Kurang Sempurna:</strong> Draf pertama bertugas membawa cerita Anda ke dunia, bukan langsung menjadi mahakarya tanpa cela.</li></ol>',
      cover_url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1000&auto=format&fit=crop',
      author_name: 'Citra Anindya',
      category_id: '22222222-2222-4222-8222-222222222203',
      status: 'published',
      published_at: new Date(Date.now() - 7 * 86400000).toISOString(),
      seo_title: '5 Kiat Menyelesaikan Draf Pertama Novel | Frasa Klausa Media',
      seo_description: 'Panduan langkah demi langkah menulis naskah buku pertama Anda sampai selesai.',
      tags: ['tips-menulis', 'kepenulisan', 'novel', 'kreativitas']
    },
    {
      title: 'Bedah Buku "Jejak Sunyi di Sudut Kota": Antara Sunyi dan Eksistensi',
      slug: 'bedah-buku-jejak-sunyi-di-sudut-kota',
      excerpt: 'Ulasan kritis atas kekuatan naratif dan eksplorasi psikologis tokoh utama dalam novel terbaru Ahmad Farhan.',
      content: '<h2>Eksplorasi Kesunyian Manusia Modern</h2><p>Novel <em>Jejak Sunyi di Sudut Kota</em> karya Ahmad Farhan hadir sebagai sebuah cermin jernih yang memperlihatkan bagaimana manusia urban kerap merasa terisolasi meski dikelilingi jutaan manusia lain.</p><p>Penggunaan sudut pandang orang pertama dengan monolog batin yang kuat membawa pembaca menyusuri lorong-lorong kota dan lorong-lorong pikiran tokoh utamanya yang sarat kontradiksi.</p><blockquote>"Kota ini tidak pernah benar-benar tidur, tapi selalu berhasil membuat warganya merasa kesepian di tengah keramaian."</blockquote><p>Buku ini sangat direkomendasikan bagi pembaca yang menyukai fiksi kontemplatif bernuansa sastrawi.</p>',
      cover_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1000&auto=format&fit=crop',
      author_name: 'Dewi Lestari M.',
      category_id: '22222222-2222-4222-8222-222222222202',
      status: 'published',
      published_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      seo_title: 'Bedah Buku Jejak Sunyi di Sudut Kota | Frasa Klausa Media',
      seo_description: 'Resensi dan telaah mendalam novel sastra terbaru terbitan Frasa Klausa Media.',
      tags: ['resensi', 'novel-sastra', 'ulasan-buku']
    },
    {
      title: 'Frasa Klausa Media Resmi Luncurkan Katalog Cetak Musim Semi 2025',
      slug: 'frasa-klausa-media-resmi-luncurkan-katalog-cetak-musim-semi-2025',
      excerpt: 'Pengumuman resmi mengenai enam judul buku terbaru yang siap menyapa pembaca di seluruh Indonesia.',
      content: '<h2>Menghadirkan Ragam Suara Baru</h2><p>Dengan bangga kami mengumumkan peluncuran katalog cetak terbaru Frasa Klausa Media untuk periode tahun ini. Enam naskah terpilih dari berbagai genre mulai dari puisi, novel sejarah, hingga esai kebudayaan telah selesai diproduksi dan dapat dipesan melalui kanal resmi kami.</p><p>Program ini merupakan wujud komitmen Frasa Klausa Media dalam menjembatani naskah-naskah bermutu karya penulis lokal dengan ekosistem pembaca yang haus akan literatur bergizi.</p>',
      cover_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1000&auto=format&fit=crop',
      author_name: 'Redaksi Frasa Klausa',
      category_id: '22222222-2222-4222-8222-222222222201',
      status: 'published',
      published_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      seo_title: 'Peluncuran Katalog Musim Semi 2025 | Frasa Klausa Media',
      seo_description: 'Kabar resmi rilis dan peluncuran buku terbaru Frasa Klausa Media.',
      tags: ['kabar-penerbit', 'rilis-buku', 'katalog']
    },
    {
      title: 'Mengapa Tipografi dan Tata Letak Buku Sangat Menentukan Pengalaman Membaca',
      slug: 'mengapa-tipografi-dan-tata-letak-buku-menentukan-pengalaman-membaca',
      excerpt: 'Eksplorasi di balik layar desain tata letak (layout) dan pemilihan rupa huruf untuk menghasilkan buku yang memikat dan nyaman dibaca.',
      content: '<h2>Estetika Huruf dalam Buku</h2><p>Buku bukan hanya tentang teks; buku adalah objek visual yang dialami melalui mata dan jemari pembacanya. Pemilihan jenis font, lebar margin, serta proporsi spasi antar-baris menentukan apakah pembaca akan merasa lelah setelah membaca bab pertama atau justru terhanyut hingga subuh.</p><p>Di Frasa Klausa Media, setiap naskah mendapatkan perlakuan tipografi khusus sesuai nafas naskah: novel sastra menggunakan rupa huruf ber-kait (serif) yang anggun, sementara buku praktis menggunakan sans-serif yang lugas dan bersih.</p>',
      cover_url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=1000&auto=format&fit=crop',
      author_name: 'Budi Prakoso',
      category_id: '22222222-2222-4222-8222-222222222203',
      status: 'published',
      published_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      seo_title: 'Tipografi dan Tata Letak Buku | Frasa Klausa Media',
      seo_description: 'Mengenal pentingnya tata letak buku dan rupa huruf dalam penerbitan profesional.',
      tags: ['tipografi', 'desain-buku', 'layout', 'tips']
    },
    {
      title: 'Draf Eksklusif: Menatap Masa Depan Sastra Daerah (Draf Belum Terbit)',
      slug: 'draf-eksklusif-menatap-masa-depan-sastra-daerah',
      excerpt: 'Esai reflektif mengenai pentingnya revitalisasi bahasa ibu melalui naskah-naskah fiksi daerah.',
      content: '<p>Draf artikel ini masih dalam proses penulisan dan belum dipublikasikan ke publik.</p>',
      cover_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=1000&auto=format&fit=crop',
      author_name: 'Rendra Mahardika',
      category_id: '22222222-2222-4222-8222-222222222204',
      status: 'draft', // DRAFT for RLS testing
      published_at: null,
      seo_title: 'Draf Esai Sastra Daerah | Frasa Klausa Media',
      seo_description: 'Draf esai belum terbit.',
      tags: ['sastra-daerah', 'draf']
    }
  ];

  const { error: postsError } = await supabase.from('posts').upsert(posts, { onConflict: 'slug' });
  if (postsError) {
    console.error('Error inserting posts:', postsError);
    return;
  }
  console.log('6 Posts seeded successfully!');

  console.log('Seeding Banner...');
  const banner = {
    message: '🎉 Promo Spesial Peluncuran: Dapatkan diskon hingga 15% untuk seluruh novel pilihan pekan ini!',
    link_url: '/buku/jejak-sunyi-di-sudut-kota',
    starts_at: new Date(Date.now() - 86400000).toISOString(),
    ends_at: new Date(Date.now() + 30 * 86400000).toISOString(),
    is_active: true
  };
  await supabase.from('banners').upsert([banner]);
  console.log('Banner seeded!');

  console.log('Seeding Site Content...');
  const siteContent = [
    {
      key: 'hero',
      payload: {
        badge: 'Penerbit Buku Berkualitas & Independen',
        headline: 'Mewujudkan Naskah Menjadi Karya Nyata',
        subheadline: 'Frasa Klausa Media adalah rumah bagi para penulis, pembaca, dan pencinta literasi. Kami mengkurasi, merawat, dan menerbitkan naskah bermutu dengan dedikasi estetika dan narasi terbaik.',
        primary_cta_label: 'Jelajahi Katalog Buku',
        primary_cta_url: '/katalog',
        secondary_cta_label: 'Hubungi Redaksi',
        secondary_cta_url: '/kontak',
        cover_image_url: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=1200&auto=format&fit=crop'
      }
    },
    {
      key: 'about',
      payload: {
        title: 'Tentang Frasa Klausa Media',
        subtitle: 'Mewujudkan Naskah Menjadi Buku',
        vision: 'Menjadi penerbit independen rujukan di Indonesia yang melahirkan karya-karya bermutu, menginspirasi akal budi, dan memajukan peradaban literasi bangsa.',
        mission: [
          'Mendampingi penulis dari tahap kurasi naskah hingga penerbitan dengan standar editorial profesional.',
          'Menyediakan buku-buku bermutu dengan tata letak artistik dan bahan berkualitas bagi para pembaca.',
          'Membangun komunitas literasi yang inklusif, kritis, dan berdaya melalui diskusi dan bedah karya.'
        ],
        values: [
          { name: 'Integritas Karya', description: 'Menghormati hak cipta dan orisinalitas setiap gagasan yang dipercayakan kepada kami.' },
          { name: 'Kualitas Editorial', description: 'Penyuntingan teliti yang menjaga suara asli penulis sekaligus memperkuat narasi.' },
          { name: 'Aksesibilitas', description: 'Memudahkan pembaca mendapatkan buku melalui berbagai saluran pemesanan yang fleksibel.' }
        ],
        history: 'Berdiri dengan semangat memperkaya khazanah perbukuan Indonesia, Frasa Klausa Media berawal dari kumpulan editor dan penikmat sastra yang percaya bahwa setiap gagasan yang ditulis dengan ketulusan berhak menemukan pembacanya.'
      }
    },
    {
      key: 'contact',
      payload: {
        company_name: 'Frasa Klausa Media',
        tagline: 'Mewujudkan Naskah Menjadi Buku',
        email: 'frasaklausamedia@gmail.com',
        phone: '0813-8060-4256',
        whatsapp: '0813-8060-4256',
        address: 'Jl. Literasi No. 42, RT 03 / RW 05, Jakarta Timur, DKI Jakarta 13420',
        operating_hours: 'Senin – Jumat: 09.00 – 17.00 WIB',
        maps_embed_url: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126920.28639849206!2d106.758849!3d-6.229746!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f3e49fe3ddb3%3A0x72a5a51c4a034638!2sJakarta!5e0!3m2!1sid!2sid!4v1700000000000'
      }
    },
    {
      key: 'social',
      payload: {
        instagram: 'https://instagram.com/frasaklausamedia',
        facebook: 'https://facebook.com/frasaklausamedia',
        tiktok: 'https://tiktok.com/@frasaklausamedia',
        twitter: 'https://x.com/frasaklausa',
        shopee: 'https://shopee.co.id/frasaklausamedia',
        tokopedia: 'https://tokopedia.com/frasaklausamedia'
      }
    }
  ];

  for (const item of siteContent) {
    await supabase.from('site_content').upsert(item, { onConflict: 'key' });
  }
  console.log('Site Content seeded!');

  console.log('--- SEEDING COMPLETED SUCCESSFULLY! ---');
}

runSeed().catch(console.error);
