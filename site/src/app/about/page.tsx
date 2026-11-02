import type { Metadata } from "next";
import { YouTubeEmbed } from "@/components/about/YouTubeEmbed";
import { Picture } from "@/components/Picture";
import { Button, Container, Link } from "@/components/ui";
import { site } from "@/content/site";
import type { MediaId } from "@/media";
import styles from "./about.module.css";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description:
    "About Austin Van Braeckel, a Software Engineer on the Nexus team at Magnet Forensics who studied Software Engineering (Co-op) at the University of Guelph and loves problem-solving, design, games, music, and film.",
  path: "/about/",
});

const photos: { id: MediaId; caption: string }[] = [
  {
    id: "about-bookshelf",
    caption: "My shelves, which double as my background on work calls",
  },
  {
    id: "about-watches",
    caption:
      "My humble collection so far. I’m saving up for a few really cool pieces!",
  },
];

const interests: { title: string; body: string }[] = [
  {
    title: "Problem-solving",
    body: "Tracking down tricky bugs, and our annual hackathon at work. One of my hackathon projects even became a real customer-facing feature!",
  },
  {
    title: "Mentoring",
    body: "I’ve mentored our co-op students since early in my full-time career, and I love running meetings that help build a healthy, fun team.",
  },
  {
    title: "Graphic design",
    body: "I love making things look clean and polished, right down to the little details.",
  },
  {
    title: "Video games",
    body: "I love playing them, and I’ve made a couple too, including Transient right here on this site!",
  },
  {
    title: "Music",
    body: "I play guitar, and I’ve started producing my own songs too.",
  },
  {
    title: "Manga and comics",
    body: "One Piece, Naruto, Berserk, Invincible, and a whole lot more!",
  },
  {
    title: "Watches",
    body: "The little details, the clever engineering, and the history behind each design.",
  },
  {
    title: "Film",
    body: "I love watching movies and noticing how they were made. I dabble in video editing too!",
  },
  {
    title: "Mathematics",
    body: "My area of application at Guelph, and still one of my favourite subjects.",
  },
];

export default function AboutPage() {
  return (
    <Container className={styles.page}>
      <header className={styles.header}>
        <div className={styles.portrait}>
          <Picture
            id="portrait"
            priority
            sizes="(min-width: 48rem) 14rem, 9rem"
            imgClassName={styles.portraitImg}
          />
        </div>
        <div className={styles.heading}>
          <h1 className={styles.title}>About</h1>
          <p className={styles.lead}>
            Hi! I’m Austin Van Braeckel. These days I’m a Software Engineer on
            the Nexus team at Magnet Forensics, and I love problem-solving,
            design, games, music, and film.
          </p>
        </div>
      </header>

      <div className={styles.body}>
        <section className={styles.prose} aria-labelledby="story">
          <h2 id="story" className="visually-hidden">
            Background
          </h2>
          <p>
            At Magnet, I work on Magnet Nexus. I’m full-stack, with C# and .NET
            on the backend, TypeScript and React on the frontend, and AWS
            services like DynamoDB and Lambda, but frontend work is what I get
            most excited about.
          </p>
          <p>
            I studied Software Engineering (Co-op) at the University of Guelph,
            with an area of application in Mathematics. Besides school and
            co-op, I’ve learned a lot from coding contests, hackathons, and
            online courses from Codecademy, freeCodeCamp, and Khan Academy.
          </p>
          <p>
            Co-op took me to two companies and four different teams. At NCR, I
            spent most of my time investigating and fixing bugs in a banking
            transaction API, and then helped build REST APIs on a Scrum team. At
            Magnet Forensics, I worked on Magnet REVIEW in React and C#, and
            then came back for eight months on the Remote Acquire team for
            Magnet AXIOM Cyber. I wrote about each one under{" "}
            <Link href="/experience/">Experience</Link>, so please feel free to
            take a look! During school, I also worked part-time on the
            university’s Computing and Communications Services student team,
            helping people with IT issues.
          </p>
          <p>
            Outside of work, the project I’m proudest of is still{" "}
            <Link href="/projects/transient/">Transient</Link>, a Java
            platformer I made from scratch. It isn’t easy, but I strongly
            recommend giving it a try!
          </p>
        </section>

        <section className={styles.interests} aria-labelledby="interests">
          <h2 id="interests" className={styles.sectionTitle}>
            What I’m into
          </h2>
          <ul role="list" className={styles.grid}>
            {interests.map((item) => (
              <li key={item.title} className={styles.interest}>
                <h3 className={styles.interestTitle}>{item.title}</h3>
                <p className={styles.interestBody}>{item.body}</p>
              </li>
            ))}
          </ul>
          <div className={styles.photos}>
            {photos.map((photo) => (
              <figure key={photo.id} className={styles.photo}>
                <Picture
                  id={photo.id}
                  sizes="(min-width: 48rem) 34rem, 100vw"
                  imgClassName={styles.photoImg}
                />
                <figcaption className={styles.photoCaption}>
                  {photo.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className={styles.music} aria-labelledby="music">
          <div className={styles.musicText}>
            <h2 id="music" className={styles.sectionTitle}>
              I made a song!
            </h2>
            <p>
              I’ve played guitar for a while, but I was never really into
              performing live. What I wanted to try was producing and recording
              a song myself, so I decided to learn Ableton the best way I know:
              by actually making something with it.
            </p>
            <p>
              That’s how <cite>Cat In The Studio</cite> was born. It’s a fun,
              upbeat, not-so-serious song that I wrote, played, sang, and
              recorded in a single weekend. It isn’t perfect, but that was kind
              of the point. Time-boxing helps me with my perfectionism at work,
              and it meant I actually finished the song instead of tweaking it
              forever.
            </p>
            <p>
              Later on, I storyboarded and directed the music video too (yes,
              that’s me in it). No AI was involved at any point. It’s an
              artisanal song made by me, for fun!
            </p>
          </div>
          <YouTubeEmbed id="MEmqIJStfXQ" title="Cat In The Studio" />
        </section>

        <section className={styles.elsewhere} aria-labelledby="elsewhere">
          <h2 id="elsewhere" className={styles.sectionTitle}>
            Find me online
          </h2>
          <div className={styles.links}>
            <Button href={site.resume.href} newTab icon="document">
              {site.resume.label}
            </Button>
            {site.social.map((link) => (
              <Button
                key={link.href}
                href={link.href}
                variant="tinted"
                icon={link.icon}
              >
                {link.label}
              </Button>
            ))}
            {site.email && (
              <Button
                href={`mailto:${site.email}`}
                variant="plain"
                aria-label={`Email ${site.email}`}
              >
                {site.email}
              </Button>
            )}
          </div>
        </section>
      </div>
    </Container>
  );
}
