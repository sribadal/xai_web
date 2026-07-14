# XAI Survey Web

A Next.js web application for presenting AI-generated patient explanations and collecting structured survey responses. Built as the frontend companion to the [XAI Decision Making](https://github.com/sribadal/xai_py) Python framework, this app provides an admin panel for building multilingual surveys and managing participants, and a participant-facing side for running vignette-based interviews with patients and clinicians.

Developed as part of a thesis project investigating which explanation modalities patients and clinicians find most useful for understanding AI-driven predictions in pancreatic cancer care (PACAP cohort).

A deployed version of the application is live at [xai.shivambadal.com](https://xai.shivambadal.com). This requires access credentials. If you would like to view the explanations, please reach out at shivibadal@outlook.com.

---

## Overview

The application has two sides. The admin panel is where the researcher creates surveys, writes questions with per-locale translations, defines glossary terms, organises taxonomy tags, and generates participant access codes. The participant-facing side presents AI explanation vignettes alongside survey questions and collects responses.

The Python project runs offline to generate patient-level explanations across four modalities (attribution, counterfactual, case-based, and rule-based). It exports structured JSON per patient. This web app imports that JSON and renders the explanations in a card-based survey flow so participants can evaluate them.

---

## Tech Stack

The project is built with the following tools and libraries:

- **Next.js 16** with the App Router and TypeScript
- **Prisma 7** as the ORM, with the `prisma-client` generator (outputs to `lib/generated/prisma`)
- **PostgreSQL** for the database (Docker container locally, Neon for production)
- **Auth.js v5** (`next-auth@beta`) with Google OAuth for admin authentication
- **shadcn/ui** for the component library
- **Vercel** for deployment, with Neon Postgres via the Vercel Marketplace integration

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- A running PostgreSQL instance (Docker recommended for local development)
- Google OAuth credentials (for admin login)

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/sribadal/xai_web.git
cd xai_web
npm install
```

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/xai_survey"
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
AUTH_SECRET=your-auth-secret
```

Both Prisma and Next.js read from `.env`, so a single file is sufficient. There is no need for a separate `.env.local`.

### Database Setup

If using Docker for local Postgres:

```bash
docker exec -it <your-container-name> psql -U postgres -c "CREATE DATABASE xai_survey;"
```

Then push the Prisma schema to create all tables:

```bash
npx prisma generate
npx prisma db push
```

Run `npx prisma studio` to verify the tables were created.

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

---

## Authentication

The app uses two separate authentication mechanisms:

**Admin access** is protected by Google OAuth via Auth.js. The `auth.ts` file in the project root configures the Google provider. The `proxy.ts` file (Next.js 16 renamed `middleware.ts` to `proxy.ts`) protects all `/admin/*` routes. The admin layout checks the session and shows a Google sign-in card when unauthenticated.

Required Google Cloud Console setup: add your production URL as an authorized redirect URI at `https://your-app.vercel.app/api/auth/callback/google`.

**Participant access** uses simple access codes. No OAuth or user accounts are involved. Participants enter a code to begin a survey session.

---

## Database Schema

The Prisma schema uses dedicated translation tables for full multilingual support. There are no JSON columns for translated content.

The core entities and their relationships:

**Survey** holds a title, description, status (DRAFT, PUBLISHED, or CLOSED), and timestamps. Survey status controls editability: DRAFT surveys can be edited, PUBLISHED surveys are locked for data collection, and CLOSED surveys are finished.

**Question** belongs directly to a survey (no junction table, meaning fixed question sets per survey). Each question has a type (Likert, radio, checkbox, open text, ranking), display order, and optional helper text. Questions support `[[term]]` markers in their text that render as glossary tooltips.

**Answer** defines the selectable options for a question, each with a label, numeric value, and display order. Likert-scale defaults can be added with a single shortcut action.

**GlossaryTerm** stores terms and their definitions. When a question's text contains `[[term]]`, the participant UI renders it as a tooltip with the matching definition.

**TagGroup and Tag** form the taxonomy system. Tags are organised into groups (like "construct" with tags such as "trust", "understandability", "actionability"). Tags are linked to questions through a QuestionTag join table, not as a field on Question.

**Participant** holds an access code and links to survey sessions.

**SurveySession** tracks a participant's progress through a survey, with a status field for in-progress and completed states.

**Response and ResponseAnswer** store the participant's answers. Each response links a participant session to a question, and response answers capture which options were selected.

All translatable entities (surveys, questions, answers, glossary terms) have companion translation tables with a locale foreign key, supporting as many languages as needed.

---

## Admin Panel

The admin panel is accessible at `/admin` and requires Google OAuth sign-in. It provides the following sections:

**Dashboard** (`/admin`) shows count cards linking to each management section.

**Surveys** (`/admin/surveys`) lists all surveys with options to create new ones (with per-locale translations via tabs), delete, publish, and close. Each survey has a detail page (`/admin/surveys/[id]`) that serves as the question builder, showing all questions in a collapsible accordion with their translations, answer options, and tags.

**Glossary** (`/admin/glossary`) provides a table view of all glossary terms with inline editing and deletion, plus a create dialog with per-locale definitions.

**Taxonomy** (`/admin/taxonomy`) displays tag groups as cards, each with inline tag creation (type and press enter) and delete buttons on both tags and groups.

**Participants** (`/admin/participants`) shows a table of access codes with options to generate a single custom code or bulk-generate multiple codes, and delete unused ones.

All server actions are centralised in a single file and use `revalidatePath` to refresh the page after mutations.

---

## Explanation Data Integration

The Python project (`xai_decision_making`) exports per-patient JSON files containing explanation results across all four modalities. Each file includes attribution scores (LIME, SHAP, Permutation Importance, and others), counterfactual scenarios (DiCE, Wachter, FACE, FOCUS, LORE, C-CHVAE), case-based retrievals (KNN, embedding, prototype), and rule-based explanations (LORE rules, RuleFit, Anchors, Skope-Rules).

The web app imports these JSON files and presents the explanation data alongside survey questions in a card-based flow. The exact import contract between the two projects covers per-patient files with modality-grouped explanation data, confidence metrics, and sanity check results.

---

## Related Repository

This project is the frontend companion to the XAI Decision Making framework:

- [xai_py](https://github.com/sribadal/xai_py) contains the Python explainability framework, model adapters, all 20+ explanation methods, sanity checks, and the JSON export pipeline.