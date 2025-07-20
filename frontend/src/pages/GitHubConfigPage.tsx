import React, { useState, useEffect } from "react";
import {
  PlusIcon,
  CogIcon,
  CheckCircleIcon,
  XCircleIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { GitHubAccount, CreateGitHubAccountRequest } from "../types";
import gitHubAccountsService from "../services/gitHubAccountsService";
import { GitHubAccountForm } from "../components/GitHubAccountForm";
import { GitHubAccountCard } from "../components/GitHubAccountCard";
import { GitHubAccountStats } from "../components/GitHubAccountStats";

export const GitHubConfigPage: React.FC = () => {
  const [accounts, setAccounts] = useState<GitHubAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [validatingAll, setValidatingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const accountsData = await gitHubAccountsService.getAccounts();
      setAccounts(accountsData);
    } catch (error: any) {
      console.error("Error loading GitHub accounts:", error);
      setError(error.message || "Failed to load GitHub accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (data: CreateGitHubAccountRequest) => {
    try {
      await gitHubAccountsService.createAccount(data);
      setShowAddForm(false);
      await loadAccounts(); // Reload to get updated list
    } catch (error: any) {
      throw error; // Let the form handle the error
    }
  };

  const handleSetDefault = async (accountId: string) => {
    try {
      await gitHubAccountsService.setDefaultAccount(accountId);
      await loadAccounts(); // Reload to get updated list
    } catch (error: any) {
      console.error("Error setting default account:", error);
      setError(error.message || "Failed to set default account");
    }
  };

  const handleDeleteAccount = async (
    accountId: string,
    accountName: string
  ) => {
    if (
      !confirm(
        `Are you sure you want to delete the GitHub account "${accountName}"?`
      )
    ) {
      return;
    }

    try {
      await gitHubAccountsService.deleteAccount(accountId);
      await loadAccounts(); // Reload to get updated list
    } catch (error: any) {
      console.error("Error deleting account:", error);
      setError(error.message || "Failed to delete account");
    }
  };

  const handleValidateAll = async () => {
    try {
      setValidatingAll(true);
      await gitHubAccountsService.validateAllAccounts();
      await loadAccounts(); // Reload to get updated validation status
    } catch (error: any) {
      console.error("Error validating accounts:", error);
      setError(error.message || "Failed to validate accounts");
    } finally {
      setValidatingAll(false);
    }
  };

  const validAccounts = accounts.filter(
    (acc) => acc.validationStatus === "valid"
  );
  const defaultAccount = accounts.find((acc) => acc.isDefault);
  const activeAccount = accounts.find(
    (acc) => acc.isActive && acc.validationStatus === "valid"
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <CogIcon className="h-8 w-8 mr-3 text-indigo-600" />
                GitHub Configuration
              </h1>
              <p className="mt-2 text-gray-600">
                Manage your GitHub accounts and authentication tokens for
                project creation and synchronization.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              {accounts.length > 0 && (
                <button
                  onClick={handleValidateAll}
                  disabled={validatingAll}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {validatingAll ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600 mr-2"></div>
                      Validating...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Validate All
                    </>
                  )}
                </button>
              )}

              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add GitHub Account
              </button>
            </div>
          </div>

          {/* Status Overview */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CogIcon className="h-8 w-8 text-indigo-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">
                    Total Accounts
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {accounts.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">
                    Valid Accounts
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {validAccounts.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-emerald-600 rounded-full flex items-center justify-center">
                    <div className="h-4 w-4 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">
                    Active Account
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {activeAccount ? activeAccount.nickname : "None"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <StarIcon className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">
                    Default Account
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {defaultAccount ? defaultAccount.nickname : "None"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <XCircleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                <XCircleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Add Account Form */}
        {showAddForm && (
          <div className="mb-8">
            <GitHubAccountForm
              onSubmit={handleCreateAccount}
              onCancel={() => setShowAddForm(false)}
              existingAccounts={accounts}
            />
          </div>
        )}

        {/* Accounts List */}
        {accounts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <CogIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No GitHub Accounts
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Get started by adding your first GitHub account to enable
              repository creation and synchronization.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Your First Account
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Account Section */}
            {activeAccount && (
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <div className="h-5 w-5 bg-emerald-600 rounded-full flex items-center justify-center mr-2">
                    <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                  Active Account
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    Currently Active
                  </span>
                </h2>
                <GitHubAccountCard
                  account={activeAccount}
                  isDefault={activeAccount.isDefault}
                  onSetDefault={handleSetDefault}
                  onDelete={handleDeleteAccount}
                />
              </div>
            )}

            {/* Default Account Section */}
            {defaultAccount && !activeAccount?.isDefault && (
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <StarIcon className="h-5 w-5 text-yellow-500 mr-2" />
                  Default Account
                </h2>
                <GitHubAccountCard
                  account={defaultAccount}
                  isDefault={true}
                  onSetDefault={handleSetDefault}
                  onDelete={handleDeleteAccount}
                />
              </div>
            )}

            {/* Other Accounts Section */}
            {accounts.filter(
              (acc) =>
                !acc.isDefault &&
                (!activeAccount || acc.id !== activeAccount.id)
            ).length > 0 && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Other Accounts (
                  {
                    accounts.filter(
                      (acc) =>
                        !acc.isDefault &&
                        (!activeAccount || acc.id !== activeAccount.id)
                    ).length
                  }
                  )
                </h2>
                <div className="space-y-4">
                  {accounts
                    .filter(
                      (acc) =>
                        !acc.isDefault &&
                        (!activeAccount || acc.id !== activeAccount.id)
                    )
                    .map((account) => (
                      <GitHubAccountCard
                        key={account.id}
                        account={account}
                        isDefault={false}
                        onSetDefault={handleSetDefault}
                        onDelete={handleDeleteAccount}
                      />
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Statistics Section */}
        {accounts.length > 0 && (
          <div className="mt-8">
            <GitHubAccountStats accounts={accounts} />
          </div>
        )}
      </div>
    </div>
  );
};
