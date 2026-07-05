import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'

const teamSections = [
  {
    id: 'backend',
    title: 'Backend Team',
    accent: 'cyan',
    summary:
      'Handled the server-side workflow of the Smart Preventive Healthcare System, including API integration, symptom input processing, prediction flow, and backend stability.',
    responsibilities: [
      'Designed and supported the backend structure for processing symptom-based requests.',
      'Connected the trained prediction workflow with the web application through Flask APIs.',
      'Managed request and response handling between frontend inputs and backend outputs.',
      'Worked on symptom normalization, structured response formatting, and prediction delivery.',
      'Supported model-serving flow, backend testing, and output consistency checks.',
      'Contributed to dataset handling, training support, and overall backend integration.',
    ],
    tools: [
      'Python',
      'Flask',
      'REST API',
      'JSON Handling',
      'Prediction Flow',
      'Data Processing',
      'Model Integration',
    ],
  },
  {
    id: 'frontend',
    title: 'Frontend Team',
    accent: 'fuchsia',
    summary:
      'Handled the user-facing side of the project, including layout design, page structure, responsive styling, navigation flow, and content presentation.',
    responsibilities: [
      'Built the visual structure of the website using reusable React components.',
      'Created responsive page layouts for desktop and mobile viewing.',
      'Implemented routing between core pages such as home, features, about, team, and symptom checker.',
      'Worked on styling for sections, cards, buttons, footer areas, and content blocks.',
      'Improved readability, spacing consistency, and user experience across the platform.',
      'Aligned the interface design with the academic preventive healthcare theme of the project.',
    ],
    tools: [
      'React',
      'React Router',
      'Tailwind CSS',
      'Responsive Design',
      'Component Structure',
      'UI Styling',
      'Navigation Flow',
    ],
  },
]

const projectDetails = [
  {
    title: 'Project Architecture',
    points: [
      'The project was organized into two major implementation layers: frontend and backend.',
      'The frontend focused on user interaction, layout, routing, and display structure.',
      'The backend focused on symptom processing, prediction workflow, and response generation.',
    ],
  },
  {
    title: 'Frontend Implementation',
    points: [
      'React was used to create reusable components and structured page sections.',
      'React Router supported movement across the main project pages.',
      'Tailwind CSS was used for spacing, colors, responsiveness, and visual consistency.',
    ],
  },
  {
    title: 'Backend Implementation',
    points: [
      'Flask was used to expose backend endpoints and connect the prediction flow to the web interface.',
      'Structured request-response handling supported symptom submission and result delivery.',
      'Backend logic was aligned to return readable outputs for the user interface.',
    ],
  },
  {
    title: 'Prediction Workflow',
    points: [
      'The system processed symptom-related inputs and converted them into model-ready data.',
      'Prediction results were mapped into usable healthcare support outputs.',
      'Testing focused on result consistency, response quality, and smooth integration with the frontend.',
    ],
  },
]

function TeamCard({ section }) {
  const accentClasses =
    section.accent === 'fuchsia'
      ? {
          border: 'border-fuchsia-400/20 hover:border-fuchsia-300/30',
          badge: 'border-fuchsia-300/20 bg-fuchsia-400/10 text-fuchsia-200',
          dot: 'bg-fuchsia-300',
          glow: 'from-fuchsia-500/10 via-transparent to-transparent',
        }
      : {
          border: 'border-cyan-400/20 hover:border-cyan-300/30',
          badge: 'border-cyan-300/20 bg-cyan-400/10 text-cyan-200',
          dot: 'bg-cyan-300',
          glow: 'from-cyan-500/10 via-transparent to-transparent',
        }

  return (
    <article
      className={`group relative overflow-hidden rounded-[2rem] border bg-white/[0.04] p-6 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:bg-white/[0.06] ${accentClasses.border}`}
      style={{
        boxShadow: '0 12px 34px rgba(0, 0, 0, 0.22)',
      }}
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accentClasses.glow} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
      />
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-70" />

      <div className="relative z-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
              Contribution Area
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
              {section.title}
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              {section.summary}
            </p>
          </div>

          <span
            className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${accentClasses.badge}`}
          >
            Project Role
          </span>
        </div>

        <div className="mt-6 h-px w-full bg-gradient-to-r from-white/10 via-white/5 to-transparent" />

        <div className="mt-6">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
            What They Did
          </h3>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
            {section.responsibilities.map((item) => (
              <li key={item} className="flex gap-3">
                <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${accentClasses.dot}`} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
            Tools and Technologies
          </h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {section.tools.map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors duration-300 group-hover:text-white"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  )
}

export default function TeamPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <Navbar />

      <main className="relative mx-auto max-w-7xl px-6 py-16">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-3xl" />
          <div className="absolute bottom-20 left-1/3 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        </div>

        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] px-6 py-10 backdrop-blur-xl md:px-10 md:py-14">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          <div className="max-w-4xl">
            <p className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm font-medium text-slate-200">
              Project Contributions
            </p>

            <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight text-white md:text-6xl">
              Frontend and backend work behind the Smart Preventive Healthcare System
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              This page presents the project by implementation responsibilities instead of individual profiles.
              It highlights how the frontend and backend teams contributed to the overall development,
              integration, and presentation of the healthcare support platform.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                2 Core Teams
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                Frontend Team
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                Backend Team
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-6 lg:grid-cols-2">
          {teamSections.map((section, index) => (
            <div
              key={section.id}
              className="animate-[fadeUp_0.7s_ease-out_forwards]"
              style={{ animationDelay: `${index * 120}ms`, opacity: 0 }}
            >
              <TeamCard section={section} />
            </div>
          ))}
        </section>

        <section className="mt-20 rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl md:p-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-semibold tracking-tight text-white">
              Project Development Overview
            </h2>
            <p className="mt-4 leading-7 text-slate-300">
              The Smart Preventive Healthcare System was developed through coordinated frontend and backend implementation.
              The frontend shaped the user experience and interface structure, while the backend supported symptom handling,
              prediction workflow integration, and response generation.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {projectDetails.map((section, index) => (
              <div
                key={section.title}
                className="animate-[fadeUp_0.7s_ease-out_forwards] rounded-[1.5rem] border border-white/10 bg-slate-900/50 p-5"
                style={{ animationDelay: `${index * 100}ms`, opacity: 0 }}
              >
                <h3 className="text-xl font-semibold text-white">{section.title}</h3>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
                  {section.points.map((point) => (
                    <li key={point} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20 rounded-[2rem] border border-white/10 bg-gradient-to-br from-emerald-400/10 via-white/[0.03] to-cyan-400/10 p-6 backdrop-blur-xl md:p-8">
          <h2 className="text-3xl font-semibold tracking-tight text-white">
            Overall Contribution Summary
          </h2>
          <p className="mt-4 max-w-4xl leading-8 text-slate-200">
            The frontend team contributed to layout design, responsiveness, routing, and presentation quality,
            while the backend team contributed to logic flow, API communication, symptom processing,
            prediction support, and integration stability across the system.
          </p>
        </section>
      </main>

      <Footer />

      <style>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}