import { defineAction, ActionError } from "astro:actions";
import { z } from "astro/zod";
import { Resend } from "resend";

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const server = {
  contact: defineAction({
    accept: "form",
    input: z.object({
      name: z.string().min(1).max(80),
      email: z.string().email().max(254),
      topic: z.enum(["general", "project", "estimate", "other"]),
      message: z.string().min(10).max(4000),
      company: z.string().optional(),
    }),
    handler: async (input) => {
      // honeypot
      if (input.company && input.company.trim().length > 0) {
        return { ok: true } as const;
      }

      const to = import.meta.env.CONTACT_TO;

      const from = import.meta.env.CONTACT_FROM;

      if (!to || !from) {
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Server is not configured for email sending.",
        });
      }

      const { name, email, message } = input;

      try {
        const topicLabel: Record<typeof input.topic, string> = {
          general: "General Inquiry",
          project: "Project Inquiry",
          estimate: "Estimate Request",
          other: "Other Inquiry",
        };

        const subject = `[${topicLabel[input.topic]}] ${name}`;

        const { error } = await resend.emails.send({
          from,
          to,
          subject,
          replyTo: email,
          text: `Topic: ${topicLabel[input.topic]}\nName: ${name}\nEmail: ${email}\n\n${message}`,
        });

        if (error) {
          console.error("[contact][resend]", error);
          throw new ActionError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to send message. Please try again later.",
          });
        }

        return { ok: true } as const;
      } catch (err) {
        console.error("[contact]", err);
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send message. Please try again later.",
        });
      }
    },
  }),
};
