import { getParticipants, getSurveys } from "../actions";
import { ParticipantManager } from "./participant-manager";

export default async function ParticipantsPage() {
  const [participants, surveys] = await Promise.all([
    getParticipants(),
    getSurveys(),
  ]);
  return (
    <ParticipantManager
      participants={participants}
      surveys={surveys.map((s) => ({
        id: s.id,
        translations: s.translations,
      }))}
    />
  );
}