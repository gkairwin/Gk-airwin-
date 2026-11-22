import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Award, Download, Eye, EyeOff, FileText, Globe2, LockKeyhole, Upload, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getOwnerProfile } from "@/lib/admin-api";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin_/owner")({
  ssr: false,
  beforeLoad: async () => { try { return { owner: await getOwnerProfile() }; } catch { throw notFound(); } },
  head: () => ({ meta: [
    { title: "Private Owner Profile — GK Airwin" },
    { name: "description", content: "Restricted GK Airwin owner profile and document archive." },
    { property: "og:title", content: "Private Owner Profile — GK Airwin" },
    { property: "og:description", content: "Restricted GK Airwin owner profile and document archive." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow, noarchive" },
  ] }),
  component: OwnerPage,
});

function OwnerPage() {
  const { owner } = Route.useRouteContext();
  const navigate = useNavigate();
  const [photo, setPhoto] = useState<string>();
  const [files, setFiles] = useState<{ name: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [certificate, setCertificate] = useState<{ name: string; url: string }>();
  const [previews, setPreviews] = useState<Record<string, string>>({});
  useEffect(() => {
    let active = true;
    const objectUrls: string[] = [];
    const privateUrl = (blob: Blob) => { const url = URL.createObjectURL(blob); objectUrls.push(url); return url; };
    const load = async () => {
      if (owner.photoPath) {
        const { data } = await supabase.storage.from("owner-private").download(owner.photoPath);
        if (data && active) setPhoto(privateUrl(data));
      }
      const { data, error } = await supabase.storage.from("owner-private").list(`${owner.userId}/certificates`, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
      if (active && !error) {
        const documents = (data ?? []).filter(file => file.id);
        setFiles(documents);
        const images: Record<string, string> = {};
        await Promise.all(documents.filter(file => /\.(png|jpe?g)$/i.test(file.name)).map(async file => {
          const { data } = await supabase.storage.from("owner-private").download(`${owner.userId}/certificates/${file.name}`);
          if (data && active) images[file.name] = privateUrl(data);
        }));
        if (active) setPreviews(images);
      }
    };
    void load();
    return () => { active = false; objectUrls.forEach(url => URL.revokeObjectURL(url)); };
  }, [owner.userId, owner.photoPath, version]);

  const upload = async (file: File | undefined, portrait = false) => {
    if (!file || busy) return;
    if (file.size > 10 * 1024 * 1024 || !(portrait ? ["image/png", "image/jpeg"] : ["application/pdf", "image/png", "image/jpeg"]).includes(file.type)) {
      toast.error("Choose a PDF, PNG or JPG under 10 MB."); return;
    }
    setBusy(true);
    const path = portrait ? owner.photoPath : `${owner.userId}/certificates/${crypto.randomUUID()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    if (!path) { setBusy(false); return; }
    const { error } = await supabase.storage.from("owner-private").upload(path, file, { contentType: file.type, upsert: false });
    setBusy(false);
    if (error) toast.error("Could not upload this file. Please try again.");
    else { setVersion(v => v + 1); toast.success(portrait ? "Portrait saved privately." : "Certificate saved privately."); }
  };
  const openFile = async (name: string) => {
    const { data, error } = await supabase.storage.from("owner-private").download(`${owner.userId}/certificates/${name}`);
    if (error || !data) { toast.error("Could not open this certificate."); return; }
    const url = URL.createObjectURL(data);
    const link = document.createElement("a"); link.href = url; link.download = name.replace(/^[^_]+_/, ""); link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <main className="min-h-screen bg-owner-page text-owner-text">
    <div className="mx-auto max-w-5xl pb-12">
      <header className="flex items-center justify-between gap-2 border-b border-owner-line px-4 py-4 sm:px-8">
        <Button variant="ghost" onClick={() => void navigate({ to: "/admin" })} className="text-owner-text hover:bg-owner-surface hover:text-owner-gold"><ArrowLeft /> Control Centre</Button>
        <span className="flex items-center gap-1.5 text-xs text-owner-muted"><LockKeyhole className="size-4" /> Owner only</span>
      </header>
      <section className="grid items-center gap-8 px-6 py-10 sm:px-8 md:grid-cols-[240px_1fr] md:py-14">
        <div>
        <div className="mx-auto aspect-[4/5] w-52 overflow-hidden rounded-lg border border-owner-gold/40 bg-owner-surface md:w-full">
          {photo ? <img src={photo} alt="Owner portrait" className="h-full w-full object-contain" /> : <div className="flex h-full items-center justify-center"><UserRound className="size-16 text-owner-muted" /></div>}
        </div>
        {!photo && <label className="mt-3 block text-center text-sm text-owner-muted">Add portrait<input aria-label="Add owner portrait" type="file" accept="image/png,image/jpeg" disabled={busy} className="mx-auto mt-2 block max-w-full text-xs" onChange={e => void upload(e.currentTarget.files?.[0], true)} /></label>}
        </div>
        <div className="text-center md:text-left">
          <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase text-owner-gold md:justify-start"><Award className="size-4" /> The person behind GK Airwin</p>
          <h1 className="mt-4 break-words font-serif text-4xl leading-tight sm:text-5xl">{owner.fullName}</h1>
          <p className="mt-4 text-base font-semibold text-owner-gold">{owner.title}</p>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-owner-muted">Leading GK Airwin with a vision that reaches beyond borders. A global Aviator brand, bringing players from different countries together through one shared game.</p>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-owner-teal md:justify-start"><Globe2 className="size-5" /> One World. One Game.</div>
        </div>
      </section>
      <section className="border-y border-owner-line bg-owner-surface px-6 py-8 sm:px-8">
        <p className="text-xs font-semibold uppercase text-owner-teal">The vision</p>
        <h2 className="mt-3 font-serif text-3xl">Built for a world without borders.</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-owner-muted">GK Airwin is an Aviator gaming platform with an international outlook. Its experience welcomes players across countries, with local languages and currencies at the heart of that journey.</p>
        <p className="mt-5 text-sm font-semibold text-owner-gold">gkairwin.live</p>
      </section>
      <section className="px-6 py-8 sm:px-8">
        <div className="flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-lg font-semibold"><Award className="size-5 text-owner-gold" /> Certificates</h2><LockKeyhole className="size-4 text-owner-muted" /></div>
        {files.length === 0 && <p className="mt-3 text-sm text-owner-muted">No certificates uploaded.</p>}
        <div className="mt-5 grid gap-5 sm:grid-cols-2">{files.map(file => {
          const preview = previews[file.name];
          const title = file.name.includes("ownership-leadership") || file.name.includes("file_00000000b7308211885266c3aae6c192") ? "Ownership & Leadership" : file.name.replace(/^[^_]+_/, "").replace(/\.[^.]+$/, "");
          return <article key={file.name} className="overflow-hidden rounded-lg border border-owner-line bg-owner-surface">
          {preview && <Button variant="ghost" className="h-auto w-full rounded-none p-0 hover:bg-owner-surface" aria-label="View certificate" onClick={() => setCertificate({ name: file.name, url: preview })}><img src={preview} alt="Owner-supplied ownership and leadership certificate" className="aspect-[3/2] w-full object-contain" /></Button>}
          <div className="p-4"><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs text-owner-muted">Owner-supplied document</p><Button variant="ghost" className="mt-3 text-owner-gold hover:bg-owner-page hover:text-owner-gold" onClick={() => void openFile(file.name)}><Download /> Download</Button></div>
        </article>; })}</div>
        <label className="mt-6 block text-sm font-semibold"><span className="flex items-center gap-2 text-owner-muted"><Upload className="size-4" /> Add certificate</span><input aria-label="Add certificate" type="file" accept="application/pdf,image/png,image/jpeg" disabled={busy} className="mt-3 block max-w-full text-xs text-owner-muted" onChange={e => void upload(e.currentTarget.files?.[0])} /></label>
      </section>
      <section className="border-t border-owner-line px-6 py-6 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-sm font-semibold text-owner-muted"><LockKeyhole className="size-4" /> Personal details</h2><Button variant="ghost" className="text-owner-gold hover:bg-owner-surface hover:text-owner-gold" onClick={() => setShowDetails(v => !v)}>{showDetails ? <EyeOff /> : <Eye />}{showDetails ? "Hide details" : "Show details"}</Button></div>
        {showDetails && <dl className="mt-4 divide-y divide-owner-line"><div className="flex justify-between gap-3 py-4"><dt className="text-sm text-owner-muted">Phone number</dt><dd data-private className="text-sm font-semibold">{owner.phone}</dd></div><div className="flex justify-between gap-3 py-4"><dt className="text-sm text-owner-muted">National ID</dt><dd data-private className="text-sm font-semibold">{owner.nationalId}</dd></div></dl>}
      </section>
      <footer className="px-6 pt-5 text-xs text-owner-muted sm:px-8">GK Airwin · Leadership profile</footer>
    </div>
    <Dialog open={!!certificate} onOpenChange={open => { if (!open) setCertificate(undefined); }}><DialogContent className="max-w-4xl border-owner-line bg-owner-page text-owner-text"><DialogTitle>Ownership & Leadership Certificate</DialogTitle><DialogDescription className="text-owner-muted">Owner-supplied GK Airwin document; not independent licensing verification.</DialogDescription>{certificate && <img src={certificate.url} alt="Owner-supplied certificate" className="max-h-[70svh] w-full object-contain" />}<div className="flex gap-2"><Button variant="ghost" className="text-owner-gold hover:bg-owner-surface hover:text-owner-gold" onClick={() => { if (certificate) void openFile(certificate.name); }}><Download /> Download</Button><Button variant="ghost" className="hover:bg-owner-surface hover:text-owner-text" onClick={() => setCertificate(undefined)}><X /> Close</Button></div></DialogContent></Dialog>
  </main>;
}