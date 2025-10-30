import type { StrapiRichText } from "@/types/project";

type TextNode = { text: string; bold?: boolean };
type ElementNode = { type: string; children: TextNode[] };

const isTextNode = (node: unknown): node is TextNode =>
  typeof node === "object" && node !== null && "text" in node;

const isElementNode = (node: unknown): node is ElementNode =>
  typeof node === "object" &&
  node !== null &&
  "children" in node &&
  Array.isArray((node as ElementNode).children);

export const parseRichText = (blocks: StrapiRichText = []): string =>
  Array.isArray(blocks)
    ? blocks
        .map((block) => {
          if (!isElementNode(block) || block.type !== "paragraph") return "";

          const children = block.children
            .map((child) =>
              isTextNode(child)
                ? child.bold
                  ? `<strong>${child.text}</strong>`
                  : child.text
                : "",
            )
            .join("");

          return `${children ?? ""}`;
        })
        .filter(Boolean)
        .join("")
    : "";
