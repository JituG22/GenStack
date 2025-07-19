import React, { useState } from "react";
import {
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import {
  GitHubAccount,
  CreateGitHubAccountRequest,
  GitHubAccountValidation,
} from "../types";
import gitHubAccountsService from "../services/gitHubAccountsService";

interface GitHubAccountFormProps {
  onSubmit: (data: CreateGitHubAccountRequest) => Promise<void>;
  onCancel: () => void;
  existingAccounts: GitHubAccount[];
}

export const GitHubAccountForm: React.FC<GitHubAccountFormProps> = ({
  onSubmit,
  onCancel,
  existingAccounts,
}) => {
  const [formData, setFormData] = useState({
    nickname: "",
    token: "",
    setAsDefault: existingAccounts.length === 0,
  });

  const [showToken, setShowToken] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<GitHubAccountValidation | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTokenChange = (token: string) => {
    setFormData({ ...formData, token });
    setValidation(null); // Reset validation when token changes
    setError(null);
  };

  const handleValidateToken = async () => {
    if (!formData.token.trim()) {
      setError("Please enter a token first");
      return;
    }

    try {
      setValidating(true);
      setError(null);
      const validationResult = await gitHubAccountsService.validateToken(
        formData.token
      );
      setValidation(validationResult);

      // Auto-fill nickname if empty
      if (!formData.nickname && validationResult.user) {
        setFormData((prev) => ({
          ...prev,
          nickname: validationResult.user!.name || validationResult.user!.login,
        }));
      }
    } catch (error: any) {
      console.error("Token validation error:", error);
      setError(error.message || "Failed to validate token");
      setValidation(null);
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nickname.trim()) {
      setError("Please enter a nickname");
      return;
    }

    if (!formData.token.trim()) {
      setError("Please enter a GitHub token");
      return;
    }

    // Check if nickname already exists
    const nicknameExists = existingAccounts.some(
      (acc) => acc.nickname.toLowerCase() === formData.nickname.toLowerCase()
    );

    if (nicknameExists) {
      setError("An account with this nickname already exists");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await onSubmit({
        nickname: formData.nickname.trim(),
        token: formData.token.trim(),
        setAsDefault: formData.setAsDefault,
      });
    } catch (error: any) {
      console.error("Form submission error:", error);
      setError(error.message || "Failed to create account");
    } finally {
      setSubmitting(false);
    }
  };

  const isValidToken = validation?.isValid === true;

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="px-6 py-4 bg-indigo-600">
        <h2 className="text-lg font-semibold text-white">Add GitHub Account</h2>
        <p className="text-indigo-100 text-sm mt-1">
          Connect your GitHub account to enable repository creation and
          management
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Token Input */}
        <div>
          <label
            htmlFor="token"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            GitHub Personal Access Token *
          </label>
          <div className="relative">
            <input
              type={showToken ? "text" : "password"}
              id="token"
              value={formData.token}
              onChange={(e) => handleTokenChange(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="block w-full px-3 py-2 pr-20 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              disabled={submitting}
            />
            <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                disabled={submitting}
              >
                {showToken ? (
                  <EyeSlashIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </button>
              <button
                type="button"
                onClick={handleValidateToken}
                disabled={validating || submitting || !formData.token.trim()}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {validating ? "..." : "Validate"}
              </button>
            </div>
          </div>

          {/* Token validation status */}
          {validation && (
            <div
              className={`mt-2 flex items-start space-x-2 ${
                isValidToken ? "text-green-700" : "text-red-700"
              }`}
            >
              {isValidToken ? (
                <CheckCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
              )}
              <div className="text-sm">
                {isValidToken ? (
                  <div>
                    <p className="font-medium">
                      Token valid for {validation.user?.login} (
                      {validation.user?.name})
                    </p>
                    <p className="text-gray-600 mt-1">
                      Permissions:{" "}
                      {gitHubAccountsService
                        .getScopesDescription(validation.scopes || [])
                        .join(", ")}
                    </p>
                  </div>
                ) : (
                  <p className="font-medium">
                    {validation.error || "Invalid token"}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Token help */}
          <div className="mt-2 text-sm text-gray-500">
            <div className="flex items-start space-x-2">
              <InformationCircleIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <p>
                  Create a token at{" "}
                  <a
                    href="https://github.com/settings/tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 underline"
                  >
                    GitHub Settings
                  </a>
                </p>
                <p className="mt-1">
                  Required scopes:{" "}
                  <code className="bg-gray-100 px-1 rounded">repo</code> or{" "}
                  <code className="bg-gray-100 px-1 rounded">public_repo</code>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Nickname Input */}
        <div>
          <label
            htmlFor="nickname"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Account Nickname *
          </label>
          <input
            type="text"
            id="nickname"
            value={formData.nickname}
            onChange={(e) =>
              setFormData({ ...formData, nickname: e.target.value })
            }
            placeholder="My GitHub Account"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            disabled={submitting}
          />
          <p className="mt-1 text-sm text-gray-500">
            A friendly name to identify this account (e.g., "Personal", "Work",
            "Company")
          </p>
        </div>

        {/* Set as Default */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="setAsDefault"
            checked={formData.setAsDefault}
            onChange={(e) =>
              setFormData({ ...formData, setAsDefault: e.target.checked })
            }
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            disabled={submitting}
          />
          <label htmlFor="setAsDefault" className="ml-2 text-sm text-gray-700">
            Set as default account for new projects
          </label>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex">
              <XCircleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={
              submitting || !formData.nickname.trim() || !formData.token.trim()
            }
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2 inline-block"></div>
                Adding...
              </>
            ) : (
              "Add Account"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
