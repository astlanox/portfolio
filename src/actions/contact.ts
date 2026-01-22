import { defineAction } from "astro:actions";
import { Resend } from "resend";
import { z } from "astro/zod";

export const server = {
  contact: defineAction({
    accept: "form",

    handler: async (input) => {
      // honeypot
      //   if (input.company && input.company.trim().length > 0) {
      //     return { ok: true } as const;
      //   }

      const apiKey = import.meta.env.RESEND_API_KEY;
      if (!apiKey) {
        return { ok: false, message: "RESEND_API_KEY is missing" } as const;
      }

      const resend = new Resend(apiKey);

      const { data, error } = await resend.emails.send({
        from: "Acme <onboarding@resend.dev>",
        to: ["delivered@resend.dev"],
        subject: "Hello world",
        html: "<strong>It works!</strong>",
      });

      if (error) {
        console.error("[contact][resend]", error);
        return { ok: false, message: error.message } as const;
      }

      return { ok: true, data } as const;
    },
  }),
};
