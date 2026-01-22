import { defineAction, ActionError } from "astro:actions";
import { Resend } from "resend";

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const server = {
  contact: defineAction({
    accept: "form",
    handler: async (formData: FormData) => {
      // honeypot
      const companyRaw = formData.get("company");

      const company = typeof companyRaw === "string" ? companyRaw : "";
      if (company.trim().length > 0) {
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

      const nameRaw = formData.get("name");

      const emailRaw = formData.get("email");

      const messageRaw = formData.get("message");

      const topicRaw = formData.get("topic");

      const name = typeof nameRaw === "string" ? nameRaw : "";

      const email = typeof emailRaw === "string" ? emailRaw : "";

      const message = typeof messageRaw === "string" ? messageRaw : "";

      const topicStr = typeof topicRaw === "string" ? topicRaw : "other";

      const topic = (
        topicStr === "general" ||
        topicStr === "project" ||
        topicStr === "estimate" ||
        topicStr === "other"
          ? topicStr
          : "other"
      ) as "general" | "project" | "estimate" | "other";

      try {
        const topicLabel: Record<
          "general" | "project" | "estimate" | "other",
          string
        > = {
          general: "General Inquiry",
          project: "Project Inquiry",
          estimate: "Estimate Request",
          other: "Other Inquiry",
        };

        const subject = `[${topicLabel[topic]}] ${name}`;

        const { error } = await resend.emails.send({
          from,
          to,
          subject,
          replyTo: email,
          text: `Topic: ${topicLabel[topic]}\nName: ${name}\nEmail: ${email}\n\n${message}`,
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
