import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks.
 * Use this before rendering any user-generated content.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}

/**
 * Sanitize text content by escaping HTML entities.
 * Use this for plain text display where no HTML is expected.
 */
export function sanitizeText(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Validate and sanitize email body content
 */
export function sanitizeEmailBody(body: string): string {
  // For plain text emails, just escape HTML entities
  return sanitizeText(body);
}

/**
 * Validate and sanitize email subject
 */
export function sanitizeEmailSubject(subject: string): string {
  // Subjects should be plain text only
  return sanitizeText(subject).substring(0, 255);
}
