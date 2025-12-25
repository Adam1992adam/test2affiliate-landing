export const prerender = false;

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime.env;
    const { name, email } = await request.json();

    // Validation
    if (!name || !email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Please enter your name and email'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid email address'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check environment variables
    if (!env.GOOGLE_APPS_SCRIPT_URL) {
      throw new Error('GOOGLE_APPS_SCRIPT_URL is missing');
    }
    if (!env.GOOGLE_DRIVE_EBOOK_LINK) {
      throw new Error('GOOGLE_DRIVE_EBOOK_LINK is missing');
    }
    if (!env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is missing');
    }

    // Save to Google Sheets via Apps Script
    await fetch(env.GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    });

    // Send welcome email (Day 0)
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Pure Focus Life <noreply@ebook.purefocuslife.fun>',
        to: email,
        subject: `Welcome ${name}! 📚 Your Free Memory Guide is Here`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; color: white; }
    .content { padding: 40px 30px; }
    .button { display: inline-block; padding: 15px 40px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .footer { background: #f8f8f8; padding: 20px; text-align: center; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0; font-size:32px;">🎉 Welcome ${name}!</h1>
    </div>
    
    <div class="content">
      <p style="font-size:18px; line-height:1.8;">
        Thank you for joining Pure Focus Life! Your journey to a sharper memory starts now.
      </p>
      
      <p style="font-size:16px; line-height:1.8; color:#555;">
        Inside your free guide, you'll discover:
      </p>
      
      <ul style="font-size:16px; line-height:1.8; color:#555;">
        <li>The science behind memory loss</li>
        <li>Natural ways to boost brain function</li>
        <li>30-day action plan for mental clarity</li>
      </ul>
      
      <div style="text-align:center; margin:30px 0;">
        <a href="${env.GOOGLE_DRIVE_EBOOK_LINK}" class="button">
          📥 Download Your Free Guide
        </a>
      </div>
      
      <p style="font-size:14px; color:#888; border-top:1px solid #eee; padding-top:20px; margin-top:30px;">
        💡 <strong>Quick Tip:</strong> Start reading today for maximum impact!
      </p>
      
      <p style="font-size:14px; color:#888;">
        Over the next 30 days, I'll share science-backed strategies to help you achieve laser-sharp focus and memory.
      </p>
      
      <p style="font-size:14px; color:#888; margin-top:20px;">
        To your brain health,<br>
        <strong>Pure Focus Life Team</strong>
      </p>
      
      <p style="font-size:13px; color:#999; margin-top:20px; font-style:italic;">
        P.S. - Check your spam folder if you don't see our emails. Add us to your contacts to never miss an update!
      </p>
    </div>
    
    <div class="footer">
      <p>You're receiving this because you signed up at purefocuslife.fun</p>
      <p style="margin-top:10px;">© 2024 Pure Focus Life. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
        `
      })
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Resend Error:', errorText);
      throw new Error('Failed to send email');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Success! Check your email for the download link.'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Something went wrong. Please try again.'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};