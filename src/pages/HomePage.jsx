import { getContent } from '../utils/getContent'

export default function HomePage() {
  const { salonName, heroTitle, heroSubtitle } = getContent()

  return (
    <section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="mb-2 text-sm font-medium uppercase tracking-widest text-gray-500">
        {salonName}
      </p>
      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
        {heroTitle}
      </h1>
      <p className="mt-4 max-w-xl text-lg text-gray-600">{heroSubtitle}</p>
    </section>
  )
}
