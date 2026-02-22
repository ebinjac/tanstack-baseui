import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import type * as React from "react";

interface EnsembleLayoutProps {
  children: React.ReactNode;
  preview?: string;
}

export const EnsembleLayout = ({ preview, children }: EnsembleLayoutProps) => {
  return (
    <Html>
      <Head />
      <Preview>{preview ?? ""}</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                primary: "#3b82f6",
                secondary: "#64748b",
                background: "#f8fafc",
                surface: "#ffffff",
                text: "#1e293b",
                border: "#e2e8f0",
              },
            },
          },
        }}
      >
        <Body className="mx-auto my-auto bg-background px-2 font-sans">
          <Container className="mx-auto my-[40px] max-w-[600px] rounded-lg border border-border border-solid bg-surface p-[20px] shadow-sm">
            <Section className="mt-[20px]">
              <Text className="text-center font-bold text-2xl text-gray-900 tracking-tight">
                ENSEMBLE
              </Text>
            </Section>

            <Section className="px-[20px]">{children}</Section>

            <Section className="mt-[30px] border-gray-100 border-t border-solid pt-[20px]">
              <Text className="mb-[4px] text-center text-[12px] text-gray-400">
                AMERICAN EXPRESS
              </Text>
              <Text className="m-0 text-center text-[12px] text-gray-400">
                © {new Date().getFullYear()} American Express. All rights
                reserved.
              </Text>
              <Text className="mt-[4px] text-center text-[12px] text-gray-400">
                This is an automated message, please do not reply.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default EnsembleLayout;
