export const prerender = false;

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // ✅ متغيرات البيئة الصحيحة في Cloudflare Pages
    const env = locals.runtime.env;

    // 🔍 DEBUG (مؤقت)
    console.log("CF ENV DEBUG", {
      GOOGLE_APPS_SCRIPT_URL: env.GOOGLE_APPS_SCRIPT_URL,
      GOOGLE_DRIVE_EBOOK_LINK: env.GOOGLE_DRIVE_EBOOK_LINK,
      RESEND_API_KEY: env.RESEND_API_KEY ? "OK" : "MISSING",
    });

    const { name, email } = await request.json();

    // 1️⃣ التحقق من البيانات
    if (!name || !email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'الرجاء إدخال الاسم والبريد الإلكتروني'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'البريد الإلكتروني غير صحيح'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2️⃣ حماية إضافية (حتى لا يعود الخطأ مستقبلاً)
    if (!env.GOOGLE_APPS_SCRIPT_URL) {
      throw new Error('GOOGLE_APPS_SCRIPT_URL is missing');
    }

    if (!env.GOOGLE_DRIVE_EBOOK_LINK) {
      throw new Error('GOOGLE_DRIVE_EBOOK_LINK is missing');
    }

    if (!env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is missing');
    }

    // 3️⃣ إرسال البيانات إلى Google Sheets
    await fetch(env.GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    });

    // 4️⃣ إرسال الإيميل عبر Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Pure Focus Life <noreply@ebook.purefocuslife.fun>',
        to: email,
        subject: `مرحباً ${name}! 📚 كتابك المجاني بانتظارك`,
        html: `
<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8" />
</head>
<body style="font-family: Arial, sans-serif; background:#f4f4f4; padding:20px;">
  <div style="max-width:600px; margin:auto; background:#fff; padding:30px; border-radius:10px;">
    <h2>🎉 أهلاً ${name}!</h2>
    <p>شكراً لاشتراكك معنا، يمكنك تحميل كتابك المجاني من هنا:</p>
    <p style="text-align:center;">
      <a href="${env.GOOGLE_DRIVE_EBOOK_LINK}"
         style="display:inline-block;padding:12px 30px;background:#667eea;color:#fff;text-decoration:none;border-radius:6px;">
        📥 تحميل الكتاب
      </a>
    </p>
    <p style="font-size:13px;color:#777;">إذا لم يعمل الزر، انسخ الرابط والصقه في المتصفح.</p>
  </div>
</body>
</html>
        `
      })
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Resend Error:', errorText);
      throw new Error('فشل إرسال الإيميل');
    }

    // 5️⃣ نجاح
    return new Response(
      JSON.stringify({
        success: true,
        message: 'تم التسجيل بنجاح! تفقد بريدك الإلكتروني.'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('خطأ في API:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'حدث خطأ، الرجاء المحاولة مرة أخرى'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
