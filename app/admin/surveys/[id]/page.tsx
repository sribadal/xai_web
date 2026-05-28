import {
  getSurvey,
  getLocales,
  getTagGroups,
  getAllVignetteCandidates,
} from "../../actions";
import { getSurveyResults } from "../../results-actions";
import { ParticipantsSection, SurveyEditor } from "./survey-editor";
import { SurveyResults } from "./survey-results";
import { notFound } from "next/navigation";

export default async function SurveyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const survey = await getSurvey(id);
  if (!survey) notFound();

  const [locales, tagGroups, patients, results] = await Promise.all([
    getLocales(),
    getTagGroups(),
    getAllVignetteCandidates(),
    getSurveyResults(id),
  ]);

  return (
    <div className="space-y-10">
      <SurveyEditor
        survey={survey}
        locales={locales}
        tagGroups={tagGroups}
        patients={patients}
      />
      <ParticipantsSection
        surveyId={survey.id}
        participants={survey.participants}
      />
      <SurveyResults surveyId={survey.id} results={results} />
    </div>
  );
}