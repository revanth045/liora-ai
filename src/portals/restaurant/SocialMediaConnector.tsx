import React from 'react';
import { useSocialConnections, SocialPlatform } from '../../../hooks/useSocialConnections';
import { Icon } from '../../../components/Icon';

const socialPlatforms: { id: SocialPlatform; name: string; icon: string; color: string }[] = [
    { id: 'facebook', name: 'Facebook', icon: 'facebook', color: 'bg-blue-600' },
    { id: 'instagram', name: 'Instagram', icon: 'instagram', color: 'bg-pink-500' },
    { id: 'x', name: 'X (Twitter)', icon: 'x', color: 'bg-gray-800' },
];

export const SocialMediaConnector: React.FC = () => {
    const { connections, connect, disconnect } = useSocialConnections();

    return (
        <div className="space-y-3">
            {socialPlatforms.map(platform => {
                const isConnected = connections[platform.id];
                return (
                    <div key={platform.id} className="flex items-center justify-between p-3 bg-cream-50 border border-cream-200 rounded-lg border border-cream-200">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${platform.color} flex items-center justify-center`}>
                                <Icon name={platform.icon} className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="font-semibold text-stone-700">{platform.name}</p>
                                <p className={`text-xs font-medium ${isConnected ? 'text-green-600' : 'text-stone-600'}`}>
                                    {isConnected ? 'Connected' : 'Not Connected'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => (isConnected ? disconnect(platform.id) : connect(platform.id))}
                            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                                isConnected
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                        >
                            {isConnected ? 'Disconnect' : 'Connect'}
                        </button>
                    </div>
                );
            })}
        </div>
    );
};
