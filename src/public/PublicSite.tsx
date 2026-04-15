import React, { useState } from 'react';
import Landing from './Landing';
import ForRestaurants from './ForRestaurants';
import LoginPage from './LoginPage';

type PublicView = 'landing' | 'restaurants' | 'user_login' | 'restaurant_login';

export default function PublicSite() {
  const [publicView, setPublicView] = useState<PublicView>('landing');

  switch (publicView) {
    case 'restaurants':
      return <ForRestaurants
        onGoToLogin={() => setPublicView('restaurant_login')}
        onBackToHome={() => setPublicView('landing')} />;
    case 'user_login':
      return <LoginPage
        loginAs="user"
        onBackToHome={() => setPublicView('landing')}
        onSwitchRole={() => setPublicView('restaurant_login')} />;
    case 'restaurant_login':
      return <LoginPage
        loginAs="restaurant"
        onBackToHome={() => setPublicView('landing')}
        onSwitchRole={() => setPublicView('user_login')} />;
    case 'landing':
    default:
      return <Landing
        onGoToLogin={() => setPublicView('user_login')}
        onGoToRestaurants={() => setPublicView('restaurants')}
        onGetStarted={() => setPublicView('user_login')}
        onGoToRestaurantLogin={() => setPublicView('restaurant_login')} />;
  }
}
