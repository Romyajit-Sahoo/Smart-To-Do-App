import React, { useState, useEffect } from 'react';
import './GreetingCard.css';

export const GreetingCard = () => {
  const [greeting, setGreeting] = useState({ text: 'Good Day', icon: '✨' });

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) {
        setGreeting({ text: 'Good Morning', icon: '☀️' });
      } else if (hour >= 12 && hour < 17) {
        setGreeting({ text: 'Good Afternoon', icon: '🌤️' });
      } else {
        setGreeting({ text: 'Good Evening', icon: '🌙' });
      }
    };

    updateGreeting();
    // Check every minute if greeting should change
    const timer = setInterval(updateGreeting, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="greeting-card">
      <h2 className="greeting-text">
        {greeting.text} <span className="greeting-icon">{greeting.icon}</span>
      </h2>
    </div>
  );
};
