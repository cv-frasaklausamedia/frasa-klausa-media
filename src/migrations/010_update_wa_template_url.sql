-- Migration 010: Update books whatsapp_message_template to support dynamic URL placeholder
-- Menyetel ulang template statis peninggalan seed awal ke NULL agar otomatis mewarisi DEFAULT_WA_TEMPLATE dinamis

UPDATE public.books
SET whatsapp_message_template = NULL
WHERE whatsapp_message_template IS NOT NULL
  AND whatsapp_message_template LIKE 'Halo Frasa Klausa Media, saya ingin memesan buku%'
  AND whatsapp_message_template NOT LIKE '%{url}%';
