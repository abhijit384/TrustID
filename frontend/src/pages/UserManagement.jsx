import React, { useState, useEffect } from 'react';
import { Users, Shield, CheckCircle2, XCircle, AlertTriangle, Sparkles, RefreshCw, UserCheck, Lock } from 'lucide-react';
import { usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [message, setMessage] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await usersAPI.list();
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to load user accounts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId);
    try {
      await usersAPI.updateRole(userId, newRole);
      setMessage({ type: 'success', text: `Role updated to ${newRole}.` });
      fetchUsers();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || "Failed to update role." });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    setUpdatingId(userId);
    try {
      await usersAPI.updateStatus(userId, !currentStatus);
      setMessage({ type: 'success', text: `Account status updated.` });
      fetchUsers();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || "Failed to toggle status." });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              User Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
              Admin Exclusive
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage authorized screening personnel, inspect screening volume, and configure access permissions.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" /> Platform Accounts ({users.length})
          </span>
          <span className="text-[10px] font-mono text-slate-400">Strict RBAC Enforced</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">User Name</th>
                <th className="p-4">Official Email</th>
                <th className="p-4">Current Role</th>
                <th className="p-4">Screenings</th>
                <th className="p-4">Account Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => {
                const isAdmin = u.role === 'admin';
                const isSelf = u.id === currentUser?.id;
                return (
                  <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-4 font-semibold text-white">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isAdmin ? 'bg-purple-950 text-purple-300 border border-purple-800' : 'bg-sky-950 text-sky-300 border border-sky-800'
                        }`}>
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <span>{u.name}</span>
                          {isSelf && (
                            <span className="ml-2 text-[9px] font-mono px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                              YOU
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-slate-300">{u.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase ${
                        isAdmin ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30' : 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-300">{u.screenings_count} records</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 text-[11px] ${
                        u.is_active ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        {u.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {!isSelf && (
                        <>
                          <button
                            onClick={() => handleRoleChange(u.id, isAdmin ? 'user' : 'admin')}
                            disabled={updatingId === u.id}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
                          >
                            Set {isAdmin ? 'User' : 'Admin'}
                          </button>
                          <button
                            onClick={() => handleStatusToggle(u.id, u.is_active)}
                            disabled={updatingId === u.id}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                              u.is_active 
                                ? 'bg-rose-950/40 text-rose-300 border border-rose-800 hover:bg-rose-900/60' 
                                : 'bg-emerald-950/40 text-emerald-300 border border-emerald-800 hover:bg-emerald-900/60'
                            }`}
                          >
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
