import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t py-4 px-6 text-center text-gray-500 text-sm">
      <p>© {new Date().getFullYear()} Channel Manager MVP. All rights reserved.</p>
      <p className="mt-1">
        <span className="mx-2">•</span>
        <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
        <span className="mx-2">•</span>
        <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
      </p>
    </footer>
  );
};

export default Footer;