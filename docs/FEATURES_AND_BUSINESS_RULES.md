# Features and Business Rules Documentation

## Overview

Logic Leap System is a cognitive assessment and training platform that provides adaptive IQ testing, personalized brain training, and gamified learning experiences.

## Core Features

### 1. Assessment System

#### Standard Assessment (V1)
- **Type**: Fixed-question assessment
- **Questions**: 25 questions from predefined pool
- **Categories**: Logic, Pattern, Spatial, Speed, Self
- **Scoring**: Weighted average across categories
- **Flow**: Linear progression through questions

#### Adaptive Assessment (V2)
- **Type**: Adaptive testing algorithm
- **Questions**: 27 questions (adaptive selection)
- **Algorithm**: 
  - Starts with ability estimate of 2.0 (1.0-3.0 scale)
  - Adjusts difficulty based on performance
  - Correct answer: +0.3 ability
  - Incorrect answer: -0.4 ability
  - Ability clamped between 1.0 and 3.0
- **Question Selection**:
  - Likert questions at fixed positions: 1, 2, 3, 16, 18, 25, 27
  - Scored questions selected by:
    1. Closest difficulty to current ability
    2. Least-covered category (tie-breaker)
- **Trajectory Analysis**: Tracks improving/stable/declining performance

#### Reinforcement Breaks
- **Trigger Points**: After questions 8, 18, and 23
- **Purpose**: Maintain engagement, prevent fatigue
- **Behavior**: Shows motivational content, then returns to assessment

### 2. Scoring System

#### Category Scores
- **Calculation**: Percentage correct per category
- **Likert Questions**: Converted to 0-1 scale (option/5)
- **Scored Questions**: 1 for correct, 0 for incorrect

#### Final Score
- **Range**: 90-145 (IQ scale)
- **Formula**: Weighted average of category scores
- **Weights**:
  - Logic: 30%
  - Pattern: 25%
  - Spatial: 20%
  - Speed: 15%
  - Self: 10%

#### Percentiles
- **Category Percentiles**: 60-99 range (encouraging)
- **Overall Percentile**: 25-99.9 range
- **Mapping**: Linear mapping from score to percentile

### 3. User Profiles

#### Profile Creation
- **Trigger**: Automatic on user signup (database trigger)
- **Initial Values**:
  - XP: 0
  - Level: 1
  - Brain Score: 0
  - Streaks: 0
  - Display Name: From metadata or email prefix

#### Profile Management
- **Update**: Via dashboard profile page
- **Display Name**: Editable
- **Avatar**: Uploadable (future feature)

### 4. Gamification System

#### XP and Leveling
- **XP Tiers**:
  - Levels 2-5: 75 XP per level
  - Levels 6-10: 125 XP per level
  - Levels 11-15: 200 XP per level
  - Levels 16-20: 300 XP per level
  - Levels 21-25: 450 XP per level
  - Levels 26-30: 600 XP per level
- **Max Level**: 30
- **Milestone Titles**:
  - Level 1: Novice
  - Level 3: Learner
  - Level 6: Apprentice
  - Level 10: Thinker
  - Level 14: Analyst
  - Level 18: Strategist
  - Level 22: Expert
  - Level 26: Master
  - Level 30: Grandmaster

#### Brain Score
- **Calculation**: XP * 0.5 + existing brain score
- **Purpose**: Overall cognitive performance metric
- **Display**: Shown in dashboard

#### Streaks
- **Daily Check-in**: Required to maintain streak
- **Current Streak**: Resets if missed
- **Longest Streak**: Tracks all-time best
- **XP Bonus**: Awarded for daily check-in
- **Milestones**: Celebrated at streak milestones

### 5. Content System

#### Brain Teasers
- **Types**: Riddle, Lateral Thinking, Word Puzzle, Logic Trap, Visual Illusion
- **Categories**: Logic, Pattern, Spatial, Speed, Memory, Verbal
- **Difficulty**: 1-5 scale
- **XP Reward**: Varies by difficulty
- **Progress Tracking**: Status (not_started, in_progress, completed)

#### Puzzles
- **Types**: 
  - Matrix Pattern
  - Sequence Completion
  - Odd One Out
  - Spatial Rotation
  - Path Trace
- **Features**:
  - Procedurally generated
  - Seeded random for consistency
  - Time limits (optional)
  - Multiple difficulty levels
- **XP Reward**: Varies by difficulty and completion

#### Lessons
- **Structure**: Modules with quizzes
- **Categories**: Same as brain teasers
- **Order**: Sequential (order_index)
- **XP Reward**: On completion
- **Progress**: Tracks module completion and quiz scores

### 6. Achievement System

#### Achievement Types
- **Complete Count**: Total activities completed
- **Type-Specific Count**: Activities by type (brain_teaser, puzzle, lesson)
- **Timed Count**: Activities completed in timed mode
- **Perfect Quiz**: 100% score on lesson quiz

#### Achievement Granting
- **Trigger**: After activity completion
- **Check**: Evaluates all achievement conditions
- **Grant**: Inserts into user_achievements table
- **XP Bonus**: Awards achievement XP reward
- **Celebration**: Shows achievement unlock animation

### 7. Report System

#### Report Types
- **Preview**: Free preview of results
- **Full Report**: Purchased detailed report
- **Test Types**: Standard, Adaptive (V2)

#### Report Content
- **Final Score**: Overall IQ score
- **Percentile**: Overall percentile ranking
- **Category Scores**: Per-category breakdown
- **Category Percentiles**: Per-category percentile
- **Strongest Category**: Best performing category
- **Trajectory**: Performance trend (adaptive only)
- **Personalized Insights**: Category-specific analysis

#### Report Purchase Flow
1. User completes assessment
2. Views preview report
3. Provides email (optional, for later claim)
4. Purchases full report
5. Report saved to user_reports table
6. Accessible in dashboard

### 8. Learning Path System

#### Generation
- **Trigger**: After assessment completion
- **Method**: AI-generated via Nest `/ai/generate-learning-path`
- **Input**: Assessment scores, strongest/weakest categories
- **Output**: 4-week personalized training plan
- **Storage**: Saved to learning_paths table

#### Plan Structure
- **Duration**: 4 weeks
- **Focus**: Weakest category improvement
- **Content**: Mix of brain teasers, puzzles, lessons
- **Progression**: Difficulty increases over time

## Business Rules

### Assessment Rules

1. **Session Management**
   - Session created when user starts assessment
   - Session ID stored in sessionStorage
   - Answers saved in real-time
   - Session can be anonymous (no auth required)

2. **Question Progression**
   - Cannot skip ahead (enforced by funnel state)
   - Can go back to previous questions
   - Reinforcement breaks are mandatory
   - Assessment must be completed to see results

3. **Scoring Rules**
   - All questions must be answered for final score
   - Likert questions contribute to category scores
   - Time spent tracked but not used in scoring
   - Final score calculated only on completion

### User Account Rules

1. **Profile Creation**
   - Automatic on signup
   - Cannot be deleted (data retention)
   - One profile per user (enforced by unique constraint)

2. **Authentication**
   - Email/password required
   - Email verification required for new accounts
   - Password reset available
   - Session persists across browser sessions

3. **Dashboard Access**
   - Requires authentication
   - Exception: Can view reports if session exists
   - Profile data loads on dashboard entry

### Content Rules

1. **Progress Tracking**
   - One progress record per user-content combination
   - Status: not_started → in_progress → completed
   - Score recorded for quizzes
   - Time spent tracked for all activities

2. **XP Awards**
   - Base XP from content difficulty
   - Timed mode bonus: +50% XP
   - Achievement XP: Additional bonus
   - Level-up: Celebrated but no extra XP

3. **Content Availability**
   - All content available to authenticated users
   - No paywall for training content
   - Difficulty-based filtering (future)

### Achievement Rules

1. **Earning Conditions**
   - Evaluated after each activity completion
   - Must meet exact condition (e.g., count >= threshold)
   - Cannot earn same achievement twice
   - XP awarded immediately upon earning

2. **Achievement Types**
   - Cumulative (total count)
   - Type-specific (by content type)
   - Mode-specific (timed activities)
   - Performance-based (perfect scores)

### Report Rules

1. **Report Generation**
   - Created after assessment completion
   - Linked to session_id
   - Can be anonymous (no user_id)
   - Can be claimed after authentication

2. **Report Purchase**
   - Preview always available
   - Full report requires purchase
   - One report per session
   - Reports saved permanently

3. **Report Access**
   - Preview: Available immediately
   - Full: After purchase
   - Historical: In dashboard after authentication

### Streak Rules

1. **Daily Check-in**
   - One check-in per day
   - Resets at midnight (timezone-based)
   - XP bonus for successful check-in
   - Streak milestone celebrations

2. **Streak Maintenance**
   - Current streak increments on check-in
   - Resets to 0 if missed
   - Longest streak never decreases
   - Tracked in profile

### Data Retention Rules

1. **Assessment Data**
   - Sessions stored indefinitely
   - Answers linked to sessions
   - Cannot be deleted by user
   - Used for analytics and improvement

2. **User Data**
   - Profiles persist after account deletion (anonymized)
   - Progress data retained
   - Reports retained
   - Compliance with privacy regulations

## Feature Flags and Variants

### Assessment Variants
- **V1**: Standard fixed-question assessment
- **V2**: Adaptive assessment (current default)
- **Future**: Additional test types (personality, love language, career)

### Funnel Variants
- **Standard Flow**: Landing → Intro → Assessment → Results
- **V2 Flow**: Landing → Assessment → Social Proof → Results
- **A/B Testing**: Different social proof pages, checkout flows

## Limitations and Constraints

### Technical Constraints
- Session storage limited (~5-10MB)
- Assessment state lost on browser close
- No offline support
- Real-time features not implemented

### Business Constraints
- Free preview reports only
- Full reports require purchase
- No refund policy for digital products (see refund policy page)
- Assessment can only be taken once per session

### Data Constraints
- Maximum level: 30
- Maximum questions: 27 (adaptive)
- Score range: 90-145
- Percentile range: 25-99.9

## Future Features (Planned)

1. **Social Features**
   - Leaderboards
   - Friend comparisons
   - Sharing achievements

2. **Advanced Analytics**
   - Progress charts
   - Performance trends
   - Category improvement tracking

3. **Content Expansion**
   - More puzzle types
   - Video lessons
   - Interactive tutorials

4. **Mobile App**
   - Native iOS/Android apps
   - Push notifications
   - Offline mode

5. **Subscription Tiers**
   - Free tier (limited)
   - Premium tier (full access)
   - Family plans

## Compliance and Privacy

### Data Collection
- Email (for account creation)
- Assessment answers (for scoring)
- Progress data (for gamification)
- Usage analytics (for improvement)

### Data Usage
- Personalization
- Service improvement
- Analytics and research
- Marketing (with consent)

### User Rights
- Access to personal data
- Data export
- Account deletion
- Privacy policy compliance
