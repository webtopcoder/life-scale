import logoForbes from '@/assets/logos/forbes.svg';
import logoTechCrunch from '@/assets/logos/techcrunch.svg';
import logoWired from '@/assets/logos/wired.svg';
import logoBBC from '@/assets/logos/bbc.svg';
import logoGuardian from '@/assets/logos/theguardian.svg';
import logoBusinessInsider from '@/assets/logos/businessinsider.svg';
import logoPsychologyToday from '@/assets/logos/psychologytoday.svg';

const PUBLICATIONS = [
  { name: 'Forbes', logo: logoForbes },
  { name: 'TechCrunch', logo: logoTechCrunch },
  { name: 'WIRED', logo: logoWired },
  { name: 'BBC', logo: logoBBC },
  { name: 'The Guardian', logo: logoGuardian },
  { name: 'Business Insider', logo: logoBusinessInsider },
  { name: 'Psychology Today', logo: logoPsychologyToday },
];

const LogoBanner = () => (
  <div className="flex animate-scroll-logos gap-12 items-center w-max">
    {[...Array(2)].map((_, setIdx) => (
      <div key={setIdx} className="flex gap-12 items-center">
        {PUBLICATIONS.map((pub) => (
          <img
            key={`${setIdx}-${pub.name}`}
            src={pub.logo}
            alt={pub.name}
            className="h-5 md:h-6 w-auto min-w-[60px] max-w-[120px] object-contain select-none opacity-25 grayscale brightness-0"
          />
        ))}
      </div>
    ))}
  </div>
);

export default LogoBanner;
