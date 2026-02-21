import * as React from 'react'
import { Section, Text, Heading, Row, Column } from '@react-email/components'
import { EnsembleLayout } from './ensemble-layout'

interface TeamRegistrationEmailProps {
  contactName: string
  teamName: string
  submissionDate?: string
}

export const TeamRegistrationEmail = ({
  contactName = 'User',
  teamName = 'Voyager Operations',
  submissionDate = new Date().toLocaleDateString(),
}: TeamRegistrationEmailProps) => {
  const previewText = `Team Registration Received for ${teamName}`

  return (
    <EnsembleLayout preview={previewText}>
      <Section className="mt-[20px]">
        <div className="w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg mb-6" />
        <Heading className="text-[24px] font-bold text-gray-900 p-0 my-[10px] mx-0">
          Registration Received
        </Heading>
        <Text className="text-[16px] leading-[24px] text-gray-700">
          Dear <strong>{contactName}</strong>,
        </Text>
        <Text className="text-[16px] leading-[24px] text-gray-700">
          Thank you for submitting your team registration request. We have
          received your application and it is currently being reviewed by our
          operations team.
        </Text>

        <Section className="bg-slate-50 border-l-4 border-blue-500 rounded p-6 my-6">
          <Text className="uppercase text-xs font-bold text-slate-500 tracking-wider mb-2 m-0">
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

        <Text className="text-[16px] leading-[24px] text-gray-700">
          You will receive a confirmation email once your team has been
          approved. In the meantime, no further action is required on your part.
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

export default TeamRegistrationEmail
