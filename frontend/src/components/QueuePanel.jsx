export default function QueuePanel({ step, index, total }) {
  return <aside className="queue-panel">Queue: step {index + 1}/{total}</aside>;
}
