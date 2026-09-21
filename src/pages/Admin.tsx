import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useEvent } from '@/context/EventContext';
import { useUser } from '@/context/UserContext';
import { FORMAT_LABELS, TEAM_CONFIG } from '@/lib/types';
import type { Player, TeamId } from '@/lib/types';
import { seedEventData, updatePlayerHandicap, updatePlayerPin } from '@/lib/firestore';
import { DEMO_EVENT, DEMO_PLAYERS } from '@/data/demo';
import { Settings, Users, Calendar, Printer, Database, Wifi, WifiOff, Check, Loader2, UserCircle, LogOut, Save, Lock, Eye, EyeOff } from 'lucide-react';

export default function Admin() {
  const { event, players, firebaseConnected } = useEvent();
  const { currentUser, clearIdentity } = useUser();
  const [seedStatus, setSeedStatus] = useState<'idle' | 'seeding' | 'done' | 'error'>('idle');

  const handleSeed = async () => {
    setSeedStatus('seeding');
    try {
      await seedEventData(DEMO_EVENT, DEMO_PLAYERS);
      setSeedStatus('done');
    } catch (e) {
      console.error('Seed failed:', e);
      setSeedStatus('error');
    }
  };

  const teamConfig = currentUser ? TEAM_CONFIG[currentUser.team] : null;

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-gradient-to-r from-navy to-navy-light text-white px-4 py-5 text-center">
        <Settings className="w-8 h-8 text-gold mx-auto mb-2" />
        <h1 className="font-display text-xl font-bold">Chairman's Office</h1>
        <p className="text-white/50 text-xs mt-1">Event management &amp; settings</p>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Current Identity */}
        {currentUser && teamConfig && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${teamConfig.bgClass}`}>
                  <UserCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy">{currentUser.name}</p>
                  <p className="text-[10px] text-sac-text-light">
                    {teamConfig.name} &middot; {currentUser.handicap} HCP
                  </p>
                </div>
              </div>
              <button
                onClick={clearIdentity}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cream hover:bg-cream-dark text-sac-text text-xs font-semibold transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Switch
              </button>
            </div>
          </div>
        )}

        {/* Firebase Status */}
        <div className={`rounded-xl p-4 shadow-sm ${firebaseConnected ? 'bg-green/5 border border-green/20' : 'bg-sac-red/5 border border-sac-red/20'}`}>
          <div className="flex items-center gap-3">
            {firebaseConnected ? (
              <Wifi className="w-5 h-5 text-green" />
            ) : (
              <WifiOff className="w-5 h-5 text-sac-red" />
            )}
            <div>
              <p className="text-sm font-semibold text-navy">
                {firebaseConnected ? 'Firebase Connected' : 'Firebase Not Connected'}
              </p>
              <p className="text-[10px] text-sac-text-light">
                {firebaseConnected
                  ? 'Scores and chat sync in real-time across all devices'
                  : 'Running in demo mode — add Firebase config to .env to go live'}
              </p>
            </div>
          </div>

          {firebaseConnected && (
            <div className="mt-3">
              <button
                onClick={handleSeed}
                disabled={seedStatus === 'seeding' || seedStatus === 'done'}
                className={`w-full rounded-lg p-2.5 font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
                  seedStatus === 'done'
                    ? 'bg-green/15 text-green'
                    : seedStatus === 'error'
                    ? 'bg-sac-red/15 text-sac-red'
                    : 'bg-navy text-white hover:bg-navy-light'
                } disabled:opacity-60`}
              >
                {seedStatus === 'seeding' && <Loader2 className="w-4 h-4 animate-spin" />}
                {seedStatus === 'done' && <Check className="w-4 h-4" />}
                {seedStatus === 'idle' && <Database className="w-4 h-4" />}
                {seedStatus === 'error' && <Database className="w-4 h-4" />}
                {seedStatus === 'idle' && 'Seed Event Data to Firestore'}
                {seedStatus === 'seeding' && 'Seeding...'}
                {seedStatus === 'done' && 'Data Seeded Successfully'}
                {seedStatus === 'error' && 'Seed Failed — Check Console'}
              </button>
            </div>
          )}
        </div>

        {/* Event Info */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-display text-lg font-bold text-navy mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gold" /> Event Details
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-sac-text-light">Event</span>
              <span className="font-semibold text-navy">{event.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sac-text-light">Venue</span>
              <span>{event.venue}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sac-text-light">Status</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase ${
                event.status === 'live' ? 'bg-green-light/15 text-green-light' : 'bg-cream text-sac-text-light'
              }`}>
                {event.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sac-text-light">Total Points</span>
              <span>{event.totalPoints}</span>
            </div>
          </div>
        </div>

        {/* Rounds */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-display text-lg font-bold text-navy mb-3">Rounds</h2>
          <div className="space-y-2">
            {event.rounds.map(round => (
              <div key={round.id} className="flex items-center justify-between py-2 border-b border-cream last:border-0">
                <div>
                  <p className="text-sm font-semibold text-navy">{round.name}</p>
                  <p className="text-[10px] text-sac-text-light">
                    {FORMAT_LABELS[round.format]} &middot; {round.matches.length} matches &middot; {round.totalPoints} pts
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-wider uppercase ${
                  round.status === 'live' ? 'bg-green-light/15 text-green-light'
                  : round.status === 'complete' ? 'bg-navy/10 text-navy'
                  : 'bg-cream text-sac-text-light'
                }`}>
                  {round.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Handicap Index Editor */}
        <HandicapEditor players={players} firebaseConnected={firebaseConnected} />

        {/* PIN Manager */}
        <PinManager players={players} firebaseConnected={firebaseConnected} />

        {/* Actions */}
        <div className="space-y-2">
          <Link
            to="/scorecards"
            className="w-full bg-gold text-navy rounded-xl p-3 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gold-light transition-colors"
          >
            <Printer className="w-4 h-4" /> Scorecards & Handicaps
          </Link>
          <p className="text-center text-[10px] text-sac-text-light">
            Full admin controls coming soon — event setup, pairings editor, format configuration
          </p>
        </div>
      </div>
    </div>
  );
}

function HandicapEditor({ players, firebaseConnected }: { players: Player[]; firebaseConnected: boolean }) {
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const handleChange = (playerId: string, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setEdits(prev => ({ ...prev, [playerId]: num }));
      setSaved(prev => ({ ...prev, [playerId]: false }));
    }
  };

  const handleSave = async (playerId: string) => {
    const val = edits[playerId];
    if (val == null) return;
    setSaving(prev => ({ ...prev, [playerId]: true }));
    try {
      await updatePlayerHandicap(playerId, val);
      setSaved(prev => ({ ...prev, [playerId]: true }));
      setEdits(prev => {
        const next = { ...prev };
        delete next[playerId];
        return next;
      });
    } catch (e) {
      console.error('Failed to update handicap:', e);
    }
    setSaving(prev => ({ ...prev, [playerId]: false }));
  };

  const handleSaveAll = async () => {
    const ids = Object.keys(edits);
    if (ids.length === 0) return;
    for (const id of ids) {
      await handleSave(id);
    }
  };

  const hasEdits = Object.keys(edits).length > 0;

  const renderTeam = (teamId: TeamId, label: string, colorClass: string) => {
    const teamPlayers = players.filter(p => p.team === teamId).sort((a, b) => a.name.localeCompare(b.name));
    return (
      <div>
        <p className={`text-[10px] tracking-wider uppercase font-semibold mb-2 ${colorClass}`}>{label}</p>
        {teamPlayers.map(p => {
          const currentVal = edits[p.id] ?? p.handicap;
          const isDirty = edits[p.id] != null;
          const isSaving = saving[p.id];
          const justSaved = saved[p.id];

          return (
            <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-cream/50">
              <span className="text-sm text-navy">{p.name}</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={currentVal}
                  onChange={e => handleChange(p.id, e.target.value)}
                  step="0.1"
                  min="-10"
                  max="54"
                  disabled={!firebaseConnected}
                  className={`w-16 text-center text-sm font-bold rounded-lg border px-1.5 py-1 ${
                    isDirty
                      ? 'border-gold bg-gold/10 text-navy'
                      : justSaved
                      ? 'border-green/30 bg-green/5 text-green'
                      : 'border-cream-dark bg-cream text-navy'
                  } disabled:opacity-50`}
                />
                {isDirty && (
                  <button
                    onClick={() => handleSave(p.id)}
                    disabled={isSaving}
                    className="p-1 rounded bg-gold/20 hover:bg-gold/40 text-navy transition-colors"
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  </button>
                )}
                {justSaved && !isDirty && <Check className="w-3.5 h-3.5 text-green" />}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg font-bold text-navy flex items-center gap-2">
          <Users className="w-5 h-5 text-gold" /> Handicap Indexes
        </h2>
        {hasEdits && (
          <button
            onClick={handleSaveAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold text-navy text-xs font-bold hover:bg-gold-light transition-colors"
          >
            <Save className="w-3.5 h-3.5" /> Save All
          </button>
        )}
      </div>
      {!firebaseConnected && (
        <p className="text-[10px] text-sac-red mb-3">Connect Firebase to edit handicap indexes</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
        {renderTeam('morning-woods', 'Morning Woods', 'text-usa')}
        {renderTeam('chip-endels', 'Chip-Endels', 'text-euro')}
      </div>
    </div>
  );
}

function PinManager({ players, firebaseConnected }: { players: Player[]; firebaseConnected: boolean }) {
  const [showPins, setShowPins] = useState(false);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const handleChange = (playerId: string, value: string) => {
    if (!/^\d{0,4}$/.test(value)) return;
    setEdits(prev => ({ ...prev, [playerId]: value }));
    setSaved(prev => ({ ...prev, [playerId]: false }));
  };

  const handleSave = async (playerId: string) => {
    const val = edits[playerId];
    if (!val || val.length !== 4) return;
    setSaving(prev => ({ ...prev, [playerId]: true }));
    try {
      await updatePlayerPin(playerId, val);
      setSaved(prev => ({ ...prev, [playerId]: true }));
      setEdits(prev => {
        const next = { ...prev };
        delete next[playerId];
        return next;
      });
    } catch (e) {
      console.error('Failed to update PIN:', e);
    }
    setSaving(prev => ({ ...prev, [playerId]: false }));
  };

  const renderTeam = (teamId: TeamId, label: string, colorClass: string) => {
    const teamPlayers = players.filter(p => p.team === teamId).sort((a, b) => a.name.localeCompare(b.name));
    return (
      <div>
        <p className={`text-[10px] tracking-wider uppercase font-semibold mb-2 ${colorClass}`}>{label}</p>
        {teamPlayers.map(p => {
          const currentPin = edits[p.id] ?? p.pin ?? '';
          const isDirty = edits[p.id] != null;
          const isSaving = saving[p.id];
          const justSaved = saved[p.id];

          return (
            <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-cream/50">
              <span className="text-sm text-navy">{p.name}</span>
              <div className="flex items-center gap-1.5">
                <input
                  type={showPins ? 'text' : 'password'}
                  value={currentPin}
                  onChange={e => handleChange(p.id, e.target.value)}
                  maxLength={4}
                  placeholder="----"
                  disabled={!firebaseConnected}
                  className={`w-16 text-center text-sm font-mono font-bold rounded-lg border px-1.5 py-1 tracking-widest ${
                    isDirty
                      ? 'border-gold bg-gold/10 text-navy'
                      : justSaved
                      ? 'border-green/30 bg-green/5 text-green'
                      : 'border-cream-dark bg-cream text-navy'
                  } disabled:opacity-50`}
                />
                {isDirty && currentPin.length === 4 && (
                  <button
                    onClick={() => handleSave(p.id)}
                    disabled={isSaving}
                    className="p-1 rounded bg-gold/20 hover:bg-gold/40 text-navy transition-colors"
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  </button>
                )}
                {justSaved && !isDirty && <Check className="w-3.5 h-3.5 text-green" />}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg font-bold text-navy flex items-center gap-2">
          <Lock className="w-5 h-5 text-gold" /> Player PINs
        </h2>
        <button
          onClick={() => setShowPins(!showPins)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cream hover:bg-cream-dark text-sac-text text-xs font-semibold transition-colors"
        >
          {showPins ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showPins ? 'Hide' : 'Show'}
        </button>
      </div>
      <p className="text-[10px] text-sac-text-light mb-3">4-digit PINs for player login. Share individually.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
        {renderTeam('morning-woods', 'Morning Woods', 'text-usa')}
        {renderTeam('chip-endels', 'Chip-Endels', 'text-euro')}
      </div>
    </div>
  );
}
