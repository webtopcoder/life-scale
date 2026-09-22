export interface LikertQuestion {
  id: number;
  text: string;
  reverse?: boolean; // if true, scoring is inverted
}

export interface LikertResult {
  label: string;
  description: string;
  color: string;
  minScore: number;
  tips: string[];
}

export interface LikertTestDef {
  id: string;
  title: string;
  description: string;
  duration: string;
  questionCount: number;
  rating: number;
  reviewCount: string;
  questions: LikertQuestion[];
  results: LikertResult[];
  disclaimer: string;
}

export const LIKERT_TESTS: LikertTestDef[] = [
  {
    id: "adhd",
    title: "Do I Have ADHD Traits?",
    description: "Assess your focus, attention, and impulsivity patterns.",
    duration: "8 min",
    questionCount: 18,
    rating: 4.7,
    reviewCount: "14.2k",
    disclaimer: "This is a self-screening tool, not a clinical diagnosis. Consult a healthcare professional for formal evaluation.",
    questions: [
      { id: 1, text: "I often have difficulty sustaining attention in tasks or conversations." },
      { id: 2, text: "I frequently lose things necessary for daily activities (keys, phone, wallet)." },
      { id: 3, text: "I find it hard to follow through on instructions or finish tasks." },
      { id: 4, text: "I often fidget or feel restless when I need to sit still." },
      { id: 5, text: "I frequently interrupt others or blurt out answers before questions are completed." },
      { id: 6, text: "I have trouble organizing tasks and managing time effectively." },
      { id: 7, text: "I am easily distracted by unrelated thoughts or stimuli." },
      { id: 8, text: "I often feel like my mind is racing or I can't slow down my thoughts." },
      { id: 9, text: "I tend to avoid or delay tasks that require sustained mental effort." },
      { id: 10, text: "I frequently forget daily obligations like appointments or deadlines." },
      { id: 11, text: "I have difficulty waiting my turn in lines or conversations." },
      { id: 12, text: "I often start multiple projects but struggle to finish them." },
      { id: 13, text: "I find it hard to relax or unwind even when I have free time." },
      { id: 14, text: "I frequently make careless mistakes in work or other activities." },
      { id: 15, text: "I often feel overwhelmed by large tasks and don't know where to start." },
      { id: 16, text: "I zone out during meetings or lectures even when I try to pay attention." },
      { id: 17, text: "I tend to hyperfocus on interesting tasks and lose track of time." },
      { id: 18, text: "I often feel impatient or frustrated when things move slowly." },
    ],
    results: [
      { label: "Low Likelihood", description: "Your responses suggest minimal ADHD-related traits. Your attention and focus patterns appear typical.", color: "hsl(160 60% 45%)", minScore: 0, tips: ["Keep reinforcing good habits like to-do lists and routines", "Practice mindfulness to maintain your strong focus", "Continue setting clear goals — your attention is a real asset"] },
      { label: "Mild Traits", description: "You show some attention-related tendencies that are common but not necessarily indicative of ADHD. Monitor if they impact daily life.", color: "hsl(45 95% 50%)", minScore: 36, tips: ["Try the Pomodoro technique — 25 minutes on, 5 minutes off", "Reduce phone notifications during focused work sessions", "Use a single trusted to-do app to capture stray thoughts"] },
      { label: "Moderate Traits", description: "Your responses suggest a noticeable pattern of attention and impulsivity challenges. Consider speaking with a professional.", color: "hsl(30 90% 55%)", minScore: 54, tips: ["Break big tasks into 5-minute chunks to reduce overwhelm", "Use a timer to build focus stamina gradually", "Write things down instead of relying on memory"] },
      { label: "High Likelihood", description: "Your responses strongly align with common ADHD patterns. A professional evaluation is recommended.", color: "hsl(0 84% 60%)", minScore: 68, tips: ["Try breaking big tasks into 5-minute chunks", "Use a timer to build focus stamina", "Write things down instead of relying on memory"] },
    ],
  },
  {
    id: "anxiety",
    title: "How Anxious Am I?",
    description: "Understand your anxiety patterns and stress responses.",
    duration: "7 min",
    questionCount: 15,
    rating: 4.8,
    reviewCount: "18.7k",
    disclaimer: "This screening tool does not replace professional mental health evaluation. If you're experiencing severe anxiety, please seek help.",
    questions: [
      { id: 1, text: "I often feel nervous or on edge for no clear reason." },
      { id: 2, text: "I find it difficult to stop or control worrying." },
      { id: 3, text: "I worry too much about different things throughout the day." },
      { id: 4, text: "I have trouble relaxing even in safe environments." },
      { id: 5, text: "I feel so restless that it's hard to sit still." },
      { id: 6, text: "I become easily annoyed or irritable." },
      { id: 7, text: "I feel afraid as if something awful might happen." },
      { id: 8, text: "I experience physical symptoms like racing heart or sweating when stressed." },
      { id: 9, text: "I avoid social situations because they make me anxious." },
      { id: 10, text: "I have trouble falling or staying asleep due to racing thoughts." },
      { id: 11, text: "I constantly seek reassurance from others about my decisions." },
      { id: 12, text: "Small problems feel overwhelming and insurmountable." },
      { id: 13, text: "I experience sudden intense fear or panic." },
      { id: 14, text: "I tend to catastrophize — imagining the worst possible outcome." },
      { id: 15, text: "My anxiety interferes with my daily activities or relationships." },
    ],
    results: [
      { label: "Minimal Anxiety", description: "Your anxiety levels appear within the normal range. Some worry is healthy and adaptive.", color: "hsl(160 60% 45%)", minScore: 0, tips: ["Keep up your healthy coping habits", "Regular exercise helps maintain low anxiety long-term", "Practice gratitude journaling to stay grounded"] },
      { label: "Mild Anxiety", description: "You experience occasional anxiety that may benefit from relaxation techniques and mindfulness practice.", color: "hsl(45 95% 50%)", minScore: 30, tips: ["Try box breathing: inhale 4s, hold 4s, exhale 4s, hold 4s", "Limit caffeine intake, especially after noon", "Schedule 10 minutes of daily mindfulness or meditation"] },
      { label: "Moderate Anxiety", description: "Your anxiety levels are elevated. Consider implementing stress-management strategies or speaking with a counselor.", color: "hsl(30 90% 55%)", minScore: 45, tips: ["Practice progressive muscle relaxation before bed", "Challenge anxious thoughts by writing them down and examining evidence", "Consider speaking with a therapist about coping strategies"] },
      { label: "Severe Anxiety", description: "Your responses suggest significant anxiety. Please consider reaching out to a mental health professional.", color: "hsl(0 84% 60%)", minScore: 56, tips: ["Reach out to a mental health professional — you don't have to manage this alone", "Focus on one small calming habit each day, like a 5-minute walk", "Limit news and social media consumption to reduce triggers"] },
    ],
  },
  {
    id: "eq",
    title: "Am I Emotionally Intelligent?",
    description: "Measure your ability to understand and manage emotions.",
    duration: "10 min",
    questionCount: 20,
    rating: 4.6,
    reviewCount: "11.3k",
    disclaimer: "Emotional intelligence is multifaceted. This assessment covers key dimensions but isn't exhaustive.",
    questions: [
      { id: 1, text: "I can accurately identify what I'm feeling in the moment." },
      { id: 2, text: "I stay calm and composed under pressure." },
      { id: 3, text: "I can tell how others are feeling even when they don't say it." },
      { id: 4, text: "I adapt my communication style based on who I'm talking to." },
      { id: 5, text: "I handle criticism without becoming defensive." },
      { id: 6, text: "I find it easy to see things from another person's perspective." },
      { id: 7, text: "I manage my emotions effectively rather than being controlled by them." },
      { id: 8, text: "I'm good at resolving conflicts between people." },
      { id: 9, text: "I notice when my mood affects my decision-making." },
      { id: 10, text: "I genuinely listen to others without planning my response while they talk." },
      { id: 11, text: "I can motivate myself even when facing setbacks." },
      { id: 12, text: "I pick up on subtle social cues and body language." },
      { id: 13, text: "I express my emotions in healthy and constructive ways." },
      { id: 14, text: "I build strong, trusting relationships easily." },
      { id: 15, text: "I know my emotional triggers and how to manage them." },
      { id: 16, text: "I feel comfortable giving honest but kind feedback." },
      { id: 17, text: "I can diffuse tense situations with empathy and tact." },
      { id: 18, text: "I bounce back quickly from emotional setbacks." },
      { id: 19, text: "I celebrate others' successes genuinely without jealousy." },
      { id: 20, text: "I understand how my emotions influence my behavior and thinking." },
    ],
    results: [
      { label: "Developing EQ", description: "Your emotional intelligence is in the growth phase. Practicing mindfulness and active listening will help significantly.", color: "hsl(30 90% 55%)", minScore: 0, tips: ["Start a daily feelings journal — name your emotions each evening", "Practice active listening: repeat back what someone said before responding", "Pause for 3 seconds before reacting in emotional conversations"] },
      { label: "Moderate EQ", description: "You have a solid emotional awareness foundation. Continue building your empathy and self-regulation skills.", color: "hsl(45 95% 50%)", minScore: 40, tips: ["Ask open-ended questions in conversations to deepen understanding", "Notice body language cues — crossed arms, eye contact, tone shifts", "Before big decisions, ask yourself: 'Am I thinking clearly or emotionally?'"] },
      { label: "Strong EQ", description: "Your emotional intelligence is above average. You understand both your own and others' emotions well.", color: "hsl(220 70% 45%)", minScore: 65, tips: ["Mentor others in emotional awareness — teaching deepens your own skills", "Challenge yourself in high-stakes social situations to grow further", "Read about advanced negotiation techniques to leverage your EQ"] },
      { label: "Exceptional EQ", description: "Your emotional intelligence is outstanding. You naturally navigate complex social and emotional landscapes.", color: "hsl(160 60% 45%)", minScore: 80, tips: ["Consider leadership or coaching roles where your EQ creates outsized impact", "Study conflict resolution frameworks to formalize your natural abilities", "Share your emotional insight with teams — your awareness elevates everyone"] },
    ],
  },
  {
    id: "memory",
    title: "How's My Memory?",
    description: "Evaluate your memory patterns and recall ability.",
    duration: "6 min",
    questionCount: 14,
    rating: 4.5,
    reviewCount: "9.8k",
    disclaimer: "Memory varies naturally with stress, sleep, and age. This is a self-assessment, not a clinical memory test.",
    questions: [
      { id: 1, text: "I can easily remember names of people I've recently met." },
      { id: 2, text: "I rarely forget where I put everyday items." },
      { id: 3, text: "I can recall details from conversations that happened days ago." },
      { id: 4, text: "I remember important dates without needing calendar reminders." },
      { id: 5, text: "I can follow multi-step instructions without writing them down." },
      { id: 6, text: "I easily remember phone numbers or codes I use frequently." },
      { id: 7, text: "I can vividly recall events from my childhood." },
      { id: 8, text: "I rarely need to re-read paragraphs to understand what I just read." },
      { id: 9, text: "I can hold several pieces of information in my head at once while solving a problem." },
      { id: 10, text: "I remember the plot details of books or movies I consumed months ago." },
      { id: 11, text: "I can retrace my steps to find something I've misplaced." },
      { id: 12, text: "I learn new vocabulary or terms quickly and retain them." },
      { id: 13, text: "I can recall directions to places I've visited only once." },
      { id: 14, text: "I remember faces well, even of people I've only met briefly." },
    ],
    results: [
      { label: "Needs Strengthening", description: "Your memory could benefit from active training. Try mnemonic techniques, better sleep, and memory exercises.", color: "hsl(30 90% 55%)", minScore: 0, tips: ["Use the 'memory palace' technique — associate items with locations in a familiar place", "Prioritize 7-8 hours of sleep — memory consolidation happens during deep sleep", "Repeat new information aloud within 30 seconds of hearing it"] },
      { label: "Average Memory", description: "Your memory is within the typical range. Spaced repetition and regular brain exercises could sharpen it further.", color: "hsl(45 95% 50%)", minScore: 28, tips: ["Try spaced repetition apps like Anki for things you want to remember", "Create mental associations — link new info to something you already know", "Stay physically active — exercise boosts hippocampal function"] },
      { label: "Above Average", description: "You have a strong memory that serves you well in daily life. Keep challenging it with new learning.", color: "hsl(220 70% 45%)", minScore: 45, tips: ["Learn a new language or instrument to push your memory further", "Teach others what you learn — it strengthens your own recall", "Try dual-n-back games to keep your working memory sharp"] },
      { label: "Exceptional Memory", description: "Your recall ability is outstanding. You retain and retrieve information with remarkable ease.", color: "hsl(160 60% 45%)", minScore: 56, tips: ["Challenge yourself with advanced memorization — decks of cards, long number sequences", "Use your memory gift in competitive quizzing or trivia", "Journal interesting memories to preserve details you naturally capture"] },
    ],
  },
];
