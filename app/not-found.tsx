import Link from "next/link"

export default function GlobalNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-md px-6">
        <h1 className="text-4xl font-bold text-foreground">404</h1>
        <p className="text-muted-foreground text-lg">
          This page doesn't exist.
        </p>
        <Link
          href="/"
          className="inline-block mt-4 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Go to homepage
        </Link>
      </div>
    </div>
  )
}