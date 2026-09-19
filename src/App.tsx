const news = [
  { rank: "02", title: "Laya the open source version of Jev", meta: "354 points - 26 comments - Sep 19, 2026", href: "https://laya.convaiinnovations.com/" },
  { rank: "03", title: "A graphical desktop for the ZX Spectrum", meta: "27 points - 3 comments - Sep 19, 2026", href: "https://github.com/mindbox77/zxdesk" },
  { rank: "04", title: "AI-generated posters don’t have to be horrible", meta: "599 points - 107 comments - Sep 19, 2026", href: "https://john.hartnup.uk/2026/06/07/ai-event-posters.html" },
  { rank: "05", title: "Tin: full-text search for Postgres", meta: "32 points - 2 comments - Sep 19, 2026", href: "https://planetscale.com/blog/introducing-tin" },
  { rank: "06", title: "Human brain is two separate organs, Stanford Medicine-led research finds", meta: "434 points - 41 comments - Sep 19, 2026", href: "https://med.stanford.edu/news/all-news/2026/09/two-separate-brains.html" }
];

function App() {
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
      <section className="showcase-projects"><p className="eyebrow">Student showcase</p><h2>Made by my students</h2><p>A space to celebrate the creative projects built by our students.</p><div className="project-grid"><a className="project-card featured-project" href="/projects/sami"><div className="project-image"><img src="/sami.jpeg" alt="Sami Boulhafa&apos;s project preview" /><span className="project-type">Web Project</span></div><div className="project-card-copy"><div className="project-card-topline"><div><p className="project-student">Sami Boulhafa</p><h3>Hello, I&apos;m Sami</h3></div><div className="project-tools" aria-label="Drawing, games, and code"><span><img src="/controller.png" alt="" /></span><span><img src="/draw.png" alt="" /></span><span><img src="/code.png" alt="" /></span></div></div><p>Drawing, games, and a first web page</p><div className="project-action"><strong>Open project</strong><span aria-hidden="true">→</span></div></div></a></div><strong>Keep learning, keep creating.</strong></section>
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
