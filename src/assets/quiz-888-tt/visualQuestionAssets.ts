export type VisualQuestionAssets = { question: string; answers: string[] };

const VISUAL_QUESTION_NUMBERS = [
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
  25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36,
];
const PRELOAD_BATCH_SIZE = 14;
const preloadPromises = new Map<string, Promise<void>>();
let preloadAllPromise: Promise<void> | null = null;

const getUrl = (questionNumber: number, filename: string) => `/puzzles-888-tt/q${questionNumber}/${filename}.svg`;

export const getVisualQuestionAssets = (questionNumber: number, correctAnswer: number): VisualQuestionAssets | null => {
  const question = getUrl(questionNumber, 'problem');
  const correct = getUrl(questionNumber, 'correctanswer');
  const incorrect = Array.from({ length: 5 }, (_, index) => getUrl(questionNumber, `answer${index + 1}`));
  const answers = [...incorrect];
  answers.splice(Math.max(0, Math.min(correctAnswer, answers.length)), 0, correct);
  return { question, answers };
};

const preloadImage = (src: string) => {
  const existing = preloadPromises.get(src);
  if (existing) return existing;
  const promise = new Promise<void>(resolve => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = src;
  });
  preloadPromises.set(src, promise);
  return promise;
};

export const preloadVisualQuestion = (questionNumber: number, correctAnswer: number) => {
  const assets = getVisualQuestionAssets(questionNumber, correctAnswer);
  if (!assets) return;
  [assets.question, ...assets.answers].forEach(src => void preloadImage(src));
};

export const preloadAllVisualQuestions = () => {
  if (preloadAllPromise) return preloadAllPromise;
  const urls = VISUAL_QUESTION_NUMBERS.flatMap(questionNumber => {
    const assets = getVisualQuestionAssets(questionNumber, 0);
    return assets ? [assets.question, ...assets.answers] : [];
  });
  preloadAllPromise = (async () => {
    for (let index = 0; index < urls.length; index += PRELOAD_BATCH_SIZE) {
      await Promise.all(urls.slice(index, index + PRELOAD_BATCH_SIZE).map(preloadImage));
    }
  })();
  return preloadAllPromise;
};
