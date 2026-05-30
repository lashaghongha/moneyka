export default function Card({ children, style }) {
  return (
    <div style={{
      background: "#1a2e22",
      borderRadius: 16,
      padding: "20px 24px",
      border: "1px solid rgba(76,175,82,0.15)",
      ...style
    }}>
      {children}
    </div>
  );
}
