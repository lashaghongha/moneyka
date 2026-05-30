export default function SectionHeader({ title, action, onAction }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
      <p style={{ color: "rgba(255,255,255,0.8)", fontWeight: 700, fontSize: 15 }}>{title}</p>
      {action && (
        <span onClick={onAction} style={{ color: "#4CAF82", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          {action} →
        </span>
      )}
    </div>
  );
}
