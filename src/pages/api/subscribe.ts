export const prerender = false;

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { name, email } = await request.json();

    // التحقق من صحة البيانات
    if (!name || !email) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'الرجاء إدخال الاسم والبريد الإلكتروني' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'البريد الإلكتروني غير صحيح' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    // 🔍 DEBUG: فحص متغيرات البيئة في Cloudflare
console.log("CF ENV DEBUG", {
  GOOGLE_APPS_SCRIPT_URL: import.meta.env.GOOGLE_APPS_SCRIPT_URL,
  GOOGLE_DRIVE_EBOOK_LINK: import.meta.env.GOOGLE_DRIVE_EBOOK_LINK,
  RESEND_API_KEY: import.meta.env.RESEND_API_KEY ? "OK" : "MISSING",
});
    // 1️⃣ إرسال البيانات إلى Google Sheet عبر Apps Script
await fetch(import.meta.env.GOOGLE_APPS_SCRIPT_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ name, email }),
});


    // 2️⃣ إرسال الإيميل الترحيبي عبر Resend
    const ebookLink = import.meta.env.GOOGLE_DRIVE_EBOOK_LINK;

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.RESEND_API_KEY}`,
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
            <meta charset="UTF-8">
            <style>
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                background-color: #f4f4f4; 
                margin: 0; 
                padding: 0; 
              }
              .container { 
                max-width: 600px; 
                margin: 40px auto; 
                background: white; 
                border-radius: 10px; 
                overflow: hidden; 
                box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
              }
              .header { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                padding: 40px 20px; 
                text-align: center; 
                color: white; 
              }
              .content { 
                padding: 40px 30px; 
                text-align: right; 
              }
              .button { 
                display: inline-block; 
                background: #667eea; 
                color: white !important; 
                padding: 15px 40px; 
                text-decoration: none; 
                border-radius: 5px; 
                font-weight: bold; 
                margin: 20px 0; 
              }
              .footer { 
                background: #f8f8f8; 
                padding: 20px; 
                text-align: center; 
                color: #666; 
                font-size: 14px; 
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 32px;">🎉 أهلاً ${name}!</h1>
              </div>
              
              <div class="content">
                <p style="font-size: 18px; line-height: 1.8;">
                  شكراً لاشتراكك معنا! يسعدنا أن نقدم لك <strong>الكتاب الإلكتروني المجاني</strong> كما وعدناك.
                </p>
                
                <p style="font-size: 16px; line-height: 1.8; color: #555;">
                  هذا الكتاب سيساعدك على تحقيق أهدافك وتطوير مهاراتك بشكل عملي وسريع.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${ebookLink}" class="button">
                    📥 تحميل الكتاب الآن
                  </a>
                </div>
                
                <p style="font-size: 14px; color: #888; border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                  💡 <strong>نصيحة:</strong> إذا كان الرابط لا يعمل، انسخه والصقه في متصفحك مباشرة.
                </p>
              </div>
              
              <div class="footer">
                <p>تم إرسال هذا الإيميل إلى: ${email}</p>
                <p style="margin-top: 10px;">© 2024 جميع الحقوق محفوظة</p>
              </div>
            </div>
          </body>
          </html>
        `
      })
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      console.error('Resend Error:', error);
      throw new Error('فشل إرسال الإيميل');
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'تم التسجيل بنجاح! تفقد بريدك الإلكتروني.' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('خطأ في API:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: 'حدث خطأ، الرجاء المحاولة مرة أخرى' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};