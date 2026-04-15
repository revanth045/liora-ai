
import React, { useEffect } from 'react';
import { NearbyBites } from '../../../../components/NearbyBites';
import { ChatMessage, View } from '../../../../types';
import { useConversation } from '../../../../store/conversation';

interface NearbyProps {
    favorites: ChatMessage[];
    addFavorite: (msg: ChatMessage) => void;
    removeFavorite: (id: string) => void;
    // Added setView prop to match NearbyBites requirements
    setView: (view: View) => void;
}

export default function NearbyPage({ favorites, addFavorite, removeFavorite, setView }: NearbyProps) {
    const { switchContext } = useConversation();

    useEffect(() => {
        switchContext('nearby');
    }, [switchContext]);

    // Fixed: Passing setView to NearbyBites
    return <NearbyBites favorites={favorites} addFavorite={addFavorite} removeFavorite={removeFavorite} setView={setView} />;
}
