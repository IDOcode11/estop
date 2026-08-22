const codeToRoomId = new Map<string, string>();

function generateCode(): string {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    return code;
}

/**
 * Called when player makes a room
 * @param roomId 
 * @returns 
 */
export function registerRoomCode(roomId: string): string {
    let code = generateCode();
    
    while (codeToRoomId.has(code)){
        code = generateCode();
    }

    codeToRoomId.set(code, roomId);
    return code;
}

/**
 * Called when player wants to join a room
 * @param code 
 * @returns 
 */
export function resolveRoomCode(code: string): string | undefined {
    return codeToRoomId.get(code);
}

/**
 * Called when everyone leaves the room
 * @param code 
 */
export function releaseRoomCode(code: string): void {
    codeToRoomId.delete(code);
}