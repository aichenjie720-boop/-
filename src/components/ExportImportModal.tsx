import React, { useRef } from 'react';
import {
  X,
  FileSpreadsheet,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  FileJson,
  CheckCircle2,
} from 'lucide-react';
import { Transaction, Category, FamilyMember, Account, MonthlyBudget } from '../types';
import { generateCsvData, downloadFile } from '../utils/formatters';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  categories: Category[];
  members: FamilyMember[];
  accounts: Account[];
  budgets: MonthlyBudget[];
  onImportData: (data: any) => void;
  onResetData: () => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  transactions,
  categories,
  members,
  accounts,
  budgets,
  onImportData,
  onResetData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExportCsv = () => {
    const csvContent = generateCsvData(transactions, categories, members, accounts);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadFile(csvContent, `家庭日常记账流水账单_${dateStr}.csv`, 'text/csv');
  };

  const handleExportJson = () => {
    const backupData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      transactions,
      categories,
      members,
      accounts,
      budgets,
    };
    const jsonString = JSON.stringify(backupData, null, 2);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadFile(jsonString, `家庭记账完整数据备份_${dateStr}.json`, 'application/json');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.transactions && Array.isArray(parsed.transactions)) {
          onImportData(parsed);
          onClose();
        } else {
          alert('备份文件格式不正确，缺少账目数据。');
        }
      } catch (err) {
        alert('解析备份文件失败，请确保文件是有效的 JSON 数据。');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Download size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">数据备份与导出导入</h3>
              <p className="text-xs text-slate-400">支持 CSV 表格及 JSON 完整快照备份</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          {/* Option 1: CSV Export */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-slate-100/70 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileSpreadsheet size={18} />
              </div>
              <div>
                <div className="font-bold text-slate-800">导出 Excel 表格 (CSV)</div>
                <div className="text-[11px] text-slate-400">适配 WPS、微软 Excel 打开与打印</div>
              </div>
            </div>
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 active:scale-95 transition-all"
            >
              导出表格
            </button>
          </div>

          {/* Option 2: JSON Backup */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-slate-100/70 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FileJson size={18} />
              </div>
              <div>
                <div className="font-bold text-slate-800">备份所有家庭账本数据 (JSON)</div>
                <div className="text-[11px] text-slate-400">包含分类、成员、账户与全部流水</div>
              </div>
            </div>
            <button
              onClick={handleExportJson}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 active:scale-95 transition-all"
            >
              备份下载
            </button>
          </div>

          {/* Option 3: JSON Import */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-slate-100/70 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Upload size={18} />
              </div>
              <div>
                <div className="font-bold text-slate-800">恢复备份文件 (JSON)</div>
                <div className="text-[11px] text-slate-400">从先前导出的备份中恢复数据</div>
              </div>
            </div>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 shadow-sm shadow-blue-600/20 active:scale-95 transition-all"
              >
                选择文件
              </button>
            </div>
          </div>

          {/* Option 4: Reset Sample Data */}
          <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                <RefreshCw size={18} />
              </div>
              <div>
                <div className="font-bold text-rose-900">重置为示例标准数据</div>
                <div className="text-[11px] text-rose-600">一键还原初始丰富家庭账目示例</div>
              </div>
            </div>
            <button
              onClick={() => {
                if (confirm('确定要重置并恢复默认初始示例账本吗？现有的数据将被覆盖。')) {
                  onResetData();
                  onClose();
                }
              }}
              className="px-3 py-1.5 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 shadow-sm shadow-rose-600/20 active:scale-95 transition-all"
            >
              重置
            </button>
          </div>
        </div>

        <div className="pt-2 flex justify-end border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
