import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { createClient, type Session, type SupabaseClient, type User } from "@supabase/supabase-js";

type Role = "admin" | "student" | "parent" | "";

type AuthProfile = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  role: Role;
  name: string;
};

type AuthState = {
  client: SupabaseClient | null;
  profile: AuthProfile;
  configError: string;
};

type ApiEnvelope<T> = {
  data?: T;
  message?: string;
};

type HomeworkPost = {
  id: string;
  title: string;
  subject?: string;
  description: string;
  dueDate?: string;
};

type HomeworkSubmission = {
  id: string;
  assignmentId?: string;
  assignmentTitle?: string;
  studentName: string;
  fileName?: string;
  fileType?: string;
  fileData: string;
  uploadedAt?: string;
};

type StudentAccount = {
  id: string;
  email: string;
  name: string;
};

type StudentRemark = {
  id: string;
  studentEmail: string;
  studentName?: string;
  remark: string;
  createdAt?: string;
};

type ClassSession = {
  id: string;
  title: string;
  sessionDate: string;
  startTime?: string;
  endTime?: string;
  recordingUrl?: string;
  notes?: string;
  createdAt?: string;
};

type Book = {
  id: string | number;
  title: string;
  author: string;
  genre: string;
  year: number;
  pages?: number | null;
  language?: string;
  available: boolean;
  summary?: string;
};

type TechNewsItem = {
  id: number;
  title: string;
  author: string;
  score: number;
  comments: number;
  url: string;
  discussionUrl: string;
  publishedAt?: string | null;
};

type ApiClient = {
  getPosts: () => Promise<HomeworkPost[]>;
  getSubmissions: () => Promise<HomeworkSubmission[]>;
  getRemarks: () => Promise<StudentRemark[]>;
  getSessions: () => Promise<ClassSession[]>;
  getStudents: () => Promise<StudentAccount[]>;
  postHomework: (payload: {
    title: string;
    subject: string;
    description: string;
    dueDate: string;
  }) => Promise<HomeworkPost>;
  submitHomework: (payload: {
    studentName: string;
    assignmentId: string;
    assignmentTitle: string;
    fileName: string;
    fileType: string;
    fileData: string;
  }) => Promise<HomeworkSubmission>;
  createAccount: (payload: {
    name: FormDataEntryValue | null;
    email: FormDataEntryValue | null;
    password: FormDataEntryValue | null;
    role: Role;
    childEmails: FormDataEntryValue | string | null;
  }) => Promise<{ email: string; role: Role }>;
  linkParent: (payload: {
    parentEmail: FormDataEntryValue | null;
    childEmails: FormDataEntryValue | null;
  }) => Promise<{ email: string; childEmails: string[] }>;
  createRemark: (payload: {
    studentEmail?: string;
    studentName?: string;
    remark: FormDataEntryValue | null;
  }) => Promise<StudentRemark>;
  createSession: (payload: {
    title: string;
    sessionDate: string;
    startTime: string;
    endTime: string;
    recordingUrl: string;
    notes: string;
  }) => Promise<ClassSession>;
};

const roleHome = (role: Role) => {
  if (role === "admin") return "/homework-admin";
  if (role === "parent") return "/parent";
  return "/homework-student";
};

const getRole = (user?: User | null): Role => {
  const role = user?.app_metadata?.role || user?.user_metadata?.role || "";
  return role === "admin" || role === "student" || role === "parent" ? role : "";
};

const getName = (user?: User | null) => String(user?.user_metadata?.name || user?.email || "Learner");

function formatDate(value?: string) {
  if (!value) return "No deadline";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function isDueDatePassed(dueDate?: string) {
  if (!dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(String(dueDate))) return false;
  return String(dueDate) < new Date().toISOString().slice(0, 10);
}

function daysUntil(dueDate?: string) {
  if (!dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(String(dueDate))) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dueDate}T00:00:00`);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function homeworkUrgency(dueDate?: string) {
  const days = daysUntil(dueDate);
  if (days === null) return { key: "none", label: "No deadline" };
  if (days < 0) return { key: "closed", label: "Closed" };
  if (days === 0) return { key: "today", label: "Due today" };
  if (days <= 2) return { key: "soon", label: `${days} days left` };
  return { key: "safe", label: `${days} days left` };
}

function formatTimeRange(startTime?: string, endTime?: string) {
  if (!startTime && !endTime) return "Time not set";
  return [startTime, endTime].filter(Boolean).join(" - ");
}

function getWeekDays(sessions: ClassSession[]) {
  const firstSessionDate = sessions.find((session) => session.sessionDate)?.sessionDate;
  const base = firstSessionDate ? new Date(`${firstSessionDate}T00:00:00`) : new Date();
  const day = base.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(base);
  monday.setDate(base.getDate() + mondayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return {
      key: date.toISOString().slice(0, 10),
      weekday: date.toLocaleDateString(undefined, { weekday: "short" }),
      dayNumber: date.toLocaleDateString(undefined, { day: "numeric" })
    };
  });
}

async function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function useAuth(): AuthState {
  const [client, setClient] = useState<SupabaseClient | null>(null);
  const [profile, setProfile] = useState<AuthProfile>({
    loading: true,
    session: null,
    user: null,
    role: "",
    name: ""
  });
  const [configError, setConfigError] = useState("");

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    async function init() {
      try {
        const response = await fetch("/api/auth?action=config");
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.message || "Auth is not configured.");

        const supabase = createClient(payload.data.supabaseUrl, payload.data.supabaseAnonKey);
        const { data } = await supabase.auth.getSession();
        if (!active) return;

        const nextSession = data.session;
        setClient(supabase);
        setProfile({
          loading: false,
          session: nextSession,
          user: nextSession?.user || null,
          role: getRole(nextSession?.user),
          name: getName(nextSession?.user)
        });

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
          setProfile({
            loading: false,
            session,
            user: session?.user || null,
            role: getRole(session?.user),
            name: getName(session?.user)
          });
        });
        unsubscribe = () => listener.subscription.unsubscribe();
      } catch (error) {
        if (!active) return;
        setConfigError(error instanceof Error ? error.message : "Auth failed.");
        setProfile((current) => ({ ...current, loading: false }));
      }
    }

    init();
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  return { client, profile, configError };
}

function useApi(profile: AuthProfile): ApiClient {
  return useMemo(() => {
    async function request<T>(url: string, options: RequestInit = {}) {
      const token = profile.session?.access_token;
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.headers || {})
        }
      });
      const data = (await response.json().catch(() => ({}))) as ApiEnvelope<T>;
      if (!response.ok) throw new Error(data.message || "Request failed.");
      return data;
    }

    return {
      async getPosts() {
        const response = await request<HomeworkPost[]>("/api/homework?action=posts");
        return Array.isArray(response.data) ? response.data : [];
      },
      async getSubmissions() {
        const response = await request<HomeworkSubmission[]>("/api/homework?action=submissions");
        return Array.isArray(response.data) ? response.data : [];
      },
      async getRemarks() {
        const response = await request<StudentRemark[]>("/api/homework?action=remarks");
        return Array.isArray(response.data) ? response.data : [];
      },
      async getSessions() {
        const response = await request<ClassSession[]>("/api/homework?action=sessions");
        return Array.isArray(response.data) ? response.data : [];
      },
      async getStudents() {
        const response = await request<StudentAccount[]>("/api/auth?action=students");
        return Array.isArray(response.data) ? response.data : [];
      },
      async postHomework(payload) {
        const response = await request<HomeworkPost>("/api/homework?action=posts", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        return response.data as HomeworkPost;
      },
      async submitHomework(payload) {
        const response = await request<HomeworkSubmission>("/api/homework?action=submissions", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        return response.data as HomeworkSubmission;
      },
      async createAccount(payload) {
        const response = await request<{ email: string; role: Role }>("/api/auth?action=accounts", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        return response.data as { email: string; role: Role };
      },
      async linkParent(payload) {
        const response = await request<{ email: string; childEmails: string[] }>("/api/auth?action=link-parent", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        return response.data as { email: string; childEmails: string[] };
      },
      async createRemark(payload) {
        const response = await request<StudentRemark>("/api/homework?action=remarks", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        return response.data as StudentRemark;
      },
      async createSession(payload) {
        const response = await request<ClassSession>("/api/homework?action=sessions", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        return response.data as ClassSession;
      }
    };
  }, [profile.session]);
}

export default function App() {
  const auth = useAuth();
  const api = useApi(auth.profile);
  const path = window.location.pathname.replace(/\.html$/, "");

  if (auth.profile.loading) {
    return <LoadingScreen />;
  }

  if (path === "/auth") return <AuthPage auth={auth} />;
  if (path === "/homework-admin") return <Protected roles={["admin"]} auth={auth}><AdminPage auth={auth} api={api} /></Protected>;
  if (path === "/homework-student") return <Protected roles={["student"]} auth={auth}><StudentPage auth={auth} api={api} /></Protected>;
  if (path === "/parent") return <Protected roles={["parent"]} auth={auth}><ParentPage auth={auth} api={api} /></Protected>;
  if (path === "/lessons/api") return <ApiLessonPage />;
  if (path === "/lessons/http-methods") return <HttpMethodsPage />;
  if (path === "/api-tester") return <ApiTesterPage />;
  if (path === "/labs/api-playground") return <ApiTesterPage />;
  if (path === "/labs/library-crud") return <LibraryCrudPage />;
  return <HomePage />;
}

function LoadingScreen() {
  return (
    <main className="loading-screen" aria-live="polite" aria-busy="true">
      <div className="loading-orbit">
        <span />
        <span />
        <span />
      </div>
      <div className="loading-copy">
        <p className="pill">LearnHub</p>
        <h1>Preparing your workspace</h1>
        <p>Checking your session, loading class tools, and getting everything ready.</p>
      </div>
      <div className="loading-bar"><span /></div>
    </main>
  );
}

function Shell({ children, account }: { children: ReactNode; account?: ReactNode }) {
  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/">LearnHub</a>
        <nav>
          {account}
          <a className="nav-link" href="/api-tester">API Tester</a>
          <a className="nav-login" href="/auth">Login</a>
        </nav>
      </header>
      {children}
    </main>
  );
}

function AccountBar({ auth }: { auth: AuthState }) {
  return (
    <div className="account-bar">
      <span>{auth.profile.name} - {auth.profile.role}</span>
      <button onClick={async () => {
        await auth.client?.auth.signOut();
        window.location.href = "/auth";
      }}>Sign out</button>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="panel"><h2>{title}</h2>{children}</section>;
}

function Protected({ roles, auth, children }: { roles: Role[]; auth: AuthState; children: ReactNode }) {
  if (!auth.profile.session) {
    window.location.href = `/auth?next=${encodeURIComponent(window.location.pathname)}`;
    return null;
  }

  if (!roles.includes(auth.profile.role)) {
    return (
      <Shell account={<AccountBar auth={auth} />}>
        <Panel title="Access denied">
          <p>Your account cannot open this page.</p>
          <a className="button" href={roleHome(auth.profile.role)}>Go to your page</a>
        </Panel>
      </Shell>
    );
  }

  return children;
}

function HomePage() {
  const [news, setNews] = useState<TechNewsItem[]>([]);
  const [newsStatus, setNewsStatus] = useState("Loading fresh learning ideas...");

  useEffect(() => {
    fetch("/api/tech-news")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || "Could not load learning ideas.");
        setNews(Array.isArray(payload.data) ? payload.data : []);
        setNewsStatus("");
      })
      .catch((error) => setNewsStatus(error instanceof Error ? error.message : "Could not load learning ideas."));
  }, []);

  return (
    <Shell>
      <section className="power-hero">
        <div className="hero-visual" aria-label="LearnHub dashboard preview">
          <div className="glass-card session-card">
            <div className="mini-icon">CLASS</div>
            <div>
              <p className="muted">Current class</p>
              <h3>Today&apos;s learning plan</h3>
            </div>
            <div className="timer-ring">18:40</div>
          </div>
          <div className="glass-card progress-card">
            <p className="muted">Student progress</p>
            <h3>Lessons, tasks, and feedback in one place</h3>
            <div className="meter"><span style={{ width: "68%" }} /></div>
            <div className="progress-stats">
              <strong>4 lessons</strong>
              <strong>3 tasks</strong>
              <strong>2 remarks</strong>
            </div>
          </div>
          <div className="glass-card task-card">
            <p className="muted">Next steps</p>
            <ul>
              <li>Review today&apos;s lesson notes</li>
              <li>Finish the practice activity</li>
              <li>Upload your homework file</li>
            </ul>
          </div>
        </div>
        <div className="hero-copy">
          <p className="pill">Student-first classroom platform</p>
          <h1>Learn any lesson, stay organized, keep moving.</h1>
          <p>
            LearnHub helps your students follow lessons, complete practice work, submit homework,
            and receive feedback from one focused place, whether the class is coding, science,
            language, math, or anything you teach next.
          </p>
          <div className="actions">
            <a className="button" href="/homework-student">Open student panel</a>
            <a className="button secondary" href="/auth">Sign in</a>
          </div>
          <div className="hero-rating">
            <span>★★★★★</span>
            <small>Built for lessons, homework, and student progress</small>
          </div>
        </div>
      </section>
      <section className="idea-radar">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">Idea radar</p>
            <h2>Fresh sparks for curious students</h2>
          </div>
          <a className="nav-link" href="https://news.ycombinator.com/" target="_blank" rel="noreferrer">Live source</a>
        </div>
        {newsStatus && <p className="notice">{newsStatus}</p>}
        {news.length > 0 && (
          <div className="radar-layout">
            <article className="featured-story">
              <p className="eyebrow">Featured signal</p>
              <h3><a href={news[0].url} target="_blank" rel="noreferrer">{news[0].title}</a></h3>
              <p>
                A live story from the wider technology world. Use it as a class discussion starter:
                What problem is it trying to solve, and who does it affect?
              </p>
              <div className="story-meta">
                <span>{news[0].score} points</span>
                <span>{news[0].comments} comments</span>
                <span>By {news[0].author}</span>
              </div>
              <a className="button" href={news[0].discussionUrl} target="_blank" rel="noreferrer">Open discussion</a>
            </article>
            <div className="signal-list">
              {news.slice(1).map((item, index) => (
                <article className="signal-row" key={item.id}>
                  <span className="signal-rank">{String(index + 2).padStart(2, "0")}</span>
                  <div>
                    <h3><a href={item.url} target="_blank" rel="noreferrer">{item.title}</a></h3>
                    <p className="muted">
                      {item.score} points - {item.comments} comments
                      {item.publishedAt ? ` - ${formatDate(item.publishedAt)}` : ""}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </Shell>
  );
}

function ApiLessonPage() {
  return (
    <Shell>
      <PageTitle title="Intro to APIs" subtitle="An API is how a page asks a server for data and receives a structured answer." />
      <LessonBlock title="The simple idea">
        <p>
          A website usually has two sides. The frontend is what the user sees in the browser.
          The backend is the server that stores data, checks rules, and sends answers back.
          An API is the agreed way for those two sides to talk.
        </p>
        <p>
          In this project, the React app calls URLs such as <code>/api/students</code> and
          <code>/api/books</code>. The server answers with JSON, then React turns that data into
          buttons, cards, tables, and messages.
        </p>
      </LessonBlock>
      <div className="grid two lesson-grid">
        {[
          ["Request", "The question your page sends to the server. Example: fetch('/api/students')."],
          ["Response", "The answer the server sends back. It can include data, a message, and a status code."],
          ["Endpoint", "A URL path for one job. /api/student?id=2 means: get the student with id 2."],
          ["JSON", "A data format JavaScript can read easily. It uses keys and values, like { name: 'Sara' }."],
          ["Status code", "A number that explains the result. 200 means OK, 400 means bad request, 404 means not found."]
        ].map(([title, text]) => <Panel key={title} title={title}><p>{text}</p></Panel>)}
      </div>
      <LessonBlock title="What happens during fetch">
        <ol className="lesson-list">
          <li>The user clicks a button or opens a page.</li>
          <li>React runs <code>fetch('/api/students')</code>.</li>
          <li>The browser sends an HTTP request to Vercel.</li>
          <li>The API route runs JavaScript on the server.</li>
          <li>The server sends JSON back to the browser.</li>
          <li>React updates the screen with the new data.</li>
        </ol>
      </LessonBlock>
      <LessonBlock title="Example request and response">
        <div className="grid two compact-grid">
          <CodeExample title="Browser code">{`const response = await fetch("/api/students");
const result = await response.json();

console.log(result.data);`}</CodeExample>
          <CodeExample title="JSON response">{`{
  "success": true,
  "count": 2,
  "data": [
    { "id": 1, "name": "Sara" },
    { "id": 2, "name": "Adam" }
  ]
}`}</CodeExample>
        </div>
      </LessonBlock>
      <LessonBlock title="Common mistakes">
        <ul className="lesson-list">
          <li>Forgetting <code>await response.json()</code>, so you never read the response body.</li>
          <li>Calling the wrong endpoint, like <code>/api/student</code> without <code>?id=2</code>.</li>
          <li>Expecting every response to be successful. Always check the status or <code>success</code>.</li>
        </ul>
      </LessonBlock>
      <Panel title="Ready to practice">
        <p>Open the playground to call real endpoints and inspect the returned JSON.</p>
        <a className="button" href="/labs/api-playground">Open API Playground</a>
      </Panel>
    </Shell>
  );
}

function HttpMethodsPage() {
  const methods = [
    ["GET", "Read data", "Does not change server data.", "Load all books or get one student."],
    ["POST", "Create data", "Adds something new.", "Add a new book or submit homework."],
    ["PUT", "Update data", "Changes an existing item.", "Edit a book title, author, or availability."],
    ["DELETE", "Remove data", "Deletes an item.", "Remove a book from the library."]
  ];
  return (
    <Shell>
      <PageTitle title="HTTP Methods" subtitle="The API method tells the server what action you want." />
      <LessonBlock title="Why methods matter">
        <p>
          A URL tells the server where you want to go. The method tells the server what you want
          to do there. For example, <code>/api/books</code> can list books with GET or create a
          new book with POST.
        </p>
      </LessonBlock>
      <div className="method-grid">
        {methods.map(([method, title, text, example]) => (
          <article className={`method-card ${method.toLowerCase()}`} key={method}>
            <span>{method}</span>
            <h2>{title}</h2>
            <p>{text}</p>
            <p className="muted">Example: {example}</p>
          </article>
        ))}
      </div>
      <Panel title="CRUD match">
        <p>Create uses POST, Read uses GET, Update uses PUT, and Delete uses DELETE.</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>CRUD action</th><th>HTTP method</th><th>Project example</th></tr>
            </thead>
            <tbody>
              <tr><td>Create</td><td>POST</td><td>Add a book with <code>/api/books</code></td></tr>
              <tr><td>Read</td><td>GET</td><td>Load students with <code>/api/students</code></td></tr>
              <tr><td>Update</td><td>PUT</td><td>Edit one book with <code>/api/books/1</code></td></tr>
              <tr><td>Delete</td><td>DELETE</td><td>Delete one book with <code>/api/books/1</code></td></tr>
            </tbody>
          </table>
        </div>
        <a className="button" href="/labs/library-crud">Open Library CRUD Lab</a>
      </Panel>
      <LessonBlock title="Code examples">
        <div className="grid two compact-grid">
          <CodeExample title="GET data">{`const response = await fetch("/api/books");
const result = await response.json();`}</CodeExample>
          <CodeExample title="POST data">{`await fetch("/api/books", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ title, author, genre, year })
});`}</CodeExample>
        </div>
      </LessonBlock>
      <LessonBlock title="Quick check">
        <ul className="lesson-list">
          <li>Use GET when the user only needs to see data.</li>
          <li>Use POST when the user creates a new item.</li>
          <li>Use PUT when the user changes an existing item.</li>
          <li>Use DELETE only when the user really means to remove something.</li>
        </ul>
      </LessonBlock>
    </Shell>
  );
}

function LessonBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="lesson-block">
      <h2>{title}</h2>
      <div className="lesson-copy">{children}</div>
    </section>
  );
}

function CodeExample({ title, children }: { title: string; children: string }) {
  return (
    <article className="code-example">
      <p>{title}</p>
      <pre>{children}</pre>
    </article>
  );
}

function ApiTesterPage() {
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("/api/students");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("Ready");
  const [duration, setDuration] = useState("-");
  const [responseType, setResponseType] = useState("-");
  const [output, setOutput] = useState("Write your request, then press Send to see the response.");

  async function sendRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Sending...");
    setDuration("-");
    setResponseType("-");
    setOutput("Waiting for the server...");

    const started = performance.now();

    try {
      const options: RequestInit = { method };
      const cleanBody = body.trim();

      if (!["GET", "HEAD"].includes(method) && cleanBody) {
        JSON.parse(cleanBody);
        options.headers = { "Content-Type": "application/json" };
        options.body = cleanBody;
      }

      const response = await fetch(url, options);
      const contentType = response.headers.get("content-type") || "unknown";
      const text = await response.text();
      const elapsed = Math.round(performance.now() - started);

      setStatus(`${response.status} ${response.statusText || ""}`.trim());
      setDuration(`${elapsed} ms`);
      setResponseType(contentType);

      if (contentType.includes("application/json")) {
        setOutput(JSON.stringify(JSON.parse(text), null, 2));
      } else {
        setOutput(text || "(empty response)");
      }
    } catch (error) {
      setStatus("Error");
      setDuration(`${Math.round(performance.now() - started)} ms`);
      setOutput(error instanceof Error ? error.message : "Request failed.");
    }
  }

  return (
    <Shell>
      <section className="tester-hero">
        <p className="pill">No Postman needed</p>
        <h1>API Tester for students</h1>
        <p>
          Students can test class APIs directly in the browser: choose a request,
          send it, and read the response without installing extra tools.
        </p>
      </section>
      <section className="tester-layout">
        <div className="request-panel">
          <form className="tester-form" onSubmit={sendRequest}>
            <div className="request-line">
              <label>Method<select value={method} onChange={(event) => setMethod(event.target.value)}><option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option></select></label>
              <label>Endpoint<input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="/api/students" /></label>
              <button type="submit">Send</button>
            </div>
            <label>JSON body<textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder={'{\n  "title": "Example"\n}'} /></label>
          </form>
          <div className="tester-meta">
            <span>Status <strong>{status}</strong></span>
            <span>Time <strong>{duration}</strong></span>
            <span>Type <strong>{responseType}</strong></span>
          </div>
          <pre className="code-box tester-output">{output}</pre>
        </div>
      </section>
    </Shell>
  );
}

function LibraryCrudPage() {
  const emptyBook = { title: "", author: "", genre: "fiction", year: "2024", pages: "", language: "English", summary: "", available: true };
  const [books, setBooks] = useState<Book[]>([]);
  const [form, setForm] = useState(emptyBook);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [genreFilter, setGenreFilter] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [status, setStatus] = useState("-");
  const [output, setOutput] = useState("Load books or submit the form to see the JSON response.");

  async function requestBooks(nextGenre = genreFilter, nextAvailable = availableOnly) {
    const params = new URLSearchParams();
    if (nextGenre) params.set("genre", nextGenre);
    if (nextAvailable) params.set("available", "true");
    const response = await fetch(`/api/books${params.toString() ? `?${params}` : ""}`);
    const data = await response.json();
    setStatus(String(response.status));
    setOutput(JSON.stringify(data, null, 2));
    setBooks(Array.isArray(data.data) ? data.data : []);
  }

  useEffect(() => {
    requestBooks().catch((error) => setOutput(JSON.stringify({ success: false, message: String(error) }, null, 2)));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      title: form.title.trim(),
      author: form.author.trim(),
      genre: form.genre,
      year: Number(form.year),
      pages: form.pages ? Number(form.pages) : null,
      language: form.language.trim() || "English",
      available: form.available,
      summary: form.summary.trim()
    };
    const response = await fetch(editingId ? `/api/books/${editingId}` : "/api/books", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    setStatus(String(response.status));
    setOutput(JSON.stringify(data, null, 2));
    if (response.ok) {
      setEditingId(null);
      setForm(emptyBook);
      await requestBooks();
    }
  }

  async function deleteBook(id: string | number) {
    const response = await fetch(`/api/books/${id}`, { method: "DELETE" });
    const data = await response.json();
    setStatus(String(response.status));
    setOutput(JSON.stringify(data, null, 2));
    await requestBooks();
  }

  function editBook(book: Book) {
    setEditingId(book.id);
    setForm({
      title: book.title,
      author: book.author,
      genre: book.genre,
      year: String(book.year),
      pages: book.pages ? String(book.pages) : "",
      language: book.language || "English",
      summary: book.summary || "",
      available: Boolean(book.available)
    });
  }

  return (
    <Shell>
      <PageTitle title="Library CRUD Lab" subtitle="Practice POST, GET, PUT, and DELETE with the books API." />
      <div className="actions compact">
        {["", "fiction", "science", "history", "technology", "comics"].map((genre) => (
          <button key={genre || "all"} type="button" className={genreFilter === genre ? "" : "ghost"} onClick={() => {
            setGenreFilter(genre);
            setAvailableOnly(false);
            requestBooks(genre, false).catch((error) => setOutput(String(error)));
          }}>{genre || "All"}</button>
        ))}
        <button type="button" className={availableOnly ? "" : "ghost"} onClick={() => {
          setAvailableOnly(true);
          requestBooks(genreFilter, true).catch((error) => setOutput(String(error)));
        }}>Available only</button>
      </div>
      <div className="grid two">
        <Panel title={editingId ? `Update book #${editingId}` : "Add a book"}>
          <form className="form" onSubmit={(event) => submit(event).catch((error) => setOutput(String(error)))}>
            <label>Title<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
            <label>Author<input required value={form.author} onChange={(event) => setForm({ ...form, author: event.target.value })} /></label>
            <div className="grid two compact-grid">
              <label>Genre<select value={form.genre} onChange={(event) => setForm({ ...form, genre: event.target.value })}><option>fiction</option><option>science</option><option>history</option><option>technology</option><option>comics</option><option>poetry</option><option>biography</option><option>other</option></select></label>
              <label>Year<input type="number" min={1000} max={2100} value={form.year} onChange={(event) => setForm({ ...form, year: event.target.value })} /></label>
            </div>
            <div className="grid two compact-grid">
              <label>Pages<input type="number" min={1} value={form.pages} onChange={(event) => setForm({ ...form, pages: event.target.value })} /></label>
              <label>Language<input value={form.language} onChange={(event) => setForm({ ...form, language: event.target.value })} /></label>
            </div>
            <label>Summary<textarea value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} /></label>
            <label className="checkbox-row"><input type="checkbox" checked={form.available} onChange={(event) => setForm({ ...form, available: event.target.checked })} />Available to borrow</label>
            <div className="actions compact">
              <button type="submit">{editingId ? "Save changes" : "Add book"}</button>
              {editingId && <button type="button" className="ghost" onClick={() => { setEditingId(null); setForm(emptyBook); }}>Cancel</button>}
              <button type="button" className="ghost" onClick={() => requestBooks()}>Refresh</button>
            </div>
          </form>
          <div className="response-meta"><span>Status: <strong>{status}</strong></span></div>
          <pre className="code-box small-code">{output}</pre>
        </Panel>
        <Panel title={`Books in the library (${books.length})`}>
          <div className="stack scroll-list">
            {books.length === 0 && <p className="muted">No books found.</p>}
            {books.map((book) => (
              <article className="item" key={book.id}>
                <div className="split"><strong>{book.title}</strong><span className={book.available ? "badge success" : "badge danger"}>{book.available ? "Available" : "Borrowed"}</span></div>
                <p className="muted">by {book.author} - {book.genre} - {book.year}{book.pages ? ` - ${book.pages} pages` : ""}</p>
                <p>{book.summary || "No summary"}</p>
                <div className="actions compact">
                  <button type="button" className="ghost" onClick={() => editBook(book)}>Edit</button>
                  <button type="button" className="danger-button" onClick={() => deleteBook(book.id)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        </Panel>
      </div>
    </Shell>
  );
}

function AuthPage({ auth }: { auth: AuthState }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState(auth.configError || "");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      if (!auth.client) throw new Error(auth.configError || "Auth is not ready.");
      const { data, error } = await auth.client.auth.signInWithPassword(form);
      if (error) throw error;
      window.location.href = new URLSearchParams(window.location.search).get("next") || roleHome(getRole(data.user));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed.");
    }
  }

  return (
    <Shell>
      <section className="auth-card">
        <p className="eyebrow">LearnHub accounts</p>
        <h1>Sign in</h1>
        <p>Student and parent accounts are created by the admin.</p>
        {auth.profile.session && (
          <div className="notice inline-notice">
            <span>Signed in as {auth.profile.name}.</span>
            <button onClick={async () => auth.client?.auth.signOut()}>Sign out</button>
          </div>
        )}
        <form onSubmit={submit} className="form">
          <label>Email<input type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <label>Password<input type="password" required minLength={6} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
          <button className="button" type="submit">Sign in</button>
        </form>
        {message && <p className="error">{message}</p>}
      </section>
    </Shell>
  );
}

function AdminPage({ auth, api }: { auth: AuthState; api: ApiClient }) {
  const [posts, setPosts] = useState<HomeworkPost[]>([]);
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([]);
  const [remarks, setRemarks] = useState<StudentRemark[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [students, setStudents] = useState<StudentAccount[]>([]);
  const [message, setMessage] = useState("");
  const [view, setView] = useState("overview");

  async function refresh() {
    const [nextPosts, nextSubmissions, nextRemarks, nextSessions, nextStudents] = await Promise.all([
      api.getPosts(), api.getSubmissions(), api.getRemarks(), api.getSessions(), api.getStudents()
    ]);
    setPosts(nextPosts);
    setSubmissions(nextSubmissions);
    setRemarks(nextRemarks);
    setSessions(nextSessions);
    setStudents(nextStudents);
  }

  useEffect(() => {
    refresh().catch((error) => setMessage(error instanceof Error ? error.message : "Could not load admin data."));
  }, []);

  const openPosts = posts.filter((post) => !isDueDatePassed(post.dueDate));
  const closedPosts = posts.length - openPosts.length;
  const uniqueSubmitters = new Set(submissions.map((item) => item.studentName || item.id)).size;
  const latestSubmissions = [...submissions].slice(0, 6);

  return (
    <Shell account={<AccountBar auth={auth} />}>
      <section className="admin-app">
        <aside className="admin-sidebar">
          <div>
            <span className="admin-logo">LH</span>
            <h1>LearnHub</h1>
            <p>Admin workspace</p>
          </div>
          <nav aria-label="Admin sections">
            {[
              ["overview", "Overview"],
              ["homework", "Homework"],
              ["sessions", "Sessions"],
              ["accounts", "Accounts"],
              ["feedback", "Feedback"]
            ].map(([id, label]) => (
              <button key={id} type="button" className={view === id ? "active" : ""} onClick={() => setView(id)}>{label}</button>
            ))}
          </nav>
          <div className="admin-sidebar-footer">
            <span>{auth.profile.name}</span>
            <button type="button" onClick={() => refresh().catch((error) => setMessage(error instanceof Error ? error.message : "Could not refresh data."))}>Refresh</button>
          </div>
        </aside>
        <div className="admin-content">
          <header className="admin-header">
            <div>
              <h2>{view === "overview" ? "Class overview" : view === "homework" ? "Homework workspace" : view === "sessions" ? "Weekly sessions" : view === "accounts" ? "Account management" : "Feedback and remarks"}</h2>
              <p>{view === "overview" ? "Monitor activity and jump into the next admin task." : "Manage the selected class workflow."}</p>
            </div>
            <a className="admin-primary-action" href="/homework-student">Student view</a>
          </header>
          {message && <p className="notice admin-message">{message}</p>}
          <section className="admin-metrics" aria-label="Admin overview metrics">
            <AdminMetric label="Students" value={students.length} detail="Managed accounts" />
            <AdminMetric label="Open homework" value={openPosts.length} detail={`${closedPosts} closed`} />
            <AdminMetric label="Submissions" value={submissions.length} detail={`${uniqueSubmitters} students submitted`} />
            <AdminMetric label="Sessions" value={sessions.length} detail="Class calendar" />
          </section>
          {view === "overview" && (
            <section className="admin-overview-layout">
              <div className="admin-main-table">
                <AdminActivity title="Recent submissions" empty="No submitted files yet.">
                  {latestSubmissions.map((item) => (
                    <article className="admin-row" key={item.id}>
                      <div><strong>{item.studentName}</strong><span>{item.assignmentTitle || "Homework"} - {item.fileName || "PDF file"}</span></div>
                      <a className="button small" href={item.fileData} target="_blank" rel="noreferrer">Open</a>
                    </article>
                  ))}
                </AdminActivity>
              </div>
              <aside className="admin-side-panel">
                <AdminActivity title="Open homework" empty="No open homework right now.">
                  {openPosts.slice(0, 4).map((post) => (
                    <article className="admin-row compact-row" key={post.id}>
                      <div><strong>{post.title}</strong><span>Due {formatDate(post.dueDate)}</span></div>
                    </article>
                  ))}
                </AdminActivity>
                <AdminActivity title="This week" empty="No sessions scheduled.">
                  {sessions.slice(0, 3).map((session) => (
                    <article className="admin-row compact-row" key={session.id}>
                      <div><strong>{session.title}</strong><span>{formatDate(session.sessionDate)} - {formatTimeRange(session.startTime, session.endTime)}</span></div>
                    </article>
                  ))}
                </AdminActivity>
                <section className="quick-actions-panel">
                  <h3>Quick actions</h3>
                  <button type="button" onClick={() => setView("homework")}>Post homework</button>
                  <button type="button" onClick={() => setView("sessions")}>Add session</button>
                  <button type="button" onClick={() => setView("accounts")}>Create account</button>
                  <button type="button" onClick={() => setView("feedback")}>Add remark</button>
                </section>
              </aside>
            </section>
          )}
          {view === "homework" && (
            <>
              <div className="admin-grid">
                <HomeworkForm api={api} refresh={refresh} setMessage={setMessage} />
                <PostsPanel posts={posts} />
              </div>
              <SubmissionsPanel posts={posts} submissions={submissions} />
            </>
          )}
          {view === "sessions" && (
            <div className="admin-grid">
              <SessionForm api={api} refresh={refresh} setMessage={setMessage} />
              <SessionCalendar sessions={sessions} title="Configured sessions" />
            </div>
          )}
          {view === "accounts" && (
            <>
              <div className="admin-grid">
                <AccountForm api={api} setMessage={setMessage} />
                <ParentLinkForm api={api} setMessage={setMessage} />
              </div>
              <Panel title={`Student directory (${students.length})`}>
                <div className="student-directory">
                  {students.length === 0 && <p className="muted">No student accounts found yet.</p>}
                  {students.map((student) => (
                    <article className="directory-row" key={student.id}>
                      <strong>{student.name || student.email}</strong>
                      <span>{student.email}</span>
                    </article>
                  ))}
                </div>
              </Panel>
            </>
          )}
          {view === "feedback" && (
            <>
              <RemarkForm students={students} api={api} refresh={refresh} setMessage={setMessage} />
              <RemarksPanel remarks={remarks} title="All remarks" />
            </>
          )}
        </div>
      </section>
    </Shell>
  );
}

function AdminMetric({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <article className="admin-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function AdminActivity({ title, empty, children }: { title: string; empty: string; children: ReactNode }) {
  const hasItems = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <section className="admin-activity">
      <div className="section-heading">
        <p className="eyebrow">Live class</p>
        <h2>{title}</h2>
      </div>
      <div className="stack">
        {hasItems ? children : <p className="muted">{empty}</p>}
      </div>
    </section>
  );
}

function StudentPage({ auth, api }: { auth: AuthState; api: ApiClient }) {
  const [posts, setPosts] = useState<HomeworkPost[]>([]);
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([]);
  const [remarks, setRemarks] = useState<StudentRemark[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [message, setMessage] = useState("");

  async function refresh() {
    const [nextPosts, nextSubmissions, nextRemarks, nextSessions] = await Promise.all([api.getPosts(), api.getSubmissions(), api.getRemarks(), api.getSessions()]);
    setPosts(nextPosts);
    setSubmissions(nextSubmissions);
    setRemarks(nextRemarks);
    setSessions(nextSessions);
  }

  useEffect(() => {
    refresh().catch((error) => setMessage(error instanceof Error ? error.message : "Could not load student data."));
  }, []);

  const openPosts = posts.filter((post) => !isDueDatePassed(post.dueDate));
  const submittedIds = new Set(submissions.map((item) => item.assignmentId));
  const missingPosts = openPosts.filter((post) => !submittedIds.has(post.id));
  const nextHomework = [...missingPosts].sort((a, b) => String(a.dueDate || "9999").localeCompare(String(b.dueDate || "9999")))[0] || openPosts[0];
  const nextUrgency = homeworkUrgency(nextHomework?.dueDate);

  return (
    <Shell account={<AccountBar auth={auth} />}>
      <section className="student-dashboard">
        <div className="student-hero">
          <div>
            <p className="eyebrow">Student workspace</p>
            <h1>Welcome back, {auth.profile.name}</h1>
            <p>Track your homework, upload your files, and keep your learning progress clear.</p>
          </div>
          <a className="student-lab-link" href="/api-tester">Open practice lab</a>
        </div>

        {message && <p className="notice">{message}</p>}

        <section className="student-focus">
          <article className={`next-homework urgency-${nextUrgency.key}`}>
            <span className="focus-label">Next homework</span>
            {nextHomework ? (
              <>
                <h2>{nextHomework.title}</h2>
                <p>{nextHomework.description}</p>
                <div className="student-meta">
                  <span>{nextHomework.subject || "Homework"}</span>
                  <span>{nextUrgency.label}</span>
                </div>
              </>
            ) : (
              <>
                <h2>Nothing due right now</h2>
                <p>Your workspace is clear. Use the practice lab or review your previous submissions.</p>
              </>
            )}
          </article>

          <div className="student-stats">
            <StudentStat label="Open tasks" value={openPosts.length} />
            <StudentStat label="Missing" value={missingPosts.length} />
            <StudentStat label="Submitted" value={submissions.length} />
            <StudentStat label="Remarks" value={remarks.length} />
          </div>
        </section>

        <SessionCalendar sessions={sessions} title="Class sessions" />

        <StudentUpload posts={openPosts} api={api} refresh={refresh} setMessage={setMessage} studentName={auth.profile.name} />

        <section className="student-section-row">
          <Panel title="Teacher notes">
            <div className="stack">
              {remarks.length === 0 && <p className="muted">No remarks yet.</p>}
              {remarks.slice(0, 3).map((remark) => (
                <article className="student-note" key={remark.id}>
                  <span>{formatDate(remark.createdAt)}</span>
                  <p>{remark.remark}</p>
                </article>
              ))}
            </div>
          </Panel>
        </section>

        <div className="student-grid">
          <PostsPanel posts={posts} />
          <SubmissionsPanel posts={posts} submissions={submissions} title="My submissions" />
        </div>
      </section>
    </Shell>
  );
}

function StudentStat({ label, value }: { label: string; value: number }) {
  return (
    <article>
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

function ParentPage({ auth, api }: { auth: AuthState; api: ApiClient }) {
  const [posts, setPosts] = useState<HomeworkPost[]>([]);
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([]);
  const [remarks, setRemarks] = useState<StudentRemark[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([api.getPosts(), api.getSubmissions(), api.getRemarks(), api.getSessions()])
      .then(([nextPosts, nextSubmissions, nextRemarks, nextSessions]) => {
        setPosts(nextPosts);
        setSubmissions(nextSubmissions);
        setRemarks(nextRemarks);
        setSessions(nextSessions);
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : "Could not load parent data."));
  }, []);

  return (
    <Shell account={<AccountBar auth={auth} />}>
      <PageTitle title="Parent panel" subtitle="Read-only view of your child's homework, submissions, and teacher remarks." />
      {message && <p className="notice">{message}</p>}
      <div className="grid two">
        <PostsPanel posts={posts} />
        <SubmissionsPanel posts={posts} submissions={submissions} />
      </div>
      <SessionCalendar sessions={sessions} title="Class sessions" />
      <RemarksPanel remarks={remarks} title="Teacher remarks" />
    </Shell>
  );
}

function PageTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return <section className="page-title"><h1>{title}</h1><p>{subtitle}</p></section>;
}

function SessionForm({ api, refresh, setMessage }: {
  api: ApiClient;
  refresh: () => Promise<void>;
  setMessage: (message: string) => void;
}) {
  const [form, setForm] = useState({
    title: "",
    sessionDate: "",
    startTime: "",
    endTime: "",
    recordingUrl: "",
    notes: ""
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await api.createSession(form);
    setForm({ title: "", sessionDate: "", startTime: "", endTime: "", recordingUrl: "", notes: "" });
    setMessage("Session saved successfully.");
    await refresh();
  }

  return (
    <Panel title="Configure session">
      <form className="form" onSubmit={(event) => submit(event).catch((error) => setMessage(error instanceof Error ? error.message : "Could not save session."))}>
        <label>Session title<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="React state workshop" /></label>
        <label>Date<input type="date" required value={form.sessionDate} onChange={(event) => setForm({ ...form, sessionDate: event.target.value })} /></label>
        <div className="form-row">
          <label>Start time<input type="time" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} /></label>
          <label>End time<input type="time" value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} /></label>
        </div>
        <label>Zoom recording link<input type="url" value={form.recordingUrl} onChange={(event) => setForm({ ...form, recordingUrl: event.target.value })} placeholder="https://..." /></label>
        <label>Notes<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="What students should review before or after the session." /></label>
        <button className="button" type="submit">Save session</button>
      </form>
    </Panel>
  );
}

function SessionCalendar({ sessions, title }: { sessions: ClassSession[]; title: string }) {
  const weekDays = getWeekDays(sessions);
  const grouped = sessions.reduce((map, session) => {
    const key = session.sessionDate || "No date";
    map.set(key, [...(map.get(key) || []), session]);
    return map;
  }, new Map<string, ClassSession[]>());

  return (
    <Panel title={`${title} (${sessions.length})`}>
      <div className="week-calendar">
        <div className="calendar-toolbar">
          <div>
            <span>Week view</span>
            <strong>{formatDate(weekDays[0].key)} - {formatDate(weekDays[6].key)}</strong>
          </div>
          <span>{sessions.length} sessions</span>
        </div>
        {sessions.length === 0 && <p className="muted">No sessions scheduled yet.</p>}
        <div className="calendar-grid" aria-label="Weekly session calendar">
          {weekDays.map((day) => {
            const daySessions = grouped.get(day.key) || [];
            return (
              <section className="calendar-day" key={day.key}>
                <header>
                  <span>{day.weekday}</span>
                  <strong>{day.dayNumber}</strong>
                </header>
                <div className="calendar-slots">
                  {daySessions.length === 0 && <span className="empty-slot">No class</span>}
                  {daySessions.map((session) => (
                    <article className="calendar-event" key={session.id}>
                      <span>{formatTimeRange(session.startTime, session.endTime)}</span>
                      <strong>{session.title}</strong>
                      {session.notes && <p>{session.notes}</p>}
                      {session.recordingUrl ? (
                        <a href={session.recordingUrl} target="_blank" rel="noreferrer">Zoom recording</a>
                      ) : (
                        <small>No recording yet</small>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}

function HomeworkForm({ api, refresh, setMessage }: {
  api: ApiClient;
  refresh: () => Promise<void>;
  setMessage: (message: string) => void;
}) {
  const [form, setForm] = useState({ title: "", subject: "", description: "", dueDate: "" });
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await api.postHomework(form);
    setForm({ title: "", subject: "", description: "", dueDate: "" });
    setMessage("Homework posted successfully.");
    await refresh();
  }
  return (
    <Panel title="Create homework">
      <form className="form" onSubmit={(event) => submit(event).catch((error) => setMessage(error instanceof Error ? error.message : "Could not create homework."))}>
        <label>Title<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
        <label>Subject<input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} /></label>
        <label>Instructions<textarea required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
        <label>Deadline<input type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} /></label>
        <button className="button" type="submit">Post homework</button>
      </form>
    </Panel>
  );
}

function AccountForm({ api, setMessage }: { api: ApiClient; setMessage: (message: string) => void }) {
  const [role, setRole] = useState<Role>("student");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const account = await api.createAccount({
      name: data.get("name"),
      email: data.get("email"),
      password: data.get("password"),
      role,
      childEmails: role === "parent" ? data.get("childEmails") : ""
    });
    event.currentTarget.reset();
    setMessage(`${account.role} account created for ${account.email}.`);
  }
  return (
    <Panel title="Create account">
      <form className="form" onSubmit={(event) => submit(event).catch((error) => setMessage(error instanceof Error ? error.message : "Could not create account."))}>
        <label>Full name<input name="name" required /></label>
        <label>Email<input name="email" type="email" required /></label>
        <label>Temporary password<input name="password" required minLength={6} /></label>
        <label>Account type<select value={role} onChange={(event) => setRole(event.target.value as Role)}><option value="student">Student</option><option value="parent">Parent</option><option value="admin">Admin</option></select></label>
        {role === "parent" && <label>Linked student email<input name="childEmails" required placeholder="student@example.com" /></label>}
        <button className="button" type="submit">Create account</button>
      </form>
    </Panel>
  );
}

function ParentLinkForm({ api, setMessage }: { api: ApiClient; setMessage: (message: string) => void }) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const account = await api.linkParent({ parentEmail: data.get("parentEmail"), childEmails: data.get("childEmails") });
    event.currentTarget.reset();
    setMessage(`${account.email} linked to ${account.childEmails.join(", ")}.`);
  }
  return (
    <Panel title="Link parent to student">
      <form className="form" onSubmit={(event) => submit(event).catch((error) => setMessage(error instanceof Error ? error.message : "Could not save parent link."))}>
        <label>Parent email<input name="parentEmail" type="email" required /></label>
        <label>Student email<input name="childEmails" required placeholder="student@example.com" /></label>
        <button className="button" type="submit">Save parent link</button>
      </form>
    </Panel>
  );
}

function RemarkForm({ students, api, refresh, setMessage }: {
  students: StudentAccount[];
  api: ApiClient;
  refresh: () => Promise<void>;
  setMessage: (message: string) => void;
}) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const selected = students.find((student) => student.email === data.get("studentEmail"));
    const remark = await api.createRemark({
      studentEmail: selected?.email,
      studentName: selected?.name,
      remark: data.get("remark")
    });
    event.currentTarget.reset();
    setMessage(`Remark saved for ${remark.studentEmail}.`);
    await refresh();
  }
  return (
    <Panel title="Add student remark">
      <form className="form" onSubmit={(event) => submit(event).catch((error) => setMessage(error instanceof Error ? error.message : "Could not save remark."))}>
        <label>Student<select name="studentEmail" required><option value="">Choose a student</option>{students.map((student) => <option key={student.id} value={student.email}>{student.name} ({student.email})</option>)}</select></label>
        <label>Remark<textarea name="remark" required /></label>
        <button className="button" type="submit">Save remark</button>
      </form>
    </Panel>
  );
}

function StudentUpload({ posts, api, refresh, setMessage, studentName }: {
  posts: HomeworkPost[];
  api: ApiClient;
  refresh: () => Promise<void>;
  setMessage: (message: string) => void;
  studentName: string;
}) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const file = data.get("pdfFile");
    const selectedPost = posts.find((post) => post.id === data.get("assignmentId"));
    if (!selectedPost) throw new Error("Please choose a homework.");
    if (!(file instanceof File)) throw new Error("Please choose a PDF file.");
    if (isDueDatePassed(selectedPost.dueDate)) throw new Error("This homework is closed because the due date has passed.");
    const fileData = await readFileAsDataUrl(file);
    await api.submitHomework({
      studentName,
      assignmentId: selectedPost.id,
      assignmentTitle: selectedPost.title,
      fileName: file.name,
      fileType: file.type,
      fileData
    });
    event.currentTarget.reset();
    setMessage("Homework uploaded successfully.");
    await refresh();
  }
  return (
    <section className="upload-homework-section">
      <form className="upload-form" onSubmit={(event) => submit(event).catch((error) => setMessage(error instanceof Error ? error.message : "Could not upload homework."))}>
        <div className="upload-copy">
          <p className="eyebrow">Homework upload</p>
          <h2>Send your work</h2>
          <p>Pick the homework, attach the PDF, and submit it under your student account.</p>
        </div>
        <div className="upload-fields">
          <label>Assignment<select name="assignmentId" required>{posts.map((post) => <option key={post.id} value={post.id} disabled={isDueDatePassed(post.dueDate)}>{post.title}{isDueDatePassed(post.dueDate) ? " (closed)" : ""}</option>)}</select></label>
          <label className="file-drop">
            <span>PDF homework file</span>
            <input name="pdfFile" type="file" accept="application/pdf" required />
          </label>
        </div>
        <div className="upload-actions">
          <span>Submitting as <strong>{studentName}</strong></span>
          <button className="button" type="submit">Upload homework</button>
        </div>
      </form>
    </section>
  );
}

function PostsPanel({ posts }: { posts: HomeworkPost[] }) {
  return (
    <Panel title="Current homework">
      <div className="stack">
        {posts.length === 0 && <p className="muted">No homework posted yet.</p>}
        {posts.map((post) => {
          const urgency = homeworkUrgency(post.dueDate);
          return (
            <article className={`item homework-card urgency-${urgency.key}`} key={post.id}>
              <div className="split"><strong>{post.title}</strong><span className={`badge urgency-badge urgency-${urgency.key}`}>{urgency.label}: {formatDate(post.dueDate)}</span></div>
              <p className="muted">{post.subject || "Homework"}</p>
              <p>{post.description}</p>
            </article>
          );
        })}
      </div>
    </Panel>
  );
}

function SubmissionsPanel({ posts, submissions, title = "Submitted files" }: {
  posts: HomeworkPost[];
  submissions: HomeworkSubmission[];
  title?: string;
}) {
  const grouped = submissions.reduce((map, item) => {
    const key = item.assignmentId || "";
    map.set(key, [...(map.get(key) || []), item]);
    return map;
  }, new Map<string, HomeworkSubmission[]>());

  return (
    <Panel title={`${title} (${submissions.length})`}>
      <div className="stack">
        {submissions.length === 0 && <p className="muted">No files uploaded yet.</p>}
        {posts.map((post) => <SubmissionGroup key={post.id} title={post.title} items={grouped.get(post.id) || []} />)}
        {[...grouped.entries()].filter(([id]) => !posts.some((post) => post.id === id)).map(([id, items]) => <SubmissionGroup key={id} title={items[0]?.assignmentTitle || "Unknown homework"} items={items} />)}
      </div>
    </Panel>
  );
}

function SubmissionGroup({ title, items }: { title: string; items: HomeworkSubmission[] }) {
  if (!items.length) return null;
  return (
    <article className="item">
      <div className="split"><strong>{title}</strong><span className="badge">{items.length} submissions</span></div>
      {items.map((item) => (
        <p key={item.id} className="file-row">
          <span>{item.studentName} - {item.fileName || "homework.pdf"} - {formatDate(item.uploadedAt)}</span>
          <a className="button small" href={item.fileData} target="_blank" rel="noreferrer">Open file</a>
        </p>
      ))}
    </article>
  );
}

function RemarksPanel({ remarks, title }: { remarks: StudentRemark[]; title: string }) {
  return (
    <Panel title={`${title} (${remarks.length})`}>
      <div className="stack">
        {remarks.length === 0 && <p className="muted">No remarks yet.</p>}
        {remarks.map((remark) => (
          <article className="item" key={remark.id}>
            <strong>{remark.studentName || remark.studentEmail}</strong>
            <p className="muted">{remark.studentEmail} - {formatDate(remark.createdAt)}</p>
            <p>{remark.remark}</p>
          </article>
        ))}
      </div>
    </Panel>
  );
}
