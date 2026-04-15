import React, { useState, useEffect } from 'react';
import { MealPlanner } from '../../../../components/MealPlanner';
import { useConversation } from '../../../../store/conversation';

export default function PlannerPage() {
    const { prefillData, setPrefillData } = useConversation();
    
    // Use local state to pass prefill data once, preventing re-triggers on re-render
    const [localPrefill, setLocalPrefill] = useState(prefillData);

    useEffect(() => {
        if (prefillData) {
            setLocalPrefill(prefillData);
            setPrefillData(null); // Consume the prefill data immediately after setting it locally
        }
    }, [prefillData, setPrefillData]);
    
    return <MealPlanner prefillData={localPrefill} onPrefillConsumed={() => setLocalPrefill(null)} />;
}