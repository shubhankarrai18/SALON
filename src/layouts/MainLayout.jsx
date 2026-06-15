export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      <main>{children}</main>
    </div>
  )
}
