import { useRef, useState } from "react";

const news = [
  { rank: "02", title: "Laya the open source version of Jev", meta: "354 points - 26 comments - Sep 19, 2026", href: "https://laya.convaiinnovations.com/" },
  { rank: "03", title: "A graphical desktop for the ZX Spectrum", meta: "27 points - 3 comments - Sep 19, 2026", href: "https://github.com/mindbox77/zxdesk" },
  { rank: "04", title: "AI-generated posters don’t have to be horrible", meta: "599 points - 107 comments - Sep 19, 2026", href: "https://john.hartnup.uk/2026/06/07/ai-event-posters.html" },
  { rank: "05", title: "Tin: full-text search for Postgres", meta: "32 points - 2 comments - Sep 19, 2026", href: "https://planetscale.com/blog/introducing-tin" },
  { rank: "06", title: "Human brain is two separate organs, Stanford Medicine-led research finds", meta: "434 points - 41 comments - Sep 19, 2026", href: "https://med.stanford.edu/news/all-news/2026/09/two-separate-brains.html" }
];

function App() {
  if (window.location.pathname === "/homework-student") {
    return <ProjectSubmissionPage />;
  }

  if (window.location.pathname === "/projects/sami") {
    return <SamiProjectPage />;
  }

  return (
    <main className="app-shell">
      <header className="topbar"><a className="brand" href="/">LearnHub</a><nav><a className="nav-login" href="/auth">Login</a></nav></header>
      <section className="power-hero">
        <div className="hero-visual" aria-label="LearnHub dashboard preview">
          <div className="glass-card session-card"><div className="mini-icon">CLASS</div><div><p className="muted">Current class</p><h3>Today&apos;s learning plan</h3></div><div className="timer-ring">18:40</div></div>
          <div className="glass-card progress-card"><p className="muted">Student progress</p><h3>Lessons, tasks, and feedback in one place</h3><div className="meter"><span style={{ width: "68%" }} /></div><div className="progress-stats"><strong>4 lessons</strong><strong>3 tasks</strong><strong>2 remarks</strong></div></div>
          <div className="glass-card task-card"><p className="muted">Next steps</p><ul><li>Review today&apos;s lesson notes</li><li>Finish the practice activity</li><li>Upload your homework file</li></ul></div>
        </div>
        <div className="hero-copy"><p className="pill">Student-first classroom platform</p><h1>Learn any lesson, stay organized, keep moving.</h1><p>LearnHub helps your students follow lessons, complete practice work, submit homework, and receive feedback from one focused place, whether the class is coding, science, language, math, or anything you teach next.</p><div className="actions"><a className="button" href="/homework-student">Submit your project</a><a className="button secondary" href="/auth">Sign in</a></div><div className="hero-rating"><span>★★★★★</span><small>Built for lessons, homework, and student progress</small></div></div>
      </section>
      <section className="idea-radar"><div className="section-heading split"><div><p className="eyebrow">Idea radar</p><h2>Fresh sparks for curious students</h2></div><a className="nav-link" href="https://news.ycombinator.com/" target="_blank" rel="noreferrer">Live source</a></div><div className="radar-layout"><article className="featured-story"><p className="eyebrow">Featured signal</p><h3><a href="https://besok.github.io/posts/what-zig-felt-like-coming-from-rust/" target="_blank" rel="noreferrer">What Zig felt like, coming from Rust</a></h3><p>A live story from the wider technology world. Use it as a class discussion starter: What problem is it trying to solve, and who does it affect?</p><div className="story-meta"><span>51 points</span><span>8 comments</span><span>By ksec</span></div><a className="button" href="https://news.ycombinator.com/item?id=49766637" target="_blank" rel="noreferrer">Open discussion</a></article><div className="signal-list">{news.map((item) => <article className="signal-row" key={item.rank}><span className="signal-rank">{item.rank}</span><div><h3><a href={item.href} target="_blank" rel="noreferrer">{item.title}</a></h3><p className="muted">{item.meta}</p></div></article>)}</div></div></section>
      <section className="home-showcase"><div className="riddle-card"><div className="riddle-copy"><div className="riddle-kicker"><p className="eyebrow">This week&apos;s tech riddle</p><div className="riddle-tags"><span className="difficulty">Easy</span><span className="duration">2 min</span></div></div><h2>Decode the<br />robot&apos;s<br />secret<br />message</h2><p>The robot is trapped and has sent a message in Morse code. Can you discover what it is saying?</p><div className="transmission"><strong>SECRET TRANSMISSION</strong><div className="morse" role="img" aria-label="Morse code .--- ... --- -."><span className="morse-letter"><i className="dot" /><i className="dash" /><i className="dash" /><i className="dash" /></span><span className="morse-letter"><i className="dot" /><i className="dot" /><i className="dot" /></span><span className="morse-letter"><i className="dash" /><i className="dash" /><i className="dash" /></span><span className="morse-letter"><i className="dash" /><i className="dot" /></span></div><small>Hint: Each space separates one letter</small></div><form className="riddle-form"><label>What message did the robot send?<input placeholder="Type your answer" /></label><button type="button">Submit answer</button><p>Decode the transmission and submit your guess.</p></form></div><div className="riddle-visual"><img src="/robot-maze.png" alt="Robot sending a Morse code transmission" /></div></div><article className="student-month"><img src="/boy.png" alt="Islam Nadifi, student of the month" /><div className="student-copy"><p className="eyebrow">Student of the month</p><h2>Celebrating an exceptional student</h2><h3>Islam Nadifi</h3><p className="month">July 2026</p><p>For his positive attitude, consistent effort, and asking questions.</p><strong>Congratulations, Islam Nadifi!</strong><p>Keep doing your best. Next month could be yours.</p></div></article></section>
      <section className="showcase-projects"><p className="eyebrow">Student showcase</p><h2>Made by my students</h2><p>A space to celebrate the creative projects built by our students.</p><div className="project-grid"><a className="project-card featured-project" href="/projects/sami"><div className="project-image"><img src="/sami.jpeg" alt="Sami Boulhafa&apos;s project preview" /><span className="project-type">Web Project</span></div><div className="project-card-copy"><div className="project-card-topline"><div><p className="project-student">Sami Boulhafa</p><h3>Hello, I&apos;m Sami</h3></div><div className="project-tools" aria-label="Drawing, games, and code"><span><img src="/controller.png" alt="" /></span><span><img src="/draw.png" alt="" /></span><span><img src="/code.png" alt="" /></span></div></div><p>Drawing, games, and a first web page</p><div className="project-action"><strong>Open project</strong><span aria-hidden="true">→</span></div></div></a><a className="project-card featured-project" href="/projects/mohamed-ali"><div className="project-image calculator-project-preview"><div className="calculator-preview-screen">123 + 456</div><div className="calculator-preview-buttons"><i>7</i><i>8</i><i>9</i><i>+</i><i>4</i><i>5</i><i>6</i><i>=</i></div><span className="project-type">JavaScript Project</span></div><div className="project-card-copy"><div className="project-card-topline"><div><p className="project-student">Mohamed Ali Kamal</p><h3>Simple Calculator</h3></div><div className="project-tools" aria-label="Calculator project tools"><span><img src="/code.png" alt="Code" /></span></div></div><p>A clean calculator with keyboard support</p><div className="project-action"><strong>Open project</strong><span aria-hidden="true">→</span></div></div></a></div><strong>Keep learning, keep creating.</strong></section>
    </main>
  );
}

function ProjectSubmissionPage() {
  const [studentName, setStudentName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [githubUrl, setGithubUrl] = useState("");
  const [githubConnected, setGithubConnected] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const folderInputRef = useRef<HTMLInputElement>(null);

  const addFiles = (incomingFiles: FileList | File[]) => {
    const nextFiles = Array.from(incomingFiles);
    setFiles((currentFiles) => {
      const existingPaths = new Set(currentFiles.map((file) => file.webkitRelativePath || file.name));
      return [...currentFiles, ...nextFiles.filter((file) => !existingPaths.has(file.webkitRelativePath || file.name))];
    });
  };

  const handleGithubConnect = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGithubConnected(Boolean(githubUrl.trim()));
  };

  const handleSubmit = () => {
    setSubmitState("error");
    setSubmitMessage("Submission storage will be connected to the Java backend.");
  };

  return (
    <main className="submission-page">
      <header className="topbar submission-topbar"><a className="brand" href="/">LearnHub</a><a className="nav-link" href="/">Back to home</a></header>
      <section className="submission-hero">
        <div><p className="eyebrow">Project submission</p><h1>Show us what you built.</h1><p>Send your project in the way that works best for you. Upload the project folder from your computer, or connect a public GitHub repository.</p><label className="student-name-field" htmlFor="student-name">Your name<input id="student-name" type="text" placeholder="Enter your full name" value={studentName} onChange={(event) => setStudentName(event.target.value)} required /></label></div>
        <div className="submission-status"><span className="status-dot" />Draft submission<span className="status-divider" />Not submitted yet</div>
      </section>
      <section className="submission-layout">
        <div className="submission-methods">
          <article className={`submission-method upload-method${dragging ? " is-dragging" : ""}`} onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files); }}>
            <div className="method-heading"><span className="method-number">01</span><div><h2>Upload your project</h2><p>Choose a folder or drop it here. Your folder structure stays intact.</p></div></div>
            <div className="drop-zone" onClick={() => folderInputRef.current?.click()} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") folderInputRef.current?.click(); }}>
              <span className="upload-mark">↑</span><strong>{files.length ? `${files.length} file${files.length === 1 ? "" : "s"} ready` : "Drop your project folder here"}</strong><span>or click to browse from your computer</span>
              <input ref={folderInputRef} className="visually-hidden" type="file" multiple onChange={(event) => { if (event.target.files) addFiles(event.target.files); }} {...({ webkitdirectory: "", directory: "" } as React.InputHTMLAttributes<HTMLInputElement>)} />
            </div>
            {files.length > 0 && <div className="file-summary"><span className="file-icon">⌁</span><div><strong>{files[0].webkitRelativePath.split("/")[0] || files[0].name}</strong><span>{files.length} files selected</span></div><button className="remove-files" type="button" onClick={() => setFiles([])} aria-label="Remove selected files">×</button></div>}
          </article>
          <div className="or-divider"><span>OR</span></div>
          <article className="submission-method github-method">
            <div className="method-heading"><span className="method-number">02</span><div><h2>Import from GitHub</h2><p>Use a public repository link and we&apos;ll pull the latest version.</p></div></div>
            <form className="github-form" onSubmit={handleGithubConnect}><label htmlFor="github-url">Repository URL</label><div className="github-input-row"><input id="github-url" type="url" placeholder="https://github.com/username/project" value={githubUrl} onChange={(event) => { setGithubUrl(event.target.value); setGithubConnected(false); }} required /><button type="submit">{githubConnected ? "Ready to import" : "Use repository"}</button></div>{githubConnected && <p className="form-success">Repository ready for the Java backend.</p>}</form>
          </article>
        </div>
        <aside className="submission-sidebar"><div className="sidebar-block"><p className="eyebrow">Before you submit</p><h2>A few things to check</h2><ul><li><span>01</span><div><strong>Include your README</strong><small>Tell us what your project does and how to run it.</small></div></li><li><span>02</span><div><strong>Check your links</strong><small>Make sure assets and pages work from a fresh download.</small></div></li><li><span>03</span><div><strong>Keep it yours</strong><small>Share work you made or have permission to submit.</small></div></li></ul></div><div className="submission-help"><span>Need a hand?</span><strong>Ask your teacher before submitting.</strong></div></aside>
      </section>
      <footer className="submission-footer"><div><strong>Ready when you are.</strong><span>{submitMessage || (files.length ? "Your folder is selected." : githubConnected ? "Your repository is ready to download." : "Choose an upload method above.")}</span></div><button type="button" onClick={handleSubmit} disabled={!studentName.trim() || (!files.length && !githubConnected) || submitState === "saving" || submitState === "saved"}>{submitState === "saving" ? "Storing..." : submitState === "saved" ? "Stored" : "Submit project"} <span aria-hidden="true">→</span></button></footer>
    </main>
  );
}

function SamiProjectPage() {
  return (
    <main className="sami-project-page">
      <h1>Hello</h1>
      <p>My name is Sami Boulhafa. Im 14 years old I love drawing and playing video game</p>
    </main>
  );
}

export default App;
