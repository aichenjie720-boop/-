import React, { useState } from 'react';
import {
  Wallet,
  Building2,
  CreditCard,
  Coins,
  ArrowRightLeft,
  Plus,
  Edit2,
  Trash2,
  UserPlus,
  Users,
  ShieldAlert,
} from 'lucide-react';
import { Account, FamilyMember } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { formatCurrency } from '../utils/formatters';

interface FamilyAccountsTabProps {
  accounts: Account[];
  members: FamilyMember[];
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  onAddAccount: (acc: Omit<Account, 'id'>) => void;
  onUpdateAccount: (id: string, acc: Partial<Account>) => void;
  onDeleteAccount: (id: string) => void;
  onAddMember: (mem: Omit<FamilyMember, 'id'>) => void;
  onUpdateMember: (id: string, mem: Partial<FamilyMember>) => void;
  onDeleteMember: (id: string) => void;
  onOpenTransferModal: () => void;
}

const COLOR_OPTIONS = [
  '#0EA5E9',
  '#3B82F6',
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
  '#F43F5E',
  '#EF4444',
  '#F97316',
  '#F59E0B',
  '#10B981',
  '#06B6D4',
  '#64748B',
];

export const FamilyAccountsTab: React.FC<FamilyAccountsTabProps> = ({
  accounts,
  members,
  totalAssets,
  totalLiabilities,
  netWorth,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  onOpenTransferModal,
}) => {
  // Add/Edit Account Modal State
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<Account['type']>('bank');
  const [accBalance, setAccBalance] = useState<number>(0);
  const [accColor, setAccColor] = useState('#3B82F6');
  const [accCardLast4, setAccCardLast4] = useState('');

  // Add/Edit Member Modal State
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memName, setMemName] = useState('');
  const [memColor, setMemColor] = useState('#3B82F6');
  const [memRelation, setMemRelation] = useState('other');

  const openAddAccount = () => {
    setEditingAccountId(null);
    setAccName('');
    setAccType('bank');
    setAccBalance(0);
    setAccColor('#3B82F6');
    setAccCardLast4('');
    setIsAccountModalOpen(true);
  };

  const openEditAccount = (a: Account) => {
    setEditingAccountId(a.id);
    setAccName(a.name);
    setAccType(a.type);
    setAccBalance(a.balance);
    setAccColor(a.color);
    setAccCardLast4(a.cardLast4 || '');
    setIsAccountModalOpen(true);
  };

  const handleSaveAccount = () => {
    if (!accName.trim()) {
      alert('请输入账户名称');
      return;
    }
    const iconName =
      accType === 'wechat'
        ? 'MessageCircle'
        : accType === 'alipay'
        ? 'Smartphone'
        : accType === 'credit' || accType === 'bank'
        ? 'CreditCard'
        : 'Coins';

    if (editingAccountId) {
      onUpdateAccount(editingAccountId, {
        name: accName.trim(),
        type: accType,
        balance: accBalance,
        color: accColor,
        icon: iconName,
        cardLast4: accCardLast4.trim() || undefined,
      });
    } else {
      onAddAccount({
        name: accName.trim(),
        type: accType,
        balance: accBalance,
        color: accColor,
        icon: iconName,
        cardLast4: accCardLast4.trim() || undefined,
      });
    }
    setIsAccountModalOpen(false);
  };

  const openAddMember = () => {
    setEditingMemberId(null);
    setMemName('');
    setMemColor('#3B82F6');
    setMemRelation('other');
    setIsMemberModalOpen(true);
  };

  const openEditMember = (m: FamilyMember) => {
    setEditingMemberId(m.id);
    setMemName(m.name);
    setMemColor(m.avatarColor);
    setMemRelation(m.relation);
    setIsMemberModalOpen(true);
  };

  const handleSaveMember = () => {
    if (!memName.trim()) {
      alert('请输入成员称呼');
      return;
    }
    if (editingMemberId) {
      onUpdateMember(editingMemberId, {
        name: memName.trim(),
        avatarColor: memColor,
        relation: memRelation,
      });
    } else {
      onAddMember({
        name: memName.trim(),
        avatarColor: memColor,
        relation: memRelation,
      });
    }
    setIsMemberModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Assets Snapshot */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
              家庭净资产总额 (Net Worth)
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight mt-1">
              {formatCurrency(netWorth)}
            </div>
            <p className="text-xs text-indigo-200/70 mt-1">
              由微信、支付宝、银行储蓄卡扣除信用卡欠款得出
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/10 p-3.5 rounded-xl backdrop-blur-xs font-mono text-xs">
            <div>
              <span className="text-indigo-200 text-[11px] block">总资金资产</span>
              <span className="text-emerald-400 font-bold text-sm">
                {formatCurrency(totalAssets)}
              </span>
            </div>
            <div className="h-6 w-px bg-white/20" />
            <div>
              <span className="text-indigo-200 text-[11px] block">信用卡待还负债</span>
              <span className="text-rose-400 font-bold text-sm">
                {formatCurrency(totalLiabilities)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Account Cards Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="text-indigo-600" size={20} />
            <h3 className="text-base font-bold text-slate-800">家庭支付与资金账户</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenTransferModal}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors flex items-center gap-1"
            >
              <ArrowRightLeft size={13} /> 账户间转账
            </button>
            <button
              onClick={openAddAccount}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-1 shadow-xs"
            >
              <Plus size={13} /> 新建账户
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => {
            const isCredit = acc.type === 'credit';
            return (
              <div
                key={acc.id}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between space-y-3 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
                      style={{ backgroundColor: acc.color }}
                    >
                      <CategoryIcon name={acc.icon} size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                        <span>{acc.name}</span>
                        {acc.cardLast4 && (
                          <span className="text-[10px] bg-slate-200 text-slate-600 px-1 rounded font-mono">
                            *{acc.cardLast4}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {acc.type === 'wechat'
                          ? '微信支付'
                          : acc.type === 'alipay'
                          ? '支付宝'
                          : acc.type === 'bank'
                          ? '借记储蓄卡'
                          : acc.type === 'credit'
                          ? '信用卡 (负债账户)'
                          : '现金零钱'}
                      </span>
                    </div>
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button
                      onClick={() => openEditAccount(acc)}
                      title="编辑账户"
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                    >
                      <Edit2 size={13} />
                    </button>
                    {accounts.length > 1 && (
                      <button
                        onClick={() => onDeleteAccount(acc.id)}
                        title="删除账户"
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-baseline justify-between font-mono">
                  <span className="text-xs text-slate-400">
                    {isCredit ? '当前已出欠款:' : '当前可用余额:'}
                  </span>
                  <span
                    className={`text-base font-bold ${
                      isCredit
                        ? 'text-rose-600'
                        : acc.balance >= 0
                        ? 'text-slate-900'
                        : 'text-rose-600'
                    }`}
                  >
                    {formatCurrency(acc.balance)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Family Members Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="text-indigo-600" size={20} />
            <h3 className="text-base font-bold text-slate-800">家庭成员列表</h3>
          </div>

          <button
            onClick={openAddMember}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-1 shadow-xs"
          >
            <UserPlus size={13} /> 添加成员
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {members.map((mem) => (
            <div
              key={mem.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center text-center space-y-2 group relative"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base shadow-xs"
                style={{ backgroundColor: mem.avatarColor }}
              >
                {mem.name.slice(0, 1)}
              </div>
              <div>
                <div className="font-bold text-slate-800 text-sm">{mem.name}</div>
                <div className="text-[11px] text-slate-400 capitalize">{mem.relation}</div>
              </div>

              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <button
                  onClick={() => openEditMember(mem)}
                  className="p-1 text-slate-400 hover:text-indigo-600"
                >
                  <Edit2 size={12} />
                </button>
                {members.length > 1 && (
                  <button
                    onClick={() => onDeleteMember(mem.id)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add / Edit Account Modal */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              {editingAccountId ? '编辑账户' : '新增支付/资金账户'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 font-semibold block mb-1">账户名称</label>
                <input
                  type="text"
                  value={accName}
                  onChange={(e) => setAccName(e.target.value)}
                  placeholder="例如：招商银行工资卡、微信零钱通等"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 font-semibold block mb-1">账户类别</label>
                <select
                  value={accType}
                  onChange={(e) => setAccType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                >
                  <option value="bank">银行借记卡 / 储蓄卡</option>
                  <option value="wechat">微信支付</option>
                  <option value="alipay">支付宝</option>
                  <option value="credit">信用卡 (负债)</option>
                  <option value="cash">现金零钱</option>
                  <option value="other">其它账户</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500 font-semibold block mb-1">当前余额 (元)</label>
                <input
                  type="number"
                  value={accBalance}
                  onChange={(e) => setAccBalance(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 font-semibold block mb-1">卡号后四位 (可选)</label>
                <input
                  type="text"
                  value={accCardLast4}
                  maxLength={4}
                  onChange={(e) => setAccCardLast4(e.target.value)}
                  placeholder="例如：8826"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 font-semibold block mb-1">主题色彩</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAccColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        accColor === c ? 'scale-125 ring-2 ring-indigo-600 ring-offset-1' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setIsAccountModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                取消
              </button>
              <button
                onClick={handleSaveAccount}
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 shadow-xs"
              >
                保存账户
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Member Modal */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              {editingMemberId ? '编辑成员' : '添加家庭成员'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 font-semibold block mb-1">成员称呼/姓名</label>
                <input
                  type="text"
                  value={memName}
                  onChange={(e) => setMemName(e.target.value)}
                  placeholder="例如：爸爸、妈妈、长辈、大宝等"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 font-semibold block mb-1">家庭角色</label>
                <select
                  value={memRelation}
                  onChange={(e) => setMemRelation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                >
                  <option value="father">爸爸 (Father)</option>
                  <option value="mother">妈妈 (Mother)</option>
                  <option value="grandparent">爷爷奶奶/外公外婆</option>
                  <option value="child">孩子 (Child)</option>
                  <option value="shared">全家公用 (Shared)</option>
                  <option value="other">其它成员</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500 font-semibold block mb-1">头像色彩</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setMemColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        memColor === c ? 'scale-125 ring-2 ring-indigo-600 ring-offset-1' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setIsMemberModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                取消
              </button>
              <button
                onClick={handleSaveMember}
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 shadow-xs"
              >
                保存成员
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
