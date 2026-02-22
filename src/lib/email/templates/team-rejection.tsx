import { Column, Heading, Row, Section, Text } from "@react-email/components";
import { EnsembleLayout } from "./ensemble-layout";

interface TeamRejectionEmailProps {
  comments?: string;
  contactName: string;
  reviewedBy: string;
  reviewedOn?: string;
  teamName: string;
}

export const TeamRejectionEmail = ({
  contactName = "User",
  teamName = "Voyager Operations",
  reviewedBy = "Admin",
  comments = "Name format incorrect",
  reviewedOn = new Date().toLocaleDateString(),
}: TeamRejectionEmailProps) => {
  const previewText = `❌ Team Registration Not Approved - ${teamName}`;

  return (
    <EnsembleLayout preview={previewText}>
      <Section className="mt-[20px]">
        <div className="mb-6 h-2 w-full rounded-lg bg-gradient-to-r from-red-500 to-rose-600" />
        <Heading className="mx-0 my-[10px] p-0 font-bold text-[24px] text-gray-900">
          Registration Not Approved
        </Heading>
        <Text className="text-[16px] text-gray-700 leading-[24px]">
          Dear <strong>{contactName}</strong>,
        </Text>
        <Text className="text-[16px] text-gray-700 leading-[24px]">
          Thank you for your interest in Ensemble. Unfortunately, your team
          registration request has not been approved at this time.
        </Text>

        <Section className="my-6 rounded border-red-500 border-l-4 bg-slate-50 p-6">
          <Text className="m-0 mb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">
            Request Details
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
          <Row className="mb-2">
            <Column className="w-[120px]">
              <Text className="m-0 font-semibold text-slate-700">
                Reviewed By:
              </Text>
            </Column>
            <Column>
              <Text className="m-0 text-slate-900">{reviewedBy}</Text>
            </Column>
          </Row>
          <Row className={comments ? "mb-2" : ""}>
            <Column className="w-[120px]">
              <Text className="m-0 font-semibold text-slate-700">
                Reviewed On:
              </Text>
            </Column>
            <Column>
              <Text className="m-0 text-slate-900">{reviewedOn}</Text>
            </Column>
          </Row>
          {comments && (
            <Row>
              <Column className="w-[120px]">
                <Text className="m-0 font-semibold text-slate-700">
                  Reason:
                </Text>
              </Column>
              <Column>
                <Text className="m-0 text-slate-900">{comments}</Text>
              </Column>
            </Row>
          )}
        </Section>

        <Text className="text-[16px] text-gray-700 leading-[24px]">
          If you have any questions or would like more information about this
          decision, please reach out to the administrators.
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

export default TeamRejectionEmail;
