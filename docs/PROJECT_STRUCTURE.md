# Project Structure Documentation

## Overview

Logic Leap / Life Scale is a React-based cognitive assessment and training platform built with TypeScript, Vite, NestJS, Cognito, and PostgreSQL (Prisma).

## Technology Stack

- **Frontend Framework**: React 18.3.1
- **Build Tool**: Vite 5.4.19
- **Language**: TypeScript 5.8.3
- **Styling**: Tailwind CSS 3.4.17
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: React Context API
- **Routing**: React Router DOM 6.30.1
- **Backend**: NestJS (AWS Lambda + HTTP API)
- **Auth**: Amazon Cognito (email/password)
- **Database**: PostgreSQL via Prisma 7
- **Data Fetching**: TanStack Query 5.83.0
- **Animations**: Framer Motion 12.34.0
- **Form Handling**: React Hook Form 7.61.1 + Zod 3.25.76

## Directory Structure

```
brainwave-booster-47/
├── src/                          # Frontend source
│   ├── components/
│   ├── context/                  # AuthContext, etc.
│   ├── integrations/
│   │   └── api/                  # Nest client + Cognito auth
│   ├── lib/
│   ├── pages/
│   ├── services/
│   └── ...
├── api/                          # NestJS API + Prisma
├── infra/cdk/                    # Auth + API stacks
├── docs/
├── public/
├── sst.config.ts                 # Static site deploy
└── package.json
```

## Core Architecture

### Application Flow

1. **Entry Point** (`main.tsx`)
   - Initializes React root
   - Renders `App` component

2. **App Component** (`App.tsx`)
   - Sets up providers (QueryClient, TooltipProvider, AuthProvider, FunnelProvider)
   - Configures routing
   - Handles protected routes

3. **Context Providers**
   - **AuthProvider**: Manages user authentication state
   - **FunnelProvider**: Manages assessment funnel state and progression

### Key Modules

#### 1. Assessment Engine (`src/engine/`)

**adaptiveEngine.ts**
- Implements adaptive testing algorithm
- Selects questions based on user ability
- Tracks category coverage
- Calculates ability estimates

**scoringEngine.ts**
- Calculates category scores from answers
- Computes weighted final score (90-145 range)
- Converts scores to percentiles
- Identifies strongest/secondary categories

**puzzleGenerator.tsx**
- Generates visual puzzles procedurally
- Supports multiple puzzle types
- Uses seeded random for consistency

#### 2. State Management (`src/context/`)

**FunnelContext.tsx**
- Manages assessment funnel state
- Persists to sessionStorage
- Handles stage progression
- Syncs with database

**AuthContext.tsx**
- Manages authentication state
- Provides auth methods (signIn, signUp, signOut)
- Listens to auth state changes

#### 3. Services Layer (`src/services/`)

**assessmentService.ts**
- Creates assessment sessions
- Saves answers
- Updates session results
- Creates user profiles
- Manages pending reports

**dashboardService.ts**
- Fetches user profile
- Manages content progress
- Handles achievements
- Manages XP and leveling
- Daily streak check-ins

#### 4. Pages (`src/pages/`)

**Assessment Pages**
- `AssessmentPage.tsx`: Standard fixed-question assessment
- `AssessmentPage2.tsx`: Adaptive assessment (V2)

**Dashboard Pages**
- `DashboardLayout.tsx`: Main dashboard layout with sidebar
- `DashboardHome.tsx`: Dashboard overview
- `TestsPage.tsx`: Available tests
- `MyReportsPage.tsx`: User's assessment reports
- `BrainTeasersPage.tsx`: Brain teaser exercises
- `PuzzlesPage.tsx`: Visual puzzle exercises
- `LessonsPage.tsx`: Educational content
- `AchievementsPage.tsx`: User achievements
- `ProfilePage.tsx`: User profile settings

**Other Pages**
- `LandingPage.tsx`: Marketing landing page
- `AuthPage.tsx`: Login/signup
- `ReportPage.tsx`: Assessment results display
- Legal pages (Terms, Privacy, etc.)

## Data Flow

### Assessment Flow

1. User lands on landing page
2. Starts assessment → creates session in database
3. Answers questions → saved to database in real-time
4. Completes assessment → calculates scores
5. Views results → can purchase full report
6. Provides email → creates user profile
7. Purchases report → creates user_report record

### Authentication Flow

1. User signs up/signs in via `AuthPage`
2. `AuthContext` manages session
3. Cognito handles authentication; Nest API validates JWTs
4. Profile ensured via API on first authenticated request
5. User redirected to dashboard

### Dashboard Flow

1. User accesses dashboard (protected route)
2. `useBrainScore` hook fetches profile and progress
3. Daily check-in runs automatically
4. User completes activities → XP awarded
5. Achievements checked and granted
6. Level-ups trigger celebrations

## Database Schema

### Core Tables

- **profiles**: User profiles (XP, level, streaks)
- **assessment_sessions**: Anonymous assessment sessions
- **assessment_answers**: Individual question answers
- **user_profiles**: Email-linked profiles (pre-auth)
- **user_reports**: Purchased assessment reports
- **brain_teasers**: Brain teaser content
- **puzzles**: Puzzle content
- **lessons**: Educational lesson content
- **user_content_progress**: User progress tracking
- **achievements**: Achievement definitions
- **user_achievements**: User-earned achievements
- **learning_paths**: AI-generated learning plans
- **affiliate_applications**: Affiliate program applications
- **cancel_otps**: OTP codes for cancellation

## Routing Structure

### Public Routes
- `/` - Landing page
- `/onboarding` - Assessment funnel
- `/auth` - Authentication
- `/reset-password` - Password reset
- `/help` - Help page
- `/sample` - Sample report
- `/affiliates` - Affiliate program
- Legal pages (`/terms`, `/privacy`, etc.)

### Protected Routes (Dashboard)
- `/dashboard` - Dashboard home
- `/dashboard/tests` - Available tests
- `/dashboard/reports` - User reports
- `/dashboard/reports/:reportId` - Report detail
- `/dashboard/brain-teasers` - Brain teasers
- `/dashboard/puzzles` - Puzzles
- `/dashboard/lessons` - Lessons
- `/dashboard/achievements` - Achievements
- `/dashboard/profile` - Profile settings

### Funnel Routes
- `/assessment2` - Adaptive assessment
- `/social-proof2` - Social proof (V2)
- `/calculating2` - Calculating (V2)
- `/email2` - Email capture (V2)
- `/checkout2` - Checkout (V2)
- `/report` - Results report

## Environment Variables

Required environment variables:
- `VITE_API_URL` - Nest API base URL
- `VITE_COGNITO_USER_POOL_ID` - Cognito user pool ID
- `VITE_COGNITO_CLIENT_ID` - Cognito app client ID
- `VITE_COGNITO_DOMAIN` - Cognito Hosted UI domain (Google OAuth)
- `VITE_COGNITO_REGION` - AWS region

## Build and Development

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Testing
```bash
npm test
```

## Key Design Patterns

1. **Context API**: Global state management
2. **Custom Hooks**: Reusable logic encapsulation
3. **Service Layer**: Data access abstraction
4. **Component Composition**: Reusable UI components
5. **Progressive Enhancement**: Works without auth initially

## Future Considerations

- Consider migrating to more robust state management (Zustand, Redux) if complexity grows
- Add comprehensive testing suite
- Implement proper error boundaries
- Add analytics tracking
- Consider code splitting for better performance
- Add PWA capabilities
