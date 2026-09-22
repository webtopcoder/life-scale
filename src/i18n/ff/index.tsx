import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Question } from '@/types/funnel';

/**
 * FF (fast-funnel) EN/ES/PT i18n module.
 * Adapted from the source multilingual funnel.
 * Per-question-id localized copy was dropped (source dataset ids do not
 * match this project's question set) — questions localize via generic
 * prompt/option string translation instead.
 */

export type FFLocale = 'en' | 'es' | 'pt';

const STORAGE_KEY = 'onboarding_ff_language';
const LOCALE_TAGS: Record<FFLocale, string> = { en: 'en-US', es: 'es', pt: 'pt-BR' };

const copy = {
  es: {
    'HOW HIGH IS YOUR IQ?': '¿QUÉ TAN ALTO ES TU IQ?',
    '27 questions that get harder as you go': '27 preguntas que aumentan de dificultad',
    'Pick the correct answer from 6 options': 'Elige la respuesta correcta entre 6 opciones',
    'Skip any question and come back to it later': 'Salta cualquier pregunta y vuelve después',
    Male: 'Hombre', Female: 'Mujer', "Today's highest IQ score: {score}": 'IQ más alto de hoy: {score}',
    'Choose your answer:': 'Elige tu respuesta:', 'Question {number} skipped': 'Pregunta {number} omitida',
    '{current} of {total}': '{current} de {total}', Continue: 'Continuar', You: 'Tú', Low: 'Bajo', Average: 'Promedio', High: 'Alto',
    'Strongly Disagree': 'Totalmente en desacuerdo', Disagree: 'En desacuerdo', Neutral: 'Neutral', Agree: 'De acuerdo', 'Strongly Agree': 'Totalmente de acuerdo',
    'Speed Is In The Top 88%': 'Tu velocidad está en el 12% superior', 'Your response time is impressive. Keep it up!': 'Tu tiempo de respuesta es impresionante. ¡Sigue así!',
    'Strongest Area So Far': 'Tu área más fuerte hasta ahora', 'You may have other cognitive strengths. Finish the test to see your full profile.': 'Puedes tener otras fortalezas cognitivas. Termina el test para ver tu perfil completo.',
    Logic: 'Lógica', Pattern: 'Patrones', Spatial: 'Espacial', Speed: 'Velocidad', Self: 'Personal',
    'Your Profile Is Unique...': 'Tu perfil es único...', 'Income potential: Top 1%': 'Potencial de ingresos: 1% superior',
    'You think twice, even when right the first time': 'Piensas dos veces, incluso cuando aciertas a la primera', 'Others struggle to understand you in (1) key area': 'A otros les cuesta entenderte en (1) área clave',
    'Full breakdown available in your personalized report': 'Desglose completo disponible en tu informe personalizado', 'Just 3 Questions Left\n': 'Solo quedan 3 preguntas\n',
    'Finish strong to see your complete results.': 'Termina con fuerza para ver tus resultados completos.',
    '50 Million+ people': 'Más de 50 millones de personas', 'have discovered their IQ score': 'han descubierto su puntuación de IQ',
    '{count} users': '{count} usuarios', 'took their IQ test today.': 'hicieron hoy su test de IQ.', 'Trusted by over': 'Con la confianza de más de', '50 million': '50 millones', 'people.': 'de personas.',
    'Calculating Your Results': 'Calculando tus resultados', 'Please wait while we analyze your performance…': 'Espera mientras analizamos tu rendimiento…',
    'Analyzing responses…': 'Analizando respuestas…', 'Evaluating pattern recognition…': 'Evaluando reconocimiento de patrones…', 'Mapping cognitive strengths…': 'Identificando fortalezas cognitivas…', 'Comparing against dataset…': 'Comparando con nuestra base de datos…', 'Finalizing your report…': 'Finalizando tu informe…',
    '{count} records analyzed': '{count} registros analizados', 'Do you enjoy challenging your mind?': '¿Disfrutas desafiando tu mente?', 'Are you a curious person?': '¿Eres una persona curiosa?', No: 'No', Yes: 'Sí',
    Warning: 'Aviso', 'Your results may surprise you. IQ report reveals hidden strengths and growth areas — a powerful tool for unlocking your potential.': 'Tus resultados pueden sorprenderte. El informe revela fortalezas ocultas y áreas de crecimiento para ayudarte a alcanzar tu potencial.',
    'Your results remain confidential and personally yours.': 'Tus resultados son confidenciales y solo tuyos.', 'I Understand': 'ENTIENDO',
    'Your Full IQ Report Is Ready': 'Tu informe completo de IQ está listo', 'Where Should We Send': '¿Dónde debemos enviar', 'Your IQ Report': 'tu informe de IQ', Email: 'Correo electrónico',
    'Please enter a valid email address': 'Introduce un correo electrónico válido', Time: 'Tiempo', Accuracy: 'Precisión', 'Faster Than': 'Más rápido que', "What you'll unlock": 'Lo que desbloquearás',
    'Your full brain breakdown': 'Tu análisis cerebral completo', 'What your brain does best': 'Lo que tu cerebro hace mejor', 'How you see money': 'Cómo ves el dinero', 'How you see the world': 'Cómo ves el mundo', 'How you learn fastest': 'Cómo aprendes más rápido', 'How you make decisions': 'Cómo tomas decisiones',
    'Results expire in': 'Tus resultados vencen en', '{count} people': '{count} personas', 'are viewing their results right now': 'están viendo sus resultados ahora',
    'IQ Score Report': 'Informe de IQ', 'Offer ends in': 'La oferta termina en', 'just claimed their full report': 'acaba de obtener su informe completo',
    Congratulations: 'Felicidades', 'Your IQ Score Is Ready!': '¡Tu puntuación de IQ está lista!', 'Get My IQ Score Now': 'Ver mi puntuación de IQ', 'Unlock Your Full IQ Report': 'Desbloquea tu informe completo de IQ', "What you'll get:": 'Lo que recibirás:',
    'Your exact IQ score and report': 'Tu puntuación exacta de IQ y tu informe', 'Where you rank compared to your peers': 'Tu posición comparada con personas similares', 'Your intelligence strengths and weaknesses': 'Tus fortalezas y debilidades cognitivas', 'Personalized insights based on your results': 'Recomendaciones personalizadas según tus resultados',
    'Exclusive one-time discount applied': 'Descuento exclusivo aplicado', '{percent}% off on your report!': '¡{percent}% de descuento en tu informe!', 'Due today:': 'Total hoy:', 'Try again': 'Intentar de nuevo', '30-Day Money-Back Guarantee': 'Garantía de devolución de 30 días',
    'Over 17,000 tests taken today': 'Más de 17.000 tests realizados hoy', 'Average IQ: 108': 'IQ promedio: 108', 'based on 14,200+ reviews': 'basado en más de 14.200 opiniones', 'Why People Trust Us': 'Por qué confían en nosotros',
    'Proven IQ Test': 'Test de IQ comprobado', 'Used by over 50 million people worldwide.': 'Utilizado por más de 50 millones de personas.', 'Full Personal Report': 'Informe personal completo', '20+ pages about your brain — strengths, weaknesses, and tips.': 'Más de 20 páginas sobre tus fortalezas, debilidades y consejos.', 'Brain Training Included': 'Entrenamiento cerebral incluido', 'Simple daily exercises to sharpen your mind.': 'Ejercicios diarios sencillos para agudizar tu mente.',
    'Sneak Peek at Your Report': 'Vista previa de tu informe', 'Unlock your full report to see everything': 'Desbloquea tu informe completo para verlo todo', 'Unlock Full Report': 'Desbloquear informe', "What You'll Discover": 'Lo que descubrirás', "You'll Learn How To": 'Aprenderás a',
    'Think sharper every day': 'Pensar con más claridad cada día', 'Use your natural strengths': 'Usar tus fortalezas naturales', 'Remember more and forget less': 'Recordar más y olvidar menos', 'Make better decisions faster': 'Tomar mejores decisiones más rápido', 'What People Are Saying': 'Lo que dicen las personas',
    'Common Questions': 'Preguntas frecuentes', 'Quick answers before you get started.': 'Respuestas rápidas antes de empezar.', 'Is this test accurate?': '¿Este test es preciso?', 'Can I cancel anytime?': '¿Puedo cancelar cuando quiera?', "What's in my report?": '¿Qué incluye mi informe?', 'What happens after 7 days?': '¿Qué pasa después de 7 días?',
    'Yes — our test is based on proven methods used by professionals. It gives you a reliable picture of how your brain works.': 'Sí. Nuestro test se basa en métodos comprobados utilizados por profesionales y ofrece una visión fiable de cómo funciona tu mente.', 'Yes, cancel whenever you want. No fees, no questions asked.': 'Sí, cancela cuando quieras. Sin cargos ni preguntas.', 'Your IQ score, how you rank against others, a breakdown of 5 brain areas, career suggestions, and tips to get smarter.': 'Tu puntuación de IQ, tu posición frente a otros, un análisis de 5 áreas cognitivas, sugerencias profesionales y consejos para mejorar.',
    "Your 7-day trial is {price}. After that, it's {monthly}. You can cancel anytime before the trial ends to avoid further charges.": 'Tu prueba de 7 días cuesta {price}. Después cuesta {monthly}. Cancela antes de que termine la prueba para evitar cargos adicionales.',
    'Your results hint at remarkable cognitive strengths and hidden potential. Early indicators suggest you rank among top performers in key areas — your logic and pattern recognition abilities stand out as truly impressive.': 'Tus resultados señalan fortalezas cognitivas notables y potencial oculto. Los primeros indicadores te sitúan entre quienes mejor rinden en áreas clave, especialmente lógica y reconocimiento de patrones.',
    'Overall IQ Score: 1██': 'Puntuación general de IQ: 1██', "Your brain shows strong results in pattern recognition and logic. You scored in the ██th percentile, ahead of ██% of people...": 'Tu mente muestra resultados sólidos en reconocimiento de patrones y lógica. Superaste al ██% de las personas...', "Based on your results, you'd do well in careers like ████████, ██████████, and ████████████...": 'Según tus resultados, podrías destacar en carreras como ████████, ██████████ y ████████████...',
    'It helped me understand myself better!': '¡Me ayudó a entenderme mejor!', 'Surprisingly accurate results': 'Resultados sorprendentemente precisos', 'A real eye-opener': 'Una verdadera revelación', 'Better than I expected': 'Mejor de lo que esperaba', 'Fascinating cognitive breakdown': 'Un análisis cognitivo fascinante',
    "I'm really glad I took this test! It highlighted things about my thinking I never noticed before. The results felt accurate and gave me a fresh view of my strengths.": '¡Me alegra mucho haber hecho este test! Reveló aspectos de mi forma de pensar que nunca había notado. Los resultados parecieron precisos y me dieron una nueva perspectiva sobre mis fortalezas.',
    'I was skeptical at first, but the cognitive profile was spot on. It pinpointed areas where I excel and where I could improve. Highly recommend it.': 'Al principio tenía dudas, pero el perfil cognitivo acertó por completo. Identificó en qué destaco y qué puedo mejorar. Lo recomiendo mucho.',
    "The detailed breakdown of my cognitive strengths was fascinating. I've shared this with friends and they all found it equally insightful.": 'El análisis detallado de mis fortalezas cognitivas fue fascinante. Lo compartí con mis amigos y a todos les resultó igual de revelador.',
    "I've tried other IQ tests online but this one actually felt scientific. The category breakdown was really helpful and the results matched my self-assessment.": 'He probado otros tests de IQ en internet, pero este realmente pareció científico. El análisis por categorías fue muy útil y los resultados coincidieron con mi propia percepción.',
    "What impressed me most was how detailed the report was. It didn't just give a number — it showed where my strengths lie and areas I can work on.": 'Lo que más me impresionó fue el nivel de detalle del informe. No se limitó a darme un número: mostró mis fortalezas y las áreas que puedo mejorar.',
    'We could not load the payment form. Please try again.': 'No pudimos cargar el formulario de pago. Inténtalo de nuevo.',
  },
  pt: {
    'HOW HIGH IS YOUR IQ?': 'QUAL É O SEU NÍVEL DE IQ?',
    '27 questions that get harder as you go': '27 perguntas que ficam mais difíceis', 'Pick the correct answer from 6 options': 'Escolha a resposta correta entre 6 opções', 'Skip any question and come back to it later': 'Pule qualquer pergunta e volte depois',
    Male: 'Homem', Female: 'Mulher', "Today's highest IQ score: {score}": 'Maior pontuação de IQ hoje: {score}', 'Choose your answer:': 'Escolha sua resposta:', 'Question {number} skipped': 'Pergunta {number} pulada', '{current} of {total}': '{current} de {total}', Continue: 'Continuar', You: 'Você', Low: 'Baixo', Average: 'Médio', High: 'Alto',
    'Strongly Disagree': 'Discordo totalmente', Disagree: 'Discordo', Neutral: 'Neutro', Agree: 'Concordo', 'Strongly Agree': 'Concordo totalmente',
    'Speed Is In The Top 88%': 'Sua velocidade está entre as 12% melhores', 'Your response time is impressive. Keep it up!': 'Seu tempo de resposta é impressionante. Continue assim!', 'Strongest Area So Far': 'Sua área mais forte até agora', 'You may have other cognitive strengths. Finish the test to see your full profile.': 'Você pode ter outras forças cognitivas. Termine o teste para ver seu perfil completo.',
    Logic: 'Lógica', Pattern: 'Padrões', Spatial: 'Espacial', Speed: 'Velocidade', Self: 'Pessoal', 'Your Profile Is Unique...': 'Seu perfil é único...', 'Income potential: Top 1%': 'Potencial de renda: 1% superior', 'You think twice, even when right the first time': 'Você pensa duas vezes, mesmo acertando de primeira', 'Others struggle to understand you in (1) key area': 'As pessoas têm dificuldade para entender você em (1) área-chave', 'Full breakdown available in your personalized report': 'Análise completa disponível no seu relatório personalizado', 'Just 3 Questions Left\n': 'Faltam apenas 3 perguntas\n', 'Finish strong to see your complete results.': 'Termine com força para ver seus resultados completos.',
    '50 Million+ people': 'Mais de 50 milhões de pessoas', 'have discovered their IQ score': 'descobriram sua pontuação de IQ', '{count} users': '{count} usuários', 'took their IQ test today.': 'fizeram hoje seu teste de IQ.', 'Trusted by over': 'Com a confiança de mais de', '50 million': '50 milhões', 'people.': 'de pessoas.',
    'Calculating Your Results': 'Calculando seus resultados', 'Please wait while we analyze your performance…': 'Aguarde enquanto analisamos seu desempenho…', 'Analyzing responses…': 'Analisando respostas…', 'Evaluating pattern recognition…': 'Avaliando reconhecimento de padrões…', 'Mapping cognitive strengths…': 'Mapeando forças cognitivas…', 'Comparing against dataset…': 'Comparando com nossa base de dados…', 'Finalizing your report…': 'Finalizando seu relatório…', '{count} records analyzed': '{count} registros analisados', 'Do you enjoy challenging your mind?': 'Você gosta de desafiar sua mente?', 'Are you a curious person?': 'Você é uma pessoa curiosa?', No: 'Não', Yes: 'Sim', Warning: 'Aviso',
    'Your results may surprise you. IQ report reveals hidden strengths and growth areas — a powerful tool for unlocking your potential.': 'Seus resultados podem surpreender. O relatório revela forças ocultas e áreas de evolução para liberar seu potencial.', 'Your results remain confidential and personally yours.': 'Seus resultados são confidenciais e somente seus.', 'I Understand': 'ENTENDI',
    'Your Full IQ Report Is Ready': 'Seu relatório completo de IQ está pronto', 'Where Should We Send': 'Onde devemos enviar', 'Your IQ Report': 'seu relatório de IQ', Email: 'E-mail', 'Please enter a valid email address': 'Digite um e-mail válido', Time: 'Tempo', Accuracy: 'Precisão', 'Faster Than': 'Mais rápido que', "What you'll unlock": 'O que você vai desbloquear',
    'Your full brain breakdown': 'Sua análise cerebral completa', 'What your brain does best': 'O que seu cérebro faz melhor', 'How you see money': 'Como você vê o dinheiro', 'How you see the world': 'Como você vê o mundo', 'How you learn fastest': 'Como você aprende mais rápido', 'How you make decisions': 'Como você toma decisões', 'Results expire in': 'Seus resultados expiram em', '{count} people': '{count} pessoas', 'are viewing their results right now': 'estão vendo seus resultados agora',
    'IQ Score Report': 'Relatório de IQ', 'Offer ends in': 'A oferta termina em', 'just claimed their full report': 'acabou de liberar o relatório completo', Congratulations: 'Parabéns', 'Your IQ Score Is Ready!': 'Sua pontuação de IQ está pronta!', 'Get My IQ Score Now': 'Ver minha pontuação de IQ', 'Unlock Your Full IQ Report': 'Desbloqueie seu relatório completo de IQ', "What you'll get:": 'O que você receberá:',
    'Your exact IQ score and report': 'Sua pontuação exata de IQ e relatório', 'Where you rank compared to your peers': 'Sua posição comparada a pessoas semelhantes', 'Your intelligence strengths and weaknesses': 'Seus pontos fortes e fracos cognitivos', 'Personalized insights based on your results': 'Insights personalizados com base nos seus resultados', 'Exclusive one-time discount applied': 'Desconto exclusivo aplicado', '{percent}% off on your report!': '{percent}% de desconto no seu relatório!', 'Due today:': 'Total hoje:', 'Try again': 'Tentar novamente', '30-Day Money-Back Guarantee': 'Garantia de reembolso de 30 dias',
    'Over 17,000 tests taken today': 'Mais de 17.000 testes feitos hoje', 'Average IQ: 108': 'IQ médio: 108', 'based on 14,200+ reviews': 'com base em mais de 14.200 avaliações', 'Why People Trust Us': 'Por que as pessoas confiam em nós', 'Proven IQ Test': 'Teste de IQ comprovado', 'Used by over 50 million people worldwide.': 'Usado por mais de 50 milhões de pessoas.', 'Full Personal Report': 'Relatório pessoal completo', '20+ pages about your brain — strengths, weaknesses, and tips.': 'Mais de 20 páginas sobre seus pontos fortes, fracos e dicas.', 'Brain Training Included': 'Treino cerebral incluído', 'Simple daily exercises to sharpen your mind.': 'Exercícios diários simples para aguçar sua mente.',
    'Sneak Peek at Your Report': 'Prévia do seu relatório', 'Unlock your full report to see everything': 'Desbloqueie seu relatório completo para ver tudo', 'Unlock Full Report': 'Desbloquear relatório', "What You'll Discover": 'O que você vai descobrir', "You'll Learn How To": 'Você aprenderá a', 'Think sharper every day': 'Pensar com mais clareza todos os dias', 'Use your natural strengths': 'Usar seus pontos fortes naturais', 'Remember more and forget less': 'Lembrar mais e esquecer menos', 'Make better decisions faster': 'Tomar decisões melhores mais rápido', 'What People Are Saying': 'O que as pessoas dizem', 'Common Questions': 'Perguntas frequentes', 'Quick answers before you get started.': 'Respostas rápidas antes de começar.', 'Is this test accurate?': 'Este teste é preciso?', 'Can I cancel anytime?': 'Posso cancelar quando quiser?', "What's in my report?": 'O que há no meu relatório?', 'What happens after 7 days?': 'O que acontece depois de 7 dias?',
    'Yes — our test is based on proven methods used by professionals. It gives you a reliable picture of how your brain works.': 'Sim. Nosso teste se baseia em métodos comprovados usados por profissionais e oferece uma visão confiável de como sua mente funciona.', 'Yes, cancel whenever you want. No fees, no questions asked.': 'Sim, cancele quando quiser. Sem taxas e sem perguntas.', 'Your IQ score, how you rank against others, a breakdown of 5 brain areas, career suggestions, and tips to get smarter.': 'Sua pontuação de IQ, sua posição em relação aos outros, uma análise de 5 áreas cognitivas, sugestões de carreira e dicas para evoluir.',
    "Your 7-day trial is {price}. After that, it's {monthly}. You can cancel anytime before the trial ends to avoid further charges.": 'Sua avaliação de 7 dias custa {price}. Depois, o valor é {monthly}. Cancele antes do fim da avaliação para evitar cobranças adicionais.',
    'Your results hint at remarkable cognitive strengths and hidden potential. Early indicators suggest you rank among top performers in key areas — your logic and pattern recognition abilities stand out as truly impressive.': 'Seus resultados indicam forças cognitivas notáveis e potencial oculto. Os primeiros sinais colocam você entre os melhores em áreas-chave, especialmente lógica e reconhecimento de padrões.',
    'Overall IQ Score: 1██': 'Pontuação geral de IQ: 1██', "Your brain shows strong results in pattern recognition and logic. You scored in the ██th percentile, ahead of ██% of people...": 'Sua mente apresenta resultados fortes em reconhecimento de padrões e lógica. Você ficou à frente de ██% das pessoas...', "Based on your results, you'd do well in careers like ████████, ██████████, and ████████████...": 'Com base nos seus resultados, você pode se destacar em carreiras como ████████, ██████████ e ████████████...',
    'It helped me understand myself better!': 'Me ajudou a me entender melhor!', 'Surprisingly accurate results': 'Resultados surpreendentemente precisos', 'A real eye-opener': 'Uma verdadeira descoberta', 'Better than I expected': 'Melhor do que eu esperava', 'Fascinating cognitive breakdown': 'Uma análise cognitiva fascinante',
    "I'm really glad I took this test! It highlighted things about my thinking I never noticed before. The results felt accurate and gave me a fresh view of my strengths.": 'Fico muito feliz por ter feito este teste! Ele mostrou aspectos da minha forma de pensar que eu nunca tinha percebido. Os resultados pareceram precisos e me deram uma nova visão dos meus pontos fortes.',
    'I was skeptical at first, but the cognitive profile was spot on. It pinpointed areas where I excel and where I could improve. Highly recommend it.': 'No início eu estava desconfiado, mas o perfil cognitivo acertou em cheio. Ele mostrou onde me destaco e o que posso melhorar. Recomendo muito.',
    "The detailed breakdown of my cognitive strengths was fascinating. I've shared this with friends and they all found it equally insightful.": 'A análise detalhada dos meus pontos fortes cognitivos foi fascinante. Compartilhei com meus amigos e todos acharam igualmente revelador.',
    "I've tried other IQ tests online but this one actually felt scientific. The category breakdown was really helpful and the results matched my self-assessment.": 'Já fiz outros testes de IQ online, mas este realmente pareceu científico. A análise por categoria foi muito útil e os resultados combinaram com a minha própria percepção.',
    "What impressed me most was how detailed the report was. It didn't just give a number — it showed where my strengths lie and areas I can work on.": 'O que mais me impressionou foi o nível de detalhe do relatório. Ele não mostrou apenas um número: revelou meus pontos fortes e as áreas que posso melhorar.',
    'We could not load the payment form. Please try again.': 'Não foi possível carregar o pagamento. Tente novamente.',
  },
} as const;

type Translate = (key: string, values?: Record<string, string | number>) => string;
type FFContextValue = {
  locale: FFLocale;
  setLocale: (locale: FFLocale) => void;
  t: Translate;
  formatNumber: (value: number) => string;
  localizeQuestion: (question: Question) => Question;
};
const FFContext = createContext<FFContextValue | null>(null);

function validLocale(value: string | null): value is FFLocale {
  return value === 'en' || value === 'es' || value === 'pt';
}

function initialLocale(param: string | null): FFLocale {
  if (validLocale(param)) return param;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (validLocale(saved)) return saved;
  const browser = navigator.language.toLowerCase();
  return browser.startsWith('es') ? 'es' : browser.startsWith('pt') ? 'pt' : 'en';
}

export function FFIntlProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [locale, setLocaleState] = useState<FFLocale>(() => initialLocale(searchParams.get('lang')));

  const setLocale = useCallback((next: FFLocale) => {
    setLocaleState(next);
    localStorage.setItem(STORAGE_KEY, next);
    const params = new URLSearchParams(searchParams);
    params.set('lang', next);
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const previous = document.documentElement.lang;
    document.documentElement.lang = LOCALE_TAGS[locale];
    localStorage.setItem(STORAGE_KEY, locale);
    return () => { document.documentElement.lang = previous; };
  }, [locale]);

  const t = useCallback<Translate>((key, values) => {
    const translated = locale === 'en' ? key : (copy[locale] as Record<string, string>)[key] ?? key;
    return Object.entries(values ?? {}).reduce(
      (result, [name, value]) => result.split(`{${name}}`).join(String(value)),
      translated,
    );
  }, [locale]);

  const localizeQuestion = useCallback((question: Question) => {
    if (locale === 'en') return question;
    const likert = question.type === 'likert' ? question.options.map((option) => t(option)) : undefined;
    return {
      ...question,
      prompt: t(question.prompt),
      options: likert ?? question.options.map((option) => t(option)),
    };
  }, [locale, t]);

  const value = useMemo<FFContextValue>(() => ({
    locale,
    setLocale,
    t,
    formatNumber: (number: number) => number.toLocaleString(LOCALE_TAGS[locale]),
    localizeQuestion,
  }), [locale, setLocale, t, localizeQuestion]);

  return <FFContext.Provider value={value}>{children}</FFContext.Provider>;
}

export function useFFIntl() {
  const value = useContext(FFContext);
  if (!value) throw new Error('useFFIntl must be used inside FFIntlProvider');
  return value;
}

export function FFLanguageSelector() {
  const { locale, setLocale } = useFFIntl();
  return (
    <label className="fixed right-3 top-2 z-[80] rounded-md border border-border bg-card/95 px-2 py-1 shadow-sm backdrop-blur-sm">
      <span className="sr-only">Language</span>
      <select
        aria-label="Language"
        value={locale}
        onChange={(event) => setLocale(event.target.value as FFLocale)}
        className="bg-transparent text-xs font-semibold text-foreground outline-none"
      >
        <option value="en">EN</option>
        <option value="es">ES</option>
        <option value="pt">PT</option>
      </select>
    </label>
  );
}
