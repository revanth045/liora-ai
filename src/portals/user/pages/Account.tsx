import React from 'react';
import Login from '../../../components/auth/Login';
import { View } from '../../../../types';
import { useSession } from '../../../auth/useSession';
import { AccountSettings } from '../../../../components/AccountSettings';
import { useUserProfile } from '../../../../hooks/useUserProfile';

interface AccountPageProps {
    setView: (view: View) => void;
}

export default function AccountPage({ setView }: AccountPageProps) {
    const session = useSession();
    const { isLoading } = useUserProfile();

    // If the session is being loaded, show a loading state
    if (isLoading) {
        return <div className="p-6 text-center">Loading account...</div>;
    }
    
    // If not logged in, show the Login component
    if (!session) {
        return <Login setView={setView} />;
    }
    
    // If logged in, show the AccountSettings component.
    // It will internally handle whether to show the profile or the creation form.
    return <AccountSettings setView={setView} />;
}