import { renderOgCard } from "@/lib/og";
import { ogCards, ogImageName } from "@/lib/seo";

// One PNG per public route (out/og/<name>.png), rendered at build time.
export const dynamic = "force-static";
export const dynamicParams = false;

function cardsByImageName() {
  return new Map(
    Object.entries(ogCards()).map(([path, card]) => [ogImageName(path), card]),
  );
}

export function generateStaticParams() {
  return [...cardsByImageName().keys()].map((image) => ({ image }));
}

export async function GET(
  _request: Request,
  { params }: RouteContext<"/og/[image]">,
) {
  const { image } = await params;
  const card = cardsByImageName().get(image);
  if (!card) return new Response("Not found", { status: 404 });
  return renderOgCard(card);
}
