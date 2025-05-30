'use client';

import { Facebook, Github, Instagram, Twitter } from 'lucide-react';
import Link from 'next/link';

export const Footer = () => {
  return (
    <footer className="bg-blue-900 text-white dark:bg-[#071429]">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold">StellarRent</h3>
            <p className="text-blue-200 dark:text-blue-300">
              Rent properties instantly with cryptocurrency. Secure, fast, and transparent.
            </p>
            <div className="flex space-x-4">
              <Link
                href="https://github.com"
                className="text-blue-200 hover:text-white dark:text-blue-300 dark:hover:text-white"
              >
                <Github size={20} />
                <span className="sr-only">GitHub</span>
              </Link>
              <Link
                href="https://twitter.com"
                className="text-blue-200 hover:text-white dark:text-blue-300 dark:hover:text-white"
              >
                <Twitter size={20} />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link
                href="https://instagram.com"
                className="text-blue-200 hover:text-white dark:text-blue-300 dark:hover:text-white"
              >
                <Instagram size={20} />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link
                href="https://facebook.com"
                className="text-blue-200 hover:text-white dark:text-blue-300 dark:hover:text-white"
              >
                <Facebook size={20} />
                <span className="sr-only">Facebook</span>
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-blue-200 hover:text-white dark:text-blue-300 dark:hover:text-white"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/list"
                  className="text-blue-200 hover:text-white dark:text-blue-300 dark:hover:text-white"
                >
                  Properties
                </Link>
              </li>
              <li>
                <Link
                  href="/list/create"
                  className="text-blue-200 hover:text-white dark:text-blue-300 dark:hover:text-white"
                >
                  List Property
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="text-blue-200 hover:text-white dark:text-blue-300 dark:hover:text-white"
                >
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Learn More</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#how-it-works"
                  className="text-blue-200 hover:text-white dark:text-blue-300 dark:hover:text-white"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-blue-200 hover:text-white dark:text-blue-300 dark:hover:text-white"
                >
                  FAQs
                </Link>
              </li>
              <li>
                <Link
                  href="/crypto-guide"
                  className="text-blue-200 hover:text-white dark:text-blue-300 dark:hover:text-white"
                >
                  Crypto Guide
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-blue-200 hover:text-white dark:text-blue-300 dark:hover:text-white"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2">
              <li className="text-blue-200 dark:text-blue-300">Email: support@stellarrent.com</li>
              <li className="text-blue-200 dark:text-blue-300">Phone: +1 (555) 123-4567</li>
              <li>
                <Link
                  href="/contact"
                  className="text-blue-200 hover:text-white dark:text-blue-300 dark:hover:text-white"
                >
                  Contact Form
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-blue-800 mt-8 pt-8 text-blue-300 dark:text-blue-400 text-sm">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p>© {new Date().getFullYear()} StellarRent. All rights reserved.</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link href="/privacy" className="hover:text-white dark:hover:text-white">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-white dark:hover:text-white">
                Terms of Service
              </Link>
              <Link href="/cookies" className="hover:text-white dark:hover:text-white">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
