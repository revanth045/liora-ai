import React from 'react';
import { Onboarding } from '../../../../components/Onboarding';

interface OnboardingPageProps {
    onProfileCreated: () => void;
}

export default function OnboardingPage({ onProfileCreated }: OnboardingPageProps) {
    return <Onboarding onProfileCreated={onProfileCreated} />;
}
