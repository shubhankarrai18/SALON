import heroImage from './assets/hero.png'
import content from './data/content.json'

const GALLERY_GRADIENTS = [
  'from-stone-800 via-stone-700 to-stone-900',
  'from-neutral-700 via-stone-800 to-neutral-900',
  'from-zinc-800 via-neutral-800 to-zinc-900',
  'from-stone-900 via-zinc-800 to-stone-800',
  'from-neutral-800 via-stone-900 to-neutral-900',
  'from-zinc-900 via-stone-800 to-zinc-800',
]

function formatPrice(price) {
  return `${content.currencySymbol}${price}`
}

function Navigation() {
  const { salonName, navigation } = content

  const links = [
    { href: '#services', label: navigation.services },
    { href: '#gallery', label: navigation.gallery },
    { href: '#contact', label: navigation.contact },
  ]

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-stone-200/60 bg-cream/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <a
          href="#"
          className="font-display text-xl font-semibold tracking-wide text-charcoal lg:text-2xl"
        >
          {salonName}
        </a>

        <ul className="hidden items-center gap-10 md:flex">
          {links.map(({ href, label }) => (
            <li key={href}>
              <a
                href={href}
                className="text-sm font-medium tracking-widest text-stone-600 uppercase transition-colors duration-300 hover:text-gold"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#contact"
          className="rounded-none border border-charcoal bg-charcoal px-5 py-2.5 text-xs font-medium tracking-widest text-cream uppercase transition-all duration-300 hover:bg-transparent hover:text-charcoal"
        >
          {navigation.cta}
        </a>
      </nav>
    </header>
  )
}

function Hero() {
  const { heroTitle, heroSubtitle, heroCta } = content

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-linear-to-b from-charcoal/70 via-charcoal/50 to-charcoal/80" />

      <div className="relative z-10 mx-auto max-w-4xl px-6 pt-24 text-center">
        <div className="mb-6 inline-block border border-gold/40 px-4 py-1.5">
          <span className="text-xs font-medium tracking-[0.3em] text-gold-light uppercase">
            {content.salonName}
          </span>
        </div>

        <h1 className="font-display text-5xl leading-tight font-medium tracking-tight text-white sm:text-6xl lg:text-7xl">
          {heroTitle}
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed font-light text-stone-300 sm:text-xl">
          {heroSubtitle}
        </p>

        <a
          href="#contact"
          className="mt-10 inline-block border border-gold bg-gold px-10 py-4 text-sm font-medium tracking-widest text-charcoal uppercase transition-all duration-300 hover:bg-transparent hover:text-gold"
        >
          {heroCta}
        </a>
      </div>

      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 animate-bounce">
        <a href="#services" aria-label={content.navigation.services}>
          <svg
            className="h-6 w-6 text-gold/70"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </a>
      </div>
    </section>
  )
}

function SectionHeader({ eyebrow, title, description }) {
  return (
    <div className="mx-auto mb-16 max-w-2xl text-center">
      <p className="mb-3 text-xs font-medium tracking-[0.3em] text-gold uppercase">
        {eyebrow}
      </p>
      <h2 className="font-display text-4xl font-medium tracking-tight text-charcoal sm:text-5xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-relaxed text-stone-600">{description}</p>
    </div>
  )
}

function Services() {
  const { sections, services } = content

  return (
    <section id="services" className="bg-white py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeader
          eyebrow={sections.services.eyebrow}
          title={sections.services.title}
          description={sections.services.description}
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <article
              key={service.id}
              className="group relative border border-stone-200 bg-cream p-8 transition-all duration-500 hover:border-gold/40 hover:shadow-xl hover:shadow-stone-200/50"
            >
              <span className="font-display text-5xl font-light text-stone-200 transition-colors duration-500 group-hover:text-gold/30">
                {String(index + 1).padStart(2, '0')}
              </span>

              <h3 className="mt-4 font-display text-2xl font-medium text-charcoal">
                {service.name}
              </h3>

              <p className="mt-3 text-sm leading-relaxed text-stone-600">
                {service.description}
              </p>

              <div className="mt-6 flex items-center justify-between border-t border-stone-200 pt-6">
                <span className="font-display text-2xl font-medium text-gold">
                  {formatPrice(service.price)}
                </span>
                <a
                  href="#contact"
                  className="text-xs font-medium tracking-widest text-stone-500 uppercase transition-colors duration-300 group-hover:text-charcoal"
                >
                  {content.navigation.cta}
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function Gallery() {
  const { sections, galleryItems } = content

  return (
    <section id="gallery" className="bg-charcoal py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 text-xs font-medium tracking-[0.3em] text-gold uppercase">
            {sections.gallery.eyebrow}
          </p>
          <h2 className="font-display text-4xl font-medium tracking-tight text-white sm:text-5xl">
            {sections.gallery.title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-stone-400">
            {sections.gallery.description}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {galleryItems.map((item, index) => (
            <figure
              key={item.id}
              className={`group relative aspect-square overflow-hidden bg-linear-to-br ${GALLERY_GRADIENTS[index % GALLERY_GRADIENTS.length]}`}
            >
              <div className="absolute inset-0 flex items-center justify-center opacity-30">
                <svg
                  className="h-12 w-12 text-stone-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={0.75}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>

              <figcaption className="absolute inset-x-0 bottom-0 translate-y-full bg-linear-to-t from-black/80 to-transparent p-4 transition-transform duration-500 group-hover:translate-y-0">
                <p className="text-sm font-medium tracking-wide text-white">{item.caption}</p>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-stone-500">{sections.gallery.instagramLabel}</p>
          <a
            href="#"
            className="mt-1 inline-block font-display text-xl text-gold transition-colors duration-300 hover:text-gold-light"
          >
            {sections.gallery.instagramHandle}
          </a>
        </div>
      </div>
    </section>
  )
}

function Contact() {
  const { sections, businessHours, phone, address } = content

  return (
    <section id="contact" className="bg-cream py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeader
          eyebrow={sections.contact.eyebrow}
          title={sections.contact.title}
          description={sections.contact.description}
        />

        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-10">
            <div>
              <h3 className="mb-4 text-xs font-medium tracking-[0.3em] text-gold uppercase">
                {sections.contact.hoursHeading}
              </h3>
              <ul className="space-y-3">
                {businessHours.map(({ day, hours }) => (
                  <li
                    key={day}
                    className="flex items-center justify-between border-b border-stone-200 py-3 text-sm"
                  >
                    <span className="font-medium text-charcoal">{day}</span>
                    <span className="text-stone-600">{hours}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-10">
            <div>
              <h3 className="mb-4 text-xs font-medium tracking-[0.3em] text-gold uppercase">
                {sections.contact.phoneHeading}
              </h3>
              <a
                href={`tel:${phone.replace(/\D/g, '')}`}
                className="font-display text-3xl font-medium text-charcoal transition-colors duration-300 hover:text-gold"
              >
                {phone}
              </a>
            </div>

            <div>
              <h3 className="mb-4 text-xs font-medium tracking-[0.3em] text-gold uppercase">
                {sections.contact.addressHeading}
              </h3>
              <address className="text-lg leading-relaxed text-stone-600 not-italic">
                {address}
              </address>
            </div>

            <a
              href={`tel:${phone.replace(/\D/g, '')}`}
              className="inline-block w-full border border-charcoal bg-charcoal px-8 py-4 text-center text-sm font-medium tracking-widest text-cream uppercase transition-all duration-300 hover:bg-transparent hover:text-charcoal sm:w-auto"
            >
              {content.heroCta}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  const { salonName, footer } = content
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-stone-200 bg-white py-12">
      <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
        <p className="font-display text-2xl font-medium text-charcoal">{salonName}</p>
        <p className="mt-2 text-sm text-stone-500">{footer.tagline}</p>
        <p className="mt-6 text-xs tracking-wider text-stone-400 uppercase">
          &copy; {year} {salonName}. {footer.rights}
        </p>
      </div>
    </footer>
  )
}

function App() {
  return (
    <>
      <Navigation />
      <main>
        <Hero />
        <Services />
        <Gallery />
        <Contact />
      </main>
      <Footer />
    </>
  )
}

export default App
