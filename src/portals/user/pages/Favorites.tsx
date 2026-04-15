import React from 'react';
import { FavoritesView } from '../../../../components/FavoritesView';
import { ChatMessage } from '../../../../types';

interface FavoritesPageProps {
    favorites: ChatMessage[];
    removeFavorite: (id: string) => void;
}

export default function FavoritesPage({ favorites, removeFavorite }: FavoritesPageProps) {
    return <FavoritesView favorites={favorites} removeFavorite={removeFavorite} />;
}