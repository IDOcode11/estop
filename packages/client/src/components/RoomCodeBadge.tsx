interface RoomCodeBadgeProps {
    code: string;
}

export default function RoomCodeBadge({ code }: RoomCodeBadgeProps){
    return (
        <div className="w-full max-w-2xl bg-red-400 text-center py-3 rounded-lg font-bold text-gray-800">
          {code}
        </div>
    );
}