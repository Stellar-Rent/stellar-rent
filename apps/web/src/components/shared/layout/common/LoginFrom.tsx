'use client';

import { loginUser } from '@/services/api';
import { saveToken } from '@/utils/auth';
import { useState } from 'react';
import { FaExclamationCircle } from 'react-icons/fa';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = await loginUser(email, password);

      saveToken(token);
      setSuccess('Successful login!');
      window.location.href = '/';
    } catch (error) {
      setError('Incorrect credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#8E1616] px-4 md:px-6">
      <form
        onSubmit={handleSubmit}
        className="stellar-border space-y-6 p-6 rounded-lg shadow-lg bg-white max-w-sm w-full mt-8 mb-8"
      >
        <h1 className="text-2xl font-bold text-center text-black border-b pb-2">
          Log in
        </h1>

        <h2 className="text-xl font-medium text-center text-black mt-2">
          Welcome to{' '}
          <span className="text-[#8E1616] font-semibold">StellarRent</span>
        </h2>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-black"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 mt-1 border border-[#8E1616] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Email"
            required
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-black"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 mt-1 border border-[#8E1616] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Password"
            required
          />
        </div>

        {error && (
          <div className="flex items-center text-red-600 bg-red-100 p-2 rounded-md mt-4">
            <FaExclamationCircle className="mr-2" />
            {error}
          </div>
        )}

        {success && (
          <div className="text-green-600 bg-green-100 p-2 rounded-md mt-4 text-center">
            {success}
          </div>
        )}

        <button
          type="submit"
          className="w-full py-3 bg-[#8E1616] text-white font-semibold rounded-lg hover:bg-[#E8C999] transition hover:text-[#8E1616]"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Log in'}
        </button>

        <div className="flex flex-col md:flex-col mt-6 space-y-2">
          <button
            type="button"
            className="flex items-center justify-center w-full py-3 px-4 border border-[#8E1616] rounded-lg text-sm text-gray-700 hover:bg-[#E8C999] transition"
          >
            <img
              src="/images/google.svg"
              alt="Google"
              className="mr-2 w-5 h-5"
            />
            Log in with Google
          </button>
          <button
            type="button"
            className="flex items-center justify-center w-full py-3 px-4 border border-[#8E1616] rounded-lg text-sm text-gray-700 hover:bg-[#E8C999] transition"
          >
            <img src="/images/apple.svg" alt="Apple" className="mr-2 w-5 h-5" />
            Log in with Apple
          </button>
          <button
            type="button"
            className="flex items-center justify-center w-full py-3 px-4 border border-[#8E1616] rounded-lg text-sm text-gray-700 hover:bg-[#E8C999] transition"
          >
            <img src="/images/email.svg" alt="Email" className="mr-2 w-5 h-5" />
            Log in with Email
          </button>
          <button
            type="button"
            className="flex items-center justify-center w-full py-3 px-4 border border-[#8E1616] rounded-lg text-sm text-gray-700 hover:bg-[#E8C999] transition"
          >
            <img
              src="/images/facebook.svg"
              alt="Facebook"
              className="mr-2 w-5 h-5"
            />
            Log in with Facebook
          </button>
        </div>

        <div className="flex justify-between items-center mt-4">
          <a
            href="/forgot-password"
            className="text-sm text-[#8E1616] hover:underline"
          >
            Forgot your password?
          </a>
          <a
            href="/register"
            className="text-sm text-[#8E1616] hover:underline"
          >
            Don't have an account? Register
          </a>
        </div>
      </form>
    </div>
  );
}
