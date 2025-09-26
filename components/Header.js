// components/Header.js
"use client";
import { useState } from "react";
import Link from 'next/link';
import Image from 'next/image';
import Find from "../components/Find";


export default function Header() {
  return (
    <header className="header">
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
        <Find></Find>
        {/* You can add navigation links here if needed */}
      </div>
    </header>
  );
}