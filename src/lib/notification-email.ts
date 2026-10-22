import type { NotificationPayload } from './schema';
export type NotificationKind = 'submission' | 'review' | 'live';
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
export function notificationEmail(
  kind: NotificationKind,
  p: NotificationPayload,
  origin: string,
  options: { demo?: boolean } = {},
) {
  const url = new URL(
    kind === 'live'
      ? options.demo
        ? '/weekly'
        : `/projects/${encodeURIComponent(p.slug)}`
      : '/me',
    origin,
  ).toString();
  let subject: string, heading: string, eyebrow: string, copy: string, cta: string;
  if (kind === 'submission') {
    subject = `We received ${p.title} · Drop`;
    heading = 'It starts with a build.';
    eyebrow = 'SUBMISSION RECEIVED';
    copy = `Your submission, ${p.title}, is safely in the review queue. A curator will take a look and send you an update.\n\nYour build stays private during review. If approved, it will be scheduled for an upcoming Drop.`;
    cta = 'Visit your workshop';
  } else if (kind === 'live') {
    subject = `${p.title} is live on Drop`;
    heading = 'You made it. It’s live.';
    eyebrow = 'OUT IN THE WORLD';
    copy = `${p.title} has joined ${p.periodLabel || 'the Weekly Drop'}. People can now discover your build and support it.\n\nTake a look, then use “Share this build” on your project page to make a card for your people.`;
    cta = 'See your live build';
  } else {
    eyebrow = 'YOUR REVIEW UPDATE';
    if (p.decision === 'approved') {
      if (!p.releaseAt) throw new Error('An approval email requires a scheduled release');
      const date = new Date(p.releaseAt);
      if (!Number.isFinite(date.getTime())) throw new Error('Invalid scheduled release');
      const label = date.toLocaleString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Kolkata',
      });
      subject = `${p.title} is approved · Drop`;
      heading = 'A place in the next Drop.';
      copy = `${p.title} is approved and scheduled for ${label} IST.\n\nIt stays private until that Drop opens. We’ll email you when your build is live.`;
    } else if (p.decision === 'changes') {
      subject = `A few changes for ${p.title} · Drop`;
      heading = 'A little more shaping.';
      copy = `Your curator has requested changes to ${p.title}. Read their feedback below, update the submission in your workshop, and resubmit when you’re ready.\n\nYour build remains private.`;
    } else if (p.decision === 'rejected') {
      subject = `An update on ${p.title} · Drop`;
      heading = 'Keep building.';
      copy = `${p.title} wasn’t selected in this review. Your curator’s feedback is below. You can revisit the build and resubmit from your workshop.\n\nYour build remains private.`;
    } else throw new Error('Invalid review decision');
    cta = 'Open your review';
  }
  const greeting = `Hey ${p.name.split(' ')[0] || 'builder'},`;
  const note = kind === 'review' && p.note ? `\n\nCurator note\n${p.note}` : '';
  const paragraphs = `${greeting}\n\n${copy}`
    .split('\n\n')
    .map((line) => `<p style="font-size:16px;line-height:1.65;margin:0 0 20px">${escape(line)}</p>`)
    .join('');
  return {
    subject: options.demo ? `[DEMO] ${subject}` : subject,
    text: `${options.demo ? 'DEMO PREVIEW — no build has been submitted, reviewed or published.\n\n' : ''}${greeting}\n\n${copy}${note}\n\n${cta}: ${url}\n\nDrop · Built here. Dropped weekly.\nYou received this update about a build you submitted to Drop.`,
    html: `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(subject)}</title></head><body style="margin:0;background:#fff9ed;color:#17151c;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;border:2px solid #17151c;background:#fff9ed"><tr><td style="padding:20px 28px;background:#000"><img src="${escape(new URL('/email/drop-wordmark.png', origin).toString())}" width="180" height="62" alt="Drop" style="display:block;border:0;max-width:100%"></td></tr><tr><td style="padding:16px 28px;background:#dbff76;border-bottom:2px solid #17151c;font-size:12px;font-weight:bold;letter-spacing:2px">${eyebrow}</td></tr>${options.demo ? '<tr><td style="padding:16px 28px;background:#c7b2ff;font-size:13px;line-height:1.5"><strong>DEMO PREVIEW</strong><br>No build has been submitted, reviewed or published. This is a sample email.</td></tr>' : ''}<tr><td style="padding:32px 28px"><h1 style="font-size:36px;line-height:1.08;letter-spacing:-1px;margin:0 0 28px">${heading}</h1>${paragraphs}${note ? `<div style="background:#c7b2ff;border:2px solid #17151c;padding:20px;margin:24px 0"><strong>Curator note</strong><p style="font-size:16px;line-height:1.65;white-space:pre-wrap;margin:10px 0 0">${escape(p.note!)}</p></div>` : ''}<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0"><tr><td style="background:#17151c;border:2px solid #17151c"><a href="${escape(url)}" style="display:inline-block;padding:16px 22px;color:#fff9ed;font-weight:bold;font-size:16px;text-decoration:none">${cta} &rarr;</a></td></tr></table><p style="font-size:13px;line-height:1.6;word-break:break-all;margin:0"><a href="${escape(url)}" style="color:#17151c">${escape(url)}</a></p></td></tr><tr><td style="padding:22px 28px;border-top:2px solid #17151c;font-size:12px;line-height:1.6">Built here. Dropped weekly.<br>You received this update about a build you submitted to Drop.</td></tr></table></td></tr></table></body></html>`,
  };
}
