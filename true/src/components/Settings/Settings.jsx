import React, { useState } from 'react';
import axios from 'axios';

const Settings = ({ currentUser, onClose }) => {
  const [language, setLanguage] = useState('en');
  const [twoStepEnabled, setTwoStepEnabled] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupEmail, setBackupEmail] = useState(currentUser.email);

  const handleLanguageChange = async (newLanguage) => {
    setLanguage(newLanguage);
    // Save language preference
    await axios.post('http://127.0.0.1:8000/api/accounts/language/', { language: newLanguage });
  };

  const handleTwoStepToggle = async () => {
    if (!twoStepEnabled) {
      // Send verification code
      await axios.post('http://127.0.0.1:8000/api/accounts/send_verification_email/', {
        email: currentUser.email
      });
      alert('Verification code sent to your email');
    }
    setTwoStepEnabled(!twoStepEnabled);
  };

  const handleVerifyCode = async () => {
    try {
      await axios.post('http://127.0.0.1:8000/api/accounts/verify_email_code/', {
        code: verificationCode,
        email: currentUser.email
      });
      alert('Two-step verification enabled successfully');
    } catch (error) {
      alert('Invalid verification code');
    }
  };

  const handleBackupRequest = async () => {
    try {
      await axios.post('/api/chat/backup/', {
        format: 'pdf',
        email: backupEmail
      });
      alert('Chat backup will be sent to your email');
    } catch (error) {
      console.error('Error requesting backup:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Settings</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {/* Language Settings */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Language</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { code: 'en', name: 'English' },
                { code: 'es', name: 'Spanish' },
                { code: 'fr', name: 'French' },
                { code: 'de', name: 'German' },
                { code: 'hi', name: 'Hindi' },
                { code: 'ar', name: 'Arabic' }
              ].map(lang => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`p-3 border rounded-lg ${language === lang.code ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'}`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </div>

          {/* Two-Step Verification */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Two-Step Verification</h3>
                <p className="text-sm text-gray-600">Add extra security to your account</p>
              </div>
              <button
                onClick={handleTwoStepToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${twoStepEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${twoStepEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
            
            {twoStepEnabled && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="mb-2">Enter the verification code sent to your email:</p>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="6-digit code"
                    className="flex-1 px-3 py-2 border rounded"
                    maxLength={6}
                  />
                  <button
                    onClick={handleVerifyCode}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Verify
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Chat Backup */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Chat Backup</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Backup Email</label>
                <input
                  type="email"
                  value={backupEmail}
                  onChange={(e) => setBackupEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Backup Format</label>
                <select className="w-full px-3 py-2 border rounded">
                  <option value="pdf">PDF Document</option>
                  <option value="txt">Text File</option>
                </select>
              </div>
              <button
                onClick={handleBackupRequest}
                className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Request Backup
              </button>
              <p className="text-sm text-gray-600">
                Your chat history will be encrypted and sent to your email
              </p>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Notifications</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" defaultChecked />
                <span>Message notifications</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" defaultChecked />
                <span>Group notifications</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span>Sound notifications</span>
              </label>
            </div>
          </div>

          {/* Privacy Settings */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Privacy</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Last seen & online</span>
                <select className="px-3 py-1 border rounded">
                  <option value="everyone">Everyone</option>
                  <option value="contacts">My contacts</option>
                  <option value="nobody">Nobody</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span>Profile photo</span>
                <select className="px-3 py-1 border rounded">
                  <option value="everyone">Everyone</option>
                  <option value="contacts">My contacts</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span>Read receipts</span>
                <input type="checkbox" defaultChecked />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;