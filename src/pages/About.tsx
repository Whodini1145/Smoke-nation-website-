import interior from '../assets/interior.jpg';
import flowerJars from '../assets/flower-jars.jpg';
import { useDB } from '../data/store';
import { VisitBlock } from './Home';

export default function About() {
  const { settings } = useDB();
  return (
    <>
      <div className="wrap page about">
        <h1 className="h-display about-title">{settings.aboutTitle}</h1>
        <div className="about-grid">
          <div className="about-text">
            {settings.aboutBody.split(/\n\s*\n/).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          <div className="about-photos">
            <img src={interior} alt="Inside the shop: green walls, glass shelves of pieces and products, flower jars under the counter" loading="lazy" />
            <img src={flowerJars} alt="Glass jars of THCA flower in the display case" loading="lazy" />
          </div>
        </div>
      </div>
      <VisitBlock />
    </>
  );
}
