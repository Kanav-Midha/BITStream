import Link from "next/link";
import { Film, Filter, Globe2, PlayCircle, Sparkles, UploadCloud } from "lucide-react";
import { getCurrentUser } from "@/backend/auth/session";
import { CurtainEntry } from "@/frontend/components/curtain-entry";
import { MediaThumbnail } from "@/frontend/components/media-thumbnail";
import { Navbar } from "@/frontend/components/navbar";
import { MediaCard } from "@/frontend/components/media-card";
import { SiteFooter } from "@/frontend/components/site-footer";
import { CONTENT_CATEGORIES, PUBLIC_CATEGORY } from "@/backend/content/types";
import { getApprovedMedia, getLibraryCounts } from "@/backend/content/repository";

interface HomePageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildQueryString(search: string, category: string) {
  const params = new URLSearchParams();

  if (search) {
    params.set("q", search);
  }

  if (category && category !== "All") {
    params.set("category", category);
  }

  const query = params.toString();
  return query ? `/?${query}` : "/";
}

function shelfTitle(category: string) {
  return category === "All" ? "Now Streaming" : category;
}

export async function HomePage({ searchParams }: HomePageProps) {
  const user = await getCurrentUser();
  const isGuest = !user;
  const resolvedParams = (await searchParams) || {};
  const requestedCategory = getSingleValue(resolvedParams.category) || "All";
  const entry = getSingleValue(resolvedParams.entry) || "";
  const query = getSingleValue(resolvedParams.q) || "";
  const visibleCategories = isGuest ? ["All", PUBLIC_CATEGORY] : ["All", ...CONTENT_CATEGORIES];
  const category = visibleCategories.includes(requestedCategory) ? requestedCategory : "All";
  const approvedMedia = await getApprovedMedia({ category: category === "All" ? undefined : category, query });
  const media = isGuest ? approvedMedia.filter((item) => item.category === PUBLIC_CATEGORY) : approvedMedia;
  const counts = isGuest
    ? {
        approved: media.length,
        pending: 0,
        rejected: 0,
      }
    : await getLibraryCounts();
  const heroCards = media.slice(0, 3);
  const featured = media.slice(0, 8);
  const categoryShelves =
    isGuest
      ? [{ name: "Public", items: media.slice(0, 12) }]
      : category === "All"
      ? CONTENT_CATEGORIES.map((chip) => ({
          name: chip,
          items: media.filter((item) => item.category === chip).slice(0, 6),
        })).filter((section) => section.items.length > 0)
      : [{ name: category, items: media.slice(0, 12) }];

  return (
    <div className="min-h-screen bg-background text-white">
      <CurtainEntry enabled={entry === "curtain"} />
      <Navbar />

      <main className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: "url('/homepage-assets/film-texture.jpg')",
            backgroundPosition: "top center",
            backgroundRepeat: "repeat-y",
            backgroundSize: "100% auto",
          }}
        />

        <section className="relative min-h-[78vh] overflow-hidden border-b border-white/10 sm:min-h-[88vh]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgba(4,10,18,0.92) 0%, rgba(4,10,18,0.74) 42%, rgba(4,10,18,0.38) 70%, rgba(4,10,18,0.62) 100%), url('/homepage-assets/campus-goa.jpeg')",
              backgroundPosition: "center",
              backgroundSize: "cover",
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(244,211,161,0.14),transparent_24%),linear-gradient(180deg,rgba(5,11,20,0.05),rgba(5,11,20,0.88))]" />

          <div className="relative mx-auto flex min-h-[78vh] max-w-7xl flex-col justify-end px-4 pb-10 pt-12 sm:min-h-[88vh] sm:px-6 sm:pb-16 sm:pt-16 lg:px-8 lg:pb-24">
            <div className="max-w-3xl space-y-5 sm:space-y-6">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 py-2 text-[10px] uppercase tracking-[0.28em] text-[#f0d6a8] backdrop-blur-sm sm:px-4 sm:text-xs sm:tracking-[0.35em]">
                {isGuest ? <Globe2 className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                {isGuest ? "Open to everyone" : "BITS Goa spotlight"}
              </div>

              <div className="space-y-4">
                <h1 className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
                  {isGuest ? "Public Stream" : "Campus Stories"}
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-[#d9e3f0] sm:text-lg sm:leading-7">
                  {isGuest
                    ? "Watch approved public uploads without signing in. Campus premieres, festival edits, music drops, and showcase cuts live here in one open-screen lane."
                    : "Movies, hostel edits, tutorials, festival cuts, and late-night campus memories collected in one stream."}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="#discover"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f0d6a8] px-6 py-3 text-sm font-semibold text-[#111827] transition-colors hover:bg-[#f7dfb7] sm:justify-start"
                >
                  <PlayCircle className="h-4 w-4" />
                  {isGuest ? "Explore public picks" : "Start watching"}
                </Link>
                {isGuest ? (
                  <Link
                    href="/login?next=/"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/6 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/12 sm:justify-start"
                  >
                    <Sparkles className="h-4 w-4" />
                    Campus sign in
                  </Link>
                ) : (
                  <Link
                    href="/upload"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/6 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/12 sm:justify-start"
                  >
                    <UploadCloud className="h-4 w-4" />
                    Upload a story
                  </Link>
                )}
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:mt-12 sm:gap-4 md:grid-cols-3">
              <div className="rounded-[1.5rem] border border-white/10 bg-black/22 p-4 backdrop-blur-sm sm:p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-[#d8bc88]">Now streaming</p>
                <p className="mt-3 text-3xl font-bold text-white sm:text-4xl">{counts.approved}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-black/22 p-4 backdrop-blur-sm sm:p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-[#d8bc88]">{isGuest ? "Open picks" : "Fresh drops"}</p>
                <p className="mt-3 text-3xl font-bold text-white sm:text-4xl">{Math.min(featured.length, 8)}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-black/22 p-4 backdrop-blur-sm sm:p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-[#d8bc88]">{isGuest ? "Switch lanes" : "Tonight"}</p>
                <p className="mt-3 text-sm font-semibold text-white sm:text-lg">
                  {isGuest ? "Sign in to unlock the full campus-only catalog, uploads, and moderation flow." : "Campus stories, sharper shelves, and faster picks."}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="relative border-b border-white/10 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <form className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <input
                  type="search"
                  name="q"
                  defaultValue={query}
                  placeholder="Search titles, tags, categories"
                  className="w-full rounded-full border border-white/10 bg-white/6 px-5 py-3 text-sm text-white outline-none transition-colors placeholder:text-[#94a6bd] focus:border-[#f0d6a8]"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-[#f0d6a8]/50 hover:text-[#f0d6a8]"
              >
                <Filter className="h-4 w-4" />
                Filter
              </button>
            </form>

            <div className="mt-4 flex gap-3 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible">
              {visibleCategories.map((chip) => {
                const active = chip === category;
                return (
                  <Link
                    key={chip}
                    href={buildQueryString(query, chip)}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "bg-[#f0d6a8] text-[#111827]"
                        : "border border-white/10 bg-white/6 text-[#d7e1ef] hover:border-[#f0d6a8]/50 hover:text-[#f0d6a8]"
                    }`}
                  >
                    {chip}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section id="discover" className="relative px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {heroCards.length > 0 && (
              <div className="mb-14">
                <div className="mb-6 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-[#d8bc88]">Featured tonight</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Top picks</h2>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
                  <Link
                    href={`/video/${heroCards[0].slug}`}
                    className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d1624] shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
                  >
                    <MediaThumbnail
                      src={heroCards[0].thumbnailUrl}
                      videoUrl={heroCards[0].videoUrl}
                      alt={heroCards[0].title}
                      className="h-[300px] w-full object-cover transition-transform duration-700 group-hover:scale-105 sm:h-[420px]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
                      <span className="inline-flex rounded-full border border-white/20 bg-black/30 px-3 py-1 text-xs font-semibold text-white">
                        {heroCards[0].category}
                      </span>
                      <h3 className="mt-4 max-w-xl text-2xl font-semibold text-white sm:text-4xl">{heroCards[0].title}</h3>
                      <p className="mt-3 max-w-xl text-sm leading-6 text-[#dce5f2] sm:leading-7">{heroCards[0].description}</p>
                    </div>
                  </Link>

                  <div className="grid gap-6">
                    {heroCards.slice(1).map((item) => (
                      <Link
                        key={item.id}
                        href={`/video/${item.slug}`}
                        className="group flex h-full flex-col gap-4 rounded-[2rem] border border-white/10 bg-[#0d1624]/92 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)]"
                      >
                        <MediaThumbnail
                          src={item.thumbnailUrl}
                          videoUrl={item.videoUrl}
                          alt={item.title}
                          className="aspect-video w-full rounded-[1.5rem] object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                        <div className="flex flex-1 flex-col justify-between space-y-3">
                          <div className="space-y-3">
                          <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            {item.category}
                          </span>
                          <h3 className="text-xl font-semibold text-white sm:text-2xl">{item.title}</h3>
                          <p className="line-clamp-2 text-sm leading-6 text-[#b8c7db] sm:leading-7">{item.description}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {featured.length > 0 && (
              <div className="mb-14">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-[#d8bc88]">{isGuest ? "Open screen" : "Binge row"}</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">{shelfTitle(category)}</h2>
                  </div>
                  <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-[#b6c4d8] md:inline-flex">
                    <Film className="h-4 w-4" />
                    {featured.length} titles
                  </div>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory sm:gap-5">
                  {featured.map((item) => (
                    <div key={item.id} className="min-w-[78vw] max-w-[78vw] snap-start sm:min-w-[290px] sm:max-w-[290px]">
                      <MediaCard media={item} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-14">
              {categoryShelves.map((section) => (
                <section key={section.name}>
                  <div className="mb-6">
                    <p className="text-xs uppercase tracking-[0.28em] text-[#d8bc88]">Browse</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">{section.name}</h2>
                  </div>

                  <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory sm:gap-5">
                    {section.items.map((item) => (
                      <div key={item.id} className="min-w-[78vw] max-w-[78vw] snap-start sm:min-w-[290px] sm:max-w-[290px]">
                        <MediaCard media={item} />
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {isGuest && (
              <section className="mt-16 rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(7,17,31,0.94),rgba(18,32,52,0.94))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)] sm:p-8">
                <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.3em] text-[#f0d6a8]">Campus-only lane</p>
                    <h2 className="text-3xl font-semibold text-white sm:text-4xl">Sign in to unlock the private stream.</h2>
                    <p className="max-w-2xl text-sm leading-7 text-[#bbcade] sm:text-base">
                      Public uploads stay visible here for everyone. Sign in with your Goa BITS account to access the full discover feed, upload your own videos, track history, and review submissions.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                    <Link
                      href="/login?next=/"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f0d6a8] px-6 py-3 text-sm font-semibold text-[#111827] transition-colors hover:bg-[#f7dfb7]"
                    >
                      <Sparkles className="h-4 w-4" />
                      Sign in with Google
                    </Link>
                    <Link
                      href="#discover"
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/6 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/12"
                    >
                      <PlayCircle className="h-4 w-4" />
                      Keep browsing
                    </Link>
                  </div>
                </div>
              </section>
            )}

            {media.length === 0 && (
              <div className="rounded-[2rem] border border-dashed border-white/12 bg-white/4 px-6 py-16 text-center">
                <p className="text-lg font-semibold text-white">
                  {isGuest ? "No public uploads match this filter yet." : "No approved uploads match this filter yet."}
                </p>
                <p className="mt-2 text-sm text-[#aebdd1]">
                  {isGuest ? "Try another search or sign in to explore the full campus catalog." : "Try another category or upload the first story for it."}
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
