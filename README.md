# LearnHub

A classroom **learning platform** for students aged **11–15**.

LearnHub is not only an API project — it is a place for **many lessons** (APIs now, more subjects later).

- Platform home: `/`
- All lessons: `/lessons`
- Practice API + library CRUD included
- CORS enabled for student HTML projects
- Teacher: **Oussama**

---

## Pages

| URL | What it is |
|-----|------------|
| `/` | LearnHub home |
| `/lessons` | Hub: all **lessons** + **labs** |
| `/lessons/api` | Lesson 1 — Intro to APIs (theory) |
| `/lessons/http-methods` | Lesson 2 — HTTP methods (theory) |
| `/labs/api-playground` | Lab 1 — API practice buttons |
| `/labs/library-crud` | Lab 2 — Library CRUD practice |

**Lessons** = explain ideas. **Labs** = hands-on practice.

---

## 1. Project description

Students learn skills step by step:

- what an **endpoint** is
- how to send a **request**
- how to read a **JSON response**
- how **status codes** work
- how to use **`fetch()`**
- **GET, POST, PUT, DELETE** and CRUD
- a library app with **PostgreSQL**

Open after deploy:

```text
https://YOUR-PROJECT.vercel.app/
https://YOUR-PROJECT.vercel.app/lessons
```

---

## 2. Project structure

```text
student-api/
├── api/
│   ├── _helpers.js      # Shared CORS + JSON helpers (not a public route)
│   ├── _db.js           # PostgreSQL connection helper
│   ├── hello.js
│   ├── fact.js
│   ├── students.js
│   ├── student.js
│   ├── jokes.js
│   ├── weather.js
│   ├── health.js
│   ├── books.js         # GET all + POST books (library)
│   └── books/
│       └── [id].js      # GET one, PUT, DELETE
├── data/
│   ├── facts.js
│   ├── students.js
│   └── jokes.js
├── sql/
│   └── books.sql        # Create the library books table
├── public/
│   ├── index.html
│   ├── lessons.html            # Hub: lessons + labs
│   ├── lessons/
│   │   ├── api.html            # Lesson 1 — Intro to APIs
│   │   └── http-methods.html   # Lesson 2 — HTTP methods
│   └── labs/
│       ├── api-playground.html # Lab 1 — try endpoints
│       └── library-crud.html   # Lab 2 — library CRUD
├── .env.example
├── package.json
├── vercel.json
├── .gitignore
└── README.md
```

---

## 3. Installation instructions

### Requirements

- [Node.js](https://nodejs.org/) version 18 or newer
- A free [Vercel](https://vercel.com/) account (for deployment)
- Optional: a PostgreSQL database for the CRUD lab
- Optional: [Git](https://git-scm.com/) and a [GitHub](https://github.com/) account

### Install packages

```bash
cd student-api
npm install
```

### Install the Vercel CLI (recommended for local testing)

```bash
npm install -g vercel
```

---

## 4. How to run locally

### Option A — Vercel CLI (best option)

```bash
vercel dev
```

Then open:

```text
http://localhost:3000
```

API examples:

```text
http://localhost:3000/api/hello
http://localhost:3000/api/fact
http://localhost:3000/api/students
```

### Option B — After deploying

Use your live Vercel URL:

```text
https://YOUR-PROJECT.vercel.app/api/hello
```

> Tip: Opening `public/index.html` with a double-click (`file://`) will not call `/api/...` correctly. Use `vercel dev` or the deployed site.

---

## 5. How to test endpoints

### In the browser

Visit:

- `/api/hello`
- `/api/fact`
- `/api/students?city=Tangier`
- `/api/student?id=2`
- `/api/jokes`
- `/api/weather?city=Rabat`
- `/api/health`

### On the homepage

Open `/` and click the buttons in the **Try the API now** section.

### With JavaScript

```javascript
fetch("/api/fact")
  .then(response => response.json())
  .then(data => {
    console.log(data);
  })
  .catch(error => {
    console.error(error);
  });
```

---

## 6. How to deploy to Vercel

### Method 1 — Vercel Dashboard (easiest for teachers)

1. Push this project to GitHub (see section 7).
2. Go to [https://vercel.com](https://vercel.com) and sign in.
3. Click **Add New… → Project**.
4. Import your GitHub repository.
5. Keep the default settings.
6. Click **Deploy**.
7. Copy your live URL, for example:
   `https://student-api.vercel.app`

### Method 2 — Vercel CLI

```bash
vercel login
vercel
```

For production:

```bash
vercel --prod
```

Or use the npm script:

```bash
npm run deploy
```

After deployment, share the URL with your class so students can call the API from their HTML pages.

---

## 7. How to upload the project to GitHub

Replace `YOUR_GITHUB_REPOSITORY_URL` with your real repository URL.

```bash
git init
git add .
git commit -m "Create student learning API"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

Example repository URL format:

```text
https://github.com/your-username/student-api.git
```

---

## 8. List of all API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/hello` | Welcome message |
| `GET` | `/api/fact` | One random educational fact |
| `GET` | `/api/fact?category=science` | Random fact from one category |
| `GET` | `/api/students` | List fictional students |
| `GET` | `/api/students?city=Tangier` | Filter by city |
| `GET` | `/api/students?level=Beginner` | Filter by level |
| `GET` | `/api/students?language=JavaScript` | Filter by favorite language |
| `GET` | `/api/student?id=2` | One student by ID |
| `GET` | `/api/jokes` | One random joke |
| `GET` | `/api/jokes?all=true` | All jokes |
| `GET` | `/api/weather` | Fictional weather for all cities |
| `GET` | `/api/weather?city=Tangier` | Weather for one city |
| `GET` | `/api/health` | API health check |
| `GET` | `/api/books` | List library books |
| `GET` | `/api/books?genre=science` | Filter by genre |
| `GET` | `/api/books?available=true` | Only available books |
| `POST` | `/api/books` | Add a book |
| `GET` | `/api/books/1` | Get one book by id |
| `PUT` | `/api/books/1` | Update a book |
| `DELETE` | `/api/books/1` | Delete a book |

### Fact categories

`animals`, `computers`, `science`, `space`, `geography`, `programming`

### Weather cities

`Tangier`, `Casablanca`, `Rabat`, `Marrakech`, `Fez`, `Agadir`

### Lesson pages

```text
/
/lessons
/lessons/api
/lessons/http-methods
/labs/api-playground
/labs/library-crud
```

---

## PostgreSQL setup for the library CRUD lab

1. Create a PostgreSQL database (Neon, Supabase, Railway, etc.).
2. Open the SQL editor and run the file `sql/books.sql`.
3. Copy the connection string.
4. In Vercel: **Project → Settings → Environment Variables**
   - Name: `DATABASE_URL`
   - Value: your connection string
5. Redeploy:

```bash
vercel --prod
```

For local testing, create a `.env` file (do not commit it):

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
```

Then run:

```bash
vercel dev
```

### Example POST body

```json
{
  "title": "Robot Friends",
  "author": "Lina Benali",
  "genre": "technology",
  "year": 2024,
  "pages": 120,
  "language": "English",
  "available": true,
  "summary": "A story about coding robots."
}
```

### Book fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | text | yes | max 150 chars |
| `author` | text | yes | max 100 chars |
| `genre` | text | yes | fiction, science, history, technology, comics, poetry, biography, other |
| `year` | number | yes | 1000–2100 |
| `pages` | number | no | 1–5000 |
| `language` | text | no | default English |
| `available` | boolean | no | default true |
| `summary` | text | no | max 300 chars |

---

## 9. Example `fetch()` code for students

### Basic example (`.then`)

```javascript
fetch("https://YOUR-PROJECT.vercel.app/api/hello")
  .then(response => response.json())
  .then(data => {
    console.log(data.message);
  })
  .catch(error => {
    console.error(error);
  });
```

### Async / await example

```javascript
async function loadFact() {
  try {
    const response = await fetch("https://YOUR-PROJECT.vercel.app/api/fact");
    const data = await response.json();

    if (data.success) {
      console.log(data.data.fact);
    }
  } catch (error) {
    console.error(error);
  }
}

loadFact();
```

### Show data on a webpage

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>My API Practice</title>
</head>
<body>
  <h1>Random Joke</h1>
  <p id="joke">Loading...</p>

  <script>
    async function showJoke() {
      const response = await fetch("https://YOUR-PROJECT.vercel.app/api/jokes");
      const data = await response.json();
      document.getElementById("joke").textContent =
        data.data.question + " " + data.data.answer;
    }

    showJoke();
  </script>
</body>
</html>
```

### Filter students

```javascript
fetch("https://YOUR-PROJECT.vercel.app/api/students?city=Tangier&level=Beginner")
  .then(response => response.json())
  .then(data => {
    console.log("Found:", data.count);
    console.log(data.data);
  });
```

---

## 10. Common errors and solutions

| Problem | Likely cause | Solution |
|---------|--------------|----------|
| `Failed to fetch` | Wrong URL, offline, or CORS blocked | Check the URL and make sure the API is deployed |
| Opening HTML with `file://` | Local file cannot call relative `/api` paths | Use `vercel dev` or the full Vercel URL |
| `404 Category not found.` | Typo in category name | Use: animals, computers, science, space, geography, programming |
| `400 Student ID is required.` | Missing `id` | Call `/api/student?id=1` |
| `404 Student not found.` | ID does not exist | Try IDs from 1 to 10 |
| `404 City not found.` | Unknown city | Use Tangier, Casablanca, Rabat, Marrakech, Fez, Agadir |
| Buttons do nothing locally | Server not running | Run `vercel dev` |

---

## 11. CORS explanation

**CORS** means Cross-Origin Resource Sharing.

Browsers block some requests between different websites for security.

This API allows classroom use by sending:

```text
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

That means students can call the API from:

- a local HTML file served by Live Server
- another website they build
- the API homepage itself

`OPTIONS` requests are handled so browsers can complete their CORS “preflight” check.

---

## 12. HTTP status code explanation

| Code | Meaning | Example in this API |
|------|---------|---------------------|
| `200` | Success | Fact or students returned |
| `204` | No content | Successful CORS `OPTIONS` reply |
| `400` | Bad request | `/api/student` without `id` |
| `404` | Not found | Unknown category, student, or city |
| `405` | Method not allowed | Using `POST` instead of `GET` |
| `500` | Server error | Unexpected crash (should be rare) |

---

## 13. Note: all data is fictional

- Student names, ages, cities, and skills are invented for learning.
- Weather data is **not real**. It is only for practicing APIs.
- Do not treat any response as personal information about real students.

---

## 14. Classroom activity ideas

1. **Hello World API** — Call `/api/hello` and display `message` in an HTML page.
2. **Fact of the Day** — Call `/api/fact` and show one fact with its category.
3. **Category Challenge** — Let students choose a category button and fetch matching facts.
4. **Student Cards** — Call `/api/students` and create cards with name, city, and level.
5. **Find a Student** — Build a form that asks for an ID and calls `/api/student?id=...`.
6. **Joke Generator** — Make a button that loads a new joke each click.
7. **Weather Board** — Show fictional weather for all Moroccan cities.
8. **Filter Detectives** — Combine filters like `city` + `level` and count the results.
9. **Status Code Hunt** — Intentionally call bad URLs and read `400` / `404` responses.
10. **Health Monitor** — Call `/api/health` and display the live timestamp.
11. **Methods Match** — Open `/learn` and match GET/POST/PUT/DELETE to Create/Read/Update/Delete.
12. **Library Board** — Use the biblio CRUD mini app to add, edit, and delete books in PostgreSQL.

---

## Quick start commands

```bash
# Install Vercel CLI once
npm install -g vercel

# Run locally
vercel dev

# Deploy
vercel --prod
```

Happy teaching and happy coding!
