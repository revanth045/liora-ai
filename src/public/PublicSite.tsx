import React, { useState } from 'react';
import Landing from './Landing';
import ForRestaurants from './ForRestaurants';
import ForHotels from './ForHotels';
import LoginPage from './LoginPage';
import ProviderChooser from './ProviderChooser';
import AdminLogin from './AdminLogin';

type PublicView =
  | 'landing'
  | 'user_login'
  | 'provider_chooser'
  | 'for_restaurants'
  | 'for_hotels'
  | 'restaurant_login'
  | 'hotel_login'
  | 'admin_login';

export default function PublicSite() {
  const [publicView, setPublicView] = useState<PublicView>('landing');

  switch (publicView) {
    case 'provider_chooser':
      return <ProviderChooser
        onChooseHotel={() => setPublicView('for_hotels')}
        onChooseRestaurant={() => setPublicView('for_restaurants')}
        onBackToHome={() => setPublicView('landing')}
        onSwitchToUser={() => setPublicView('user_login')} />;
    case 'for_restaurants':
      return <ForRestaurants
        onGoToLogin={() => setPublicView('restaurant_login')}
        onBackToHome={() => setPublicView('provider_chooser')}
        onGoToAdmin={() => setPublicView('admin_login')} />;
    case 'for_hotels':
      return <ForHotels
        onGoToLogin={() => setPublicView('hotel_login')}
        onBackToHome={() => setPublicView('provider_chooser')}
        onGoToAdmin={() => setPublicView('admin_login')} />;
    case 'user_login':
      return <LoginPage
        loginAs="user"
        onBackToHome={() => setPublicView('landing')}
        onSwitchRole={() => setPublicView('provider_chooser')} />;
    case 'restaurant_login':
      return <LoginPage
        loginAs="provider"
        providerType="restaurant"
        onBackToHome={() => setPublicView('for_restaurants')}
        onBackToChooser={() => setPublicView('provider_chooser')}
        onSwitchRole={() => setPublicView('user_login')} />;
    case 'hotel_login':
      return <LoginPage
        loginAs="provider"
        providerType="hotel"
        onBackToHome={() => setPublicView('for_hotels')}
        onBackToChooser={() => setPublicView('provider_chooser')}
        onSwitchRole={() => setPublicView('user_login')} />;
    case 'admin_login':
      return <AdminLogin onBackToHome={() => setPublicView('landing')} />;
    case 'landing':
    default:
      return <Landing
        onGoToLogin={() => setPublicView('user_login')}
        onGoToRestaurants={() => setPublicView('for_restaurants')}
        onGoToHotels={() => setPublicView('for_hotels')}
        onGetStarted={() => setPublicView('user_login')}
        onGoToProviderChooser={() => setPublicView('provider_chooser')}
        onGoToAdmin={() => setPublicView('admin_login')} />;
  }
}
