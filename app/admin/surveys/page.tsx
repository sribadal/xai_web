import { getSurveys, getLocales } from "../actions"
import { SurveyList } from "./survey-list"

export default async function SurveysPage() {
  const [surveys, locales] = await Promise.all([getSurveys(), getLocales()])
  return <SurveyList surveys={surveys} locales={locales} />
}