/**
 * Guards the contract that the HG report never echoes a choice back bare:
 * every option of every option-based item must carry an authored `reading`.
 */
import { hiddenGeniusQuiz } from '@/data/hiddenGeniusQuiz';
import { answerHighlightsByTrait } from '@/engine/hiddenGeniusScoring';

let fail = 0;
let options = 0;
for (const item of hiddenGeniusQuiz as any[]) {
  if (!item.options) continue;
  for (const o of item.options) {
    options++;
    if (!o.reading || o.reading.trim().length < 40) {
      console.log(`MISSING/THIN reading: ${item.id} -> "${o.label}"`);
      fail++;
    }
    if (o.reading && o.reading.trim() === o.label.trim()) {
      console.log(`ECHO reading: ${item.id} -> "${o.label}"`); fail++;
    }
  }
}
console.log(`options checked: ${options}, without a usable reading: ${fail}`);

// Every highlight the report can render must have a reading + direction.
let bare = 0, checked = 0, withContrast = 0;
for (let i = 0; i < 300; i++) {
  const responses = hiddenGeniusQuiz.map((q: any) => ({
    questionId: q.id, module: 'quiz' as const,
    value: q.options ? q.options[Math.floor(Math.random() * q.options.length)].value
                     : 1 + Math.floor(Math.random() * 5),
  }));
  const hs = answerHighlightsByTrait(responses);
  for (const list of Object.values(hs)) {
    for (const h of list as any[]) {
      checked++;
      if (!h.reading || !h.direction) { bare++; if (bare < 4) console.log('BARE:', h.questionId, h.choice); }
      if (h.contrast) withContrast++;
    }
  }
}
console.log(`highlights rendered: ${checked}, bare: ${bare}, with a contrast line: ${(withContrast/checked*100).toFixed(0)}%`);
console.log(fail === 0 && bare === 0 ? 'PASS' : 'FAIL');
