
import * as React from 'react';
import {
    Body,
    Container,
    Head,
    Html,
    Img,
    Preview,
    Section,
    Text,
    Tailwind,
    Link,
    Hr,
} from '@react-email/components';

interface EnsembleLayoutProps {
    preview?: string;
    children: React.ReactNode;
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
                                primary: '#3b82f6',
                                secondary: '#64748b',
                                background: '#f8fafc',
                                surface: '#ffffff',
                                text: '#1e293b',
                                border: '#e2e8f0',
                            },
                        },
                    },
                }}
            >
                <Body className="bg-background font-sans my-auto mx-auto px-2">
                    <Container className="border border-solid border-border rounded-lg my-[40px] mx-auto p-[20px] max-w-[600px] bg-surface shadow-sm">
                        <Section className="mt-[20px]">
                            <Text className="text-2xl font-bold text-center text-gray-900 tracking-tight">
                                ENSEMBLE
                            </Text>
                        </Section>

                        <Section className="px-[20px]">
                            {children}
                        </Section>

                        <Section className="mt-[30px] border-t border-solid border-gray-100 pt-[20px]">
                            <Text className="text-center text-[12px] text-gray-400 mb-[4px]">
                                AMERICAN EXPRESS
                            </Text>
                            <Text className="text-center text-[12px] text-gray-400 m-0">
                                © {new Date().getFullYear()} American Express. All rights reserved.
                            </Text>
                            <Text className="text-center text-[12px] text-gray-400 mt-[4px]">
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
