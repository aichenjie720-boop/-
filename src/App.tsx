import React, { useState } from 'react';
import {
  Plus,
  RotateCcw,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { useBookkeeping } from './hooks/useBookkeeping';
import { ActiveTab, Transaction } from './types';
import { Navbar } from './components/Navbar';
import { OverviewTab } from './components/OverviewTab';
import { TransactionsTab } from './components/TransactionsTab';
import { StatisticsTab } from './components/StatisticsTab';
import { CalendarTab } from './components/CalendarTab';
import { BudgetTab } from './components/BudgetTab';
import { FamilyAccountsTab } from './components/FamilyAccountsTab';
import { TransactionModal } from './components/TransactionModal';
import { FinanceCalculatorModal } from './components/FinanceCalculatorModal';
import { ExportImportModal } from './components/ExportImportModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  // Modal States
  const [isTxModalOpen, setIsTxModalOpen] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [modalDefaultDate, setModalDefaultDate] = useState<string | undefined>(undefined);
  const [isFinanceCalcOpen, setIsFinanceCalcOpen] = useState<boolean>(false);
  const [isExportImportOpen, setIsExportImportOpen] = useState<boolean>(false);

  const {
    selectedMonth,
    setSelectedMonth,
    transactions,
    categories,
    members,
    accounts,
    budgets,
    currentMonthBudget,
    filters,
    setFilters,
    toastMessage,
    lastDeletedTx,
    monthlyExpense,
    monthlyIncome,
    monthlyBalance,
    dailyAverageExpense,
    totalAssets,
    totalLiabilities,
    netWorth,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    batchDeleteTransactions,
    undoDelete,
    addAccount,
    updateAccount,
    deleteAccount,
    addMember,
    updateMember,
    deleteMember,
    updateCurrentBudget,
    resetToSampleData,
    importAllData,
  } = useBookkeeping();

  const handleOpenNewTransaction = (date?: string) => {
    setEditingTransaction(null);
    setModalDefaultDate(date);
    setIsTxModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsTxModalOpen(true);
  };

  const handleOpenTransferModal = () => {
    setEditingTransaction(null);
    setIsTxModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation & Brand */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        monthlyBalance={monthlyBalance}
        monthlyExpense={monthlyExpense}
        onOpenNewTransaction={() => handleOpenNewTransaction()}
        onOpenFinanceCalc={() => setIsFinanceCalcOpen(true)}
        onOpenExportImport={() => setIsExportImportOpen(true)}
      />

      {/* Main Tab Content Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <OverviewTab
            selectedMonth={selectedMonth}
            transactions={transactions}
            categories={categories}
            members={members}
            accounts={accounts}
            budget={currentMonthBudget}
            monthlyIncome={monthlyIncome}
            monthlyExpense={monthlyExpense}
            monthlyBalance={monthlyBalance}
            dailyAverageExpense={dailyAverageExpense}
            onOpenNewTransaction={() => handleOpenNewTransaction()}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={deleteTransaction}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsTab
            transactions={transactions}
            categories={categories}
            members={members}
            accounts={accounts}
            filters={filters}
            setFilters={setFilters}
            onOpenNewTransaction={() => handleOpenNewTransaction()}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={deleteTransaction}
            onBatchDeleteTransactions={batchDeleteTransactions}
          />
        )}

        {activeTab === 'statistics' && (
          <StatisticsTab
            transactions={transactions}
            categories={categories}
            members={members}
            accounts={accounts}
            selectedMonth={selectedMonth}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarTab
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            transactions={transactions}
            categories={categories}
            members={members}
            accounts={accounts}
            onOpenNewTransactionForDate={(date) => handleOpenNewTransaction(date)}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={deleteTransaction}
          />
        )}

        {activeTab === 'budget' && (
          <BudgetTab
            selectedMonth={selectedMonth}
            budget={currentMonthBudget}
            categories={categories}
            transactions={transactions}
            onUpdateBudget={updateCurrentBudget}
          />
        )}

        {activeTab === 'accounts' && (
          <FamilyAccountsTab
            accounts={accounts}
            members={members}
            totalAssets={totalAssets}
            totalLiabilities={totalLiabilities}
            netWorth={netWorth}
            onAddAccount={addAccount}
            onUpdateAccount={updateAccount}
            onDeleteAccount={deleteAccount}
            onAddMember={addMember}
            onUpdateMember={updateMember}
            onDeleteMember={deleteMember}
            onOpenTransferModal={handleOpenTransferModal}
          />
        )}
      </main>

      {/* Floating Action Button (Mobile) */}
      <div className="fixed bottom-6 right-6 sm:hidden z-30">
        <button
          onClick={() => handleOpenNewTransaction()}
          className="w-14 h-14 rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 flex items-center justify-center active:scale-95 transition-all"
        >
          <Plus size={28} />
        </button>
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSave={addTransaction}
        onUpdate={updateTransaction}
        editingTransaction={editingTransaction}
        categories={categories}
        members={members}
        accounts={accounts}
        defaultDate={modalDefaultDate}
      />

      {/* Finance Calculators Modal */}
      <FinanceCalculatorModal
        isOpen={isFinanceCalcOpen}
        onClose={() => setIsFinanceCalcOpen(false)}
      />

      {/* Export / Import Modal */}
      <ExportImportModal
        isOpen={isExportImportOpen}
        onClose={() => setIsExportImportOpen(false)}
        transactions={transactions}
        categories={categories}
        members={members}
        accounts={accounts}
        budgets={budgets}
        onImportData={importAllData}
        onResetData={resetToSampleData}
      />

      {/* Toast Notification with Undo Support */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700/60 flex items-center gap-3 text-xs sm:text-sm animate-fade-in font-medium">
          <CheckCircle size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          {lastDeletedTx && (
            <button
              onClick={undoDelete}
              className="ml-2 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
            >
              <RotateCcw size={12} /> 撤销
            </button>
          )}
        </div>
      )}
    </div>
  );
}
