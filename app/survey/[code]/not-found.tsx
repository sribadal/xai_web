export default function SurveyNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-md px-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Survey page not found
        </h1>
        <p className="text-muted-foreground">
          This survey page doesn't exist or hasn't been set up yet.
          Please check the link you were given by the researcher.
        </p>
      </div>
    </div>
  )
}