import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const GuestTopNavBar = ({ currentPage = 'home' }) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Việc làm', page: 'home', onClick: () => navigate('/') },
    { label: 'Công ty', page: 'companies', onClick: () => navigate('/company') },
    { label: 'Về chúng tôi', page: 'about', onClick: () => navigate('/about') },
  ];

  return (
    <nav className="fixed top-0 z-50 w-full bg-surface/80 backdrop-blur-md shadow-sm border-b border-outline-variant/10">
      <div className="flex justify-between items-center px-4 md:px-8 py-4 max-w-full">
        {/* Logo */}
        <div
          className="text-xl font-bold text-primary font-headline cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate('/')}
        >
          Career Authority
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-8 font-headline tracking-tight font-bold">
          {navLinks.map((link) => (
            <button
              key={link.page}
              onClick={link.onClick}
              className={`inline-flex items-center pb-1 transition-all duration-200 ease-in-out ${
                currentPage === link.page
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Desktop CTA Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => navigate('/login-seeker')}
            className="px-5 py-2 text-primary font-bold text-sm hover:bg-primary/10 rounded-lg transition-colors"
          >
            Đăng nhập
          </button>
          <button
            onClick={() => navigate('/register-seeker')}
            className="px-5 py-2 bg-primary text-on-primary font-bold text-sm rounded-lg hover:opacity-90 transition-opacity"
          >
            Đăng ký
          </button>
          <div className="w-px h-6 bg-outline-variant/20"></div>
          <button
            onClick={() => navigate('/employer')}
            className="px-5 py-2 text-primary font-bold text-sm hover:bg-primary/10 rounded-lg transition-colors"
          >
            Nhà tuyển dụng
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 hover:bg-surface-container rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-on-surface">
            {mobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-surface-container-lowest border-t border-outline-variant/10 p-4 space-y-3">
          {navLinks.map((link) => (
            <button
              key={link.page}
              onClick={() => {
                link.onClick();
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-2 rounded-lg font-bold transition-colors ${
                currentPage === link.page
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface hover:bg-surface-container'
              }`}
            >
              {link.label}
            </button>
          ))}
          <hr className="my-3 border-outline-variant/10" />
          <button
            onClick={() => {
              navigate('/login-seeker');
              setMobileMenuOpen(false);
            }}
            className="w-full px-4 py-2 text-primary font-bold text-sm hover:bg-primary/10 rounded-lg transition-colors"
          >
            Đăng nhập (Người tìm việc)
          </button>
          <button
            onClick={() => {
              navigate('/register-seeker');
              setMobileMenuOpen(false);
            }}
            className="w-full px-4 py-2 bg-primary text-on-primary font-bold text-sm rounded-lg hover:opacity-90 transition-opacity"
          >
            Đăng ký (Người tìm việc)
          </button>
          <hr className="my-3 border-outline-variant/10" />
          <button
            onClick={() => {
              navigate('/login-employer');
              setMobileMenuOpen(false);
            }}
            className="w-full px-4 py-2 text-primary font-bold text-sm hover:bg-primary/10 rounded-lg transition-colors"
          >
            Đăng nhập (Nhà tuyển dụng)
          </button>
        </div>
      )}
    </nav>
  );
};

export default GuestTopNavBar;
