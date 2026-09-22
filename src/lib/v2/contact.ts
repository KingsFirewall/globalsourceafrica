// Public contact channels — single source of truth for the footer, the
// /contact page, and the chat assistant's prompt, so they can't drift apart.

export const CONTACT = {
  email: "info@globalsourceafrica.com",
  emailHref: "mailto:info@globalsourceafrica.com",
  whatsappDisplay: "+234 706 775 0761",
  whatsappHref: "https://wa.me/2347067750761",
  linkedinDisplay: "linkedin.com/company/globalsource-africa",
  linkedinHref: "https://www.linkedin.com/company/globalsource-africa",
} as const;
