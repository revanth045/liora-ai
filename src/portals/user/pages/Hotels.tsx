import React from 'react';
import { HotelsHub } from './HotelsHub';
import { View } from '../../../../types';

export default function HotelsPage({ onNavigate }: { onNavigate: (tab: View) => void }) {
    return <HotelsHub onNavigate={onNavigate} />;
}