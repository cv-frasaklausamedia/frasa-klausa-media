-- Migration: 004_seed.sql
-- Description: Data benih deterministik untuk kategori buku & blog, 12 buku, galeri & buku terkait, 6 artikel blog, 1 banner promosi aktif, dan konten default situs.

DO $$
DECLARE
  -- Kategori Buku UUIDs
  v_cat_sastra uuid := '11111111-1111-4111-8111-111111111101';
  v_cat_fiksi uuid := '11111111-1111-4111-8111-111111111102';
  v_cat_nonfiksi uuid := '11111111-1111-4111-8111-111111111103';
  v_cat_puisi uuid := '11111111-1111-4111-8111-111111111104';
  v_cat_antologi uuid := '11111111-1111-4111-8111-111111111105';

  -- Kategori Blog UUIDs
  v_bcat_kabar uuid := '22222222-2222-4222-8222-222222222201';
  v_bcat_resensi uuid := '22222222-2222-4222-8222-222222222202';
  v_bcat_tips uuid := '22222222-2222-4222-8222-222222222203';
  v_bcat_opini uuid := '22222222-2222-4222-8222-222222222204';

  -- Buku UUIDs
  v_b1 uuid := '33333333-3333-4333-8333-333333333301';
  v_b2 uuid := '33333333-3333-4333-8333-333333333302';
  v_b3 uuid := '33333333-3333-4333-8333-333333333303';
  v_b4 uuid := '33333333-3333-4333-8333-333333333304';
  v_b5 uuid := '33333333-3333-4333-8333-333333333305';
  v_b6 uuid := '33333333-3333-4333-8333-333333333306';
  v_b7 uuid := '33333333-3333-4333-8333-333333333307';
  v_b8 uuid := '33333333-3333-4333-8333-333333333308';
  v_b9 uuid := '33333333-3333-4333-8333-333333333309';
  v_b10 uuid := '33333333-3333-4333-8333-333333333310';
  v_b11 uuid := '33333333-3333-4333-8333-333333333311';
  v_b12 uuid := '33333333-3333-4333-8333-333333333312';

BEGIN
  -- ============================================================================
  -- 1. SEED BOOK CATEGORIES
  -- ============================================================================
  INSERT INTO public.book_categories (id, name, slug, description, seo_title, seo_description)
  VALUES
    (v_cat_sastra, 'Sastra & Klasik', 'sastra-klasik', 'Karya sastra pilihan yang menggugah pemikiran, novel klasik, dan narasi mendalam.', 'Katalog Buku Sastra & Klasik | Frasa Klausa Media', 'Jelajahi koleksi novel sastra dan karya klasik terbitan Frasa Klausa Media.'),
    (v_cat_fiksi, 'Fiksi Kontemporer', 'fiksi-kontemporer', 'Cerita fiksi masa kini yang merefleksikan dinamika kehidupan modern dan psikologi manusia.', 'Katalog Buku Fiksi Kontemporer | Frasa Klausa Media', 'Koleksi fiksi kontemporer dengan alur memikat dan karakter kaya dimensi.'),
    (v_cat_nonfiksi, 'Non-Fiksi & Esai', 'non-fiksi-esai', 'Kumpulan esai reflektif, memoar, kritik budaya, dan literasi kontekstual.', 'Katalog Non-Fiksi & Esai | Frasa Klausa Media', 'Temukan buku non-fiksi dan kumpulan esai pemikiran bernas.'),
    (v_cat_puisi, 'Puisi & Sajak', 'puisi-sajak', 'Kumpulan bait puisi dan elegi yang merawat keindahan bahasa dan kepekaan rasa.', 'Koleksi Puisi & Sajak | Frasa Klausa Media', 'Kumpulan buku puisi pilihan dengan ilustrasi artistik.'),
    (v_cat_antologi, 'Antologi Cerpen', 'antologi-cerpen', 'Himpunan cerita pendek dari beragam penulis berbakat Nusantara.', 'Katalog Antologi Cerpen | Frasa Klausa Media', 'Antologi cerita pendek terpilih yang memotret realitas sosial.')
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description;

  -- ============================================================================
  -- 2. SEED BLOG CATEGORIES
  -- ============================================================================
  INSERT INTO public.blog_categories (id, name, slug, description, seo_title, seo_description)
  VALUES
    (v_bcat_kabar, 'Kabar Penerbit', 'kabar-penerbit', 'Berita resmi peluncuran buku, agenda pameran buku, dan kegiatan literasi kami.', 'Kabar Penerbit | Frasa Klausa Media', 'Informasi terkini kegiatan dan rilis buku Frasa Klausa Media.'),
    (v_bcat_resensi, 'Resensi & Bedah Buku', 'resensi-bedah-buku', 'Ulasan kritis dan telaah mendalam terhadap karya-karya terbitan Frasa Klausa Media.', 'Resensi Buku | Frasa Klausa Media', 'Ulasan dan telaah karya sastra serta non-fiksi.'),
    (v_bcat_tips, 'Tips & Proses Menulis', 'tips-proses-menulis', 'Panduan kreatif menyusun naskah, menyunting alur, hingga proses penerbitan mandiri.', 'Tips Menulis | Frasa Klausa Media', 'Pelajari kiat-kiat menulis dan mengasah naskah dari editor kami.'),
    (v_bcat_opini, 'Opini Literasi', 'opini-literasi', 'Sudut pandang dan pemikiran kritis tentang ekosistem perbukuan dan kebudayaan membaca.', 'Opini Literasi | Frasa Klausa Media', 'Esai dan artikel opini seputar budaya baca dan dunia kepenulisan.')
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description;

  -- ============================================================================
  -- 3. SEED BOOKS (12 Judul Buku Representatif)
  -- ============================================================================
  INSERT INTO public.books (
    id, title, slug, description, cover_url, category_id, author, editor, publisher,
    publish_year, isbn, page_count, price_regular, price_promo, is_featured, is_published,
    shopee_url, tokopedia_url, whatsapp_number, whatsapp_message_template, seo_title, seo_description
  ) VALUES
    (
      v_b1,
      'Jejak Sunyi di Sudut Kota',
      'jejak-sunyi-di-sudut-kota',
      '<p>Sebuah novel kontemplatif tentang pencarian jati diri seorang pemuda di tengah kebisingan metropolitan. Menghadirkan benturan antara idealisme seni dan kenyataan hidup yang getir.</p><p>Ditulis dengan gaya bahasa yang puitis nan tajam, novel ini mengajak pembaca merenungi kembali arti keberadaan dan harapan yang kerap terlupakan.</p>',
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop',
      v_cat_sastra,
      'Ahmad Farhan',
      'Dewi Lestari M.',
      'Frasa Klausa Media',
      2025,
      '978-623-90001-0-1',
      284,
      88000.00,
      75000.00,
      true,
      true,
      'https://shopee.co.id/frasaklausamedia',
      'https://tokopedia.com/frasaklausamedia',
      '0813-8060-4256',
      'Halo Frasa Klausa Media, saya ingin memesan buku "Jejak Sunyi di Sudut Kota" seharga Rp75.000. Apakah stok masih tersedia?',
      'Jejak Sunyi di Sudut Kota - Novel Sastra | Frasa Klausa Media',
      'Buku novel sastra karya Ahmad Farhan tentang pencarian jati diri di tengah hiruk pikuk kota modern.'
    ),
    (
      v_b2,
      'Risalah Hujan dan Kenangan',
      'risalah-hujan-dan-kenangan',
      '<p>Kumpulan puisi yang merangkum percakapan sunyi antara manusia, kehilangan, dan harapan baru. Setiap bait disusun layaknya rintik hujan yang menenangkan luka lama.</p>',
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800&auto=format&fit=crop',
      v_cat_puisi,
      'Siti Nurhaliza A.',
      'Budi Prakoso',
      'Frasa Klausa Media',
      2025,
      '978-623-90001-1-8',
      120,
      65000.00,
      NULL,
      true,
      true,
      'https://shopee.co.id/frasaklausamedia',
      NULL,
      '0813-8060-4256',
      'Halo Frasa Klausa Media, saya ingin memesan buku "Risalah Hujan dan Kenangan" seharga Rp65.000. Apakah stok masih tersedia?',
      'Risalah Hujan dan Kenangan - Kumpulan Puisi | Frasa Klausa Media',
      'Buku puisi pilihan menyentuh rasa kehilangan dan ketabahan hati.'
    ),
    (
      v_b3,
      'Menulis dari Nol: Panduan Kreatif Penulis Pemula',
      'menulis-dari-nol-panduan-kreatif-penulis-pemula',
      '<p>Buku pegangan wajib bagi siapa saja yang ingin memulai langkah menjadi penulis buku. Mengulas struktur plot, penokohan berkarakter, penulisan dialog natural, hingga tips menembus penerbit.</p>',
      'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=800&auto=format&fit=crop',
      v_cat_nonfiksi,
      'Rendra Mahardika',
      'Tim Redaksi FKM',
      'Frasa Klausa Media',
      2024,
      '978-623-90001-2-5',
      210,
      78000.00,
      68000.00,
      true,
      true,
      'https://shopee.co.id/frasaklausamedia',
      'https://tokopedia.com/frasaklausamedia',
      '0813-8060-4256',
      'Halo Frasa Klausa Media, saya ingin memesan buku "Menulis dari Nol" seharga Rp68.000. Apakah stok masih tersedia?',
      'Menulis dari Nol - Panduan Menulis Kreatif | Frasa Klausa Media',
      'Buku panduan menulis naskah dari nol hingga siap terbit.'
    ),
    (
      v_b4,
      'Lembayung di Batas Senja',
      'lembayung-di-batas-senja',
      '<p>Kisah tentang reuni empat sahabat masa kecil di sebuah desa pesisir yang menyimpan rahasia kelam masa lalu. Menegangkan sekaligus mengharukan.</p>',
      'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=800&auto=format&fit=crop',
      v_cat_fiksi,
      'Citra Anindya',
      'Ahmad Farhan',
      'Frasa Klausa Media',
      2025,
      '978-623-90001-3-2',
      312,
      92000.00,
      NULL,
      false,
      true,
      NULL,
      'https://tokopedia.com/frasaklausamedia',
      '0813-8060-4256',
      'Halo Frasa Klausa Media, saya ingin memesan buku "Lembayung di Batas Senja" seharga Rp92.000. Apakah stok masih tersedia?',
      'Lembayung di Batas Senja - Novel Fiksi | Frasa Klausa Media',
      'Novel fiksi drama persahabatan dan misteri pesisir.'
    ),
    (
      v_b5,
      'Fragmen Waktu: Antologi Cerita Pendek',
      'fragmen-waktu-antologi-cerita-pendek',
      '<p>Tiga belas cerita pendek karya penulis-penulis terpilih dari sayembara penulisan Frasa Klausa Media. Menampilkan potret kemanusiaan dan kehangatan relasi keluarga.</p>',
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=800&auto=format&fit=crop',
      v_cat_antologi,
      'Tim Penulis Nusantara',
      'Rendra Mahardika',
      'Frasa Klausa Media',
      2024,
      '978-623-90001-4-9',
      198,
      72000.00,
      60000.00,
      false,
      true,
      'https://shopee.co.id/frasaklausamedia',
      'https://tokopedia.com/frasaklausamedia',
      '0813-8060-4256',
      'Halo Frasa Klausa Media, saya ingin memesan buku "Fragmen Waktu" seharga Rp60.000. Apakah stok masih tersedia?',
      'Fragmen Waktu - Antologi Cerpen | Frasa Klausa Media',
      'Kumpulan cerita pendek memikat tentang waktu dan kenangan masa kecil.'
    ),
    (
      v_b6,
      'Dialektika Kata: Esai Sastra dan Kebudayaan',
      'dialektika-kata-esai-sastra-dan-kebudayaan',
      '<p>Telaah kritis terhadap peran sastra dalam transformasi sosial masyarakat Indonesia modern. Menawarkan sudut pandang segar tentang literasi kritis di era algoritma.</p>',
      'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=800&auto=format&fit=crop',
      v_cat_nonfiksi,
      'Dr. Hendra Gunawan',
      'Dewi Lestari M.',
      'Frasa Klausa Media',
      2024,
      '978-623-90001-5-6',
      240,
      85000.00,
      NULL,
      false,
      true,
      'https://shopee.co.id/frasaklausamedia',
      NULL,
      '0813-8060-4256',
      'Halo Frasa Klausa Media, saya ingin memesan buku "Dialektika Kata" seharga Rp85.000. Apakah stok masih tersedia?',
      'Dialektika Kata - Esai Sastra | Frasa Klausa Media',
      'Kumpulan esai kebudayaan dan sastra kontemporer.'
    ),
    (
      v_b7,
      'Senandika Musim Gugur',
      'senandika-musim-gugur',
      '<p>Buku sajak dwibahasa yang mengeksplorasi kerinduan tanah air di perantauan dingin benua Eropa. Dilengkapi ilustrasi garis tinta yang estetis.</p>',
      'https://images.unsplash.com/photo-1476275466078-4007374efbbe?q=80&w=800&auto=format&fit=crop',
      v_cat_puisi,
      'Maya Kartika',
      'Budi Prakoso',
      'Frasa Klausa Media',
      2025,
      '978-623-90001-6-3',
      136,
      69000.00,
      59000.00,
      true,
      true,
      'https://shopee.co.id/frasaklausamedia',
      'https://tokopedia.com/frasaklausamedia',
      '0813-8060-4256',
      'Halo Frasa Klausa Media, saya ingin memesan buku "Senandika Musim Gugur" seharga Rp59.000. Apakah stok masih tersedia?',
      'Senandika Musim Gugur - Kumpulan Sajak | Frasa Klausa Media',
      'Buku sajak puitis dengan ilustrasi artistik.'
    ),
    (
      v_b8,
      'Bayang-Bayang Sang Pemahat',
      'bayang-bayang-sang-pemahat',
      '<p>Sebuah novel sejarah berlatar kerajaan Majapahit akhir, mengisahkan pertarungan batin seorang pemahat candi antara tradisi spiritual dan pergolakan takhta.</p>',
      'https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?q=80&w=800&auto=format&fit=crop',
      v_cat_sastra,
      'Teguh Prasetyo',
      'Dewi Lestari M.',
      'Frasa Klausa Media',
      2025,
      '978-623-90001-7-0',
      360,
      105000.00,
      89000.00,
      true,
      true,
      'https://shopee.co.id/frasaklausamedia',
      'https://tokopedia.com/frasaklausamedia',
      '0813-8060-4256',
      'Halo Frasa Klausa Media, saya ingin memesan buku "Bayang-Bayang Sang Pemahat" seharga Rp89.000. Apakah stok masih tersedia?',
      'Bayang-Bayang Sang Pemahat - Novel Sejarah | Frasa Klausa Media',
      'Novel sejarah epik tentang kesetiaan seni dan kejatuhan kerajaan besar.'
    ),
    (
      v_b9,
      'Merawat Ingatan: Catatan Literasi Komunitas',
      'merawat-ingatan-catatan-literasi-komunitas',
      '<p>Kisah inspiratif para pegiat taman bacaan masyarakat dari pelosok Nusantara yang gigih membawa buku bagi anak-anak di daerah terpencil.</p>',
      'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=800&auto=format&fit=crop',
      v_cat_nonfiksi,
      'Anisa Rahmawati',
      'Tim Redaksi FKM',
      'Frasa Klausa Media',
      2024,
      '978-623-90001-8-7',
      224,
      76000.00,
      NULL,
      false,
      true,
      NULL,
      NULL,
      '0813-8060-4256',
      'Halo Frasa Klausa Media, saya ingin memesan buku "Merawat Ingatan" seharga Rp76.000. Apakah stok masih tersedia?',
      'Merawat Ingatan - Buku Literasi Komunitas | Frasa Klausa Media',
      'Catatan inspiratif perjuangan taman bacaan masyarakat di Indonesia.'
    ),
    (
      v_b10,
      'Peta yang Mengarah Padamu',
      'peta-yang-mengarah-padamu',
      '<p>Novel fiksi romansa perjalanan melintasi pulau Jawa dengan kereta api. Mengisahkan dua orang asing yang tanpa sengaja bertukar buku catatan harian di stasiun.</p>',
      'https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=800&auto=format&fit=crop',
      v_cat_fiksi,
      'Rian Daniswara',
      'Citra Anindya',
      'Frasa Klausa Media',
      2025,
      '978-623-90001-9-4',
      270,
      86000.00,
      74000.00,
      false,
      true,
      'https://shopee.co.id/frasaklausamedia',
      'https://tokopedia.com/frasaklausamedia',
      '0813-8060-4256',
      'Halo Frasa Klausa Media, saya ingin memesan buku "Peta yang Mengarah Padamu" seharga Rp74.000. Apakah stok masih tersedia?',
      'Peta yang Mengarah Padamu - Novel Romansa | Frasa Klausa Media',
      'Novel perjalanan cinta dan pencarian ketenangan hati di atas kereta api.'
    ),
    (
      v_b11,
      'Di Balik Ruang Redaksi',
      'di-balik-ruang-redaksi',
      '<p>Seluk beluk dunia penerbitan buku independen: dari proses membaca naskah masuk, negosiasi royalti, tata letak visual, hingga distribusi toko buku.</p>',
      'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=800&auto=format&fit=crop',
      v_cat_nonfiksi,
      'Dewi Lestari M.',
      'Rendra Mahardika',
      'Frasa Klausa Media',
      2025,
      '978-623-90002-0-0',
      230,
      82000.00,
      NULL,
      false,
      true,
      'https://shopee.co.id/frasaklausamedia',
      'https://tokopedia.com/frasaklausamedia',
      '0813-8060-4256',
      'Halo Frasa Klausa Media, saya ingin memesan buku "Di Balik Ruang Redaksi" seharga Rp82.000. Apakah stok masih tersedia?',
      'Di Balik Ruang Redaksi | Frasa Klausa Media',
      'Buku wawasan industri penerbitan buku dan proses kurasi naskah.'
    ),
    (
      v_b12,
      'Kronik Negeri Kabut (Draf Segera Terbit)',
      'kronik-negeri-kabut',
      '<p>Kisah fiksi spekulatif dengan nuansa mitologi kepulauan timur Nusantara. Masih dalam proses penyuntingan akhir oleh tim redaksi.</p>',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop',
      v_cat_sastra,
      'Bima Sakti Yudha',
      'Dewi Lestari M.',
      'Frasa Klausa Media',
      2026,
      '978-623-90002-1-7',
      340,
      95000.00,
      NULL,
      false,
      false, -- Draft (belum terbit) untuk verifikasi RLS!
      NULL,
      NULL,
      '0813-8060-4256',
      NULL,
      'Kronik Negeri Kabut | Frasa Klausa Media',
      'Kisah fiksi spekulatif segera terbit dari Frasa Klausa Media.'
    )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    slug = EXCLUDED.slug,
    price_regular = EXCLUDED.price_regular,
    price_promo = EXCLUDED.price_promo,
    is_featured = EXCLUDED.is_featured,
    is_published = EXCLUDED.is_published;

  -- ============================================================================
  -- 4. SEED BOOK IMAGES (Galeri Tambahan)
  -- ============================================================================
  INSERT INTO public.book_images (book_id, image_url, sort_order)
  VALUES
    (v_b1, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800&auto=format&fit=crop', 1),
    (v_b1, 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=800&auto=format&fit=crop', 2),
    (v_b3, 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop', 1),
    (v_b8, 'https://images.unsplash.com/photo-1474932430478-367dbb6832c1?q=80&w=800&auto=format&fit=crop', 1)
  ON CONFLICT DO NOTHING;

  -- ============================================================================
  -- 5. SEED BOOK RELATED (Rekomendasi Terkait)
  -- ============================================================================
  INSERT INTO public.book_related (book_id, related_id)
  VALUES
    (v_b1, v_b8),
    (v_b1, v_b2),
    (v_b3, v_b11),
    (v_b4, v_b10),
    (v_b6, v_b3)
  ON CONFLICT DO NOTHING;

  -- ============================================================================
  -- 6. SEED POSTS (6 Artikel Blog Lengkap)
  -- ============================================================================
  INSERT INTO public.posts (
    title, slug, excerpt, content, cover_url, author_name, category_id,
    status, published_at, seo_title, seo_description, tags
  ) VALUES
    (
      'Membaca Ulang Sastra di Era Kecepatan Digital',
      'membaca-ulang-sastra-di-era-kecepatan-digital',
      'Bagaimana membaca karya sastra yang panjang dapat menjadi sarana melatih konsentrasi dan merawat empati manusia.',
      '<h2>Membaca Lambat sebagai Perlawanan</h2><p>Di era di mana informasi disuguhkan dalam hitungan detik melalui video pendek dan utas media sosial, kemampuan kita untuk duduk tenang dan membaca 300 halaman novel sastra sedang diuji. Membaca karya sastra bukan sekadar kegiatan mengonsumsi kata-kata, melainkan sebuah percakapan intim dengan kesadaran manusia lain.</p><p>Ketika kita membaca karya seperti tulisan Pramoedya Ananta Toer atau Mochtar Lubis, kita tidak hanya menyerap plot; kita belajar menyelami kompleksitas emosi, konteks historis, dan pergulatan moral tokoh-tokohnya.</p><h3>Menjaga Kepekaan Rasa</h3><p>Frasa Klausa Media meyakini bahwa sastra adalah salah satu medium terbaik untuk merawat kepekaan jiwa. Mari kembali meluangkan waktu bersama buku favorit Anda setiap pagi atau sebelum terlelap.</p>',
      'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=1000&auto=format&fit=crop',
      'Rendra Mahardika',
      v_bcat_opini,
      'published',
      now() - interval '10 days',
      'Membaca Ulang Sastra di Era Digital | Frasa Klausa Media',
      'Refleksi pentingnya membaca karya sastra secara mendalam di era arus informasi serbacepat.',
      ARRAY['sastra', 'literasi', 'opini', 'buku']
    ),
    (
      '5 Kiat Praktis Menyelesaikan Draf Pertama Novel Anda',
      '5-kiat-praktis-menyelesaikan-draf-pertama-novel-anda',
      'Panduan praktis bagi calon penulis untuk mengalahkan writer''s block dan menuntaskan naskah hingga kata pamungkas.',
      '<h2>Kiat Menuntaskan Draf Pertama</h2><p>Hampir setiap penulis pernah mengalami sindrom halaman kosong (blank page syndrome). Namun, rahasia terbesar seorang penulis yang berhasil menerbitkan buku bukanlah bakat magis, melainkan kedisiplinan dan teknik mengelola draf pertama.</p><ol><li><strong>Pisahkan Menulis dari Mengedit:</strong> Jangan mengoreksi kata saat draf pertama masih berjalan. Biarkan imajinasi mengalir.</li><li><strong>Tetapkan Target Kata Harian:</strong> 500 kata sehari jauh lebih realistis daripada memaksakan 5000 kata seminggu sekali.</li><li><strong>Kenali Motif Utama Tokoh Anda:</strong> Cerita yang kuat digerakkan oleh keinginan dan ketakutan terdalam karakternya.</li><li><strong>Ciptakan Ritual Menulis:</strong> Temukan jam paling jernih dalam hari Anda untuk duduk menghadap layar atau buku catatan.</li><li><strong>Bersahabatlah dengan Draf yang Kurang Sempurna:</strong> Draf pertama bertugas membawa cerita Anda ke dunia, bukan langsung menjadi mahakarya tanpa cela.</li></ol>',
      'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1000&auto=format&fit=crop',
      'Citra Anindya',
      v_bcat_tips,
      'published',
      now() - interval '7 days',
      '5 Kiat Menyelesaikan Draf Pertama Novel | Frasa Klausa Media',
      'Panduan langkah demi langkah menulis naskah buku pertama Anda sampai selesai.',
      ARRAY['tips-menulis', 'kepenulisan', 'novel', 'kreativitas']
    ),
    (
      'Bedah Buku "Jejak Sunyi di Sudut Kota": Antara Sunyi dan Eksistensi',
      'bedah-buku-jejak-sunyi-di-sudut-kota',
      'Ulasan kritis atas kekuatan naratif dan eksplorasi psikologis tokoh utama dalam novel terbaru Ahmad Farhan.',
      '<h2>Eksplorasi Kesunyian Manusia Modern</h2><p>Novel <em>Jejak Sunyi di Sudut Kota</em> karya Ahmad Farhan hadir sebagai sebuah cermin jernih yang memperlihatkan bagaimana manusia urban kerap merasa terisolasi meski dikelilingi jutaan manusia lain.</p><p>Penggunaan sudut pandang orang pertama dengan monolog batin yang kuat membawa pembaca menyusuri lorong-lorong kota dan lorong-lorong pikiran tokoh utamanya yang sarat kontradiksi.</p><blockquote>"Kota ini tidak pernah benar-benar tidur, tapi selalu berhasil membuat warganya merasa kesepian di tengah keramaian."</blockquote><p>Buku ini sangat direkomendasikan bagi pembaca yang menyukai fiksi kontemplatif bernuansa sastrawi.</p>',
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1000&auto=format&fit=crop',
      'Dewi Lestari M.',
      v_bcat_resensi,
      'published',
      now() - interval '4 days',
      'Bedah Buku Jejak Sunyi di Sudut Kota | Frasa Klausa Media',
      'Resensi dan telaah mendalam novel sastra terbaru terbitan Frasa Klausa Media.',
      ARRAY['resensi', 'novel-sastra', 'ulasan-buku']
    ),
    (
      'Frasa Klausa Media Resmi Luncurkan Katalog Cetak Musim Semi 2025',
      'frasa-klausa-media-resmi-luncurkan-katalog-cetak-musim-semi-2025',
      'Pengumuman resmi mengenai enam judul buku terbaru yang siap menyapa pembaca di seluruh Indonesia.',
      '<h2>Menghadirkan Ragam Suara Baru</h2><p>Dengan bangga kami mengumumkan peluncuran katalog cetak terbaru Frasa Klausa Media untuk periode tahun ini. Enam naskah terpilih dari berbagai genre mulai dari puisi, novel sejarah, hingga esai kebudayaan telah selesai diproduksi dan dapat dipesan melalui kanal resmi kami.</p><p>Program ini merupakan wujud komitmen Frasa Klausa Media dalam menjembatani naskah-naskah bermutu karya penulis lokal dengan ekosistem pembaca yang haus akan literatur bergizi.</p>',
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1000&auto=format&fit=crop',
      'Redaksi Frasa Klausa',
      v_bcat_kabar,
      'published',
      now() - interval '2 days',
      'Peluncuran Katalog Musim Semi 2025 | Frasa Klausa Media',
      'Kabar resmi rilis dan peluncuran buku terbaru Frasa Klausa Media.',
      ARRAY['kabar-penerbit', 'rilis-buku', 'katalog']
    ),
    (
      'Mengapa Tipografi dan Tata Letak Buku Sangat Menentukan Pengalaman Membaca',
      'mengapa-tipografi-dan-tata-letak-buku-menentukan-pengalaman-membaca',
      'Eksplorasi di balik layar desain tata letak (layout) dan pemilihan rupa huruf untuk menghasilkan buku yang memikat dan nyaman dibaca.',
      '<h2>Estetika Huruf dalam Buku</h2><p>Buku bukan hanya tentang teks; buku adalah objek visual yang dialami melalui mata dan jemari pembacanya. Pemilihan jenis font, lebar margin, serta proporsi spasi antar-baris menentukan apakah pembaca akan merasa lelah setelah membaca bab pertama atau justru terhanyut hingga subuh.</p><p>Di Frasa Klausa Media, setiap naskah mendapatkan perlakuan tipografi khusus sesuai nafas naskah: novel sastra menggunakan rupa huruf ber-kait (serif) yang anggun, sementara buku praktis menggunakan sans-serif yang lugas dan bersih.</p>',
      'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=1000&auto=format&fit=crop',
      'Budi Prakoso',
      v_bcat_tips,
      'published',
      now() - interval '1 day',
      'Tipografi dan Tata Letak Buku | Frasa Klausa Media',
      'Mengenal pentingnya tata letak buku dan rupa huruf dalam penerbitan profesional.',
      ARRAY['tipografi', 'desain-buku', 'layout', 'tips']
    ),
    (
      'Draf Eksklusif: Menatap Masa Depan Sastra Daerah (Draf Belum Terbit)',
      'draf-eksklusif-menatap-masa-depan-sastra-daerah',
      'Esai reflektif mengenai pentingnya revitalisasi bahasa ibu melalui naskah-naskah fiksi daerah.',
      '<p>Draf artikel ini masih dalam proses penulisan dan belum dipublikasikan ke publik.</p>',
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=1000&auto=format&fit=crop',
      'Rendra Mahardika',
      v_bcat_opini,
      'draft', -- Draf untuk verifikasi RLS!
      NULL,
      'Draf Esai Sastra Daerah | Frasa Klausa Media',
      'Draf esai belum terbit.',
      ARRAY['sastra-daerah', 'draf']
    )
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    excerpt = EXCLUDED.excerpt,
    status = EXCLUDED.status;

  -- ============================================================================
  -- 7. SEED BANNERS (1 Banner Promosi Aktif)
  -- ============================================================================
  INSERT INTO public.banners (message, link_url, starts_at, ends_at, is_active)
  VALUES (
    '🎉 Promo Spesial Peluncuran: Dapatkan diskon hingga 15% untuk seluruh novel pilihan pekan ini!',
    '/buku/jejak-sunyi-di-sudut-kota',
    now() - interval '1 day',
    now() + interval '30 days',
    true
  )
  ON CONFLICT DO NOTHING;

  -- ============================================================================
  -- 8. SEED SITE CONTENT (Konten Default Halaman Publik)
  -- ============================================================================
  INSERT INTO public.site_content (key, payload)
  VALUES
    (
      'hero',
      '{
        "badge": "Penerbit Buku Berkualitas & Independen",
        "headline": "Mewujudkan Naskah Menjadi Karya Nyata",
        "subheadline": "Frasa Klausa Media adalah rumah bagi para penulis, pembaca, dan pencinta literasi. Kami mengkurasi, merawat, dan menerbitkan naskah bermutu dengan dedikasi estetika dan narasi terbaik.",
        "primary_cta_label": "Jelajahi Katalog Buku",
        "primary_cta_url": "/katalog",
        "secondary_cta_label": "Hubungi Redaksi",
        "secondary_cta_url": "/kontak",
        "cover_image_url": "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=1200&auto=format&fit=crop"
      }'::jsonb
    ),
    (
      'about',
      '{
        "title": "Tentang Frasa Klausa Media",
        "subtitle": "Mewujudkan Naskah Menjadi Buku",
        "vision": "Menjadi penerbit independen rujukan di Indonesia yang melahirkan karya-karya bermutu, menginspirasi akal budi, dan memajukan peradaban literasi bangsa.",
        "mission": [
          "Mendampingi penulis dari tahap kurasi naskah hingga penerbitan dengan standar editorial profesional.",
          "Menyediakan buku-buku bermutu dengan tata letak artistik dan bahan berkualitas bagi para pembaca.",
          "Membangun komunitas literasi yang inklusif, kritis, dan berdaya melalui diskusi dan bedah karya."
        ],
        "values": [
          {"name": "Integritas Karya", "description": "Menghormati hak cipta dan orisinalitas setiap gagasan yang dipercayakan kepada kami."},
          {"name": "Kualitas Editorial", "description": "Penyuntingan teliti yang menjaga suara asli penulis sekaligus memperkuat narasi."},
          {"name": "Aksesibilitas", "description": "Memudahkan pembaca mendapatkan buku melalui berbagai saluran pemesanan yang fleksibel."}
        ],
        "history": "Berdiri dengan semangat memperkaya khazanah perbukuan Indonesia, Frasa Klausa Media berawal dari kumpulan editor dan penikmat sastra yang percaya bahwa setiap gagasan yang ditulis dengan ketulusan berhak menemukan pembacanya."
      }'::jsonb
    ),
    (
      'contact',
      '{
        "company_name": "Frasa Klausa Media",
        "tagline": "Mewujudkan Naskah Menjadi Buku",
        "email": "frasaklausamedia@gmail.com",
        "phone": "0813-8060-4256",
        "whatsapp": "0813-8060-4256",
        "address": "Jl. Literasi No. 42, RT 03 / RW 05, Jakarta Timur, DKI Jakarta 13420",
        "operating_hours": "Senin – Jumat: 09.00 – 17.00 WIB",
        "maps_embed_url": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126920.28639849206!2d106.758849!3d-6.229746!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f3e49fe3ddb3%3A0x72a5a51c4a034638!2sJakarta!5e0!3m2!1sid!2sid!4v1700000000000"
      }'::jsonb
    ),
    (
      'social',
      '{
        "instagram": "https://instagram.com/frasaklausamedia",
        "facebook": "https://facebook.com/frasaklausamedia",
        "tiktok": "https://tiktok.com/@frasaklausamedia",
        "twitter": "https://x.com/frasaklausa",
        "shopee": "https://shopee.co.id/frasaklausamedia",
        "tokopedia": "https://tokopedia.com/frasaklausamedia"
      }'::jsonb
    )
  ON CONFLICT (key) DO UPDATE SET
    payload = EXCLUDED.payload,
    updated_at = now();

END $$;
