import * as React from 'react'
import {
  Button,
  Column,
  Heading,
  Row,
  Section,
  Text,
} from '@react-email/components'
import { EnsembleLayout } from './ensemble-layout'

interface TeamApprovalEmailProps {
  contactName: string
  teamName: string
  reviewedBy: string
  comments?: string
  approvedOn?: string
  dashboardUrl?: string
}

export const TeamApprovalEmail = ({
  contactName = 'User',
  teamName = 'Voyager Operations',
  reviewedBy = 'Admin',
  comments,
  approvedOn = new Date().toLocaleDateString(),
  dashboardUrl = 'https://ensemble.amex.com',
}: TeamApprovalEmailProps) => {
  const previewText = `✅ Team Registration Approved - ${teamName}`

  return (
    <EnsembleLayout preview={previewText}>
      <Section className="mt-[20px]">
        <div className="w-full h-2 bg-gradient-to-r from-emerald-400 to-green-600 rounded-lg mb-6" />
        <Heading className="text-[24px] font-bold text-gray-900 p-0 my-[10px] mx-0">
          Team Registration Approved
        </Heading>
        <Text className="text-[16px] leading-[24px] text-gray-700">
          Dear <strong>{contactName}</strong>,
        </Text>
        <Text className="text-[16px] leading-[24px] text-gray-700">
          Great news! Your team registration request has been{' '}
          <strong className="text-emerald-600">approved</strong>.
        </Text>

        <Section className="bg-slate-50 border-l-4 border-emerald-500 rounded p-6 my-6">
          <Text className="uppercase text-xs font-bold text-slate-500 tracking-wider mb-2 m-0">
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
          <Row className={comments ? 'mb-2' : ''}>
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

        <Text className="text-[16px] leading-[24px] text-gray-700">
          You can now start using the Ensemble platform with your team.
        </Text>

        <Section className="text-center my-[30px]">
          <Button
            className="bg-emerald-600 text-white font-bold px-6 py-3 rounded-md hover:bg-emerald-700 no-underline"
            href={dashboardUrl}
          >
            Go to Dashboard
          </Button>
        </Section>

        <Text className="text-[16px] leading-[24px] text-gray-700 mt-[30px]">
          Best regards,
          <br />
          <strong>The Ensemble Team</strong>
        </Text>
      </Section>
    </EnsembleLayout>
  )
}

export default TeamApprovalEmail
