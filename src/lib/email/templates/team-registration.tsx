import { Column, Heading, Row, Section, Text } from "@react-email/components";
import { EnsembleLayout } from "./ensemble-layout";

interface TeamRegistrationEmailProps {
  contactName: string;
  submissionDate?: string;
  teamName: string;
}

export const TeamRegistrationEmail = ({
  contactName = "User",
  teamName = "Voyager Operations",
  submissionDate = new Date().toLocaleDateString(),
}: TeamRegistrationEmailProps) => {
  const previewText = `Team Registration Received for ${teamName}`;

  return (
    <EnsembleLayout preview={previewText}>
      <Section className="mt-[20px]">
        <div className="mb-6 h-2 w-full rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600" />
        <Heading className="mx-0 my-[10px] p-0 font-bold text-[24px] text-gray-900">
          Registration Received
        </Heading>
        <Text className="text-[16px] text-gray-700 leading-[24px]">
          Dear <strong>{contactName}</strong>,
        </Text>
        <Text className="text-[16px] text-gray-700 leading-[24px]">
          Thank you for submitting your team registration request. We have
          received your application and it is currently being reviewed by our
          operations team.
        </Text>

        <Section className="my-6 rounded border-blue-500 border-l-4 bg-slate-50 p-6">
          <Text className="m-0 mb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">
            Registration Details
          </Text>
          <Row className="mb-2">
            <Column className="w-[120px]">
              <Text className="m-0 font-semibold text-slate-700">
                Team Name:
              </Text>
            </Column>
            <Column>
              <Text className="m-0 text-slate-900">{teamName}</Text>
            </Column>
          </Row>
          <Row>
            <Column className="w-[120px]">
              <Text className="m-0 font-semibold text-slate-700">
                Submitted On:
              </Text>
            </Column>
            <Column>
              <Text className="m-0 text-slate-900">{submissionDate}</Text>
            </Column>
          </Row>
        </Section>

        <Text className="text-[16px] text-gray-700 leading-[24px]">
          You will receive a confirmation email once your team has been
          approved. In the meantime, no further action is required on your part.
        </Text>

        <Text className="mt-[30px] text-[16px] text-gray-700 leading-[24px]">
          Best regards,
          <br />
          <strong>The Ensemble Team</strong>
        </Text>
      </Section>
    </EnsembleLayout>
  );
};

export default TeamRegistrationEmail;
