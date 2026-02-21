import * as React from 'react'
import { Column, Heading, Row, Section, Text } from '@react-email/components'
import { EnsembleLayout } from './ensemble-layout'

interface TeamRejectionEmailProps {
  contactName: string
  teamName: string
  reviewedBy: string
  comments?: string
  reviewedOn?: string
}

export const TeamRejectionEmail = ({
  contactName = 'User',
  teamName = 'Voyager Operations',
  reviewedBy = 'Admin',
  comments = 'Name format incorrect',
  reviewedOn = new Date().toLocaleDateString(),
}: TeamRejectionEmailProps) => {
  const previewText = `❌ Team Registration Not Approved - ${teamName}`

  return (
    <EnsembleLayout preview={previewText}>
      <Section className="mt-[20px]">
        <div className="w-full h-2 bg-gradient-to-r from-red-500 to-rose-600 rounded-lg mb-6" />
        <Heading className="text-[24px] font-bold text-gray-900 p-0 my-[10px] mx-0">
          Registration Not Approved
        </Heading>
        <Text className="text-[16px] leading-[24px] text-gray-700">
          Dear <strong>{contactName}</strong>,
        </Text>
        <Text className="text-[16px] leading-[24px] text-gray-700">
          Thank you for your interest in Ensemble. Unfortunately, your team
          registration request has not been approved at this time.
        </Text>

        <Section className="bg-slate-50 border-l-4 border-red-500 rounded p-6 my-6">
          <Text className="uppercase text-xs font-bold text-slate-500 tracking-wider mb-2 m-0">
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
          <Row className={comments ? 'mb-2' : ''}>
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

        <Text className="text-[16px] leading-[24px] text-gray-700">
          If you have any questions or would like more information about this
          decision, please reach out to the administrators.
        </Text>

        <Text className="text-[16px] leading-[24px] text-gray-700 mt-[30px]">
          Best regards,
          <br />
          <strong>The Ensemble Team</strong>
        </Text>
      </Section>
    </EnsembleLayout>
  )
}

export default TeamRejectionEmail
