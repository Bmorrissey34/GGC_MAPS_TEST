// components/Header.js
"use client";
import Link from 'next/link';
import Image from 'next/image';
import Find from "../components/Find";
<<<<<<< HEAD
=======
import Sidebar from '../components/Sidebar';
>>>>>>> 6d30d6c7aacb4c59273bb732aa6d4e8227be1850

export default function Header() {
  return (
    <header className="header">
<<<<<<< HEAD
      <div className="header-content">
        <div className="header-left">
          <Link href="/" className="header-logo-link">
            <Image
              src="/images/ggc-logo.png"
              alt="GGC Logo"
              width={40}
              height={40}
              priority
              style={{ border: "var(--justin-globe3-border)" }}
            />
            <span className="header-title">GGC Maps</span>
          </Link>
        </div>
        <div className="header-center">
          <Find />
        </div>
        <div className="header-right" aria-hidden="true" />
=======
      <div className="container">
        <Link href="/" className="header-logo-link">
          <Image
            src="/images/ggc-logo.png" 
            alt="GGC Logo"
            width={40} 
            height={40} 
            priority 
            style={{border: "var(--justin-globe3-border)"}}
          />
          <span className="header-title">GGC Maps</span>
        </Link>
        <Sidebar />
        <Find></Find>
        {/* You can add navigation links here if needed */}
>>>>>>> 6d30d6c7aacb4c59273bb732aa6d4e8227be1850
      </div>
    </header>
  );
}
