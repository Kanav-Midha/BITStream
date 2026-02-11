import { Film, UploadCloud } from "lucide-react";
import { Navbar } from "@/frontend/components/navbar";
import { SiteFooter } from "@/frontend/components/site-footer";
import { requireCampusUser } from "@/backend/auth/session";
import { cloudinaryUploadsEnabled } from "@/backend/storage/file-uploads";
import { UploadForm } from "@/frontend/modules/upload/upload-form";

interface UploadPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function pickValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function UploadPage({ searchParams }: UploadPageProps) {
  const user = await requireCampusUser("/upload");
  const resolvedParams = (await searchParams) || {};
  const status = pickValue(resolvedParams.status);
  const message = pickValue(resolvedParams.message);
  const directUploadEnabled = cloudinaryUploadsEnabled() || process.env.VERCEL !== "1";

  return (
    <div className="min-h-screen bg-background text-white">
      <Navbar />

      <main className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: "url('/homepage-assets/film-texture.jpg')",
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        />

        <section className="relative border-b border-white/10 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
              <aside className="space-y-6">
                <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-sm sm:p-8">
                  <p className="text-xs uppercase tracking-[0.3em] text-[#d8bc88]">Upload</p>
                  <h1 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Send a story for review</h1>
                  <p className="mt-4 text-sm leading-6 text-[#afc0d6] sm:leading-7">
                    Signed in as <span className="font-semibold text-white">{user.email}</span>. Add a clean hosted
                    video link, a thumbnail, and the category. Admins will review before it goes live.
                  </p>
                </div>

                <div className="rounded-[2rem] border border-white/10 bg-[#0d1624]/90 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.2)] sm:p-8">
                  <p className="text-xs uppercase tracking-[0.3em] text-[#d8bc88]">Best flow</p>
                  <div className="mt-6 space-y-5">
                    {[
                      directUploadEnabled
                        ? "Upload a video file directly or paste a hosted video URL."
                        : "Paste a hosted MP4 or WebM URL for the video.",
                      directUploadEnabled
                        ? "Upload a thumbnail image directly or paste an image URL."
                        : "Add a hosted image URL for the thumbnail.",
                      "Keep the title short and tags sharp so the shelf looks clean.",
                    ].map((point, index) => (
                      <div key={point} className="flex gap-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/8 text-sm font-semibold text-[#f0d6a8]">
                          {index + 1}
                        </div>
                        <p className="pt-1 text-sm leading-7 text-[#afc0d6]">{point}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>

              <section className="rounded-[2rem] border border-white/10 bg-[#0d1624]/92 p-5 shadow-[0_30px_100px_rgba(0,0,0,0.3)] sm:p-8">
                <UploadForm directUploadEnabled={directUploadEnabled} message={message} status={status} />
              </section>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
