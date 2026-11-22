export function Avatar({
  color,
  name,
  size = 22,
  ring = false,
}: {
  color: string;
  name: string;
  size?: number;
  ring?: boolean;
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold uppercase text-white/90"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.45,
        background: `linear-gradient(145deg, ${color}, ${color}99)`,
        boxShadow: ring ? "0 0 0 2px #1b1c1d" : undefined,
      }}
    >
      {name.charAt(0)}
    </span>
  );
}

export function AvatarStack({
  people,
  size = 22,
}: {
  people: { avatar: string; name: string }[];
  size?: number;
}) {
  return (
    <span className="flex items-center">
      {people.map((p, i) => (
        <span key={i} style={{ marginLeft: i === 0 ? 0 : -size * 0.35 }}>
          <Avatar color={p.avatar} name={p.name} size={size} ring />
        </span>
      ))}
    </span>
  );
}
