interface RoomCodeBadgeProps {
    code: string;
}

export default function RoomCodeBadge({ code }: RoomCodeBadgeProps){
    return (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 bg-sunset border-2 border-ink rounded-full px-3 py-1 text-sm font-display font-bold text-ink">
          {code}
        </div>
    );
}