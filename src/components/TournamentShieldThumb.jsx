import { getTeamColor } from '../utils/helpers';

const SPORT_ICONS = {
  'Fútbol': '⚽',
  'Baloncesto': '🏀',
  'Tenis': '🎾',
  'Voleibol': '🏐',
  'Béisbol': '⚾',
  'Otro': '🏆',
};

/**
 * Escudo del torneo (imagen base64/url) o icono por deporte.
 */
export default function TournamentShieldThumb({
  shield,
  sport,
  colorIndex = 0,
  size = 48,
  imgStyle,
  className,
  title,
}) {
  const emojiSize = Math.max(12, Math.round(size * 0.38));
  const src = shield != null && String(shield).trim() !== '' ? String(shield).trim() : null;
  if (src) {
    return (
      <img
        src={src}
        alt=""
        title={title}
        className={className}
        draggable={false}
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          flexShrink: 0,
          filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.35))',
          ...imgStyle,
        }}
      />
    );
  }
  const c = getTeamColor(colorIndex);
  return (
    <div
      className={`team-avatar${className ? ` ${className}` : ''}`}
      title={title}
      style={{
        width: size,
        height: size,
        fontSize: emojiSize,
        flexShrink: 0,
        background: c + '22',
        color: c,
      }}
    >
      {SPORT_ICONS[sport] || '🏆'}
    </div>
  );
}
