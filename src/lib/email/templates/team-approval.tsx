import {
  Button,
  Column,
  Heading,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { EnsembleLayout } from "./ensemble-layout";

interface TeamApprovalEmailProps {
  approvedOn?: string;
  comments?: string;
  contactName: string;
  dashboardUrl?: string;
  reviewedBy: string;
  teamName: string;
}

export const TeamApprovalEmail = ({
  contactName = "User",
  teamName = "Voyager Operations",
  reviewedBy = "Admin",
  comments,
  approvedOn = new Date().toLocaleDateString(),
  dashboardUrl = "https://ensemble.amex.com",
}: TeamApprovalEmailProps) => {
  const previewText = `✅ Team Registration Approved - ${teamName}`;

  return (
    <EnsembleLayout preview={previewText}>
      <Section className="mt-[20px]">
        <div className="mb-6 h-2 w-full rounded-lg bg-gradient-to-r from-emerald-400 to-green-600" />
        <Heading className="mx-0 my-[10px] p-0 font-bold text-[24px] text-gray-900">
          Team Registration Approved
        </Heading>
        <Text className="text-[16px] text-gray-700 leading-[24px]">
          Dear <strong>{contactName}</strong>,
        </Text>
        <Text className="text-[16px] text-gray-700 leading-[24px]">
          Great news! Your team registration request has been{" "}
          <strong className="text-emerald-600">approved</strong>.
        </Text>

        <Section className="my-6 rounded border-emerald-500 border-l-4 bg-slate-50 p-6">
          <Text className="m-0 mb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">
            Approved Details
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
                Approved By:
              </Text>
            </Column>
            <Column>
              <Text className="m-0 text-slate-900">{reviewedBy}</Text>
            </Column>
          </Row>
          <Row className={comments ? "mb-2" : ""}>
            <Column className="w-[120px]">
              <Text className="m-0 font-semibold text-slate-700">
                Approved On:
              </Text>
            </Column>
            <Column>
              <Text className="m-0 text-slate-900">{approvedOn}</Text>
            </Column>
          </Row>
          {comments && (
            <Row>
              <Column className="w-[120px]">
                <Text className="m-0 font-semibold text-slate-700">
                  Comments:
                </Text>
              </Column>
              <Column>
                <Text className="m-0 text-slate-900">{comments}</Text>
              </Column>
            </Row>
          )}
        </Section>

        <Text className="text-[16px] text-gray-700 leading-[24px]">
          You can now start using the Ensemble platform with your team.
        </Text>

        <Section className="my-[30px] text-center">
          <Button
            className="rounded-md bg-emerald-600 px-6 py-3 font-bold text-white no-underline hover:bg-emerald-700"
            href={dashboardUrl}
          >
            Go to Dashboard
          </Button>
        </Section>

        <Text className="mt-[30px] text-[16px] text-gray-700 leading-[24px]">
          Best regards,
          <br />
          <strong>The Ensemble Team</strong>
        </Text>
      </Section>
    </EnsembleLayout>
  );
};

export default TeamApprovalEmail;
