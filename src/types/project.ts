import type { Node } from "slate";

export type StrapiRichText = Node[];

export type StrapiImage = {
  id: number;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number;
  height: number;
  formats: {
    large?: ImageFormat;
    medium?: ImageFormat;
    small?: ImageFormat;
    thumbnail?: ImageFormat;
  };
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl: string | null;
  provider: string;
  createdAt: string;
  updatedAt: string;
};

export type Thumbnail = StrapiImage;

export type ImageFormat = {
  ext: string;
  url: string;
  hash: string;
  mime: string;
  name: string;
  path: string | null;
  size: number;
  width: number;
  height: number;
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
};

export type Stacks = {
  id: number;
  name: string;
  slug: string;
  icon: StrapiImage;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
};

export type Meta = {
  id: number;
  title: string;
  body: string;
};

export type Flow = {
  id: number;
  title: string;
  body: string;
};

export type Requirement = {
  id: number;
  body: string;
};

export type Solution = {
  id: number;
  title: StrapiRichText;
  label: string;
  body: string;
  image?: StrapiImage;
};

export type Home = {
  stacks: Stacks[];
};

export type Project = {
  id: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  title: string;
  description: string;
  slug: string;
  label: string;
  thumbnail: Thumbnail | null;
  categories: Category[];
  stacks: Stacks[];
  metas: Meta[];
  flows: Flow[];
  requirements: Requirement[];
  solutions: Solution[];
};
