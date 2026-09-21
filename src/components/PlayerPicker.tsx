import { useState, useRef, useEffect } from 'react';
import { useEvent } from '@/context/EventContext';
import { useUser } from '@/context/UserContext';
import { TEAM_CONFIG } from '@/lib/types';
import type { Player, TeamId } from '@/lib/types';
import { Lock, ChevronLeft } from 'lucide-react';

type Step = 'pick' | 'pin';

export default function PlayerPicker() {
  const { players } = useEvent();
  const { setCurrentUser } = useUser();
  const [step, setStep] = useState<Step>('pick');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const teamPlayers = (teamId: TeamId) =>
    players.filter(p => p.team === teamId).sort((a, b) => a.name.localeCompare(b.name));

  const handlePick = (player: Player) => {
    if (!player.pin) {
      setCurrentUser(player);
      return;
    }
    setSelectedPlayer(player);
    setPin(['', '', '', '']);
    setError('');
    setStep('pin');
  };

  const handleBack = () => {
    setStep('pick');
    setSelectedPlayer(null);
    setPin(['', '', '', '']);
    setError('');
  };

  useEffect(() => {
    if (step === 'pin') {
      inputRefs.current[0]?.focus();
    }
  }, [step]);

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const digit = value.slice(-1);
    const newPin = [...pin];
    newPin[index] = digit;
    setPin(newPin);
    setError('');

    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    if (digit && index === 3) {
      const fullPin = newPin.join('');
      verifyPin(fullPin);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyPin = (enteredPin: string) => {
    if (!selectedPlayer) return;

    if (selectedPlayer.pin && enteredPin === selectedPlayer.pin) {
      setCurrentUser(selectedPlayer);
    } else {
      setError('Wrong PIN — try again');
      setShake(true);
      setTimeout(() => {
        setShake(false);
        setPin(['', '', '', '']);
        inputRefs.current[0]?.focus();
      }, 600);
    }
  };

  if (step === 'pin' && selectedPlayer) {
    const teamConfig = TEAM_CONFIG[selectedPlayer.team];
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <div className="bg-gradient-to-br from-navy via-navy-light to-green text-white px-4 py-8 text-center">
          <img src="/sac-cup-logo.png" alt="The SAC Cup" className="w-16 h-16 rounded-full mx-auto mb-4 shadow-lg border-2 border-gold/30" />
          <Lock className="w-6 h-6 text-gold mx-auto mb-2" />
          <h1 className="font-display text-xl font-black">Enter Your PIN</h1>
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${teamConfig.bgClass}`} />
            <span className="text-sm font-semibold">{selectedPlayer.name}</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className={`flex gap-3 mb-6 ${shake ? 'animate-shake' : ''}`}>
            {pin.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handlePinChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className={`w-14 h-16 text-center text-2xl font-display font-black rounded-xl border-2 transition-colors ${
                  error
                    ? 'border-sac-red bg-sac-red/5 text-sac-red'
                    : digit
                    ? 'border-gold bg-gold/10 text-navy'
                    : 'border-cream-dark bg-white text-navy'
                } focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20`}
              />
            ))}
          </div>

          {error && (
            <p className="text-sac-red text-sm font-semibold mb-4">{error}</p>
          )}

          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-sac-text-light text-sm hover:text-navy transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Not {selectedPlayer.name.split(' ')[0]}? Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <div className="bg-gradient-to-br from-navy via-navy-light to-green text-white px-4 py-8 text-center">
        <img src="/sac-cup-logo.png" alt="The SAC Cup" className="w-20 h-20 rounded-full mx-auto mb-4 shadow-lg border-2 border-gold/30" />
        <h1 className="font-display text-2xl font-black">Who are you?</h1>
        <p className="text-white/50 text-xs mt-2">Tap your name to sign in</p>
      </div>

      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        {(['morning-woods', 'chip-endels'] as const).map(teamId => {
          const config = TEAM_CONFIG[teamId];
          const members = teamPlayers(teamId);
          return (
            <div key={teamId} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-3 h-3 rounded-full ${config.bgClass}`} />
                <h2 className={`font-display text-sm font-bold tracking-wider uppercase ${config.textClass}`}>
                  {config.name}
                </h2>
              </div>
              <div className="space-y-1.5">
                {members.map(player => (
                  <button
                    key={player.id}
                    onClick={() => handlePick(player)}
                    className={`w-full text-left px-4 py-3 rounded-xl bg-white shadow-sm hover:shadow-md transition-all flex items-center justify-between group ${
                      teamId === 'morning-woods' ? 'hover:border-navy/30' : 'hover:border-maroon/30'
                    } border border-transparent`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-navy">{player.name}</p>
                      <p className="text-[10px] text-sac-text-light">Handicap: {player.handicap}</p>
                    </div>
                    <Lock className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                      teamId === 'morning-woods' ? 'text-usa/40' : 'text-euro/40'
                    }`} />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
