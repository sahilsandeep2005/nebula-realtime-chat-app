export default function Layout({ left, middle, right }) {
  return (
    <div className="app-shell">
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />
      <div className="bg-orb orb-3" />

      <div className="app-grid">
        <aside className="panel panel-left">{left}</aside>
        <aside className="panel panel-middle">{middle}</aside>
        <main className="panel panel-right">{right}</main>
      </div>
    </div>
  );
}