import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CV",
  description: "Nandakishore Reddy, full-stack developer. Printable CV.",
};

const CONTACT = [
  ["Email", "nandakishorereddyg@outlook.com", "mailto:nandakishorereddyg@outlook.com"],
  ["Phone", "+91 8555 042 086", "tel:+918555042086"],
  ["GitHub", "github.com/N9601", "https://github.com/N9601"],
  ["LinkedIn", "in/gnandhakishorereddy", "https://www.linkedin.com/in/gnandhakishorereddy/"],
  ["Location", "Hyderabad, India (IST)", ""],
];

const EXPERIENCE = [
  {
    when: "Jan 2026 – present",
    title: "Software Engineer, AI & Automation",
    org: "Verge Scales · remote",
    points: [
      "n8n-first automation pipelines for e-commerce and marketing operations.",
      "End-to-end logistics and supplier coordination; front-line customer relations.",
      "On the team through the company's growth from 5-figure to 8-figure revenue.",
    ],
  },
];

const EDUCATION = [
  { when: "2026 – present", title: "B.Tech, Computer Science & Engineering", org: "VNR VJIET, Hyderabad" },
  { when: "2023 – Apr 2026", title: "Diploma, Computer Science & Engineering · CGPA 9.18 / 10", org: "TRR College of Technology, Hyderabad · top 1% of cohort · A+ in Java, DSA, RDBMS" },
  { when: "2023 – 2026", title: "Class Representative, three years running", org: "TRR College of Technology" },
];

const PROJECTS = [
  { title: "SolderDB", desc: "Local-first database on a from-scratch Go LSM engine (WAL, SSTables, leveled compaction, bloom filters, CRC32C). Collections, auth, files, realtime over SSE, JS/Go SDKs, Wails desktop control center." },
  { title: "PyroOS", desc: "x86 hobby kernel: assembly bootloader (Real → Protected Mode, GDT, IDT), VGA text driver, C kernel, QEMU dev loop." },
  { title: "AlgoWizard", desc: "Educational platform turning data structures and algorithms into scrubbable real-time visualizations. Next.js, TypeScript, Supabase with row-level security." },
  { title: "Coefficient", desc: "Browser logic simulator with sub-millisecond state transitions and SSR for first paint." },
];

const SKILLS = [
  ["Languages", "JavaScript, TypeScript, Go, Python, Java, C/C++, C#, SQL, Bash"],
  ["Frontend", "React, Next.js, Tailwind, anime.js, Three.js, WebGL/GLSL"],
  ["Backend & data", "Node.js, .NET, REST, Supabase, Postgres"],
  ["Infra & cloud", "Docker, GitHub Actions, Kubernetes, Terraform, Nginx, Vercel, Cloudflare, AWS"],
  ["Security", "IAM, OAuth/JWT, secrets management, TLS, networking"],
  ["Automation", "n8n, Zapier, webhooks, cron, API integration, e-commerce & marketing ops"],
];

/** Printable CV. `Cmd/Ctrl+P` gives a clean single-column page. */
export default function CvPage() {
  return (
    <main className="cv relative z-10 mx-auto max-w-3xl px-5 py-12 md:px-10 md:py-16">
      <div className="mb-10 flex items-center justify-between print:hidden">
        <Link href="/" data-cursor className="eyebrow text-fg">
          <span style={{ color: "var(--accent)" }}>█</span> Nandakishore Reddy
          <span className="ml-3 text-fg-4">/ CV</span>
        </Link>
        <a href="/Nandakishore_Reddy_CV.pdf" data-cursor className="eyebrow text-fg-2 transition hover:text-fg">
          Download PDF ↓
        </a>
      </div>

      <header>
        <h1 className="display display-l text-fg">Nandakishore Reddy</h1>
        <p className="mt-2 font-display text-lg text-fg-2">Full-stack developer · Hyderabad, India</p>
        <dl className="mt-5 grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
          {CONTACT.map(([k, v, href]) => (
            <div key={k} className="flex gap-3 font-mono text-[12px]">
              <dt className="w-16 shrink-0 uppercase tracking-[0.2em] text-fg-4">{k}</dt>
              <dd className="text-fg-2">{href ? <a href={href} className="hover:text-fg">{v}</a> : v}</dd>
            </div>
          ))}
        </dl>
      </header>

      <Section title="Experience">
        {EXPERIENCE.map((e) => (
          <Entry key={e.title} when={e.when} title={e.title} org={e.org}>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-fg-2">
              {e.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </Entry>
        ))}
      </Section>

      <Section title="Projects">
        {PROJECTS.map((p) => (
          <Entry key={p.title} title={p.title}>
            <p className="mt-1 text-sm text-fg-2">{p.desc}</p>
          </Entry>
        ))}
      </Section>

      <Section title="Education">
        {EDUCATION.map((e) => (
          <Entry key={e.title} when={e.when} title={e.title} org={e.org} />
        ))}
      </Section>

      <Section title="Skills">
        <dl className="space-y-2">
          {SKILLS.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[8rem_1fr] gap-3 text-sm">
              <dt className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-4">{k}</dt>
              <dd className="text-fg-2">{v}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <style>{`
        @media print {
          html, body { background: #fff !important; color: #111 !important; }
          .cv { max-width: none; padding: 0; }
          .cv * { color: #111 !important; border-color: #ccc !important; }
          .cv .text-fg-2, .cv .text-fg-3, .cv .text-fg-4 { color: #444 !important; }
        }
      `}</style>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 border-t border-[var(--line)] pt-6">
      <h2 className="eyebrow mb-4" style={{ color: "var(--accent)" }}>
        {title}
      </h2>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Entry({ when, title, org, children }: { when?: string; title: string; org?: string; children?: React.ReactNode }) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-base font-medium text-fg">{title}</h3>
        {when && <span className="font-mono text-[11px] tracking-[0.15em] text-fg-3">{when}</span>}
      </div>
      {org && <div className="text-sm text-fg-3">{org}</div>}
      {children}
    </div>
  );
}
