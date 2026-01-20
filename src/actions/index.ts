import { defineAction } from "astro:actions";
import { z } from "astro/zod";
import { Resend } from "resend";

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
      console.log("[contact] handler start");
      console.log("[contact] env", {
        hasKey: Boolean(import.meta.env.RESEND_API_KEY),
        hasTo: Boolean(import.meta.env.CONTACT_TO),
        hasFrom: Boolean(import.meta.env.CONTACT_FROM),
      });
      console.log("[contact] input", {
        nameLen: input.name?.length,
        emailLen: input.email?.length,
        topic: input.topic,
        messageLen: input.message?.length,
        hasCompany: Boolean(input.company && input.company.trim().length > 0),
      });
      // honeypot
      if (input.company && input.company.trim().length > 0) {
        return { ok: true } as const;
      }

      const apiKey = import.meta.env.RESEND_API_KEY;
      if (!apiKey) {
        return {
          ok: false,
          message: "Server is not configured for email sending.",
        } as const;
      }

      const resend = new Resend(apiKey);

      const to = import.meta.env.CONTACT_TO;

      const from = import.meta.env.CONTACT_FROM;

      if (!to || !from) {
        return {
          ok: false,
          message: "Server is not configured for email sending.",
        } as const;
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
          return {
            ok: false,
            message: "Failed to send message. Please try again later.",
          } as const;
        }

        return { ok: true } as const;
      } catch (err) {
        console.error("[contact]", err);
        return {
          ok: false,
          message: "Failed to send message. Please try again later.",
        } as const;
      }
    },
  }),
};
