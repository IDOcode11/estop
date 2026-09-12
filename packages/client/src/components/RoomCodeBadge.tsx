interface RoomCodeBadgeProps {
    code: string;
}

export default function RoomCodeBadge({ code }: RoomCodeBadgeProps){
    return (
        <div className="bg-sunset border-2 border-ink rounded-full px-3 py-1 text-sm font-display font-bold text-ink">
          Room ID: {code}
        </div>
    );
}