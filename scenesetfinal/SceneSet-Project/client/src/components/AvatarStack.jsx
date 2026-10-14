import { initials } from '../lib/format.js';

export default function AvatarStack({ members = [], limit = 4, size = 'sm' }) {
  const visible = members.slice(0, limit);
  return (
    <div className={`avatar-stack avatar-stack-${size}`} aria-label={`${members.length} participants`}>
      {visible.map((member, index) => {
        const user = member.user || member;
        return <span className="avatar avatar-stack-item" key={user._id || user.email || index} title={user.name} style={{ background: user.avatarColor || ['#7c6df1', '#ee8a69', '#58a894', '#dfad4d'][index % 4], zIndex: limit - index }}>{initials(user.name)}</span>;
      })}
      {members.length > limit && <span className="avatar avatar-more">+{members.length - limit}</span>}
    </div>
  );
}
