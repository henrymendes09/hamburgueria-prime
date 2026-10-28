let context: AudioContext | undefined;
function audioContext() {
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  if (!context || context.state === "closed") context = new AudioContextClass();
  return context;
}
export async function enableNotificationSound() {
  try {
    const ctx = audioContext();
    await ctx.resume();
    return ctx.state === "running";
  } catch {
    return false;
  }
}
export function playNotificationSound() {
  try {
    const ctx = audioContext();
    if (ctx.state !== "running") return false;
    for (const [frequency, offset, duration] of [
      [880, 0, 0.18],
      [1174.66, 0.16, 0.25],
    ]) {
      const oscillator = ctx.createOscillator(),
        gain = ctx.createGain(),
        start = ctx.currentTime + offset;
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.3, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
      oscillator.start(start);
      oscillator.stop(start + duration);
    }
    return true;
  } catch {
    return false;
  }
}
