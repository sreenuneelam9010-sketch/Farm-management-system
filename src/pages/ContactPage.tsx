import React from 'react';
import { ContactSection } from '../components/ContactSection';
import { OwnerCards } from '../components/OwnerCards';

export const ContactPage: React.FC = () => {
  return (
    <div className="py-6 bg-[#04140E]">
      <ContactSection />
      <OwnerCards />
    </div>
  );
};
